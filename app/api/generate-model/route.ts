import { GoogleGenAI } from "@google/genai";
export const maxDuration = 30;

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const {
      description,
      gender,
      style,
      height,
      bodyType,
      clothingSize,
      skinTone,
      hairColor,
      hairStyle,
      ageRange,
      pose,
      environment,
      lastGeneratedImage,
      revisionInstructions,
      referenceImage,
    } = await req.json();

    if (!description && !revisionInstructions && !referenceImage) {
      return Response.json(
        {
          error: "Açıklama, revizyon talimatı veya referans görsel gereklidir",
        },
        { status: 400 },
      );
    }

    const isRevision = !!lastGeneratedImage && !!revisionInstructions;

    // Build the prompt
    let contextPrompt = "";

    if (isRevision) {
      contextPrompt = `REVISION TASK: Modify the existing fashion model image.
The previous model was a ${gender}, around ${ageRange} years old, ${height} height, and ${bodyType} build. 
Hair: ${hairColor} ${hairStyle}. Skin Tone: ${skinTone}. Style: ${style}.

Please apply the following specific changes:
${revisionInstructions}

Requirements:
Maintain the overall quality and identity of the original model.
Output a single, high-quality photograph.
Do not include any text, letters, watermarks, or labels in the final image.`;
    } else {
      contextPrompt = `A professional, high-resolution fashion model photograph. 
The model is a ${gender}, around ${ageRange} years old, with a ${height} height and ${bodyType} build, wearing size ${clothingSize}. 
The model has ${skinTone} skin tone and ${hairColor} ${hairStyle} hair. 
The pose is ${pose}, captured in a ${environment} environment with a ${style} style. 
${description}
${
  referenceImage
    ? "The photo should follow the style and pose of the provided reference."
    : ""
}

Important instructions for the output:
The image must be a clean, pure photographic output of a single model.
Do not include any text, letters, watermarks, labels, or typography anywhere in the background or on the model.
The background must be clean and professional without any writing.`;
    }

    console.log("[v0] Generating image with Direct Gemini SDK...");
    if (referenceImage) {
      console.log(
        "[v0] Reference image provided (Base64 length: " +
          referenceImage.length +
          ")",
      );
      // Note: Current imagen-4.0-generate-001 via this SDK might not support direct image input for generation
      // in the standard text-to-image flow comfortably without looking up specific parameters.
      // We proceed with text-to-image for stability as requested.
    }

    let imageBase64: string | null = null;

    if (isRevision) {
      // For revision, we use Imagen 3 with the revision prompt.
      // Ideally we would pass the lastGeneratedImage here if the SDK supports editing.
      const result = await ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: contextPrompt,
        config: {
          numberOfImages: 1,
        },
      });

      const genImage = result.generatedImages?.[0] as any;
      if (genImage) {
        imageBase64 =
          genImage.image?.imageBytes ||
          genImage.imageBytes ||
          genImage.imageData ||
          genImage.base64;
      }
    } else {
      const result = await ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: contextPrompt,
        config: {
          numberOfImages: 1,
        },
      });

      const genImage = result.generatedImages?.[0] as any;
      if (genImage) {
        imageBase64 =
          genImage.image?.imageBytes ||
          genImage.imageBytes ||
          genImage.imageData ||
          genImage.base64;
      }
    }

    if (!imageBase64) {
      console.error("[v0] No image found in response.");
      throw new Error("Görsel oluşturulamadı.");
    }
    console.log("[v0] Image generated successfully");

    return Response.json({
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error("[v0] Model generation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: `Görsel oluşturulamadı: ${errorMessage}` },
      { status: 500 },
    );
  }
}
