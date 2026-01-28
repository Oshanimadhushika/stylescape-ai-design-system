import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Mix & Match API called (Gemini AI with Vision)");
    const { modelImage, modelContext, layers, studioSettings } =
      await req.json();

    console.log("[v0] Request data:", {
      hasModelImage: !!modelImage,
      modelImageLength: modelImage?.length || 0,
      layersCount: layers?.length || 0,
      studioSettings,
    });

    if (!modelImage || !layers || layers.length === 0) {
      console.error("[v0] Validation failed: Missing required data");
      return NextResponse.json(
        { error: "Model image and at least one clothing layer required" },
        { status: 400 },
      );
    }

    if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
      console.error("[v0] Google API key is missing");
      return NextResponse.json(
        {
          error:
            "GOOGLE_API_KEY eksik. Lütfen ortam değişkenlerini kontrol edin.",
        },
        { status: 500 },
      );
    }

    console.log("[v0] Starting Mix & Match with Gemini Vision...");
    console.log("[v0] Number of layers:", layers.length);

    // Step 1: Analyze the model image to preserve characteristics
    console.log("[v0] Analyzing model image to preserve characteristics...");
    let modelDescription = modelContext || "Professional fashion model";

    try {
      let modelImageData = modelImage;
      if (modelImageData.startsWith("data:")) {
        const base64Match = modelImageData.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          modelImageData = base64Match[2];
        }
      }

      const modelAnalysisPrompt = `Analyze this fashion model in extreme detail. Describe:
1. Physical characteristics: gender, approximate age, body type, height appearance
2. Facial features: face shape, skin tone, distinctive features
3. Hair: color, style, length
4. Current pose and stance
5. Overall appearance and style

Be extremely detailed and specific so this exact model can be recreated in a new photograph.`;

      const modelVisionResult = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: modelAnalysisPrompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: modelImageData,
                },
              },
            ],
          },
        ],
      });

      modelDescription =
        modelVisionResult.text || modelContext || "Professional fashion model";
      console.log(
        "[v0] Model analyzed:",
        modelDescription.substring(0, 150) + "...",
      );
    } catch (modelAnalysisError) {
      console.error("[v0] Model analysis failed:", modelAnalysisError);
      console.log("[v0] Using provided model context instead");
    }

    // Step 2: Analyze each clothing image using Gemini Vision
    const clothingDescriptions: string[] = [];

    for (const layer of layers) {
      const typeLabels: Record<string, string> = {
        top: "Üst Giyim (Top)",
        bottom: "Alt Giyim (Bottom)",
        outerwear: "Dış Giyim (Outerwear)",
        accessories: "Aksesuar (Accessories)",
      };

      console.log(`[v0] Analyzing ${layer.type} clothing image...`);

      try {
        // Convert base64 to the format Gemini expects
        let imageData = layer.image;
        if (imageData.startsWith("data:")) {
          // Extract just the base64 part
          const base64Match = imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (base64Match) {
            imageData = base64Match[2];
          }
        }

        // Use Gemini Vision to analyze the clothing image
        const visionPrompt = `Analyze this ${
          typeLabels[layer.type]
        } clothing item in extreme detail. Describe:
1. Exact color(s) - be very specific (e.g., "navy blue", "burgundy red", "cream white")
2. Material/fabric appearance (e.g., cotton, denim, leather, silk, knit)
3. Style and cut (e.g., fitted, oversized, cropped, high-waisted)
4. Patterns or designs (e.g., striped, floral, solid, graphic print)
5. Notable features (e.g., buttons, zippers, pockets, collar style, sleeve length)
6. Overall aesthetic (e.g., casual, formal, sporty, elegant)

Be extremely detailed and specific so this exact item can be recreated in a fashion photograph.`;

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

        const description = visionResult.text || layer.label;
        clothingDescriptions.push(`${typeLabels[layer.type]}: ${description}`);
        console.log(
          `[v0] ${layer.type} analyzed:`,
          description.substring(0, 100) + "...",
        );
      } catch (visionError) {
        console.error(
          `[v0] Vision analysis failed for ${layer.type}:`,
          visionError,
        );
        // Fallback to basic description
        clothingDescriptions.push(
          `${typeLabels[layer.type]}: ${layer.label || "clothing item"}`,
        );
      }
    }

    // Step 2: Build comprehensive prompt with analyzed clothing details
    const poseDescriptions: Record<string, string> = {
      "front-straight": "standing straight facing camera",
      "casual-confident": "casual confident pose",
      "dynamic-movement": "dynamic movement pose",
      "elegant-poised": "elegant and poised stance",
    };

    const angleDescriptions: Record<string, string> = {
      "eye-level": "eye-level camera angle",
      "slightly-above": "slightly elevated camera angle",
      "slightly-below": "slightly lower camera angle",
    };

    const lightingDescriptions: Record<string, string> = {
      "soft-even": "soft even studio lighting",
      "dramatic-side": "dramatic side lighting",
      "natural-bright": "natural bright lighting",
      "soft-glamour": "soft glamour lighting",
    };

    const environmentDescriptions: Record<string, string> = {
      "white-backdrop": "clean white backdrop",
      "minimal-studio": "minimal studio environment",
      "urban-lifestyle": "urban lifestyle setting",
      "elegant-backdrop": "elegant backdrop",
    };

    const prompt = `Generate a professional high-quality fashion photograph recreating this EXACT model wearing specific clothing:

EXACT MODEL TO RECREATE (analyzed from provided image):
${modelDescription}

CRITICAL: Recreate this EXACT model with all the characteristics described above.

The model MUST be wearing EXACTLY these specific clothing items (analyzed from provided images):
${clothingDescriptions.join("\n")}

PHOTOGRAPHY SETUP:
- Pose: ${poseDescriptions[studioSettings?.pose] || "standing straight"}
- Camera Angle: ${angleDescriptions[studioSettings?.angle] || "eye-level"}
- Lighting: ${
      lightingDescriptions[studioSettings?.lighting] ||
      "soft even studio lighting"
    }
- Environment: ${
      environmentDescriptions[studioSettings?.environment] ||
      "clean white backdrop"
    }

CRITICAL REQUIREMENTS:
- The model MUST wear EXACTLY the clothing items described above with ALL their specific details
- Match the EXACT colors, patterns, styles, and features described
- Do NOT substitute or modify any clothing items
- Do NOT add any clothing items not listed above
- NO TEXT, NO WATERMARKS, NO LABELS anywhere in the image
- Clean background with NO writing or typography
- Professional fashion photography quality
- Full body shot showing the complete outfit clearly
- High resolution and sharp details
- Studio-quality composition and lighting
- Fashion editorial style
- Pure photographic content only

OUTPUT: A single professional fashion photograph showing the model wearing EXACTLY the specified clothing items with all their described characteristics. NO text, watermarks, or labels of any kind.`;

    console.log("[v0] Generating image with detailed clothing analysis...");

    try {
      const result = await ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: prompt,
        config: {
          numberOfImages: 1,
        },
      });

      console.log("[v0] Gemini API response received");

      const genImage = result.generatedImages?.[0] as any;
      if (!genImage) {
        console.error("[v0] No image in Gemini response", result);
        throw new Error("Gemini AI yanıtında görsel bulunamadı");
      }

      const imageBase64 =
        genImage.image?.imageBytes ||
        genImage.imageBytes ||
        genImage.imageData ||
        genImage.base64;

      if (!imageBase64) {
        console.error("[v0] No image data found in response");
        throw new Error("Görsel verisi bulunamadı");
      }

      console.log("[v0] Mix & Match completed successfully");

      return NextResponse.json({
        resultImage: `data:image/png;base64,${imageBase64}`,
        success: true,
      });
    } catch (geminiError: any) {
      console.error("[v0] Gemini API error:", geminiError);
      console.error("[v0] Error details:", {
        message: geminiError?.message,
        status: geminiError?.status,
        body: geminiError?.body,
      });

      let errorMessage = geminiError?.message || "Bilinmeyen hata";

      if (errorMessage.includes("API key") || geminiError?.status === 401) {
        errorMessage =
          "Google API key geçersiz. Lütfen GOOGLE_API_KEY'inizi kontrol edin.";
      } else if (
        errorMessage.includes("quota") ||
        geminiError?.status === 429
      ) {
        errorMessage =
          "Google API quota aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.";
      }

      return NextResponse.json(
        {
          error: `Kombin oluşturulamadı: ${errorMessage}`,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("[v0] Mix & Match error:", error);
    console.error("[v0] Error stack:", error?.stack);
    console.error("[v0] Error details:", {
      message: error?.message,
      name: error?.name,
      cause: error?.cause,
    });
    return NextResponse.json(
      {
        error: error?.message || "Mix & Match generation failed",
      },
      { status: 500 },
    );
  }
}
