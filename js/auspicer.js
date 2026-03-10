/*
 * NEW: classify lunar moments for a target date.
 *
 * Uses:
 * - getMoonIllumination(date)
 * - getMoonOrbitData(date)
 *
 * Safe: additive only, does not alter existing APIs.
 */
(function () {
    var C = window.SunCalc;
    var E = Math.PI / 180;
    if (!C) { console.warn('auspicer.js: SunCalc not loaded'); return; }

C.getLunarMoment = function(date, options) {
    options = options || {};

    // --- Tunable thresholds ---
    var trendHours      = options.trendHours      != null ? options.trendHours      : 12;
    var newMoonWindow   = options.newMoonWindow   != null ? options.newMoonWindow   : 0.03;   // phase fraction of cycle
    var fullMoonWindow  = options.fullMoonWindow  != null ? options.fullMoonWindow  : 0.03;
    var nodeWindowDeg   = options.nodeWindowDeg   != null ? options.nodeWindowDeg   : 1.5;    // near ecliptic latitude 0
    var perigeeKm       = options.perigeeKm       != null ? options.perigeeKm       : 360000;
    var apogeeKm        = options.apogeeKm        != null ? options.apogeeKm        : 404000;

    var target = date || new Date();
    var future = new Date(target.valueOf() + trendHours * 3600000);

    var illum  = C.getMoonIllumination(target);
    var orbit0 = C.getMoonOrbitData(target);
    var orbit1 = C.getMoonOrbitData(future);

    var phase       = illum.phase;                // 0..1
    var fraction    = illum.fraction;
    var angleRad    = illum.angle;
    var angleDeg    = illum.angle / E;

    var distanceKm  = orbit0.distance;
    var dec0Deg     = orbit0.declinationDeg;
    var dec1Deg     = orbit1.declinationDeg;
    var beta0Deg    = orbit0.eclipticLatitudeDeg;
    var beta1Deg    = orbit1.eclipticLatitudeDeg;

    function cyclicDistance(a, b) {
        var d = Math.abs(a - b);
        return Math.min(d, 1 - d);
    }

    // --- Phase state ---
    var isNewMoon  = cyclicDistance(phase, 0) < newMoonWindow || cyclicDistance(phase, 1) < newMoonWindow;
    var isFullMoon = cyclicDistance(phase, 0.5) < fullMoonWindow;

    var waxing = !isNewMoon && !isFullMoon && phase > 0 && phase < 0.5;
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

    // --- Ascending / descending by declination trend ---
    var ascending = dec1Deg > dec0Deg;
    var descending = dec1Deg < dec0Deg;

    var motionName = "Stationary";
    if (ascending) motionName = "Ascending";
    if (descending) motionName = "Descending";

    // --- Combo state ---
    var comboName = phaseName;
    if (waxing || waning) {
        comboName = (waxing ? "Waxing" : "Waning") + " + " + motionName;
    } else if (isNewMoon || isFullMoon) {
        comboName = phaseName + (motionName !== "Stationary" ? " + " + motionName : "");
    }

    // --- Node window ---
    var nearNode = Math.abs(beta0Deg) <= nodeWindowDeg || (beta0Deg === 0) || (beta0Deg * beta1Deg < 0);

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

    // --- Distance windows ---
    var nearPerigee = distanceKm <= perigeeKm;
    var nearApogee  = distanceKm >= apogeeKm;

    // --- Eclipse windows ---
    var eclipseType = "none";
    if (isNewMoon && nearNode) {
        eclipseType = "solar eclipse window";
    } else if (isFullMoon && nearNode) {
        eclipseType = "lunar eclipse window";
    }

    // --- Collect all matching moments ---
    var moments = [];

    // phase moments
    if (isNewMoon) moments.push("New Moon");
    if (isFullMoon) moments.push("Full Moon");
    if (waxing) moments.push("Waxing");
    if (waning) moments.push("Waning");

    // declination motion moments
    if (ascending) moments.push("Ascending");
    if (descending) moments.push("Descending");

    // combo moment
    if (waxing || waning || isNewMoon || isFullMoon) {
        moments.push(comboName);
    }

    // node / distance / eclipse moments
    if (nearNode) moments.push(nodeType);
    if (nearPerigee) moments.push("Perigee Window");
    if (nearApogee) moments.push("Apogee Window");
    if (eclipseType !== "none") moments.push(eclipseType);

    return {
        date: target,

        // primary labels
        phaseName: phaseName,
        motionName: motionName,
        comboName: comboName,

        // booleans
        isNewMoon: isNewMoon,
        isFullMoon: isFullMoon,
        waxing: waxing,
        waning: waning,
        ascending: ascending,
        descending: descending,
        nearNode: nearNode,
        nearPerigee: nearPerigee,
        nearApogee: nearApogee,

        // node / eclipse
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

        // all matching moment labels
        moments: moments
    };
};

}());
