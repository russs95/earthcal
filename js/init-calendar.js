const spinner = document.getElementById('loading-spinner');
if (spinner) {
  spinner.style.display = 'block';
}

async function loadSVG() {
  const response = await fetch('cals/earthcal-v1.0.svg');
  if (!response.ok) {
    throw new Error('Failed to fetch SVG');
  }
  const svgText = await response.text();
  const container = document.getElementById('the-cal');
  if (container) {
    container.innerHTML = svgText;
  }
}

function preloadAssets(urls) {
  const head = document.head;
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = url;
    head.appendChild(link);
  });
}

async function loadScriptsSequentially(urls) {
  for (const url of urls) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      if (url.endsWith('.mjs.js')) {
        script.type = 'module';
      }
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
}

async function init() {
  try {
    await loadSVG();
    const assets = [
      'js/gsap.min.js',
      'js/MotionPathPlugin.min.js',
      'js/suncalc.min.js',
      'js/astronomy.browser.js',
      'js/hijri-js.common.min.js',
      'js/core-javascripts.js?v=2',
      'js/breakouts.js',
      'js/set-targetdate.js',
      'js/1-lunar-scripts.js',
      'js/planet-orbits.js',
      'js/login-scripts.js',
      'js/time-setting.js',
      'js/1-event-management.js?v=2',
      'js/calendar-scripts.js',
      'js/kin-cycles.js',
      'js/dark-mode-toggle.mjs.js'
    ];
    preloadAssets(assets);
    await loadScriptsSequentially(assets);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('js/service-worker.js?v=3.0')
          .then((registration) => {
            console.log('ServiceWorker registration successful with scope:', registration.scope);
          })
          .catch((error) => {
            console.log('ServiceWorker registration failed:', error);
          });
      });
    }
  } catch (err) {
    console.error('Failed to initialize calendar:', err);
  } finally {
    if (spinner) {
      spinner.style.display = 'none';
    }
  }
}

init();
