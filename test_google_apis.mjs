async function run() {
    console.log("Testing fetch(https://www.googleapis.com/discovery/v1/apis)...");
    try {
        const resp = await fetch("https://www.googleapis.com/discovery/v1/apis");
        console.log("Status:", resp.status);
        if (resp.status === 200) {
            console.log("✅ Success! Google APIs are reachable.");
        }
    } catch (e) {
        console.log("❌ FAILED:");
        console.log("Message:", e.message);
    }
}

run();
