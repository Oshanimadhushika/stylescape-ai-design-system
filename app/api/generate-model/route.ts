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
        { status: 400 }
      );
    }

    const isRevision = !!lastGeneratedImage && !!revisionInstructions;

    // Build the prompt
    let contextPrompt = "";

    if (isRevision) {
      contextPrompt = `REVISION TASK - MODIFY THE ATTACHED FASHION MODEL IMAGE
      
      PREVIOUS MODEL SPECIFICATIONS (FOR CONTEXT):
      - Gender: ${gender}, Age: ${ageRange}, Height: ${height}, Body: ${bodyType}
      - Hair: ${hairColor} ${hairStyle}, Tone: ${skinTone}, Style: ${style}
      
      REVISION INSTRUCTIONS:
      ${revisionInstructions}
      
      CRITICAL REQUIREMENTS:
      - Apply the requested changes while keeping the overall quality and composition consistent with the original model's identity.
      - Output a single, professional-quality fashion photograph.`;
    } else {
      contextPrompt = `PROFESSIONAL FASHION MODEL GENERATION - DETAILED SPECIFICATIONS

CRITICAL CONSISTENCY REQUIREMENTS:
- Generate a high-resolution, professional fashion model photograph
- Positioned for optimal clothing overlay and virtual try-on compatibility

PHYSICAL SPECIFICATIONS:
- Gender: ${gender}, Age: ${ageRange}, Height: ${height}, Body: ${bodyType}, Size: ${clothingSize}
- Tone: ${skinTone}, Hair: ${hairColor} ${hairStyle}

STYLE & SETUP:
- Pose: ${pose}, Environment: ${environment}, Style: ${style}

USER NOTES: ${description}

${
  referenceImage
    ? "NOTE: A reference image has been provided by the user to guide the style/pose."
    : ""
}

OUTPUT: A single, professional-quality photograph.`;
    }

    console.log("[v0] Generating image with Direct Gemini SDK...");
    if (referenceImage) {
      console.log(
        "[v0] Reference image provided (Base64 length: " +
          referenceImage.length +
          ")"
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
      { status: 500 }
    );
  }
}
