
// Get references to the SVG elements
const prevYear = document.getElementById('prev-year');
const nextYear = document.getElementById('next-year');
const currentYearText = document.getElementById('current-year').querySelector('tspan');
const weekPaths = document.querySelectorAll('path[id^="week-"]');

// Helper function to calculate the date range for each week
function getWeekDateRange(year, week) {
  const startDate = new Date(Date.UTC(year, 0, 1));
  const dayOffset = (startDate.getUTCDay() + 6) % 7; // Calculate the day offset for the first bridging week
  startDate.setUTCDate(1 - dayOffset); // Set the start date to the first day of the first bridging week
  startDate.setUTCDate(startDate.getUTCDate() + (week - 1) * 7); // Set the start date to the first day of the requested week
  const endDate = new Date(startDate.getTime());
  endDate.setUTCDate(endDate.getUTCDate() + 6); // Set the end date to the last day of the requested week
  const startDateString = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDateString = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startDateString} to ${endDateString}`;
}

// Function to update the week titles for the current year
function updateWeekTitles(year) {
  weekPaths.forEach((path) => {
    const weekNumber = path.id.slice(5); // Get the week number from the path ID
    const dateRange = getWeekDateRange(year, weekNumber);
    path.setAttribute('title', dateRange);
  });
}


function prevYearClick() {
  const currentYear = parseInt(currentYearText.textContent);
  currentYearText.textContent = (currentYear - 1).toString();
  updateWeekTitles(currentYear - 1);
  updateDayIds(currentYear - 1);
  updateDayTitles(currentYear - 1);

  targetDate = new Date((currentYear - 1), 0, 1);

  const allPaths = document.querySelectorAll("svg path");
  allPaths.forEach((path) => {
    path.classList.remove("active");
    path.classList.remove("final");
  });

  calendarRefresh();
  setYearsMonthsOn();
  startDate = targetDate;

}

function nextYearClick() {
  const currentYear = parseInt(currentYearText.textContent);
  currentYearText.textContent = (currentYear + 1).toString();
  updateWeekTitles(currentYear + 1);
  updateDayIds(currentYear + 1);
  updateDayTitles(currentYear + 1);

  targetDate = new Date((currentYear + 1), 0, 1);
  setYearsMonthsOn()
  const allPaths = document.querySelectorAll("svg path");
  allPaths.forEach((path) => {
    path.classList.remove("active");
    path.classList.remove("final");
  });

  calendarRefresh();
  updateTargetDay();
  startDate = targetDate;

}




// Add event listeners to the buttons
prevYear.addEventListener('click', prevYearClick);
nextYear.addEventListener('click', nextYearClick);


function updateDayIds(year) {
  // Check if the year is a leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  // Select all paths including "-day" and "-day-marker", excluding paths with "lunar"
  const dayPaths = document.querySelectorAll('path[id$="-day"]:not([id*="lunar"]), path[id$="-day-marker"]:not([id*="lunar"])');

  dayPaths.forEach((path) => {
    // Determine if the path ID ends with "-day" or "-day-marker"
    const isDayMaker = path.id.endsWith('-day-marker');

    // If it's not a leap year and the path is for the 366th day, change its ID accordingly
    if (!isLeapYear && path.id.includes('366')) {
      path.setAttribute('id', `366${isDayMaker ? '-day-marker' : '-day'}`);
      return; // Skip further processing for this path
    }

    const idParts = path.id.split('-');
    const day = parseInt(idParts[0]);
    const date = new Date(year, 0, day);
    const month = date.getMonth() + 1;
    const dayOfMonth = date.getDate();
    const yearString = year.toString();
    const newId = `${day}-${dayOfMonth}-${month}-${yearString}${isDayMaker ? '-day-marker' : '-day'}`;
    path.setAttribute('id', newId);
  });

  // alert('Is ' + year + ' a leap year? ' + isLeapYear);
}



function updateDayTitles(year) {
  const dayPaths = document.querySelectorAll('path[id$="-day"]');/*Changed from $*/
  dayPaths.forEach((path) => {
    const dateParts = path.id.split('-');
    const dayOfMonth = parseInt(dateParts[1]);
    const month = parseInt(dateParts[2]) - 1; // month is 0-indexed in JavaScript
    const date = new Date(year, month, dayOfMonth);
    const dateString = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    path.setAttribute('title', dateString);
  });
}


function updateDayTitles(year) {
  const dayPaths = document.querySelectorAll('path[id$="-day"]');
  dayPaths.forEach((path) => {
    const dateParts = path.id.split('-');
    const dayOfMonth = parseInt(dateParts[1]);
    const month = parseInt(dateParts[2]) - 1; // month is 0-indexed in JavaScript
    const date = new Date(year, month, dayOfMonth);
    const dateString = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });



    path.setAttribute('title', `${dateString}`);
  });
}



//Sets the Mouseover for the Moon Phases
function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function getPhaseIndex(phase) {
    const phaseIndex = Math.round(phase * 30);
    return phaseIndex;
  }

  function getMoonPhaseEmoji(phase) {
    const phaseIndex = getPhaseIndex(phase);
    if (phaseIndex <= 1) return '🌑'; // New Moon
    if (phaseIndex > 1 && phaseIndex <= 6) return '🌒'; // Waxing Crescent
    if (phaseIndex > 6 && phaseIndex <= 9) return '🌓'; // First Quarter
    if (phaseIndex > 9 && phaseIndex <= 14) return '🌔'; // Waxing Gibbous
    if (phaseIndex > 14 && phaseIndex <= 16) return '🌕'; // Full Moon
    if (phaseIndex > 16 && phaseIndex <= 22) return '🌖'; // Waning Gibbous
    if (phaseIndex > 22 && phaseIndex <= 24) return '🌗'; // Last Quarter
    if (phaseIndex > 24 && phaseIndex <= 29) return '🌘'; // Waning Crescent
    if (phaseIndex > 29 && phaseIndex <= 31) return '🌑'; // New Moon
  }

  function getMoonPhaseName(phase) {
    const phaseIndex = getPhaseIndex(phase);
    if (phaseIndex > 0 && phaseIndex <= 1) return 'New Moon';
    if (phaseIndex > 1 && phaseIndex <= 7) return 'Waxing Crescent';
    if (phaseIndex === 8) return 'First Quarter';
    if (phaseIndex > 8 && phaseIndex <= 14) return 'Waxing Gibbous';
    if (phaseIndex > 14 && phaseIndex <= 16) return 'Full Moon';
    if (phaseIndex > 16 && phaseIndex <= 23) return 'Waning Gibbous';
    if (phaseIndex === 24) return 'Last Quarter';
    if (phaseIndex > 24 && phaseIndex <= 29) return 'Waning Crescent';
    if (phaseIndex > 29 && phaseIndex <= 31) return 'New Moon';
  }

  function displayPlanetInfoOnHover(event) {
    // Get the target path element
    const path = event.target;

    // If the path's ID is '366-day', do not process further
    if (path.id === '366-day') {
      return;
    }

    // Extract the date information from the element's ID
    const dateParts = path.id.split('-');
    const dayOfYear = parseInt(dateParts[0]);
    const dayOfMonth = parseInt(dateParts[1]);
    const month = parseInt(dateParts[2]) - 1; // month is 0-indexed in JavaScript
    const year = parseInt(dateParts[3]);
    const date = new Date(year, month, dayOfMonth);


    // displayDayInfo(date);
    displayDayInfo(date, userLanguage, userTimeZone);


    displayMoonPhaseInDiv(date);

  // Check if the moon-cycle div is set to display block
  // if (document.getElementById('moon-cycle').style.display === 'block') {
  //   displayMoonPhaseInDiv(date);
  // }

  // Check if the venus-cycle div is set to display block
  if (document.getElementById('venus-cycle').style.display === 'block') {
    UpdateVenusData(date);
  }

  // Check if the mars-cycle div is set to display block
  if (document.getElementById('mars-cycle').style.display === 'block') {
    UpdateMarsData(date);
  }

  // Check if the jupiter-cycle div is set to display block
  if (document.getElementById('jupiter-cycle').style.display === 'block') {
    UpdateJupiterData(date);
  }

  // Check if the saturn-cycle div is set to display block
  if (document.getElementById('saturn-cycle').style.display === 'block') {
    UpdateSaturnData(date);
  }
}



function displayMoonPhaseOnTouch(pathID) {
  // Rest of your code to handle the touch event
  const dateParts = pathID.split('-');
  const dayOfYear = parseInt(dateParts[0]);
  const dayOfMonth = parseInt(dateParts[1]);
  const month = parseInt(dateParts[2]) - 1; // month is 0-indexed in JavaScript
  const year = parseInt(dateParts[3]);
  const date = new Date(year, month, dayOfMonth);
  // Call the displayMoonPhaseInDiv function to show the moon phase details for the selected date
  // Call the relevant functions to show details for the selected date
  // displayDayInfo(date);
  displayDayInfo(targetDate, userLanguage, userTimeZone);

  displayMoonPhaseInDiv(date);


  // // Check if the moon-cycle div is set to display block
  // if (document.getElementById('moon-cycle').style.display === 'block') {
  //   displayMoonPhaseInDiv(date);
  // }

  // Check if the venus-cycle div is set to display block
  if (document.getElementById('venus-cycle').style.display === 'block') {
    UpdateVenusData(date);
  }

  // Check if the mars-cycle div is set to display block
  if (document.getElementById('mars-cycle').style.display === 'block') {
    UpdateMarsData(date);
  }

  // Check if the jupiter-cycle div is set to display block
  if (document.getElementById('jupiter-cycle').style.display === 'block') {
    UpdateJupiterData(date);
  }

  // Check if the saturn-cycle div is set to display block
  if (document.getElementById('saturn-cycle').style.display === 'block') {
    UpdateSaturnData(date);
  }
}

// This function displays the current moon phase after mouseout or touchout

function redisplayTargetData() {
  // Call the displayMoonPhaseInDiv function to show the moon phase details for the selected date
  displayMoonPhaseInDiv(targetDate);
  displayDayInfo(targetDate, userLanguage, userTimeZone);
  UpdateVenusData(targetDate);

}

function handleTouchEnd() {
  // Call the displayMoonPhaseInDiv function to show the moon phase details for the selected date
  displayMoonPhaseInDiv(targetDate);
  // displayDayInfo(targetDate);
  // UpdateVenusData(targetDate);
  //   console.log(targetDate);

  //console.log(VenusElong);
  // TODO: This function should call displayMoonPhaseInDiv() with the current date
}


function closeTheModal() {
    const modal = document.getElementById('form-modal-message');

    // Hide the modal
    modal.classList.remove('modal-visible');
    modal.classList.add('modal-hidden');
    document.getElementById("page-content").classList.remove("blur");

    modalOpen = false;

    // Remove focus restriction
    document.removeEventListener('focus', focusRestrict, true);
}


function focusRestrict(event) {
    const modal = document.getElementById('form-modal-message');
    if (modalOpen && !modal.contains(event.target)) {
        event.stopPropagation(); // Prevent further propagation of the focus event
        modal.focus();           // Redirect focus back to the modal
    }
}


  /*----------MOON--------------------
  // This function displays the moon phase details in the bottom right div element.
*/

  function displayMoonPhaseInDiv(date) {

      // Check if the moon-cycle div is not set to display none
      //NOTE:  this could be replaced and the prevention instead set on the displayPlanetInfoOnHover function
  // var moonCycleDiv = document.getElementById('moon-cycle');
  // if (moonCycleDiv.style.display === 'none') {
  //   return; // Exit the function if moon-cycle is not displayed
  // }

    // Set the latitude and longitude to use for the moon phase calculations
    const lat = -8.506853;
    const lon = 115.262477;

    // Calculate the moon illumination details and get the phase, emoji, and phase index
    const moonIllumination = SunCalc.getMoonIllumination(date);
    const phase = moonIllumination.phase;
    const moonPhaseEmoji = getMoonPhaseEmoji(phase);
    const phaseIndex = getPhaseIndex(phase);

    // Calculate the moon position and get the distance, angle, illuminated fraction, and phase name
    const moonPosition = SunCalc.getMoonPosition(date, lat, lon);
    const moonDistance = moonPosition.distance.toFixed(2);
    const moonAngle = (moonPosition.parallacticAngle * (180 / Math.PI)).toFixed(2);
    const illuminatedFraction = moonIllumination.fraction.toFixed(2);
    const moonPhaseName = getMoonPhaseName(phase);
    //const islamicMonth = getIslamicMonth(date);
    //const islamicMonthName = getIslamicMonthName(islamicMonth);
    const maxMoonDist = 406700; // km
    const minMoonDist = 363300; // km
    const per_MoonDist = ((moonDistance - minMoonDist) / (maxMoonDist - minMoonDist)) * 100;
    // Update the moon phase div with the calculated details
    const moonPhaseDiv = document.getElementById('moon-phase');
    const moonPhaseInfoDiv = document.getElementById('moon-info');

    moonPhaseDiv.innerHTML = `${moonPhaseEmoji}`;
    moonPhaseInfoDiv.innerHTML = `${moonPhaseName} <br>Illuminated Fraction: ${illuminatedFraction} <br>Angle: ${moonAngle}°<br>Distance: ${moonDistance} km<br>Percent of Max Distance: ${per_MoonDist.toFixed(0)} %`;

    adjustMoonSize(per_MoonDist)
  }



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


  function addMoonPhaseInteraction() {
    const dayPaths = document.querySelectorAll('path[id$="-day"]');
    dayPaths.forEach((path) => {
      path.addEventListener('mouseover', displayPlanetInfoOnHover);
      path.addEventListener('mouseout', redisplayTargetData);

    });
  }

  // Initialize the event listeners and display the current Moon phase
  addMoonPhaseInteraction();
  displayCurrentMoonPhase();

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





    // DAY PATH LISTENING to Trigger all hover events

    function addDayPathEventListeners() {
      const earthCyclesSVG = document.getElementById('EarthCycles');

      if (!earthCyclesSVG) {
        console.error('EarthCycles SVG element not found');
        return;
      }

      const dayPaths = earthCyclesSVG.querySelectorAll('path');

      dayPaths.forEach((path) => {
        if (path.id.endsWith('-day')) {
          path.addEventListener('mouseover', handleDayPathMouseOver);
          path.addEventListener('mouseout', handleDayPathMouseOut);
          path.addEventListener('click', handleDayPathMouseOver);

          // Add the touch event listeners to the path
         // path.addEventListener('touchstart', handleDayPathTouchStart);
          path.addEventListener('touchend', handleDayPathTouchEnd);
          //path.addEventListener('touchcancel', handleDayPathTouchStart);
        }
      });
    }

  document.addEventListener('DOMContentLoaded', () => {
    //updateCurrentMoonPhase();  delete
    addMoonPhaseInteraction();
  });

  // Initialize event listeners for the Sun SVG paths and reset the Moon phase to the current date
  addDayPathEventListeners();
  resetMoonPhase();










