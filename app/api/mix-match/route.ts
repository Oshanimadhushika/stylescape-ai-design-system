import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { modelImage, modelContext, layers, studioSettings } =
      await req.json();

    if (!modelImage || !layers || layers.length === 0) {
      return NextResponse.json(
        { error: "Model image and at least one clothing layer required" },
        { status: 400 }
      );
    }

    const layerDescriptions = layers
      .map((layer: any) => {
        const labels: any = {
          top: "üst giyim (top)",
          bottom: "alt giyim (bottom)",
          outerwear: "dış giyim (outerwear)",
          accessories: "aksesuar (accessories)",
        };
        return labels[layer.type] || layer.type;
      })
      .join(", ");

    const poseDescriptions: any = {
      "front-straight": "düz ön, ayakta dik duruş",
      "casual-confident": "rahat ve kendinden emin, hafif eğik duruş",
      "dynamic-movement": "dinamik hareket, canlı poz",
      "elegant-poised": "zarif ve duruşlu, sofistike poz",
      "relaxed-natural": "rahat ve doğal, samimi duruş",
    };

    const angleDescriptions: any = {
      "eye-level": "göz hizasında çekim",
      "slightly-above": "hafif yukarıdan çekim",
      "slightly-below": "hafif aşağıdan çekim",
    };

    const lightingDescriptions: any = {
      "soft-even": "yumuşak ve dengeli ışıklandırma",
      "dramatic-side": "dramatik yan ışık, kontrast gölgeler",
      "natural-bright": "doğal and parlak ışıklandırma",
      "soft-glamour": "yumuşak glamour ışıklandırma",
      "natural-golden": "doğal altın saat ışığı",
    };

    const environmentDescriptions: any = {
      "white-backdrop": "temiz beyaz fon",
      "minimal-studio": "minimal stüdyo ortamı",
      "urban-lifestyle": "urban lifestyle ortamı",
      "elegant-backdrop": "zarif ve lüks fon",
      "outdoor-natural": "açık hava, doğal ortam",
    };

    const prompt = `Professional fashion photography: Full-body shot of a fashion model wearing multiple clothing items: ${layerDescriptions}.

MODEL CONSISTENCY:
${modelContext || "Professional fashion model with consistent features"}

STYLING:
- ${poseDescriptions[studioSettings.pose] || "natural standing pose"}
- ${
      lightingDescriptions[studioSettings.lighting] ||
      "professional studio lighting"
    }
- ${
      environmentDescriptions[studioSettings.environment] ||
      "clean studio backdrop"
    }

OUTPUT:
Professional fashion photography, editorial quality, photorealistic.`;

    console.log("[v0] Starting Mix & Match with Direct Gemini SDK...");

    const result = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });

    let base64Data: string | null = null;
    const genImage = result.generatedImages?.[0] as any;
    if (genImage) {
      base64Data =
        genImage.image?.imageBytes ||
        genImage.imageBytes ||
        genImage.imageData ||
        genImage.base64;
    }

    if (!base64Data) {
      console.error("[v0] No image found in response");
      throw new Error("No image generated");
    }

    const base64Image = `data:image/png;base64,${base64Data}`;
    console.log("[v0] Mix & Match image generated successfully");

    return NextResponse.json({
      resultImage: base64Image,
      success: true,
    });
  } catch (error: any) {
    console.error("[v0] Mix & Match error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Mix & Match generation failed",
      },
      { status: 500 }
    );
  }
}
