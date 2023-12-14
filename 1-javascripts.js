

/* EARTHCYCLES CALENDAR PRIMARY JAVASCRIPTS   */

let startCoords = { cx: 0, cy: 0 };


let targetDate;
let startDate;
let year = 2023;
let currentDate;
let dayOfYear;



function setCurrentDate() {
  let currentDate = new Date();
  startDate = new Date(currentDate.getFullYear(), 0, 1);
  targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
}






/* DAY SEARCH FUNCTION*/

function closeSearchModal() {
  var modal = document.getElementById("day-search");
  modal.style.display = "none";
}

function openDateSearch() {
  var modal = document.getElementById("day-search");
  modal.style.display = "block";

  // Retrieve the searched-year element
  var searchedYear = document.querySelector(".searched-year");

  // Retrieve the set-target button
  var setTargetBtn = document.querySelector(".search-button");

  // Set initial year value
  var year = targetDate.getFullYear(); // Use the year value from targetDate
  searchedYear.textContent = year;

  // Set the day field to the day value from targetDate
  document.getElementById("day-field").value = targetDate.getDate();

  // Set the month field to the month value from targetDate
  document.getElementById("month-field").value = targetDate.getMonth() + 1;


  // Decrease year by one when left arrow is clicked
  document.getElementById("prev-year-search").addEventListener("click", function() {
    year--;
    searchedYear.textContent = year;
    targetDate.setFullYear(year);
    targetDate.setMonth(0);
    targetDate.setDate(1);
    searchGoDate(targetDate); // Call searchGoDate() function with the updated targetDate
    const currentYearText = document.getElementById('current-year').querySelector('tspan');
  currentYearText.textContent = (year).toString();
  updateWeekTitles(year);
  updateDayIds(year);
  updateDayTitles(year);

  });

  // Increase year by one when right arrow is clicked
  document.getElementById("next-year-search").addEventListener("click", function() {
    year++;
    searchedYear.textContent = year;
    targetDate.setFullYear(year);
    targetDate.setMonth(0);
    targetDate.setDate(1);
    searchGoDate(targetDate); // Call searchGoDate() function with the updated targetDate
    const currentYearText = document.getElementById('current-year').querySelector('tspan');

  currentYearText.textContent = (year).toString();
  updateWeekTitles(year);
  updateDayIds(year);
  updateDayTitles(year);


  });

  // Set the target date and trigger setSetDate() function when set-target button is clicked
  setTargetBtn.addEventListener("click", function() {
    var day = document.getElementById("day-field").value;
    var month = document.getElementById("month-field").value;
    var yeard = searchedYear.textContent;
    targetDate = new Date(yeard, month - 1, day); // Create a new Date object with the selected values
    searchGoDate(targetDate); // Trigger the setSetDate() function with the targetDate
    modal.style.display = "none"; // Hide the modal

  });
}

function searchGoDate() {
  const currentYear = parseInt(currentYearText.textContent);
  currentYearText.textContent = (currentYear).toString();
  updateWeekTitles(currentYear);
  updateDayIds(currentYear);
  updateDayTitles(currentYear);
  animateMercury();
  animateVenus();
  animateEarth();
  animateMars();  
  animateJupiter();
  animateSaturn();
  animateUranus();
  animateNeptune();
  updateTargetWeekColor();
  updateTargetMonth();
  updateMoonPhase();
  updateTargetDay();
  displayMoonPhaseInDiv(targetDate);
  displayDayInfo(targetDate);
   getFirstNewMoon();  //Rotate lunar months into alignment with first new moon
    setLunarMonthForTarget();  //Sets the lunar month for the target date

  document.getElementById("reset").style.display = "block";
  document.getElementById("tomorrow").style.display = "block";
  document.getElementById("yesterday").style.display = "block";


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



/* RIGHT SETTINGS OVERLAY */

function openSettings() {
  document.getElementById("right-settings-overlay").style.width = "100%";
  document.body.style.overflowY = "hidden";
  document.body.style.maxHeight = "101vh";

  var modal = document.getElementById('right-settings-overlay');

function modalShow () {
   modal.setAttribute('tabindex', '0');
   modal.focus();
}

function focusRestrict ( event ) {
  document.addEventListener('focus', function( event ) {
    if ( modalOpen && !modal.contains( event.target ) ) {
      event.stopPropagation();
      modal.focus();
    }
  }, true);
}
}

/* Close when someone clicks on the "x" symbol inside the overlay */
function closeSettings() {
  document.getElementById("right-settings-overlay").style.width = "0%";
  document.body.style.overflowY = "unset";
document.body.style.maxHeight = "unset";
  //document.body.style.height = "unset";
} 

function modalCloseCurtains ( e ) {
  if ( !e.keyCode || e.keyCode === 27 ) {
    
  document.body.style.overflowY = "unset";
  document.getElementById("right-settings-overlay").style.width = "0%";
  /*document.getElementById("knack-overlay-curtain").style.height = "0%";*/

  }
}

document.addEventListener('keydown', modalCloseCurtains);






/* ADD CYCLE OVERLAY */

function openAddCycle() {
  //document.getElementById("add-a-datecycle").style.display = "block";
  document.getElementById("add-datecycle").style.width = "100%";
  document.body.style.overflowY = "hidden";
  document.body.style.maxHeight = "101vh";

}

/* Close when someone clicks on the "x" symbol inside the overlay */

function closeAddCycle() {
    document.getElementById("add-datecycle").style.width = "0%";
    document.body.style.overflowY = "unset";
    document.body.style.maxHeight = "unset";
    
    // Reset select-cal to default value
    let selectCal = document.getElementById("select-cal");
    if(selectCal) selectCal.value = "Select Calendar...";
    
    // Reset dateCycle-type to default value
    let dateCycleType = document.getElementById("dateCycle-type");
    if(dateCycleType) dateCycleType.value = "Select frequency...";
    
    // Hide the datecycle-setter div
    let datecycleSetter = document.getElementById("datecycle-setter");
    if(datecycleSetter) datecycleSetter.style.display = "none";
    
    // Reset the value of add-date-title
    let addDateTitle = document.getElementById("add-date-title");
    if(addDateTitle) addDateTitle.value = "";
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

        if (!('ontouchstart' in window)) {
          //setTimeout(updateTargetDay, 3900); //Adds color to the target Day (current day on load)
          // If it's not a touch device, call the function
          updateTargetDay();
        }
        
       animateWhaleCycle();
       UpdateWhaleCycle(targetDate);
        UpdateVenusData(targetDate);
        UpdateMarsData(targetDate);
        UpdateJupiterData(targetDate);
        UpdateSaturnData(targetDate);
        
        displayMatchingDateCycle();
        
       mercury.animate();
       mercury.animate();
       venus.animate();
       earth.animate();
       mars.animate();
       jupiter.animate();
       saturn.animate();
       uranus.animate();
       neptune.animate();
       
        updateTargetWeekColor();
        setLunarMonthForTarget(targetDate);
        updateTargetMonth();
        dayOfYear = getDayOfYear(targetDate);
        displayMoonPhaseInDiv(targetDate)
        document.getElementById("reset").style.display = "block";
        document.getElementById("tomorrow").style.display = "none";
        document.getElementById("yesterday").style.display = "none";


        document.getElementById("current-time").style.display = "none";
        startDate = targetDate;
       
      });
      
    });
  }


  
 
  function calendarRefresh() {
    // This function will execute a series of animations and updates for the calendar
    mercury.animate();
    venus.animate();
    earth.animate();
    mars.animate();
    jupiter.animate();
    saturn.animate();
    uranus.animate();
    neptune.animate();
    // updateTargetWeekColor();
    getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    setLunarMonthForTarget(targetDate);
    updateTargetMonth();
    displayDayInfo(targetDate);
    highlightDateCycles();
    displayMatchingDateCycle();
    if (!('ontouchstart' in window)) {
        //setTimeout(updateTargetDay, 900); //Adds color to the target Day (current day on load)
        // If it's not a touch device, call the function
        updateTargetDay();
    }
    dayOfYear = getDayOfYear(targetDate);
    const currentYearText = document.getElementById('current-year').querySelector('tspan');
    currentYearText.textContent = targetDate.getFullYear().toString();
    document.getElementById("reset").style.display = "none";
  
    document.getElementById("current-time").style.display = "block";

    displayMoonPhaseInDiv(targetDate);
    displayDayInfo(targetDate);

    UpdateVenusData(targetDate);
    UpdateMarsData(targetDate);
    UpdateJupiterData(targetDate);
    UpdateSaturnData(targetDate);

    animateWhaleCycle();
    UpdateWhaleCycle(targetDate);

    getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    setLunarMonthForTarget(targetDate);  //Sets the lunar month for the target date
}

function set2Tomorrow() {
  // This function sets the target date to tomorrow and then refreshes the calendar
  targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1); // Sets the target date to tomorrow
  calendarRefresh(); // Call the calendarRefresh function
  document.getElementById("reset").style.display = "block";
  document.getElementById("tomorrow").style.display = "none";
  document.getElementById("yesterday").style.display = "none";



  
}

function set2Yesterday() {
  // This function sets the target date to yesterday and then refreshes the calendar
  targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 1); // Sets the target date to yesterday
  calendarRefresh(); // Call the calendarRefresh function
  document.getElementById("reset").style.display = "block";
  document.getElementById("tomorrow").style.display = "none";
  document.getElementById("yesterday").style.display = "none";



}

function set2Today() {
  targetDate = new Date(); // Reset target date to the current date
  calendarRefresh(); // Call the calendarRefresh function for all updates
  document.getElementById("yesterday").style.display = "block";
  document.getElementById("tomorrow").style.display = "block";
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
  modal.style.display = "block";

  // Add the "blur" class to the page content to visually distinguish it from the modal
  document.getElementById("page-content").classList.add("blur");

  // Get the close button and set its onclick function to hide the modal and remove the "blur" class from the page content
  var closeButton = document.querySelector(".close");
  closeButton.onclick = function() {
    modal.style.display = "none";
    document.getElementById("page-content").classList.remove("blur");
  }

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

