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
const fileUri = "https://generativelanguage.googleapis.com/v1beta/files/eqfrrs754j41";

async function run() {
    console.log("Testing generateVideos + Polling...");

    try {
        // 1. Generate
        console.log("Calling generateVideos...");
        const response = await ai.models.generateVideos({
            model: "veo-3.1-generate-preview",
            prompt: "A moving white pixel",
            image_uri: fileUri,
        });

        const opName = response.name;
        console.log("Operation Name:", opName);

        if (!opName) throw new Error("No op name");

        // Inspect get() source
        if (ai.operations.get) {
            console.log("\n--- Source of operations.get ---");
            console.log(ai.operations.get.toString());
        }

        // 2. Poll intentionally with WRAPPER
        console.log("\n--- Attempting poll with { operation: { name } } ---");
        try {
            const status1 = await ai.operations.get({ operation: { name: opName } });
            console.log("WRAPPER poll success:", status1);
        } catch (e) {
            console.log("WRAPPER poll failed:", e.message);
        }

        // 3. Try getVideosOperation
        console.log("\n--- Attempting getVideosOperation ---");
        try {
            // It might differ in name or args
            if (ai.operations.getVideosOperation) {
                const status3 = await ai.operations.getVideosOperation({ name: opName });
                console.log("getVideosOperation poll success:", status3);
            } else {
                console.log("getVideosOperation not found");
            }
        } catch (e) {
            console.log("getVideosOperation failed:", e.message);
        }

        // 4. Try getVideosOperationInternal
        console.log("\n--- Attempting getVideosOperationInternal ---");
        try {
            // Inspect args from get source: { operationName: operation.name, config: config }
            const rawOp = await ai.operations.getVideosOperationInternal({
                operationName: opName
            });
            console.log("INTERNAL poll success:", JSON.stringify(rawOp, null, 2));
        } catch (e) {
            console.log("INTERNAL poll failed:", e.message);
        }

    } catch (e) {
        console.log("Main Error:", e.message);
    }
}

run();
