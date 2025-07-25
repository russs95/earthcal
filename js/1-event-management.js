//  OPENING THE ADD DATECYCLE FORM

async function openAddCycle() {
    console.log('openAddCycle called'); // Log function call

    // Prevent conflicts with existing modals
    document.removeEventListener("click", closeEmojiPicker);

    // Prepare the modal for display
    document.body.style.overflowY = "hidden";
    document.body.style.maxHeight = "101vh";
    document.getElementById("add-datecycle").classList.remove('modal-hidden');
    document.getElementById("add-datecycle").classList.add('modal-shown');
    document.getElementById("page-content").classList.add("blur");

    // Format the current date for display
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let formattedDate = targetDate.toLocaleDateString('en-US', options);
    formattedDate = formattedDate.replace(/ /g, '\u00A0'); // Replace spaces with non-breaking spaces

    // Update the modal title
    const titleElement = document.getElementById("add-event-title");
    titleElement.textContent = `Add an event for ${formattedDate}`;

    // Populate the date fields
    populateDateFields(targetDate);

    // Add listener for Enter key to submit the form
    document.addEventListener("keydown", handleEnterKeySubmit);

    // Set button text to "+ Add DateCycle"
    const confirmButton = document.getElementById("confirm-dateCycle-button");
    if (confirmButton) {
        confirmButton.innerText = " + Add DateCycle";
    } else {
        console.warn('confirm-dateCycle-button not found in the DOM');
    }

    // Check if the user is logged in
    const buwanaId = localStorage.getItem('buwana_id');
    if (!buwanaId) {
        console.log('User not logged in. Displaying placeholder in dropdown.');
        const calendarDropdown = document.getElementById('select-calendar');
        calendarDropdown.innerHTML = '<option selected>My Calendar</option>';
        return;
    }

    console.log('User is logged in. Buwana ID:', buwanaId);
    populateCalendarDropdown(buwanaId);

    // Restore click event for modal closure after opening the picker
    setTimeout(() => {
        document.addEventListener("click", closeEmojiPicker);
    }, 500);
}





async function populateCalendarDropdown(buwanaId) {
    console.log('populateCalendarDropdown called with buwanaId:', buwanaId);

    const calendarDropdown = document.getElementById('select-calendar');
    const hiddenCalendarId = document.getElementById('set-calendar-id');
    const hiddenCalendarColor = document.getElementById('set-calendar-color');
    const hiddenBuwanaId = document.getElementById('buwana-id');

    if (!calendarDropdown || !hiddenCalendarId || !hiddenCalendarColor || !hiddenBuwanaId) {
        console.error('Dropdown or hidden fields not found or inaccessible.');
        return;
    }

    try {
        let calendars = [];
        let myCalendarFound = 0;

        if (buwanaId) {
            console.log('Fetching calendars from API...');
            const response = await fetch('https://buwana.ecobricks.org/earthcal/grab_user_calendars.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: buwanaId }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log('Parsed API result:', result);

            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch user calendars.');
            }

            // Store buwana_id in the hidden field
            hiddenBuwanaId.value = result.buwana_id;
            console.log(`buwana_id set to: ${result.buwana_id}`);

            // 🔹 **Ensure correct key mapping (`calendar_id` → `cal_id`, `calendar_name` → `name`)**
            calendars = result.calendars.map(calendar => ({
                cal_id: calendar.calendar_id || calendar.cal_id, // Normalize key names
                name: calendar.calendar_name || calendar.name,
                color: calendar.calendar_color || calendar.color,
            }));

            // 🔹 **Look for "My Calendar" in the API response**
            const myCalendar = calendars.find(calendar => calendar.name === "My Calendar");

            if (myCalendar) {
                myCalendarFound = 1;
                hiddenCalendarId.value = myCalendar.cal_id;
                hiddenCalendarColor.value = myCalendar.color;

                console.log(`✅ Prepopulated hidden fields with My Calendar: ID = ${myCalendar.cal_id}, Color = ${myCalendar.color}`);
            }
        }

        // 🔹 **Clear existing options**
        calendarDropdown.innerHTML = '';

        if (!myCalendarFound) {
            console.log('⚠️ My Calendar not found in database, using default settings.');
            hiddenCalendarId.value = '000';
            hiddenCalendarColor.value = 'Blue';
            hiddenBuwanaId.value = 'undefined';

            console.log('✅ Default values set in hidden fields: ID = 000, Color = Blue');

            calendars.unshift({
                cal_id: '000',
                name: 'My Calendar',
                color: 'Blue',
            });
        }

        if (calendars.length === 0) {
            console.log('⚠️ No calendars found. Adding placeholder.');
            calendarDropdown.innerHTML = '<option disabled selected>No calendars found. Add a new one below.</option>';
            document.getElementById('addNewCalendar').style.display = 'block';
            return;
        }

        // 🔹 **Populate the dropdown**
        calendars.forEach(calendar => {
            if (!calendar.name || !calendar.color) {
                console.warn('⚠️ Skipping invalid calendar:', calendar);
                return;
            }

            const option = document.createElement('option');
            option.value = calendar.cal_id;
            option.style.color = calendar.color.toLowerCase();
            option.textContent = calendar.name;

            if (calendar.name === "My Calendar") {
                option.selected = 1;
            }

            calendarDropdown.appendChild(option);
            console.log(`✅ Added option with color: ${calendar.color}`);
        });

        // 🔹 **Add "Add New Calendar" option**
        const addNewOption = document.createElement('option');
        addNewOption.value = "add_new_calendar";
        addNewOption.textContent = "+ Add New Calendar...";
        calendarDropdown.appendChild(addNewOption);
        console.log('✅ Added "+ Add New Calendar..." option.');

        // 🔹 **Dropdown Change Event**
        calendarDropdown.addEventListener('change', (event) => {
            const selectedOption = event.target.selectedOptions[0];
            const selectedCalendarId = selectedOption.value;
            const selectedCalendarColor = selectedOption.style.color || '';
            const selectedCalendarName = selectedOption.textContent;

            hiddenCalendarId.value = selectedCalendarId;
            hiddenCalendarColor.value = selectedCalendarColor;

            console.log(`🔄 Updated hidden fields: ID = ${selectedCalendarId}, Color = ${selectedCalendarColor}, Name = ${selectedCalendarName}`);

            if (selectedCalendarId === "add_new_calendar") {
                console.log('🆕 "Add New Calendar" option selected.');
                showAdderForm();
            }
        });

        document.getElementById('addNewCalendar').style.display = 'none';
        console.log('✅ Dropdown populated successfully.');
    } catch (error) {
        console.error('❌ Error populating dropdown:', error);
        calendarDropdown.innerHTML = '<option disabled selected>Loading calendars....</option>';
    }
}



//Populate the date fields of the add Datecycle form with the current targetDate

function populateDateFields(targetDate) {
    // Ensure targetDate is a valid Date object
    if (!(targetDate instanceof Date) || isNaN(targetDate)) {
        console.error('Invalid targetDate provided to populateDateFields.');
        return;
    }

    // Frequency dropdown
    const frequencyDropdown = document.getElementById('dateCycle-type');
    if (!frequencyDropdown) {
        console.error('Frequency dropdown element not found.');
        return;
    }

    // Clear and populate frequency options
    frequencyDropdown.innerHTML = `
        <option value="One-time">One-time</option>
        <option value="Annual">Annual</option>
    `;

    // Set default frequency to "One-time"
    frequencyDropdown.value = "One-time";

    // Day dropdown
    const dayDropdown = document.getElementById('day-field2');
    if (dayDropdown) {
        dayDropdown.value = targetDate.getDate().toString(); // Set to current day
    } else {
        console.error('Day dropdown element not found.');
    }

    // Month dropdown
    const monthDropdown = document.getElementById('month-field2');
    if (monthDropdown) {
        monthDropdown.value = (targetDate.getMonth() + 1).toString(); // Months are 0-based, so add 1
    } else {
        console.error('Month dropdown element not found.');
    }

    // Year dropdown
    const yearDropdown = document.getElementById('year-field2');
    if (yearDropdown) {
        yearDropdown.value = targetDate.getFullYear().toString(); // Set to current year
    } else {
        console.error('Year dropdown element not found.');
    }

    console.log('Date fields populated successfully.');
}



async function addNewCalendar() {
    console.log('addNewCalendar called.');

    const calendarName = document.getElementById('calendarName').value;
    const color = document.getElementById('colorPicker').value;
    const isPublic = document.getElementById('publicCalendar').checked;

    if (!calendarName || !color) {
        alert('Please provide a name and select a color for the calendar.');
        return;
    }

    const buwanaId = localStorage.getItem('buwana_id');
    if (!buwanaId) {
        alert('You must be logged in to create a calendar.');
        return;
    }

    // 🔹 Generate `created_at` timestamp in milliseconds
    const createdAt = Date.now();

    const newCalendar = {
        buwana_id: buwanaId,
        name: calendarName,
        color: color,
        public: isPublic ? 1 : 0, // Convert boolean to 1/0 for PHP
        created_at: createdAt // ✅ Pass the created_at timestamp
    };

    try {
        const response = await fetch('https://buwana.ecobricks.org/earthcal/create_calendar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCalendar)
        });

        const result = await response.json();
        console.log('Response from create_calendar API:', result);

        if (result.success) {
            alert('New calendar added successfully!');
            document.getElementById('addNewCalendar').style.display = 'none'; // Hide the form

            // Update local cache
            const userCalendars = JSON.parse(localStorage.getItem('userCalendars') || '[]');
            userCalendars.push({
                id: result.calendar_id,
                name: calendarName,
                color: color,
                public: isPublic,
                created_at: createdAt // ✅ Store created_at locally
            });
            localStorage.setItem('userCalendars', JSON.stringify(userCalendars));

            // Re-populate the dropdown with the updated list
            populateCalendarDropdown(buwanaId);
        } else {
            throw new Error(result.message || 'Failed to add new calendar.');
        }
    } catch (error) {
        console.error('Error creating new calendar:', error);
        alert('An error occurred while adding the calendar. Please try again later.');
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


async function highlightDateCycles(targetDate) {
    // Ensure targetDate is a Date object.
    const targetDateObj = new Date(targetDate);
    const formattedTargetDate = `-${targetDateObj.getDate()}-${targetDateObj.getMonth() + 1}-${targetDateObj.getFullYear()}`;
    const formattedTargetDateAnnual = `-${targetDateObj.getDate()}-${targetDateObj.getMonth() + 1}-`; // No year for annual events

    // Remove "date_event" class from previously highlighted elements.
    const elementsWithDateEvent = Array.from(document.querySelectorAll("div.date_event, path.date_event"));
    elementsWithDateEvent.forEach(element => element.classList.remove("date_event"));

    // 🔹 Fetch all dateCycles from storage or API
    const dateCycleEvents = await fetchDateCycleCalendars(); // <-- Ensure we await the result

    // 🔹 Ensure we have an array before proceeding
    if (!Array.isArray(dateCycleEvents) || dateCycleEvents.length === 0) {
        console.warn("⚠️ Highlighter: No dateCycles found in storage.");
        updateDateCycleCount(0, 0); // No events, reset count display
        return;
    }

    console.log(`✅ Retrieved ${dateCycleEvents.length} dateCycles from storage.`);

    // Separate matching dateCycles based on the target date and pin status.
    let matchingPinned = [];
    let matchingCurrent = [];
    const now = new Date();

    function wasEditedRecently(dateCycle) {
        const lastEdited = new Date(dateCycle.last_edited);
        return (now - lastEdited) < 60000; // Edited within the last 60 seconds
    }

    dateCycleEvents.forEach(dateCycle => {
        const storedDateFormatted = `-${dateCycle.day}-${dateCycle.month}-${dateCycle.year}`;
        const storedDateFormattedAnnual = `-${dateCycle.day}-${dateCycle.month}-`;

        if (
            storedDateFormatted === formattedTargetDate ||
            (dateCycle.frequency && dateCycle.frequency.toLowerCase() === "annual" && storedDateFormattedAnnual === formattedTargetDateAnnual)
        ) {
            // 🔹 Convert pinned to a string before checking
            if (String(dateCycle.pinned) === "1") {
                matchingPinned.push(dateCycle);
            } else {
                matchingCurrent.push(dateCycle);
            }
        }
    });

    console.log(`📌 Found ${matchingPinned.length} pinned and ${matchingCurrent.length} current dateCycles for target date.`);

    // Get the container elements.
    const pinnedDiv = document.getElementById('pinned-datecycles');
    const currentDiv = document.getElementById('current-datecycles');

    // Clear out previous contents.
    if (pinnedDiv) {
        pinnedDiv.innerHTML = "";
        pinnedDiv.style.display = matchingPinned.length ? 'block' : 'none';
    }
    if (currentDiv) {
        currentDiv.innerHTML = "";
        currentDiv.style.display = matchingCurrent.length ? 'block' : 'none';
    }

    // Write matching pinned dateCycles.
    matchingPinned.forEach(dc => {
        if (pinnedDiv) {
            writeMatchingDateCycles(pinnedDiv, dc);
            if (wasEditedRecently(dc)) {
                const elem = pinnedDiv.querySelector(`.date-info[data-key="${dc.unique_key}"]`);
                if (elem) {
                    elem.classList.add("slide-in-left");
                    setTimeout(() => {
                        elem.classList.remove("slide-in-left");
                    }, 500);
                }
            }
        }
    });

    // Write matching current dateCycles.
    matchingCurrent.forEach(dc => {
        if (currentDiv) {
            writeMatchingDateCycles(currentDiv, dc);
            if (wasEditedRecently(dc)) {
                const elem = currentDiv.querySelector(`.date-info[data-key="${dc.unique_key}"]`);
                if (elem) {
                    elem.classList.add("slide-in-left");
                    setTimeout(() => {
                        elem.classList.remove("slide-in-left");
                    }, 500);
                }
            }
        }
    });

    // Update the event count display
    updateDateCycleCount(matchingPinned.length, matchingCurrent.length);

    // Highlight corresponding date paths ending with "-day-marker"
    dateCycleEvents.forEach(dc => {
        const formatted = `-${dc.day}-${dc.month}-${dc.year}`;
        const formattedAnnual = `-${dc.day}-${dc.month}-`; // For annual events

        let matchingPaths;

        if (dc.frequency && dc.frequency.toLowerCase() === "annual") {
            matchingPaths = document.querySelectorAll(`path[id*="${formattedAnnual}"]`);
        } else {
            matchingPaths = document.querySelectorAll(`path[id*="${formatted}"]`);
        }

        matchingPaths.forEach(path => {
            if (path.id.endsWith("-day-marker")) {
                path.classList.add("date_event");
            }
        });
    });
}



// Function to toggle visibility of the date cycle details
function toggleDateCycleView() {
    const allPinnedDateCyclesDiv = document.getElementById("all-pinned-datecycles");
    const allCurrentDateCyclesDiv = document.getElementById("all-current-datecycles");
    const eyeIcon = document.getElementById("eye-icon");

    if (!allPinnedDateCyclesDiv || !allCurrentDateCyclesDiv || !eyeIcon) return;

    const isVisible = allCurrentDateCyclesDiv.style.display !== "none";

    if (isVisible) {
        allCurrentDateCyclesDiv.style.display = "none";
        allPinnedDateCyclesDiv.style.display = "none";
        eyeIcon.classList.remove("eye-open");
        eyeIcon.classList.add("eye-closed");
    } else {
        allCurrentDateCyclesDiv.style.display = "block";
        allPinnedDateCyclesDiv.style.display = "block";
        eyeIcon.classList.remove("eye-closed");
        eyeIcon.classList.add("eye-open");
    }
}

// Ensure event listener is attached after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const dateCycleCountBox = document.getElementById("date-cycle-count-box");
    if (dateCycleCountBox) {
        dateCycleCountBox.addEventListener("click", toggleDateCycleView);
    }
});


function updateDateCycleCount(pinnedCount, currentCount) {
    const dateCycleCountBox = document.getElementById("date-cycle-count-box");
    const currentDatecycleCount = document.getElementById("current-datecycle-count");
    const eyeIcon = document.getElementById("eye-icon");

    if (!currentDatecycleCount || !dateCycleCountBox || !eyeIcon) return;

    if (pinnedCount === 0 && currentCount === 0) {
        // No date cycles - hide the entire box
        dateCycleCountBox.style.display = "none";
    } else {
        // Show the box and update content
        dateCycleCountBox.style.display = "flex";
        eyeIcon.classList.add("eye-open");
        eyeIcon.classList.remove("eye-closed");

        let message = "Today: ";
        if (pinnedCount > 0 && currentCount > 0) {
            message += `${pinnedCount} pinned and ${currentCount} current dateCycles.`;
        } else if (pinnedCount > 0) {
            message += `${pinnedCount} pinned dateCycles.`;
        } else {
            message += `${currentCount} current dateCycles.`;
        }

        // Update text without the red triangles
        currentDatecycleCount.innerHTML = `${message}`;
    }
}



function mapColor(colorName) {
    const colorMap = {
        blue: "var(--blue)",
        yellow: "var(--yellow)",
        green: "var(--green)",
        red: "var(--red)",
        orange: "var(--orange)"
    };
    return colorMap[colorName?.toLowerCase()] || colorName || "#000";
}




// Function to write date cycles and update the count
function writeMatchingDateCycles(divElement, dateCycle) {
    window.dateCycleCount = (window.dateCycleCount || 0) + 1; // Initialize and increment count

    const eventName = dateCycle.title || "Untitled Event";
    const bulletColor = mapColor(dateCycle.datecycle_color);
    const calendarColor = mapColor(dateCycle.cal_color);

    const eventNameStyle = Number(dateCycle.completed) === 1
        ? "text-decoration: line-through; color: grey;"
        : `color: ${bulletColor}`;

    const isPublic = String(dateCycle.public) === "1";
    const hideButtonsStyle = isPublic ? "display: none;" : "display: flex;";
    const contentOnclick = isPublic ? "" : `onclick="editDateCycle('${dateCycle.unique_key}')"`;

    // Use date_emoji or default to ⬤
    const dateEmoji = dateCycle.date_emoji || '⬤';
    // Use cal_emoji or default to 🗓️
    const calendarEmoji = dateCycle.cal_emoji || '🗓️';

    divElement.innerHTML += `
        <div class="date-info" data-key="${dateCycle.unique_key}" style="
            display: flex;
            align-items: center;
            padding: 16px;
            border: 1px solid grey;
            margin-bottom: 10px;
            border-radius: 8px;
            position: relative;
            min-height: 75px;
            direction: ltr;">
            
            <!-- Bullet Column -->
            <div class="bullet-column" style="max-width: 12px; margin-right: 12px; margin-bottom: auto; margin-left: -8px;">
                ${isPublic ?
        `<span title="This dateCycle is public and cannot be pinned" style="font-size: 1.2em;">${dateEmoji}</span>` :
        `<button class="bullet-pin-button"
                        role="button"
                        aria-label="${dateCycle.pinned === '1' ? 'Unpin this dateCycle' : 'Pin this DateCycle'}"
                        title="${dateCycle.pinned === '1' ? 'Unpin this!' : 'Pin this!'}"
                        onclick="pinThisDatecycle('${dateCycle.unique_key}'); event.stopPropagation();"
                        onmouseover="this.textContent = '${dateCycle.pinned === '1' ? '↗️' : '📌'}';"
                        onmouseout="this.textContent = '${dateCycle.pinned === '1' ? '📌' : '⬤'}';"
                        style="font-size: 0.8em; margin: 0; border: none; background: none; cursor: pointer; color: ${bulletColor};">
                        ${dateCycle.pinned === '1' ? '📌' : '⬤'}
                    </button>`
    }
            </div>

            <!-- Date Cycle Content -->
            <div class="datecycle-content" ${contentOnclick} style="flex-grow: 1; cursor: pointer; margin-bottom: auto;">
                <div class="current-date-info-title" style="${eventNameStyle}">
                    ${eventName}
                </div>
                <div class="current-datecycle-data">
                    <div class="current-date-calendar" style="color: ${calendarColor};">
                        ${calendarEmoji} ${dateCycle.cal_name}
                    </div>
                </div>
                <div class="current-date-notes" style="height: fit-content; max-width:300px;">
                    ${dateCycle.comments}
                </div>
            </div>

            <!-- Action Buttons -->
            <div id="non-public-actions" style="${hideButtonsStyle}
                position: absolute;
                top: 10px;
                right: 8px;
                flex-direction: column;
                align-items: center;
                gap: 2px;">
                
                <!-- Delete Button -->
                <button class="delete-button-datecycle"
                    role="button"
                    aria-label="Delete this event"
                    title="Delete this event"
                    onclick="deleteDateCycle('${dateCycle.unique_key}'); event.stopPropagation();"
                    style="font-size: 1.8em; cursor: pointer; background: none; border: none; font-weight: bold;">
                    ×
                </button>

                <button class="forward-button-datecycle"
                    role="button"
                    aria-label="Push to today"
                    title="Push to today"
                    onclick="push2today('${dateCycle.unique_key}'); event.stopPropagation();"
                    style="font-size: larger; cursor: pointer; background: none; border: none;">
                    ➜
                </button>
                <button class="close-button-datecycle"
                    role="button"
                    aria-label="Toggle completion status"
                    title="Toggle completion"
                    onclick="checkOffDatecycle('${dateCycle.unique_key}'); event.stopPropagation();"
                    style="font-size: larger; cursor: pointer; background: none; border: none; ${dateCycle.completed === '1' ? 'color: black;' : ''}">
                    ✔
                </button>
            </div>
        </div>
    `;
}






//This is for clicks on the event count text to show or hide the datecycle view

function initializeToggleListener() {
    const currentDayInfoDiv = document.getElementById('current-day-info');
    const pinnedDiv = document.getElementById('pinned-datecycles');
    const matchingDiv = document.getElementById('current-datecycles');

    if (currentDayInfoDiv && pinnedDiv && matchingDiv) {
        currentDayInfoDiv.addEventListener('click', () => {
            const isPinnedVisible = pinnedDiv.style.display === 'block';
            const isMatchingVisible = matchingDiv.style.display === 'block';

            // Toggle visibility
            pinnedDiv.style.display = isPinnedVisible ? 'none' : 'block';
            matchingDiv.style.display = isMatchingVisible ? 'none' : 'block';

            // Update the label to show or hide
            const totalEvents = matchingDiv.children.length + (pinnedDiv.style.display === 'block' ? pinnedDiv.children.length : 0);
            const actionLabel = (pinnedDiv.style.display === 'block' && matchingDiv.style.display === 'block') ? '' : '👁';

            currentDayInfoDiv.innerText = `${actionLabel} ${totalEvents} events today`;
        });
    }
}






////////////////////////////////////


/* DATECYCLE ACTIONS


////////////////////////////////////
 */



async function updateServerDateCycle(dateCycle) {
    // Send the updated dateCycle object to the server endpoint
    const response = await fetch('https://buwana.ecobricks.org/earthcal/update_datecycle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateCycle)
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update dateCycle on server.');
    }
    return data;
}




function checkOffDatecycle(uniqueKey) {
    console.log(`Toggling completion for dateCycle with unique_key: ${uniqueKey}`);

    // Step 1: Retrieve all calendar keys from localStorage.
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    let found = false;

    // Step 2: Iterate through calendar arrays to find and update the dateCycle by unique_key.
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');
        const dateCycleIndex = calendarData.findIndex(dc => dc.unique_key === uniqueKey);

        if (dateCycleIndex !== -1) {
            let dateCycle = calendarData[dateCycleIndex];

            // Step 3: Toggle the 'completed' status.
            const wasCompleted = dateCycle.completed === '1'; // Track the previous state
            dateCycle.completed = wasCompleted ? '0' : '1'; // Toggle
            console.log(`New completion status for ${dateCycle.title}: ${dateCycle.completed}`);

            // Step 4: Mark as unsynced if previously synced.
            if (dateCycle.synced === '1') {
                dateCycle.synced = '0';
            }

            // Step 5: Attempt to update the server immediately if online.
            if (navigator.onLine && localStorage.getItem('buwana_id')) {
                updateServerDateCycle(dateCycle)
                    .then(() => {
                        console.log(`Server successfully updated for ${dateCycle.title}`);
                        dateCycle.synced = '1';
                        calendarData[dateCycleIndex] = dateCycle;
                        localStorage.setItem(key, JSON.stringify(calendarData));
                    })
                    .catch(error => {
                        console.error(`Error updating server for ${dateCycle.title}:`, error);
                    });
            } else {
                console.log("Offline or not logged in – update queued for next sync.");
            }

            // Step 6: Update localStorage with modified calendar data.
            calendarData[dateCycleIndex] = dateCycle;
            localStorage.setItem(key, JSON.stringify(calendarData));

            // Step 7: Handle animation and UI refresh.
            const dateCycleDiv = document.querySelector(`.date-info[data-key="${uniqueKey}"]`);

            if (!wasCompleted && dateCycleDiv) {
                // If marking as completed, trigger celebration and delay UI refresh
                dateCycleDiv.classList.add("celebrate-animation");

                setTimeout(() => {
                    dateCycleDiv.classList.remove("celebrate-animation");
                    highlightDateCycles(targetDate); // Refresh UI after animation
                }, 500);
            } else {
                // If marking as incomplete, refresh UI immediately
                highlightDateCycles(targetDate);
            }

            found = true;
            break;
        }
    }

    // Step 8: Handle case where no dateCycle was found.
    if (!found) {
        console.log(`No dateCycle found with unique_key: ${uniqueKey}`);
    }
}




function pinThisDatecycle(uniqueKey) {
    console.log(`Toggling pin status for dateCycle with unique_key: ${uniqueKey}`);

    // Step 1: Retrieve all calendar keys from localStorage.
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    let found = false;

    // Step 2: Iterate through calendar arrays to find and update the dateCycle by unique_key.
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');
        const dateCycleIndex = calendarData.findIndex(dc => dc.unique_key === uniqueKey);

        if (dateCycleIndex !== -1) {
            let dateCycle = calendarData[dateCycleIndex];

            // Step 3: Toggle the 'pinned' status.
            dateCycle.pinned = dateCycle.pinned === '1' ? '0' : '1';
            console.log(`New pin status for ${dateCycle.title}: ${dateCycle.pinned}`);

            // Step 4: Mark as unsynced if previously synced.
            if (dateCycle.synced === '1') {
                dateCycle.synced = '0';
            }

            // Step 5: Attempt to update the server immediately if online.
            if (navigator.onLine && localStorage.getItem('buwana_id')) {
                updateServerDateCycle(dateCycle)
                    .then(() => {
                        console.log(`Server successfully updated for ${dateCycle.title}`);
                        dateCycle.synced = '1';
                        calendarData[dateCycleIndex] = dateCycle;
                        localStorage.setItem(key, JSON.stringify(calendarData));
                    })
                    .catch(error => {
                        console.error(`Error updating server for ${dateCycle.title}:`, error);
                    });
            } else {
                console.log("Offline or not logged in – update queued for next sync.");
            }

            // Step 6: Update localStorage with modified calendar data.
            calendarData[dateCycleIndex] = dateCycle;
            localStorage.setItem(key, JSON.stringify(calendarData));

            // Step 7: Handle animation and UI refresh.
            const dateCycleDiv = document.querySelector(`.date-info[data-key="${uniqueKey}"]`);

            if (dateCycle.pinned === "1" && dateCycleDiv) {
                dateCycleDiv.classList.add("slide-out-right");
                setTimeout(() => {
                    highlightDateCycles(targetDate);
                }, 400);
            } else {
                highlightDateCycles(targetDate);
            }

            found = true;
            break;
        }
    }

    // Step 8: Handle case where no dateCycle was found.
    if (!found) {
        console.log(`No dateCycle found with unique_key: ${uniqueKey}`);
    }
}






function editDateCycle(uniqueKey) {
    // Step 1: Fetch all calendar keys from localStorage.
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));

    let dateCycle = null;
    let calendarKey = null;

    // Step 2: Search through each calendar for the matching dateCycle by unique_key.
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');
        dateCycle = calendarData.find(dc => dc.unique_key === uniqueKey);
        if (dateCycle) {
            calendarKey = key; // Save the calendar key where the dateCycle was found.
            break; // Exit loop once the matching dateCycle is found.
        }
    }

    // Step 3: Handle case where the dateCycle is not found.
    if (!dateCycle) {
        console.log(`No dateCycle found with unique_key: ${uniqueKey}`);
        return;
    }

    // Step 4: Populate the modal with the dateCycle details using the new schema.
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div id="edit-datecycle-setter" style="width:100%; text-align:center; color:var(--text-color)">
            <h1>Edit DateCycle</h1>
        </div>

        <select id="edit-dateCycle-type" class="blur-form-field" style="font-size:1em; text-align:center; height:45px; margin:auto; margin-bottom:10px; width:100%;" onchange="showYearMonthDaySetter()">
            <option value="" disabled>Select frequency...</option>
            <option value="One-time" ${dateCycle.frequency === 'One-time' ? 'selected' : ''}>One-time</option>
            <option value="Annual" ${dateCycle.frequency === 'Annual' ? 'selected' : ''}>Annual</option>
            <option value="Weekly" disabled>Weekly</option>
            <option value="Monthly" disabled>Monthly</option>
        </select>

        <div id="edit-dateCycle-year-option">
            <select name="year" id="edit-year-field2" style="width:100%; font-size:1em; text-align:center; height:45px; margin-top:10px;" class="blur-form-field">
                <option value="" disabled>Select year...</option>
                ${[2025, 2026, 2027, 2028].map(year => `<option value="${year}" ${Number(dateCycle.year) === year ? 'selected' : ''}>${year}</option>`).join('')}
            </select>
        </div>

        <div id="edit-set-date">
            <div class="date-search fields" style="display:flex; flex-flow:row; margin:auto; justify-content:center;">
                <select name="day" id="edit-day-field2" style="width:22%; margin-right:10px; font-size:1em; text-align:center; height:45px;" class="blur-form-field">
                    <option value="" disabled>Select day...</option>
                    ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${Number(dateCycle.day) === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}
                </select>
                <select name="month" id="edit-month-field2" style="font-size:1em; text-align:center; height:45px;" class="blur-form-field">
                    <option value="" disabled>Select month...</option>
                    ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        .map((month, i) => `<option value="${i + 1}" ${Number(dateCycle.month) === i + 1 ? 'selected' : ''}>${month}</option>`).join('')}
                </select>
            </div>

            <div id="edit-name-event" style="margin-top:0; display:flex; justify-content:center; border-radius:10px; width:100%;">
                <textarea id="edit-add-date-title" class="blur-form-field" placeholder="Event name..." style="margin-left:0; margin-right:auto; border-radius:10px 0 0 10px; width:calc(100% - 80px);">${dateCycle.title || ''}
                </textarea>
                <select id="edit-DateColorPicker" class="blur-form-field" name="color" style="padding:10px; border-radius:0 10px 10px 0; font-size:1.5em; width:60px; margin-left:-40px; margin-right:0;">
                    <option value="green" ${dateCycle.datecycle_color === 'green' ? 'selected' : ''}>🟢</option>
                    <option value="yellow" ${dateCycle.datecycle_color === 'yellow' ? 'selected' : ''}>🟡</option>
                    <option value="orange" ${dateCycle.datecycle_color === 'orange' ? 'selected' : ''}>🟠</option>
                    <option value="red" ${dateCycle.datecycle_color === 'red' ? 'selected' : ''}>🔴</option>
                    <option value="blue" ${dateCycle.datecycle_color === 'blue' ? 'selected' : ''}>🔵</option>
                </select>
            </div>

            <div id="edit-add-note-form" style="margin-top:0; margin-bottom:0;">
                <textarea id="edit-add-date-note" class="blur-form-field" style="width:calc(100% - 10px); padding-right:0;" placeholder="Add a note to this event...">${dateCycle.comments || ''}</textarea>
            </div>
            <button type="button" id="edit-confirm-dateCycle" class="confirmation-blur-button enabled" style="margin-bottom: 14px; width:100%;" onclick="saveDateCycleEditedChanges('${uniqueKey}', '${calendarKey}')">
                🐿️ Save Changes
            </button>
            <button type="button" class="confirmation-blur-button" style="width:100%;" onclick="shareDateCycle('${uniqueKey}')">
    🔗 Share Event
            </button>

        </div>
    `;

    // Step 5: Show the modal.
    const modal = document.getElementById('form-modal-message');
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    document.getElementById("page-content").classList.add("blur");
}






function saveDateCycleEditedChanges(uniqueKey, calendarKey) {
    // Step 1: Retrieve updated values from the edit form.
    const frequency = document.getElementById('edit-dateCycle-type').value;
    const yearField = document.getElementById('edit-year-field2').value;
    const dayField = document.getElementById('edit-day-field2').value;
    const monthField = document.getElementById('edit-month-field2').value;
    const title = document.getElementById('edit-add-date-title').value.trim();
    const eventColor = document.getElementById('edit-DateColorPicker').value;
    const comments = document.getElementById('edit-add-date-note').value.trim();

    // Update the last_edited field to now.
    const now = new Date();
    const lastEdited = now.toISOString();

    // Construct the date string in "YYYY-MM-DD" format.
    const formattedDate = `${yearField}-${monthField}-${dayField}`;

    // Step 2: Retrieve the calendar's data from localStorage using calendarKey.
    let calendarData = JSON.parse(localStorage.getItem(calendarKey) || '[]');

    // Step 3: Find the dateCycle in the calendar data by unique_key.
    const index = calendarData.findIndex(dc => dc.unique_key === uniqueKey);
    if (index === -1) {
        alert("Could not find the dateCycle to update.");
        return;
    }

    // Step 4: Update the dateCycle object with the new values.
    let dateCycle = calendarData[index];
    dateCycle.frequency = frequency;
    dateCycle.year = yearField;
    dateCycle.day = dayField;
    dateCycle.month = monthField;
    dateCycle.date = formattedDate;
    dateCycle.title = title;
    dateCycle.datecycle_color = eventColor; // Update the calendar color.
    dateCycle.comments = comments;
    dateCycle.last_edited = lastEdited;

    // Mark the record as unsynced so it will be sent to the server.
    dateCycle.synced = "0";

    // Step 5: Save the updated calendar data back to localStorage.
    calendarData[index] = dateCycle;
    localStorage.setItem(calendarKey, JSON.stringify(calendarData));

    // Step 6: Attempt to update the server immediately if online.
    if (navigator.onLine && localStorage.getItem('buwana_id')) {
        updateServerDateCycle(dateCycle)
            .then(() => {
                console.log(`Server updated for edited dateCycle: ${dateCycle.title}`);
                dateCycle.synced = "1";
                // Save updated sync status.
                calendarData[index] = dateCycle;
                localStorage.setItem(calendarKey, JSON.stringify(calendarData));
            })
            .catch(error => {
                console.error(`Error updating server for edited dateCycle: ${dateCycle.title}`, error);
            });
    } else {
        console.log("Offline or not logged in – update queued for next sync.");
    }

    // Step 7: Hide the edit modal and remove the page blur.
    const modal = document.getElementById('form-modal-message');
    modal.classList.remove('modal-visible');
    modal.classList.add('modal-hidden');
    document.getElementById("page-content").classList.remove("blur");

    // Step 8: Refresh the UI.
    // Assumes that targetDate is defined globally or accessible here.
    highlightDateCycles(targetDate);
}



function shareDateCycle(uniqueKey) {
    const frequency = document.getElementById('edit-dateCycle-type').value;
    const year = document.getElementById('edit-year-field2').value;
    const month = document.getElementById('edit-month-field2').value;
    const day = document.getElementById('edit-day-field2').value;
    const title = encodeURIComponent(document.getElementById('edit-add-date-title').value.trim());
    const color = document.getElementById('edit-DateColorPicker').value;
    const note = encodeURIComponent(document.getElementById('edit-add-date-note').value.trim());

    const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const sharer = (window.userProfile?.first_name || "An Earthcal user").trim();
    const encodedSharer = encodeURIComponent(sharer);

    const url = `https://cycles.earthen.io/share.html?action=add-event&f=${frequency}&date=${date}&t=${title}&c=${color}&n=${note}&id=${uniqueKey}&from=${encodedSharer}`;

    navigator.clipboard.writeText(url).then(() => {
        alert("Shareable event link copied to clipboard!");
    });
}




function push2today(uniqueKey) {
    console.log(`Pushing dateCycle with unique_key: ${uniqueKey} to today`);

    // Retrieve all calendar keys from localStorage.
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    let found = false;

    for (const key of calendarKeys) {
        let calendarData = JSON.parse(localStorage.getItem(key) || '[]');
        const index = calendarData.findIndex(dc => dc.unique_key === uniqueKey);

        if (index !== -1) {
            let dateCycle = calendarData[index];
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

            // Update the date fields
            dateCycle.day = currentDate.getDate();
            dateCycle.month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
            dateCycle.year = currentDate.getFullYear();
            dateCycle.date = formattedDate;
            dateCycle.last_edited = currentDate.toISOString();

            // Ensure pinned is set to "0" if not defined.
            if (!dateCycle.pinned) {
                dateCycle.pinned = '0';
            }

            // Mark as unsynced if previously synced
            if (dateCycle.synced === "1") {
                dateCycle.synced = "0";
            }

            // Attempt to update the server immediately if online.
            if (navigator.onLine && localStorage.getItem('buwana_id')) {
                updateServerDateCycle(dateCycle)
                    .then(() => {
                        console.log(`Server successfully updated for ${dateCycle.title}`);
                        dateCycle.synced = "1"; // Mark as synced
                        calendarData[index] = dateCycle;
                        localStorage.setItem(key, JSON.stringify(calendarData));
                    })
                    .catch(error => {
                        console.error(`Error updating server for ${dateCycle.title}:`, error);
                    });
            } else {
                console.log("Offline or not logged in – update queued for next sync.");
            }

            // Update localStorage with modified calendar data.
            calendarData[index] = dateCycle;
            localStorage.setItem(key, JSON.stringify(calendarData));

            // Handle animation and UI refresh.
            const dateCycleDiv = document.querySelector(`.date-info[data-key="${uniqueKey}"]`);
            if (dateCycleDiv) {
                dateCycleDiv.classList.add("slide-out-right");

                setTimeout(() => {
                    dateCycleDiv.classList.remove("slide-out-right");
                    highlightDateCycles(targetDate); // Refresh UI
                }, 400);
            } else {
                highlightDateCycles(targetDate); // Ensure UI updates even if no div found
            }

            found = true;
            break;
        }
    }

    if (!found) {
        console.log(`No dateCycle found with unique_key: ${uniqueKey}`);
    }
}




async function deleteDateCycle(uniqueKey) {
    console.log(`deleteDateCycle called for unique_key: ${uniqueKey}`);

    // Step 1: Retrieve all calendar keys from localStorage.
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    if (calendarKeys.length === 0) {
        console.log("No calendar data found in storage.");
        return;
    }

    // Confirm with the user.
    const userResponse = confirm('Are you sure you want to delete this event?');
    if (!userResponse) return; // Exit if the user cancels.

    let found = false;
    let dateCycle = null;
    let calendarKey = null;

    // Step 2: Find the dateCycle in localStorage using unique_key.
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');
        const dateCycleIndex = calendarData.findIndex(dc => dc.unique_key === uniqueKey);

        if (dateCycleIndex !== -1) {
            dateCycle = calendarData[dateCycleIndex];
            // Mark for deletion: if online, set delete_it to "1"; if offline, mark it as "pending".
            dateCycle.delete_it = navigator.onLine ? "1" : "pending";
            calendarKey = key;

            if (!navigator.onLine) {
                dateCycle.synced = "0";
            }


            // If online, remove the record immediately; if offline, leave it marked for deletion.
            if (navigator.onLine) {
                calendarData.splice(dateCycleIndex, 1);
            } else {
                calendarData[dateCycleIndex] = dateCycle;
            }

            localStorage.setItem(key, JSON.stringify(calendarData));
            console.log(`Updated dateCycle with unique_key: ${uniqueKey} in calendar: ${key}`);
            found = true;
            break; // Exit loop once found.
        }
    }

    // Step 3: Handle case where the dateCycle was not found.
    if (!found) {
        console.log(`No dateCycle found with unique_key: ${uniqueKey}`);
        return;
    }

    // Step 4: If online, attempt to delete the record from the server.
    if (navigator.onLine && dateCycle) {
        const buwanaId = localStorage.getItem('buwana_id');
        if (!buwanaId) {
            console.log('User is not logged in. Cannot delete server data.');
        } else {
            try {
                const response = await fetch('https://buwana.ecobricks.org/earthcal/delete_datecycle.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        buwana_id: buwanaId,
                        unique_key: uniqueKey // Use unique_key instead of the old ID.
                    })
                });

                const result = await response.json();
                console.log('Server response for deletion:', result);

                if (!result.success) {
                    console.error('Failed to delete dateCycle from server:', result.message);
                    alert('Server deletion failed. It will be retried during the next sync.');
                } else {
                    console.log(`DateCycle with unique_key: ${uniqueKey} deleted from the server.`);
                }
            } catch (error) {
                console.error('Error deleting dateCycle from the server:', error);
                alert('An error occurred while deleting from the server. It will be retried during the next sync.');
            }
        }
    }

    // Step 5: Refresh the UI.
    setTimeout(() => {
        // After animation completes (0.4s), refresh the UI.
        highlightDateCycles(targetDate);
    }, 500);

    // (Optional) Log the final state of localStorage for debugging.
    console.log(`Final state of localStorage after deletion:`);
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('calendar_')) {
            console.log(`Key: ${key}, Value:`, JSON.parse(localStorage.getItem(key)));
        }
    });
}








///////////////////////////////////


/* FORM FUNCTIONS


/////////////////////////////////////////
 */



// Function to show the add-note-check-boxed div and confirm-dateCycle button
function showAddNoteCheckbox() {
    const addDateTitleTextarea = document.getElementById('add-date-title');
    const addNoteCheckboxDiv = document.getElementById('add-note-check-boxed');
    const confirmDateCycleButton = document.getElementById('confirm-dateCycle-button');

    if (addDateTitleTextarea.value.trim() !== '') {
        addNoteCheckboxDiv.style.display = 'block';
        confirmDateCycleButton.style.display = 'block';
    } else {
        addNoteCheckboxDiv.style.display = 'none';
        confirmDateCycleButton.style.display = 'none';
    }
}



// Function to show/hide the add-note-form based on add-note-checkbox
function toggleAddNoteForm() {
    const addNoteCheckbox = document.getElementById('add-note-checkbox');
    const addNoteForm = document.getElementById('add-note-form');

    if (addNoteCheckbox.checked) {
        addNoteForm.style.display = 'block';
    } else {
        addNoteForm.style.display = 'none';
    }
}

// Attach event listeners to call the functions when needed
document.getElementById('add-date-title').addEventListener('input', showAddNoteCheckbox);
document.getElementById('add-note-checkbox').addEventListener('change', toggleAddNoteForm);



function showYearMonthDaySetter() {
    let dateCycleType = document.getElementById("dateCycle-type").value;
    let setDateDiv = document.getElementById("set-date");
    let dateCycleYearOptionDiv = document.getElementById("dateCycle-year-option");
    let dateCycleName = document.getElementById("name-event");

    document.getElementById('add-date-title').style.display = 'unset';


    // Show/hide divs based on selected date cycle type
    if (dateCycleType === "Annual") {
        setDateDiv.style.display = "block";
        dateCycleYearOptionDiv.style.display = "none";
        dateCycleName.style.display = "block";

    } else if (dateCycleType === "One-time") {
        setDateDiv.style.display = "block";
        dateCycleYearOptionDiv.style.display = "block";
        dateCycleName.style.display = "block";

    }

    // Set the year, month, and day fields using the global variable targetDate
    document.getElementById("year-field2").value = targetDate.getFullYear();
    document.getElementById("month-field2").value = targetDate.getMonth() + 1; // Months are 0-indexed in JavaScript
    document.getElementById("day-field2").value = targetDate.getDate();
}


// Loading the userCalendars from local storage or setting a default value.
function loadUserCalendars() {
    const calendarsString = localStorage.getItem('userCalendars');
    if (!calendarsString) return [];
    return JSON.parse(calendarsString);
}

let userCalendars = loadUserCalendars();

// Function to show the calendar addition form.
function showAdderForm() {
    const calendarForm = document.getElementById('addNewCalendar');
    calendarForm.style.display = "block";
}



// Function to delete the selected userCalendar and associated dateCycles
function deleteSelectedCalendar() {
    const selectedCalendarId = document.getElementById('calendarToDelete').value;

    // Load userCalendars and dateCycles from localStorage
    const userCalendars = JSON.parse(localStorage.getItem('userCalendars')) || [];
    const dateCycles = JSON.parse(localStorage.getItem('dateCycles')) || [];

    // Filter out the selected calendar
    const updatedCalendars = userCalendars.filter(calendar => calendar.id !== selectedCalendarId);
    localStorage.setItem('userCalendars', JSON.stringify(updatedCalendars));

    // Filter out dateCycles associated with the selected calendar
    const updatedDateCycles = dateCycles.filter(dateCycle => dateCycle.calendar !== selectedCalendarId);
    localStorage.setItem('dateCycles', JSON.stringify(updatedDateCycles));

    alert("Calendar and associated date cycles deleted successfully!");

    // Refresh the dropdown
    populateCalendarDropdown();
    //populateDropdown();
}



///////////////////////

/* EXPORT FUNCTIONS


/////////////////////////////////
 */

// Function to open the export-import div and hide the export-down-arrow
function openDateCycleExports() {
    const exportDownArrow = document.getElementById('export-down-arrow');
    const exportImportDiv = document.getElementById('export-import');
    const exportUpArrow = document.getElementById('export-up-arrow');

    // Hide the down arrow and show the export-import div
    exportDownArrow.style.display = 'none';
    exportImportDiv.style.display = 'block';

    // Animate the increase in size of the export-import div
    exportImportDiv.style.animation = 'expand 1s';

    // Show the up arrow
    exportUpArrow.style.display = 'block';
}

// Function to close and reset the export-import div
function closeDateCycleExports() {
    const exportDownArrow = document.getElementById('export-down-arrow');
    const exportImportDiv = document.getElementById('export-import');
    const exportUpArrow = document.getElementById('export-up-arrow');

    // Hide the up arrow and reset the export-import div
    //exportUpArrow.style.display = 'none';
    //exportImportDiv.style.animation = 'none';

    // Show the down arrow and hide the export-import div
    //exportDownArrow.style.display = 'block';
    //exportImportDiv.style.display = 'none';
}






function uploadDateCycles() {
    const fileInput = document.getElementById('jsonUpload');

    if (fileInput.files.length === 0) {
        alert('Please select a JSON file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const jsonString = event.target.result;
        try {
            const dateCycles = JSON.parse(jsonString);
            if (Array.isArray(dateCycles)) {
                // Store dateCycles in browser's cache or any desired storage
                localStorage.setItem('dateCycles', JSON.stringify(dateCycles));
                alert('DateCycles uploaded and stored.');
            } else {
                alert('Uploaded JSON does not contain valid dateCycles.');
            }
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };

    reader.readAsText(file);
    fetchDateCycles()
}


//Download Datecycles

function downloadDateCycles() {
    // Fetch dateCycles from localStorage
    const dateCyclesString = localStorage.getItem('dateCycles');

    if (!dateCyclesString) {
        alert('No dateCycles found in cache to download.');
        return;
    }

    // Convert the dateCycles string to a Blob
    const blob = new Blob([dateCyclesString], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary <a> element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dateCycles.json'; // Filename to download
    document.body.appendChild(a); // Append to the document
    a.click(); // Trigger download

    // Clean up by revoking the Blob URL and removing the <a> element
    URL.revokeObjectURL(url);
    a.remove();
}



function clearAllDateCycles() {
    // Step 1: Collect all relevant keys for removal
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    const additionalKeys = ['tourToken', 'earthenRegistration', 'userCalendars']; // Add any additional keys here
    const allKeys = [...calendarKeys, ...additionalKeys];

    // Step 2: Check if there is any data to clear
    if (allKeys.length > 0) {
        // Ask the user for confirmation
        const userConfirmed = confirm('Are you certain you want to delete all your EarthCal data? This can\'t be undone!');

        if (userConfirmed) {
            // Step 3: Remove all collected keys from localStorage
            allKeys.forEach(key => localStorage.removeItem(key));

            alert('All EarthCal data has been cleared from storage.');
        } else {
            alert('Deletion cancelled. Your EarthCal data and settings are safe.');
        }
    } else {
        alert('No EarthCal data found in storage.');
    }

    // Step 4: Perform any UI updates or cleanup actions
    closeAddCycle();
    closeDateCycleExports();
    highlightDateCycles(targetDate);
}


async function prefillAddDateCycle(data) {
    const prefillDate = new Date(data.year, data.month - 1, data.day);
    window.targetDate = prefillDate; // ensure consistency
    await openAddCycle(); // opens modal using global targetDate

    // Format target date: "June 11, 2025"
    const dateStr = prefillDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    // Set invitation message
    const titleElement = document.getElementById('add-event-title');
    const sharerName = data.from || "An Earthcal user";
    if (titleElement) {
        titleElement.textContent = `${sharerName} has invited you to add an event to your calendar on ${dateStr}`;
    }

    // Pre-fill form values
    document.getElementById('dateCycle-type').value = data.frequency || 'One-time';
    if (data.year) document.getElementById('year-field2').value = data.year;
    if (data.month) document.getElementById('month-field2').value = data.month;
    if (data.day) document.getElementById('day-field2').value = data.day;
    if (data.title) document.getElementById('add-date-title').value = data.title;
    if (data.comments) {
        document.getElementById('add-note-checkbox').checked = true;
        document.getElementById('add-date-note').value = data.comments;
    }
    if (data.datecycle_color) document.getElementById('DateColorPicker').value = data.datecycle_color;

    document.getElementById('emojiPickerBtn').textContent = '🔗';

    // Select "My Calendar"
    const calDropdown = document.getElementById('select-calendar');
    for (let i = 0; i < calDropdown.options.length; i++) {
        if (calDropdown.options[i].text.trim() === "My Calendar") {
            calDropdown.selectedIndex = i;
            break;
        }
    }
}




//**************************
// ADD DATECYCLE
//***************************

async function addDatecycle() {
    console.log("addDatecycle called");

    // Validate form fields
    const dayField = document.getElementById('day-field2').value;
    const monthField = document.getElementById('month-field2').value;
    const addDateTitle = document.getElementById('add-date-title').value;

    if (!dayField || !monthField || !addDateTitle) {
        alert("Please fill out all the fields to add a new dateCycle to the calendar.");
        return; // Exit the function if validation fails
    }

    // Get selected calendar details
    const selCalendarElement = document.getElementById('select-calendar');
    const selCalendarId = document.getElementById('set-calendar-id').value;
    const selCalendarColor = document.getElementById('set-calendar-color').value;
    const selCalendarName = selCalendarElement.options[selCalendarElement.selectedIndex]?.text;

    if (!selCalendarName || selCalendarName === "Select calendar...") {
        alert("Please select a valid calendar.");
        return;
    }

    // Determine date cycle type and year
    const dateCycleType = document.getElementById('dateCycle-type').value;
    const yearField = dateCycleType === "Annual"
        ? document.getElementById('year-field2').value || ""
        : new Date().getFullYear();

    // Construct the JavaScript `Date` object properly
    const targetDate = new Date(yearField, monthField - 1, dayField); // Month is 0-based in JS

    // Retrieve new fields
    const dateEmoji = document.getElementById('emojiPickerBtn').textContent.trim();
    const pinned = document.getElementById('pinOrNot').value === "1";

    // Note and color picker fields
    const addNoteCheckbox = document.getElementById('add-note-checkbox').checked ? "1" : "0";
    const addDateNote = document.getElementById('add-date-note').value;
    const dateColorPicker = document.getElementById('DateColorPicker').value;

    // Generate timestamps
    const nowISO = new Date().toISOString().split('.')[0] + "Z";
    const createdAt = nowISO;
    const lastEdited = nowISO;

    // Retrieve existing dateCycles from localStorage
    const calendarStorageKey = `calendar_${selCalendarId}`;
    let existingCalendar = [];
    try {
        existingCalendar = JSON.parse(localStorage.getItem(calendarStorageKey)) || [];
    } catch (error) {
        console.error(`Error parsing calendar data for key: ${calendarStorageKey}`, error);
        alert("An error occurred while accessing calendar data.");
        return;
    }

    // Generate a unique key
    const newID = Math.random().toString(36).substring(2, 16);
    const unique_key = `${selCalendarId}_${yearField}-${monthField}-${dayField}_${newID}`;

    // ✅ Construct the new dateCycle JSON with all fields
    const dateCycle = {
        ID: newID,
        buwana_id: document.getElementById('buwana-id').value,
        cal_id: selCalendarId,
        cal_name: selCalendarName,
        cal_color: selCalendarColor,
        title: addDateTitle,
        date: `${yearField}-${monthField}-${dayField}`,
        time: "under dev",
        time_zone: "under dev",
        day: dayField,
        month: monthField,
        year: yearField,
        comment: addNoteCheckbox,
        comments: addDateNote,
        last_edited: lastEdited,
        created_at: createdAt,
        unique_key: unique_key,
        datecycle_color: dateColorPicker,
        frequency: dateCycleType,
        pinned: pinned,
        date_emoji: dateEmoji,
        completed: "0",
        public: "0",
        delete_it: "0",
        synced: "0", // Mark as not yet synced
        conflict: "0",
    };

    // Store the new dateCycle in localStorage
    try {
        existingCalendar.push(dateCycle);
        localStorage.setItem(calendarStorageKey, JSON.stringify(existingCalendar));
    } catch (error) {
        console.error(`Error saving calendar data for key: ${calendarStorageKey}`, error);
        alert("An error occurred while saving the dateCycle.");
        return;
    }

    console.log(`📥 Stored new dateCycle in localStorage:`, JSON.stringify(dateCycle, null, 2));

    // 🛑 **Ensure sync completes before proceeding**
    console.log("🔄 Syncing dateCycles before highlighting...");
    await syncDatecycles();
    console.log("✅ Sync complete!");

    // Clear form fields
    document.getElementById('select-calendar').value = 'Select calendar...';
    document.getElementById('dateCycle-type').value = 'One-time';
    document.getElementById('add-date-title').value = '';
    document.getElementById('add-note-checkbox').checked = false;
    document.getElementById('add-date-note').value = '';
    document.getElementById('emojiPickerBtn').textContent = '😀';

    console.log("✅ DateCycle added successfully:", dateCycle);
    closeAddCycle();
    closeDateCycleExports();

    // ✅ **Highlight only after all sync operations are done**
    console.log(`🔍 Highlighting date: ${targetDate.toISOString()}`);
    await highlightDateCycles(targetDate);
}







function animateConfirmDateCycleButton() {
    const confirmButton = document.getElementById('confirm-dateCycle-button');

    if (!confirmButton) return; // Exit if button doesn't exist

    // 🔄 Start Loading Animation
    confirmButton.classList.add('loading');
    confirmButton.innerText = "Adding...";

    // Simulate Sync Process (Replace with Actual Sync Logic if Needed)
    syncDatecycles().then(() => {
        confirmButton.classList.remove('loading');
        confirmButton.innerText = "✅ DateCycle Added!";

        // ✅ Call `addDatecycle()` after sync is successful
        addDatecycle();

    }).catch((error) => {
        confirmButton.classList.remove('loading');
        confirmButton.innerText = "⚠️ Add Failed!";
        console.error("Adding event failed:", error);
    });
}



function animateSyncButton() {
    const syncButton = document.getElementById('sync-button');
    const countDiv = document.getElementById('cal-datecycle-count');

    if (!syncButton) return; // Exit if button doesn't exist

    // 🔄 Start Loading Animation
    syncButton.classList.add('loading');
    syncButton.innerText = "Syncing...";

    // Wait for `syncDatecycles()` to finish before updating UI
    syncDatecycles().then((syncSummary) => {
        syncButton.classList.remove('loading');
        syncButton.innerText = "✅ Sync Successful!";

        if (syncSummary) {
            countDiv.innerText = syncSummary;
        }
    }).catch((error) => {
        syncButton.classList.remove('loading');
        syncButton.innerText = "⚠️ Sync Failed!";
        console.error("Sync failed:", error);
    });
}





async function syncDatecycles() {
    try {
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.warn("No access token found. Skipping sync.");
            return;
        }

        let decoded = null;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid JWT format');
            decoded = JSON.parse(atob(parts[1]));
        } catch (e) {
            console.error('Failed to decode JWT:', e);
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        if (decoded?.exp && decoded.exp < now) {
            console.warn("⚠️ Access token has expired.");
        }

        const profile = JSON.parse(sessionStorage.getItem("buwana_user") || "{}");
        const buwanaId = profile.buwana_id || decoded?.buwana_id;
        if (!buwanaId) {
            console.warn("No buwana_id found in session or token. Skipping sync.");
            return;
        }

        console.log(`🌿 Starting dateCycle sync for buwana_id ${buwanaId}...`);

        let serverCalendars = [];
        let hasInternetConnection = 1;
        let totalDateCyclesUpdated = 0;

        function findDuplicateCalIds(list, idKey = "calendar_id") {
            const counts = {};
            for (const c of list) {
                const id = c?.[idKey];
                if (!id) continue;
                counts[id] = (counts[id] || 0) + 1;
            }
            return Object.entries(counts)
                .filter(([, n]) => n > 1)
                .map(([id]) => id);
        }

        try {
            const calendarCache = sessionStorage.getItem("user_calendars");
            if (!calendarCache) {
                console.warn("⚠️ No cached calendars found. Sync aborted.");
                return;
            }

            const calendarData = JSON.parse(calendarCache);

            // 🔎 Duplicate checks
            const subs = calendarData.subscribed_calendars || [];
            const dupSubIds = findDuplicateCalIds(subs);
            if (dupSubIds.length) {
                console.warn("⚠️ Duplicate subscriptions detected:", dupSubIds);
                console.table(subs.filter(s => dupSubIds.includes(String(s.calendar_id))));
            }

            const allCalendarsRaw = [
                ...(calendarData.personal_calendars || []),
                ...(calendarData.subscribed_calendars || []),
                ...(calendarData.public_calendars || [])
            ];
            const dupAllIds = findDuplicateCalIds(allCalendarsRaw);
            if (dupAllIds.length) {
                console.warn("⚠️ Duplicate calendar_ids across all sets:", dupAllIds);
                console.table(allCalendarsRaw.filter(c => dupAllIds.includes(String(c.calendar_id))));
            }

            serverCalendars = allCalendarsRaw.map(calendar => ({
                cal_id: calendar.calendar_id,
                cal_name: calendar.calendar_name,
                cal_color: calendar.calendar_color || "gray",
                calendar_public: calendar.calendar_public ?? 0,
                last_updated: calendar.last_updated || null,
                created_at: calendar.calendar_created || null
            }));

            console.log('✅ Loaded calendars from session:', serverCalendars);
        } catch (error) {
            console.warn('⚠️ Unable to process cached calendar data:', error);
            hasInternetConnection = 0;
        }

        if (!hasInternetConnection) return;

        const localCalendars = Object.keys(localStorage)
            .filter(key => key.startsWith('calendar_'))
            .map(key => {
                let storedData = JSON.parse(localStorage.getItem(key) || '[]');
                return {
                    cal_id: key.replace('calendar_', ''),
                    created_at: storedData.created_at || 0,
                    data: storedData
                };
            });

        console.log(`📦 Found ${localCalendars.length} local calendar(s).`);

        const combined = [...serverCalendars, ...localCalendars].filter(c => c?.cal_id);
        const calendarsToSync = [...new Map(combined.map(item => [String(item.cal_id), item])).values()];
        console.log("📂 Syncing calendars:", calendarsToSync);

        for (const calendar of calendarsToSync) {
            try {
                if (!buwanaId || !calendar.cal_id) {
                    console.error("❌ Missing buwana_id or cal_id. Skipping calendar.");
                    continue;
                }

                console.log('📂 Syncing calendar:', calendar);

                let serverDateCycles = [];
                const payload = { buwana_id: buwanaId, cal_id: calendar.cal_id };

                try {
                    const calendarResponse = await fetch('https://buwana.ecobricks.org/earthcal/get_calendar_data.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    const responseData = await calendarResponse.json();
                    if (!responseData.success) {
                        console.error(`⚠️ API Error for calendar ${calendar.cal_id}: ${responseData.message}`);
                    } else {
                        serverDateCycles = responseData.dateCycles || [];
                        const dcIds = serverDateCycles.map(dc => dc.datecycle_id).filter(Boolean);
                        const dupDcIds = dcIds.filter((id, i, arr) => arr.indexOf(id) !== i);
                        if (dupDcIds.length) {
                            console.warn(`⚠️ Duplicate dateCycles in calendar ${calendar.cal_id}:`, dupDcIds);
                        }
                        console.log(`📊 ${serverDateCycles.length} dateCycles in calendar ${calendar.cal_id}`);
                    }
                } catch (error) {
                    console.error("⚠️ Fetch error when retrieving dateCycles:", error);
                }

                totalDateCyclesUpdated += serverDateCycles.length;

                serverDateCycles = serverDateCycles.map(dc => ({
                    ...dc,
                    date_emoji: dc.date_emoji || "😀",
                    pinned: dc.pinned !== undefined ? dc.pinned : false,
                }));

                await updateServerDatecycles(calendar.cal_id, serverDateCycles);
                await updateLocalDatecycles(calendar.cal_id, serverDateCycles);

            } catch (error) {
                console.error(`⚠️ Error syncing calendar '${calendar.cal_name}':`, error);
            }
        }

        console.log("✅ Sync complete. Local calendars updated.");
        return `Your ${calendarsToSync.length} calendars and ${totalDateCyclesUpdated} datecycles were updated`;
    } catch (error) {
        console.error("Sync failed:", error);
        return "⚠️ Sync failed!";
    }
}





async function updateServerDatecycles(cal_id, serverDateCycles) {
    const profileString = localStorage.getItem("user_profile");

    if (!profileString) {
        console.error("❌ No stored user_profile found. Cannot sync dateCycles.");
        return;
    }

    let userProfile;
    try {
        userProfile = JSON.parse(profileString);
    } catch (err) {
        console.error("❌ Failed to parse user_profile:", err);
        return;
    }

    const buwanaId = userProfile.buwana_id;
    if (!buwanaId) {
        console.error("❌ buwana_id missing in user_profile. Cannot sync dateCycles.");
        return;
    }

    // Retrieve local calendar data for this cal_id.
    let localCalendar = JSON.parse(localStorage.getItem(`calendar_${cal_id}`)) || [];

    // Build a dictionary keyed by unique_key.
    let localDateCycleMap = {};
    localCalendar.forEach(dc => {
        if (dc.unique_key) {
            localDateCycleMap[dc.unique_key] = dc;
        }
    });

    // 🔍 Debug log: Print the local storage state before filtering
    console.log("📥 Current local storage before filtering:", JSON.stringify(localCalendar, null, 2));

    // Filter only unsynced dateCycles
    let unsyncedDateCycles = localCalendar.filter(dc => String(dc.synced).trim() !== "1");

    // 🔍 Debug log: Print the filtered unsynced events
    console.log("🚀 Filtered unsynced events:", JSON.stringify(unsyncedDateCycles, null, 2));

    if (unsyncedDateCycles.length === 0) {
        console.log(`✅ No unsynced dateCycles for calendar ${cal_id}`);
        return;
    }

    console.log(`📤 Uploading ${unsyncedDateCycles.length} unsynced dateCycles for cal_id: ${cal_id}`);

    for (let unsyncedEvent of unsyncedDateCycles) {
        if (!unsyncedEvent.unique_key) {
            throw new Error(`Missing unique_key in unsynced event: ${unsyncedEvent.title}`);
        }

        // Handle deletions first
        if (unsyncedEvent.delete_it === "1" || unsyncedEvent.delete_it === "pending") {
            try {
                const deletePayload = {
                    buwana_id: buwanaId,
                    unique_key: unsyncedEvent.unique_key
                };
                console.log("📤 Sending deletion payload to server:", JSON.stringify(deletePayload, null, 2));

                const delResponse = await fetch('https://buwana.ecobricks.org/earthcal/delete_datecycle.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(deletePayload)
                });

                const delData = await delResponse.json();
                if (!delResponse.ok || !delData.success) {
                    throw new Error(delData.message || `Failed to delete event ${unsyncedEvent.title}.`);
                }

                console.log(`✅ Successfully deleted dateCycle: ${unsyncedEvent.title}`);
                delete localDateCycleMap[unsyncedEvent.unique_key];
                continue;
            } catch (error) {
                console.error("⚠️ Error deleting dateCycle:", error);
                continue;
            }
        }

        // Check if the event already exists on the server
        const alreadyExistsOnServer = serverDateCycles.some(dc =>
            String(dc.unique_key).trim() === String(unsyncedEvent.unique_key).trim() &&
            String(dc.cal_id).trim() === String(unsyncedEvent.cal_id).trim()
        );

        if (alreadyExistsOnServer) {
            console.log(`🚫 Skipping already existing event on server: ${unsyncedEvent.title}`);
            continue;
        }

        try {
            // ✅ Ensure `date_emoji` and `pinned` have default values if missing
            const dateEmoji = unsyncedEvent.date_emoji ? unsyncedEvent.date_emoji.trim() : "📆";
            const pinned = unsyncedEvent.pinned !== undefined ? unsyncedEvent.pinned : 0;

            const payload = {
                buwana_id: buwanaId,
                cal_id: cal_id,
                cal_name: unsyncedEvent.cal_name,
                cal_color: unsyncedEvent.cal_color,
                title: unsyncedEvent.title,
                date: unsyncedEvent.date,
                time: unsyncedEvent.time,
                time_zone: unsyncedEvent.time_zone,
                day: unsyncedEvent.day,
                month: unsyncedEvent.month,
                year: unsyncedEvent.year,
                comment: unsyncedEvent.comment,
                comments: unsyncedEvent.comments,
                last_edited: unsyncedEvent.last_edited,
                created_at: unsyncedEvent.created_at,
                unique_key: unsyncedEvent.unique_key,
                datecycle_color: unsyncedEvent.datecycle_color,
                frequency: unsyncedEvent.frequency,
                pinned: pinned, // ✅ Ensure pinned is included (default 0)
                date_emoji: dateEmoji, // ✅ Ensure date_emoji is included (default 📆)
                completed: unsyncedEvent.completed,
                public: unsyncedEvent.public,
                delete_it: unsyncedEvent.delete_it,
                synced: 1, // Mark as synced when successfully sent
                conflict: unsyncedEvent.conflict
            };

            // console.log("📤 Sending payload to server:", JSON.stringify(payload, null, 2));

            const syncResponse = await fetch('https://buwana.ecobricks.org/earthcal/add_datecycle.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const syncData = await syncResponse.json();

            if (!syncResponse.ok || !syncData.success) {
                throw new Error(syncData.message || `Failed to sync event ${unsyncedEvent.title}.`);
            }

            console.log(`✅ Successfully synced dateCycle: ${unsyncedEvent.title} with ID ${syncData.id}`);

            // Update the local entry with the new ID and mark it as synced.
            if (localDateCycleMap[unsyncedEvent.unique_key]) {
                localDateCycleMap[unsyncedEvent.unique_key].id = syncData.id;
                localDateCycleMap[unsyncedEvent.unique_key].synced = 1;
            }

        } catch (error) {
            if (error.message.includes("already exists") || error.message.includes("Duplicate")) {
                console.log(`ℹ️ Skipped existing dateCycle: ${unsyncedEvent.title}`);
            } else {
                console.error(`⚠️ Failed to sync dateCycle: ${unsyncedEvent.title}`, error);
            }
        }

    }

    // 🔍 Debug log: Print before updating local storage
    // console.log("📥 Updated local dateCycles after sync:", JSON.stringify(Object.values(localDateCycleMap), null, 2));

    // Save the updated local calendar.
    // localStorage.setItem(`calendar_${cal_id}`, JSON.stringify(Object.values(localDateCycleMap)));

    // 🔍 Debug log: Confirm local storage was saved
    // console.log("📥 Final local storage after sync:", localStorage.getItem(`calendar_${cal_id}`));
}




async function updateLocalDatecycles(cal_id, serverDateCycles) {
    // Get local calendar data.
    let localCalendar = JSON.parse(localStorage.getItem(`calendar_${cal_id}`)) || [];

    // Build a dictionary keyed by unique_key.
    let localDateCycleMap = {};
    localCalendar.forEach(dc => {
        if (dc.unique_key) {
            localDateCycleMap[dc.unique_key] = dc;
        }
    });

    // Iterate through each dateCycle from the server.
    serverDateCycles.forEach(serverDC => {
        if (!serverDC.unique_key) {
            console.warn(`⚠️ Missing unique_key for server dateCycle: ${serverDC.title}`);
            return;
        }
        const key = serverDC.unique_key;

        // If the local dictionary does not have this record, add it.
        if (!localDateCycleMap[key]) {
            console.warn(`⚠️ Adding new dateCycle from server (was not found locally): ${serverDC.title}`);
            localDateCycleMap[key] = serverDC;
        } else {
            // If a record exists locally, update it if the server version is newer.
            let localDC = localDateCycleMap[key];
            if (new Date(serverDC.last_edited) > new Date(localDC.last_edited)) {
                console.log(`🔄 Updated local dateCycle: ${serverDC.title}`);
                // Optionally merge properties or simply replace the local record.
                localDateCycleMap[key] = serverDC;
                // Optionally, ensure the synced flag is set:
                localDateCycleMap[key].synced = 1;
            }
        }
    });

    // Convert the dictionary back to an array.
    let updatedLocalCalendar = Object.values(localDateCycleMap);

    // Optional: Remove the alert if not needed.
    //alert("Saving the following DateCycles to Local Storage:\n\n" + JSON.stringify(updatedLocalCalendar, null, 2));

    // Save the updated calendar back to local storage.
    localStorage.setItem(`calendar_${cal_id}`, JSON.stringify(updatedLocalCalendar));
}





function fetchLocalCalendarByCalId(calId) {
    // Log the passed calId
    console.log('passed to fetchLocalCalendarByCalId:', calId);

    // Validate calId
    if (calId === undefined || calId === null || isNaN(calId)) {
        console.error('Invalid cal_id provided to fetchLocalCalendarByCalId:', calId);
        return [];
    }

    // Generate the key for localStorage
    const calendarKey = `calendar_${calId}`;
    console.log('Generated localStorage key:', calendarKey);

    // Log all localStorage keys and their contents
    console.log('Current localStorage state:');
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('calendar_')) {
            console.log(`Key: ${key}, Value:`, JSON.parse(localStorage.getItem(key)));
        }
    });

    // Fetch the data from localStorage
    const calendarData = localStorage.getItem(calendarKey);

    if (!calendarData) {
        console.warn(`No data found in localStorage for cal_id: ${calId}`);
        return [];
    }

    try {
        // Parse the data
        const parsedData = JSON.parse(calendarData);
        console.log(`Parsed data for cal_id ${calId}:`, parsedData);

        // Map over the parsed data to ensure each dateCycle has required fields, including unique_key.
        return parsedData.map(dateCycle => ({
            ID: dateCycle.ID || "missing",
            buwana_id: dateCycle.buwana_id || "missing",
            cal_id: dateCycle.cal_id || "missing",
            title: dateCycle.title || "missing",
            date: dateCycle.date || "missing",
            time: dateCycle.time || "missing",
            time_zone: dateCycle.time_zone || "missing",
            day: dateCycle.day || "missing",
            month: dateCycle.month || "missing",
            year: dateCycle.year || "missing",
            frequency: dateCycle.frequency || "missing",
            completed: dateCycle.completed || "0",
            pinned: dateCycle.pinned || "0",
            public: dateCycle.public || "0",
            comment: dateCycle.comment || "0",
            comments: dateCycle.comments || "",
            datecycle_color: dateCycle.datecycle_color || "missing",
            cal_name: dateCycle.cal_name || "missing",
            cal_color: dateCycle.cal_color || "missing",
            synced: dateCycle.synced || "1",
            conflict: dateCycle.conflict || "0",
            delete_it: dateCycle.delete_it || "0",
            last_edited: dateCycle.last_edited || new Date().toISOString(),
            unique_key: dateCycle.unique_key || "",  // Ensure unique_key is returned
            // raw_json: JSON.stringify(dateCycle),
        }));
    } catch (error) {
        console.error(`Error parsing calendar data for cal_id ${calId}:`, error);
        return [];
    }
}







function fetchDateCycleCalendars() {
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));

    if (calendarKeys.length === 0) {
        console.log("No calendar data found in localStorage.");
        return []; // Return an empty array if no calendars are found
    }

    try {
        let allDateCycles = [];

        calendarKeys.forEach(key => {
            try {
                const calendarData = JSON.parse(localStorage.getItem(key));

                if (Array.isArray(calendarData)) {
                    // Filter out deleted dateCycles (ensuring case-insensitive match)
                    const validDateCycles = calendarData.filter(dc =>
                        (dc.delete_it || '').trim().toLowerCase() !== "1"
                    );

                    if (validDateCycles.length === 0) {
                        console.warn(`All dateCycles for ${key} are marked as deleted.`);
                    }

                    allDateCycles.push(...validDateCycles);
                } else {
                    console.warn(`Unexpected format in localStorage for key: ${key}. Data:`, calendarData);
                }
            } catch (error) {
                console.error(`Error parsing localStorage data for key ${key}:`, error);
            }
        });

        console.log(`Fetched ${allDateCycles.length} dateCycles from local storage.`);
        //console.table(allDateCycles); // Logs a readable table of dateCycles

        return allDateCycles;
    } catch (error) {
        console.error('Error fetching dateCycles from localStorage:', error.message);
        return [];
    }
}



function mergeDateCycles(serverCalendar, localCalendar) {
    const mergedCycles = [];

    // Create a map for server cycles by ID
    const serverCycleMap = new Map();
    serverCalendar.forEach(serverCycle => {
        serverCycleMap.set(serverCycle.ID, serverCycle);
    });

    // Iterate over local cycles and merge
    localCalendar.forEach(localCycle => {
        const serverCycle = serverCycleMap.get(localCycle.ID);

        if (serverCycle) {
            // Resolve conflicts (e.g., last_edited timestamp)
            if (new Date(localCycle.last_edited) > new Date(serverCycle.last_edited)) {
                // Local is newer
                mergedCycles.push(localCycle);
            } else {
                // Server is newer
                mergedCycles.push(serverCycle);
            }

            // Remove from the server map to avoid duplicates
            serverCycleMap.delete(localCycle.ID);
        } else {
            // Local cycle does not exist on the server
            mergedCycles.push(localCycle);
        }
    });

    // Add remaining server cycles that weren't in local
    serverCycleMap.forEach(serverCycle => mergedCycles.push(serverCycle));

    console.log('Merged dateCycles:', mergedCycles);
    return mergedCycles;
}


//
// function cleanupLingeringDateCycles() {
//     try {
//         const allKeys = Object.keys(localStorage).filter(key => key.startsWith("calendar_"));
//         const cleanedCalendars = {};
//
//         // Iterate through each calendar key and clean up its data
//         allKeys.forEach(key => {
//             const calendarData = JSON.parse(localStorage.getItem(key)) || [];
//
//             // Filter out `000_` IDs
//             cleanedCalendars[key] = calendarData.filter(dc => !dc.ID.startsWith('000_'));
//         });
//
//         // Update localStorage with cleaned data
//         Object.entries(cleanedCalendars).forEach(([key, cleanedData]) => {
//             localStorage.setItem(key, JSON.stringify(cleanedData));
//             console.log(`Cleaned up lingering dateCycles with '000_' in ID for key: ${key}`);
//         });
//     } catch (error) {
//         console.error('Error cleaning up lingering dateCycles:', error);
//     }
// }






//*********************************
// SYNC HELPER FUNCTIONS
//*********************************

//OBSOLET RIGHT?!  99%
//
// async function handleNewOrUnlinkedCalendar(localCalendar, calendarName, buwanaId) {
//     try {
//         let newCalId;
//
//         if (calendarName === 'My Calendar') {
//             // Link the calendar to an existing or new ID
//             const response = await fetch('https://gobrik.com/api/link_calendar.php', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ buwana_id: buwanaId, calendar_name: calendarName })
//             });
//
//             const result = await response.json();
//
//             if (!result.success) {
//                 throw new Error(result.message || 'Failed to link calendar.');
//             }
//
//             newCalId = result.calendar_id; // Extract the new calendar ID
//         } else {
//             // Create a new calendar for custom names
//             const response = await fetch('https://gobrik.com/api/create_calendar.php', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ buwana_id: buwanaId, calendar_name: calendarName })
//             });
//
//             const result = await response.json();
//
//             if (!result.success) {
//                 throw new Error(result.message || 'Failed to create calendar.');
//             }
//
//             newCalId = result.calendar_id; // Extract the new calendar ID
//         }
//
//         if (newCalId) {
//             // Ensure all dateCycles have `Delete: "0"` if not already set to "1"
//             localCalendar.forEach(cycle => {
//                 if (cycle.delete !== "1") {
//                     cycle.delete = "0"; // Set to "0" explicitly
//                 }
//             });
//
//             // Update the localCalendar with the new calendar ID and IDs
//             const updatedCalendar = mergeDateCycles([], localCalendar, newCalId);
//
//             // Update local storage
//             updateLocal(updatedCalendar, calendarName, newCalId);
//             console.log(`Local storage updated for calendar: ${calendarName} (ID: ${newCalId})`);
//
//             // OBSOLET RIGHT?  Global cleanup of lingering dateCycles with `000_` in their `ID`
//             //cleanupLingeringDateCycles();
//             //console.log(`Cleaned Local storage for calendar: ${calendarName} (ID: ${newCalId})`);
//         } else {
//             throw new Error('Received undefined calendar_id.');
//         }
//     } catch (error) {
//         console.error('Error in handleNewOrUnlinkedCalendar:', error);
//         alert('An error occurred while linking or creating the calendar. Please try again.');
//     }
// }









//BEING USED??!

// Helper function to update the UI with the last sync timestamp
// function showLastSynkTimePassed(lastSyncTs) {
//     // Update local storage with the new last sync time
//     localStorage.setItem('last_sync_ts', lastSyncTs);
//
//     // Retrieve and format calendar names from local storage
//     const calendarNames = localStorage.getItem('calendar_names')
//         ? localStorage.getItem('calendar_names').split(',').join(', ')
//         : 'My Calendar';
//
//     // Update the UI with the last sync time
//     const lastSyncedDiv = document.getElementById('last-synced-time');
//     if (lastSyncedDiv) {
//         lastSyncedDiv.innerHTML = `✅ ${calendarNames} was last synced on ${lastSyncTs}.`;
//     }
// }





function showEmojiPicker(event) {
    event.stopPropagation(); // Prevent modal from closing immediately

    const emojiGrid = document.getElementById("emojiPickerGrid");
    emojiGrid.innerHTML = ""; // Clear previous emojis

    eventEmojis.forEach(emoji => {
        let emojiDiv = document.createElement("div");
        emojiDiv.textContent = emoji;
        emojiDiv.dataset.emoji = emoji;
        emojiDiv.style.fontSize = "1.5em";
        emojiDiv.style.cursor = "pointer";
        emojiDiv.style.padding = "8px";
        emojiDiv.style.display = "inline-block";
        emojiDiv.style.textAlign = "center";
        emojiDiv.style.userSelect = "none";
        emojiDiv.onclick = (e) => selectEmoji(e.target.dataset.emoji);
        emojiGrid.appendChild(emojiDiv);
    });

    const modal = document.getElementById("emojiPickerModal");
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");

    // Prevents multiple event listeners
    document.removeEventListener("click", closeEmojiPicker);

    // Add an event listener to close when clicking outside
    setTimeout(() => {
        document.addEventListener("click", handleOutsideClick);
    }, 200);
}

function handleOutsideClick(event) {
    const emojiPickerModal = document.getElementById("emojiPickerModal");
    const emojiPickerButton = document.getElementById("emojiPickerBtn");

    if (
        !emojiPickerModal.contains(event.target) &&
        !emojiPickerButton.contains(event.target)
    ) {
        closeEmojiPicker();
    }
}

function selectEmoji(emoji) {
    try {
        if (emoji && typeof emoji === "string") {
            document.getElementById("emojiPickerBtn").textContent = emoji;
            console.log(`Emoji selected: ${emoji}`);
        } else {
            console.warn("Invalid emoji selection:", emoji);
        }
    } catch (error) {
        console.error("Error setting emoji:", error);
    }
    closeEmojiPicker();
}

function closeEmojiPicker() {
    const modal = document.getElementById("emojiPickerModal");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");

    // Remove the outside click listener
    document.removeEventListener("click", handleOutsideClick);
}

