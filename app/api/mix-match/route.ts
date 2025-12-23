import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { modelImage, modelContext, layers, studioSettings } = await req.json()

    if (!modelImage || !layers || layers.length === 0) {
      return NextResponse.json({ error: "Model image and at least one clothing layer required" }, { status: 400 })
    }

    const layerDescriptions = layers
      .map((layer: any) => {
        const labels: any = {
          top: "üst giyim (top)",
          bottom: "alt giyim (bottom)",
          outerwear: "dış giyim (outerwear)",
          accessories: "aksesuar (accessories)",
        }
        return labels[layer.type] || layer.type
      })
      .join(", ")

    const poseDescriptions: any = {
      "front-straight": "düz ön, ayakta dik duruş",
      "casual-confident": "rahat ve kendinden emin, hafif eğik duruş",
      "dynamic-movement": "dinamik hareket, canlı poz",
      "elegant-poised": "zarif ve duruşlu, sofistike poz",
      "relaxed-natural": "rahat ve doğal, samimi duruş",
    }

    const angleDescriptions: any = {
      "eye-level": "göz hizasında çekim",
      "slightly-above": "hafif yukarıdan çekim",
      "slightly-below": "hafif aşağıdan çekim",
    }

    const lightingDescriptions: any = {
      "soft-even": "yumuşak ve dengeli ışıklandırma",
      "dramatic-side": "dramatik yan ışık, kontrast gölgeler",
      "natural-bright": "doğal ve parlak ışıklandırma",
      "soft-glamour": "yumuşak glamour ışıklandırma",
      "natural-golden": "doğal altın saat ışığı",
    }

    const environmentDescriptions: any = {
      "white-backdrop": "temiz beyaz fon",
      "minimal-studio": "minimal stüdyo ortamı",
      "urban-lifestyle": "urban lifestyle ortamı",
      "elegant-backdrop": "zarif ve lüks fon",
      "outdoor-natural": "açık hava, doğal ortam",
    }

    const prompt = `Professional fashion photography: Full-body shot of a fashion model wearing multiple clothing items: ${layerDescriptions}.

MODEL CONSISTENCY:
${modelContext || "Professional fashion model with consistent features"}

POSE & COMPOSITION:
- ${poseDescriptions[studioSettings.pose] || "natural standing pose"}
- ${angleDescriptions[studioSettings.angle] || "eye-level shot"}
- Full body visible, head to toe
- Professional model positioning

CLOTHING LAYERS (IMPORTANT):
- All clothing items must be visible and properly layered
- ${layerDescriptions}
- Natural fabric draping and fit
- Colors and patterns preserved from original garments
- Professional styling and coordination

LIGHTING & ENVIRONMENT:
- ${lightingDescriptions[studioSettings.lighting] || "professional studio lighting"}
- ${environmentDescriptions[studioSettings.environment] || "clean studio backdrop"}
- High-end fashion photography quality

TECHNICAL SPECS:
- 8K resolution, ultra-detailed
- Professional color grading
- Sharp focus on model and clothing
- Photorealistic rendering
- Commercial fashion quality

Style: professional fashion photography, editorial quality, commercial ready`

    console.log("[v0] Mix & Match prompt:", prompt.substring(0, 200) + "...")

    const result = await generateText({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    console.log("[v0] Mix & Match result received")

    let base64Data: string | null = null

    if (result.steps) {
      for (const step of result.steps) {
        if (step.type === "tool-result" && step.content) {
          for (const part of step.content) {
            if (part.type === "file" && part.data) {
              base64Data = part.data
              console.log("[v0] Found image in step content")
              break
            }
          }
        }
        if (base64Data) break
      }
    }

    if (!base64Data) {
      console.error("[v0] No image found in result")
      console.error("[v0] Result structure:", JSON.stringify(result, null, 2))
      throw new Error("No image generated")
    }

    const base64Image = `data:image/png;base64,${base64Data}`
    console.log("[v0] Mix & Match image generated successfully")

    return NextResponse.json({
      resultImage: base64Image,
      success: true,
    })
  } catch (error: any) {
    console.error("[v0] Mix & Match error:", error)
    console.error("[v0] Error details:", error?.message)
    return NextResponse.json(
      {
        error: error?.message || "Mix & Match generation failed",
      },
      { status: 500 },
    )
  }
}
