import { GoogleGenAI } from "@google/genai"

export const maxDuration = 60 // Maximum allowed by Vercel

export async function POST(req: Request) {
  try {
    const { modelImage, prompt, duration, motion, style } = await req.json()

    if (!modelImage) {
      return Response.json({ error: "Manken resmi gereklidir" }, { status: 400 })
    }

    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY environment variable gereklidir" }, { status: 500 })
    }

    console.log("[v0] Starting video generation with Google Veo 3.1...")

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    // Build comprehensive prompt
    const fullPrompt = `Professional fashion video: ${prompt || "Model showcasing outfit with professional movements"}
Style: ${style}
Motion speed: ${motion}
Camera work: Professional studio lighting, high-quality cinematography
Duration: ${duration || 5} seconds`

    console.log("[v0] Veo prompt:", fullPrompt)

    // Start video generation operation
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview", // Using fast preview model
      prompt: fullPrompt,
      config: {
        aspectRatio: "9:16", // Vertical video for social media
        resolution: "720p",
        // You can add image_url for image-to-video when available
      },
    })

    console.log("[v0] Video generation started, polling for completion...")

    // Poll until video is ready (max 4 minutes)
    const maxAttempts = 24 // 24 attempts * 10 seconds = 4 minutes
    let attempts = 0

    while (!operation.done && attempts < maxAttempts) {
      console.log("[v0] Waiting for video generation... Attempt", attempts + 1)
      await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds

      operation = await ai.operations.getVideosOperation({
        operation: operation,
      })

      attempts++
    }

    if (!operation.done) {
      console.error("[v0] Video generation timeout")
      return Response.json({ error: "Video oluşturma zaman aşımına uğradı. Lütfen tekrar deneyin." }, { status: 500 })
    }

    if (!operation.response?.generatedVideos?.[0]?.video) {
      console.error("[v0] No video in response:", operation)
      return Response.json({ error: "Video oluşturulamadı. Lütfen tekrar deneyin." }, { status: 500 })
    }

    console.log("[v0] Video generated successfully!")

    // Get the video file URI
    const videoUri = operation.response.generatedVideos[0].video.uri

    return Response.json({
      video: videoUri,
      videoName: operation.response.generatedVideos[0].video.name,
    })
  } catch (error) {
    console.error("[v0] Video generation error:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.",
      },
      { status: 500 },
    )
  }
}
