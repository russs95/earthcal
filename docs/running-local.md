
ssh earthen@103.185.52.122
sudo deploy-earthcal

Since the site is mostly static JS/SVG for the animation parts, the simplest options are:

Option 1 — Python (zero install, fastest)

cd /home/ubuntusitubondo/WebstormProjects/earthcal
python3 -m http.server 8080
Then open: http://localhost:8080/dash.html

Works for: planet animation, SVG rendering, all JS. Won't work: API calls (PHP), auth, sync.

  ---
Option 2 — PHP built-in server (if PHP is installed)

cd /home/ubuntusitubondo/WebstormProjects/earthcal
php -S localhost:8080
Then open: http://localhost:8080/dash.html

Works for: everything including /api/v1/ PHP endpoints (if MySQL is configured).

Check if PHP is available:
php --version

  ---
Option 3 — Node (if installed)

npx serve /home/ubuntusitubondo/WebstormProjects/earthcal -p 8080

  ---
For testing just the animation

Since the planet animation doesn't need auth or the API, Option 1 (Python) is fastest. The one gotcha: dash.html normally requires login, so either:

1. Open the browser console after loading dash.html and manually call:
   window.initPlanetAnimator();
   window.animatePlanets(new Date('2026-01-01'), new Date('2026-06-15'));
2. Or temporarily comment out the auth redirect in js/login-scripts.js to let the page load fully.