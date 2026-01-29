import { GoogleGenAI } from "@google/genai";
// actually @google/genai has .files.
import fs from "fs";
import path from "path";
import os from "os";

export const maxDuration = 300; // Max execution time for Vercel (Pro plan, but safeguard added for Hobby)

// Move initialization inside handler to ensure env vars are ready
// const ai = new GoogleGenAI({ ... });

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[v0] Google API key is missing");
      return Response.json(
        {
          error:
            "GOOGLE_API_KEY eksik. Lütfen ortam değişkenlerini kontrol edin.",
        },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { modelImage, prompt, duration, motion, style } = await req.json();

    if (!modelImage) {
      return Response.json(
        { error: "Manken resmi gereklidir" },
        { status: 400 },
      );
    }
    // API Key check moved up

    console.log("[v0] Starting video generation with Google Veo...");

    // Prepare the image data
    let imageData = modelImage;
    if (imageData.startsWith("data:")) {
      const base64Match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Match) {
        imageData = base64Match[2];
      }
    }

    // Step 1: Analyze the model image to ensure absolute consistency
    console.log("[v0] Analyzing model image for consistency...");
    let modelDescription = "";
    try {
      const visionPrompt = `Analyze this fashion photo in extreme detail. Describe:
1. Physical characteristics of the model: face, features, skin tone, hair color/style.
2. Exact clothing: describe the attire including fabric, cut, color, and unique patterns.
3. Pose and lighting.
Provide a comprehensive description so this EXACT subject and outfit can be recreated in motion.`;

      const visionResult = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: visionPrompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: imageData,
                },
              },
            ],
          },
        ],
      });

      modelDescription = visionResult.text || "";
      console.log("[v0] Vision analysis complete.");
    } catch (visionError) {
      console.error("[v0] Vision analysis failed, falling back:", visionError);
    }

    // Build the video generation prompt
    const fullPrompt = `STRICT VISUAL CONSISTENCY: The video MUST feature the EXACT subject and outfit described below. 
DO NOT change the model's face, hair, or clothing details.

SUBJECT DETAILS:
${modelDescription || "A professional fashion model showcasing outfit."}

VIDEO ACTION: 
${prompt || "The model showcases the clothing with smooth, natural movements"}.

PHOTOGRAPHY SETTINGS:
${style ? `Style: ${style}.` : ""} ${
      motion ? `Camera motion: ${motion}.` : ""
    } Professional studio lighting, cinematic quality, high-end fashion photography. Smooth and elegant movement.`;

    console.log("[v0] Veo prompt:", fullPrompt);

    try {
      // 1. Upload Input Image to Gemini Files API
      console.log("[v0] Uploading image to Gemini Files...");

      const tempFilePath = path.resolve(
        os.tmpdir(),
        `veo_input_${Date.now()}.png`,
      );

      await fs.promises.writeFile(
        tempFilePath,
        Buffer.from(imageData, "base64"),
      );

      let fileUri: string;
      try {
        const uploadResult = await ai.files.upload({
          file: tempFilePath,
          config: {
            mimeType: "image/png",
          },
        });

        // Use as any to avoid strict type issues with SDK/Response mismatch
        fileUri = (uploadResult as any).file?.uri || (uploadResult as any).uri;
        console.log("[v0] Image uploaded successfully:", fileUri);
      } catch (uploadError: any) {
        console.error("[v0] Upload to Gemini Files failed:", uploadError);
        // On local, if this fails with 'fetch failed', it's often an IPv6 issue.
        const detail = uploadError.message?.includes("fetch failed")
          ? "Network error (fetch failed). This may be a local connection issue."
          : uploadError.message;
        throw new Error(`Image upload failed: ${detail}`);
      } finally {
        try {
          if (fs.existsSync(tempFilePath)) {
            await fs.promises.unlink(tempFilePath);
          }
        } catch (cleanupError) {
          console.error("Temp cleanup warning:", cleanupError);
        }
      }

      if (!fileUri) throw new Error("Dosya yükleme başarısız oldu (URI eksik)");

      // 2. Initiate Video Generation
      console.log("[v0] Starting Veo generation...");

      // Retry loop for the initial request (handling Quota/429 on start)
      let initialResponse: any = null;
      let attempts = 0;
      const MAX_RETRIES = 3;

      while (attempts < MAX_RETRIES) {
        try {
          attempts++;
          // cast to any to avoid TypeScript complaints
          initialResponse = await (ai.models as any).generateVideos({
            model: "veo-3.1-generate-preview",
            prompt: fullPrompt,
            image_uri: fileUri,
            config: {
              aspectRatio: "16:9",
              resolution: "720p",
            },
          });
          // If successful, break the loop
          break;
        } catch (startError: any) {
          const errMsg = startError?.message || "";
          if (
            (startError.status === 429 || errMsg.includes("quota")) &&
            attempts < MAX_RETRIES
          ) {
            console.warn(
              `[v0] Initial quota exceeded (Attempt ${attempts}). Waiting 30s...`,
            );
            await new Promise((r) => setTimeout(r, 30000)); // Wait 30s
            continue;
          }
          // If other error or max retries reached, throw
          throw startError;
        }
      }

      console.log("[v0] Initial response received");

      // Handle null response
      if (!initialResponse) {
        throw new Error("API boş yanıt döndürdü");
      }

      // Check different possible locations for operation name
      // SDK might return the Operation object directly, or a wrapper
      let operationName =
        initialResponse.name ||
        (initialResponse as any).operation?.name ||
        (initialResponse as any).metadata?.name;

      // If still missing, check if it's inside a 'response' property (common in Google Client libraries)
      if (!operationName && (initialResponse as any).response) {
        operationName = (initialResponse as any).response.name;
      }

      if (!operationName) {
        console.error(
          "[v0] Unexpected response structure (No Name):",
          JSON.stringify(initialResponse, null, 2),
        );

        // Fallback: Check if video was generated synchronously (unlikely for Veo but good safety)
        if (
          initialResponse.generatedVideos &&
          initialResponse.generatedVideos.length > 0
        ) {
          console.log("[v0] Video generated synchronously!");
          const vid = initialResponse.generatedVideos[0];
          const bytes = vid.videoBytes || vid.data || vid.video?.videoBytes;
          if (bytes) {
            return Response.json({
              video: `data:video/mp4;base64,${bytes}`,
              videoName: `stylescape-video-${Date.now()}.mp4`,
            });
          }
        }

        throw new Error("API yanıtında işlem adı (operation name) bulunamadı.");
      }

      console.log(`[v0] Operation started: ${operationName}`);

      // 2. Poll for Completion with Backoff and Error Handling
      const startTime = Date.now();
      const MAX_POLL_TIME = 250000; // 250 seconds total (Safeguard will catch it earlier)
      const VERCEL_SAFEGUARD_TIMEOUT = 55000; // 55 seconds (Return JSON before Vercel 60s kill)
      const POLLING_INTERVAL = 15000; // 15 seconds (Veo is slow, save quota)

      while (Date.now() - startTime < MAX_POLL_TIME) {
        // Vercel Safeguard: If we are close to the 60s limit (typical for Hobby plans), return a JSON error
        // instead of letting Vercel timeout with a 504 HTML page.
        if (Date.now() - startTime > VERCEL_SAFEGUARD_TIMEOUT) {
          console.warn(
            "[v0] Vercel safeguard timeout reached. Returning JSON error.",
          );
          return Response.json(
            {
              error:
                "Video generation is taking longer than expected. Please try again in 1-2 minutes.",
              isTimeout: true,
              operationName: operationName,
            },
            { status: 504 },
          );
        }

        await new Promise((r) => setTimeout(r, POLLING_INTERVAL));

        try {
          // Poll the operation status
          const opStatus = await (
            ai.operations as any
          ).getVideosOperationInternal({
            operationName: operationName,
          });

          if (opStatus.done) {
            console.log("[v0] Operation completed!");

            if (opStatus.error) {
              console.error(
                "[v0] Operation failed with error:",
                opStatus.error,
              );
              throw new Error(
                `Video generation failed: ${
                  opStatus.error.message || JSON.stringify(opStatus.error)
                }`,
              );
            }

            const result = opStatus.result || opStatus.response;
            if (!result) {
              console.error("[v0] No result in completion result:", opStatus);
              throw new Error("Operation completed but no result found");
            }

            // Veo 3.1 structure: result.generateVideoResponse.generatedSamples[0].video.uri
            const veoResponse = result.generateVideoResponse;
            const samples = veoResponse?.generatedSamples;
            const videoData = samples?.[0]?.video;
            const videoUri = videoData?.uri;

            if (videoUri) {
              console.log("[v0] Found video URI:", videoUri);
              // Fetch the actual video bytes
              const downloadResp = await fetch(`${videoUri}&key=${apiKey}`);
              if (!downloadResp.ok) {
                throw new Error(
                  `Video indirme başarısız: ${downloadResp.statusText}`,
                );
              }
              const arrayBuffer = await downloadResp.arrayBuffer();
              const videoBytes = Buffer.from(arrayBuffer).toString("base64");

              return Response.json({
                video: `data:video/mp4;base64,${videoBytes}`,
                videoName: `stylescape-video-${Date.now()}.mp4`,
              });
            }

            // Fallback for other potential structures
            const legacyVideoData = result.generatedVideos?.[0];
            const videoBytes =
              legacyVideoData?.videoBytes ||
              legacyVideoData?.data ||
              legacyVideoData?.video?.videoBytes;

            if (!videoBytes) {
              console.error(
                "[v0] Result structure unknown:",
                JSON.stringify(result, null, 2),
              );
              throw new Error("Video verisi bulunamadı");
            }

            return Response.json({
              video: `data:video/mp4;base64,${videoBytes}`,
              videoName: `stylescape-video-${Date.now()}.mp4`,
            });
          }

          console.log("[v0] Still processing...");
        } catch (pollError: any) {
          // Handle transient errors (like 429 during polling)
          if (
            pollError?.status === 429 ||
            pollError?.message?.includes("quota")
          ) {
            console.warn("[v0] Polling 429 (Quota), waiting longer...");
            await new Promise((r) => setTimeout(r, 10000)); // Wait extra 10s
            continue; // Retry polling
          }
          // If it's a real error (not 429), rethrow
          throw pollError;
        }
      }

      return Response.json(
        {
          error:
            "Video oluşturma zaman aşımına uğradı (90s+). İşlem arka planda devam ediyor olabilir.",
        },
        { status: 504 },
      );
    } catch (veoError: any) {
      console.error("[v0] Google Veo error:", veoError);

      let errorMessage = veoError?.message || "Bilinmeyen hata";

      if (errorMessage.includes("API key") || veoError?.status === 401) {
        errorMessage =
          "Google API key geçersiz. Lütfen GOOGLE_API_KEY'inizi kontrol edin.";
      } else if (errorMessage.includes("quota") || veoError?.status === 429) {
        errorMessage =
          "Google API quota aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.";
      } else if (
        errorMessage.includes("not found") ||
        errorMessage.includes("404") ||
        errorMessage.includes("not supported")
      ) {
        errorMessage = `Model bulunamadı (404). Google Veo (veo-3.1-generate-preview-001) hesabınızda etkinleştirilmemiş olabilir. Lütfen https://aistudio.google.com/ adresinden erişim durumunuzu kontrol edin.`;
      } else if (
        errorMessage.includes("allowlist") ||
        errorMessage.includes("not enabled")
      ) {
        errorMessage =
          "Google Veo henüz hesabınız için etkinleştirilmemiş. Lütfen Google AI Studio'da Veo erişimi için başvurun.";
      }

      return Response.json(
        {
          error: errorMessage,
          stack: veoError instanceof Error ? veoError.stack : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[v0] Video generation error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Bir hata oluştu. Lütfen tekrar deneyin.",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
