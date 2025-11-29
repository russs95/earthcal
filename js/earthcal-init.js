// Register the service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
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
        "js/core-javascripts.js?v=23.3",
        "js/1-gcal-javascripts.js?v=3.2",
        "js/breakouts.js",
        "js/set-targetdate.js",
        "js/planet-orbits.js",
        "js/login-scripts.js?v=18",
        "js/item-management.js?v=9.7",
        "js/time-setting.js?v=1.3",
        "js/calendar-scripts.js?v=2.5",
    ];

    try {
        try {
            const response = await fetch("cals/earthcal-v1-0-3.svg?v=8");
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

