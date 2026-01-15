import { type NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Mix & Match API called");
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
        console.log(
          "[v0] Uploading image, data type:",
          typeof base64Data,
          "starts with data:",
          base64Data?.startsWith("data:")
        );
        if (!base64Data.startsWith("data:")) {
          console.log("[v0] Image is already a URL, skipping upload");
          return base64Data;
        }

        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          console.error("[v0] Invalid base64 format");
          throw new Error("Invalid base64 string");
        }

        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const blob = new Blob([buffer], { type: contentType });
        console.log(
          "[v0] Blob created, size:",
          blob.size,
          "type:",
          contentType
        );

        const url = await fal.storage.upload(blob);
        console.log("[v0] Upload successful, URL:", url);
        return url;
      } catch (error) {
        console.error("[v0] Upload error:", error);
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

      // Add delay between layers to avoid rate limiting (except for first layer)
      if (i > 0) {
        console.log(
          "[v0] Waiting 2 seconds before next layer to avoid rate limiting..."
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      try {
        // Upload images to Fal storage
        const humanImageUrl = await uploadBase64Image(currentModelImage);
        const garmentImageUrl = await uploadBase64Image(layer.image);

        console.log(`[v0] Images uploaded for ${layer.type}`);
        console.log(`[v0] Calling FAL API for ${layer.type}...`);

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

        console.log(`[v0] FAL API response for ${layer.type}:`, {
          hasData: !!result.data,
          hasImage: !!result.data?.image,
          status: result.status,
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
        console.error(`[v0] Error details:`, {
          message: layerError?.message,
          status: layerError?.status,
          body: layerError?.body,
          stack: layerError?.stack,
        });

        // Provide more helpful error messages
        let errorMessage = layerError?.message || "Bilinmeyen hata";

        if (errorMessage.includes("Forbidden") || layerError?.status === 403) {
          errorMessage =
            "FAL API erişim hatası. Lütfen FAL_KEY'inizi kontrol edin veya API limitinizi aştınız.";
        } else if (
          errorMessage.includes("rate limit") ||
          layerError?.status === 429
        ) {
          errorMessage =
            "FAL API rate limit aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.";
        }

        return NextResponse.json(
          {
            error: `${layer.type} uygulanırken hata oluştu: ${errorMessage}`,
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
      { status: 500 }
    );
  }
}
