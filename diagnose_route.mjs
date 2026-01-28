import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    console.log("--- Starting Diagnosis Simulation ---");
    const fullPrompt = "Professional fashion model showcasing outfit with smooth, natural movements. Style: profesyonel. Camera motion: orta. Professional studio lighting, cinematic quality, high-end fashion photography. Smooth and elegant movement.";

    try {
        // 1. Write Temp File
        const tempFilePath = path.join(os.tmpdir(), `veo_diag_${Date.now()}.png`);
        console.log("1. Writing temp file:", tempFilePath);
        fs.writeFileSync(tempFilePath, Buffer.from(base64Image, 'base64'));

        // 2. Upload
        console.log("2. Uploading to Files API...");
        let fileUri;
        try {
            const uploadResult = await ai.files.upload({
                file: tempFilePath,
                config: { mimeType: "image/png" }
            });
            console.log("Upload result keys:", Object.keys(uploadResult));
            fileUri = uploadResult.file ? uploadResult.file.uri : uploadResult.uri;
            console.log("File URI:", fileUri);
        } catch (e) {
            console.error("Upload failed", e);
            return;
        }

        // 3. Generate
        console.log("3. Calling generateVideos...");
        const response = await ai.models.generateVideos({
            model: "veo-3.1-generate-preview",
            prompt: fullPrompt,
            image_uri: fileUri,
            config: {
                aspectRatio: "16:9",
                resolution: "720p",
            }
        });

        console.log("Response Type:", typeof response);
        if (response) console.log("Response keys:", Object.keys(response));

        // 4. Access Name
        const operationName = response.name;
        console.log("SUCCESS! Operation Name:", operationName);

        // 5. Poll for completion to see result structure
        console.log("5. Polling for completion...");
        let done = false;
        let result = null;
        let opStatus = null;

        while (!done) {
            await new Promise(r => setTimeout(r, 10000));
            opStatus = await (ai.operations).getVideosOperationInternal({
                operationName: operationName,
            });
            console.log("Poll status:", opStatus.done ? "DONE" : "STILL PROCESSING...");
            if (opStatus.done) {
                done = true;
                result = opStatus.result || opStatus.response;
            }
        }

        console.log("\n--- COMPLETE OPERATION STATUS ---");
        console.log(JSON.stringify(opStatus, null, 2));

        console.log("\n--- RESULT STRUCTURE ---");
        console.log(JSON.stringify(result, null, 2));

        if (result && result.generatedVideos) {
            console.log("Success! Found", result.generatedVideos.length, "videos");
            const vid = result.generatedVideos[0];
            console.log("Video keys:", Object.keys(vid));
            const bytes = vid.videoBytes || vid.data || (vid.video && vid.video.videoBytes);
            console.log("Video bytes found:", !!bytes);
        } else {
            console.log("FAIL: No generatedVideos in result.");
        }

    } catch (e) {
        console.log("\n!!! ERROR CAUGHT !!!");
        console.log("Message:", e.message);
        console.log("Stack:", e.stack);
        console.log("Object:", JSON.stringify(e, null, 2));
    }
}

run();
