/* ============================================================
   EARTHCAL — PLANET ORBITS (ROTATE PLANET GROUPS AROUND THE SUN)
   - Epoch = Jan 1, 2023 (SVG planet positions represent this)
   - Rotates ONLY the planet groups (#mercury, #venus, ...) — NOT the orbit circles
   - DST-safe day math (UTC midnight)
   - Two-frame init (set start, then animate next frame) to prevent “backstep”
   - Reverse-time animation fixed (unwrap direction follows time jump)
   - Per-planet FPS throttling (Earth smooth, outer planets low FPS)
   ============================================================ */


/* ============================================================
   1) UTC DAY MATH (DST-SAFE)
   ============================================================ */
/* ============================================================
   EARTHCAL — PLANET ORBITS (ROTATE PLANET GROUPS AROUND THE SUN)
   Uses SVG epoch rotations as baseline (Jan 1, 2023)
   ============================================================ */

function utcMidnight(y, m, d) { return Date.UTC(y, m, d); }

function daysBetweenUTC(a, b) {
    const msPerDay = 86400000;
    const A = utcMidnight(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
    const B = utcMidnight(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
    return (B - A) / msPerDay;
}

function durationForDayJump(dayJump) {
    const d = Math.abs(dayJump);
    if (d < 30) return 500;
    if (d < 60) return 1000;
    if (d < 120) return 1500;
    if (d < 180) return 2000;
    if (d <= 366) return 3000;
    return 4000;
}

/* 2) ANGLE HELPERS */
function parseRotateDegrees(transformStr) {
    const m = /rotate\(\s*([-+0-9.]+)/.exec(transformStr || "");
    return m ? parseFloat(m[1]) : 0;
}

function unwrapAngleBySign(startDeg, endDeg, directionSign) {
    if (directionSign > 0) {
        while (endDeg < startDeg) endDeg += 360;
    } else {
        while (endDeg > startDeg) endDeg -= 360;
    }
    return endDeg;
}

/* 3) PLANET ROTATOR (epoch angle comes from SVG once) */
class PlanetGroupRotator {
    constructor(groupId, orbitDays, pivot, { direction = +1, minFrameMs = 0 } = {}) {
        this.groupId = groupId;
        this.orbitDays = orbitDays;
        this.direction = direction;
        this.pivot = pivot;
        this.minFrameMs = minFrameMs;

        this.el = document.getElementById(groupId);
        if (!this.el) {
            console.warn(`Missing planet group: #${groupId}`);
            this.ok = false;
            return;
        }
        this.ok = true;

        // Cache epoch angle ONCE (SVG contains Jan 1 2023 pose)
        if (this.el.dataset.ecEpochAngle == null) {
            const tf = this.el.getAttribute("transform") || "";
            this.el.dataset.ecEpochAngle = String(parseRotateDegrees(tf));
        }
        this.epochAngle = parseFloat(this.el.dataset.ecEpochAngle);

        this._lastSetMs = -Infinity;
    }

    angleAt(date, epochDate) {
        const days = daysBetweenUTC(epochDate, date);
        const rev = days / this.orbitDays;
        return this.epochAngle + this.direction * rev * 360;
    }

    setAngle(angleDeg, nowMs = performance.now()) {
        if (!this.ok) return;
        if (this.minFrameMs > 0 && nowMs - this._lastSetMs < this.minFrameMs) return;
        this._lastSetMs = nowMs;

        const { x, y } = this.pivot;
        this.el.setAttribute("transform", `rotate(${angleDeg} ${x} ${y})`);
    }

    forceAngle(angleDeg) {
        if (!this.ok) return;
        const { x, y } = this.pivot;
        this.el.setAttribute("transform", `rotate(${angleDeg} ${x} ${y})`);
        this._lastSetMs = performance.now();
    }
}

/* 4) BUILD + EXPORT animatePlanets */
function buildSolarAnimatorByRotation() {
    const root = document.getElementById("solar-system-center");
    if (!root) throw new Error("Missing #solar-system-center");

    const sol = root.querySelector("#sol");
    if (!sol) throw new Error("Missing #sol");

    const pivot = { x: sol.cx.baseVal.value, y: sol.cy.baseVal.value };
    const epochDate = new Date(Date.UTC(2025, 0, 1));

    const planets = [
        new PlanetGroupRotator("mercury", 88, pivot, { direction: +1, minFrameMs: 0 }),
        new PlanetGroupRotator("venus", 224.7, pivot, { direction: +1, minFrameMs: 0 }),
        new PlanetGroupRotator("earth", 365.256, pivot, { direction: +1, minFrameMs: 0 }),
        new PlanetGroupRotator("mars", 686.98, pivot, { direction: +1, minFrameMs: 16 }),
        new PlanetGroupRotator("jupiter", 4332.59, pivot, { direction: +1, minFrameMs: 48 }),
        new PlanetGroupRotator("saturn", 10759, pivot, { direction: +1, minFrameMs: 120 }),
        new PlanetGroupRotator("uranus", 30687, pivot, { direction: +1, minFrameMs: 160 }),
        new PlanetGroupRotator("neptune", 60190, pivot, { direction: +1, minFrameMs: 200 }),
    ].filter(p => p.ok);

    let lastKey = "";
    let animToken = 0;

    return function animatePlanets(startDate, targetDate) {
        if (!(startDate instanceof Date) || !(targetDate instanceof Date)) {
            console.warn("animatePlanets expects (Date startDate, Date targetDate)");
            return;
        }

        const dayJump = daysBetweenUTC(startDate, targetDate);
        const duration = durationForDayJump(dayJump);
        const jumpSign = Math.sign(dayJump) || 1;

        const key = `${startDate.toISOString()}__${targetDate.toISOString()}`;
        if (key === lastKey) return;
        lastKey = key;

        const plan = planets.map(p => {
            const a0 = p.angleAt(startDate, epochDate);
            let a1 = p.angleAt(targetDate, epochDate);

            const desiredSign = p.direction * jumpSign;
            a1 = unwrapAngleBySign(a0, a1, desiredSign);

            return { p, a0, a1 };
        });

        // Snap if no duration
        if (!duration || duration <= 0) {
            for (const { p, a1 } of plan) p.forceAngle(a1);
            return;
        }

        // Set planets to start pose FIRST (so Jan 1 2023 matches SVG perfectly when startDate=epoch)
        for (const { p, a0 } of plan) p.forceAngle(a0);

        const myToken = ++animToken;

        // Two-frame init: begin interpolation next frame
        requestAnimationFrame(() => {
            if (myToken !== animToken) return;
            const t0 = performance.now();

            function tick(now) {
                if (myToken !== animToken) return;

                const t = (now - t0) / duration;
                if (t >= 1) {
                    for (const { p, a1 } of plan) p.forceAngle(a1);
                    return;
                }

                for (const { p, a0, a1 } of plan) {
                    p.setAngle(a0 + (a1 - a0) * t, now);
                }
                requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        });
    };
}

/* 5) GLOBAL INIT */
window.initPlanetAnimator = function initPlanetAnimator() {
    if (typeof window.animatePlanets === "function") return window.animatePlanets;
    window.animatePlanets = buildSolarAnimatorByRotation();
    return window.animatePlanets;
};







/*----------------------------------


PLANET DATA


----------------------------------*/




/*----------VENUS--------------------*/


function UpdateVenusData(date) {

    const now = date;

    let VenusElong = Astronomy.Elongation('Venus', now);
    let VenusIllum = Astronomy.Illumination('Venus', now);
    let max_mag = -4.89;
    let max_dist = 1.728;
    let current_mag = VenusIllum.mag;
    let current_dist = VenusIllum.geo_dist;
    let per_dist = (current_dist / max_dist) * 100;
    let magPercent = (current_mag / max_mag) * 100;


    const elongation = VenusElong.elongation;
    const illumination = VenusIllum.phase_fraction;
    const distance = (max_dist / max_mag) * 100;

    //  let VenusMag = Astronomy.SearchPeakMagnitude('Venus', now);
    //  let VenusAngle = Astronomy.AngleFromSun('Venus', now);
    //alert (VenusElong);
    //alert("Venus:" + elongation);
    //  let synodicPeriod = 584; // Venus synodic period in days

    const illuminatedFraction = illumination.toFixed(2);
    let VenusOpposition = Astronomy.SearchRelativeLongitude('Venus', 0, now);
    const daysTilOpposition = daysBetweenDates(now, VenusOpposition.date);

    // Determine Venus phase based on phase days

    let phase;
    let phaseDescription;

    if (daysTilOpposition < 2) {
        phase = '🌚';
        phaseDescription = "in Opposition";
        phaseSize = "100%";
    }
    if (daysTilOpposition >= 2 && daysTilOpposition < 5) {
        phase = "🌑";
        phaseDescription = "New";
    }
    if (daysTilOpposition >= 5 && daysTilOpposition < 18) {
        phase = "🌒";
        phaseDescription = "Waxing Crescent";

    }
    if (daysTilOpposition >= 18 && daysTilOpposition < 34) {
        phase = "🌓";
        phaseDescription = "1st Quarter";

    }
    if (daysTilOpposition >= 34 && daysTilOpposition < 36) {
        phase = "🌓";
        phaseDescription = "Max Elongation";
    }
    if (daysTilOpposition >= 36 && daysTilOpposition < 66) {
        phase = "🌓";
        phaseDescription = "2nd Quarter";
    }
    if (daysTilOpposition >= 66 && daysTilOpposition < 267) {
        phase = "🌔";
        phaseDescription = "3rd Quarter";
    }
    if (daysTilOpposition >= 267 && daysTilOpposition < 291) {
        phase = "🌕";
        phaseDescription = "conjunction";
    }
    if (daysTilOpposition >= 291 && daysTilOpposition < 293) {
        phase = "🌚";
        phaseDescription = "superior conjunction";
    }
    if (daysTilOpposition >= 293 && daysTilOpposition < 317) {
        phase = "🌕";
        phaseDescription = "hidden behind sun";
    }
    if (daysTilOpposition >= 317 && daysTilOpposition < 517) {
        phase = "🌖";
        phaseDescription = "remerging";
    }
    if (daysTilOpposition >= 517 && daysTilOpposition < 548) {
        phase = "🌗";
        phaseDescription = "4th Quarter";
    }
    if (daysTilOpposition >= 548 && daysTilOpposition < 550) {
        phase = "🌗";
        phaseDescription = "Max Elongation";
    }
    if (daysTilOpposition >= 550 && daysTilOpposition < 555) {
        phase = "🌗";
        phaseDescription = "Waning Crescent";
    }
    if (daysTilOpposition >= 555 && daysTilOpposition < 580) {
        phase = "🌘";
        phaseDescription = "Waning Crescent";
    }
    if (daysTilOpposition >= 580 && daysTilOpposition < 583) {
        phase = "🌑";
        phaseDescription = "New";
    }
    if (daysTilOpposition >= 583) {
        phase = "🌚";
        phaseDescription = "in Opposition";
    }

    document.getElementById("venus-phase").innerHTML = phase;

    document.getElementById("venus-phase-info").innerHTML = "<span style=\"font-size:1.5em\">Venus ♀</span><br>" + phaseDescription + "@" + illuminatedFraction +
        "<br>" + "Magnitude: " + VenusIllum.mag.toFixed(2) +
        "<br>Days to Opposition: " +
        daysTilOpposition.toFixed(0) +
        "<br>Max Magnitude:" + magPercent.toFixed(0) +
        '<br>Dist.:' + VenusIllum.geo_dist.toFixed(1) + ' AU (' + per_dist.toFixed(0) + '% of max)';

    adjustVenusSize(per_dist);
    adjustVenusPhaseMagnitude(magPercent);
}

/*Adjusts Venus icon size depending on how far away the planet is*/

function adjustVenusSize(per_dist) {
    let minSize, maxSize;

    if (window.innerWidth < 700) {
        minSize = 1.3;
        maxSize = 2.0;
    } else {
        minSize = 3.2;
        maxSize = 4.7;
    }

    const size = ((minSize - maxSize) * per_dist / 100) + maxSize;
    const venusPhase = document.getElementById("venus-phase");
    venusPhase.style.fontSize = `${size}em`;
}

/*Increases of decrease the brightness of the icon based on the planet's magnitude*/

function adjustVenusPhaseMagnitude(magPercent, minOpacity = 0, maxOpacity = 1, sensitivity = 1) {
    const opacity = minOpacity + (magPercent / 100) * (maxOpacity - minOpacity) * sensitivity; // calculate opacity based on magPercent and sensitivity
    const emojiElement = document.getElementById("venus-phase");
    emojiElement.style.opacity = opacity;
}

function daysBetweenDates(date1, date2) {
    // Convert both dates to milliseconds
    const date1Ms = date1.getTime();
    const date2Ms = date2.getTime();
    // Calculate the difference in milliseconds
    const differenceMs = Math.abs(date1Ms - date2Ms);
    // Convert the difference to days and return
    return differenceMs / (1000 * 60 * 60 * 24);
}


/*MARS PLANET DATA*/

function UpdateMarsData(date) {
    const now = date;

    let MarsElong = Astronomy.Elongation('Mars', now);
    let MarsAngle = Astronomy.AngleFromSun('Mars', now);
    let MarsIllum = Astronomy.Illumination('Mars', now);
    let max_mag = -2.91;
    let max_dist = 2.68;
    let current_mag = MarsIllum.mag;
    let current_dist = MarsIllum.geo_dist;
    let per_dist = (current_dist / max_dist) * 100;
    let magPercent = (current_mag / max_mag) * 100;

    const marsElongation = MarsElong.elongation;
    const illumination = MarsIllum.phase_fraction;
    // const distance = (max_dist / max_mag) * 100;

    const illuminatedFraction = illumination.toFixed(2);
    let MarsOpposition = Astronomy.SearchRelativeLongitude('Mars', 0, now);
    let synodicPeriod = 780; // Mars synodic period in days
    const daysTilOpposition = daysBetweenDates(now, MarsOpposition.date);


    // Determine Mars phase based on phase days
    let phase;
    let phaseDescription;

    if (daysTilOpposition > 2) {
        phase = "🌕";
        phaseDescription = "Full";
    }

    if (daysTilOpposition <= 2 || daysTilOpposition >= 778) {
        phase = '🌚';
        phaseDescription = "In Opposition";
        phaseSize = "100%";
    }
    if (daysTilOpposition >= 2 && daysTilOpposition < 5) {
        phase = "🌑";
        phaseDescription = "Nearing opposition";
    }
    if (marsElongation < 96 && marsElongation > 92) {
        phase = '🌖';
        phaseDescription = "at quadrature";
        phaseSize = "90%";
    }
    if (marsElongation < 92 && marsElongation > 88) {
        phase = '🌗';
        phaseDescription = "at quadrature";
        phaseSize = "90%";
    }
    if (marsElongation < 88 && marsElongation > 82) {
        phase = '🌖';
        phaseDescription = "at quadrature";
        phaseSize = "90%";
    }

    if (marsElongation < 178 && marsElongation > 170) {
        phase = '🌔';
        phaseDescription = "at quadrature";
        phaseSize = "90%";
    }

    if (marsElongation < 182 && marsElongation > 178) {
        phase = '🌗';
        phaseDescription = "at quadrature";
        phaseSize = "90%";
    }

    if (marsElongation < 2) {
        phase = '🌝';
        phaseDescription = "at opposition";
        phaseSize = "90%";
    }

    document.getElementById("mars-phase").innerHTML = phase;
    document.getElementById("mars-phase-info").innerHTML =
        "<span style=\"font-size:1.3em\">Mars ♂</span><br>" +
        phaseDescription + "" +

        "Magnitude: " +
        MarsIllum.mag.toFixed(2) +
        // "<br>Percent of Max Magnitude: " +
        // magPercent.toFixed(2) +
        "<br>Elongation: " +
        marsElongation.toFixed(1) +
        "°<br>Days to Opposition: " +
        daysTilOpposition.toFixed(0) +
        "<br>Illuminated fraction: " +
        illuminatedFraction +
        "<br>Dist: " +
        MarsIllum.geo_dist.toFixed(1) +
        " AU (" +
        per_dist.toFixed(0) +
        "% of max)";

    adjustMarsSize(per_dist);
}

function adjustMarsSize(per_dist) {
    let minSize, maxSize;

    if (window.innerWidth < 700) {
        minSize = 1.3;
        maxSize = 2.0;
    } else {
        minSize = 3.2;
        maxSize = 4.7;
    }

    const size = ((minSize - maxSize) * per_dist / 100) + maxSize;
    const marsPhase = document.getElementById("mars-phase");
    marsPhase.style.fontSize = `${size}em`;
}

function adjustMarsPhaseMagnitude(
    magPercent,
    minOpacity = 0,
    maxOpacity = 1,
    sensitivity = 1
) {
    const opacity =
        minOpacity +
        (magPercent / 100) * (maxOpacity - minOpacity) * sensitivity; // calculate opacity based on magPercent and sensitivity
    const emojiElement = document.getElementById("mars-phase");
    emojiElement.style.opacity = opacity;
}


/*JUPITER PLANET DATA*/

function UpdateJupiterData(date) {
    const now = date;

    let JupiterElong = Astronomy.Elongation('Jupiter', now);
    let JupiterAngle = Astronomy.AngleFromSun('Jupiter', now);
    let JupiterIllum = Astronomy.Illumination('Jupiter', now);
    let max_mag = -2.9;
    let max_dist = 6.9;
    let min_dist = 4.0;
    let current_mag = JupiterIllum.mag;
    let current_dist = JupiterIllum.geo_dist;
    let per_dist = ((current_dist - min_dist) / (max_dist - min_dist)) * 100;
    let magPercent = (current_mag / max_mag) * 100;

    const jupiterElongation = JupiterElong.elongation;
    const illumination = JupiterIllum.phase_fraction;
    // const distance = (max_dist / max_mag) * 100;

    const illuminatedFraction = illumination.toFixed(2);
    let JupiterOpposition = Astronomy.SearchRelativeLongitude('Jupiter', 0, now);
    let synodicPeriod = 398.88; // Jupiter synodic period in days
    const daysTilOpposition = daysBetweenDates(now, JupiterOpposition.date);


    // Determine Jupiter phase based on phase days
    let phase = "🌕";
    let phaseDescription = "Jupiter ♃";
    /*
      if  (daysTilOpposition > 2) {
        phase = "🌕";
        phaseDescription = "<span style=\"font-size:1.3em\">♄ Jupiter</span>";
      }

      if (daysTilOpposition <= 2 || daysTilOpposition >= 778) {
        phase = '🌚';
        phaseDescription = "Saturn is in Opposition";
      }
      if (daysTilOpposition >= 2 && daysTilOpposition < 5) {
        phase = "🌑";
        phaseDescription = "Saturn cannot be seen as it approaches opposition";
      }

    */


    document.getElementById("jupiter-phase").innerHTML = phase;
    document.getElementById("jupiter-phase-info").innerHTML =
        "<span style=\"font-size:1.5em\">" + phaseDescription + "</span><br>Magnitude:" +
        JupiterIllum.mag.toFixed(1) +
        // "<br>Percent of Max Magnitude: " +
        // magPercent.toFixed(2) +
        "<br>Elongation: " +
        jupiterElongation.toFixed(1) +
        "°<br>Days to Opposition: " +
        daysTilOpposition.toFixed(0) +
        // "<br>Illuminated fraction: " +
        // illuminatedFraction +
        "<br>Dist.: " +
        JupiterIllum.geo_dist.toFixed(1) +
        "AU (" +
        per_dist.toFixed(0) +
        "% of max)";

    adjustJupiterSize(per_dist);
}

function adjustJupiterSize(per_dist) {
    let minSize, maxSize;

    if (window.innerWidth < 700) {
        minSize = 1.3;
        maxSize = 2.0;
    } else {
        minSize = 2;
        maxSize = 4;
    }

    const size = ((minSize - maxSize) * per_dist / 100) + maxSize;
    const marsPhase = document.getElementById("jupiter-phase");
    marsPhase.style.fontSize = `${size}em`;
}




/*SATURN PLANET DATA*/

function UpdateSaturnData(date) {
    const now = date;

    let SaturnElong = Astronomy.Elongation('Saturn', now);
    let SaturnAngle = Astronomy.AngleFromSun('Saturn', now);
    let SaturnIllum = Astronomy.Illumination('Saturn', now);
    let max_mag = -0.2;
    let max_dist = 11.36;
    let min_dist = 8.03;
    let current_mag = SaturnIllum.mag;
    let current_dist = SaturnIllum.geo_dist;
    let per_dist = ((current_dist - min_dist) / (max_dist - min_dist)) * 100;
    let magPercent = (current_mag / max_mag) * 100;

    const saturnElongation = SaturnElong.elongation;
    const illumination = SaturnIllum.phase_fraction;
    // const distance = (max_dist / max_mag) * 100;

    const illuminatedFraction = illumination.toFixed(2);
    let SaturnOpposition = Astronomy.SearchRelativeLongitude('Saturn', 0, now);
    let synodicPeriod = 378; // Saturn synodic period in days
    const daysTilOpposition = daysBetweenDates(now, SaturnOpposition.date);


    // Determine Saturn phase based on phase days
    let phase = "🪐";
    let phaseDescription = "Saturn ♄";
    /*
      if  (daysTilOpposition > 2) {
        phase = "🌕";
        phaseDescription = "<span style=\"font-size:1.3em\">♄ Saturn</span>";
      }

      if (daysTilOpposition <= 2 || daysTilOpposition >= 778) {
        phase = '🌚';
        phaseDescription = "Saturn is in Opposition";
      }
      if (daysTilOpposition >= 2 && daysTilOpposition < 5) {
        phase = "🌑";
        phaseDescription = "Saturn cannot be seen as it approaches opposition";
      }

    */


    document.getElementById("saturn-phase").innerHTML = phase;
    document.getElementById("saturn-phase-info").innerHTML =
        "<span style=\"font-size:1.5em\">" + phaseDescription + "</span><br>Magnitude: " +
        SaturnIllum.mag.toFixed(1) +
        // "<br>Percent of Max Magnitude: " +
        // magPercent.toFixed(2) +
        "<br>Elongation: " +
        saturnElongation.toFixed(1) +
        "°<br>Days to Opposition: " +
        daysTilOpposition.toFixed(0) +
        //  "<br>Illuminated fraction: " +
        // illuminatedFraction +
        "<br>Distance: " +
        SaturnIllum.geo_dist.toFixed(1) +
        " AU" +
        "<br>Max Distance: " +
        per_dist.toFixed(0) + "%";

    adjustSaturnSize(per_dist);
}

function adjustSaturnSize(per_dist) {
    let minSize, maxSize;

    if (window.innerWidth < 700) {
        minSize = 1.3;
        maxSize = 2.0;
    } else {
        minSize = 2;
        maxSize = 5;
    }

    const size = ((minSize - maxSize) * per_dist / 100) + maxSize;
    const marsPhase = document.getElementById("saturn-phase");
    marsPhase.style.fontSize = `${size}em`;
}


document.addEventListener("DOMContentLoaded", () => {


    document.getElementById("mercury").addEventListener("click", () => {
        console.log("Mercury clicked - No update function defined yet.");
    });

    document.getElementById("venus").addEventListener("click", () => {
        UpdateVenusData(targetDate);
    });

    document.getElementById("earth").addEventListener("click", () => {
        console.log("Earth clicked - No update function defined yet.");
    });

    document.getElementById("mars").addEventListener("click", () => {
        UpdateMarsData(targetDate);
    });

    document.getElementById("jupiter").addEventListener("click", () => {
        UpdateJupiterData(targetDate);
    });

    document.getElementById("saturn").addEventListener("click", () => {
        UpdateSaturnData(targetDate);
    });

    document.getElementById("uranus").addEventListener("click", () => {
        console.log("Uranus clicked - No update function defined yet.");
    });

    document.getElementById("neptune").addEventListener("click", () => {
        console.log("Neptune clicked - No update function defined yet.");
    });

});

