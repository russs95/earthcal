




let firstNewMoonDate;  // Declare firstNewMoonDate as a global variable
const synodicMonth = 29.530588;  // Average length of a lunar month in days
const referenceFullMoon = new Date(Date.UTC(2025, 0, 29, 12, 35, 0)); // Jan 29, 2025, 12:35 UTC

function getFirstNewMoon(currentYear) {
    // Use user_timezone if set, otherwise default to UTC
    let timezoneOffset = 0;  // Default to UTC
    if (typeof user_timezone !== "undefined" && user_timezone) {
        timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000; // Convert minutes to milliseconds
    }

    // Estimate the number of synodic months between 2025 and the desired year
    const yearDifference = currentYear - 2025;
    const newMoonDaysShift = yearDifference * 12 * synodicMonth; // Approximate number of months
    const estimatedNewMoonDate = new Date(referenceFullMoon.getTime() + newMoonDaysShift * 24 * 60 * 60 * 1000);

    // Adjust for the user's timezone
    firstNewMoonDate = new Date(estimatedNewMoonDate.getTime() - timezoneOffset);

    return firstNewMoonDate;
}




// Calculate the Hijri month names for a given year and update the title tag of the paths
function calculateHijriMonthNames(currentYear) {
  // Get the date of the first new moon of the current year
  const firstNewMoon = getFirstNewMoon(currentYear);

  // Define the base date (January 13th, 2024, is 1st Rajab)
  const baseDate = new Date(Date.UTC(2024, 0, 13)); // January 13th, 2024
  const baseHijriMonthIndex = 6; // Rajab is the 7th month (index 6)

  // Calculate the difference in days between the base date and the first new moon date
  const oneDay = 1000 * 60 * 60 * 24;
  const dayDifference = Math.floor((firstNewMoon - baseDate) / oneDay);

  // Calculate the Hijri month names for the paths
  let hijriMonthIndex = baseHijriMonthIndex;
  let daysRemaining = dayDifference;

  const hijriMonths = [
      { name: "Muharram", days: 30 },
      { name: "Safar", days: 29 },
      { name: "Rabi' al-Awwal", days: 30 },
      { name: "Rabi' al-Thani", days: 29 },
      { name: "Jumada al-Awwal", days: 30 },
      { name: "Jumada al-Thani", days: 29 },
      { name: "Rajab", days: 30 },
      { name: "Sha'ban", days: 29 },
      { name: "Ramadan", days: 30 },
      { name: "Shawwal", days: 29 },
      { name: "Dhu al-Qi'dah", days: 30 },
      { name: "Dhu al-Hijjah", days: 29 }
  ];

  // Decrement the initial Hijri month index by 1 to start allocation one month earlier
  hijriMonthIndex = (hijriMonthIndex - 1 + 12) % 12;

  for (let i = 1; i <= 13; i++) {
      while (daysRemaining >= hijriMonths[hijriMonthIndex].days) {
          daysRemaining -= hijriMonths[hijriMonthIndex].days;
          hijriMonthIndex = (hijriMonthIndex + 1) % 12;
      }

      const hijriMonthName = hijriMonths[hijriMonthIndex].name;
      const pathID = `${i}-lunarmonth-12`;
      const pathElement = document.getElementById(pathID);
      if (pathElement) {
          pathElement.setAttribute('title', hijriMonthName);
      } else {
          console.error("Path not found:", pathID);
      }

      // Move to the next month
      hijriMonthIndex = (hijriMonthIndex + 1) % 12;
      daysRemaining -= hijriMonths[hijriMonthIndex].days;
  }
}



    
    function setLunarMonthForTarget(targetDate, currentYear) {
  
     // Reset the opacity of all lunarmonth-12 paths to 0.6 and remove all classes
     const lunarMonthPaths = document.querySelectorAll('path[id*="lunarmonth-12"]');
     lunarMonthPaths.forEach(path => {
         path.classList.forEach(cls => {
             path.classList.remove(cls);
         });
     });
  
      // Get the current solar month
      const targetMonth = targetDate.getMonth();
      const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const targetMonthName = monthNames[targetMonth];
  

      // Get the lunar month number
      let lunarMonthNumber = getLunarMonthNumber(targetDate, currentYear);
  
      const pathID = `${lunarMonthNumber}-lunarmonth-12`;
  
      // Select the appropriate lunar month div
      const pathElement = document.getElementById(pathID);
      if (pathElement) {
          // Add the solar month name class to the lunar div
          pathElement.classList.add(targetMonthName);
          // Set the opacity of the specified lunarmonth-12 div to 1
      
      } else {
          console.error("Path not found:", pathID);
      }
  }


  function getLunarMonthNumber(targetDate, currentYear) {

    // Calculate the day of the year for the target date
    const dayOfYear = getTheDayOfYearforLunar(targetDate);

    // Get the year from the target date
    // const year = targetDate.getFullYear();

    // Get the first new moon date of the year
    const firstNewMoon = getFirstNewMoon(currentYear);
    let moonDay = getTheDayOfYearforLunar(firstNewMoon) + 1; // Set the value of moonDay and add 1

    // Log the final value of moonDay to the console with up to two decimals
    alert(`The first new moon of the year is ${moonDay.toFixed(2)} days into January.`);

    // Ensure this function sets dayOfYear and moonDay
    if (typeof dayOfYear !== 'number' || typeof moonDay !== 'number') {
        console.error("dayOfYear or moonDay is not properly set.");
        return NaN;
    }

    // Calculate the lunar month number based on the day of the year and moon day
    const synodicMonth = 29.530588; // Average number of days between new moons
    let lunarMonthNumber = 1;
    if (dayOfYear >= moonDay) {
        const daysSinceFirstNewMoon = dayOfYear - moonDay;
        lunarMonthNumber = Math.ceil(daysSinceFirstNewMoon / synodicMonth) + 2;
    } else {
        const daysUntilFirstNewMoon = moonDay - dayOfYear;
        lunarMonthNumber = Math.floor(daysUntilFirstNewMoon / synodicMonth) + 2;
    }

    return lunarMonthNumber;
}


// Assuming getTheDayOfYear sets the global variables dayOfYear and moonDay correctly
function getTheDayOfYearforLunar(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}







//OFF 
    
    // function calculateCenterPoint() {
    //     var lunarMonths = document.getElementById("lunar_months");
    //     var boundingBox = lunarMonths.getBBox();
    //     var centerX = boundingBox.x + boundingBox.width / 2;
    //     var centerY = boundingBox.y + boundingBox.height / 2;
    
    //     return { x: centerX, y: centerY };
    // }
    
    // function rotateLunarMonths(moonDay) {
    // var lunarMonths = document.getElementById("lunar_months");
    // var centerPoint = calculateCenterPoint();

    // // Calculate the lunar day difference
    // var lunarDayDifference = 28 - moonDay;
    
    // // Calculate the equivalent in degrees
    // var degrees = -(360/365 * lunarDayDifference);
    
    // lunarMonths.style.transition = "transform 3s";

    // lunarMonths.style.transformOrigin = centerPoint.x + "px " + centerPoint.y + "px";
    // lunarMonths.style.transform = "rotate(" + degrees + "deg)";

    // }
    


// // Assuming getTheDayOfYear sets the global variables correctly
// function getTheDayOfYear(date) {
//   // Logic to set dayOfYear and moonDay based on the provided date
//   const start = new Date(date.getFullYear(), 0, 0);
//   const diff = date - start;
//   const oneDay = 1000 * 60 * 60 * 24;
//   dayOfYear = Math.floor(diff / oneDay);

//   // Example logic to set moonDay, this needs to be replaced with actual logic
//   moonDay = calculateMoonDay(date); 
// }

// function calculateMoonDay(date) {
//   // Dummy logic for moonDay calculation, replace with actual logic
//   // For example, assuming the first new moon of the year is on the 10th day
//   return 12; 
// }



  /*----------MOON--------------------
  // This function displays the moon phase details in a div element.
*/

// function displayMoonPhaseInDiv(date) {
//   alert('moon-check');

//   // Set the latitude and longitude to use for the moon phase calculations
//   const lat = -8.506853;
//   const lon = 115.262477;
//   // Calculate the moon illumination details and get the phase, emoji, and phase index
//   const moonIllumination = SunCalc.getMoonIllumination(date);
//   const phase = moonIllumination.phase;
//   const moonPhaseEmoji = getMoonPhaseEmoji(phase);
//   const phaseIndex = getPhaseIndex(phase);

//   // Calculate the moon position and get the distance, angle, illuminated fraction, and phase name
//   const moonPosition = SunCalc.getMoonPosition(date, lat, lon);
//   const moonDistance = moonPosition.distance.toFixed(2);
//   const moonAngle = (moonPosition.parallacticAngle * (180 / Math.PI)).toFixed(2);
//   const illuminatedFraction = moonIllumination.fraction.toFixed(2);
//   const moonPhaseName = getMoonPhaseName(phase);
//   //const islamicMonth = getIslamicMonth(date);
//   //const islamicMonthName = getIslamicMonthName(islamicMonth);
//   const maxMoonDist = 406700; // km
//   const minMoonDist = 363300; // km
//   const per_MoonDist = ((moonDistance - minMoonDist) / (maxMoonDist - minMoonDist)) * 100;
//   // Update the moon phase div with the calculated details
//   const moonPhaseDiv = document.getElementById('moon-phase');
//   const moonPhaseInfoDiv = document.getElementById('moon-info');

//   moonPhaseDiv.innerHTML = `${moonPhaseEmoji}`;
//   moonPhaseInfoDiv.innerHTML = `${moonPhaseName} <br>Illuminated Fraction: ${illuminatedFraction} <br>Angle: ${moonAngle}°<br>Distance: ${moonDistance} km<br>Percent of Max Distance: ${per_MoonDist.toFixed(0)} %`;

//   adjustMoonSize(per_MoonDist)
// }



function adjustMoonSize(per_MoonDist) {
  let minSize, maxSize;

  if (window.innerWidth < 700) {
    minSize = 1.3;
    maxSize = 2;
  } else {
    minSize = 2.3;
    maxSize = 3.2;
   /* minSize = 3.7;
    maxSize = 4.6;*/
  }

  const size = ((minSize - maxSize) * per_MoonDist / 100) + maxSize;
  const moonPhase = document.getElementById("moon-phase");
  moonPhase.style.fontSize = `${size.toFixed(2)}em`;
  }



// Initialize the event listeners and display the current Moon phase
addMoonPhaseInteraction();
displayCurrentMoonPhase();
//displayMoonPhaseOnTouch();
//handleTouchEnd();


// This function displays the current moon phase NEEDED
function displayCurrentMoonPhase() {
const currentDate = targetDate;
// TODO: This function should call displayMoonPhaseInDiv() with the current date
}






function addMoonPhaseInteraction() {
  const dayPaths = document.querySelectorAll('path[id$="-day"]');
  dayPaths.forEach((path) => {
    path.addEventListener('mouseover', displayMoonPhaseOnHover);
    path.addEventListener('mouseout', redisplayTargetData);

  });
}



// Updates the Moon SVG display based on the phase index
function updateMoonPhaseDisplay(phaseIndex) {
  for (let i = 0; i <= 30; i++) {
    const moonPathElement = document.getElementById(`phase-${i}-moon`);
    if (moonPathElement) {
      moonPathElement.style.display = i <= phaseIndex ? 'inline' : 'none';
    }
  }
}

// Updates the Moon SVG display based on the moon phase for the given date
function updateMoonPhase(date) {
  const moonPhase = SunCalc.getMoonIllumination(date).phase;
  const phaseIndex = getPhaseIndex(moonPhase);

  updateMoonPhaseDisplay(phaseIndex);

  // Display debugging information
  //displayDebugInfo(moonPhase, phaseIndex, `phase-${phaseIndex}-moon`);
}

// Resets the Moon phase path to the one that corresponds to the current date
function resetMoonPhase() {
  // const currentDate = new Date();
  updateMoonPhase(targetDate);
}

// Handles the event when a user hovers over a Sun path
function handleDayPathMouseOver(event) {
  const dayPathId = event.target.id;
  const [dayOfYear, day, month, year] = dayPathId.split('-').slice(0, 4);
  const date = new Date(year, month - 1, day);

  updateMoonPhase(date);
}

// Handles the event when a user touches a Day path
function handleDayPathTouchStart(pathId) {
// Use the pathId parameter directly, as it is already the ID of the selected path
const [dayOfYear, day, month, year] = pathId.split('-').slice(0, 4);
const date = new Date(year, month - 1, day);

updateMoonPhase(date);
}

// Handles the event when a user hovers off a Day path
function handleDayPathMouseOut(event) {
  resetMoonPhase();
}

  // Handles the event when a user hovers off a Day path
  function handleDayPathTouchEnd(event) {
    resetMoonPhase();
  }



  