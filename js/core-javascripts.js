



/* EARTHCYCLES CALENDAR PRIMARY JAVASCRIPTS */

let startCoords = { cx: 0, cy: 0 };
let targetDate;
let startDate;
let year = 2025;
let currentDate;
let dayOfYear;
let timezone;
let language;


















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
async function openDateSearch() {
    console.log("Current language:", userLanguage);

    const modal = document.getElementById("day-search");
    const lang = (userLanguage || 'en').toLowerCase();
    const translations = await loadTranslations(lang);

    // Use updated unified translations
    const months = translations.monthsOfYear || [];
    const title = translations.goToDateTitle || "Go to date...";
    const placeholderDay = translations.dayTranslations || "Day";
    const prevYear = translations.prevYear || "Previous Year";
    const nextYear = translations.nextYear || "Next Year";
    const goToDate = translations.goToDate || "Go to Date";

    document.getElementById("date-search-title").textContent = title;

    const dayField = document.getElementById("day-field");
    dayField.placeholder = placeholderDay;

    const monthField = document.getElementById("month-field");
    monthField.innerHTML = "";
    months.forEach((month, index) => {
        const option = document.createElement("option");
        option.value = index + 1;
        option.textContent = month;
        monthField.appendChild(option);
    });

    const prevYearButton = document.getElementById("prev-year-search");
    const nextYearButton = document.getElementById("next-year-search");
    prevYearButton.setAttribute("aria-label", prevYear);
    prevYearButton.setAttribute("title", prevYear);
    nextYearButton.setAttribute("aria-label", nextYear);
    nextYearButton.setAttribute("title", nextYear);

    const searchButton = document.getElementById("search-button");
    searchButton.textContent = goToDate;

    modal.classList.remove("modal-hidden");
    modal.classList.add("modal-shown");
    document.getElementById("page-content").classList.add("blur");

    const searchedYear = document.querySelector(".searched-year");
    let year = targetDate.getFullYear();
    searchedYear.textContent = year;

    dayField.value = targetDate.getDate();
    monthField.value = targetDate.getMonth() + 1;
const t = translations.openDateSearch || {};
    searchButton.onclick = () => {
        const day = parseInt(dayField.value, 10);
        const month = parseInt(monthField.value, 10);
        const yeard = parseInt(searchedYear.textContent, 10);

        if (!validateDate(day, month, yeard, t)) return;


        targetDate = new Date(yeard, month - 1, day);
        searchGoDate(targetDate);
        closeSearchModal();
    };

    prevYearButton.onclick = () => {
        year--;
        searchedYear.textContent = year;
        targetDate.setFullYear(year);
        targetDate.setMonth(0);
        targetDate.setDate(1);
        searchGoDate(targetDate);
    };

    nextYearButton.onclick = () => {
        year++;
        searchedYear.textContent = year;
        targetDate.setFullYear(year);
        targetDate.setMonth(0);
        targetDate.setDate(1);
        searchGoDate(targetDate);
    };
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
function validateDate(day, month, year, t) {
    if (day > 31) {
        alert(t.invalidDay || "Please make sure you're choosing a reasonable date under 31!");
        return false;
    }

    if (month === 2 && day > 29) {
        alert(t.invalidFebruary || "Please make sure you're choosing a reasonable date for February!");
        return false;
    }

    if (month === 2 && day > 28 && !isLeapYear(year)) {
        alert(t.invalidLeapYear || "Please choose a day under 29 for February in a non-leap year!");
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


//<div class="menu-page-item">${userStatusHTML}</div>
let modalOpen = false;

async function openMainMenu() {
    const modal = document.getElementById("main-menu-overlay");
    const content = document.getElementById("main-menu-content");

    const lang = userLanguage?.toLowerCase() || 'en';
    const { mainMenu } = await loadTranslations(lang);

    // 🔒 Use unified session checker (no UI update from here)
    const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });

    const firstName = userProfile?.first_name || payload?.given_name || "Earthling";
    const earthlingEmoji = userProfile?.earthling_emoji || payload?.["buwana:earthlingEmoji"] || "🌎";

    let userStatusHTML = '';
    if (ok) {
        userStatusHTML = `
            <div id="user-status">
                ${earthlingEmoji} ${mainMenu.loggedIn?.welcome || 'Welcome Back,'} ${firstName}
                | <a href="#" onclick="logoutBuwana(); closeMainMenu();">Logout</a>
            </div>
        `;
    } else {
        userStatusHTML = `
            <div id="or-login-signup">
                <a href="https://buwana.ecobricks.org/en/signup-1.php?app=ecal_7f3da821d0a54f8a9b58">Signup</a> |
                <a href="#" onclick="closeMainMenu(); sendUpRegistration()">Log in</a>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="earthcal-app-logo" style="margin-bottom: auto; margin-top: auto;">
            <img src="svgs/earthcal-logo.svg" style="width:155px;" alt="EarthCal Logo" title="${mainMenu.title}">
        </div>

        ${userStatusHTML}

        <div class="menu-page-item" onclick="sendDownRegistration(); closeMainMenu(); setTimeout(guidedTour, 500);">
            ${mainMenu.featureTour}
        </div>

        <div class="menu-page-item" onclick="sendDownRegistration(); closeMainMenu(); setTimeout(showIntroModal, 500);">
            ${mainMenu.latestVersion}
        </div>

        <div class="menu-page-item">
            <a href="https://guide.earthen.io/" target="_blank">${mainMenu.guide}</a>
        </div>

        <div class="menu-page-item">
            <a href="https://guide.earthen.io/about" target="_blank">${mainMenu.about}</a>
        </div>

        <a href="https://snapcraft.io/earthcal" style="margin-top:30px">
            <img alt="Get it from the Snap Store" src="svgs/snap-store-black.svg" />
        </a>

        <p style="font-size:small; margin-bottom: 2px;">
            ${mainMenu.developedBy} <a href="https://earthen.io/earthcal" target="_blank">Earthen.io</a>
        </p>
        <p style="font-size:small; margin-top: 2px; margin-bottom: auto;">
            ${mainMenu.authBy} <a href="https://buwana.ecobricks.org/en/" target="_blank">Buwana</a>
        </p>
    `;

    modal.style.width = "100%";
    document.body.style.overflowY = "hidden";
    document.body.style.maxHeight = "101vh";

    modal.setAttribute("tabindex", "0");
    modal.focus();
    modalOpen = true;

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
    displayDayInfo(targetDate, userLanguage, userTimeZone);
    // getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    //Sets the lunar month for the target date
    resetPaths();
    updateTargetDay();
  // Phase 2: animations after 0.1sec

    // Animate planets only when the Planet objects are available.
    // Without this check, `mercury`, `venus`, etc. may resolve to DOM
    // elements before `planet-orbits-2.js` initialises the Planet
    // instances, causing Element.animate to be invoked without
    // arguments.  Guarding the calls ensures we only trigger the
    // custom animation logic once the objects exist.
    if (typeof Planet !== "undefined") {
      [mercury, venus, earth, mars, jupiter, saturn, uranus, neptune].forEach(
        (planet) => {
          if (planet instanceof Planet) {
            planet.animate();
          }
        }
      );
    }

    animateWhaleCycle(targetDate);
    UpdateWhaleCycle(targetDate);
       updateStorkCycle(targetDate);




    // Phase 3: Actions after 1 sec



    highlightDateCycles(targetDate);
    //displayMatchingDateCycle();


    // getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    // setLunarMonthForTarget(targetDate);
    
  

    dayOfYear = getDayOfYear(targetDate);
    const currentYearText = document.getElementById('current-year').querySelector('tspan');
    currentYearText.textContent = targetDate.getFullYear().toString();
    const currentYear = parseInt(currentYearText.textContent);

    setLunarMonthForTarget(targetDate, currentYear);

   setTimeout(function() {
    displayMoonPhaseInDiv(targetDate);

    displayMoonPhaseInDiv(targetDate);

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
 
//
//function guidedTour() {
//  // Get the modal and set its display to "block" to show it
//  var modal = document.getElementById("guided-tour");
//  modal.style.display = "flex";
//
//  // Add the "blur" class to the page content to visually distinguish it from the modal
//  document.getElementById("page-content").classList.add("blur");
//
//  // Get the close button and set its onclick function to hide the modal and remove the "blur" class from the page content
//  // var closeButton = document.getElementByID("close-tour-button");
//  // closeButton.onclick = function() {
//  //   modal.style.display = "none";
//  //   document.getElementById("page-content").classList.remove("blur");
//  // }
//
//    // Get all the "information" elements (which contain the tour content) and set the currentInfo variable to 0 (the first element)
//  var information = document.querySelectorAll(".information");
//  var currentInfo = 0;
//
//  // Define a function to show the nth "information" element and hide the current one
//  function showInfo(infoIndex) {
//    // Check that the requested index is within the bounds of the array before attempting to show the information panel
//    if (infoIndex >= 0 && infoIndex < information.length) {
//      information[currentInfo].style.display = "none";
//      information[infoIndex].style.display = "block";
//      currentInfo = infoIndex;
//    }
//  }
//
//  // Set the onclick function for the first "Next" button to show the second "information" element
//  document.querySelector(".next:first-of-type").onclick = function() {
//    showInfo(1);
//  };
//
//  // Set the onclick function for the second "Next" button to show the third "information" element
//  document.querySelector("#information-two .next").onclick = function() {
//    showInfo(2);
//  };
//
//  // Set the onclick function for the third "Next" button to show the fourth "information" element
//  document.querySelector("#information-three .next").onclick = function() {
//    showInfo(3);
//  };
//
//  // Set the onclick function for the fourth "Next" button to show the fifth "information" element
//  document.querySelector("#information-four .next").onclick = function() {
//    showInfo(4);
//  };
//
//    // Set the onclick function for the fith "Next" button to show the six "information" element
//    document.querySelector("#information-five .next").onclick = function() {
//      showInfo(5);
//    };
//
//  // Set the onclick function for the fifth "Next" button to hide the modal and remove the "blur" class from the page content
//  // document.querySelector("#information-six .next").onclick = function() {
//  //   modal.style.display = "none";
//  //   document.getElementById("page-content").classList.remove("blur");
//  //   showInfo(0);
//  //   tourTaken();
//  // };
//
//// Set the onclick function for the "Back" button in the third "information" element to show the second "information" element
//document.querySelector("#information-two .back").onclick = function() {
//showInfo(0);
//};
//// Set the onclick function for the "Back" button in the third "information" element to show the second "information" element
//document.querySelector("#information-three .back").onclick = function() {
//showInfo(1);
//};
//
//// Set the onclick function for the "Back" button in the fourth "information" element to show the third "information" element
//document.querySelector("#information-four .back").onclick = function() {
//showInfo(2);
//};
//
//// Set the onclick function for the "Back" button in the fifth "information" element to show the fourth "information" element
//document.querySelector("#information-five .back").onclick = function() {
//showInfo(3);
//};
//
//// Set the onclick function for the "Back" button in the fifth "information" element to show the fourth "information" element
//document.querySelector("#information-six .back").onclick = function() {
//  showInfo(4);
//  };
//
//}

function guidedTour() {
  const modal = document.getElementById("guided-tour");
  modal.style.display = "flex";
  document.getElementById("page-content").classList.add("blur");

  import(`../translations/${userLanguage}.js?v=4`).then(module => {
    const t = module.translations.tour;

    // Populate tour text with specific button labels
    document.getElementById("tour-header-1").innerText = t.welcomeIntro;
    document.getElementById("tour-desc-1").innerText = t.welcomeParagraph;
    document.getElementById("next-1").innerText = t.buttonNextWelcome;

    document.getElementById("tour-header-2").innerText = t.oneOrbitTitle;
    document.getElementById("tour-desc-2").innerText = t.oneOrbitDesc;
    document.getElementById("back-2").innerText = t.buttonBack;
    document.getElementById("next-2").innerText = t.buttonNextOrbit;

    document.getElementById("tour-header-3").innerText = t.neighborhoodTitle;
    document.getElementById("tour-desc-3").innerText = t.neighborhoodDesc;
    document.getElementById("back-3").innerText = t.buttonBack;
    document.getElementById("next-3").innerText = t.buttonNextPlanets;

    document.getElementById("tour-header-4").innerText = t.getLunarTitle;
    document.getElementById("tour-desc-4").innerText = t.getLunarDesc;
    document.getElementById("back-4").innerText = t.buttonBack;
    document.getElementById("next-4").innerText = t.buttonNextMoon;

    document.getElementById("tour-desc-5").innerText = t.animalCyclesDesc;
    document.getElementById("back-5").innerText = t.buttonBack;
    document.getElementById("next-5").innerText = t.buttonNextCycles;

    document.getElementById("tour-header-6").innerText = t.addEventsTitle;
    document.getElementById("tour-desc-6").innerText = t.addEventsDesc;
    document.getElementById("back-6").innerText = t.buttonBack;
    document.getElementById("done").innerText = t.buttonDone;
  });

  const information = document.querySelectorAll(".information");
  let currentInfo = 0;

  function showInfo(index) {
    if (index >= 0 && index < information.length) {
      information[currentInfo].style.display = "none";
      information[index].style.display = "block";
      currentInfo = index;
    }
  }

  document.getElementById("next-1").onclick = () => showInfo(1);
  document.getElementById("next-2").onclick = () => showInfo(2);
  document.getElementById("next-3").onclick = () => showInfo(3);
  document.getElementById("next-4").onclick = () => showInfo(4);
  document.getElementById("next-5").onclick = () => showInfo(5);

  document.getElementById("back-2").onclick = () => showInfo(0);
  document.getElementById("back-3").onclick = () => showInfo(1);
  document.getElementById("back-4").onclick = () => showInfo(2);
  document.getElementById("back-5").onclick = () => showInfo(3);
  document.getElementById("back-6").onclick = () => showInfo(4);
}
