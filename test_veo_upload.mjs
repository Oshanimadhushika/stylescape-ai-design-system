import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

let apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    try {
        const envPath = path.resolve('.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)=(.*)$/m);
            if (match) {
                apiKey = match[1].trim();
            }
        }
    } catch (e) {
        console.error(e);
    }
}

const ai = new GoogleGenAI({ apiKey });
const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function run() {
    console.log("1. Saving temp image...");
    const tempFile = "temp_test_image.png";
    fs.writeFileSync(tempFile, Buffer.from(base64Image, 'base64'));

    try {
        console.log("2. Uploading to Gemini Files...");
        const uploadResult = await ai.files.upload({
            file: tempFile,
            config: {
                mimeType: "image/png",
                displayName: "Test Image"
            }
        });

        console.log("Upload Result:", JSON.stringify(uploadResult, null, 2));

        const fileUri = uploadResult.file ? uploadResult.file.uri : uploadResult.uri;

        if (!fileUri) {
            throw new Error("Could not find file URI in upload result");
        }

        console.log("Upload Success! URI:", fileUri);
        console.log("State:", uploadResult.state); // Fixed access

        console.log("3. Calling generateVideos with URI...");

        // Wait for file specifically if needed? Usually for image it's fast.
        // For video inputs, ACTIVE state is needed. For image, maybe okay?
        // But SDK usually handles wait? Or we check it.

        const response = await ai.models.generateVideos({
            model: "veo-3.1-generate-preview",
            prompt: "A moving white pixel",
            image: {
                uri: fileUri,
                mimeType: "image/png"
            }
        });

        console.log("SUCCESS! Operation:", response.name);

    } catch (e) {
        console.log("Error:", e.message);
        if (e.status) console.log("Status:", e.status);
    }
}

run();
