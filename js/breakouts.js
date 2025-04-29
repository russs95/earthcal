

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
    alert('hello!');
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


