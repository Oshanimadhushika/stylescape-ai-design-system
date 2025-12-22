import { experimental_generateImage } from "ai"

export const maxDuration = 30

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
    } = await req.json()

    if (!description) {
      return Response.json({ error: "Açıklama gereklidir" }, { status: 400 })
    }

    const contextPrompt = `PROFESSIONAL FASHION MODEL GENERATION - DETAILED SPECIFICATIONS

CRITICAL CONSISTENCY REQUIREMENTS:
- Generate a high-resolution, professional fashion model photograph suitable for e-commerce virtual try-on applications
- Maintain photorealistic quality with studio-grade lighting and professional photography standards
- The model must be positioned for optimal clothing overlay and virtual try-on compatibility

PHYSICAL SPECIFICATIONS (MUST BE EXACT):
- Gender: ${gender}
- Age Range: ${ageRange} years old
- Height Classification: ${height}
- Body Type: ${bodyType} build
- Clothing Size: ${clothingSize} (Turkish sizing)
- Skin Tone: ${skinTone} complexion with natural, even skin texture
- Hair Color: ${hairColor}
- Hair Style: ${hairStyle}

POSE AND POSITIONING (CRITICAL FOR TRY-ON):
- Pose Type: ${pose}
- Body should be fully visible from head to below knees
- Arms should be positioned naturally, slightly away from body for clothing visibility
- Hands should be relaxed and neutral
- Facial expression: confident, professional, neutral smile
- Direct eye contact with camera for frontal poses

ENVIRONMENT AND LIGHTING:
- Background: ${environment}
- Lighting: Professional three-point studio lighting setup
- No harsh shadows on body (critical for try-on applications)
- Even, flattering illumination across entire figure
- High dynamic range for clothing detail preservation

CLOTHING (NEUTRAL BASE FOR TRY-ON):
- Solid color, form-fitting base outfit (tank top/simple top + fitted pants or shorts)
- Colors: neutral tones (white, gray, beige, black)
- No patterns, logos, or complex details
- Clothing should clearly show body proportions for accurate virtual try-on

TECHNICAL SPECIFICATIONS:
- Resolution: Minimum 1024x1536 pixels (2:3 aspect ratio)
- Focus: Sharp, professional focus on model
- Color accuracy: Natural, color-calibrated
- No grain, artifacts, or compression issues

STYLE DIRECTION:
- Overall aesthetic: ${style}
- Professional fashion photography standards
- Suitable for ${gender === "kadın" ? "women's" : gender === "erkek" ? "men's" : "unisex"} fashion brand campaigns

USER'S ADDITIONAL NOTES:
${description}

CONSISTENCY NOTE: This model's specifications must be saved and maintained for future try-on sessions to ensure brand consistency.

OUTPUT: A single, professional-quality photograph meeting all above specifications.`

    console.log("[v0] Generating image with prompt length:", contextPrompt.length)

    const { image } = await experimental_generateImage({
      model: "google/gemini-2.5-flash-image",
      prompt: contextPrompt,
    })

    console.log("[v0] Image generated successfully")

    return Response.json({
      image: image.base64,
    })
  } catch (error) {
    console.error("[v0] Model generation error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Error details:", errorMessage)
    return Response.json({ error: `Görsel oluşturulamadı: ${errorMessage}` }, { status: 500 })
  }
}
