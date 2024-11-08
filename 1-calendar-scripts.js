
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

// Initialize the week and day titles for the current year



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
  setYearsMonthsOn()
  // updateTargetDay();

  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "none";
  // document.getElementById("yesterday").style.display = "none";


  document.getElementById("current-time").style.display = "none";
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

  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "none";
  // document.getElementById("yesterday").style.display = "none";


  // document.getElementById("current-time").style.display = "none";
  startDate = targetDate;

}




// Add event listeners to the buttons
prevYear.addEventListener('click', prevYearClick);
nextYear.addEventListener('click', nextYearClick);


// function updateDayIds(year) {
//   // Check if the year is a leap year
//   const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

//   // Select all paths including the 366-day path
//   const dayPaths = document.querySelectorAll('path[id$="-day"]:not([id*="lunar"])');

//   dayPaths.forEach((path) => {
//     // If it's not a leap year and the path is for the 366th day, change its ID
//     if (!isLeapYear && path.id.includes('366') && path.id.includes('-day')) {
//       path.setAttribute('id', '366-day');
//       return; // Skip further processing for this path
//     }

//     const idParts = path.id.split('-');
//     const day = parseInt(idParts[0]);
//     const date = new Date(year, 0, day);
//     const month = date.getMonth() + 1;
//     const dayOfMonth = date.getDate();
//     const yearString = year.toString();
//     const newId = `${day}-${dayOfMonth}-${month}-${yearString}-day`;
//     path.setAttribute('id', newId);
//   });


// }

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
  

    displayDayInfo(date);


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
  displayDayInfo(date);

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
  displayDayInfo(targetDate);
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



//THE NEXT FOCUS PROJECT
//Multi-lingual, split prints, small "th" "nd", UTC location info, Setting button, auto set the utc first

// Global variables for timezone and language
let timezone;
let language;

function getUserDetails() {
  // Get the user's timezone offset and format it
  const timezoneOffset = -new Date().getTimezoneOffset() / 60;
  timezone = `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;

  // Get the user's language and truncate it to the first two characters, then capitalize them
  language = (navigator.language || navigator.userLanguage).slice(0, 2).toUpperCase();

  // Set the global variable targetDate based on the user's timezone
  let currentDate = new Date();
  startDate = new Date(currentDate.getFullYear(), 0, 1);
  targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  // Call displayUserData with the timezone and language
  displayUserData(timezone, language);

  // Call displayDayInfo with the date, language, and timezone
  displayDayInfo(targetDate);

}




function displayDayInfo(date) {
  // Define the day and month names for each language
  const daysOfWeek = {
    EN: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ID: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    FR: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    ES: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    DE: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    AR: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  };

  const monthsOfYear = {
    EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ID: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    FR: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    ES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    DE: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    AR: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };

  const ordinalSuffixes = {
    EN: ['st', 'nd', 'rd', 'th'],
    ID: ['', '', '', ''],
    FR: ['er', '', '', ''],
    ES: ['', '', '', ''],
    DE: ['.', '.', '.', '.'],
    AR: ['', '', '', '']
  };

  const dayTranslations = {
    EN: 'Day',
    ID: 'Hari',
    FR: 'Jour',
    ES: 'Día',
    DE: 'Tag',
    AR: 'يوم'
  };

  const ofTranslations = {
    EN: 'of',
    ID: 'dari',
    FR: 'de',
    ES: 'de',
    DE: 'von',
    AR: 'من'
  };

  // Use the corresponding day and month names based on the user's language
  const dayOfWeek = daysOfWeek[language] ? daysOfWeek[language][date.getDay()] : daysOfWeek['EN'][date.getDay()];
  const month = monthsOfYear[language] ? monthsOfYear[language][date.getMonth()] : monthsOfYear['EN'][date.getMonth()];
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();

  // Calculate the day of the year
  const dayOfYear = getDayOfYear(date);

  // Determine the appropriate ordinal suffix for the day of the month
  const suffixIndex = (dayOfMonth % 10 === 1 && dayOfMonth !== 11) ? 0 : (dayOfMonth % 10 === 2 && dayOfMonth !== 12) ? 1 : (dayOfMonth % 10 === 3 && dayOfMonth !== 13) ? 2 : 3;
  const suffix = ordinalSuffixes[language] ? ordinalSuffixes[language][suffixIndex] : ordinalSuffixes['EN'][suffixIndex];
  const dayOfMonthString = `${dayOfMonth}<sup style="font-size: 0.7em;">${suffix}</sup>`;

  // Construct a string representing the full date
 const dateString = `${dayOfWeek}, ${month}\u00A0${dayOfMonthString}`;

  // Construct a string representing the day of the year
  const dayOfYearString = `${dayTranslations[language]} ${dayOfYear + 1} ${ofTranslations[language]} ${year}`;

  // Update the inner HTML of the div with id 'current-date-info' to display the date information
  const currentDateInfoDiv = document.getElementById('current-date-info');
  currentDateInfoDiv.innerHTML = `${dateString}`;

  // Update the inner HTML of the div with id 'current-day-info' to display the day of the year
  const currentDayInfoDiv = document.getElementById('current-day-info');
  currentDayInfoDiv.innerHTML = `<p style="margin: -12px 0px -10px 0px;">${dayOfYearString}</p>`;
}







function showUserCalSettings() {
  // Define the list of timezones with principal cities
  const timezones = [
    { value: 'UTC-12', label: 'UTC-12 | Baker Island, USA' },
    { value: 'UTC-11', label: 'UTC-11 | Niue' },
    { value: 'UTC-10', label: 'UTC-10 | Hawaii-Aleutian' },
    { value: 'UTC-9', label: 'UTC-9 | Alaska' },
    { value: 'UTC-8', label: 'UTC-8 | Pacific Time (US & Canada)' },
    { value: 'UTC-7', label: 'UTC-7 | Mountain Time (US & Canada)' },
    { value: 'UTC-6', label: 'UTC-6 | Central Time (US & Canada)' },
    { value: 'UTC-5', label: 'UTC-5 | Eastern Time (US & Canada)' },
    { value: 'UTC-4', label: 'UTC-4 | Atlantic Time (Canada)' },
    { value: 'UTC-3', label: 'UTC-3 | Buenos Aires' },
    { value: 'UTC-2', label: 'UTC-2 | South Georgia' },
    { value: 'UTC-1', label: 'UTC-1 | Azores' },
    { value: 'UTC+0', label: 'UTC+0 | London, UK' },
    { value: 'UTC+1', label: 'UTC+1 | Berlin, Germany' },
    { value: 'UTC+2', label: 'UTC+2 | Cairo' },
    { value: 'UTC+3', label: 'UTC+3 | Moscow' },
    { value: 'UTC+4', label: 'UTC+4 | Dubai' },
    { value: 'UTC+5', label: 'UTC+5 | Karachi' },
    { value: 'UTC+6', label: 'UTC+6 | Dhaka' },
    { value: 'UTC+7', label: 'UTC+7 | Jakarta, Indonesia' },
    { value: 'UTC+8', label: 'UTC+8 | Bali, Indonesia' },
    { value: 'UTC+9', label: 'UTC+9 | Tokyo' },
    { value: 'UTC+10', label: 'UTC+10 | Sydney' },
    { value: 'UTC+11', label: 'UTC+11 | Solomon Islands' },
    { value: 'UTC+12', label: 'UTC+12 | Fiji' },
    { value: 'UTC+13', label: 'UTC+13 | Tonga' },
    { value: 'UTC+14', label: 'UTC+14 | Kiritimati' }
  ];

  // Create options for the timezone select element
  let timezoneOptions = timezones.map(tz =>
    `<option value="${tz.value}" ${tz.value === timezone ? 'selected' : ''}>${tz.label}</option>`
  ).join('');

  // Insert a form into the modal content for the user to choose timezone and language
  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = `
    <div class="top-settings-icon"></div>
    <form id="user-settings-form">
      <div style="cursor:pointer;"><select id="timezone" name="timezone" class="blur-form-field" style="cursor:pointer;">
        ${timezoneOptions}
      </select></div>
      <select id="language" name="language" class="blur-form-field">
        <option value="EN" ${language === 'EN' ? 'selected' : ''}>English</option>
        <option value="ID" ${language === 'ID' ? 'selected' : ''}>Indonesian</option>
        <option value="FR" ${language === 'FR' ? 'selected' : ''}>French</option>
        <option value="ES" ${language === 'ES' ? 'selected' : ''}>Spanish</option>
        <option value="DE" ${language === 'DE' ? 'selected' : ''}>German</option>
        <option value="AR" ${language === 'AR' ? 'selected' : ''}>Arabic</option>
      </select>
      <br>

      <button type="button" name="apply" onclick="applySettings()" class="confirmation-blur-button" >Apply Settings</button>
    </form>
  `;

  // Show the modal
  const modal = document.getElementById('form-modal-message');
  modal.classList.remove('modal-hidden');
  modal.classList.add('modal-visible');
  document.getElementById("page-content").classList.add("blur");
}



function closeTheModal() {
  const modal = document.getElementById('form-modal-message');
  modal.classList.remove('modal-visible');
  modal.classList.add('modal-hidden');
   document.getElementById("page-content").classList.remove("blur");
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
  



// // This function displays the current moon phase
// function displayCurrentMoonPhase() {
//   const currentDate = targetDate;
//   // TODO: This function should call displayMoonPhaseInDiv() with the current date
// }
  


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
  /*
  // Add the function to handle the touchend event on -day paths
  function handleDayPathTouchEnd(event) {
    event.preventDefault();
  
    // Handle the touchend event here
    // For example, you can call a function to perform some action on touchend
    // Your touchend logic goes here...
  }
  */

  document.addEventListener('DOMContentLoaded', () => {
    //updateCurrentMoonPhase();  delete
    addMoonPhaseInteraction();
  });
  
  // Initialize event listeners for the Sun SVG paths and reset the Moon phase to the current date
  addDayPathEventListeners();
  resetMoonPhase();





//CLOCK, USER TIME

function applySettings() {
  // Get the values from the form
  timezone = document.getElementById('timezone').value;
  language = document.getElementById('language').value;

  // Call displayUserData with the new values
  displayUserData();

  // Call displayDayInfo with the new values
  displayDayInfo(targetDate);

  // Check if the main-clock div is showing
  const mainClock = document.getElementById('main-clock');
  if (mainClock.style.display === 'block') {
    // Hide the main-clock div
    mainClock.style.display = 'none';
  }

  // Run openClock to update the clock with the new timezone
  openClock(timezone);

  // Close the modal
  closeTheModal();
}

function displayUserData() {
  // Function to update the current time
  function updateTime() {
    // Convert the timezone format from "UTC+8" to "Etc/GMT-8"
    const timezoneConverted = timezone.replace(/UTC([+-]\d+)/, (match, p1) => `Etc/GMT${p1.startsWith('+') ? '-' : '+'}${Math.abs(parseInt(p1))}`);

    // Get the current date and time in the user's timezone
    const currentTime = new Date().toLocaleString('en-US', { timeZone: timezoneConverted });
    const [datePart, timePart] = currentTime.split(', ');
    const [hours, minutes, seconds] = timePart.split(':').map(part => part.padStart(2, '0'));

    // Update the inner HTML of the span with id 'current-user-time' to display the current time
    const currentUserTime = `${hours}:${minutes}:${seconds}`;
    document.getElementById('current-user-time').textContent = currentUserTime;
  }

  // Construct a string representing the user's details
  const userDetailsString = `| ${timezone} | ${language}`;

  // Set the initial content of the div with id 'user-timezone-lang'
  const userTimezoneLangDiv = document.getElementById('user-timezone-lang');
  userTimezoneLangDiv.innerHTML = `
    <p>
      <span id="current-user-time"></span>
      <span id="user-details" style="cursor:pointer" onclick="showUserCalSettings()" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${userDetailsString} ⚙️</span>
    </p>`;

  // Update the time immediately
  updateTime();

  // Set an interval to update the time every second
  setInterval(updateTime, 1000);
}

let clockInterval;

function openClock(timezone) {
  const mainClock = document.getElementById('main-clock');
  const secondHand = document.getElementById('main-second-hand');
  const minuteHand = document.getElementById('main-minute-hand');
  const hourHand = document.getElementById('main-hour-hand');
  const solarSystemCenter = document.getElementById('solar-system-center');

  // Convert the timezone format from "UTC+X" to "Etc/GMT-X"
  const timezoneConverted = timezone.replace(/UTC([+-]\d+)/, (match, p1) => `Etc/GMT${p1.startsWith('+') ? '-' : '+'}${Math.abs(parseInt(p1))}`);

  // Clear existing interval to prevent multiple intervals
  clearInterval(clockInterval);

  if (mainClock.style.display === 'none' || mainClock.style.display === '') {
    mainClock.style.display = 'block';
    if (solarSystemCenter) {
      solarSystemCenter.style.opacity = "0.5";
      solarSystemCenter.style.filter = "brightness(50%)";
    }

    function setClockHands() {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: timezoneConverted }));
      const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
      const minutes = now.getMinutes() + seconds / 60;
      const hours = now.getHours() + minutes / 60;

      const secondDeg = (seconds / 60) * 360;
      const minuteDeg = (minutes / 60) * 360;
      const hourDeg = (hours / 12) * 360;

      secondHand.setAttribute('transform', `rotate(${secondDeg} 181.07 165.44)`);
      minuteHand.setAttribute('transform', `rotate(${minuteDeg} 181.07 165.44)`);
      hourHand.setAttribute('transform', `rotate(${hourDeg} 181.07 165.44)`);
    }

    function animateClockHands() {
      setClockHands();
      clockInterval = setInterval(setClockHands, 100); // 10 frames per second (every 1/10th of a second)
    }

    animateClockHands();
  } else {
    mainClock.style.display = 'none';
    clearInterval(clockInterval);
    if (solarSystemCenter) {
      solarSystemCenter.style.opacity = "";
      solarSystemCenter.style.filter = "";
    }
  }
}

