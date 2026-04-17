// ==================== BETA TESTING FLAGS ====================
// Toggle Jedi plan features ON for all users (logged in or not).
// Flip to false before any production deployment.
window.BETA_JEDI_MODE = true;
// ============================================================

// -------------------- SERVICE WORKER --------------------
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                "js/service-worker.js?v=5.7"
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
        if (calContainer) {
            calContainer.innerHTML = svg;
            // Apply inline CSS to the embedded SVG so it always fills its container.
            // Optimized SVGs may omit explicit width/height attributes — this ensures
            // any future optimized calendar SVG renders correctly without modification.
            const svgEl = calContainer.querySelector('svg');
            if (svgEl) {
                svgEl.style.width = '100%';
                svgEl.style.height = '100%';
            }
        }
    } catch (err) {
        console.error("Failed to load SVG", err);
    }
}

// -------------------- MAIN INIT --------------------
async function initCalendar() {
    // Resolve app version from version.json — single source of truth.
    // No cache-busting needed: fetched fresh every boot.
    try {
        const vr = await fetch('version.json', { cache: 'no-store' });
        if (vr.ok) {
            const vd = await vr.json();
            if (vd && vd.version) window.EARTHCAL_APP_VERSION = vd.version;
        }
    } catch (_) { /* non-fatal — version remains undefined */ }

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
        "js/auspicer.js?v=3.8",
        "js/auspices/biodynamic_council.js?v=1.0",
        "js/auspices/ancestral_examples.js?v=1.0",
        "js/sync-store.js?v=2.5",
        "js/astronomy.browser.js",

        // core app
        "js/core.js?v=5.3",
        "js/1-gcal-javascripts.js?v=3.23",
        "js/breakouts.js",

        // date + time (these often influence targetDate/startDate)
        "js/set-targetdate.js?v=1.1",
        "js/time-setting.js?v=11.9",

        // ✅ planet animation engine BEFORE calendar scripts call refresh/animate
        "js/planet-orbits.js?v=9.4",
        // rest of app
        "js/login-scripts.js?v=23.2",
        "js/item-management.js?v=12.0",
        "js/calendar-scripts.js?v=3.1",
    ];

    try {
        // 1) Load SVG first so elements exist when scripts start wiring listenerss
        await loadSvgIntoContainer("cals/earthcal-v1-3-8o.svg?v=1.0", "the-cal");

        // 2) Preload scripts (real preload links, not fetch)
        await Promise.all(scripts.map(preloadScript));

        // 3) Load scripts in order (critical!)
        for (const src of scripts) {
            await loadScriptSequential(src);
        }

        // 4) Module script(s)
        const moduleScript = document.createElement("script");
        moduleScript.type = "module";
        moduleScript.src = "js/dark-mode-toggle.mjs.js";
        document.head.appendChild(moduleScript);

        // 5) Start your normal flow — await so the spinner persists until getUserData() completes
        if (typeof initializePage === "function") {
            await initializePage();
        } else {
            console.warn("initializePage() is not defined after initCalendar()");
        }
    } catch (err) {
        console.error("Initialization error:", err);
    } finally {
        if (spinner) spinner.classList.add("hidden");
        document.getElementById("boot-overlay")?.remove();
    }
}
