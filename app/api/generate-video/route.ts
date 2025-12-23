import { fal } from "@fal-ai/client"

export const maxDuration = 60 // Maximum allowed by Vercel

export async function POST(req: Request) {
  try {
    const { modelImage, prompt, duration, motion, style } = await req.json()

    if (!modelImage) {
      return Response.json({ error: "Manken resmi gereklidir" }, { status: 400 })
    }

    if (!process.env.FAL_KEY) {
      console.error("[v0] FAL_KEY environment variable is missing")
      return Response.json(
        {
          error: "FAL_KEY environment variable'ı ayarlanmamış. Lütfen v0'ın 'Vars' bölümünden FAL_KEY ekleyin.",
        },
        { status: 500 },
      )
    }

    // Validate FAL_KEY format
    const keyFormat = process.env.FAL_KEY
    console.log("[v0] FAL_KEY format check:", keyFormat.substring(0, 20) + "...")

    if (!keyFormat.includes(":")) {
      console.error("[v0] FAL_KEY appears to be in wrong format (should be KEY_ID:KEY_SECRET)")
      return Response.json(
        {
          error: "FAL_KEY formatı yanlış. Format: KEY_ID:KEY_SECRET şeklinde olmalı",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Starting video generation with fal.ai Veo3...")

    // Configure fal client
    fal.config({
      credentials: process.env.FAL_KEY,
    })

    const fullPrompt = `${prompt || "Professional model showcasing fashion outfit with smooth, natural movements"}. ${style ? `Style: ${style}.` : ""} ${motion ? `Camera motion: ${motion}.` : ""} Professional studio lighting, cinematic quality, high-end fashion photography.`

    console.log("[v0] Veo3 prompt:", fullPrompt)
    console.log("[v0] Model image length:", modelImage.length)

    let result
    try {
      result = await fal.subscribe("fal-ai/veo3/fast/image-to-video", {
        input: {
          prompt: fullPrompt,
          image_url: modelImage,
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log("[v0] Queue status:", update.status)
          if (update.status === "IN_PROGRESS" && update.logs) {
            update.logs.map((log) => log.message).forEach(console.log)
          }
        },
      })
    } catch (falError: any) {
      console.error("[v0] fal.ai API error:", falError)

      if (falError.status === 403) {
        return Response.json(
          {
            error:
              "fal.ai API key geçersiz veya yetkisiz. Lütfen FAL_KEY'i kontrol edin ve fal.ai dashboard'unuzdan yeni bir key alın.",
          },
          { status: 403 },
        )
      }

      throw falError
    }

    console.log("[v0] Veo3 result:", JSON.stringify(result, null, 2))

    if (!result.data) {
      console.error("[v0] No data in response:", result)
      return Response.json({ error: "Video oluşturulamadı. Lütfen tekrar deneyin." }, { status: 500 })
    }

    console.log("[v0] Video generated successfully!")

    let videoUrl
    if (typeof result.data.video === "string") {
      videoUrl = result.data.video
    } else if (result.data.video && result.data.video.url) {
      videoUrl = result.data.video.url
    } else if (result.data.url) {
      videoUrl = result.data.url
    } else {
      console.error("[v0] Unexpected response structure:", result.data)
      return Response.json({ error: "Video oluşturulamadı. Lütfen tekrar deneyin." }, { status: 500 })
    }

    return Response.json({
      video: videoUrl,
      videoName: `stylescape-video-${Date.now()}.mp4`,
    })
  } catch (error) {
    console.error("[v0] Video generation error:", error)
    console.error("[v0] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.",
      },
      { status: 500 },
    )
  }
}
