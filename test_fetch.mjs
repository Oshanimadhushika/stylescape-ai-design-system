async function run() {
    console.log("Testing fetch(https://www.google.com)...");
    try {
        const resp = await fetch("https://www.google.com");
        console.log("Status:", resp.status);
        console.log("✅ Success! Internet is reachable.");
    } catch (e) {
        console.log("❌ FAILED:");
        console.log("Message:", e.message);
    }
}

run();
