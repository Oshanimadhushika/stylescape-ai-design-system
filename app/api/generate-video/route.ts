import { fal } from "@fal-ai/client"

export const maxDuration = 60 // Maximum allowed by Vercel

export async function POST(req: Request) {
  try {
    const { modelImage, prompt, duration, motion, style } = await req.json()

    if (!modelImage) {
      return Response.json({ error: "Manken resmi gereklidir" }, { status: 400 })
    }

    if (!process.env.FAL_KEY) {
      return Response.json({ error: "FAL_KEY environment variable gereklidir" }, { status: 500 })
    }

    console.log("[v0] Starting video generation with fal.ai Veo3...")

    // Configure fal client
    fal.config({
      credentials: process.env.FAL_KEY,
    })

    const fullPrompt = `${prompt || "Professional model showcasing fashion outfit with smooth, natural movements"}. ${style ? `Style: ${style}.` : ""} ${motion ? `Camera motion: ${motion}.` : ""} Professional studio lighting, cinematic quality, high-end fashion photography.`

    console.log("[v0] Veo3 prompt:", fullPrompt)
    console.log("[v0] Model image:", modelImage.substring(0, 100) + "...")

    const result = await fal.subscribe("fal-ai/veo3/fast/image-to-video", {
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
