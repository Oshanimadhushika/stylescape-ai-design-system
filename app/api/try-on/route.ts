import { generateText } from "ai"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { modelImage, clothingImage, modelContext, studioSettings } = await req.json()

    if (!modelImage || !clothingImage) {
      return Response.json({ error: "Hem manken hem de kıyafet resmi gereklidir" }, { status: 400 })
    }

    const poseDescriptions: Record<string, string> = {
      "front-straight":
        "standing straight facing camera, arms at sides naturally, professional product photography pose",
      "casual-confident":
        "relaxed confident stance, one hand in pocket or on hip, natural body language, approachable posture",
      "dynamic-movement": "mid-stride walking or turning motion, natural movement captured, energetic and lively",
      "elegant-poised": "elegant upright posture, refined positioning, sophisticated and graceful stance",
      "relaxed-natural": "casual comfortable pose, natural everyday positioning, authentic and genuine expression",
      "three-quarter": "body turned 45 degrees, face toward camera, classic fashion photography angle",
      "walking-stride": "captured mid-walk, natural gait, dynamic forward motion",
    }

    const angleDescriptions: Record<string, string> = {
      "eye-level": "camera at eye level, straight horizontal view, neutral perspective",
      "slightly-above": "camera slightly above subject, flattering downward angle, editorial style",
      "slightly-below": "camera slightly below subject, empowering upward angle, heroic perspective",
      "high-angle": "elevated camera position, full body view from above, fashion lookbook style",
      "low-angle": "low camera position looking up, dramatic powerful perspective",
    }

    const lightingDescriptions: Record<string, string> = {
      "soft-even":
        "soft even studio lighting, minimal shadows, professional product photography illumination, clean and bright",
      "dramatic-side":
        "strong directional side lighting, defined shadows, high contrast, editorial fashion magazine style",
      "natural-bright": "bright natural daylight, soft shadows, fresh outdoor feeling, commercial photography quality",
      "soft-glamour": "beauty lighting setup, flattering soft shadows, luxury brand aesthetic, polished and refined",
      "natural-golden": "warm golden hour sunlight, soft glowing light, lifestyle photography atmosphere",
      "studio-professional":
        "three-point lighting setup, perfectly balanced, commercial quality, flawless illumination",
      "backlit-rim": "backlit with rim lighting, silhouette edges highlighted, artistic and sophisticated",
    }

    const environmentDescriptions: Record<string, string> = {
      "white-backdrop": "clean pure white seamless backdrop, professional studio environment, e-commerce standard",
      "minimal-studio":
        "minimalist studio setting, neutral tones, contemporary fashion photography aesthetic, uncluttered",
      "urban-lifestyle": "modern urban environment, street style setting, authentic lifestyle photography context",
      "elegant-backdrop": "sophisticated backdrop with subtle texture, luxury brand setting, refined atmosphere",
      "outdoor-natural": "natural outdoor setting, organic environment, lifestyle editorial style, authentic context",
      "neutral-gray": "neutral gray backdrop, professional photography standard, timeless and versatile",
      "luxury-interior": "upscale interior setting, premium brand environment, sophisticated luxury atmosphere",
    }

    const settings = studioSettings || {}
    const poseDetail = poseDescriptions[settings.pose] || poseDescriptions["front-straight"]
    const angleDetail = angleDescriptions[settings.angle] || angleDescriptions["eye-level"]
    const lightingDetail = lightingDescriptions[settings.lighting] || lightingDescriptions["soft-even"]
    const environmentDetail = environmentDescriptions[settings.environment] || environmentDescriptions["white-backdrop"]

    const consistencyPrompt = `PROFESSIONAL VIRTUAL TRY-ON TASK - STYLESCAPE STUDIO QUALITY

OBJECTIVE:
Create a photorealistic fashion photography image by seamlessly placing the clothing item from IMAGE 2 onto the model shown in IMAGE 1, following professional studio specifications.

${modelContext ? `\nMODEL IDENTITY (MAINTAIN EXACTLY):\n${modelContext}\n` : ""}

STUDIO PHOTOGRAPHY SPECIFICATIONS:

1. POSE & COMPOSITION:
   ${poseDetail}
   - Maintain natural body language and authentic expression
   - Ensure pose enhances clothing presentation

2. CAMERA ANGLE:
   ${angleDetail}
   - Professional fashion photography framing
   - Flattering perspective for both model and clothing

3. LIGHTING SETUP:
   ${lightingDetail}
   - Professional color grading and exposure
   - Consistent with high-end fashion photography

4. ENVIRONMENT & BACKDROP:
   ${environmentDetail}
   - Professional production quality setting
   - Appropriate for luxury brand marketing

CRITICAL TECHNICAL REQUIREMENTS:

CLOTHING INTEGRATION:
- Seamlessly fit clothing to model's exact body proportions
- Maintain clothing's original texture, pattern, color, and material properties
- Natural fabric draping following gravity and body contours
- Perfect alignment with selected pose and body position
- Realistic wrinkles and fabric behavior

MODEL CONSISTENCY:
- Preserve ALL model characteristics from original image
- Keep face, skin tone, hair, and body features IDENTICAL
- Maintain original model's ethnic features and physical attributes
- DO NOT alter model's appearance in any way

PHOTOGRAPHIC QUALITY:
- Professional e-commerce and editorial quality output
- Sharp focus, proper depth of field
- Color accuracy matching professional fashion photography
- No visible artifacts, distortion, or AI-generated flaws
- Ready for immediate commercial use

BRAND STANDARDS:
- StyleScape professional studio quality
- Suitable for luxury brand marketing materials
- High-end fashion catalog presentation
- Instagram and e-commerce ready

OUTPUT:
Single professional photograph showing the model wearing the clothing in the specified studio setup, indistinguishable from a real professional fashion photoshoot.`

    const result = await generateText({
      model: "google/gemini-3-pro-image-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: consistencyPrompt },
            {
              type: "image",
              image: modelImage,
            },
            {
              type: "image",
              image: clothingImage,
            },
          ],
        },
      ],
      maxOutputTokens: 2000,
    })

    const images = []
    for (const file of result.files) {
      if (file.mediaType.startsWith("image/")) {
        images.push({
          base64: file.base64,
          mediaType: file.mediaType,
        })
      }
    }

    if (images.length === 0) {
      return Response.json({ error: "Try-on işlemi tamamlanamadı. Lütfen tekrar deneyin." }, { status: 500 })
    }

    return Response.json({
      result: `data:${images[0].mediaType};base64,${images[0].base64}`,
      usage: result.usage,
    })
  } catch (error) {
    console.error("[v0] Try-on error:", error)
    return Response.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 })
  }
}
