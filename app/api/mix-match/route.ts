import { type NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const maxDuration = 60;

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

    if (!process.env.FAL_KEY) {
      console.error("[v0] FAL_KEY environment variable is missing");
      return NextResponse.json(
        { error: "FAL_KEY eksik. Lütfen ortam değişkenlerini kontrol edin." },
        { status: 500 }
      );
    }

    console.log("[v0] Starting Mix & Match with sequential VTON...");
    console.log("[v0] Number of layers:", layers.length);

    // Configure fal client
    fal.config({
      credentials: process.env.FAL_KEY,
    });

    // Helper to upload base64 to Fal storage
    const uploadBase64Image = async (base64Data: string): Promise<string> => {
      try {
        if (!base64Data.startsWith("data:")) return base64Data;

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

    // Map layer type to VTON category
    const mapLayerToCategory = (type: string): string => {
      switch (type) {
        case "top":
          return "upper_body";
        case "bottom":
          return "lower_body";
        case "outerwear":
          return "upper_body";
        case "accessories":
          return "upper_body";
        default:
          return "upper_body";
      }
    };

    // Sort layers by application priority (bottom first, then top, then outerwear)
    const sortedLayers = [...layers].sort((a, b) => {
      const priority: Record<string, number> = {
        bottom: 1,
        top: 2,
        outerwear: 3,
        accessories: 4,
      };
      return (priority[a.type] || 99) - (priority[b.type] || 99);
    });

    console.log(
      "[v0] Layer application order:",
      sortedLayers.map((l) => l.type)
    );

    // Apply each layer sequentially
    let currentModelImage = modelImage;

    for (let i = 0; i < sortedLayers.length; i++) {
      const layer = sortedLayers[i];
      console.log(
        `[v0] Applying layer ${i + 1}/${sortedLayers.length}: ${layer.type}`
      );

      try {
        // Upload images to Fal storage
        const humanImageUrl = await uploadBase64Image(currentModelImage);
        const garmentImageUrl = await uploadBase64Image(layer.image);

        console.log(`[v0] Images uploaded for ${layer.type}`);

        // Apply garment using VTON
        const result: any = await fal.subscribe("fal-ai/idm-vton", {
          input: {
            human_image_url: humanImageUrl,
            garment_image_url: garmentImageUrl,
            description: `${layer.type} clothing item`,
            category: mapLayerToCategory(layer.type),
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log);
            }
          },
        });

        if (!result.data || !result.data.image) {
          console.error(
            `[v0] No image in fal response for ${layer.type}`,
            result
          );
          throw new Error(`Failed to apply ${layer.type}`);
        }

        // Use the result as input for the next layer
        currentModelImage = result.data.image.url;
        console.log(`[v0] Successfully applied ${layer.type}`);
      } catch (layerError: any) {
        console.error(`[v0] Error applying ${layer.type}:`, layerError);
        return NextResponse.json(
          {
            error: `${layer.type} uygulanırken hata oluştu: ${
              layerError?.message || "Bilinmeyen hata"
            }`,
          },
          { status: 500 }
        );
      }
    }

    console.log("[v0] Mix & Match completed successfully");

    return NextResponse.json({
      resultImage: currentModelImage,
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
