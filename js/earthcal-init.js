// Register the service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        const betaTestingEnabled = window.EARTHCAL_BETA_TESTING?.enabled === true;

        if (betaTestingEnabled) {
            console.info("EARTHCAL beta testing mode enabled – skipping service worker registration and clearing caches.");

            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((registration) => registration.unregister()));
            } catch (err) {
                console.warn("Failed to unregister existing service workers during beta cleanup.", err);
            }

            if ("caches" in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
                } catch (err) {
                    console.warn("Failed to clear caches during beta cleanup.", err);
                }
            }

            return;
        }

        navigator.serviceWorker
            .register("js/service-worker.js?v=3.1")
            .then(
                function (registration) {
                    console.log(
                        "ServiceWorker registration successful with scope:",
                        registration.scope
                    );
                },
                function (error) {
                    console.log("ServiceWorker registration failed:", error);
                }
            );
    });
}

document.addEventListener("DOMContentLoaded", initCalendar);

async function initCalendar() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
        spinner.classList.remove("hidden");
    }

    const scripts = [
        "js/suncalc.min.js",
        "js/astronomy.browser.js",
        "js/core-javascripts.js?v=7",
        "js/1-gcal-javascripts.js?v=3.0",
        "js/breakouts.js",
        "js/set-targetdate.js",
        "js/planet-orbits.js",
        "js/login-scripts.js?v=16.1",
        "js/item-management.js?v=9.3",
        "js/time-setting.js?v=1.2",
        "js/calendar-scripts.js?v=2.3",
    ];

    try {
        try {
            const response = await fetch("cals/earthcal-v1-0.svg");
            const svg = await response.text();
            const calContainer = document.getElementById("the-cal");
            if (calContainer) {
                calContainer.innerHTML = svg;
            }
        } catch (err) {
            console.error("Failed to load SVG", err);
        }

        await Promise.all(
            scripts.map((src) =>
                fetch(src).catch((err) =>
                    console.error("Preload failed for", src, err)
                )
            )
        );

        for (const src of scripts) {
            await new Promise((resolve) => {
                const s = document.createElement("script");
                s.src = src;
                s.onload = resolve;
                s.onerror = () => {
                    console.error("Failed to load script:", src);
                    resolve();
                };
                document.head.appendChild(s);
            });
        }

        const moduleScript = document.createElement("script");
        moduleScript.type = "module";
        moduleScript.src = "js/dark-mode-toggle.mjs.js";
        document.head.appendChild(moduleScript);

        if (typeof initializePage === "function") {
            initializePage();
        }
    } catch (err) {
        console.error("Initialization error:", err);
    } finally {
        if (spinner) {
            spinner.classList.add("hidden");
        }
    }
}

