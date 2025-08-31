// Register the service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker
            .register("js/service-worker.js?v=3.0")
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

// Load required scripts sequentially
const scripts = [
    "js/gsap.min.js",
    "js/MotionPathPlugin.min.js",
    "js/suncalc.min.js",
    "js/astronomy.browser.js",
    "js/hijri-js.common.min.js",
    "js/core-javascripts.js?v=2",
    "js/breakouts.js",
    "js/set-targetdate.js",
    "js/1-lunar-scripts.js",
    "js/planet-orbits.js",
    "js/login-scripts.js",
    "js/time-setting.js",
];

function loadScriptsSequentially(index) {
    if (index >= scripts.length) {
        const moduleScript = document.createElement("script");
        moduleScript.type = "module";
        moduleScript.src = "js/dark-mode-toggle.mjs.js";
        moduleScript.async = true;
        document.head.appendChild(moduleScript);
        return;
    }
    const s = document.createElement("script");
    s.src = scripts[index];
    s.onload = () => loadScriptsSequentially(index + 1);
    document.head.appendChild(s);
}

loadScriptsSequentially(0);
