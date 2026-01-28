import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const maxDuration = 60;

// Helper to handle base64 parts for Gemini
function partFromBase64(base64String: string) {
  let data = base64String;
  if (data.includes("base64,")) {
    data = data.split("base64,")[1];
  }
  return {
    inlineData: {
      data: data,
      mimeType: "image/png",
    },
  };
}

// Helper to safely extract text from Gemini response
function getText(response: any): string {
  try {
    if (response.text && typeof response.text === "function") {
      return response.text();
    }
    // Handle @google/genai v0.1+ structure
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (
        candidate.content &&
        candidate.content.parts &&
        candidate.content.parts.length > 0
      ) {
        return candidate.content.parts[0].text || "";
      }
    }
    return "";
  } catch (e) {
    console.error("Error extracting text from response:", e);
    return "";
  }
}

async function analyzeImages(
  ai: GoogleGenAI,
  modelImage: string,
  clothingImage: string,
  settings: any,
) {
  const modelPart = partFromBase64(modelImage);
  const clothPart = partFromBase64(clothingImage);

  const prompt = `
    You are a professional fashion photographer and stylist.
    Task: Create a highly detailed image generation prompt for a virtual try-on.
    
    Input 1: Model Image (The person)
    Input 2: Clothing Image (The garment to be worn)
    
    Settings:
    - Pose: ${settings?.pose || "same as model"}
    - Lighting: ${settings?.lighting || "natural"}
    - Environment: ${settings?.environment || "studio"}
    
    Instructions:
    1. Analyze the Model: Describe appearance, gender, body type, hair, facial features, and current pose detailedly.
    2. Analyze the Clothing: Describe the garment in extreme detail (color, fabric, texture, cut, pattern).
    3. Output ONE cohesive prompt: Describe the MODEL wearing the CLOTHING.
    - Ensure the face and body features match the Model Image exactly.
    - Ensure the clothing matches the Clothing Image exactly.
    - Apply the requested lighting and environment.
    - The style should be: "Photorealistic, 4k, high fashion pricing".
    
    Output ONLY the prompt text, no explanations.
  `;

  // Use Gemini 2.0 Flash (stable and free)
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, modelPart, clothPart],
      },
    ],
  });

  const text = getText(response);
  return text || "A model wearing fashion clothing.";
}

async function analyzeForRevision(
  ai: GoogleGenAI,
  currentImage: string,
  instructions: string,
) {
  const imagePart = partFromBase64(currentImage);
  const prompt = `
      I have this generated fashion image.
      User wants to revise it with: "${instructions}".
      
      Write a full, new image generation prompt that describes the image but incorporates the user's changes.
      Keep everything else (pose, model identity, unaffected clothing parts) as close to the original as possible.
      Output ONLY the new prompt.
    `;

  // Use Gemini 2.0 Flash (stable and free)
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, imagePart],
      },
    ],
  });

  const text = getText(response);
  return text || instructions;
}

async function generateImage(ai: GoogleGenAI, prompt: string): Promise<string> {
  // Use Imagen 4 (stable and free)
  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt: prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "3:4",
      safetyFilterLevel: "BLOCK_LOW_AND_ABOVE",
      personGeneration: "ALLOW_ADULT",
    } as any,
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const img = response.generatedImages[0];
    // Ensure we return a data URL
    const b64 = img.image?.imageBytes;
    if (!b64) throw new Error("Generative AI produced an empty image result.");
    return `data:image/png;base64,${b64}`;
  }

  throw new Error("No image generated.");
}

export async function POST(req: Request) {
  try {
    const {
      modelImage,
      clothingImage,
      modelContext,
      studioSettings,
      previousResult,
      revisionInstructions,
    } = await req.json();

    console.log("[v0] Try-on request received (Gemini Powered)");

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_API_KEY eksik. Lütfen ortam değişkenlerini kontrol edin.",
        },
        { status: 500 },
      );
    }
    const ai = new GoogleGenAI({ apiKey });

    // --- REVISION MODE ---
    if (previousResult && revisionInstructions) {
      console.log("[v0] Revision mode:", revisionInstructions);
      try {
        const description = await analyzeForRevision(
          ai,
          previousResult,
          revisionInstructions,
        );
        console.log("[v0] Revised Prompt:", description);

        try {
          const newImage = await generateImage(ai, description);
          return NextResponse.json({ image: newImage });
        } catch (genError: any) {
          console.error(
            "[v0] Revision Image Generation failed:",
            genError.message,
          );
          return NextResponse.json({
            image: null,
            description: description,
            info: "Image generation skipped (Billing/Quota limits). Showing revised prompt.",
            isFallback: true,
          });
        }
      } catch (error: any) {
        console.error("[v0] Revision error:", error);
        return NextResponse.json(
          { error: `Revizyon hatası: ${error.message}` },
          { status: 500 },
        );
      }
    }

    // --- STANDARD TRY-ON MODE ---
    if (!modelImage || !clothingImage) {
      return NextResponse.json(
        { error: "Hem manken hem de kıyafet resmi gereklidir" },
        { status: 400 },
      );
    }

    console.log("[v0] Starting Gemini Analysis Phase...");

    // Step 1: Analyze Images with Gemini 2.0 Flash to get a description
    const analysis = await analyzeImages(
      ai,
      modelImage,
      clothingImage,
      studioSettings,
    );
    console.log("[v0] Analysis complete. Prompt:", analysis);

    // Step 2: Generate Image with Imagen
    console.log("[v0] Starting Generation Phase...");
    try {
      const generatedImage = await generateImage(ai, analysis);
      return NextResponse.json({ image: generatedImage });
    } catch (genError: any) {
      console.error("[v0] Image Generation failed:", genError.message);

      return NextResponse.json({
        image: null,
        description: analysis,
        info: "Image generation skipped (Billing/Quota limits). Showing generated prompt.",
        isFallback: true,
      });
    }
  } catch (error: any) {
    console.error("[v0] General Try-on error:", error);
    return NextResponse.json(
      { error: error.message || "Bilinmeyen bir hata oluştu." },
      { status: 500 },
    );
  }
}
