

/* EARTHCYCLES CALENDAR PRIMARY JAVASCRIPTS   */

let startCoords = { cx: 0, cy: 0 };


let targetDate;
let startDate;
let year = 2024;
let currentDate;
let dayOfYear;


//Used in set2Today (maybe it should be integrated into it if this isn't used else where?)
//Setting the date but not the current year
function setCurrentDate() {
  let currentDate = new Date();
  startDate = new Date(currentDate.getFullYear(), 0, 1);
  targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

}






/* DAY SEARCH FUNCTION*/

function closeSearchModal() {
  var modal = document.getElementById("day-search");
  var underContent = document.getElementById("page-content");
underContent.classList.remove('blur');
  modal.classList.remove('modal-shown');
  modal.classList.add('modal-hidden');

//   document.getElementById("page-content").classList.remove("blur");
}

function openDateSearch() {
  var modal = document.getElementById("day-search");
//  modal.style.display = "block";
    // Show the modal
//  const modal = document.getElementById('form-modal-message');
  modal.classList.remove('modal-hidden');
  modal.classList.add('modal-shown');
  document.getElementById("page-content").classList.add("blur");

  // Retrieve the searched-year element
  var searchedYear = document.querySelector(".searched-year");

  // Retrieve the set-target button
  var setTargetBtn = document.getElementById("search-button");

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
    var day = parseInt(document.getElementById("day-field").value);
    var month = parseInt(document.getElementById("month-field").value);
    var yeard = parseInt(searchedYear.textContent);

    // Check if the day is reasonable
    if (day > 31) {
        alert("Please make sure you're choosing a reasonable date under 31!");
        return; // Stop the function if the day is invalid
    }

    // Check if it's February and the day is above 29
    if (month === 2 && day > 29) {
        alert("Please make sure you're choosing a reasonable date for February!");
        return; // Stop the function if the day is invalid for February
    }

    // Check if it's February in a non-leap year and the day is above 28
    if (month === 2 && day > 28 && !isLeapYear(yeard)) {
        alert("Please choose a day under 29 for February in a non-leap year!");
        return; // Stop the function if the day is invalid for non-leap year February
    }

    // Create a new Date object with the selected values
    targetDate = new Date(yeard, month - 1, day);
    searchGoDate(targetDate); // Trigger the setSetDate() function with the targetDate
});

// Helper function to check if a year is a leap year
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

}

function searchGoDate() {
  const currentYear = parseInt(currentYearText.textContent);
  currentYearText.textContent = (currentYear).toString();
  updateWeekTitles(currentYear);
  updateDayIds(currentYear);
  updateDayTitles(currentYear);
alert('Hi.  Please make sure the date is not above 31!');

  calendarRefresh();
  
  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "block";
  // document.getElementById("yesterday").style.display = "block";


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

  // Extract and format the date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const targetDate = new Date(); // Assuming targetDate is defined somewhere in your code
  let formattedDate = targetDate.toLocaleDateString('en-US', options);

  // Replace spaces between the date elements with non-breaking spaces
  formattedDate = formattedDate.replace(/ /g, '\u00A0');

  // Update the text in the div
  const titleElement = document.getElementById("add-event-title");
  titleElement.textContent = `Add an event for ${formattedDate}`;
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

        calendarRefresh()

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




// LISTEN FOR BREAKOUT CLICK
function listenForMonthBreakout() {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june', 
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  // Filter to only include May and June
  const targetMonths = ['may', 'june', 'july', 'august', 'september'];

  const solarCenterDiv = document.getElementById('solar-system-center');
  const dayLinesDiv = document.getElementById('days-of-year-lines');
  const allDaymarkers = document.getElementById('all-daymarkers');
  const lunarMonths = document.getElementById('lunar_months-12');

  targetMonths.forEach((month, index) => {
    const monthDiv = document.getElementById(`${month}_366`);
    const monthIntentions = document.getElementById(`${month}-intentions`);
    const monthNumber = monthNames.indexOf(month) + 1;

    const intentionsDiv = document.getElementById(`${month}-intention-month-name`);

    // OPEN:
    monthDiv.addEventListener('click', () => {
      allDaymarkers.style.opacity = '0';
      dayLinesDiv.style.opacity = '0'; 
      lunarMonths.style.opacity = '0'; 
      intentionsDiv.style.display = 'block';

      setTimeout(() => {
        solarCenterDiv.style.opacity = '0'; 
        monthDiv.style.opacity = '1'; 
      }, 500);

      setTimeout(() => breakoutTheMonth(month, monthNumber), 700);

      setTimeout(() => {
        monthIntentions.style.display = 'block'; 
        monthIntentions.style.opacity = '1'; 
      }, 1000);
    });
  });
}


// LISTEN FOR BREAKOUT CLOSE CLICK

function listenForCloseBreakout() {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june', 
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

    // Filter to only include May and June
    const targetMonths = ['may', 'june', 'july', 'august', 'september'];

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
            theMonth.style.opactiy ='0.66';
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

  // Filter to only include May and June
  const targetMonths = ['may', 'june', 'july', 'august','september'];

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

  targetMonths.forEach(month => {
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


function breakoutTheMonth(monthName, monthNumber) {
  closeCurrentBreakout(() => {
    const monthBreakout = document.getElementById(`${monthName}-breakout`);

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

    // Check the current display status of the month breakout
    if (monthBreakout.style.display === 'none' || !monthBreakout.style.display) {
      // Set all day div groups to display none
      const daysInMonth = new Date(2024, monthNumber, 0).getDate(); // Get the number of days in the month
      for (let i = 1; i <= daysInMonth; i++) {
        let dayId = `${i.toString().padStart(2, '0')}-${monthNumber.toString().padStart(2, '0')}-day-breakout`;
        setDisplay(dayId, 'none');
      }

      // Set the month breakout to display block
      monthBreakout.style.display = 'block';

      // Sequentially set each day div to display block
      for (let i = 1; i <= daysInMonth; i++) {
        let dayId = `${i.toString().padStart(2, '0')}-${monthNumber.toString().padStart(2, '0')}-day-breakout`;
        setTimeout(() => setDisplay(dayId, 'block'), i * 22);  // 0.22 seconds apart
      }

      // Check if targetDate is in the specified month and highlight the corresponding day
      const targetDateObj = new Date(targetDate);
      if (targetDateObj.getMonth() === monthNumber - 1) {  // Months are zero-indexed
        const day = targetDateObj.getDate().toString().padStart(2, '0');
        const dayId = `${day}-${monthNumber.toString().padStart(2, '0')}-day-breakout`;
        setTimeout(() => setDisplay(dayId, 'block', 'active-break'), day * 22);
      }

      calendarRefresh();
      listenForCloseBreakout();  // Initialize the close listeners after refreshing the calendar

    } else {
      // Sequentially set each day div to display none in reverse order
      const daysInMonth = new Date(2024, monthNumber, 0).getDate(); // Get the number of days in the month
      for (let i = daysInMonth; i >= 1; i--) {
        let dayId = `${i.toString().padStart(2, '0')}-${monthNumber.toString().padStart(2, '0')}-day-breakout`;
        setTimeout(() => setDisplay(dayId, 'none'), (daysInMonth - i + 1) * 22);  // Adjusted to 0.22 seconds
      }

      // Finally, set the month breakout to display none
      setTimeout(() => {
        monthBreakout.style.display = 'none';
      }, daysInMonth * 22 + 100);  // Adjusted delay to ensure all days are hidden first
    }
  });
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

// Globally preset variable for the current year
// const currentYear = 2024; // Set this to the appropriate value

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


    // Display an alert with the picked day, month, and year
    // alert(`Path: ${pathID},Day: ${day}, Month: ${month + 1}, Year: ${year}, date: ${date}`);
    
    
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

// Example implementation of displayMoonPhaseInDiv function
function displayMoonPhaseInDiv(date) {
  // Your code to display the moon phase details in a div
  console.log(`Displaying moon phase for date: ${date}`);
}

// Example implementation of displayDayInfo function
function displayDayInfo(date) {
  // Your code to display the day information
  console.log(`Displaying day info for date: ${date}`);
}

;

