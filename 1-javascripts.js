
/* EARTHCYCLES CALENDAR PRIMARY JAVASCRIPTS */

let startCoords = { cx: 0, cy: 0 };

let targetDate;
let startDate;
let year = 2025;
let currentDate;
let dayOfYear;

/* Used in set2Today
 * Sets the current date and initializes targetDate and startDate
 */

//THE NEXT FOCUS PROJECT
//Multi-lingual, split prints, small "th" "nd", UTC location info, Setting button, auto set the utc first

// Global variables for timezone and language
let timezone;
let language;

function getUserDetails() {
  // Get the user's timezone offset and format it
  const timezoneOffset = -new Date().getTimezoneOffset() / 60;
  timezone = `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;

  // Get the user's language from various sources
  const browserLanguage = navigator.language || navigator.userLanguage; // Primary
  const acceptLanguage = navigator.languages && navigator.languages[0]; // Fallback

  // Use the first detected language or default to 'EN'
  const detectedLanguage = (browserLanguage || acceptLanguage || 'en').slice(0, 2).toUpperCase();
  language = detectedLanguage;

  // Debugging logs
  console.log(`Browser language: ${browserLanguage}`);
  console.log(`Accept-Language: ${acceptLanguage}`);
  console.log(`Detected language: ${language}`);

  // Set the global variable targetDate based on the user's timezone
  let currentDate = new Date();
  startDate = new Date(currentDate.getFullYear(), 0, 1);
  targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  // Call displayUserData with the timezone and language
  displayUserData(timezone, language);

  // Call displayDayInfo with the date, language, and timezone
  displayDayInfo(targetDate);


}


function setCurrentDate() {
  let currentDate = new Date();
  startDate = new Date(currentDate.getFullYear(), 0, 1);
  targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
}

/* DAY SEARCH FUNCTIONS */

// Close the day search modal
function closeSearchModal() {
  const modal = document.getElementById("day-search");
  const underContent = document.getElementById("page-content");

  underContent.classList.remove("blur");
  modal.classList.remove("modal-shown");
  modal.classList.add("modal-hidden");
}

// Open the day search modal
function openDateSearch() {

    const modal = document.getElementById("day-search");

    // Use the global 'language' variable to fetch translations, defaulting to English (EN) if undefined or unsupported
    const translations = openDateSearchTranslations[language] || openDateSearchTranslations.EN;

    // Populate the title
    document.getElementById("date-search-title").textContent = translations.title;

    // Set placeholder for the day input
    const dayField = document.getElementById("day-field");
    dayField.placeholder = translations.placeholderDay;

    // Populate months in the select dropdown
    const monthField = document.getElementById("month-field");
    monthField.innerHTML = ""; // Clear existing options
    translations.months.forEach((month, index) => {
        const option = document.createElement("option");
        option.value = index + 1;
        option.textContent = month;
        monthField.appendChild(option);
    });

    // Set year buttons text
    const prevYearButton = document.getElementById("prev-year-search");
    const nextYearButton = document.getElementById("next-year-search");
    prevYearButton.setAttribute("aria-label", translations.prevYear);
    prevYearButton.setAttribute("title", translations.prevYear);
    nextYearButton.setAttribute("aria-label", translations.nextYear);
    nextYearButton.setAttribute("title", translations.nextYear);

    // Set the Go to Date button text
    const searchButton = document.getElementById("search-button");
    searchButton.textContent = translations.goToDate;

    // Initialize the target button
    const setTargetBtn = document.getElementById("search-button");

    // Show the modal
    modal.classList.remove("modal-hidden");
    modal.classList.add("modal-shown");
    document.getElementById("page-content").classList.add("blur");

    // Set default values
    const searchedYear = document.querySelector(".searched-year");
    let year = targetDate.getFullYear();
    searchedYear.textContent = year;

    dayField.value = targetDate.getDate();
    monthField.value = targetDate.getMonth() + 1;

    // Add event listener for the search button
    setTargetBtn.addEventListener("click", function () {
        const day = parseInt(dayField.value, 10);
        const month = parseInt(monthField.value, 10);
        const yeard = parseInt(searchedYear.textContent, 10);

        if (!validateDate(day, month, yeard)) return;

        targetDate = new Date(yeard, month - 1, day);
        searchGoDate(targetDate);
    });

    // Handle event listeners for year navigation
    prevYearButton.addEventListener("click", function () {
        year--;
        searchedYear.textContent = year;
        targetDate.setFullYear(year);
        targetDate.setMonth(0);
        targetDate.setDate(1);
        searchGoDate(targetDate);
    });

    nextYearButton.addEventListener("click", function () {
        year++;
        searchedYear.textContent = year;
        targetDate.setFullYear(year);
        targetDate.setMonth(0);
        targetDate.setDate(1);
        searchGoDate(targetDate);
    });
}



// Update the year and refresh associated UI
function updateYear(year, searchedYearElement) {
  searchedYearElement.textContent = year;
  targetDate.setFullYear(year);
  targetDate.setMonth(0);
  targetDate.setDate(1);

  searchGoDate(targetDate);
}

// Validate the selected date and return true if valid
function validateDate(day, month, year) {
    const translations = openDateSearchTranslations[language] || openDateSearchTranslations.EN;

    if (day > 31) {
        alert(translations.invalidDay);
        return false;
    }

    if (month === 2 && day > 29) {
        alert(translations.invalidFebruary);
        return false;
    }

    if (month === 2 && day > 28 && !isLeapYear(year)) {
        alert(translations.invalidLeapYear);
        return false;
    }

    return true;
}


// Helper function to check if a year is a leap year
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Update the calendar for the selected date
function searchGoDate() {
  const currentYear = parseInt(currentYearText.textContent, 10);
  currentYearText.textContent = currentYear.toString();

  updateWeekTitles(currentYear);
  updateDayIds(currentYear);
  updateDayTitles(currentYear);

  calendarRefresh();
}



/*Updates certain colors to the Dark or Light theme*/
function updateBackgroundColor() {
  const svg = document.querySelector("html");
  const elementsWithColor = svg.querySelectorAll("[fill='#808000'], [stroke='#808000']");

  for (let element of elementsWithColor) {
    if (element.getAttribute("fill") === "#808000") {
      element.setAttribute("fill", "var(--general-background)");
    }
    if (element.getAttribute("stroke") === "#808000") {
      element.setAttribute("stroke", "var(--general-background)");
    }
  }
}


/*var(--general-background-highlight)*/
function updateHighlightColor() {
  const svg = document.querySelector("html");
  const elementsWithColor = svg.querySelectorAll("[fill='#008000'], [stroke='#008000']");

  for (let element of elementsWithColor) {
    if (element.getAttribute("fill") === "#008000") {
      element.setAttribute("fill", "var(--general-background-highlight)");
    }
    if (element.getAttribute("stroke") === "#008000") {
      element.setAttribute("stroke", "var(--general-background-highlight)");
      element.setAttribute("opacity", "1");

    }
  }
}


let modalOpen = false; // Keep track of modal state

function openMainMenu() {
    const modal = document.getElementById("main-menu-overlay");
    const content = document.getElementById("main-menu-content");

    // Fetch translations based on the selected language
    const translations = mainMenuTranslations[language] || mainMenuTranslations.EN;

    // Dynamically set the menu content
    content.innerHTML = `

        <div class="earthcycles-logo" alt="EarthCal Logo" title="${translations.title}"></div>

        <div class="menu-page-item" onclick="sendDownRegistration(); closeMainMenu(); setTimeout(guidedTour, 500);">
            ${translations.featureTour}
        </div>

        <div class="menu-page-item" onclick="sendDownRegistration(); closeMainMenu(); setTimeout(showIntroModal, 500);">
            ${translations.latestVersion}
        </div>

        <div class="menu-page-item" onclick="closeMainMenu(), sendUpRegistration()">
            ${translations.newsletter}
        </div>

        <div class="menu-page-item"><a href="https://guide.earthen.io/" target="_blank">${translations.guide}</a></div>

        <!--<div class="menu-page-item"><a href="https://gobrik.com/regen-store.php#shop/" target="_blank">${translations.purchasePrint}</a></div>-->

        <div class="menu-page-item"><a href="https://guide.earthen.io/about" target="_blank">${translations.about}</a></div>



        <a href="https://snapcraft.io/earthcal" style="margin-top:20px">
            <img alt="Get it from the Snap Store" src="svgs/snap-store-black.svg" />
        </a>

        <p style="font-size:small;">${translations.developedBy} <a href="https://earthen.io/earthcal" target="_blank">Earthen.io</a></p>
    `;

    // Show the modal
    modal.style.width = "100%";
    document.body.style.overflowY = "hidden";
    document.body.style.maxHeight = "101vh";

    modal.setAttribute("tabindex", "0");
    modal.focus();
    modalOpen = true;

    // Add focus restriction
    document.addEventListener("focus", focusMainMenuRestrict, true);
}


function focusMainMenuRestrict(event) {
    const modal = document.getElementById("main-menu-overlay");
    if (modalOpen && !modal.contains(event.target)) {
        event.stopPropagation();
        modal.focus();
    }
}
function closeMainMenu() {
    const modal = document.getElementById("main-menu-overlay");
    modal.style.width = "0%";
    document.body.style.overflowY = "unset";
    document.body.style.maxHeight = "unset";

    modalOpen = false;

    // Cleanup event listeners
    document.removeEventListener("focus", focusMainMenuRestrict, true);
}
function modalCloseCurtains(event) {
    if (!event.key || event.key === "Escape") {
        closeMainMenu();
    }
}

document.addEventListener("keydown", modalCloseCurtains);



async function openAddCycle() {
    console.log('openAddCycle called'); // Log function call

    // Prepare the modal for display
    document.body.style.overflowY = "hidden";
    document.body.style.maxHeight = "101vh";
    document.getElementById("add-datecycle").classList.remove('modal-hidden');
    document.getElementById("add-datecycle").classList.add('modal-shown');
    document.getElementById("page-content").classList.add("blur");

    // Format the current date for display
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const targetDate = new Date();
    let formattedDate = targetDate.toLocaleDateString('en-US', options);
    formattedDate = formattedDate.replace(/ /g, '\u00A0'); // Replace spaces with non-breaking spaces

    // Update the modal title
    const titleElement = document.getElementById("add-event-title");
    titleElement.textContent = `Add an event for ${formattedDate}`;
    console.log('Formatted date set in modal');

    // Add listener for Enter key to submit the form
    document.addEventListener("keydown", handleEnterKeySubmit);

    // Check if the user is logged in
    const buwanaId = localStorage.getItem('buwana_id');
    if (!buwanaId) {
        console.log('User not logged in. Displaying placeholder in dropdown.');
        const calendarDropdown = document.getElementById('select-calendar');
        calendarDropdown.innerHTML = '<option disabled selected>Please log in or create a local calendar</option>';
        return;
    }

    console.log('User is logged in. Buwana ID:', buwanaId);
    populateCalendarDropdown(buwanaId);
}



async function populateCalendarDropdown(buwanaId) {
    console.log('populateCalendarDropdown called with buwanaId:', buwanaId);

    const calendarDropdown = document.getElementById('select-calendar');
    if (!calendarDropdown) {
        console.error('Dropdown element not found or inaccessible.');
        return;
    }

    try {
        // Call the API to fetch user's calendars
        console.log('Fetching calendars from API...');
        const response = await fetch('https://gobrik.com/earthcal/grab_user_calendars.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buwana_id: buwanaId })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log('Parsed API result:', result);

        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch user calendars.');
        }

        const calendars = result.calendars || [];
        console.log('Fetched calendars:', calendars);

        // Clear existing options
        calendarDropdown.innerHTML = '';

        if (calendars.length === 0) {
            console.log('No calendars found. Adding placeholder.');
            calendarDropdown.innerHTML = '<option disabled selected>No calendars found. Add a new one below.</option>';
            document.getElementById('addNewCalendar').style.display = 'block';
            return;
        }

        let myCalendarFound = false;

        // Populate the dropdown with calendars
        calendars.forEach(calendar => {
            if (!calendar.name || !calendar.color) {
                console.warn('Skipping invalid calendar:', calendar);
                return;
            }

            const option = document.createElement('option');
            option.value = calendar.id || calendar.local_id;
            option.textContent = `${calendar.name} (${calendar.color})`;

            if (calendar.name === "My Calendar") {
                option.selected = true;
                myCalendarFound = true;
            }

            calendarDropdown.appendChild(option);
            console.log(`Added option: ${option.textContent}`);
        });

        // Add placeholder if "My Calendar" was not found
        if (!myCalendarFound) {
            const placeholderOption = document.createElement('option');
            placeholderOption.textContent = "Select calendar...";
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            calendarDropdown.prepend(placeholderOption);
            console.log('Placeholder added.');
        }

        document.getElementById('addNewCalendar').style.display = 'none';
        console.log('Dropdown populated successfully.');
    } catch (error) {
        console.error('Error populating dropdown:', error);
        calendarDropdown.innerHTML = '<option disabled selected>Error loading calendars. Try again later.</option>';
    }
}






function handleEnterKeySubmit(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent default action (if any)
    const form = document.getElementById("dateCycleForm");
    if (form) {
      form.querySelector("#confirm-dateCycle-button").click(); // Trigger the form submit button
    }
  }
}

/* Close when someone clicks on the "x" symbol inside the overlay */

function closeAddCycle() {
  //document.getElementById("add-datecycle").style.width = "0%";
  document.body.style.overflowY = "unset";
  document.body.style.maxHeight = "unset";

  document.getElementById("add-datecycle").classList.add('modal-hidden');
  document.getElementById("add-datecycle").classList.remove('modal-shown');
  document.getElementById("page-content").classList.remove("blur");

  // Reset select-cal to default value
  let selectCal = document.getElementById("select-cal");
  if (selectCal) selectCal.value = "Select Calendar...";

  // Reset dateCycle-type to default value
  let dateCycleType = document.getElementById("dateCycle-type");
  if (dateCycleType) dateCycleType.value = "Select frequency...";

  // Hide the datecycle-setter div
  let datecycleSetter = document.getElementById("datecycle-setter");
  if (datecycleSetter) datecycleSetter.style.display = "none";

  // Reset the value of add-date-title
  let addDateTitle = document.getElementById("add-date-title");
  if (addDateTitle) addDateTitle.value = "";

  // Remove the Enter key listener
  document.removeEventListener("keydown", handleEnterKeySubmit);
}




function modalCloseCurtains ( e ) {
  if ( !e.keyCode || e.keyCode === 27 ) {
    
  document.body.style.overflowY = "unset";
  document.getElementById("right-settings-overlay").style.width = "0%";
  /*document.getElementById("knack-overlay-curtain").style.height = "0%";*/

  }
}

document.addEventListener('keydown', modalCloseCurtains);







       
/* ---------------------------

Animate the planets into position 


-------------------------------*/



  // Specific function for the targetDate
function getDayOfYear(targetDate) {
  const startOfYear = new Date(Date.UTC(targetDate.getFullYear(), 0, 1));
  const diff = targetDate.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  let dayOfYear = Math.floor(diff / oneDay) + 1;
  // Adjust for day 366
  if (dayOfYear === 366) {
    dayOfYear = 365;
  }
  return dayOfYear;
}



// Helper function for other functions (like the GetMoonDay)
function getTheDayOfYear(targetDate) {

  const startOfYear = new Date(Date.UTC(targetDate.getFullYear(), 0, 1));
  const diff = targetDate.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  dayOfYear = Math.floor(diff / oneDay) + 1;

  // Adjust for day 366
  if (dayOfYear === 366) {
    dayOfYear = 365;
  }

  return dayOfYear;
}



  
///




// TRIGGERS PLANET ANIMATION ON DAY PATH CLICK



  function triggerPlanets() {
 // Set startDate to the current value of targetDate
    let paths = document.querySelectorAll('path[id$="-day"]');
    // Event listener for each path element
    
    paths.forEach(path => {
      path.addEventListener('click', () => {
        // Parse date from path ID
        let pathIdArr = path.id.split('-');
        let month = pathIdArr[2] - 1;
        let day = pathIdArr[1];
        let year = pathIdArr[3];
        targetDate = new Date(year, month, day);

        calendarRefresh();

        startDate = targetDate;
        // document.getElementById("reset").style.display = "block";
        // document.getElementById("current-time").style.display = "none";
      
       
      });
      
    });
  }


  
 
  function calendarRefresh() {
    // Phase 1: instant animations
    updateTargetMonth();
     displayDayInfo(targetDate);
    // getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    //Sets the lunar month for the target date
    resetPaths();
    updateTargetDay();
  // Phase 2: animations after 0.1sec

    mercury.animate();
    venus.animate();
    earth.animate();
    mars.animate();
    jupiter.animate();
    saturn.animate();
    uranus.animate();
    neptune.animate();

    animateWhaleCycle(targetDate);
    UpdateWhaleCycle(targetDate);
       updateStorkCycle(targetDate);




    // Phase 3: Actions after 1 sec



    highlightDateCycles();
    displayMatchingDateCycle();


    // getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    // setLunarMonthForTarget(targetDate);
    
  

    dayOfYear = getDayOfYear(targetDate);
    const currentYearText = document.getElementById('current-year').querySelector('tspan');
    currentYearText.textContent = targetDate.getFullYear().toString();
    const currentYear = parseInt(currentYearText.textContent);

    setLunarMonthForTarget(targetDate, currentYear);

   setTimeout(function() {
    displayMoonPhaseInDiv(targetDate);
    displayDayInfo(targetDate);displayMoonPhaseInDiv(targetDate);
    displayDayInfo(targetDate);

    UpdateVenusData(targetDate);
    UpdateMarsData(targetDate);
    UpdateJupiterData(targetDate);
    UpdateSaturnData(targetDate);

    // redisplayTargetData();
    startDate = targetDate;
  }, 1000);

}

function set2Tomorrow() {
  // This function sets the target date to tomorrow and then refreshes the calendar
  // targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1); // Sets the target date to tomorrow
  calendarRefresh(); // Call the calendarRefresh function
  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "none";
  // document.getElementById("yesterday").style.display = "none";
  // document.getElementById("current-time").style.display = "none";

  
}

function set2Yesterday() {
  // This function sets the target date to yesterday and then refreshes the calendar
  // targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 1); // Sets the target date to yesterday
  calendarRefresh(); // Call the calendarRefresh function
  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "none";
  // document.getElementById("yesterday").style.display = "none";
  // document.getElementById("current-time").style.display = "none";




}

function set2Today() {
  setCurrentDate();  // Reset target date to the current date
  calendarRefresh(); // Call the calendarRefresh function for all updates

  // document.getElementById("yesterday").style.display = "block";
  // document.getElementById("tomorrow").style.display = "block";
  // document.getElementById("reset").style.display = "none";
  // document.getElementById("current-time").style.display = "block";


}








/* SET DATE PATHS being used???!
*/
function getMoonPhaseAndIllumination(date) {
  const julianDate = date / 86400000 + 2440587.5;
  const newMoon = 2451550.1;
  const synodicMonth = 29.53058867;

  const daysSinceNewMoon = julianDate - newMoon;
  const moonPhases = daysSinceNewMoon % synodicMonth;
  
  const phase = (moonPhases / synodicMonth) * 8;
  const phaseIndex = Math.floor((phase < 0 ? phase + 8 : phase) + 0.5) % 8;
  
  const moonPhaseIcons = [
    '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'
  ];
  
  return moonPhaseIcons[phaseIndex];
}






/* ADD TOOL TIP TO ALL TITLES */

function title2tooltip() {
  var paths = document.querySelectorAll('path:not([id$="-day"]):not([id*="phase"]), circle:not([id*="-day"]):not([id*="phase"])');

  for (var i = 0; i < paths.length; i++) {
    var title = paths[i].getAttribute('title');
    if (title) {
      paths[i].addEventListener('mouseover', function(event) {
        var tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = event.target.getAttribute('title');
        document.body.appendChild(tooltip);

        tooltip.style.left = event.clientX + 5 + 'px';
        tooltip.style.top = event.clientY + -20 + 'px'; // adjust the vertical position as needed
      });

      paths[i].addEventListener('mouseout', function(event) {
        var tooltip = document.querySelector('.tooltip');
        if (tooltip) {
          tooltip.parentNode.removeChild(tooltip);
        }
      });
    }
  }
}


function title2datetip() {
  var paths = document.querySelectorAll('path[id$="-day"]');

  for (var i = 0; i < paths.length; i++) {
    var title = paths[i].getAttribute('title');
    if (title) {
      paths[i].addEventListener('mouseover', function(event) {
        var tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = event.target.getAttribute('title');
        document.body.appendChild(tooltip);

        tooltip.style.left = event.clientX + 5 + 'px';
        tooltip.style.top = event.clientY + -20 + 'px'; // adjust the vertical position as needed
      });

      paths[i].addEventListener('mouseout', function(event) {
        var tooltip = document.querySelector('.tooltip');
        if (tooltip) {
          tooltip.parentNode.removeChild(tooltip);
        }
      });
    }
  }
}




/*LUNAR TIME*/

function getMoonPhaseEmoticon(date) {
  const phase = (((date.getTime() / 1000) - 753144) / (29.53059 * 86400)) % 1;
  if (phase < 0.035) return "🌑";
  if (phase < 0.215) return "🌒";
  if (phase < 0.285) return "🌓";
  if (phase < 0.465) return "🌔";
  if (phase < 0.535) return "🌕";
  if (phase < 0.715) return "🌖";
  if (phase < 0.785) return "🌗";
  return "🌘";
}

function addMoonPhaseTitle() {
  const currentDate = new Date();
  const phaseEmoticon = getMoonPhaseEmoticon(currentDate);

  const lunarPath = document.querySelector('svg path[id*="lunar"]');
  if (lunarPath) {
    const illuminatedFraction = Math.round(Math.abs(0.5 - (((currentDate.getTime() / 1000) - 753144) / (29.53059 * 86400)) % 0.5) * 200);
    const title = `Moon today: ${illuminatedFraction}% ${phaseEmoticon}`;
    lunarPath.setAttribute('title', title);
  }
}


function getIlluminatedFraction(date) {
  const julianDate = date / 86400000 + 2440587.5;
  const newMoon = 2451550.1;
  const synodicMonth = 29.53058867;

  const daysSinceNewMoon = julianDate - newMoon;
  const moonPhases = daysSinceNewMoon % synodicMonth;
  
  const phase = (moonPhases / synodicMonth) * 8;
  const phaseIndex = Math.floor((phase < 0 ? phase + 8 : phase) + 0.5) % 8;
  
  const illumination = Math.abs(50 * (1 - Math.cos((2 * Math.PI * moonPhases) / synodicMonth)));

  return {
    phaseIndex: phaseIndex,
    illuminatedFraction: illumination.toFixed(2),
  };
}

function displayCurrentMoonFraction() {
  const currentDate = new Date();
  const moonData = getIlluminatedFraction(currentDate);
  const moonPhaseEmoticon = getMoonPhaseAndIllumination(currentDate);

  const moonFractionDiv = document.querySelector('#moon-fraction');
  if (moonFractionDiv) {
    moonFractionDiv.innerHTML = `Moon: ${moonData.illuminatedFraction}% ${moonPhaseEmoticon}`;
  }
}





/*----------------------------

GUIDED TOUR


----------------------------*/

function closeTour() {
  // Get the modal and set its display to "block" to show it
  var modal = document.getElementById("guided-tour");
  modal.style.display = "none";
  document.getElementById("page-content").classList.remove("blur");
  tourTaken();
  // Reset the tour to the first window (index 0)
  //showInfo(0);
}
 

function guidedTour() {
  // Get the modal and set its display to "block" to show it
  var modal = document.getElementById("guided-tour");
  modal.style.display = "flex";

  // Add the "blur" class to the page content to visually distinguish it from the modal
  document.getElementById("page-content").classList.add("blur");

  // Get the close button and set its onclick function to hide the modal and remove the "blur" class from the page content
  // var closeButton = document.getElementByID("close-tour-button");
  // closeButton.onclick = function() {
  //   modal.style.display = "none";
  //   document.getElementById("page-content").classList.remove("blur");
  // }

    // Get all the "information" elements (which contain the tour content) and set the currentInfo variable to 0 (the first element)
  var information = document.querySelectorAll(".information");
  var currentInfo = 0;

  // Define a function to show the nth "information" element and hide the current one
  function showInfo(infoIndex) {
    // Check that the requested index is within the bounds of the array before attempting to show the information panel
    if (infoIndex >= 0 && infoIndex < information.length) {
      information[currentInfo].style.display = "none";
      information[infoIndex].style.display = "block";
      currentInfo = infoIndex;
    }
  }

  // Set the onclick function for the first "Next" button to show the second "information" element
  document.querySelector(".next:first-of-type").onclick = function() {
    showInfo(1);
  };

  // Set the onclick function for the second "Next" button to show the third "information" element
  document.querySelector("#information-two .next").onclick = function() {
    showInfo(2);
  };

  // Set the onclick function for the third "Next" button to show the fourth "information" element
  document.querySelector("#information-three .next").onclick = function() {
    showInfo(3);
  };

  // Set the onclick function for the fourth "Next" button to show the fifth "information" element
  document.querySelector("#information-four .next").onclick = function() {
    showInfo(4);
  };

    // Set the onclick function for the fith "Next" button to show the six "information" element
    document.querySelector("#information-five .next").onclick = function() {
      showInfo(5);
    };

  // Set the onclick function for the fifth "Next" button to hide the modal and remove the "blur" class from the page content
  // document.querySelector("#information-six .next").onclick = function() {
  //   modal.style.display = "none";
  //   document.getElementById("page-content").classList.remove("blur");
  //   showInfo(0);
  //   tourTaken();
  // };

// Set the onclick function for the "Back" button in the third "information" element to show the second "information" element
document.querySelector("#information-two .back").onclick = function() {
showInfo(0);
};
// Set the onclick function for the "Back" button in the third "information" element to show the second "information" element
document.querySelector("#information-three .back").onclick = function() {
showInfo(1);
};

// Set the onclick function for the "Back" button in the fourth "information" element to show the third "information" element
document.querySelector("#information-four .back").onclick = function() {
showInfo(2);
};

// Set the onclick function for the "Back" button in the fifth "information" element to show the fourth "information" element
document.querySelector("#information-five .back").onclick = function() {
showInfo(3);
};

// Set the onclick function for the "Back" button in the fifth "information" element to show the fourth "information" element
document.querySelector("#information-six .back").onclick = function() {
  showInfo(4);
  };

}


/*************************

// BREAKOUTS


/*****************************/


/* BREAKOUT SCRIPTS */


//Open the current month breakout (on load)
function openCurrentMonthBreakout() {
  // Array of month names in lowercase to match element IDs
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];

  // Get today's date
  const today = new Date();

  // Determine the current month and year
  const currentMonthNumber = today.getMonth() + 1; // Months are 0-based, so add 1
  const currentMonthName = monthNames[today.getMonth()]; // Get the name of the current month

  // Call breakoutTheMonth for the current month
  breakoutTheMonth(currentMonthName, currentMonthNumber);
}




   function triggerBreakoutDay() {
  // Parent container for all day-breakout elements
  const breakoutContainer = document.querySelector('svg'); // Adjust this selector to target the appropriate container for day elements

  // Check if container exists
  if (!breakoutContainer) return;

  // Add a single click listener to the container (event delegation)
  breakoutContainer.addEventListener('click', function (event) {
    const clickedElement = event.target.closest('g[id*="day-breakout"]');

    // Ensure the clicked element is a valid day-breakout group
    if (!clickedElement) return;

    // Remove the "active-break" class from all day-breakout elements
    document.querySelectorAll('g.active-break').forEach(group => {
      group.classList.remove('active-break');
    });

    // Add the "active-break" class to the clicked element
    clickedElement.classList.add('active-break');

    // Determine the year from the targetDate or default to the current year
    const year = targetDate instanceof Date ? targetDate.getFullYear() : new Date().getFullYear();

    // Extract day and month from the ID (e.g., "01-05-day-breakout")
    const idParts = clickedElement.id.split('-');
    const day = parseInt(idParts[0], 10); // First part is the day
    const month = parseInt(idParts[1], 10) - 1; // Second part is the month (adjusted for zero index)

    // Update the global targetDate with the new date
    targetDate = new Date(year, month, day);

    // Refresh the calendar
    calendarRefresh();
  });
}






// LISTEN FOR BREAKOUT CLICK
function listenForMonthBreakout() {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];

  monthNames.forEach((month) => {
    const monthDiv = document.getElementById(`${month}_366`);
    const monthNumber = monthNames.indexOf(month) + 1;

    // Listen for click on the monthDiv
    monthDiv.addEventListener('click', () => {
      breakoutTheMonth(month, monthNumber); // Delegate the logic to breakoutTheMonth
    });
  });
}





function breakoutTheMonth(monthName, monthNumber) {
  closeCurrentBreakout(() => {
    const monthBreakout = document.getElementById(`${monthName}-breakout`);
    const solarCenterDiv = document.getElementById('solar-system-center');
    const dayLinesDiv = document.getElementById('days-of-year-lines');
    const allDaymarkers = document.getElementById('all-daymarkers');
    const lunarMonths = document.getElementById('lunar_months-12');
    const monthIntentions = document.getElementById(`${monthName}-intentions`);
    const intentionsDiv = document.getElementById(`${monthName}-intention-month-name`);

    // Function to change the display style of day divs and possibly add a class
    const setDisplay = (id, displayStyle, addClass) => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = displayStyle;
        if (addClass) {
          element.classList.add(addClass);
        }
      }
    };

    // Fade out general calendar elements
    allDaymarkers.style.opacity = '0';
    dayLinesDiv.style.opacity = '0';
    lunarMonths.style.opacity = '0';
    lunarMonths.style.pointerEvents = 'none';
    intentionsDiv.style.display = 'block';

    // Fade out the solar center and highlight the clicked month
    setTimeout(() => {
      solarCenterDiv.style.opacity = '0';
      document.getElementById(`${monthName}_366`).style.opacity = '1';
    }, 500);

    // Show the breakout view after delay
    setTimeout(() => {
      monthBreakout.style.display = 'block';

      // Get the current year from the div with id 'current-year'
      const currentYear = parseInt(document.getElementById('current-year').textContent);

      // Get today's date
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() + 1 === monthNumber;

      // Determine if the targetDate is within the breakout month
      const isTargetDateInBreakoutMonth = targetDate &&
        targetDate.getFullYear() === currentYear &&
        targetDate.getMonth() + 1 === monthNumber;

      // Only update targetDate if the selected month does not contain the current date
      if (!isCurrentMonth) {
        targetDate = new Date(currentYear, monthNumber - 1, 1); // Set to the first day of the selected month
      }

      // Set all day div groups to display none
      const daysInMonth = new Date(currentYear, monthNumber, 0).getDate(); // Get the number of days in the month
      for (let i = 1; i <= daysInMonth; i++) {
        let dayId = `${i.toString().padStart(2, '0')}-${monthNumber.toString().padStart(2, '0')}-day-breakout`;
        setDisplay(dayId, 'none');
      }

      // Sequentially set each day div to display block
      for (let i = 1; i <= daysInMonth; i++) {
        let dayId = `${i.toString().padStart(2, '0')}-${monthNumber.toString().padStart(2, '0')}-day-breakout`;
        setTimeout(() => setDisplay(dayId, 'block'), i * 22); // 0.22 seconds apart
      }

      // Highlight the appropriate day:
      const dayToHighlight = isCurrentMonth
        ? today.getDate().toString().padStart(2, '0') // Highlight today's date if in breakout month
        : isTargetDateInBreakoutMonth
        ? targetDate.getDate().toString().padStart(2, '0') // Highlight targetDate if within breakout month
        : '01'; // Otherwise, highlight the first day of the month

      const highlightDayId = `${dayToHighlight}-${monthNumber.toString().padStart(2, '0')}-day-breakout`;
      setTimeout(() => setDisplay(highlightDayId, 'block', 'active-break'), 800);

      // Update breakout days of the week
      updateBreakoutDaysOfWeek(targetDate);

      calendarRefresh();
      listenForCloseBreakout(); // Initialize the close listeners after refreshing the calendar
    }, 700);

    // Show and fade in the intentions section for the month
    setTimeout(() => {
      monthIntentions.style.display = 'block';
      monthIntentions.style.opacity = '1';
    }, 1000);
  });
}



// LISTEN FOR BREAKOUT CLOSE CLICK

function listenForCloseBreakout() {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  monthNames.forEach(month => {
    const monthBreakoutCloseDiv = document.getElementById(`${month}-breakout-close`);

    if (monthBreakoutCloseDiv) {
      monthBreakoutCloseDiv.addEventListener('click', () => {
        console.log("Close button clicked:", monthBreakoutCloseDiv.id); // Debug log

        closeCurrentBreakout(() => {
          const solarCenterDiv = document.getElementById('solar-system-center');
          const dayLinesDiv = document.getElementById('days-of-year-lines');
          const allDaymarkers = document.getElementById('all-daymarkers');
          const lunarMonths = document.getElementById('lunar_months-12');
          const theMonth = document.getElementById(`${month}_366`);

          setTimeout(() => {
            dayLinesDiv.style.opacity = '1';
            theMonth.style.opacity = '0.66';
          }, 0);

          setTimeout(() => {
            solarCenterDiv.style.opacity = '1';
            lunarMonths.style.opacity = '1';
          }, 800);

          setTimeout(() => {
            allDaymarkers.style.opacity = '1';
          }, 1500);
        });
      });
    }
  });
}


function closeCurrentBreakout(callback) {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  // Function to change the display style of day divs and possibly add a class
  const setDisplay = (id, displayStyle, addClass) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = displayStyle;
      if (addClass) {
        element.classList.add(addClass);
      }
    }
  };

  let closeDuration = 0;
  let closeOperations = [];

  monthNames.forEach(month => {
    const otherMonthBreakout = document.getElementById(`${month}-breakout`);
    const otherMonthIntentions = document.getElementById(`${month}-intentions`);
    if (otherMonthBreakout && otherMonthBreakout.style.display === 'block') {
      const daysInOtherMonth = new Date(2024, monthNames.indexOf(month) + 1, 0).getDate();
      for (let i = daysInOtherMonth; i >= 1; i--) {
        let dayId = `${i.toString().padStart(2, '0')}-${(monthNames.indexOf(month) + 1).toString().padStart(2, '0')}-day-breakout`;
        closeOperations.push(() => setDisplay(dayId, 'none'));
      }
      closeDuration = daysInOtherMonth * 22 + 100;
      closeOperations.push(() => { otherMonthBreakout.style.display = 'none'; });
    }
    if (otherMonthIntentions && otherMonthIntentions.style.display !== 'none') {
      closeOperations.push(() => { otherMonthIntentions.style.display = 'none'; });
    }
  });

  // Execute all close operations sequentially
  closeOperations.forEach((operation, index) => {
    setTimeout(operation, index * 22);
  });

  // Call the callback function after closing current breakouts
  setTimeout(callback, closeDuration);
}








function updateBreakoutDaysOfWeek(targetDate) {
  const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  for (let i = 1; i <= daysInMonth; i++) {
    const dayOfWeek = new Date(targetDate.getFullYear(), targetDate.getMonth(), i).getDay();
    const dayTextId = `break_out_text_${i.toString().padStart(2, '0')}_${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const dayTextDiv = document.getElementById(dayTextId);

    if (dayTextDiv) {
      const tspanElement = dayTextDiv.querySelector('tspan');
      if (tspanElement) {
        tspanElement.innerHTML = dayNames[dayOfWeek];
      }
    }
  }

//  alert(`Days of the week for ${targetDate.toDateString()} are set!`);
}










// Function to toggle the views for solar and lunar for a particular month
function toggleMonthSolarLunarViews(month, type) {
  const intentionsDiv = document.getElementById(`${month}-intention-month-name`);
  const themoonphases = document.getElementById('themoonphases');
  const solarCenterDiv = document.getElementById('solar-system-center');
  const solarButton = document.getElementById(`${month}-solar_show-button`);
  const lunarButton = document.getElementById(`${month}-lunar_show-button`);

  if (type === 'solar') {
    intentionsDiv.style.display = 'none';
    themoonphases.style.display = 'none';
    solarCenterDiv.style.opacity = '1';
    if (solarButton) solarButton.style.display = 'none';
    if (lunarButton) lunarButton.style.display = 'block';
  } else if (type === 'lunar') {
    intentionsDiv.style.display = 'block';
    themoonphases.style.display = 'block';
    solarCenterDiv.style.opacity = '0';
    if (solarButton) solarButton.style.display = 'block';
    if (lunarButton) lunarButton.style.display = 'none';
  }
}

// Function to attach event listeners to all toggle buttons
function attachEventListeners() {
  const solarButtons = document.querySelectorAll('[id$="solar_show-button"]');
  solarButtons.forEach(button => {
    button.addEventListener('click', function() {
      const month = this.id.split('-')[0]; // Extract the month from the button id
      toggleMonthSolarLunarViews(month, 'solar');
    });
  });

  const lunarButtons = document.querySelectorAll('[id$="lunar_show-button"]');
  lunarButtons.forEach(button => {
    button.addEventListener('click', function() {
      const month = this.id.split('-')[0]; // Extract the month from the button id
      toggleMonthSolarLunarViews(month, 'lunar');
    });
  });
}

// Attach event listeners when the DOM content is loaded
document.addEventListener('DOMContentLoaded', attachEventListeners);


// MONTH PHASE DISPLAY ON BREAKOUTS

// Function to display moon phase on breakout touch or mouseover
function displayMoonPhaseOnBreakoutTouch(event) {
  const currentYear = parseInt(currentYearText.textContent); //imports the current year from the currentYearText element

  let targetElement = event.target;

  // Traverse up the DOM tree to find the <g> element if necessary
  while (targetElement && targetElement.tagName !== 'g') {
    targetElement = targetElement.parentNode;
  }

  // Ensure we have found the <g> element
  if (targetElement && targetElement.tagName === 'g') {
    const pathID = targetElement.id;
    const dateParts = pathID.split('-');
    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // month is 0-indexed in JavaScript
    const year = currentYear; // Use the globally preset currentYear

    const date = new Date(year, month, day);

    // Call the displayMoonPhaseInDiv function to show the moon phase details for the selected date
    displayMoonPhaseInDiv(date);
    updateMoonPhase(date);
  }
}

// Function to attach event listeners to all relevant SVG groups
function attachBreakoutTouchListeners() {
  const breakoutGroups = document.querySelectorAll('[id$="-day-breakout"]');
  breakoutGroups.forEach(group => {
    group.addEventListener('touchstart', displayMoonPhaseOnBreakoutTouch);
    group.addEventListener('mouseover', displayMoonPhaseOnBreakoutTouch);
  });
}

// Attach event listeners when the DOM content is loaded
document.addEventListener('DOMContentLoaded', attachBreakoutTouchListeners);


