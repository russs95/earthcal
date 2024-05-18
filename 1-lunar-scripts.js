

let moonDay; // Declare moonDay as a global variable


function getFirstNewMoon() {
  const year = targetDate.getFullYear();
  // const timeZone = targetDate.getTimezoneOffset() / 60;

  // Calculate the moon phase index at midnight on January 1st of the target year
  const moonPhaseIndex = Math.floor(
    SunCalc.getMoonIllumination(new Date(Date.UTC(year, 0, 1, 0, 0, 0))).phase * 100
  );

  // Calculate the day of the year of the first new moon
  const synodicMonth = 29.530588; // average number of days between new moons
  const daysPerPhase = synodicMonth / 100;
  const daysSinceNewMoon = (100 - moonPhaseIndex) * daysPerPhase;
  const firstNewMoonDate =
    new Date(Date.UTC(year, 0, 1, 0, 0, 0)).getTime() + daysSinceNewMoon * 24 * 60 * 60 * 1000;
  const firstNewMoon = new Date(firstNewMoonDate);
  moonDay = getTheDayOfYear(firstNewMoon); // Set the value of moonDay

  rotateLunarMonths(moonDay);
}

    
    function calculateCenterPoint() {
        var lunarMonths = document.getElementById("lunar_months");
        var boundingBox = lunarMonths.getBBox();
        var centerX = boundingBox.x + boundingBox.width / 2;
        var centerY = boundingBox.y + boundingBox.height / 2;
    
        return { x: centerX, y: centerY };
    }
    
    function rotateLunarMonths(moonDay) {
    var lunarMonths = document.getElementById("lunar_months");
    var centerPoint = calculateCenterPoint();

    // Calculate the lunar day difference
    var lunarDayDifference = 28 - moonDay;
    
    // Calculate the equivalent in degrees
    var degrees = -(360/365 * lunarDayDifference);
    
    lunarMonths.style.transition = "transform 3s";

    lunarMonths.style.transformOrigin = centerPoint.x + "px " + centerPoint.y + "px";
    lunarMonths.style.transform = "rotate(" + degrees + "deg)";

    }
    


    
    function setLunarMonthForTarget() {
  
     // Reset the opacity of all lunarmonth-12 paths to 0.6 and remove all classes
     const lunarMonthPaths = document.querySelectorAll('path[id*="lunarmonth-12"]');
     lunarMonthPaths.forEach(path => {
         path.style.opacity = '0.6';
         path.classList.forEach(cls => {
             path.classList.remove(cls);
         });
     });
  
      // Get the current solar month
      const targetMonth = targetDate.getMonth();
      const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const targetMonthName = monthNames[targetMonth];
  
      // Get the lunar month number and add 1
      let lunarMonthNumber = getLunarMonthNumber() + 1;
  
      const pathID = `${lunarMonthNumber}-lunarmonth-12`;
  
      // Select the appropriate lunar month div
      const pathElement = document.getElementById(pathID);
      if (pathElement) {
          // Add the solar month name class to the lunar div
          pathElement.classList.add(targetMonthName);
          // Set the opacity of the specified lunarmonth-12 div to 1
          pathElement.style.fillOpacity = '1';
          pathElement.style.opacity = '1';
      } else {
          console.error("Path not found:", pathID);
      }
  }
  


function getLunarMonthNumber() {
  getTheDayOfYear(targetDate); // Ensure this function sets dayOfYear and moonDay

  if (typeof dayOfYear !== 'number' || typeof moonDay !== 'number') {
      console.error("dayOfYear or moonDay is not properly set.");
      return NaN;
  }

  const synodicMonth = 29.530588; // average number of days between new moons
  let lunarMonthNumber = 1;

  if (dayOfYear >= moonDay) {
      const daysSinceFirstNewMoon = dayOfYear - moonDay;
      lunarMonthNumber = Math.ceil(daysSinceFirstNewMoon / synodicMonth) + 1;
  } else {
      const daysUntilFirstNewMoon = moonDay - dayOfYear;
      lunarMonthNumber = Math.floor(daysUntilFirstNewMoon / synodicMonth) + 1;
  }

  return lunarMonthNumber;
}

// Assuming getTheDayOfYear sets the global variables correctly
function getTheDayOfYear(date) {
  // Logic to set dayOfYear and moonDay based on the provided date
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  dayOfYear = Math.floor(diff / oneDay);

  // Example logic to set moonDay, this needs to be replaced with actual logic
  moonDay = calculateMoonDay(date); 
}

function calculateMoonDay(date) {
  // Dummy logic for moonDay calculation, replace with actual logic
  // For example, assuming the first new moon of the year is on the 10th day
  return 10; 
}






  
  


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




// This function displays the current moon phase
function displayCurrentMoonPhase() {
const currentDate = targetDate;
// TODO: This function should call displayMoonPhaseInDiv() with the current date
}



function addMoonPhaseInteraction() {
  const dayPaths = document.querySelectorAll('path[id$="-day"]');
  dayPaths.forEach((path) => {
    path.addEventListener('mouseover', displayMoonPhaseOnHover);
    path.addEventListener('mouseout', redisplayTargetData);

    //DUPLICATE
    // Touchstart to show the Moon phase on touch
  //  path.addEventListener('touchstart', displayMoonPhaseOnTouch);
    // Touchend to handle any cleanup or restoration
 //   path.addEventListener('touchend', handleTouchEnd);
  });
}

// Initialize the event listeners and display the current Moon phase
addMoonPhaseInteraction();
displayCurrentMoonPhase();
//displayMoonPhaseOnTouch();
//handleTouchEnd();





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



  