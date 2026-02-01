// -------------------- SERVICE WORKER --------------------
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                "js/service-worker.js?v=3.3"
            );
            console.log("ServiceWorker registration successful with scope:", registration.scope);
        } catch (error) {
            console.log("ServiceWorker registration failed:", error);
        }
    });
}

// Start init as soon as DOM exists
document.addEventListener("DOMContentLoaded", initCalendar);

// -------------------- HELPERS --------------------
function preloadScript(src) {
    return new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "script";
        link.href = src;
        link.onload = resolve;
        link.onerror = () => resolve(); // don't block
        document.head.appendChild(link);
    });
}

function loadScriptSequential(src) {
    return new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = src;
        s.defer = true; // keep execution ordered while not blocking parsing
        s.onload = resolve;
        s.onerror = () => {
            console.error("Failed to load script:", src);
            resolve(); // don't block init
        };
        document.head.appendChild(s);
    });
}

async function loadSvgIntoContainer(url, containerId) {
    try {
        const response = await fetch(url);
        const svg = await response.text();
        const calContainer = document.getElementById(containerId);
        if (calContainer) calContainer.innerHTML = svg;
    } catch (err) {
        console.error("Failed to load SVG", err);
    }
}

// -------------------- MAIN INIT --------------------
async function initCalendar() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) spinner.classList.remove("hidden");

    /**
     * IMPORTANT:
     * Put planet-orbits early so that initializePage() can call animatePlanets()
     * without "not found" warnings.
     */
    const scripts = [
        // libs / fundamentals
        "js/suncalc.min.js",
        "js/sync-store.js?v=2.1",
        "js/astronomy.browser.js",

        // core app
        "js/core.js?v=1",
        "js/1-gcal-javascripts.js?v=3.21",
        "js/breakouts.js",

        // date + time (these often influence targetDate/startDate)
        "js/set-targetdate.js?v=1",
        "js/time-setting.js?v=9",

        // ✅ planet animation engine BEFORE calendar scripts call refresh/animate
        "js/planet-orbits.js?v=8.2",
        // rest of app
        "js/login-scripts.js?v=20.2",
        "js/item-management.js?v=9.98",
        "js/calendar-scripts.js?v=2.7",
    ];

    try {
        // 1) Load SVG first so elements exist when scripts start wiring listenerss
        await loadSvgIntoContainer("cals/earthcal-v1-2-2.svg?v=21.1", "the-cal");

        // 2) Preload scripts (real preload links, not fetch)
        await Promise.all(scripts.map(preloadScript));

        // 3) Load scripts in order (critical!)
        for (const src of scripts) {
            await loadScriptSequential(src);
        }

        // 4) Module script(s)hjhjjk
        const moduleScript = document.createElement("script");
        moduleScript.type = "module";
        moduleScript.src = "js/dark-mode-toggle.mjs.js";
        document.head.appendChild(moduleScript);

        // 5) Start your normal flow
        if (typeof initializePage === "function") {
            initializePage();
        } else {
            console.warn("initializePage() is not defined after initCalendar()");
        }
    } catch (err) {
        console.error("Initialization error:", err);
    } finally {
        if (spinner) spinner.classList.add("hidden");
    }
}
