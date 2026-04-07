/*
 * auspicer.js
 * EarthCal Auspices Engine
 *
 * Purpose
 * -------
 * This file is the orchestration layer for EarthCal's emerging multi-layer
 * auspices engine. It currently supports:
 *
 * - lunar moment detection
 * - solar moment detection
 * - multi-layer auspices resolution
 * - lunar-specific biodynamic council integration
 * - lunar and generic auspices rendering
 *
 * Design Direction
 * ----------------
 * The file is organized into these sections:
 *
 *   1. BOOTSTRAP / NAMESPACE
 *   2. SHARED UTILITIES
 *   3. GET MOMENTS
 *   4. TAG MATCHING / CONFIG RESOLUTION
 *   5. AUSPICES RESOLUTION
 *   6. DOMAIN-SPECIFIC COUNCIL RESOLUTION
 *   7. RENDERERS
 *   8. BACKWARD-COMPATIBILITY ALIASES
 *
 * Notes
 * -----
 * - Current active moment layers: lunar + solar
 * - Future layers may include planetary, seasonal, ecological, and ancestral
 * - Backward-compatible aliases are retained where useful
 * - Biodynamic council remains intentionally lunar-specific
 */

(function () {
    "use strict";

    // =========================================================
    // 1. BOOTSTRAP / NAMESPACE
    // =========================================================

    var C = window.SunCalc;
    var E = Math.PI / 180;

    if (!C) {
        console.warn("auspicer.js: SunCalc not loaded");
        return;
    }

    // Optional EarthCal namespace for future expansion
    window.EarthCalAuspicer = window.EarthCalAuspicer || {};



    // =========================================================
    // 2. SHARED UTILITIES
    // =========================================================

    /**
     * Normalize supported date inputs into a Date object.
     * Accepts:
     * - undefined/null => now
     * - Date
     * - date string
     * - timestamp
     */
    function normalizeDate(date) {
        if (!date) return new Date();
        if (date instanceof Date) return date;
        return new Date(date);
    }

    /**
     * Safe HTML escaping for renderer output.
     */
    function esc(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Format a date for lightweight UI display.
     */
    function formatDate(date) {
        try {
            return new Intl.DateTimeFormat(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric"
            }).format(date);
        } catch (e) {
            return date.toDateString();
        }
    }

    /**
     * Array contains helper.
     */
    function includesValue(arr, value) {
        return Array.isArray(arr) && arr.indexOf(value) !== -1;
    }

    /**
     * Cyclic distance helper for normalized phase values (0..1).
     */
    function cyclicDistance(a, b) {
        var d = Math.abs(a - b);
        return Math.min(d, 1 - d);
    }

    /**
     * Generic rule evaluator for config-driven matching.
     */
    function evaluateRule(rule, data) {
        if (!rule || !data) return false;

        var fieldValue = data[rule.field];

        if (Object.prototype.hasOwnProperty.call(rule, "equals")) {
            return fieldValue === rule.equals;
        }

        if (Object.prototype.hasOwnProperty.call(rule, "includes")) {
            return includesValue(fieldValue, rule.includes);
        }

        return false;
    }

    /**
     * Generic match evaluator for config-driven matching.
     * Supports:
     * - { all: [...] }
     * - { any: [...] }
     */
    function evaluateMatch(match, data) {
        if (!match) return false;

        if (Array.isArray(match.all)) {
            for (var i = 0; i < match.all.length; i++) {
                if (!evaluateRule(match.all[i], data)) return false;
            }
            return true;
        }

        if (Array.isArray(match.any)) {
            for (var j = 0; j < match.any.length; j++) {
                if (evaluateRule(match.any[j], data)) return true;
            }
            return false;
        }

        return false;
    }

    /**
     * Deep clone simple config/tag objects.
     */
    function cloneData(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Resolve config source.
     * Supports the current multi-layer config first, then older lunar-only config.
     *
     * Expected current config:
     * - file: auspices-config.json
     * - schema: earthcal.auspices-config.v2
     */
    function getAuspicesConfig(passedConfig) {
        if (passedConfig) return passedConfig;

        if (window.EARTHCAL_AUSPICES_CONFIG) {
            return window.EARTHCAL_AUSPICES_CONFIG;
        }

        if (window.EARTHCAL_LUNAR_INTENTION_CONFIG) {
            return window.EARTHCAL_LUNAR_INTENTION_CONFIG;
        }

        console.warn("auspicer.js: no auspices config provided");
        return null;
    }

    /**
     * Generic priority sorter for matched tags/entries.
     */
    function sortByPriority(items, config) {
        var priority =
            (config && config.engine && config.engine.tagPriority) ||
            (config && config.priorityOrder) ||
            [];

        return items.sort(function (a, b) {
            var ai = priority.indexOf(a.id);
            var bi = priority.indexOf(b.id);

            if (ai === -1) ai = 9999;
            if (bi === -1) bi = 9999;

            return ai - bi;
        });
    }

    /**
     * Return a moon emoji from normalized phase.
     */
    function getMoonPhaseEmoji(phase) {
        var idx = Math.round((phase || 0) * 30);
        if (idx <= 1)  return "🌑";
        if (idx <= 6)  return "🌒";
        if (idx <= 9)  return "🌓";
        if (idx <= 14) return "🌔";
        if (idx <= 16) return "🌕";
        if (idx <= 22) return "🌖";
        if (idx <= 24) return "🌗";
        if (idx <= 29) return "🌘";
        return "🌑";
    }

    /**
     * Return a sun / seasonal emoji from solar state.
     */
    function getSolarEmoji(solarMoment) {
        if (!solarMoment) return "☀️";

        if (solarMoment.seasonalAnchor === "summer solstice window") return "☀️";
        if (solarMoment.seasonalAnchor === "winter solstice window") return "🌑";
        if (solarMoment.seasonalAnchor === "march equinox window") return "🌤️";
        if (solarMoment.seasonalAnchor === "september equinox window") return "🌥️";

        if (solarMoment.lightHalfName === "Ascending Light") return "🌅";
        if (solarMoment.lightHalfName === "Descending Light") return "🌇";

        return "☀️";
    }



    // =========================================================
    // 3. GET MOMENTS
    // =========================================================
    //
    // Purpose:
    // --------
    // This section is where all layer-specific moment detectors live.
    //
    // Current:
    // - lunar
    // - solar
    //
    // Planned:
    // - planetary
    // - additional seasonal and ecological signal layers
    //
    // Naming convention:
    // - Layer-specific detectors:
    //     getLunarMoment()
    //     getSolarMoment()
    //     getPlanetaryMoment()
    //
    // - Layer aggregators:
    //     getMomentLayers()
    //     getAuspicesInput()
    //

    /**
     * Get solar moment data for a target date and location.
     *
     * Uses:
     * - SunCalc.getTimes(date, lat, lon)
     *
     * Purpose:
     * - classify annual solar anchor windows (equinox / solstice)
     * - classify annual light half (ascending light / descending light)
     * - preserve raw solar timing fields for future use
     *
     * Notes:
     * - lat/lon are required
     * - seasonal anchors are approximate windows around annual events
     * - hemisphere affects summer/winter interpretation
     * - generic solar day-part tags have been intentionally removed from active moments
     */
    C.getSolarMoment = function (date, lat, lon, options) {
        options = options || {};

        var target = (date instanceof Date) ? date : new Date(date || Date.now());

        if (typeof lat !== "number" || typeof lon !== "number") {
            console.warn("SunCalc.getSolarMoment: lat/lon are required");
            return null;
        }

        var eventWindowMinutes  = options.eventWindowMinutes  != null ? options.eventWindowMinutes  : 60;
        var seasonalWindowDays  = options.seasonalWindowDays  != null ? options.seasonalWindowDays  : 3;
        var equatorialThreshold = options.equatorialThreshold != null ? options.equatorialThreshold : 1.0;

        var times = C.getTimes(target, lat, lon);

        var sunrise   = times.sunrise || null;
        var solarNoon = times.solarNoon || null;
        var sunset    = times.sunset || null;
        var nadir     = times.nadir || null;

        function absMinutes(a, b) {
            return Math.abs(a.valueOf() - b.valueOf()) / 60000;
        }

        function daysBetween(a, b) {
            return Math.abs(a.valueOf() - b.valueOf()) / 86400000;
        }

        function makeUTCDate(year, monthIndex, day) {
            return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
        }

        function getHemisphere(latitude) {
            if (Math.abs(latitude) <= equatorialThreshold) return "equatorial";
            return latitude > 0 ? "north" : "south";
        }

        var hemisphere = getHemisphere(lat);

        // -----------------------------------------------------
        // Day / night
        // -----------------------------------------------------
        var isDay = false;
        var isNight = false;

        if (sunrise && sunset) {
            isDay = target >= sunrise && target < sunset;
            isNight = !isDay;
        } else {
            // Polar or edge cases
            var alt = C.getPosition(target, lat, lon).altitude;
            isDay = alt > 0;
            isNight = !isDay;
        }

        var solarPhaseName = isDay ? "Day" : "Night";

        // -----------------------------------------------------
        // Diurnal event window
        // -----------------------------------------------------
        var solarEvent = "none";

        if (sunrise && absMinutes(target, sunrise) <= eventWindowMinutes) {
            solarEvent = "sunrise window";
        } else if (solarNoon && absMinutes(target, solarNoon) <= eventWindowMinutes) {
            solarEvent = "solar noon window";
        } else if (sunset && absMinutes(target, sunset) <= eventWindowMinutes) {
            solarEvent = "sunset window";
        } else if (nadir && absMinutes(target, nadir) <= eventWindowMinutes) {
            solarEvent = "solar nadir window";
        }

        // -----------------------------------------------------
        // Daily energy arc
        // -----------------------------------------------------
        var energyName = "Resting";

        if (isDay) {
            if (solarNoon && absMinutes(target, solarNoon) <= eventWindowMinutes) {
                energyName = "Peak";
            } else if (solarNoon && target < solarNoon) {
                energyName = "Rising";
            } else {
                energyName = "Falling";
            }
        }

        // -----------------------------------------------------
        // Annual seasonal anchors (approximate astronomical windows)
        // -----------------------------------------------------
        var year = target.getUTCFullYear();

        var marchEquinox     = makeUTCDate(year, 2, 20);  // Mar 20
        var juneSolstice     = makeUTCDate(year, 5, 21);  // Jun 21
        var septemberEquinox = makeUTCDate(year, 8, 22);  // Sep 22
        var decemberSolstice = makeUTCDate(year, 11, 21); // Dec 21

        var seasonalAnchor = "none";

        if (daysBetween(target, marchEquinox) <= seasonalWindowDays) {
            seasonalAnchor = "march equinox window";
        } else if (daysBetween(target, juneSolstice) <= seasonalWindowDays) {
            seasonalAnchor = hemisphere === "south"
                ? "winter solstice window"
                : "summer solstice window";
        } else if (daysBetween(target, septemberEquinox) <= seasonalWindowDays) {
            seasonalAnchor = "september equinox window";
        } else if (daysBetween(target, decemberSolstice) <= seasonalWindowDays) {
            seasonalAnchor = hemisphere === "south"
                ? "summer solstice window"
                : "winter solstice window";
        }

        // -----------------------------------------------------
        // Annual light half
        // -----------------------------------------------------
        var lightHalfName = "Balanced Light";

        if (hemisphere === "north") {
            if (target >= decemberSolstice || target < juneSolstice) {
                lightHalfName = "Ascending Light";
            } else {
                lightHalfName = "Descending Light";
            }
        } else if (hemisphere === "south") {
            if (target >= juneSolstice || target < decemberSolstice) {
                lightHalfName = "Ascending Light";
            } else {
                lightHalfName = "Descending Light";
            }
        }

        // -----------------------------------------------------
        // Collect active moment labels
        // -----------------------------------------------------
        var moments = [];

        if (lightHalfName !== "Balanced Light") {
            moments.push(lightHalfName);
        }

        if (seasonalAnchor !== "none") {
            if (seasonalAnchor === "march equinox window") moments.push("March Equinox Window");
            if (seasonalAnchor === "september equinox window") moments.push("September Equinox Window");
            if (seasonalAnchor === "summer solstice window") moments.push("Summer Solstice Window");
            if (seasonalAnchor === "winter solstice window") moments.push("Winter Solstice Window");
        }

        return {
            layer: "solar",
            date: target,
            latitude: lat,
            longitude: lon,
            hemisphere: hemisphere,

            // base phase
            isDay: isDay,
            isNight: isNight,
            solarPhaseName: solarPhaseName,

            // retained raw daily fields for future use
            solarEvent: solarEvent,
            energyName: energyName,

            // annual cycle
            seasonalAnchor: seasonalAnchor,
            lightHalfName: lightHalfName,

            // raw solar times
            sunrise: sunrise,
            solarNoon: solarNoon,
            sunset: sunset,
            nadir: nadir,

            // active labels
            moments: moments
        };
    };

    /**
     * Get lunar moment data for a target date.
     *
     * Uses:
     * - getMoonIllumination(date)
     * - getMoonOrbitData(date)
     *
     * Safe: additive only, does not alter existing APIs.
     */
    C.getLunarMoment = function (date, options) {
        options = options || {};

        // -----------------------------------------------------
        // Tunable thresholds
        // -----------------------------------------------------
        var trendHours     = options.trendHours     != null ? options.trendHours     : 12;
        var newMoonWindow  = options.newMoonWindow  != null ? options.newMoonWindow  : 0.03;
        var fullMoonWindow = options.fullMoonWindow != null ? options.fullMoonWindow : 0.03;
        var nodeWindowDeg  = options.nodeWindowDeg  != null ? options.nodeWindowDeg  : 1.5;
        var perigeeKm      = options.perigeeKm      != null ? options.perigeeKm      : 360000;
        var apogeeKm       = options.apogeeKm       != null ? options.apogeeKm       : 404000;

        var target = normalizeDate(date);
        var future = new Date(target.valueOf() + trendHours * 3600000);

        var illum  = C.getMoonIllumination(target);
        var orbit0 = C.getMoonOrbitData(target);
        var orbit1 = C.getMoonOrbitData(future);

        // -----------------------------------------------------
        // Raw astronomy values
        // -----------------------------------------------------
        var phase       = illum.phase;
        var fraction    = illum.fraction;
        var angleRad    = illum.angle;
        var angleDeg    = illum.angle / E;

        var distanceKm  = orbit0.distance;
        var dec0Deg     = orbit0.declinationDeg;
        var dec1Deg     = orbit1.declinationDeg;
        var beta0Deg    = orbit0.eclipticLatitudeDeg;
        var beta1Deg    = orbit1.eclipticLatitudeDeg;

        // -----------------------------------------------------
        // Phase state
        // -----------------------------------------------------
        var isNewMoon  = cyclicDistance(phase, 0)   < newMoonWindow || cyclicDistance(phase, 1) < newMoonWindow;
        var isFullMoon = cyclicDistance(phase, 0.5) < fullMoonWindow;

        var waxing = !isNewMoon && !isFullMoon && phase > 0   && phase < 0.5;
        var waning = !isNewMoon && !isFullMoon && phase > 0.5 && phase < 1;

        var phaseName = "Transition";
        if (isNewMoon) {
            phaseName = "New Moon";
        } else if (isFullMoon) {
            phaseName = "Full Moon";
        } else if (waxing) {
            phaseName = fraction < 0.5 ? "Waxing Crescent" : "Waxing Gibbous";
        } else if (waning) {
            phaseName = fraction < 0.5 ? "Waning Crescent" : "Waning Gibbous";
        }

        // -----------------------------------------------------
        // Motion state
        // -----------------------------------------------------
        var ascending  = dec1Deg > dec0Deg;
        var descending = dec1Deg < dec0Deg;

        var motionName = "Stationary";
        if (ascending) motionName = "Ascending";
        if (descending) motionName = "Descending";

        // -----------------------------------------------------
        // Combined state
        // -----------------------------------------------------
        var comboName = phaseName;
        if (waxing || waning) {
            comboName = (waxing ? "Waxing" : "Waning") + " + " + motionName;
        } else if (isNewMoon || isFullMoon) {
            comboName = phaseName + (motionName !== "Stationary" ? " + " + motionName : "");
        }

        // -----------------------------------------------------
        // Orbital event state
        // -----------------------------------------------------
        var nearNode = Math.abs(beta0Deg) <= nodeWindowDeg || beta0Deg === 0 || (beta0Deg * beta1Deg < 0);

        var nodeType = "none";
        if (nearNode) {
            if (beta0Deg < 0 && beta1Deg > 0) {
                nodeType = "ascending node";
            } else if (beta0Deg > 0 && beta1Deg < 0) {
                nodeType = "descending node";
            } else {
                nodeType = "node window";
            }
        }

        var nearPerigee = distanceKm <= perigeeKm;
        var nearApogee  = distanceKm >= apogeeKm;

        // -----------------------------------------------------
        // Alignment state
        // -----------------------------------------------------
        var eclipseType = "none";
        if (isNewMoon && nearNode) {
            eclipseType = "solar eclipse window";
        } else if (isFullMoon && nearNode) {
            eclipseType = "lunar eclipse window";
        }

        // -----------------------------------------------------
        // Collect active moment labels
        // -----------------------------------------------------
        var moments = [];

        if (isNewMoon) moments.push("New Moon");
        if (isFullMoon) moments.push("Full Moon");
        if (waxing) moments.push("Waxing");
        if (waning) moments.push("Waning");

        if (ascending) moments.push("Ascending");
        if (descending) moments.push("Descending");

        if (waxing || waning || isNewMoon || isFullMoon) {
            moments.push(comboName);
        }

        if (nearNode) moments.push(nodeType);
        if (nearPerigee) moments.push("Perigee Window");
        if (nearApogee) moments.push("Apogee Window");
        if (eclipseType !== "none") moments.push(eclipseType);

        return {
            layer: "lunar",
            date: target,

            // labels
            phaseName: phaseName,
            motionName: motionName,
            comboName: comboName,

            // state flags
            isNewMoon: isNewMoon,
            isFullMoon: isFullMoon,
            waxing: waxing,
            waning: waning,
            ascending: ascending,
            descending: descending,
            nearNode: nearNode,
            nearPerigee: nearPerigee,
            nearApogee: nearApogee,

            // event labels
            nodeType: nodeType,
            eclipseType: eclipseType,

            // raw values
            phase: phase,
            illuminatedFraction: fraction,
            angleRad: angleRad,
            angleDeg: angleDeg,
            distanceKm: distanceKm,
            declinationDeg: dec0Deg,
            declinationDegFuture: dec1Deg,
            eclipticLatitudeDeg: beta0Deg,
            eclipticLatitudeDegFuture: beta1Deg,
            trendHours: trendHours,

            // active labels
            moments: moments
        };
    };

    /**
     * Collect active moment layers for a target date.
     *
     * Current layers:
     * - lunar
     * - solar
     *
     * Expected options shape:
     * {
     *   lunar: {...},
     *   solar: {...},
     *   location: { lat: number, lon: number }
     * }
     */
    C.getMomentLayers = function (date, options) {
        var targetDate = normalizeDate(date);
        options = options || {};

        var location = options.location || {};
        var lat = typeof location.lat === "number" ? location.lat : null;
        var lon = typeof location.lon === "number" ? location.lon : null;

        var layers = {
            date: targetDate,
            lunar: C.getLunarMoment(targetDate, options.lunar || {})
        };

        if (typeof C.getSolarMoment === "function" && lat != null && lon != null) {
            layers.solar = C.getSolarMoment(targetDate, lat, lon, options.solar || {});
        } else {
            layers.solar = null;
        }

        return layers;
    };



    // =========================================================
    // 4. TAG MATCHING / CONFIG RESOLUTION
    // =========================================================
    //
    // Purpose:
    // --------
    // This section converts raw moment data into matched config tags.
    //
    // Current:
    // - multi-layer config matching across lunar + solar
    //
    // Planned:
    // - weighted semantic resolvers
    // - confidence and scope-based synthesis
    //

    function getPrimaryTag(tags) {
        if (!tags || !tags.length) return null;

        for (var i = 0; i < tags.length; i++) {
            if (
                tags[i].category === "combo" ||
                tags[i].category === "alignment" ||
                tags[i].category === "orbital" ||
                tags[i].category === "solar-season"
            ) {
                return tags[i];
            }
        }

        return tags[0];
    }

    function getSupportTags(tags) {
        if (!tags || !tags.length) return [];

        var out = [];
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].ui && (tags[i].ui.emphasis === "warning" || tags[i].ui.emphasis === "critical")) {
                continue;
            }
            out.push(tags[i]);
        }
        return out;
    }

    function getWarningTags(tags) {
        if (!tags || !tags.length) return [];

        var out = [];
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].ui && (tags[i].ui.emphasis === "warning" || tags[i].ui.emphasis === "critical")) {
                out.push(tags[i]);
            }
        }
        return out;
    }



    // =========================================================
    // 5. AUSPICES RESOLUTION
    // =========================================================
    //
    // Purpose:
    // --------
    // This section converts active moment layers + matched tags into a resolved
    // auspices object for UI use.
    //
    // Current:
    // - multi-layer resolution across lunar + solar
    //
    // Planned:
    // - priority + semantic-weight + confidence synthesis
    // - ecological and ancestral grounding selection
    //

    function buildAuspicesSummary(momentData, matchedTags) {
        var primaryTag = getPrimaryTag(matchedTags);
        var guidance = primaryTag && primaryTag.guidance ? primaryTag.guidance : "";
        var innerEffect = primaryTag && primaryTag.innerEffect ? primaryTag.innerEffect : "";
        var stage = primaryTag && primaryTag.intentionStage ? primaryTag.intentionStage : "";

        var primaryLabel =
            (primaryTag && primaryTag.label) ||
            momentData.comboName ||
            momentData.phaseName ||
            (momentData.solarMoment && momentData.solarMoment.seasonalAnchor) ||
            (momentData.solarMoment && momentData.solarMoment.lightHalfName) ||
            "Moment";

        var secondaryLabel =
            momentData.phaseName ||
            (momentData.solarMoment && (
                momentData.solarMoment.seasonalAnchor !== "none"
                    ? momentData.solarMoment.seasonalAnchor
                    : momentData.solarMoment.lightHalfName
            )) ||
            "";

        return {
            primaryLabel: primaryLabel,
            secondaryLabel: secondaryLabel,
            stage: stage,
            innerEffect: innerEffect,
            guidance: guidance
        };
    }

    /**
     * Merge all active moment layers into one flat, matchable input object.
     *
     * Purpose:
     * - allows a single config tag system to match across lunar + solar fields
     * - preserves full layer outputs under `layers`
     * - merges `moments` from all active layers into one shared array
     *
     * Expected options shape:
     * {
     *   location: { lat, lon },
     *   lunar: {...},
     *   solar: {...}
     * }
     */
    C.getAuspicesInput = function (date, options) {
        var targetDate = normalizeDate(date);
        options = options || {};

        var layers = C.getMomentLayers(targetDate, options);

        var lunar = layers.lunar || null;
        var solar = layers.solar || null;

        var mergedMoments = [];
        var seen = {};

        function addMoments(arr) {
            if (!Array.isArray(arr)) return;
            for (var i = 0; i < arr.length; i++) {
                if (!seen[arr[i]]) {
                    seen[arr[i]] = true;
                    mergedMoments.push(arr[i]);
                }
            }
        }

        addMoments(lunar && lunar.moments);
        addMoments(solar && solar.moments);

        var activeLayers = [];
        if (lunar) activeLayers.push("lunar");
        if (solar) activeLayers.push("solar");

        return {
            date: targetDate,
            isoDate: targetDate.toISOString(),

            // Keep full layer objects available
            layers: layers,
            activeLayers: activeLayers,
            lunarMoment: lunar,
            solarMoment: solar,

            // -------------------------------------------------
            // Shared merged moments
            // -------------------------------------------------
            moments: mergedMoments,

            // -------------------------------------------------
            // Lunar fields
            // -------------------------------------------------
            comboName: lunar ? lunar.comboName : "",
            phaseName: lunar ? lunar.phaseName : "",
            motionName: lunar ? lunar.motionName : "",

            isNewMoon: lunar ? lunar.isNewMoon : false,
            isFullMoon: lunar ? lunar.isFullMoon : false,
            waxing: lunar ? lunar.waxing : false,
            waning: lunar ? lunar.waning : false,
            ascending: lunar ? lunar.ascending : false,
            descending: lunar ? lunar.descending : false,
            nearNode: lunar ? lunar.nearNode : false,
            nearPerigee: lunar ? lunar.nearPerigee : false,
            nearApogee: lunar ? lunar.nearApogee : false,
            nodeType: lunar ? lunar.nodeType : "none",
            eclipseType: lunar ? lunar.eclipseType : "none",

            phase: lunar ? lunar.phase : null,
            illuminatedFraction: lunar ? lunar.illuminatedFraction : null,
            angleRad: lunar ? lunar.angleRad : null,
            angleDeg: lunar ? lunar.angleDeg : null,
            distanceKm: lunar ? lunar.distanceKm : null,
            declinationDeg: lunar ? lunar.declinationDeg : null,
            declinationDegFuture: lunar ? lunar.declinationDegFuture : null,
            eclipticLatitudeDeg: lunar ? lunar.eclipticLatitudeDeg : null,
            eclipticLatitudeDegFuture: lunar ? lunar.eclipticLatitudeDegFuture : null,

            // -------------------------------------------------
            // Solar fields
            // -------------------------------------------------
            isDay: solar ? solar.isDay : false,
            isNight: solar ? solar.isNight : false,
            solarPhaseName: solar ? solar.solarPhaseName : "",
            solarEvent: solar ? solar.solarEvent : "none",
            energyName: solar ? solar.energyName : "",
            seasonalAnchor: solar ? solar.seasonalAnchor : "none",
            lightHalfName: solar ? solar.lightHalfName : "",
            hemisphere: solar ? solar.hemisphere : "",

            sunrise: solar ? solar.sunrise : null,
            solarNoon: solar ? solar.solarNoon : null,
            sunset: solar ? solar.sunset : null,
            nadir: solar ? solar.nadir : null,

            latitude: solar ? solar.latitude : null,
            longitude: solar ? solar.longitude : null
        };
    };

    /**
     * Backward-compatible lunar-focused resolver.
     * Internally delegates to multi-layer getAuspices(), but only supplies lunar options.
     */
    C.getLunarAuspices = function (date, config, lunarOptions) {
        return C.getAuspices(date, config, {
            lunar: lunarOptions || {}
        });
    };

    /**
     * Resolve multi-layer auspices from merged moment input + config.
     *
     * Expected options shape:
     * {
     *   location: { lat, lon },
     *   lunar: {...},
     *   solar: {...}
     * }
     */
    C.getAuspices = function (date, config, options) {
        var targetDate = normalizeDate(date);
        var cfg = getAuspicesConfig(config);

        if (!cfg) return null;

        var input = C.getAuspicesInput(targetDate, options || {});
        var matchedTags = [];
        var tags = cfg.tags || [];

        for (var i = 0; i < tags.length; i++) {
            if (evaluateMatch(tags[i].match, input)) {
                matchedTags.push(cloneData(tags[i]));
            }
        }

        matchedTags = sortByPriority(matchedTags, cfg);

        var primaryTag = getPrimaryTag(matchedTags);
        var warningTags = getWarningTags(matchedTags);
        var supportTags = getSupportTags(matchedTags);
        var summary = buildAuspicesSummary(input, matchedTags);

        return {
            date: targetDate,
            isoDate: targetDate.toISOString(),

            input: input,
            layers: input.layers,
            activeLayers: input.activeLayers,

            lunarMoment: input.lunarMoment,
            solarMoment: input.solarMoment,

            summary: summary,

            primaryTag: primaryTag,
            warningTags: warningTags,
            supportTags: supportTags,

            tags: matchedTags,
            tagIds: matchedTags.map(function (t) { return t.id; }),
            tagLabels: matchedTags.map(function (t) { return t.label; }),

            suggestedActions: primaryTag && primaryTag.suggestedActions
                ? primaryTag.suggestedActions.slice()
                : [],

            debug: {
                comboName: input.comboName || "",
                phaseName: input.phaseName || "",
                seasonalAnchor: input.seasonalAnchor || "",
                lightHalfName: input.lightHalfName || "",
                matchedCount: matchedTags.length
            }
        };
    };

    /**
     * Async config loader.
     * Current expected file:
     * - auspices-config.json
     */
    C.loadAuspicesConfig = async function (url) {
        var res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) {
            throw new Error("Failed to load auspices config: " + res.status + " " + res.statusText);
        }
        return await res.json();
    };

    /**
     * Async one-shot auspices helper.
     */
    C.getAuspicesFromUrl = async function (date, configUrl, options) {
        var cfg = await C.loadAuspicesConfig(configUrl);
        return C.getAuspices(date, cfg, options || {});
    };



    // =========================================================
    // 6. DOMAIN-SPECIFIC COUNCIL RESOLUTION
    // =========================================================
    //
    // Purpose:
    // --------
    // This section handles optional domain libraries such as:
    // - biodynamic gardening council
    // - ecological examples
    // - ancestral examples
    //
    // Current:
    // - biodynamic council resolver (lunar-specific by design)
    //
    // Planned:
    // - resolveEcologicalExamples()
    // - resolveAncestralExamples()
    //

    function resolveBiodynamicCouncil(date) {
        var bdc = window.EARTHCAL_BIODYNAMIC_COUNCIL;
        if (!bdc || !Array.isArray(bdc.entries)) return null;
        if (typeof C.getLunarMoment !== "function") return null;

        var targetDate = normalizeDate(date);
        var momentData = C.getLunarMoment(targetDate);
        var matched = [];

        for (var i = 0; i < bdc.entries.length; i++) {
            if (evaluateMatch(bdc.entries[i].match, momentData)) {
                matched.push(bdc.entries[i]);
            }
        }

        matched = sortByPriority(matched, bdc);

        if (!matched.length) return null;

        var primary = matched[0];
        var warnings = matched.filter(function (entry) {
            return entry.significance === "warning" || entry.significance === "critical";
        });

        return {
            primary: primary,
            warnings: warnings,
            all: matched,
            lunarMoment: momentData
        };
    }

    // Public export for direct use elsewhere
    window.resolveBiodynamicCouncil = resolveBiodynamicCouncil;

    /**
     * Resolve the most relevant ancestral example for the given matched tag IDs.
     * Matches by tag-array overlap against window.EARTHCAL_ANCESTRAL_EXAMPLES.
     */
    function resolveAncestralExample(tagIds) {
        var ae = window.EARTHCAL_ANCESTRAL_EXAMPLES;
        if (!ae || !Array.isArray(ae.examples)) return null;
        if (!tagIds || !tagIds.length) return null;

        var CONFIDENCE_ORDER = ["high", "moderate-high", "moderate", "low"];

        var candidates = ae.examples.filter(function (ex) {
            return ex.reviewStatus !== "hold" && ex.confidence !== "review_needed";
        }).map(function (ex) {
            var overlap = (ex.tags || []).filter(function (t) {
                return tagIds.indexOf(t) !== -1;
            }).length;
            return { ex: ex, overlap: overlap };
        }).filter(function (item) {
            return item.overlap > 0;
        });

        if (!candidates.length) return null;

        candidates.sort(function (a, b) {
            if (b.overlap !== a.overlap) return b.overlap - a.overlap;
            var ai = CONFIDENCE_ORDER.indexOf(a.ex.confidence);
            var bi = CONFIDENCE_ORDER.indexOf(b.ex.confidence);
            if (ai === -1) ai = 99;
            if (bi === -1) bi = 99;
            return ai - bi;
        });

        return candidates[0].ex;
    }

    function buildAncestralExampleHtml(tagIds) {
        var example = resolveAncestralExample(tagIds);
        if (!example) return "";

        return (
            '<div class="ec-ancestral-example">' +
            '<div class="ec-ancestral-example__title">Ancestral Grounding ' +
            '<button class="ec-ancestral-example__toggle" aria-label="Show ancestral example" aria-expanded="false">+</button>' +
            "</div>" +
            '<div class="ec-ancestral-example__body">' +
            '<div class="ec-ancestral-example__culture">' + esc(example.culture || "") + (example.region ? " &middot; " + esc(example.region) : "") + "</div>" +
            '<div class="ec-ancestral-example__practice-title">' + esc(example.title || "") + "</div>" +
            '<div class="ec-ancestral-example__summary">' + esc(example.summary || "") + "</div>" +
            "</div>" +
            "</div>"
        );
    }



    // =========================================================
    // 7. RENDERERS
    // =========================================================
    //
    // Purpose:
    // --------
    // This section turns resolved auspices into DOM/UI output.
    //
    // Current:
    // - lunar-focused renderer
    // - multi-layer generic renderer
    //
    // Planned:
    // - ecological and ancestral grounding sections
    // - richer semantic synthesis display
    //

    function buildTagHtml(tag) {
        var tone = (tag.ui && tag.ui.tone) ? tag.ui.tone : "neutral";
        var emphasis = (tag.ui && tag.ui.emphasis) ? tag.ui.emphasis : "supporting";

        return (
            '<span class="ec-lunar-tag ec-lunar-tag--' + esc(tone) +
            " ec-lunar-tag--" + esc(emphasis) + '">' +
            esc(tag.label) +
            "</span>"
        );
    }

    function buildActionsHtml(actions) {
        if (!actions || !actions.length) return "";

        var items = actions.map(function (action) {
            return '<li class="ec-lunar-actions__item">' + esc(action) + "</li>";
        }).join("");

        return (
            '<div class="ec-lunar-actions">' +
            '<div class="ec-lunar-actions__title">Suggested actions</div>' +
            '<ul class="ec-lunar-actions__list">' + items + "</ul>" +
            "</div>"
        );
    }

    function buildWarningsHtml(warningTags) {
        if (!warningTags || !warningTags.length) return "";

        var items = warningTags.map(function (tag) {
            return (
                '<div class="ec-lunar-warning__item">' +
                "<strong>" + esc(tag.label) + ":</strong> " +
                esc(tag.guidance || "") +
                "</div>"
            );
        }).join("");

        return (
            '<div class="ec-lunar-warning">' +
            '<div class="ec-lunar-warning__title">Special conditions</div>' +
            items +
            "</div>"
        );
    }

    function buildLunarDataHtml(lunarMoment) {
        if (!lunarMoment) return "";

        var phase    = lunarMoment.phase;
        var frac     = lunarMoment.illuminatedFraction;
        var dist     = lunarMoment.distanceKm;
        var decl     = lunarMoment.declinationDeg;
        var beta     = lunarMoment.eclipticLatitudeDeg;
        var angleDeg = lunarMoment.angleDeg;

        function fmt(v, digits) {
            return (v != null && isFinite(v)) ? Number(v).toFixed(digits) : "—";
        }

        function fmtDist(v) {
            return (v != null && isFinite(v))
                ? Math.round(v).toLocaleString() + " km"
                : "—";
        }

        return (
            '<div class="ec-lunar-data">' +
            '<div class="ec-lunar-data__title">Today\'s Lunar Data ' +
            '<button class="ec-lunar-data__toggle" aria-label="Show lunar data" aria-expanded="false">+</button>' +
            "</div>" +
            '<dl class="ec-lunar-data__grid" style="display:none;">' +
            "<dt>Phase</dt><dd>" + fmt(phase * 100, 1) + "% (" + esc(lunarMoment.phaseName || "") + ")</dd>" +
            "<dt>Illumination</dt><dd>" + fmt(frac * 100, 1) + "%</dd>" +
            "<dt>Distance</dt><dd>" + fmtDist(dist) + "</dd>" +
            "<dt>Declination</dt><dd>" + fmt(decl, 2) + "°</dd>" +
            "<dt>Ecliptic Lat.</dt><dd>" + fmt(beta, 2) + "°</dd>" +
            "<dt>Angle</dt><dd>" + fmt(angleDeg, 1) + "°</dd>" +
            "</dl>" +
            "</div>"
        );
    }

    function buildSolarDataHtml(solarMoment, location) {
        if (!solarMoment) return "";

        function fmtTime(d) {
            if (!d) return "—";
            try {
                return new Intl.DateTimeFormat(undefined, {
                    hour: "numeric",
                    minute: "2-digit"
                }).format(d);
            } catch (e) {
                return d.toLocaleTimeString();
            }
        }

        var positionNote = "";
        if (location && location.lat != null && location.lon != null) {
            positionNote =
                '<div class="ec-solar-position-note">Auspicer data is determined by today\'s lunar and solar positions given your set position ' +
                '(long: ' + Number(location.lon).toFixed(4) + ', lat: ' + Number(location.lat).toFixed(4) + ').</div>';
        }

        return (
            '<div class="ec-lunar-data">' +
            '<div class="ec-lunar-data__title">Today\'s Solar Data ' +
            '<button class="ec-lunar-data__toggle" aria-label="Show solar data" aria-expanded="false">+</button>' +
            "</div>" +
            '<dl class="ec-lunar-data__grid" style="display:none;">' +
            "<dt>Hemisphere</dt><dd>" + esc(solarMoment.hemisphere || "—") + "</dd>" +
            "<dt>Light Half</dt><dd>" + esc(solarMoment.lightHalfName || "—") + "</dd>" +
            "<dt>Seasonal Anchor</dt><dd>" + esc(solarMoment.seasonalAnchor || "—") + "</dd>" +
            "<dt>Sunrise</dt><dd>" + fmtTime(solarMoment.sunrise) + "</dd>" +
            "<dt>Solar Noon</dt><dd>" + fmtTime(solarMoment.solarNoon) + "</dd>" +
            "<dt>Sunset</dt><dd>" + fmtTime(solarMoment.sunset) + "</dd>" +
            "<dt>Nadir</dt><dd>" + fmtTime(solarMoment.nadir) + "</dd>" +
            "</dl>" +
            positionNote +
            "</div>"
        );
    }

    function buildBiodynamicCouncilHtml(date) {
        var council = resolveBiodynamicCouncil(date);
        if (!council || !council.primary) return "";

        var p = council.primary;

        var recommendedHtml = "";
        if (p.recommendedActions && p.recommendedActions.length) {
            recommendedHtml =
                '<div class="ec-biodynamic-council__section-label">Recommended</div>' +
                '<ul class="ec-biodynamic-council__list">' +
                p.recommendedActions.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") +
                "</ul>";
        }

        var avoidHtml = "";
        if (p.avoidActions && p.avoidActions.length) {
            avoidHtml =
                '<div class="ec-biodynamic-council__section-label">Avoid</div>' +
                '<ul class="ec-biodynamic-council__list">' +
                p.avoidActions.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") +
                "</ul>";
        }

        var warningHtml = "";
        if (council.warnings && council.warnings.length) {
            warningHtml =
                '<div class="ec-biodynamic-council__warning">' +
                council.warnings.map(function (w) {
                    return "<div>" + esc(w.label) + ": " + esc(w.counsel || "") + "</div>";
                }).join("") +
                "</div>";
        }

        return (
            '<div class="ec-biodynamic-council">' +
            '<div class="ec-biodynamic-council__title">Today\'s Biodynamic Council ' +
            '<button class="ec-biodynamic-council__toggle" aria-label="Show biodynamic council" aria-expanded="false">+</button>' +
            "</div>" +
            '<div class="ec-biodynamic-council__body">' +
            '<div class="ec-biodynamic-council__label">' + esc(p.label || "") + "</div>" +
            '<div class="ec-biodynamic-council__summary">' + esc(p.summary || "") + "</div>" +
            '<div class="ec-biodynamic-council__counsel">' + esc(p.counsel || "") + "</div>" +
            recommendedHtml +
            avoidHtml +
            warningHtml +
            "</div>" +
            "</div>"
        );
    }

    /**
     * ensureAuspicesStyles — no-op.
     * All .ec-lunar-auspices styles are now in css/auspicer-styles.css.
     */
    function ensureAuspicesStyles() {
        // Styles are provided by the external auspicer-styles.css stylesheet.
        // This function is retained for call-site compatibility.
    }

    /* LEGACY INLINE STYLES — kept here as reference only, do not re-enable.
       These styles have been moved to css/auspicer-styles.css.
    function _legacyEnsureAuspicesStyles_DISABLED() {
        if (document.getElementById("ec-lunar-auspices-styles")) return;

        var style = document.createElement("style");
        style.id = "ec-lunar-auspices-styles";
        style.textContent = `
.ec-lunar-auspices {
    width: 100%;
    max-height: 77px;
    overflow: hidden;
    transition: max-height 0.4s ease;
    box-sizing: border-box;
    border: 1px solid rgba(127,127,127,0.22);
    border-radius: 14px;
    padding: 10px 14px 6px;
    background: var(--grey-trans, rgba(255,255,255,0.91));
    color: var(--text-color, #242424);
    font-size: 0.92rem;
    line-height: 1.3;
    position: relative;
}
.ec-lunar-auspices.is-expanded { max-height: 1200px; }
.ec-lunar-auspices .ec-lunar-auspices__header {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
}
.ec-lunar-auspices .ec-lunar-auspices__emoji {
    font-size: 1.9rem;
    line-height: 1;
    flex-shrink: 0;
}
.ec-lunar-auspices .ec-lunar-auspices__labels {
    min-width: 0;
    flex: 1;
}
.ec-lunar-auspices .ec-lunar-auspices__primary {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 2px 0;
    color: var(--text-color, #242424);
}
.ec-lunar-auspices .ec-lunar-auspices__secondary {
    font-size: 0.82rem;
    color: var(--subdued-text, #454545);
    margin: 0 0 2px 0;
    line-height: 1.2;
}
.ec-lunar-auspices .ec-lunar-auspices__effect {
    font-size: 0.83rem;
    color: var(--subdued-text, #454545);
    margin: 2px 0 0 0;
    line-height: 1.25;
}
.ec-lunar-auspices .ec-lunar-auspices__header-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}
.ec-lunar-auspices .ec-lunar-auspices__stage {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.70rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: var(--toggle-row-bg, rgba(197,196,193,0.49));
    color: var(--subdued-text, #454545);
    border: 1px solid rgba(127,127,127,0.18);
    white-space: nowrap;
}
.ec-lunar-auspices .ec-lunar-auspices__expand-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
}
.ec-lunar-auspices .ec-lunar-auspices__expand-btn::after {
    content: '';
    display: block;
    width: 10px;
    height: 10px;
    border-right: 1px solid rgba(90,90,90,0.70);
    border-bottom: 1px solid rgba(90,90,90,0.70);
    transform: rotate(45deg);
    position: relative;
    top: -3px;
    transition: transform 0.25s ease, top 0.25s ease;
}
.ec-lunar-auspices.is-expanded .ec-lunar-auspices__expand-btn::after {
    transform: rotate(-135deg);
    top: 3px;
}
.ec-lunar-auspices .ec-lunar-auspices__body { padding-top: 8px; }
.ec-lunar-auspices .ec-lunar-auspices__guidance {
    display: none;
    font-size: 0.91rem;
    margin: 0 0 10px 0;
    color: var(--text-color, #242424);
}
.ec-lunar-auspices.is-expanded .ec-lunar-auspices__guidance { display: block; }
.ec-lunar-auspices .ec-lunar-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin: 10px 0 10px 0;
}
.ec-lunar-auspices .ec-lunar-tag {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 0.73rem;
    border: 1px solid rgba(127,127,127,0.18);
    color: var(--text-color, #242424);
}
.ec-lunar-auspices .ec-lunar-warning {
    margin: 0 0 10px 0;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(220,170,80,0.14);
    border: 1px solid rgba(220,170,80,0.28);
    color: var(--text-color, #242424);
}
.ec-lunar-auspices .ec-lunar-warning__title,
.ec-lunar-auspices .ec-lunar-actions__title {
    font-size: 0.73rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--subdued-text, #454545);
    margin-bottom: 5px;
}
.ec-lunar-auspices .ec-lunar-warning__item {
    font-size: 0.84rem;
    margin-bottom: 4px;
}
.ec-lunar-auspices .ec-lunar-actions__list {
    margin: 0;
    padding-left: 16px;
}
.ec-lunar-auspices .ec-lunar-actions__item {
    margin: 0 0 3px 0;
    font-size: 0.86rem;
}
.ec-lunar-auspices .ec-lunar-data,
.ec-lunar-auspices .ec-biodynamic-council {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(127,127,127,0.18);
}
.ec-lunar-auspices .ec-lunar-data__title,
.ec-lunar-auspices .ec-biodynamic-council__title {
    font-size: 0.73rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--subdued-text, #454545);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
}
.ec-lunar-auspices .ec-lunar-data__toggle,
.ec-lunar-auspices .ec-biodynamic-council__toggle {
    background: none;
    border: 1px solid rgba(127,127,127,0.28);
    border-radius: 3px;
    cursor: pointer;
    color: var(--subdued-text, #454545);
    font-size: 0.80rem;
    padding: 0 3px;
    font-weight: 700;
    line-height: 1.3;
}
.ec-lunar-auspices .ec-lunar-data__grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 3px 14px;
    margin: 0;
    font-size: 0.82rem;
}
.ec-lunar-auspices .ec-lunar-data__grid dd { margin: 0; }
.ec-lunar-auspices .ec-lunar-auspices__empty {
    color: var(--subdued-text, #454545);
    font-style: italic;
}
.ec-lunar-auspices .ec-biodynamic-council__body { display: none; font-size: 0.84rem; }
.ec-lunar-auspices .ec-biodynamic-council__label { font-weight: 700; margin-bottom: 4px; font-size: 0.88rem; }
.ec-lunar-auspices .ec-biodynamic-council__summary { margin-bottom: 6px; line-height: 1.35; }
.ec-lunar-auspices .ec-biodynamic-council__counsel { font-style: italic; margin-bottom: 8px; line-height: 1.35; }
.ec-lunar-auspices .ec-biodynamic-council__section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--subdued-text, #454545);
    margin: 6px 0 3px 0;
}
.ec-lunar-auspices .ec-biodynamic-council__list { margin: 0 0 6px 0; padding-left: 16px; }
.ec-lunar-auspices .ec-biodynamic-council__warning {
    padding: 6px 10px;
    border-radius: 8px;
    background: rgba(220,170,80,0.14);
    border: 1px solid rgba(220,170,80,0.28);
    margin-top: 6px;
}
        */

    /**
     * Render lunar auspices panel.
     * This remains a lunar-focused card and preserves the existing lunar UI.
     */
    C.renderLunarAuspices = function (targetDate, config, lunarOptions) {
        ensureAuspicesStyles();

        var date = normalizeDate(targetDate);
        var auspices = C.getLunarAuspices(date, config, lunarOptions);

        var panel = document.createElement("div");
        panel.className = "ec-lunar-auspices";

        if (!auspices) {
            panel.innerHTML = '<div class="ec-lunar-auspices__empty">No lunar auspices available.</div>';
            return panel;
        }

        var summary = auspices.summary || {};
        var primaryTag = auspices.primaryTag || null;
        var warningTags = auspices.warningTags || [];
        var tags = auspices.tags || [];
        var suggestedActions = auspices.suggestedActions || [];
        var lunarMoment = auspices.lunarMoment || {};

        var emoji = getMoonPhaseEmoji(lunarMoment.phase);
        var stageLower = summary.stage ? summary.stage.toLowerCase() : "";

        var stageHtml = summary.stage
            ? '<span class="ec-lunar-auspices__stage ec-lunar-auspices__stage--' + esc(stageLower) + '">' + esc(summary.stage) + "</span>"
            : "";

        var secondaryHtml = summary.secondaryLabel
            ? '<div class="ec-lunar-auspices__secondary">' + esc(summary.secondaryLabel) + "</div>"
            : "";

        var effectHtml = summary.innerEffect
            ? '<div class="ec-lunar-auspices__effect">' + esc(summary.innerEffect) + "</div>"
            : "";

        var guidanceHtml = summary.guidance
            ? '<div class="ec-lunar-auspices__guidance">' + esc(summary.guidance) + "</div>"
            : "";

        var tagsHtml = tags.length
            ? '<div class="ec-lunar-tags">' + tags.map(buildTagHtml).join("") + "</div>"
            : "";

        var warningsHtml = buildWarningsHtml(warningTags);
        var actionsHtml = buildActionsHtml(suggestedActions);
        var biodynamicCouncilHtml = buildBiodynamicCouncilHtml(date);
        var ancestralExampleHtml = buildAncestralExampleHtml(auspices ? (auspices.tagIds || []) : []);
        var lunarDataHtml = buildLunarDataHtml(lunarMoment);

        panel.innerHTML =
            '<div class="ec-lunar-auspices__header">' +
            '<span class="ec-lunar-auspices__emoji" aria-hidden="true">' + emoji + "</span>" +
            '<div class="ec-lunar-auspices__labels">' +
            '<div class="ec-lunar-auspices__primary">' + esc(summary.primaryLabel || "Lunar Moment") + "</div>" +
            secondaryHtml +
            effectHtml +
            "</div>" +
            '<div class="ec-lunar-auspices__header-right">' +
            stageHtml +
            '<div class="ec-lunar-auspices__btn-row">' +
            '<button class="ec-lunar-auspices__expand-btn" aria-label="Expand lunar details" title="Show more"></button>' +
            '<button class="ec-lunar-auspices__close-btn" aria-label="Close" title="Close">✕</button>' +
            '<button class="ec-lunar-auspices__info-btn" aria-label="About the Auspicer" title="About the Auspicer">ⓘ</button>' +
            '</div>' +
            "</div>" +
            "</div>" +
            '<div class="ec-lunar-auspices__body">' +
            guidanceHtml +
            tagsHtml +
            warningsHtml +
            actionsHtml +
            biodynamicCouncilHtml +
            ancestralExampleHtml +
            lunarDataHtml +
            '<div class="ec-lunar-auspices__info-panel">' +
            '<p>The Earthen Auspicer reads the living sky above your moment, translating the current position of the Moon and Sun into practical, culturally-grounded guidance for your chosen date. Rather than abstract prediction, it offers a window into the natural forces at play — the phase of the Moon, its zodiacal placement, and the quality of light the Earth is receiving from the Sun.</p>' +
            '<p>Each auspice is generated by layering lunar phase energy with solar seasonal context. The Moon\'s cycle governs rhythm, feeling, and timing — waxing phases favour beginnings and outward action, waning phases favour completion and reflection, while the Full and New Moons mark moments of peak intensity and fresh starts. The solar layer adds the broader seasonal quality, anchoring your moment within Earth\'s annual breath. Together they form a composite reading of the day\'s character.</p>' +
            '<p>Use the Auspicer as a living compass for choosing the right time: when to plant, when to rest, when to reach out, when to turn inward. It surfaces what indigenous and ancestral traditions have long understood — that timing aligned with natural cycles produces more harmonious outcomes. Planetary auspices are coming soon, deepening the reading with the influence of visible planets.</p>' +
            '<div class="ec-lunar-auspices__info-footer">Auspicer data is determined by today\'s lunar and solar positions given your set position (long: 110.3274, lat: -7.8877).</div>' +
            '</div>' +
            "</div>";

        panel.dataset.lunarPrimaryTag = primaryTag ? primaryTag.id : "";
        panel.dataset.lunarPhase = lunarMoment.phaseName || "";
        panel.dataset.lunarCombo = lunarMoment.comboName || "";

        var header = panel.querySelector(".ec-lunar-auspices__header");
        if (header) {
            header.addEventListener("click", function () {
                panel.classList.toggle("is-expanded");
            });
        }

        var dataToggleBtn = panel.querySelector(".ec-lunar-data__toggle");
        if (dataToggleBtn) {
            dataToggleBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                var grid = dataToggleBtn.closest(".ec-lunar-data").querySelector(".ec-lunar-data__grid");
                if (!grid) return;

                var expanded = dataToggleBtn.getAttribute("aria-expanded") === "true";
                if (expanded) {
                    grid.style.display = "none";
                    dataToggleBtn.setAttribute("aria-expanded", "false");
                    dataToggleBtn.textContent = "+";
                } else {
                    grid.style.display = "";
                    dataToggleBtn.setAttribute("aria-expanded", "true");
                    dataToggleBtn.textContent = "−";
                }
            });
        }

        var bdcToggleBtn = panel.querySelector(".ec-biodynamic-council__toggle");
        if (bdcToggleBtn) {
            bdcToggleBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                var body = bdcToggleBtn.closest(".ec-biodynamic-council").querySelector(".ec-biodynamic-council__body");
                if (!body) return;

                var expanded = bdcToggleBtn.getAttribute("aria-expanded") === "true";
                if (expanded) {
                    body.style.display = "none";
                    bdcToggleBtn.setAttribute("aria-expanded", "false");
                    bdcToggleBtn.textContent = "+";
                } else {
                    body.style.display = "block";
                    bdcToggleBtn.setAttribute("aria-expanded", "true");
                    bdcToggleBtn.textContent = "−";
                }
            });
        }

        var aeToggleBtn = panel.querySelector(".ec-ancestral-example__toggle");
        if (aeToggleBtn) {
            aeToggleBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                var body = aeToggleBtn.closest(".ec-ancestral-example").querySelector(".ec-ancestral-example__body");
                if (!body) return;

                var expanded = aeToggleBtn.getAttribute("aria-expanded") === "true";
                if (expanded) {
                    body.style.display = "none";
                    aeToggleBtn.setAttribute("aria-expanded", "false");
                    aeToggleBtn.textContent = "+";
                } else {
                    body.style.display = "block";
                    aeToggleBtn.setAttribute("aria-expanded", "true");
                    aeToggleBtn.textContent = "−";
                }
            });
        }

        var closeBtn = panel.querySelector(".ec-lunar-auspices__close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                var pallette = panel.closest(".auspicer-pallette");
                if (pallette) {
                    pallette.style.display = "none";
                    return;
                }
                var dashPanel = document.getElementById("lunar-auspices-dash-panel");
                if (dashPanel) {
                    dashPanel.style.display = "none";
                }
            });
        }

        var infoBtn = panel.querySelector(".ec-lunar-auspices__info-btn");
        if (infoBtn) {
            infoBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                if (panel.classList.contains("is-info-mode")) {
                    panel.classList.remove("is-info-mode");
                    panel.classList.remove("is-expanded");
                } else {
                    panel.classList.add("is-info-mode");
                    panel.classList.add("is-expanded");
                }
            });
        }

        return panel;
    };

    /**
     * Generic multi-layer renderer.
     *
     * Uses:
     * - C.getAuspices(...)
     *
     * Current behavior:
     * - renders both lunar and solar-informed auspices
     * - shows solar seasonal / light-half context when active
     * - includes biodynamic council only when the highest-priority tag is lunar
     */
    C.renderAuspices = function (targetDate, config, options) {
        ensureAuspicesStyles();

        var date = normalizeDate(targetDate);
        var auspices = C.getAuspices(date, config, options || {});

        var panel = document.createElement("div");
        panel.className = "ec-lunar-auspices";

        if (!auspices) {
            panel.innerHTML = '<div class="ec-lunar-auspices__empty">No auspices available.</div>';
            return panel;
        }

        var summary = auspices.summary || {};
        var primaryTag = auspices.primaryTag || null;
        var warningTags = auspices.warningTags || [];
        var tags = auspices.tags || [];
        var suggestedActions = auspices.suggestedActions || [];
        var lunarMoment = auspices.lunarMoment || null;
        var solarMoment = auspices.solarMoment || null;

        var emoji = "✨";
        if (primaryTag && primaryTag.layer === "solar") {
            emoji = getSolarEmoji(solarMoment);
        } else if (lunarMoment) {
            emoji = getMoonPhaseEmoji(lunarMoment.phase);
        } else if (solarMoment) {
            emoji = getSolarEmoji(solarMoment);
        }

        var stageLower = summary.stage ? summary.stage.toLowerCase() : "";

        var stageHtml = summary.stage
            ? '<span class="ec-lunar-auspices__stage ec-lunar-auspices__stage--' + esc(stageLower) + '">' + esc(summary.stage) + "</span>"
            : "";

        var secondaryHtml = summary.secondaryLabel
            ? '<div class="ec-lunar-auspices__secondary">' + esc(summary.secondaryLabel) + "</div>"
            : "";

        var effectHtml = summary.innerEffect
            ? '<div class="ec-lunar-auspices__effect">' + esc(summary.innerEffect) + "</div>"
            : "";

        var guidanceHtml = summary.guidance
            ? '<div class="ec-lunar-auspices__guidance">' + esc(summary.guidance) + "</div>"
            : "";

        var tagsHtml = tags.length
            ? '<div class="ec-lunar-tags">' + tags.map(buildTagHtml).join("") + "</div>"
            : "";

        var warningsHtml = buildWarningsHtml(warningTags);
        var actionsHtml = buildActionsHtml(suggestedActions);

        var biodynamicCouncilHtml = "";
        if (primaryTag && primaryTag.layer === "lunar") {
            biodynamicCouncilHtml = buildBiodynamicCouncilHtml(date);
        }

        var ancestralExampleHtml = buildAncestralExampleHtml(auspices.tagIds || []);

        var location = (options && options.location) ? options.location : null;
        var lunarDataHtml = lunarMoment ? buildLunarDataHtml(lunarMoment) : "";
        var solarDataHtml = solarMoment ? buildSolarDataHtml(solarMoment, location) : "";

        panel.innerHTML =
            '<div class="ec-lunar-auspices__header">' +
            '<span class="ec-lunar-auspices__emoji" aria-hidden="true">' + emoji + "</span>" +
            '<div class="ec-lunar-auspices__labels">' +
            '<div class="ec-lunar-auspices__primary">' + esc(summary.primaryLabel || "Auspice") + "</div>" +
            secondaryHtml +
            effectHtml +
            "</div>" +
            '<div class="ec-lunar-auspices__header-right">' +
            stageHtml +
            '<div class="ec-lunar-auspices__btn-row">' +
            '<button class="ec-lunar-auspices__expand-btn" aria-label="Expand auspices details" title="Show more"></button>' +
            '<button class="ec-lunar-auspices__close-btn" aria-label="Close" title="Close">✕</button>' +
            '<button class="ec-lunar-auspices__info-btn" aria-label="About the Auspicer" title="About the Auspicer">ⓘ</button>' +
            '</div>' +
            "</div>" +
            "</div>" +
            '<div class="ec-lunar-auspices__body">' +
            guidanceHtml +
            '<div class="ec-lunar-auspices__scroll-body">' +
            tagsHtml +
            warningsHtml +
            actionsHtml +
            biodynamicCouncilHtml +
            ancestralExampleHtml +
            lunarDataHtml +
            solarDataHtml +
            '</div>' +
            '<div class="ec-lunar-auspices__info-panel">' +
            '<p>The Earthen Auspicer reads the living sky above your moment, translating the current position of the Moon and Sun into practical, culturally-grounded guidance for your chosen date. Rather than abstract prediction, it offers a window into the natural forces at play — the phase of the Moon, its zodiacal placement, and the quality of light the Earth is receiving from the Sun.</p>' +
            '<p>Each auspice is generated by layering lunar phase energy with solar seasonal context. The Moon\'s cycle governs rhythm, feeling, and timing — waxing phases favour beginnings and outward action, waning phases favour completion and reflection, while the Full and New Moons mark moments of peak intensity and fresh starts. The solar layer adds the broader seasonal quality, anchoring your moment within Earth\'s annual breath. Together they form a composite reading of the day\'s character.</p>' +
            '<p>Use the Auspicer as a living compass for choosing the right time: when to plant, when to rest, when to reach out, when to turn inward. It surfaces what indigenous and ancestral traditions have long understood — that timing aligned with natural cycles produces more harmonious outcomes. Planetary auspices are coming soon, deepening the reading with the influence of visible planets.</p>' +
            '<div class="ec-lunar-auspices__info-footer">Auspicer data is determined by today\'s lunar and solar positions given your set position (long: 110.3274, lat: -7.8877).</div>' +
            '</div>' +
            "</div>";

        panel.dataset.auspicesPrimaryTag = primaryTag ? primaryTag.id : "";
        panel.dataset.auspicesPrimaryLayer = primaryTag ? primaryTag.layer : "";
        panel.dataset.lunarPhase = lunarMoment ? (lunarMoment.phaseName || "") : "";
        panel.dataset.solarAnchor = solarMoment ? (solarMoment.seasonalAnchor || "") : "";

        var header = panel.querySelector(".ec-lunar-auspices__header");
        if (header) {
            header.addEventListener("click", function () {
                panel.classList.toggle("is-expanded");
            });
        }

        var toggleButtons = panel.querySelectorAll(".ec-lunar-data__toggle, .ec-biodynamic-council__toggle, .ec-ancestral-example__toggle");
        for (var i = 0; i < toggleButtons.length; i++) {
            toggleButtons[i].addEventListener("click", function (e) {
                e.stopPropagation();

                var isCouncil   = this.classList.contains("ec-biodynamic-council__toggle");
                var isAncestral = this.classList.contains("ec-ancestral-example__toggle");
                var containerSel = isCouncil   ? ".ec-biodynamic-council"  :
                                   isAncestral ? ".ec-ancestral-example"   : ".ec-lunar-data";
                var bodySel      = isCouncil   ? ".ec-biodynamic-council__body" :
                                   isAncestral ? ".ec-ancestral-example__body"  : ".ec-lunar-data__grid";

                var container = this.closest(containerSel);
                if (!container) return;
                var body = container.querySelector(bodySel);
                if (!body) return;

                var expanded = this.getAttribute("aria-expanded") === "true";
                if (expanded) {
                    body.style.display = "none";
                    this.setAttribute("aria-expanded", "false");
                    this.textContent = "+";
                } else {
                    body.style.display = (isCouncil || isAncestral) ? "block" : "";
                    this.setAttribute("aria-expanded", "true");
                    this.textContent = "−";
                }
            });
        }

        var closeBtn = panel.querySelector(".ec-lunar-auspices__close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                var pallette = panel.closest(".auspicer-pallette");
                if (pallette) {
                    pallette.style.display = "none";
                    return;
                }
                var dashPanel = document.getElementById("lunar-auspices-dash-panel");
                if (dashPanel) {
                    dashPanel.style.display = "none";
                }
            });
        }

        var infoBtn = panel.querySelector(".ec-lunar-auspices__info-btn");
        if (infoBtn) {
            infoBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                if (panel.classList.contains("is-info-mode")) {
                    panel.classList.remove("is-info-mode");
                    panel.classList.remove("is-expanded");
                } else {
                    panel.classList.add("is-info-mode");
                    panel.classList.add("is-expanded");
                }
            });
        }

        return panel;
    };



    /**
     * displayEarthenAuspicer
     *
     * Renders the multi-layer Earthen Auspicer panel (solar + lunar) into the
     * Add Date Item form. Streamlined replacement for the legacy displayMoonPhasev1
     * in item-management.js. Uses SunCalc.renderAuspices() for full layered output.
     *
     * @param {Object}      [options]
     * @param {Date}        [options.date]      - Target date (defaults to now)
     * @param {HTMLElement} [options.container] - Host element (defaults to modal form)
     * @param {number}      [options.lat]       - Latitude  (defaults to Bali reference)
     * @param {number}      [options.lon]       - Longitude (defaults to Bali reference)
     * @returns {Object|null}  { emoji, phase, element }
     */
    function displayEarthenAuspicer(options) {
        options = options || {};
        var date      = options.date;
        var container = options.container;
        var lat       = options.lat;
        var lon       = options.lon;

        // --- Locate host element ---
        var host = null;
        if (container instanceof HTMLElement) {
            host = container;
        } else {
            host = document.querySelector("#modal-content .ec-add-form")
                || document.querySelector("#modal-content .add-date-form");
        }
        if (!host) {
            console.warn("[displayEarthenAuspicer] Unable to locate add item form container.");
            return null;
        }

        if (typeof C.renderAuspices !== "function") {
            console.warn("[displayEarthenAuspicer] SunCalc.renderAuspices unavailable.");
            return null;
        }

        var isValidDate = function (v) { return v instanceof Date && !isNaN(v.getTime()); };
        var target = isValidDate(date) ? date : new Date();

        var useLat = typeof lat === "number" ? lat : -8.506853;
        var useLon = typeof lon === "number" ? lon : 115.262477;

        // Quick lunar emoji for the loading placeholder
        var illum = (typeof C.getMoonIllumination === "function") ? C.getMoonIllumination(target) : null;
        var phase = (illum && Number.isFinite(illum.phase)) ? illum.phase : 0;
        var emoji = getMoonPhaseEmoji(phase);

        // --- Phase A: synchronous — insert wrapper with loading state ---
        var existing = host.querySelector(".auspicer-pallette");
        if (existing) existing.remove();

        var wrapper = document.createElement("div");
        wrapper.className = "auspicer-pallette";
        wrapper.innerHTML =
            '<div class="ec-auspice-details ec-auspice-details--loading">' +
            '<span aria-hidden="true" style="font-size:1.6rem;vertical-align:middle;margin-right:8px;">' + emoji + "</span>" +
            "Discerning Auspices\u2026" +
            "</div>";

        var title = host.querySelector(".ec-form-title");
        if (title && title.parentNode === host) {
            title.insertAdjacentElement("afterend", wrapper);
        } else {
            var form = host.querySelector("form");
            if (form) {
                host.insertBefore(wrapper, form);
            } else {
                host.prepend(wrapper);
            }
        }

        // --- Phase B: async — fire-and-forget auspices load ---
        _renderEarthenAuspicesAsync(target, wrapper, useLat, useLon);

        return { emoji: emoji, phase: phase, element: wrapper };
    }

    async function _renderEarthenAuspicesAsync(date, wrapper, lat, lon) {
        var showTime = Date.now();
        var detailsDiv;
        try {
            var cfg = window.EARTHCAL_AUSPICES_CONFIG
                || await C.loadAuspicesConfig("js/auspices/auspices-config.json");

            var auspicesEl = C.renderAuspices(date, cfg, { location: { lat: lat, lon: lon } });

            var elapsed = Date.now() - showTime;
            await new Promise(function (resolve) { setTimeout(resolve, Math.max(0, 500 - elapsed)); });

            detailsDiv = wrapper.querySelector(".ec-auspice-details");
            if (detailsDiv && auspicesEl instanceof HTMLElement) {
                detailsDiv.classList.remove("ec-auspice-details--loading");
                detailsDiv.innerHTML = "";
                detailsDiv.appendChild(auspicesEl);
            }
        } catch (err) {
            console.warn("[displayEarthenAuspicer] Failed to load auspices:", err);
            var elapsed2 = Date.now() - showTime;
            await new Promise(function (resolve) { setTimeout(resolve, Math.max(0, 500 - elapsed2)); });
            detailsDiv = wrapper.querySelector(".ec-auspice-details");
            if (detailsDiv) {
                detailsDiv.classList.remove("ec-auspice-details--loading");
                detailsDiv.textContent = "Auspices unavailable";
            }
        }
    }

    // Export for use from item-management.js and other external callers
    window.displayEarthenAuspicer = displayEarthenAuspicer;



    // =========================================================
    // 8. BACKWARD-COMPATIBILITY ALIASES
    // =========================================================
    //
    // Purpose:
    // --------
    // Preserve existing behavior while gradually moving toward broader,
    // non-lunar-specific naming.
    //

    C.loadLunarIntentionConfig = C.loadAuspicesConfig;

    C.getLunarAuspicesFromUrl = async function (date, configUrl, lunarOptions) {
        var cfg = await C.loadAuspicesConfig(configUrl);
        return C.getLunarAuspices(date, cfg, lunarOptions);
    };

}());