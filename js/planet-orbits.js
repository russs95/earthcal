class Planet {
  constructor(element_id, orbit_id, orbit_days) {
    this.element_id = element_id; // ID of the SVG planet element
    this.orbit_id = orbit_id; // ID of the SVG orbit element
    this.orbit_days = orbit_days; // Number of days the planet takes to orbit
  }

  animate(startDate, targetDate) {
    const start =
      startDate instanceof Date && !isNaN(startDate.getTime())
        ? startDate
        : new Date();
    const target =
      targetDate instanceof Date && !isNaN(targetDate.getTime())
        ? targetDate
        : new Date();

    const planetElement = document.getElementById(this.element_id);
    const planetOrbitElement = document.getElementById(this.orbit_id);

    if (!planetElement || !planetOrbitElement) {
      console.warn(`Missing element for ${this.element_id} or ${this.orbit_id}`);
      return;
    }
    // Reference date
    const yearStart = new Date(2023, 0, 1);
    //console.log("Initiating:" + yearStart + start);

    // Calculate days and ratios
    const daysSinceYearStart = Math.floor((start - yearStart) / (1000 * 60 * 60 * 24));
    const daysSinceTargetDate = Math.floor((target - start) / (1000 * 60 * 60 * 24));
    const totalDays = daysSinceYearStart + daysSinceTargetDate;

    const orbitRatio1 = daysSinceYearStart / this.orbit_days;
    const orbitRatio2 = totalDays / this.orbit_days;

    // Pre-calculate trigonometric values
    const orbitRadius = planetOrbitElement.r.baseVal.value;
    const finalCoords1 = {
      x: orbitRadius * Math.sin(2 * Math.PI * orbitRatio1),
      y: orbitRadius * Math.cos(2 * Math.PI * orbitRatio1),
    };
    const finalCoords2 = {
      x: orbitRadius * Math.sin(2 * Math.PI * orbitRatio2),
      y: orbitRadius * Math.cos(2 * Math.PI * orbitRatio2),
    };

    // GPU optimization with `will-change`
    planetElement.style.willChange = "transform";

    // Set the planet's position to the starting coordinates
    if (startCoords.cx == 0 && startCoords.cy == 0) {
      startCoords = {
        cx: parseFloat(planetElement.getAttribute("cx") || 0),
        cy: parseFloat(planetElement.getAttribute("cy") || 0),
      };
    }

    planetElement.setAttribute("cx", startCoords.cx);
    planetElement.setAttribute("cy", startCoords.cy);

    // Create the first animation
    const planetAnimation1 = planetElement.animate(
      [
        {
          cx: startCoords.cx,
          cy: startCoords.cy,
          transform: `rotate(0deg)`,
        },
        {
          cx: finalCoords1.x.toFixed(2) + "px",
          cy: finalCoords1.y.toFixed(2) + "px",
          transform: `rotate(${orbitRatio1 * 360}deg)`,
        },
      ],
      {
        duration: 0, // Immediate
        easing: "linear",
        fill: "forwards",
      }
    );

    // Chain the second animation
    planetAnimation1.onfinish = () => {
      let animationDuration;
      if (daysSinceTargetDate < 30) {
        animationDuration = 500;
      } else if (daysSinceTargetDate < 60) {
        animationDuration = 1000;
      } else if (daysSinceTargetDate < 120) {
        animationDuration = 1500;
      } else if (daysSinceTargetDate < 180) {
        animationDuration = 2000;
      } else if (daysSinceTargetDate <= 366) {
        animationDuration = 3000;
      } else {
        animationDuration = 4000;
      }

      planetElement.animate(
        [
          {
            cx: finalCoords1.x.toFixed(2) + "px",
            cy: finalCoords1.y.toFixed(2) + "px",
            transform: `rotate(${orbitRatio1 * 360}deg)`,
          },
          {
            cx: finalCoords2.x.toFixed(2) + "px",
            cy: finalCoords2.y.toFixed(2) + "px",
            transform: `rotate(${orbitRatio2 * 360}deg)`,
          },
        ],
        {
          duration: animationDuration,
          easing: "linear",
          fill: "forwards",
        }
      );
    };
  }
}

// Create instances of the Planet class
const mercury = new Planet("mercury", "mercury-orbit", 88);
const venus = new Planet("venus", "venus-orbit", 224.7);
const earth = new Planet("earth", "earth-orbit", 365);
const mars = new Planet("mars", "mars-orbit", 687);
const jupiter = new Planet("jupiter", "jupiter-orbit", 4333);
const saturn = new Planet("saturn", "saturn-orbit", 10759);
const uranus = new Planet("uranus", "uranus-orbit", 30687);
const neptune = new Planet("neptune", "neptune-orbit", 60190);


if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
  startDate = new Date();
}
if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
  targetDate = new Date();
}

mercury.animate(startDate, targetDate);
venus.animate(startDate, targetDate);
earth.animate(startDate, targetDate);
mars.animate(startDate, targetDate);
jupiter.animate(startDate, targetDate);
saturn.animate(startDate, targetDate);
uranus.animate(startDate, targetDate);
neptune.animate(startDate, targetDate);


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


function arePlanetsReady() {
  const ids = [
    "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune",
    "mercury-orbit", "venus-orbit", "earth-orbit", "mars-orbit", "jupiter-orbit",
    "saturn-orbit", "uranus-orbit", "neptune-orbit"
  ];
  return ids.every(id => document.getElementById(id) !== null);
}

function animatePlanetsIfReady(retries = 10) {
  if (arePlanetsReady()) {
    mercury.animate();
    venus.animate();
    earth.animate();
    mars.animate();
    jupiter.animate();
    saturn.animate();
    uranus.animate();
    neptune.animate();
  } else if (retries > 0) {
    console.warn("Planet elements not ready. Retrying...");
    setTimeout(() => animatePlanetsIfReady(retries - 1), 300);
  } else {
    console.error("Planet elements still missing after multiple retries.");
  }
}
