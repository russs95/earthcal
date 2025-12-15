#!/usr/bin/env bash
set -e

# Always run from the directory this script lives in
cd "$(dirname "$0")"

echo "[EarthCal] Preparing public/ directory for packaging..."

rm -rf public
mkdir -p public

cp ../index.html public/
cp ../dash.html public/
cp ../billing-success.html public/
cp ../login.html public/
cp ../share.html public/
cp ../site.webmanifest public/

cp -r ../assets public/
cp -r ../auth public/
cp -r ../cals public/
cp -r ../css public/
cp -r ../js public/
cp -r ../svgs public/
cp -r ../translations public/

echo "[EarthCal] public/ ready."
 npx electron-packager . earthcal --platform=linux --arch=x64 --out=./ --overwrite --prune=true