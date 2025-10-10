const EARTHCAL_ASSET_VERSION =
    window.EARTHCAL_ASSET_VERSION !== undefined
        ? window.EARTHCAL_ASSET_VERSION
        : 1;

const versionedUrl =
    typeof window.versionedUrl === "function"
        ? window.versionedUrl
        : function fallbackVersionedUrl(url) {
              const [path, query = ""] = url.split("?");
              const filteredQuery = query
                  .split("&")
                  .filter((part) => part && !/^v=/.test(part))
                  .join("&");
              const separator = filteredQuery ? "&" : "";
              return `${path}?${filteredQuery}${separator}v=${EARTHCAL_ASSET_VERSION}`;
          };

window.versionedUrl = versionedUrl;

// Register the service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker
            .register(versionedUrl("js/service-worker.js"))
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
        "js/core-javascripts.js",
        "js/breakouts.js",
        "js/set-targetdate.js",
        "js/planet-orbits.js",
        "js/login-scripts.js",
        "js/item-management.js",
        "js/time-setting.js",
        "js/calendar-scripts.js",
    ].map((src) => versionedUrl(src));

    try {
        try {
            const response = await fetch(versionedUrl("cals/earthcal-v1-0.svg"));
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
        moduleScript.src = versionedUrl("js/dark-mode-toggle.mjs.js");
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

