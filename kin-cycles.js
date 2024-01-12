
/* KINCYCLES MENU CONTROL*/



function cyclesToggle() {
  date = targetDate;
  var moonButton = document.getElementById("moon-button");
  var planetsButton = document.getElementById("venus-planetsbutton");
  var earthButton = document.getElementById("whale-earthbutton");
  var earthMap = document.getElementById("earth-map");
  var planetButtons = document.getElementById("planet-buttons");
  var kinButtons = document.getElementById("kin-buttons");
  var moonCycle = document.getElementById("moon-cycle");
  var moonPhase = document.getElementById("moon-phase");

  moonButton.addEventListener("click", function() {
    earthMap.style.display = "none";
    planetButtons.style.display = "none";
    kinButtons.style.display = "none";
    moonCycle.style.display = "block";
    moonPhase.style.display = "block";
  });

  planetsButton.addEventListener("click", function() {
    earthMap.style.display = "none";
    moonCycle.style.display = "none";
    kinButtons.style.display = "none";
    planetButtons.style.display = "flex";

    UpdateVenusData(date);
    UpdateMarsData(date);
    UpdateSaturnData(date);
    UpdateJupiterData(date);


         // Modify here: Add 'active' class and change display for whale-cycle
         var venusCycle = document.getElementById("venus-cycle");
        //  var venusPhase = document.getElementById("venus-phase");
     var venusButton = document.getElementById("venus-button");
   
    //  venusCycle.classList.add("active");
     venusCycle.style.display = "block";
    //  venusPhase.style.display = "block";
     venusButton.classList.add("active");
  });

  earthButton.addEventListener("click", function() {
    planetButtons.style.display = "none";
    moonPhase.style.display = "none";
    earthMap.style.display = "block";
    kinButtons.style.display = "flex";

    // Call animateWhaleCycle function after the CSS changes
    showKinCycles('whale-button')
    
      // Modify here: Add 'active' class and change display for whale-cycle
      var whaleCycle = document.getElementById("whale-cycle");
      var whaleInfo = document.getElementById("whale-info");
  var whaleButton = document.getElementById("whale-button");

  whaleCycle.classList.add("active");
  whaleCycle.style.display = "block";
  whaleInfo.style.display = "block";
  whaleButton.classList.add("active");
  // startDate = targetDate;
  // animateWhaleCycle(targetDate);
  UpdateWhaleCycle(targetDate);

});


}


  // Get all the animal and planet cycle elements
  const cycleElements = document.querySelectorAll('[id$="-cycle"]');

  // Get all the totems icon buttons
  const iconButtons = document.querySelectorAll('.totems-icon');

  // Get the earth-map element
  //const earthMap = document.getElementById('earth-map');

  // Add click event listener to each icon button
  iconButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const animal = button.id.split('-')[0]; // Get the animal name from the button ID

      // Hide all the animal cycle elements
      cycleElements.forEach((element) => {
        element.style.display = 'none';
      });

      // Remove active class from all icon buttons
      iconButtons.forEach((iconButton) => {
        iconButton.classList.remove('active');
      });

      // Show the corresponding animal cycle element
      const correspondingElement = document.getElementById(`${animal}-cycle`);
      correspondingElement.style.display = 'block';

      // Add active class to the clicked icon button
      button.classList.add('active');


    });
  });


  function showKinCycles(buttonId) {
  // Hide all animal paths in the svg
  document.getElementById('whale-cycler').style.display = 'none';
  document.getElementById('cariboo-cycler').style.display = 'none';
  document.getElementById('goose-cycler').style.display = 'none';
  document.getElementById('humming-cycler').style.display = 'none';
  document.getElementById('monarch-cycler').style.display = 'none';

  // Show the div corresponding to the clicked button
  var animalId = buttonId.replace('-button', '-cycler');
  document.getElementById(animalId).style.display = 'contents';
}

// Add click event listeners to the animal buttons
document.getElementById('whale-button').addEventListener('click', function() {
  showKinCycles('whale-button');
});
document.getElementById('cariboo-button').addEventListener('click', function() {
  showKinCycles('cariboo-button');
});
document.getElementById('goose-button').addEventListener('click', function() {
  showKinCycles('goose-button');
});
document.getElementById('humming-button').addEventListener('click', function() {
  showKinCycles('humming-button');
});
document.getElementById('monarch-button').addEventListener('click', function() {
  showKinCycles('monarch-button');
});




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
    "Region": "Los Angelese, California, USA",
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







function animateWhaleCycle() {
  let whaleMarkerElement = document.getElementById("whale-marker");
  let whalePathElement = document.getElementById("whale-year-cycle");
  let yearStart = new Date(2023, 0, 1);
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