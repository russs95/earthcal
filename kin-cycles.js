
/* KINCYCLES MENU CONTROL*/
function cyclesToggle() {
  date = targetDate;
  var moonButton = document.getElementById("moon-button");
  var americasMap = document.getElementById("americas-map");
  var euroMap = document.getElementById("europe-africa-map");
  var planetButtons = document.getElementById("planet-buttons");
  var kinButtons = document.getElementById("kin-buttons");
  var moonCycle = document.getElementById("moon-cycle");
  var moonPhase = document.getElementById("moon-phase");
  var lunarMonths = document.querySelectorAll('path[id*="lunarmonth-12"]');
  var earthButton = document.getElementById('whale-earthbutton');
  var solarsystemButton = document.getElementById('solarsystem-button');
  var solarSystemCenter = document.getElementById('solar-system-center');
  var themoonphases = document.getElementById('themoonphases');
  var mainClock = document.getElementById('main-clock');

  var mercuryButton = document.getElementById('mercury-button');
  var mercuryCycle = document.getElementById('mercury-cycle');  
  var venusButton = document.getElementById('venus-button');
  var venusCycle = document.getElementById('venus-cycle'); 
  var marsButton = document.getElementById('mars-button');
  var marsCycle = document.getElementById('mars-cycle'); 
  var jupiterButton = document.getElementById('jupiter-button');
  var jupiterCycle = document.getElementById('jupiter-cycle'); 
  var saturnButton = document.getElementById('saturn-button');
  var saturnCycle = document.getElementById('saturn-cycle'); 

  var whaleButton = document.getElementById('whale-button');
  var whaleCycle = document.getElementById('whale-cycle');
  var whaleInfo = document.getElementById('whale-info'); 
  var whaleCycler = document.getElementById('whale-cycler');

  var storkButton = document.getElementById('stork-button');
  var storkCycle = document.getElementById('stork-cycle');
  var storkInfo = document.getElementById('stork-info');
  var storkCycler = document.getElementById('stork-cycler');


  // Initial state
  var isMoonClicked = true;

  moonButton.addEventListener("click", function() {
    if (isMoonClicked) {

      mercuryCycle.style.display = "none";
      mercuryButton.classList.remove("totems-active");
      marsCycle.style.display = "none";
      marsButton.classList.remove("totems-active");
      venusCycle.style.display = "none";
      venusButton.classList.remove("totems-active");
      jupiterCycle.style.display = "none";
      jupiterButton.classList.remove("totems-active");
      saturnCycle.style.display = "none";
      saturnButton.classList.remove("totems-active");

      whaleCycle.style.display = "none";
      whaleButton.classList.remove("totems-active");


      currentYearText.textContent = targetDate.getFullYear().toString();
      const currentYear = parseInt(currentYearText.textContent);
      themoonphases.style.display = 'block';

      americasMap.style.display = "none";
      euroMap.style.display = "none";
      planetButtons.style.display = "none";
      kinButtons.style.display = "none";
      moonCycle.style.display = "block";
      moonPhase.style.display = "block";
      calculateHijriMonthNames(currentYear);
      lunarMonths.forEach(function(lunarMonth) {
      lunarMonth.style.opacity = "0.6";
      });
      setLunarMonthForTarget(targetDate, 2024);
    } else {
      lunarMonths.forEach(function(lunarMonth) {
        lunarMonth.style.opacity = "0";
      });
      moonPhase.style.display = "none";
      moonCycle.style.display = "none";
    }

    // Toggle the state
    isMoonClicked = !isMoonClicked;
  });


  // Initial state
  var isSolarsysClicked = true;

  solarsystemButton.addEventListener("click", function() {
    if (isSolarsysClicked) {
      planetButtons.style.display = "flex";
      kinButtons.style.display = "none";
      mercuryCycle.style.display = "none";
      mercuryButton.classList.remove("totems-active");
      marsCycle.style.display = "none";
      marsButton.classList.remove("totems-active");
      venusCycle.style.display = "none";
      venusButton.classList.remove("totems-active");
      jupiterCycle.style.display = "none";
      jupiterButton.classList.remove("totems-active");
      saturnCycle.style.display = "none";
      saturnButton.classList.remove("totems-active");



    } else {
      solarSystemCenter.style.display = "block";
      moonCycle.style.display = "none";
      americasMap.style.display = "none";
        euroMap.style.display = "none";
        moonCycle.style.display = "none";
        kinButtons.style.display = "none";
        planetButtons.style.display = "none";
        mercuryCycle.style.display = "none";
        mercuryButton.classList.remove("totems-active");
        marsCycle.style.display = "none";
        marsButton.classList.remove("totems-active");
        venusCycle.style.display = "none";
        venusButton.classList.remove("totems-active");
        jupiterCycle.style.display = "none";
        jupiterButton.classList.remove("totems-active");
        saturnCycle.style.display = "none";
        saturnButton.classList.remove("totems-active");

        whaleCycle.style.display = "none";
        whaleButton.classList.remove("totems-active");


    } isSolarsysClicked

    isSolarsysClicked = !isSolarsysClicked;
  });


    // Initial state
    var isEarthbuttonClicked = true;
  

  earthButton.addEventListener("click", function() {
  if (isEarthbuttonClicked) {
    kinButtons.style.display = "flex";
    planetButtons.style.display = "none";
    
} else {

  kinButtons.style.display = "none";

}isEarthbuttonClicked

isEarthbuttonClicked = !isEarthbuttonClicked;
});




var isMercuryClicked = true;

mercuryButton.addEventListener("click", function() {
  if(isMercuryClicked) {

  themoonphases.style.display = 'none';
// venusCycle.classList.add("active");
  mercuryCycle.style.display = "block";
  mercuryButton.classList.add("totems-active");

  venusCycle.style.display = "none";
  venusButton.classList.remove("totems-active");
  marsCycle.style.display = "none";
  marsButton.classList.remove("totems-active");
  jupiterCycle.style.display = "none";
    jupiterButton.classList.remove("totems-active");
    saturnCycle.style.display = "none";
    saturnButton.classList.remove("totems-active");

    whaleCycle.style.display = "none";
    whaleButton.classList.remove("totems-active");

  mainClock.style.opacity = "0.2";
//  mainClock.style.filter = "blur(2px)";
  solarSystemCenter.style.opacity = "0.1";
        solarSystemCenter.style.filter = "blur(4px)";
  americasMap.style.display = "none";
euroMap.style.display = "none";
  moonCycle.style.display = "none";
  } else {
    mercuryCycle.style.display = "none";
    mercuryButton.classList.remove("totems-active");
    solarSystemCenter.style.opacity = "1";
        solarSystemCenter.style.filter = "none";


  }isMercuryClicked
  isMercuryClicked = !isMercuryClicked;
});




var isVenusClicked = true;

venusButton.addEventListener("click", function() {
  if(isVenusClicked) {

UpdateVenusData(date);
  themoonphases.style.display = 'none';
// venusCycle.classList.add("active");
  venusCycle.style.display = "block";
  venusButton.classList.add("totems-active");

  mercuryCycle.style.display = "none";
  mercuryButton.classList.remove("totems-active");
  marsCycle.style.display = "none";
  marsButton.classList.remove("totems-active");
  jupiterCycle.style.display = "none";
    jupiterButton.classList.remove("totems-active");
    saturnCycle.style.display = "none";
    saturnButton.classList.remove("totems-active");

    whaleCycle.style.display = "none";
    whaleButton.classList.remove("totems-active");


  solarSystemCenter.style.opacity = "0.1";
        solarSystemCenter.style.filter = "blur(4px)";
  americasMap.style.display = "none";
euroMap.style.display = "none";
  moonCycle.style.display = "none";
  } else {
    venusCycle.style.display = "none";
    venusButton.classList.remove("totems-active");
    solarSystemCenter.style.opacity = "1";
        solarSystemCenter.style.filter = "none";


  }isVenusClicked
    isVenusClicked = !isVenusClicked;
});



var isMarsClicked = true;

marsButton.addEventListener("click", function() {
  if(isMarsClicked) {

UpdateMarsData(date);
  themoonphases.style.display = 'none';
// venusCycle.classList.add("active");
  marsCycle.style.display = "block";
  marsButton.classList.add("totems-active");

  mercuryCycle.style.display = "none";
  mercuryButton.classList.remove("totems-active");
  venusCycle.style.display = "none";
  venusButton.classList.remove("totems-active");
  jupiterCycle.style.display = "none";
    jupiterButton.classList.remove("totems-active");
    saturnCycle.style.display = "none";
    saturnButton.classList.remove("totems-active");

    whaleCycle.style.display = "none";
    whaleButton.classList.remove("totems-active");

  solarSystemCenter.style.opacity = "0.1";
        solarSystemCenter.style.filter = "blur(4px)";
  americasMap.style.display = "none";
euroMap.style.display = "none";
  moonCycle.style.display = "none";

  } else {
    marsCycle.style.display = "none";
    marsButton.classList.remove("totems-active");
    solarSystemCenter.style.opacity = "1";
        solarSystemCenter.style.filter = "none";


  }isMarsClicked
  isMarsClicked = !isMarsClicked;
});




var isJupiterClicked = true;

jupiterButton.addEventListener("click", function() {
  if(isJupiterClicked) {

UpdateJupiterData(date);
  themoonphases.style.display = 'none';
// venusCycle.classList.add("active");
  jupiterCycle.style.display = "block";
  jupiterButton.classList.add("totems-active");

  mercuryCycle.style.display = "none";
  mercuryButton.classList.remove("totems-active");
  venusCycle.style.display = "none";
  venusButton.classList.remove("totems-active");
  marsCycle.style.display = "none";
  marsButton.classList.remove("totems-active");
  saturnCycle.style.display = "none";
  saturnButton.classList.remove("totems-active");

  whaleCycle.style.display = "none";
  whaleButton.classList.remove("totems-active");

  solarSystemCenter.style.opacity = "0.1";
  solarSystemCenter.style.filter = "blur(0.4px)"
  americasMap.style.display = "none";
euroMap.style.display = "none";
  moonCycle.style.display = "none";
  } else {
    jupiterCycle.style.display = "none";
    jupiterButton.classList.remove("totems-active");
     solarSystemCenter.style.opacity = "1";
  solarSystemCenter.style.filter = "none"


  }isJupiterClicked
  isJupiterClicked = !isJupiterClicked;
});



var isSaturnClicked = true;

saturnButton.addEventListener("click", function() {
  if(isSaturnClicked) {

UpdateSaturnData(date);
  themoonphases.style.display = 'none';
// venusCycle.classList.add("active");
  saturnCycle.style.display = "block";
  saturnButton.classList.add("totems-active");

  mercuryCycle.style.display = "none";
  mercuryButton.classList.remove("totems-active");
  venusCycle.style.display = "none";
  venusButton.classList.remove("totems-active");
  marsCycle.style.display = "none";
  marsButton.classList.remove("totems-active");
  jupiterCycle.style.display = "none";
    jupiterButton.classList.remove("totems-active");

    whaleCycle.style.display = "none";
    whaleButton.classList.remove("totems-active");

  solarSystemCenter.style.opacity = "0.1";
        solarSystemCenter.style.filter = "blur(4px)";
  americasMap.style.display = "none";
euroMap.style.display = "none";
  moonCycle.style.display = "none";
  } else {
    saturnCycle.style.display = "none";
    saturnButton.classList.remove("totems-active");
   solarSystemCenter.style.opacity = "1";
        solarSystemCenter.style.filter = "none";


  }isSaturnClicked
  isSaturnClicked = !isSaturnClicked;
});



var isWhaleClicked = true;

whaleButton.addEventListener("click", function() {
  if(isWhaleClicked) {

    solarSystemCenter.style.display = "none";
    moonCycle.style.display = "none";
    planetButtons.style.display = "none";
    moonPhase.style.display = "none";
    americasMap.style.display = "block";

    mercuryCycle.style.display = "none";
    mercuryButton.classList.remove("totems-active");
    venusCycle.style.display = "none";
    venusButton.classList.remove("totems-active");
    marsCycle.style.display = "none";
    marsButton.classList.remove("totems-active");
    jupiterCycle.style.display = "none";
    jupiterButton.classList.remove("totems-active");
    saturnCycle.style.display = "none";
    saturnButton.classList.remove("totems-active");

    whaleCycle.style.display = "block";
    whaleInfo.style.display = "block";
    whaleCycler.style.display = "block";
    whaleButton.classList.add("totems-active");

       storkCycle.style.display = "none";
    storkButton.classList.remove("totems-active");
    euroMap.style.display = "none";

    startDate = targetDate;
    animateWhaleCycle(targetDate);
    UpdateWhaleCycle(targetDate);



  } else {
    whaleCycle.style.display = "none";
    whaleButton.classList.remove("totems-active");

  }isWhaleClicked
  isWhaleClicked = !isWhaleClicked;
});






var isStorkClicked = true;

storkButton.addEventListener("click", function() {
  if(isStorkClicked) {

    whaleCycle.style.display = "none";
    whaleButton.classList.remove("totems-active");

    solarSystemCenter.style.display = "none";
    moonCycle.style.display = "none";
    planetButtons.style.display = "none";
    moonPhase.style.display = "none";
    euroMap.style.display = "block";

    mercuryCycle.style.display = "none";
    mercuryButton.classList.remove("totems-active");
    venusCycle.style.display = "none";
    venusButton.classList.remove("totems-active");
    marsCycle.style.display = "none";
    marsButton.classList.remove("totems-active");
    jupiterCycle.style.display = "none";
      jupiterButton.classList.remove("totems-active");
      saturnCycle.style.display = "none";
      saturnButton.classList.remove("totems-active");


  storkCycle.style.display = "block";
  // whaleInfo.style.display = "block";
  storkCycler.style.display = "block";
  storkButton.classList.add("totems-active");
  startDate = targetDate;
  updateStorkCycle(targetDate);

  } else {
   storkCycle.style.display = "none";
    storkButton.classList.remove("totems-active");
    euroMap.style.display = "none";
  }isStorkClicked
  isStorkClicked = !isStorkClicked;
});

}




var isCariboClicked = true;

cariboButton.addEventListener("click", function() {
  if(isStorkClicked) {

    whaleCycle.style.display = "none";
    whaleButton.classList.remove("totems-active");

    solarSystemCenter.style.display = "none";
    moonCycle.style.display = "none";
    planetButtons.style.display = "none";
    moonPhase.style.display = "none";
    euroMap.style.display = "block";

    mercuryCycle.style.display = "none";
    mercuryButton.classList.remove("totems-active");
    venusCycle.style.display = "none";
    venusButton.classList.remove("totems-active");
    marsCycle.style.display = "none";
    marsButton.classList.remove("totems-active");
    jupiterCycle.style.display = "none";
      jupiterButton.classList.remove("totems-active");
      saturnCycle.style.display = "none";
      saturnButton.classList.remove("totems-active");


  storkCycle.style.display = "block";
  // whaleInfo.style.display = "block";
  storkCycler.style.display = "block";
  storkButton.classList.add("totems-active");
  startDate = targetDate;
  updateStorkCycle(targetDate);

  } else {
   storkCycle.style.display = "none";
    storkButton.classList.remove("totems-active");
    euroMap.style.display = "none";
  }isStorkClicked
  isStorkClicked = !isStorkClicked;
});








// Function to update whale cycle information
function UpdateWhaleCycle(targetDate) {

  var whaleCycleDiv = document.getElementById('whale-cycle');
  if (whaleCycleDiv.style.display !== 'block') {
    return; // Exit the function if whale-cycle is not displayed
  }
  // Determine the numerical day number of the targetDate
  const currentDay = getDayOfYear(targetDate);

  // Find the JSON object with the Max-day higher than the current day number, yet closest to it
  let nearestJson = null;
  let nearestDiff = Infinity;

  for (let i = 0; i < whaleCycleData.length; i++) {
    const json = whaleCycleData[i];
    const maxDay = parseInt(json['Max-day']);

    // Check if the Max-day is higher than the current day
    if (maxDay >= currentDay) {
      const diff = maxDay - currentDay;

      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestJson = json;
      }
    }
  }

  // Display the JSON information in the div with id "whale-info"
  const whaleInfoDiv = document.getElementById('whale-info');
  whaleInfoDiv.innerHTML = '';

  const informationOrder = ['Activity', 'Region', 'Distance', 'Position'];

  for (let j = 0; j < informationOrder.length; j++) {
    const key = informationOrder[j];
    const value = nearestJson[key];
    whaleInfoDiv.innerHTML += `${value}<br>`;
    // whaleInfoDiv.innerHTML += `${key}: ${value}<br>`;
  }
}


// Function to show information about where the stork is in its journey.
function updateStorkCycle(targetDate) {

  var storkCycleDiv = document.getElementById('stork-cycle');
  if (storkCycleDiv.style.display !== 'block') {
    return; // Exit the function if stork-cycle is not displayed
  }
  // Determine the numerical day number of the targetDate
  const currentDay = getDayOfYear(targetDate);

  // Find the JSON object with the Max-day higher than the current day number, yet closest to it
  let nearestJson = null;
  let nearestDiff = Infinity;

  for (let i = 0; i < storkCycleData.length; i++) {
    const json = storkCycleData[i];
    const maxDay = parseInt(json['Max-day']);

    // Check if the Max-day is higher than the current day
    if (maxDay >= currentDay) {
      const diff = maxDay - currentDay;

      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestJson = json;
      }
    }
  }

  // Display the JSON information
  const storkInfoDiv = document.getElementById('stork-info');
  storkInfoDiv.innerHTML = '';

  const informationOrder = ['Activity', 'Region', 'Distance', 'Position'];

  for (let j = 0; j < informationOrder.length; j++) {
    const key = informationOrder[j];
    const value = nearestJson[key];
    storkInfoDiv.innerHTML += `${value}<br>`;
  }

  // Send the current JSON's "Journey" value to animateStorkCycle as journeyPercentage
  const journeyPercentage = nearestJson['Journey'];
  animateStorkCycle(journeyPercentage);
}



// Declare the global variable startPercentage
let startPercentage = 0;

// Function to animate the stork cycle
function animateStorkCycle(journeyPercentage) {
  let storkMarkerElement = document.getElementById("stork-marker");
  let storkPathElement = document.getElementById("stork-year-cycle");
  // Convert journeyPercentage to a fraction of 1
  let journeyFraction = journeyPercentage / 100;
  // Ensure any previous animations are killed
  gsap.killTweensOf(storkMarkerElement);

  // Use GSAP to animate the stork marker along the path
  gsap.to(storkMarkerElement, {
    motionPath: {
      path: storkPathElement,
      align: storkPathElement,
      start: startPercentage, // Use the global variable startPercentage
      end: journeyFraction, // Set the end to the journeyFraction
      alignOrigin: [0.5, 0.5], // Set the alignment origin to the center of the marker
      autoRotate: true, // Enable auto-rotation along the path
    },
    duration: 3, // Use the fixed duration
    ease: "linear",
    onComplete: function() {
      // Set startPercentage to the value of journeyPercentage for the next use
      startPercentage = journeyFraction;
    }
  });
}
//
//function animateStorkCycle() {
//  // Get the HTML element for the stork marker and the path element
//  let storkMarkerElement = document.getElementById("stork-marker");
//  let storkPathElement = document.getElementById("stork-year-cycle");
//
//  // Define the start of the year for reference
//  let yearStart = new Date(2024, 0, 1);
//
//  // Calculate the offset from the start date to the year start
//  let startOffpoint = startDate - yearStart;
//
//  // Calculate the difference in days to the target date
//  let daysToTargetDate = targetDate - startDate;
//
//  // Total days from the year start to the target date
//  let totalDays = startOffpoint + daysToTargetDate;
//
//  // Calculate the absolute difference in days for the target date
//  let RealdaysToTargetDate = Math.abs(targetDate - startDate) / (1000 * 60 * 60 * 24);
//
//  // Calculate the target angle for the stork marker's motion path
//  let targetAngle = (startOffpoint) / (1000 * 60 * 60 * 24 * 365) * 360;
//  let targetAngle2 = (totalDays) / (1000 * 60 * 60 * 24 * 365) * 360;
//
//  // Determine the animation duration based on the real days to the target date
//  let duration;
//  if (RealdaysToTargetDate < 30) {
//    duration = 1;
//  } else if (RealdaysToTargetDate < 60) {
//    duration = 2;
//  } else if (RealdaysToTargetDate < 120) {
//    duration = 3;
//  } else if (RealdaysToTargetDate < 180) {
//    duration = 4;
//  // Add more conditions as needed
//  } else if (RealdaysToTargetDate <= 366) {
//    duration = 5; // Example: set a default for the max range
//  } else {
//    duration = 6; // Default duration if daysToTargetDate is out of expected range
//  }
//
//  // Use GSAP to animate the stork marker along the path
//  gsap.to(storkMarkerElement, {
//    motionPath: {
//      path: storkPathElement,
//      align: storkPathElement,
//      start: targetAngle / 360,
//      end: targetAngle2 / 360,
//      alignOrigin: [0.5, 0.5], // Set the alignment origin to the center of the marker
//      autoRotate: true, // Enable auto-rotation along the path
//    },
//    duration: duration, // Use the calculated duration
//    ease: "linear", // Use linear easing for smooth animation
//  });
//}





function animateWhaleCycle() {
  let whaleMarkerElement = document.getElementById("whale-marker");
  let whalePathElement = document.getElementById("whale-year-cycle");
  let yearStart = new Date(2024, 0, 1);
  let startOffpoint = startDate - yearStart;
  let daysToTargetDate = targetDate - startDate;
  let totalDays = startOffpoint + daysToTargetDate;
  let RealdaysToTargetDate = Math.abs(targetDate - startDate) / (1000 * 60 * 60 * 24);

  let targetAngle = (startOffpoint) / (1000 * 60 * 60 * 24 * 365) * 360;
  let targetAngle2 = (totalDays) / (1000 * 60 * 60 * 24 * 365) * 360;
  // Determine the duration based on daysToTargetDate
  let duration;
  if (RealdaysToTargetDate < 30) {
    duration = 1;
  } else if (RealdaysToTargetDate < 60) {
    duration = 2;
  } else if (RealdaysToTargetDate < 120) {
    duration = 3;
  } else if (RealdaysToTargetDate < 180) {
    duration = 4;
  // ... Add more conditions as needed
  } else if (RealdaysToTargetDate <= 366) {
    duration = 5; // Example: set a default for the max range
  } else {
    duration = 6; // Default duration if daysToTargetDate is out of expected range
  }

  gsap.to(whaleMarkerElement, {
    motionPath: {
      path: whalePathElement,
      align: whalePathElement,
      start: targetAngle / 360,
      end: targetAngle2 / 360,
      alignOrigin: [0.5, 0.5], // Set the alignment origin to the center of the whale-marker
      autoRotate: true, // Enable auto-rotation along the path
    },
    duration: duration, // Use the calculated duration
    ease: "linear",
  });
}


//show the planet info when their orbit is clicked


function openPlanetInfoBox() {
  // Get all the SVG paths that have an ID ending with "-orbit"
  const orbitPaths = document.querySelectorAll('[id$="-orbit"]');

    UpdateVenusData(targetDate);
    UpdateMarsData(targetDate);
    UpdateJupiterData(targetDate);
    UpdateSaturnData(targetDate);

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
      var solarSystemCenter = document.getElementById('solar-system-center');
      const cycleDiv = document.getElementById(`${planet}-cycle`);

      if (cycleDiv) {
        solarSystemCenter.style.opacity = "0.2";
        solarSystemCenter.style.filter = "blur(4px)";

        cycleDiv.style.display = 'block';
      }
    });
  });
}


//close the planet info when the orbit is clicked.

    function closePlanetInfoBoxes() {
        const planetIds = [
            "mercury-cycle", "venus-cycle", "earth-cycle",
            "mars-cycle", "jupiter-cycle", "saturn-cycle",
            "uranus-cycle", "neptune-cycle", "pluto-cycle"
        ];
        var solarSystemCenter = document.getElementById('solar-system-center');


        planetIds.forEach(id => {
            const planetDiv = document.getElementById(id);
            if (planetDiv) {
                planetDiv.style.display = "none";
            }
        });

        const solarSystemCenterDiv = document.getElementById("solar-system-center");
        if (solarSystemCenterDiv) {
            solarSystemCenter.style.filter = "none";

            solarSystemCenterDiv.style.opacity = "1";
        }
    }





const storkCycleData = [
  {
    "Journey": "0",
    "Region": "Sub-Saharan Africa",
    "Activity": "Foraging, resting.",
    "Distance": "10,000 km to 10,500 km",
    "Position": "5.00N, 20.00E",
    "Days": "1-30",
    "Max-day": "30"
  },

    {
    "Journey": "3",
    "Region": "Sub-Saharan Africa",
    "Activity": "Foraging, resting.",
    "Distance": "10,000 km to 10,500 km",
    "Position": "5.00N, 20.00E",
    "Days": "30-45",
    "Max-day": "45"
  },

  {
    "Journey": "10",
    "Region": "Sub-Saharan Africa to North Africa",
    "Activity": "Initial leg of return journey.",
    "Distance": "10,500 km to 9,000 km",
    "Position": "15.00N, 10.00E",
    "Days": "45-60",
    "Max-day": "60"
  },
  {
    "Journey": "20",
    "Region": "North Africa, crossing the Sahara Desert",
    "Activity": "Continued return migration.",
    "Distance": "9,000 km to 6,000 km",
    "Position": "25.00N, 10.00E",
    "Days": "61-90",
    "Max-day": "90"
  },
  {
    "Journey": "30",
    "Region": "Mediterranean region (Spain, France, or Eastern Europe, Turkey)",
    "Activity": "Final leg of return migration.",
    "Distance": "6,000 km to 3,000 km",
    "Position": "35.00N, 10.00E",
    "Days": "91-120",
    "Max-day": "120"
  },
  {
    "Journey": "40",
    "Region": "Northern and Central Europe",
    "Activity": "Arrival at breeding sites, nest building, mating.",
    "Distance": "3,000 km to 1,000 km",
    "Position": "50.00N, 10.00E",
    "Days": "121-150",
    "Max-day": "150"
  },
  {
    "Journey": "47",
    "Region": "Northern and Central Europe",
    "Activity": "Laying eggs, incubation.",
    "Distance": "0 km",
    "Position": "50.00N, 10.00E",
    "Days": "151-180",
    "Max-day": "180"
  },
  {
    "Journey": "50",
    "Region": "Northern and Central Europe",
    "Activity": "Incubation continues, hatching of chicks.",
    "Distance": "0 km",
    "Position": "50.00N, 10.00E",
    "Days": "181-210",
    "Max-day": "210"
  },
  {
    "Journey": "52",
    "Region": "Northern and Central Europe",
    "Activity": "Chicks being fed and nurtured.",
    "Distance": "0 km",
    "Position": "50.00N, 10.00E",
    "Days": "211-240",
    "Max-day": "240"
  },
  {
    "Journey": "53",
    "Region": "Northern and Central Europe",
    "Activity": "Chicks continue to grow, start to fledge.",
    "Distance": "0 km",
    "Position": "50.00N, 10.00E",
    "Days": "241-270",
    "Max-day": "270"
  },
  {
    "Journey": "60",
    "Region": "Northern and Central Europe (preparing to leave)",
    "Activity": "Adults and fledglings preparing for migration.",
    "Distance": "0 km to 1,000 km",
    "Position": "50.00N, 10.00E",
    "Days": "271-300",
    "Max-day": "300"
  },
  {
    "Journey": "67",
    "Region": "Migration route (France, Spain, or Eastern Europe, Turkey)",
    "Activity": "Migration southward begins.",
    "Distance": "1,000 km to 3,000 km",
    "Position": "40.00N, 10.00E",
    "Days": "301-315",
    "Max-day": "315"
  },

    {
    "Journey": "80",
    "Region": "Migration through Spain, or Eastern Europe, Turkey)",
    "Activity": "Migration southward begins.",
    "Distance": "1,000 km to 3,000 km",
    "Position": "40.00N, 10.00E",
    "Days": "315-330",
    "Max-day": "330"
  },

      {
    "Journey": "90",
    "Region": "Crossing the Mediterranean, North Africa",
    "Activity": "Migration southward begins.",
    "Distance": "1,000 km to 3,000 km",
    "Position": "40.00N, 10.00E",
    "Days": "331-345",
    "Max-day": "345"
  },

  {
    "Journey": "100",
    "Region": "Crossing the Mediterranean, North Africa",
    "Activity": "Continued migration.",
    "Distance": "3,000 km to 6,000 km",
    "Position": "30.00N, 10.00E",
    "Days": "346-360",
    "Max-day": "360"
  }
];




// JSON data
const whaleCycleData = [
  {
    "Journey": "0%",
    "Region": "Magdalena Bay, Baja California, Mexico",
    "Activity": "Mating, birthing, and nursing.",
    "Distance": "0 km",
    "Arrival": "Mid January - February ",
    "Position": "27.45N, -114.00W",
    "Days": "30-45",
    "Max-day": "45"
  },

  {
    "Journey": "1-5%",
    "Region": "Laguna Guerrero Negro, Baja California, Mexico",
    "Activity": "Migrating north",
    "Distance": "540km",
    "Arrival": "January - February",
    "Position": "43.83N, -124.00W",
    "Days": "45-60",
    "Max-day": "60"

  },

  {
    "Journey": "6-14%",
    "Region": "San Diego, California, USA",
    "Activity": "Migrating north",
    "Distance": "1360 km",
    "Arrival": "Last passed by March",
    "Position": "32.72N, -117.17W",
    "Days": "60-80",
    "Max-day": "80"
  },

  {
    "Journey": "14%-16%",
    "Region": "Los Angeles, California, USA",
    "Activity": "Migrating north",
    "Distance": "1565 km",
    "Arrival": "80-122",
    "Position": "35.72N, -119.17W",
    "Days": "80-85",
    "Max-day": "85"
  },


  {
    "Journey": "16%-18%",
    "Region": "Coal Oil Point, California, USA",
    "Activity": "Migrating north",
    "Distance": "1770 km",
    "Arrival": "80-82",
    "Position": "34.40N, -119.69W",
    "Days": "85-90",
    "Max-day": "90"
  },

  {
    "Journey": "18-20%",
    "Region": "Point Piedras Blancas, California, USA",
    "Activity": "Migrating north",
    "Distance": "2010 km",
    "Arrival": "82-85",
    "Position": "35.39N, -121.15W",
    "Days": "90-95",
    "Max-day": "95"
  },

  {
    "Journey": "20-22%",
    "Region": "Monterey Bay, California, USA",
    "Activity": "Migrating north",
    "Distance": "2154 km",
    "Arrival": "Mid-April to May",
    "Position": "36.64N, -121.90W",
    "Days": "95-100",
    "Max-day": "100"
  },

  {
    "Journey": "22-24%",
    "Region": "Half Moon Bay, California, USA",
    "Activity": "Migrating north",
    "Distance": "2301 km",
    "Arrival": "Mid-April to May",
    "Position": "37.50N, -122.40W",
    "Days": "100-105",
    "Max-day": "105"
  },

  {
    "Journey": "24%-34%", 
    "Region": "Depoe Bay, Oregon, USA",
    "Activity": "Migrating north",
    "Distance": "3356 km",
    "Arrival": "late April through June",
    "Position": "44.84N, -123.95W",
    "Days": "105-110",
    "Max-day": "110"
  },

  {
    "Journey": "34% - 40%",
    "Region": "Seattle, Washington, USA",
    "Activity": "Migrating north",
    "Distance": "3865 km",
    "Arrival": "April through June",
    "Position": "47.83N, -124.40W",
    "Days": "110-120",
    "Max-day": "120"
  },

  {
    "Journey": "40% - 43%",
    "Region": "Richmond, British Columbia",
    "Activity": "Migrating along Canadian coast.",
    "Distance": "4088 km",
    "Arrival": "April through June",
    "Position": "49.22N, -123.10W",
    "Days": "110-130",
    "Max-day": "130"
  },

  {
    "Journey": "43% - 53%",
    "Region": "Haida Gwaii, British Columbia",
    "Activity": "Migrating north",
    "Distance": "5122 km",
    "Arrival": "April through June",
    "Position": "49.22N, -123.10W",
    "Days": "130-140",
    "Max-day": "140"
  },

  {
    "Journey": "54%-68%",
    "Region": "Kodiak Island, Alaska",
    "Activity": "Migrating along the Alaskan coast.",
    "Distance": "6623 km",
    "Arrival": "Mother-calf pairs normally return in mid-May and keep coming into July",
    "Position": "57.43N, -153.34W",
    "Days": "140-165",
    "Max-day": "165"
  },

  {
    "Journey": "68%-75%", 
    "Region": "Nelson Lagoon, Alaska",
    "Activity": "Feeding, migrating north",
    "Distance": "7305 km",
    "Arrival": "spend the summer in bays along the Alaska Peninsula. Some stay in Nelson Lagoon, feeding in a narrow channel. ",
    "Position": "55.92N, -161.35W",
    "Days": "165-175",
    "Max-day": "175"
  },

  
  {
    "Journey": "75%-79%",
    "Region": "Unimak Pass, Alaska",
    "Activity": "Feeding, migrating north",
    "Distance": "7610 km",
    "Arrival": "June. This narrow sea passage is in the NE Aleutian Islands. From here they are just a few weeks away from their arctic feeding grounds!",
    "Position": "54.33N, -164.92W",
    "Days": "175-185;",
    "Max-day": "185"
  },

  

  {
    "Journey": "79%-84%",
    "Region": "Kotzebue Sound, Alaska",
    "Activity": "Feeding, migrating north",
    "Distance": "8,165 km",
    "Arrival": "July - August",
    "Position": "66.00N, -162.50W",
    "Days": "185-195;",
    "Max-day": "185"
  },

  {
    "Journey": "84% - 87%",
    "Region": "Point Hope, Alaska",
    "Activity": "Feeding, migrating north",
    "Distance": "8450 km",
    "Arrival": "Early July",
    "Position": "68.35N, -166.80W",
    "Days": "195-205;",
    "Max-day": "205"
  },

  {
    "Journey": "95-100%",
    "Region": "Utqiaġvik, Alaska",
    "Activity": "Feeding on benthic organisms in the Chukchi Sea",
    "Distance": "9654 km",
    "Arrival": "July",
    "Position": "71.29N, -156.79W",
    "Days": "205-210;",
    "Max-day": "210"
  },

  {
    "Journey": "100-95%",
    "Region": "Utqiaġvik, Alaska",
    "Activity": "Feeding. Preparing for migration",
    "Distance": "9654 km",
    "Arrival": "July",
    "Position": "71.29N, -156.79W",
    "Days": "210-215;",
    "Max-day": "215"
  },

  {
    "Journey": "95% - 93%",
    "Region": "Bering Strait",
    "Activity": "Migrating south",
    "Distance": "9,265 km",
    "Arrival": "August",
    "Position": "65.43N, -168.99W",
    "Max-day": "225"
  },

  {
    "Journey": "93-87%",
    "Region": "Chukotka Peninsula, Russia",
    "Activity": "Migrating south along the Russian coast",
    "Distance": "9,065 km",
    "Arrival": "August - September",
    "Position": "66.75N, 174.00E",
    "Days": "235-255;",
    "Max-day": "235"
  },

  {
    "Journey": "87% - 84%",
    "Region": "Point Hope, Alaska",
    "Activity": "Migrating south along Alaska's coast",
    "Distance": "8450 km",
    "Arrival": "Early July",
    "Position": "68.35N, -166.80W",
    "Max-day": "245"
  },

  {
    "Journey": "75%-79%",
    "Region": "Unimak Pass, Alaska",
    "Activity": "Migrating south",
    "Distance": "7610 km",
    "Arrival": "",
    "Position": "54.33N, -164.92W",
    "Max-day": "260"
  },

  {
    "Journey": "54%-68%",
    "Region": "Kodiak Island, Alaska",
    "Activity": "Migrating south",
    "Distance": "6623 km",
    "Arrival": "",
    "Position": "57.43N, -153.34W",
    "Max-day": "270"
  },

  {
    "Journey": "43% - 53%",
    "Region": "Haida Gwaii, British Columbia",
    "Activity": "Migrating south",
    "Distance": "5122 km",
    "Arrival": "Autumn return",
    "Position": "49.22N, -123.10W",
    "Max-day": "285"
  },

  {
    "Journey": "40% - 43%",
    "Region": "Richmond, British Columbia",
    "Activity": "Migrating south",
    "Distance": "4088 km",
    "Arrival": "Fall return",
    "Position": "49.22N, -123.10W",
    "Max-day": "295"
  },

  {
    "Journey": "34% - 40%",
    "Region": "Seattle, Washington, USA",
    "Activity": "Migrating south along the U.S. coast.",
    "Distance": "3865 km",
    "Arrival": "Fall retun",
    "Position": "47.83N, -124.40W",
    "Days": "285-195;",
    "Max-day": "305"
  },

  {
    "Journey": "24%-34%", 
    "Region": "Depoe Bay, Oregon, USA",
    "Activity": "Migrating south",
    "Distance": "3356 km",
    "Arrival": "late April through June",
    "Position": "44.84N, -123.95W",
    "Max-day": "315"
  },

  {
    "Journey": "22-24%",
    "Region": "Half Moon Bay, California, USA",
    "Activity": "Migrating south",
    "Distance": "2301 km",
    "Arrival": "Mid-April to May",
    "Position": "37.50N, -122.40W",
    "Max-day": "320"
  },

  {
    "Journey": "20-22%",
    "Region": "Monterey Bay, California, USA",
    "Activity": "Migrating south",
    "Distance": "2154 km",
    "Arrival": "Mid-April to May",
    "Position": "36.64N, -121.90W",
    "Days": "305-310;",
    "Max-day": "325"
  },

  {
    "Journey": "18-20%",
    "Region": "Point Piedras Blancas, California, USA",
    "Activity": "Migrating south",
    "Distance": "2010 km",
    "Arrival": "Late Fall",
    "Position": "35.39N, -121.15W",
    "Max-day": "330"
  },

  {
    "Journey": "16%-18%",
    "Region": "Coal Oil Point, California, USA",
    "Activity": "Migrating south",
    "Distance": "1770 km",
    "Arrival": "Late Fall",
    "Position": "34.40N, -119.69W",
    "Days": "315-320;",
    "Max-day": "335"
  },

  {
    "Journey": "14% - 16%",
    "Region": "Los Angelese, California, USA",
    "Activity": "Migrating south",
    "Distance": "1565 km",
    "Arrival": "Winter",
    "Position": "35.72N, -119.17W",
    "Max-day": "345"
  },

  {
    "Journey": "6-14%",
    "Region": "San Diego, California, USA",
    "Activity": "Migrating south",
    "Distance": "1360 km",
    "Arrival": "Last passed by March",
    "Position": "32.72N, -117.17W",
    "Days": "340-365;",
    "Max-day": "365"
  },

  {
    "Journey": "6-5%",
    "Region": "Laguna Guerrero Negro, Baja California, Mexico",
    "Activity": "Arriving in birthing lagoons",
    "Distance": "540km",
    "Arrival": "January - February",
    "Position": "43.83N, -124.00W",
    "Max-day": "10"

  },


  {
    "Journey": "5%",
    "Region": "Laguna Ojo de Liebre, Baja California Sur, Mexico",
    "Activity": "Mating, birthing, and nursing activities in the lagoons",
    "Distance": "0 km",
    "Arrival": "Mid January",
    "Position": "27.45N, -114.00W",
    "Days": "10-20",
    "Max-day": "20"
  },

  {
    "Journey": "2%",
    "Region": "Laguna San Ignacio, Baja California, Mexico",
    "Activity": "Mating, birthing, and nursing activities in the lagoons",
    "Distance": "0 km",
    "Arrival": "Late January",
    "Position": "26.80N, -113.25W",
    "Days": "20-30"
  }
]







/*--------------------------


// Function to update whale cycle information
const UpdateWhaleCycle = (() => {
  let cachedData = null;

  return function(targetDate) {
    // Check if the data is already cached
    if (cachedData) {
      // Use the cached data for processing
      processData(cachedData, targetDate);
    } else {
      // Fetch the JSON file only once
      fetch('/cycles/whale-cycle.json')
        .then(response => response.json())
        .then(data => {
          // Cache the data
          cachedData = data;

          // Process the data for the target date
          processData(cachedData, targetDate);
        })
        .catch(error => {
          console.error('Error fetching whale-cycle.json:', error);
        });
    }
  }
})();

function processData(data, targetDate) {
  // Determine the numerical day number of the targetDate
  const currentDay = getDayOfYear(targetDate);

  // Find the JSON object with the Max-day higher than the current day number, yet closest to it
  let nearestJson = null;
  let nearestDiff = Infinity;

  for (let i = 0; i < data.length; i++) {
    const json = data[i];
    const maxDay = parseInt(json['Max-day']);
  
    // Check if the Max-day is higher than the current day
    if (maxDay >= currentDay) {
      const diff = maxDay - currentDay;

      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestJson = json;
      }
    }
  }

  // Display the JSON information in the div with id "whale-info"
  const whaleInfoDiv = document.getElementById('whale-info');
  whaleInfoDiv.innerHTML = '';

  const informationOrder = ['Activity', 'Region', 'Distance', 'Position'];

  for (let j = 0; j < informationOrder.length; j++) {
    const key = informationOrder[j];
    const value = nearestJson[key];
    whaleInfoDiv.innerHTML += `${value}<br>`;
  }
}

*/