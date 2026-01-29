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

async function run() {
    console.log("Testing manual fetch upload to Gemini Files API...");
    const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

    // Create a tiny 1x1 png
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(base64Image, 'base64');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Protocol': 'multipart',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file: {
                    display_name: "Manual Test",
                }
            })
        });

        console.log("Initial Response Status:", response.status);
        const data = await response.json();
        console.log("Data:", JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log("✅ Success! Initial handshake works.");
        }
    } catch (e) {
        console.log("❌ FAILED:");
        console.log("Message:", e.message);
    }
}

run();
