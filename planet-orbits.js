// Declare a global variable 'planetAnimation2' which will be used later for animations
// 

// Define the Planet class to create planet objects and animate them
class Planet {
  // Constructor method initializes new instances of the Planet class
  constructor(element_id, orbit_id, orbit_days) {
    // Assign the provided values to the instance properties
    this.element_id = element_id;  // ID of the SVG planet element
    this.orbit_id = orbit_id;      // ID of the SVG orbit element
    this.orbit_days = orbit_days;  // Number of days the planet takes to orbit
    //this.planetAnimation2;
    // Log to the console that the instance has been created
    // console.log("Initiating");
  }

  // Define the animate method to move the planet along its orbit
  animate() {
    // Get the SVG elements for the planet and its orbit using their IDs
    let planetElement = document.getElementById(this.element_id);
    let planetOrbitElement = document.getElementById(this.orbit_id);
    // Set a reference date of January 1, 2023
    let yearStart = new Date(2023, 0, 1);
    // console.log("Initiating" + startDate);

    let planetAnimation2;
    
    // Calculate the number of days since the reference date 'yearStart'
    let daysSinceYearStart = Math.floor((startDate - yearStart) / (1000 * 60 * 60 * 24));
    // Calculate the number of days from the 'startDate' to the 'targetDate'
    let daysSinceTargetDate = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
    // Sum the two durations to get the total days
    let totalDays = daysSinceYearStart + daysSinceTargetDate;



    // Calculate the ratio of days passed to the total orbit days for the start and target dates
    let orbitRatio1 = daysSinceYearStart / this.orbit_days;
    let orbitRatio2 = totalDays / this.orbit_days;

 // If the initial coordinates are (0,0), update them with the current coordinates of the planet
if (startCoords.cx == 0 && startCoords.cy == 0) {
  startCoords = { 
      cx: parseFloat(planetElement.getAttribute("cx") || 0), 
      cy: parseFloat(planetElement.getAttribute("cy") || 0)
  };
}



// Set the planet's position to the starting coordinates
planetElement.setAttribute("cx", startCoords.cx);
planetElement.setAttribute("cy", startCoords.cy);

    // Calculate the ending coordinates for the planet for both start and target dates using trigonometry
    let finalCoordsX1 = planetOrbitElement.r.baseVal.value * Math.sin(2 * Math.PI * orbitRatio1);
    let finalCoordsY1 = planetOrbitElement.r.baseVal.value * Math.cos(2 * Math.PI * orbitRatio1);
    // Convert the Y-coordinate to a pixel value with 2 decimal places
    finalCoordsY1 = finalCoordsY1.toFixed(2) + "px";

    let finalCoordsX2 = planetOrbitElement.r.baseVal.value * Math.sin(2 * Math.PI * orbitRatio2);
    let finalCoordsY2 = planetOrbitElement.r.baseVal.value * Math.cos(2 * Math.PI * orbitRatio2);
    // Convert the Y-coordinate to a pixel value with 2 decimal places
    finalCoordsY2 = finalCoordsY2.toFixed(2) + "px";


    finalCoordsX1 = finalCoordsX1.toFixed(2) + "px";
finalCoordsX2 = finalCoordsX2.toFixed(2) + "px";


//     // Log the start coordinates
//     console.log("Start Coordinate cx (type, value):", typeof startCoords.cx, startCoords.cx);
//     console.log("Start Coordinate cy (type, value):", typeof startCoords.cy, startCoords.cy);


//  // Log the final coordinates for the startDate
//  console.log("Final Coordinate for startDate cx (type, value):", typeof finalCoordsX1, finalCoordsX1);
//  console.log("Final Coordinate for startDate cy (type, value):", typeof finalCoordsY1, finalCoordsY1);

//    // Log the final coordinates for the targetDate
//    console.log("Final Coordinate for targetDate cx (type, value):", typeof finalCoordsX2, finalCoordsX2);
//    console.log("Final Coordinate for targetDate cy (type, value):", typeof finalCoordsY2, finalCoordsY2);


    // Create the first animation from the starting coordinates to the coordinates calculated for 'startDate'
    let planetAnimation1 = planetElement.animate([
      { cx: startCoords.cx, cy: startCoords.cy, transform: `rotate(0deg)` },
      { cx: finalCoordsX1, cy: finalCoordsY1, transform: `rotate(${orbitRatio1 * 360}deg)` }
    ], {
      duration: 0,       // The animation happens immediately
      easing: "linear",  // The animation pace is consistent from start to end
      fill: "forwards"   // The animation will persist the end state after completion
    });

    // Once the first animation completes, start the second animation from 'startDate' to 'targetDate'
    
    planetAnimation1.onfinish = function () {


    let animationDuration;
    if (daysSinceTargetDate < 30) {
      animationDuration = 1000;
    } else if (daysSinceTargetDate < 60) {
      animationDuration = 2000;
    } else if (daysSinceTargetDate < 120) {
      animationDuration = 3000;
    } else if (daysSinceTargetDate < 180) {
      animationDuration = 4000;
    // ... Add more conditions as needed
    } else if (daysSinceTargetDate <= 366) {
      animationDuration = 5000; // Example: set a default for the max range
    } else {
      animationDuration = 6000; // Default duration if daysToTargetDate is out of expected range
    }


    
      
      planetAnimation2 = planetElement.animate([
        { cx: finalCoordsX1, cy: finalCoordsY1, transform: `rotate(${orbitRatio1 * 360}deg)` },
        { cx: finalCoordsX2, cy: finalCoordsY2, transform: `rotate(${orbitRatio2 * 360}deg)` }
      ], {
        duration: animationDuration,     // The animation lasts 1 second
        easing: "linear",
        fill: "forwards"
      });
    }


  }
}

// Create a new instance of the Planet classes
const mercury = new Planet(element_id = "mercury", orbit_id = "mercury-orbit", orbit_days = 88)

const venus = new Planet(element_id = "venus", orbit_id = "venus-orbit", orbit_days = 224.7)

const earth = new Planet(element_id = "earth", orbit_id = "earth-orbit", orbit_days = 365)

const mars = new Planet(element_id = "mars", orbit_id = "mars-orbit", orbit_days = 687)

const jupiter = new Planet(element_id = "jupiter", orbit_id = "jupiter-orbit", orbit_days = 4333)

const saturn = new Planet(element_id = "saturn", orbit_id = "saturn-orbit", orbit_days = 10759)

const uranus = new Planet(element_id = "uranus", orbit_id = "uranus-orbit", orbit_days = 30687)

const neptune = new Planet(element_id = "neptune", orbit_id = "neptune-orbit", orbit_days = 60190)


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


function handleOrbitClicks() {
  // Get all the SVG paths that have an ID ending with "-orbit"
  const orbitPaths = document.querySelectorAll('[id$="-orbit"]');

  // For each orbit path, add a click event listener
  orbitPaths.forEach(path => {
    path.addEventListener('click', function () {
      // Hide all the divs with IDs ending with "-cycle"
      const cycleDivs = document.querySelectorAll('[id$="-cycle"]');
      cycleDivs.forEach(div => {
        div.style.display = 'none';
      });

      // Get the planet name from the clicked path's ID
      const planet = this.id.replace('-orbit', '');

      // Show the corresponding planet-cycle div
      const cycleDiv = document.getElementById(`${planet}-cycle`);
      if (cycleDiv) {
        cycleDiv.style.display = 'block';
      }
    });
  });
}



