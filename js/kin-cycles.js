/* PLANET AND KINCYCLES BUTTON TOGGLING */



function cyclesToggleSimplified() {
  const buttons = document.querySelectorAll('.cycle-toggle');
  const paletteRootButtons = document.querySelectorAll('.cycle-toggle[data-role="palette-root"]');
  let activePalette = null;

  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();

      const isPaletteRoot = button.dataset.role === "palette-root";
      const targetPaletteId = button.dataset.show?.split(' ')[0];
      const targetPaletteEl = targetPaletteId ? document.getElementById(targetPaletteId) : null;
      const isAlreadyActive = targetPaletteEl && targetPaletteEl.style.display === "block";

      if (isPaletteRoot) {
        resetAllCycles(); // full reset only when palette root buttons clicked
      } else {
        resetPalettesOnly(); // hide palettes, not cycles
      }

      if (!isAlreadyActive) {
        // Show designated elements
        const toShow = button.dataset.show?.split(' ') || [];
        toShow.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = "block";
        });

        // Run any attached functions
        const functions = button.dataset.function?.split(' ') || [];
        functions.forEach(fn => {
          if (typeof window[fn] === 'function') {
            window[fn](targetDate);
          }
        });

        button.classList.add("totems-active");
        activePalette = targetPaletteId;
      } else {
        activePalette = null;
      }
    });
  });

  // Hide palettes when clicking elsewhere
  document.addEventListener('click', function (e) {
    if (activePalette) {
      const palette = document.getElementById(activePalette);
      const isClickInsidePalette = palette?.contains(e.target);
      const isClickOnButton = [...buttons].some(btn => btn.contains(e.target));

      if (!isClickInsidePalette && !isClickOnButton) {
        resetPalettesOnly();
        activePalette = null;
      }
    }
  });

  function resetPalettesOnly() {
    document.getElementById("planet-buttons").style.display = "none";
    document.getElementById("kin-buttons").style.display = "none";
    const allButtons = document.querySelectorAll('.cycle-toggle');
    allButtons.forEach(btn => btn.classList.remove("totems-active"));
  }

  function resetAllCycles() {
    resetPalettesOnly(); // first, hide the palettes

    const allCycles = document.querySelectorAll(
      '.planet-info-box, .animal-info-box, #themoonphases, #moon-phase, #americas-map, #euro-map'
    );
    allCycles.forEach(el => el.style.display = "none");

    //document.getElementById("main-clock").style.opacity = "0.2";
  }
}




/* KINCYCLES MENU CONTROL */




 document.addEventListener('DOMContentLoaded', function() {
        const caribooButton = document.getElementById('cariboo-button');
        const monarchButton = document.getElementById('monarch-button');

        function showAlert() {
          alert('Sorry the cycles of this animal is not yet added to the calendar. Stay tuned, we\'re working on it!');
        }

        caribooButton.addEventListener('click', showAlert);
        monarchButton.addEventListener('click', showAlert);
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

function animateStorkCycle() {
  // Get the HTML element for the stork marker and the path element
  let storkMarkerElement = document.getElementById("stork-marker");
  let storkPathElement = document.getElementById("stork-year-cycle");
  // Define the start of the year for reference
  let yearStart = new Date(2025, 0, 1);

  // Calculate the offset from the start date to the year start
  let startOffpoint = startDate - yearStart;

  // Calculate the difference in days to the target date
  let daysToTargetDate = targetDate - startDate;

  // Total days from the year start to the target date
  let totalDays = startOffpoint + daysToTargetDate;

  // Calculate the absolute difference in days for the target date
  let RealdaysToTargetDate = Math.abs(targetDate - startDate) / (1000 * 60 * 60 * 24);

  // Calculate the target angle for the stork marker's motion path
  let targetAngle = (startOffpoint) / (1000 * 60 * 60 * 24 * 365) * 360;
  let targetAngle2 = (totalDays) / (1000 * 60 * 60 * 24 * 365) * 360;

  // Determine the animation duration based on the real days to the target date
  let duration;
  if (RealdaysToTargetDate < 30) {
    duration = 1;
  } else if (RealdaysToTargetDate < 60) {
    duration = 2;
  } else if (RealdaysToTargetDate < 120) {
    duration = 3;
  } else if (RealdaysToTargetDate < 180) {
    duration = 4;
  // Add more conditions as needed
  } else if (RealdaysToTargetDate <= 366) {
    duration = 5; // Example: set a default for the max range
  } else {
    duration = 6; // Default duration if daysToTargetDate is out of expected range
  }

  // Use GSAP to animate the stork marker along the path
  gsap.to(storkMarkerElement, {
    motionPath: {
      path: storkPathElement,
      align: storkPathElement,
      start: targetAngle / 360,
      end: targetAngle2 / 360,
      alignOrigin: [0.5, 0.5], // Set the alignment origin to the center of the marker
      autoRotate: true, // Enable auto-rotation along the path
    },
    duration: duration, // Use the calculated duration
    ease: "linear", // Use linear easing for smooth animation
  });
}





function animateWhaleCycle() {
  let whaleMarkerElement = document.getElementById("whale-marker");
  let whalePathElement = document.getElementById("whale-year-cycle");
  let yearStart = new Date(2025, 0, 1);
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
  const orbitPaths = document.querySelectorAll('[id$="_system"]');

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
      const planet = this.id.replace('_system', '');

      // Show the corresponding planet-cycle div
      var solarSystemCenter = document.getElementById('solar-system-center');
      const cycleDiv = document.getElementById(`${planet}-cycle`);

      if (cycleDiv) {
        // solarSystemCenter.style.opacity = "0.2";
        // solarSystemCenter.style.filter = "blur(4px)";

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
            "uranus-cycle", "neptune-cycle", "pluto-cycle","moon-cycle"
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
            lunarMonths.forEach(function (lunarMonth) {
              lunarMonth.style.opacity = "0.6";
            });

        }
    }




//STORK

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