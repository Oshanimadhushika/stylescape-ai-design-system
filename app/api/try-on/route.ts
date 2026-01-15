import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";

export const maxDuration = 60;

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

    console.log("[v0] Try-on request received");

    if (previousResult && revisionInstructions) {
      console.log("[v0] Revision mode:", revisionInstructions);
    }

    console.log(
      "[v0] Model Image Type:",
      modelImage
        ? modelImage.startsWith("data:")
          ? "Data URL"
          : "URL"
        : "Missing"
    );
    console.log(
      "[v0] Clothing Image Type:",
      clothingImage
        ? clothingImage.startsWith("data:")
          ? "Data URL"
          : "URL"
        : "Missing"
    );

    if (!modelImage || !clothingImage) {
      return NextResponse.json(
        { error: "Hem manken hem de kıyafet resmi gereklidir" },
        { status: 400 }
      );
    }

    if (!process.env.FAL_KEY) {
      console.error("[v0] FAL_KEY environment variable is missing");
      return NextResponse.json(
        {
          error: "FAL_KEY eksik. Lütfen v0 vars bölümünden FAL_KEY ekleyin.",
        },
        { status: 500 }
      );
    }

    // Handle revisions with text-guided image editing
    if (previousResult && revisionInstructions) {
      console.log("[v0] Processing revision with Fal AI image-to-image...");
      console.log("[v0] Revision instruction:", revisionInstructions);

      fal.config({
        credentials: process.env.FAL_KEY,
      });

      try {
        // Upload the previous result to Fal storage
        const uploadBase64Image = async (
          base64Data: string
        ): Promise<string> => {
          if (!base64Data.startsWith("data:")) return base64Data;
          const matches = base64Data.match(
            /^data:([A-Za-z-+\/]+);base64,(.+)$/
          );
          if (!matches || matches.length !== 3) {
            throw new Error("Invalid base64 string");
          }
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const blob = new Blob([buffer], { type: contentType });
          return await fal.storage.upload(blob);
        };

        const imageUrl = await uploadBase64Image(previousResult);
        console.log("[v0] Previous image uploaded:", imageUrl);

        // Use FLUX img2img for text-guided editing
        const editPrompt = `${revisionInstructions}. IMPORTANT: Keep the clothing, outfit, and overall composition exactly the same. Only modify what is specifically requested.`;

        const result: any = await fal.subscribe(
          "fal-ai/flux/dev/image-to-image",
          {
            input: {
              image_url: imageUrl,
              prompt: editPrompt,
              strength: 0.5, // Lower strength = more preservation of original
              num_inference_steps: 28,
              guidance_scale: 3.5,
            },
            logs: true,
            onQueueUpdate: (update) => {
              if (update.status === "IN_PROGRESS") {
                update.logs.map((log) => log.message).forEach(console.log);
              }
            },
          }
        );

        if (
          !result.data ||
          !result.data.images ||
          result.data.images.length === 0
        ) {
          console.error("[v0] No image in revision response", result);
          throw new Error("Revizyon görüntüsü oluşturulamadı");
        }

        console.log("[v0] Revision completed successfully");
        return NextResponse.json({
          image: result.data.images[0].url,
        });
      } catch (revisionError: any) {
        console.error("[v0] Revision error:", revisionError);
        return NextResponse.json(
          {
            error: `Revizyon hatası: ${
              revisionError?.message || "Bilinmeyen hata"
            }`,
          },
          { status: 500 }
        );
      }
    }

    // Normal try-on flow (no revision)
    console.log("[v0] Starting Virtual Try-On with fal.ai idm-vton...");

    // Configure fal client
    fal.config({
      credentials: process.env.FAL_KEY,
    });

    // Helper to upload base64 to Fal storage
    const uploadBase64Image = async (base64Data: string): Promise<string> => {
      try {
        // If it's already a URL, return it
        if (!base64Data.startsWith("data:")) return base64Data;

        // Convert base64 to blob/buffer
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
          throw new Error("Invalid base64 string");
        }

        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const blob = new Blob([buffer], { type: contentType });

        const url = await fal.storage.upload(blob);
        return url;
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    };

    console.log("[v0] Uploading images to Fal storage...");
    let modelImageUrl, clothingImageUrl;
    try {
      [modelImageUrl, clothingImageUrl] = await Promise.all([
        uploadBase64Image(modelImage),
        uploadBase64Image(clothingImage),
      ]);
      console.log("[v0] Images uploaded successfully");
    } catch (uploadError: any) {
      console.error("[v0] Image upload failed details:", uploadError);
      return NextResponse.json(
        {
          error: `Resim yükleme hatası: ${
            uploadError?.message || JSON.stringify(uploadError)
          }`,
          details: uploadError,
        },
        { status: 500 }
      );
    }

    console.log("[v0] Images uploaded URLs:", {
      modelImageUrl,
      clothingImageUrl,
    });

    // Determine category based on settings or default to upper_body if not specified
    const category = "upper_body";

    try {
      console.log("Sending payload to fal-ai/idm-vton:", {
        human_image_url: modelImageUrl,
        garment_image_url: clothingImageUrl,
        description: "clothing item",
        category,
      });

      const result: any = await fal.subscribe("fal-ai/idm-vton", {
        input: {
          human_image_url: modelImageUrl,
          garment_image_url: clothingImageUrl,
          description: "clothing item",
          category: category,
          crop: false,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      if (!result.data || !result.data.image) {
        console.error("[v0] No image in fal response", result);
        throw new Error("Fal AI yanıtında görsel bulunamadı");
      }

      console.log("[v0] Try-on generated successfully");
      return NextResponse.json({
        image: result.data.image.url,
      });
    } catch (falError: any) {
      console.error("[v0] Fal AI inference error:", falError);
      return NextResponse.json(
        {
          error: `Fal AI hatası: ${
            falError?.message || JSON.stringify(falError)
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[v0] General Try-on error:", error);
    return NextResponse.json(
      { error: error.message || "Bilinmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}
