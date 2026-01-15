import { GoogleGenAI } from "@google/genai";
// actually @google/genai has .files.
import fs from "fs";
import path from "path";
import os from "os";

export const maxDuration = 60; // Max execution time for Vercel

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
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { modelImage, prompt, duration, motion, style } = await req.json();

    if (!modelImage) {
      return Response.json(
        { error: "Manken resmi gereklidir" },
        { status: 400 }
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

    // Build the video generation prompt
    const fullPrompt = `${
      prompt ||
      "Professional fashion model showcasing outfit with smooth, natural movements"
    }. ${style ? `Style: ${style}.` : ""} ${
      motion ? `Camera motion: ${motion}.` : ""
    } Professional studio lighting, cinematic quality, high-end fashion photography. Smooth and elegant movement.`;

    console.log("[v0] Veo prompt:", fullPrompt);

    try {
      // 1. Upload Input Image to Gemini Files API
      console.log("[v0] Uploading image to Gemini Files...");

      const tempFilePath = path.join(
        os.tmpdir(),
        `veo_input_${Date.now()}.png`
      );

      await fs.promises.writeFile(
        tempFilePath,
        Buffer.from(imageData, "base64")
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
        console.error("[v0] Upload failed:", uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      } finally {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("Temp cleanup warning:", err.message);
        });
      }

      if (!fileUri) throw new Error("Dosya yükleme başarısız oldu (URI eksik)");

      // 2. Initiate Video Generation
      console.log("[v0] Starting Veo generation...");

      // cast to any to avoid TypeScript complaints about exact SDK signature until types are verified
      const initialResponse = await (ai.models as any).generateVideos({
        model: "veo-3.1-generate-preview",
        prompt: fullPrompt,
        image_uri: fileUri,
        config: {
          aspectRatio: "16:9",
          resolution: "720p",
        },
      });

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
          JSON.stringify(initialResponse, null, 2)
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

      // 2. Poll for Completion
      const startTime = Date.now();
      const MAX_POLL_TIME = 55000; // 55 seconds (leave 5s buffer for 60s timeout)
      const POLLING_INTERVAL = 3000; // 3 seconds

      while (Date.now() - startTime < MAX_POLL_TIME) {
        await new Promise((r) => setTimeout(r, POLLING_INTERVAL));

        // Poll the operation status
        // Use getVideosOperationInternal directly because operations.get expects an Operation instance
        const opStatus = await (
          ai.operations as any
        ).getVideosOperationInternal({
          operationName: operationName,
        });

        if (opStatus.done) {
          console.log("[v0] Operation completed!");

          if (opStatus.error) {
            throw new Error(
              `Video generation failed: ${
                opStatus.error.message || JSON.stringify(opStatus.error)
              }`
            );
          }

          const result = opStatus.result || opStatus.response;
          if (
            !result ||
            !result.generatedVideos ||
            result.generatedVideos.length === 0
          ) {
            console.error("[v0] No videos in completion result:", result);
            throw new Error("Operation completed but no video data found");
          }

          const videoData = result.generatedVideos[0];
          const videoBytes =
            videoData.videoBytes ||
            videoData.data ||
            videoData.video?.videoBytes; // Check multiple paths

          if (!videoBytes) {
            throw new Error("Video bytes missing in response");
          }

          return Response.json({
            video: `data:video/mp4;base64,${videoBytes}`,
            videoName: `stylescape-video-${Date.now()}.mp4`,
          });
        }

        console.log("[v0] Still processing...");
      }

      return Response.json(
        {
          error:
            "Video oluşturma zaman aşımına uğradı (60s+). İşlem arka planda devam ediyor olabilir.",
        },
        { status: 504 }
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
        { status: 500 }
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
      { status: 500 }
    );
  }
}
