User approved Claude's plan
⎿  Plan saved to: ~/.claude/plans/recursive-crunching-aurora.md · /plan to edit
EarthCal Snap Size Reduction — Analysis & Strategy

     Context

     Current snap: earthcal_1.3.3_amd64.snap = 115 MB
     Packaged Electron app source: 248 MB
     The snap is large due to a combination of an outdated toolchain, all Chromium locales being bundled, unnecessary files leaking into the package, and an
     old Electron version.

     ---
     Issues Found (Ordered by Impact)

     1. Outdated Electron version — LARGE impact

     - Current: electron: ^26.6.10
     - Latest: 41.0.3
     - Electron 26 is EOL (end of support). Upgrading to Electron 32+ brings smaller Chromium builds, better snap compression, and security fixes.
     - Potential savings: Variable, but newer Electron binaries are often smaller per version.

     2. All 55 locales bundled — ~30 MB wasted

     - earthcal-linux-x64/locales/ = 33 MB (55 .pak files)
     - EarthCal uses its own translations/ i18n system — Chromium's built-in locales are mostly unused.
     - Only en-US.pak (and optionally en-GB.pak) are needed.
     - Fix: Add --ignore=locales and copy only needed locale in electron-packager flags, or use electron-builder's electronLanguages option.
     - Potential savings: ~30 MB

     3. Deprecated toolchain — electron-packager + electron-installer-snap

     - electron-packager is deprecated (last release 2023, no active maintenance).
     - electron-installer-snap is also stale.
     - Recommended replacement: electron-builder (actively maintained, native snap support, LZMA compression by default) or @electron-forge/cli (official
     Electron toolchain).
     - electron-builder snap targets use snapcraft under the hood but apply proper file exclusion and LZMA compression automatically.

     4. Build artifacts inside the packaged app

     The following files end up inside earthcal-linux-x64/resources/app/ and are snapped:
     - snap/ folder (116 KB) — build metadata, not runtime
     - snapcraft.yaml — build config, not runtime
     - prepare-public.sh — build script, not runtime
     - webpack.config.js — build config, not runtime
     - Fix: Add --ignore patterns to electron-packager (or use .electron-builder.yml ignore rules) to exclude these.

     5. node_modules inside build snap — node/14/stable is EOL

     - build-snaps: node/14/stable in snapcraft.yaml — Node 14 reached EOL April 2023.
     - Fix: Update to node/22/stable or node/24/stable.
     - Also, since there are zero production dependencies (only devDependencies), node_modules after --prune=true should be empty — worth verifying nothing
     leaks in.

     6. base: core22 — one version behind

     - Current: base: core22
     - Latest stable: core24
     - core24 is the current recommended base for new snaps. core22 still works but will eventually EOL.
     - Fix: Upgrade to core22 → core24.

     7. libcanberra-gtk3-module staged but suppressed

     - stage-packages includes libcanberra-gtk3-module but the app actively suppresses it with GTK_MODULES: "".
     - This package adds size without contributing anything at runtime.
     - Fix: Remove it from stage-packages.

     8. Unnecessary plugs

     - desktop-legacy, unity7 style plugs add to snap metadata and scope.
     - For a modern GNOME + X11 Electron app the minimum is: browser-support, desktop, network, home, x11.
     - network-bind is only needed if the app listens on a port externally (it only listens on 127.0.0.1:3000, so this may not be needed in strict mode).

     9. App source not packed as asar

     - resources/app/ is an unpacked directory tree.
     - Using asar archive (electron-packager --asar or electron-builder default) reduces file count, slightly reduces size, and loads faster.
     - Note: The local HTTP server in main.js reads files via fs.readFile — asar requires @electron/asar unpacking for those paths (or serving from an
     app.asar.unpacked/public/ dir). This needs careful handling.

     10. LICENSES.chromium.html = 8.5 MB in snap

     - This is legally required by Chromium's license and cannot be removed.
     - However, electron-builder places it outside the squashfs layer in ways that compress much better.
     - Better snap compression (LZMA vs default) can reduce this from 8.5 MB on-disk to ~1–2 MB in the snap archive.

     11. No .snapignore / prime filter in snapcraft.yaml

     - The dump plugin copies everything from earthcal-linux-x64/ without exclusions.
     - Adding a prime block or filesets can exclude LICENSES.chromium.html, debug .pak files, etc.
     - Example:
     filesets:
       exclude-docs:
         - -LICENSES.chromium.html
     prime:
       - $exclude-docs

     12. Webpack is wired up but not used in the build pipeline

     - webpack.config.js exists but npm run package calls electron-packager directly without a webpack build step.
     - Bundling/minifying main.js with webpack would reduce it from 12 KB but this is a minor gain.

     ---
     Summary Table

     ┌──────────────────────────────────────┬────────────────────────────┬──────────────────────────────┐
     │                Issue                 │        Est. Savings        │            Effort            │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ Prune locales to en-US only          │ ~30 MB                     │ Low                          │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ Upgrade Electron to 32–41            │ 5–15 MB                    │ Medium                       │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ Switch to electron-builder           │ Better compression overall │ Medium                       │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ Remove build artifacts from package  │ ~120 KB                    │ Low                          │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ Remove libcanberra stage-package     │ Small                      │ Trivial                      │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ Upgrade base to core24               │ Future-proofing            │ Low                          │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ Upgrade node build-snap to 22/stable │ EOL fix                    │ Low                          │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ Add snap prime filesets/exclusions   │ ~1–2 MB                    │ Low                          │
     ├──────────────────────────────────────┼────────────────────────────┼──────────────────────────────┤
     │ asar packaging                       │ Small                      │ Medium (needs main.js tweak) │
     └──────────────────────────────────────┴────────────────────────────┴──────────────────────────────┘

     ---
     Recommended Approach (Prioritized)

     1. Locale pruning — biggest win for least work. Add --ignore=locales to electron-packager call and copy only en-US.pak.
     2. Remove build artifacts — add --ignore list to electron-packager or use .electron-builderignore.
     3. Remove libcanberra stage-package from snapcraft.yaml.
     4. Upgrade node build-snap from 14/stable → 22/stable.
     5. Upgrade base from core22 → core24.
     6. Upgrade Electron from 26 → 32+ (test for API compatibility first).
     7. Consider electron-builder as a longer-term toolchain migration.

     ---
     Files to Modify

     - electron/package.json — Electron version, devDependencies toolchain
     - electron/snapcraft.yaml — base, build-snaps, stage-packages, prime filesets
     - electron/prepare-public.sh — locale pruning step
