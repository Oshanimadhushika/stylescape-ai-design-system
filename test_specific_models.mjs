import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

async function testModels() {
    const envPath = path.resolve('.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)=(.*)$/m);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const testCases = [
        { name: "gemini-flash-latest", type: "content" },
        { name: "gemini-2.0-flash", type: "content" },
        { name: "imagen-3.0-generate-001", type: "image" },
        { name: "imagen-4.0-generate-001", type: "image" },
        { name: "imagen-4.0-fast-generate-001", type: "image" }
    ];

    for (const test of testCases) {
        process.stdout.write(`Testing ${test.name}... `);
        try {
            if (test.type === "content") {
                const response = await ai.models.generateContent({
                    model: test.name,
                    contents: [{ role: "user", parts: [{ text: "hi" }] }]
                });
                console.log("OK ✅");
            } else {
                try {
                    const response = await ai.models.generateImages({
                        model: test.name,
                        prompt: "a miniature cat",
                        config: { numberOfImages: 1 }
                    });
                    console.log("OK ✅");
                } catch (e) {
                    const msg = e.message || JSON.stringify(e);
                    if (msg.includes("not found")) {
                        console.log("404 ❌");
                    } else if (msg.includes("Billing") || msg.includes("billing") || msg.includes("quota")) {
                        console.log(`Billing/Quota issue: ${msg.substring(0, 100)}... ⚠️`);
                    } else {
                        console.log(`Error: ${msg.substring(0, 100)}... ❓`);
                    }
                }
            }
        } catch (error) {
            const msg = error.message || JSON.stringify(error);
            console.log(`Error: ${msg.substring(0, 100)}... ❌`);
        }
    }
}

testModels();
