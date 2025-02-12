//  OPENING THE ADD DATECYCLE FORM
// noinspection ExceptionCaughtLocallyJS,JSUnusedGlobalSymbols


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
            const response = await fetch('https://gobrik.com/earthcal/grab_user_calendars.php', {
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
        <option value="One-time + pinned">One-time + pinned</option>
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
        const response = await fetch('https://gobrik.com/earthcal/create_calendar.php', {
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

    console.log(`Normalized target date for highlighting: ${formattedTargetDate}`);

    // Remove "date_event" class from previously highlighted elements.
    const elementsWithDateEvent = Array.from(document.querySelectorAll("div.date_event, path.date_event"));
    elementsWithDateEvent.forEach(element => element.classList.remove("date_event"));

    // Fetch all dateCycles from localStorage.
    const dateCycleEvents = fetchDateCycleCalendars();
    if (!dateCycleEvents || dateCycleEvents.length === 0) {
        console.warn("⚠️ Highlighter: No dateCycles found in storage.");
        return;
    }
    console.log(`Retrieved ${dateCycleEvents.length} dateCycles from localStorage.`);

    // Separate matching dateCycles based on the target date and pin status.
    let matchingPinned = [];
    let matchingCurrent = [];
    const now = new Date();

    // Helper: was this dateCycle edited within the last minute?
    // Fo syncing?!  Why?
    function wasEditedRecently(dateCycle) {
        const lastEdited = new Date(dateCycle.last_edited);
        return (now - lastEdited) < 60000;
    }

    dateCycleEvents.forEach(dateCycle => {
        // Construct a formatted string from the dateCycle's day, month, and year.
        const storedDateFormatted = `-${dateCycle.day}-${dateCycle.month}-${dateCycle.year}`;
        const storedDateFormattedAnnual = `-${dateCycle.day}-${dateCycle.month}-`; // Annual events

        // Check if the dateCycle matches the target date:
        // - If it's an annual event (no specific year), match without year
        // - Otherwise, match including the year
        if (
            storedDateFormatted === formattedTargetDate || // Matches specific year
            (dateCycle.frequency && dateCycle.frequency.toLowerCase() === "annual" && storedDateFormattedAnnual === formattedTargetDateAnnual) // Matches annual events
        ) {
            if (dateCycle.pinned === "1") {
                matchingPinned.push(dateCycle);
            } else {
                matchingCurrent.push(dateCycle);
            }
        }
    });

    console.log(`Found ${matchingPinned.length} pinned and ${matchingCurrent.length} current dateCycles for target date.`);

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

    // Highlight corresponding date paths ending with "-day-marker" for ALL dateCycles in localStorage.

    dateCycleEvents.forEach(dc => {
        // Construct formatted strings
        const formatted = `-${dc.day}-${dc.month}-${dc.year}`;
        const formattedAnnual = `-${dc.day}-${dc.month}-`; // For annual events

        let matchingPaths;

        if (dc.frequency && dc.frequency.toLowerCase() === "annual") {
            // Highlight annual events across all years
            matchingPaths = document.querySelectorAll(`path[id*="${formattedAnnual}"]`);
        } else {
            // Highlight only specific year events
            matchingPaths = document.querySelectorAll(`path[id*="${formatted}"]`);
        }

        matchingPaths.forEach(path => {
            // Ensure that the ID ends with "-day-marker" before adding the class
            if (path.id.endsWith("-day-marker")) {
                path.classList.add("date_event");
            }
        });
    });


}

// Function to write date cycles and update the count
function writeMatchingDateCycles(divElement, dateCycle) {
    if (!window.dateCycleCount) {
        window.dateCycleCount = 0; // Initialize count if not set
    }
    window.dateCycleCount++; // Increment count

    const eventName = dateCycle.title || "Untitled Event";
    const bulletColor = dateCycle.datecycle_color || "#000"; // For bullet & title
    const calendarColor = dateCycle.cal_color || "#000"; // For calendar name

    const eventNameStyle = dateCycle.completed == "1"
        ? "text-decoration: line-through; color: grey;"
        : `color: ${bulletColor}`;

    const isPublic = String(dateCycle.public) === "1";
    const hideButtonsStyle = isPublic ? "display: none;" : "display: flex;";
    const contentOnclick = isPublic ? "" : `onclick="editDateCycle('${dateCycle.unique_key}')"`;

    divElement.innerHTML += `
        <div class="date-info" data-key="${dateCycle.unique_key}" style="
            display: flex;
            align-items: center;
            padding: 16px;
            border: 1px solid grey;
            margin-bottom: 10px;
            border-radius: 8px;
            position: relative;
            min-height: 75px;">
            
            <!-- Bullet Column -->
            <div class="bullet-column" style="max-width: 12px; margin-right: 12px; margin-bottom: auto; margin-left: -8px;">
                <button class="bullet-pin-button"
                    role="button"
                    aria-label="${dateCycle.pinned === '1' ? 'Unpin this dateCycle' : 'Pin this DateCycle'}"
                    title="${dateCycle.pinned === '1' ? 'Unpin this!' : 'Pin this!'}"
                    onclick="pinThisDatecycle(this); event.stopPropagation();"
                    onmouseover="this.textContent = '${dateCycle.pinned === '1' ? '↗️' : '📌'}';"
                    onmouseout="this.textContent = '${dateCycle.pinned === '1' ? '📌' : '⬤'}';"
                    style="font-size: 0.8em; margin: 0; border: none; background: none; cursor: pointer; color: ${bulletColor};">
                    ${dateCycle.pinned === '1' ? '📌' : '⬤'}
                </button>
            </div>

            <!-- Date Cycle Content -->
            <div class="datecycle-content" ${contentOnclick} style="flex-grow: 1; cursor: pointer; margin-bottom: auto;">
                <div class="current-date-info-title" style="${eventNameStyle}">
                    ${eventName}
                </div>
                <div class="current-datecycle-data">
                    <div class="current-date-calendar" style="color: ${calendarColor};">
                        ${dateCycle.cal_name}
                    </div>
                </div>
                <div class="current-date-notes" style="height: fit-content;">
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

    // Update the current-datecycle-count div only when writeMatchingDateCycles runs
    updateDateCycleCount();
}

// Function to update current-datecycle-count after writing date cycles
function updateDateCycleCount() {
    const currentDatecycleCount = document.getElementById("current-datecycle-count");
    if (currentDatecycleCount) {
        currentDatecycleCount.innerHTML = `<span id="show-hide-datecycles-icon">🔺</span> ${window.dateCycleCount} events today.`;
    }
}


// Function to toggle visibility of all-current-datecycles, all-pinned-datecycles, and icon
function toggleDateCycleView() {
    const allPinnedDateCyclesDiv = document.getElementById("all-pinned-datecycles");
    const allCurrentDateCyclesDiv = document.getElementById("all-current-datecycles");
    const showHideIcon = document.getElementById("show-hide-datecycles-icon");

    if (allCurrentDateCyclesDiv && allPinnedDateCyclesDiv && showHideIcon) {
        // Check if both sections are currently hidden or not
        const isHidden = allCurrentDateCyclesDiv.style.display === "none" || allCurrentDateCyclesDiv.style.display === "";

        if (isHidden) {
            allCurrentDateCyclesDiv.style.display = "block"; // Show current date cycles
            allPinnedDateCyclesDiv.style.display = "block";  // Show pinned date cycles
            showHideIcon.textContent = "🔻"; // Change icon
        } else {
            allCurrentDateCyclesDiv.style.display = "none"; // Hide current date cycles
            allPinnedDateCyclesDiv.style.display = "none";  // Hide pinned date cycles
            showHideIcon.textContent = "🔺"; // Change icon
        }
    }
}


// Ensure toggle function is attached only after writeMatchingDateCycles has run
document.addEventListener("DOMContentLoaded", () => {
    const currentDatecycleCount = document.getElementById("current-datecycle-count");
    if (currentDatecycleCount) {
        // Wait until the first event is written before initializing the count
        if (window.dateCycleCount > 0) {
            updateDateCycleCount();
        } else {
            currentDatecycleCount.innerHTML = ""; // Keep it empty until events are loaded
        }

        currentDatecycleCount.addEventListener("click", toggleDateCycleView);
    }
});








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




//
// function saveDateCycleEditedChanges(uniqueKey, calendarKey) {
//     // Step 1: Retrieve updated values from the edit form.
//     const frequency = document.getElementById('edit-dateCycle-type').value;
//     const yearField = document.getElementById('edit-year-field2').value;
//     const dayField = document.getElementById('edit-day-field2').value;
//     const monthField = document.getElementById('edit-month-field2').value;
//     const title = document.getElementById('edit-add-date-title').value.trim();
//     const eventColor = document.getElementById('edit-DateColorPicker').value;
//     const comments = document.getElementById('edit-add-date-note').value.trim();
//
//     // Update the last_edited field to now.
//     const now = new Date();
//     const lastEdited = now.toISOString();
//
//     // Construct the date string in "YYYY-MM-DD" format.
//     const formattedDate = `${yearField}-${monthField}-${dayField}`;
//
//     // Step 2: Retrieve the calendar's data from localStorage using calendarKey.
//     let calendarData = JSON.parse(localStorage.getItem(calendarKey) || '[]');
//
//     // Step 3: Find the dateCycle in the calendar data by unique_key.
//     const index = calendarData.findIndex(dc => dc.unique_key === uniqueKey);
//     if (index === -1) {
//         alert("Could not find the dateCycle to update.");
//         return;
//     }
//
//     // Step 4: Update the dateCycle object with the new values.
//     let dateCycle = calendarData[index];
//     dateCycle.frequency = frequency;
//     dateCycle.year = yearField;
//     dateCycle.day = dayField;
//     dateCycle.month = monthField;
//     dateCycle.date = formattedDate;
//     dateCycle.title = title;
//     dateCycle.datecycle_color = eventColor; // Update the calendar color.
//     dateCycle.comments = comments;
//     dateCycle.last_edited = lastEdited;
//
//     // Mark the record as unsynced so it will be sent to the server.
//     dateCycle.synced = "0";
//
//     // Step 5: Save the updated calendar data back to localStorage.
//     calendarData[index] = dateCycle;
//     localStorage.setItem(calendarKey, JSON.stringify(calendarData));
//
//     // Step 6: Attempt to update the server immediately if online.
//     if (navigator.onLine && localStorage.getItem('buwana_id')) {
//         updateServerDateCycle(dateCycle)
//             .then(() => {
//                 console.log(`Server updated for edited dateCycle: ${dateCycle.title}`);
//                 dateCycle.synced = "1";
//                 // Save updated sync status.
//                 calendarData[index] = dateCycle;
//                 localStorage.setItem(calendarKey, JSON.stringify(calendarData));
//             })
//             .catch(error => {
//                 console.error(`Error updating server for edited dateCycle: ${dateCycle.title}`, error);
//             });
//     } else {
//         console.log("Offline or not logged in – update queued for next sync.");
//     }
//
//     // Step 7: Hide the edit modal and remove the page blur.
//     const modal = document.getElementById('form-modal-message');
//     modal.classList.remove('modal-visible');
//     modal.classList.add('modal-hidden');
//     document.getElementById("page-content").classList.remove("blur");
//
//     // Step 8: Refresh the UI.
//     // Assumes that targetDate is defined globally or accessible here.
//     highlightDateCycles(targetDate);
// }












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







//
//
// function updateServerDateCycle(dateCycle) {
//     console.log(`Updating server for dateCycle ID: ${dateCycle.ID}`);
//
//     fetch('/update-datecycle', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             ID: dateCycle.ID,
//             completed: dateCycle.completed,
//             synced: 'No'  // Explicitly setting it to 'No'
//         })
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log("Server update response:", data);
//     })
//     .catch(error => {
//         console.error("Error updating server:", error);
//     });
// }


////////////////////////////////////


/* DateCcyle ACTIONS


////////////////////////////////////
 */
async function updateServerDateCycle(dateCycle) {
    // Send the updated dateCycle object to the server endpoint
    const response = await fetch('https://gobrik.com/earthcal/update_datecycle.php', {
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








function pinThisDatecycle(element) {
    console.log("Toggling pin status for dateCycle");

    // Step 1: Retrieve the closest .date-info div from the clicked element.
    const dateInfoDiv = element.closest('.date-info');
    if (!dateInfoDiv) {
        console.log("No date-info element found.");
        return;
    }

    // Step 2: Retrieve the unique_key from the date-info div.
    const uniqueKey = dateInfoDiv.getAttribute('data-key');
    if (!uniqueKey) {
        console.log("No unique_key found on date-info element.");
        return;
    }

    // Step 3: Retrieve all calendar keys from localStorage.
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    let found = false;

    // Step 4: Iterate through the calendar arrays to find the matching dateCycle.
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');
        const dateCycleIndex = calendarData.findIndex(dc => dc.unique_key === uniqueKey);
        if (dateCycleIndex !== -1) {
            let dateCycle = calendarData[dateCycleIndex];

            // Toggle pinned status: set to "1" if not pinned, otherwise "0".
            dateCycle.pinned = (dateCycle.pinned === "1") ? "0" : "1";
            console.log(`New pin status for ${dateCycle.title}: ${dateCycle.pinned}`);

            // Step 5: Mark the record as unsynced if it was previously synced.
            if (dateCycle.synced === "1") {
                dateCycle.synced = "0";
            }

            // Step 6: If online and logged in, attempt to update the server immediately.
            if (navigator.onLine && localStorage.getItem('buwana_id')) {
                updateServerDateCycle(dateCycle)
                    .then(() => {
                        console.log(`Server successfully updated for ${dateCycle.title}`);
                        // Mark it as synced locally.
                        dateCycle.synced = "1";
                        calendarData[dateCycleIndex] = dateCycle;
                        localStorage.setItem(key, JSON.stringify(calendarData));
                    })
                    .catch(error => {
                        console.error(`Error updating server for ${dateCycle.title}:`, error);
                        // Leave synced as "0" so that it will be retried later.
                    });
            } else {
                console.log("Offline or not logged in – update queued for next sync.");
            }

            // Step 7: Update localStorage with the modified calendar data.
            calendarData[dateCycleIndex] = dateCycle;
            localStorage.setItem(key, JSON.stringify(calendarData));
            console.log(`Updated dateCycle in calendar: ${key}`, dateCycle);

            // Step 8: If the record is now pinned (i.e. pinned === "1"), trigger the slide-out animation.
            if (dateCycle.pinned === "1") {
                dateInfoDiv.classList.add("slide-out-right");
                setTimeout(() => {
                    // After animation completes (0.4s), refresh the UI.
                    highlightDateCycles(targetDate);
                }, 400);
            } else {
                // Otherwise, refresh the UI immediately.
                highlightDateCycles(targetDate);
            }

            found = true;
            break; // Exit loop once the record is updated.
        }
    }

    // Step 9: Handle the case where no matching dateCycle was found.
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
                <textarea id="edit-add-date-note" class="blur-form-field" style="width:calc(100% - 10px); padding-right:0;" placeholder="Add a note to this event...">${dateCycle.comments || ''}
                </textarea>
            </div>
            <button type="button" id="edit-confirm-dateCycle" class="confirmation-blur-button enabled" style="width:100%;" onclick="saveDateCycleEditedChanges('${uniqueKey}', '${calendarKey}')">
                🐿️ Save Changes
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




function push2today(uniqueKey) {
    // Retrieve all calendar keys from localStorage.
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    let found = false;

    for (const key of calendarKeys) {
        let calendarData = JSON.parse(localStorage.getItem(key));
        const index = calendarData.findIndex(dc => dc.unique_key === uniqueKey);
        if (index !== -1) {
            // Found the matching dateCycle – update its date fields.
            let dateCycle = calendarData[index];
            const currentDate = new Date();
            // Format date as YYYY-MM-DD (ISO standard without time).
            const formattedDate = currentDate.toISOString().split('T')[0];

            dateCycle.day = currentDate.getDate();
            dateCycle.month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed.
            dateCycle.year = currentDate.getFullYear();
            dateCycle.date = formattedDate;
            dateCycle.last_edited = currentDate.toISOString();

            // Ensure pinned is set to "0" if not defined.
            if (!dateCycle.pinned) {
                dateCycle.pinned = '0';
            }

            // Update localStorage for this calendar.
            calendarData[index] = dateCycle;
            localStorage.setItem(key, JSON.stringify(calendarData));
            console.log(`Updated dateCycle with unique_key: ${uniqueKey} to today`);

            // Now, trigger the slide-out animation on the corresponding date-info div.
            const dateCycleDiv = document.querySelector(`.date-info[data-key="${uniqueKey}"]`);
            if (dateCycleDiv) {
                dateCycleDiv.classList.add("slide-out-right");
                // After the animation duration, refresh the UI.
                setTimeout(() => {
                    highlightDateCycles(targetDate);
                }, 400);
            } else {
                // If no div found, still refresh UI.
                highlightDateCycles(targetDate);
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
                const response = await fetch('https://gobrik.com/earthcal/delete_datecycle.php', {
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


//DATECYCLE CALENDAR EXPORTS



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
    exportUpArrow.style.display = 'none';
    exportImportDiv.style.animation = 'none';

    // Show the down arrow and hide the export-import div
    exportDownArrow.style.display = 'block';
    exportImportDiv.style.display = 'none';
}






///////////////////////

/* EXPORT FUNCTIONS


/////////////////////////////////
 */
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










//
// function closeDatecycleInfo(element) {
//   const dateInfoDiv = element.closest('.date-info');
//   if (dateInfoDiv) {
//     dateInfoDiv.style.display = 'none';
//   }
// }
//
//
//
// function handleKeyPress(event) {
//   if (event.keyCode === 13) { // 13 is the key code for the enter key
//      event.preventDefault(); // Prevent the default action to stop form submission
//      addNewCalendar(); // Call your search function without arguments
//   }
// }




//**************************
// ADD DATECYCLE
//**************


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
    const selCalendarColor = document.getElementById('set-calendar-color').value; // Get calendar color
    const selCalendarName = selCalendarElement.options[selCalendarElement.selectedIndex]?.text;

    if (!selCalendarName || selCalendarName === "Select calendar...") {
        alert("Please select a valid calendar.");
        return; // Exit if no valid calendar is selected
    }

    // Determine date cycle type and year
    const dateCycleType = document.getElementById('dateCycle-type').value;
    const yearField = dateCycleType === "Annual"
        ? document.getElementById('year-field2').value || ""
        : new Date().getFullYear();

    // Construct the JavaScript `Date` object properly
    const targetDate = new Date(yearField, monthField - 1, dayField); // Month is 0-based in JS

    // Note and color picker fields
    const addNoteCheckbox = document.getElementById('add-note-checkbox').checked ? "1" : "0";
    const addDateNote = document.getElementById('add-date-note').value;
    const dateColorPicker = document.getElementById('DateColorPicker').value;

    // Generate created_at timestamp in human-readable ISO format (without milliseconds if desired)
    // Here we use the full ISO string; if you want to remove milliseconds, you can split at the dot.
    const nowISO = new Date().toISOString().split('.')[0] + "Z"; // e.g., "2025-02-01T16:00:44Z"

    // Use the same format for created_at and last_edited
    const createdAt = nowISO;
    const lastEdited = nowISO;

    // Generate a dateCycle ID from localStorage
    const calendarStorageKey = `calendar_${selCalendarId}`;
    let existingCalendar = [];
    try {
        existingCalendar = JSON.parse(localStorage.getItem(calendarStorageKey)) || [];
    } catch (error) {
        console.error(`Error parsing calendar data for key: ${calendarStorageKey}`, error);
        alert("An error occurred while accessing calendar data.");
        return;
    }

    const maxID = existingCalendar.reduce((max, dc) => {
        const idString = String(dc.ID || "temp_0_000"); // Ensure it's a string
        const id = parseInt(idString.split("_").pop()) || 0; // Extract and parse last part
        return id > max ? id : max;
    }, 0);

    console.log("Existing dateCycle IDs:", existingCalendar.map(dc => dc.ID));
    const buwanaId = document.getElementById('buwana-id').value; // Get buwana_id
    //const newID = `temp_${selCalendarId}_${(maxID + 1).toString().padStart(3, '0')}`;

    // Generate a unique key for the record.
    // Here, we combine the calendar ID, createdAt, and the newID.
    //const unique_key = `${selCalendarId}_${createdAt}_${newID}`;
    //TEMP REMOVED!

    const newID = Math.random().toString(36).substring(2, 16); // Generates a 14-char random string
    const unique_key = `${selCalendarId}_${yearField}-${monthField}-${dayField}_${newID}`;




    const dateCycle = {
        ID: newID,
        buwana_id: buwanaId,
        cal_id: selCalendarId,
        cal_name: selCalendarName,
        cal_color: selCalendarColor,
        title: addDateTitle,
        date: `${yearField}-${monthField}-${dayField}`, // Correct format
        time: "under dev",
        time_zone: "under dev",
        day: dayField,
        month: monthField,
        year: yearField,
        comment: addNoteCheckbox,
        comments: addDateNote,
        last_edited: lastEdited,
        created_at: createdAt,
        unique_key: unique_key, // New unique key field
        datecycle_color: dateColorPicker,
        frequency: dateCycleType,
        pinned: dateCycleType === "One-time + pinned" ? "1" : "0",
        completed: "0",
        public: "0",
        delete_it: "0",
        synced: "0",
        conflict: "0",
    };

    // Add the new dateCycle to localStorage
    try {
        existingCalendar.push(dateCycle);
        localStorage.setItem(calendarStorageKey, JSON.stringify(existingCalendar));
    } catch (error) {
        console.error(`Error saving calendar data for key: ${calendarStorageKey}`, error);
        alert("An error occurred while saving the dateCycle.");
        return;
    }

    console.log(`📥 Stored new dateCycle in localStorage:`, JSON.stringify(dateCycle, null, 2));

    // Attempt to sync with the server
    await syncDatecycles();

    // Clear form fields
    document.getElementById('select-calendar').value = 'Select calendar...';
    document.getElementById('dateCycle-type').value = 'One-time';
    document.getElementById('add-date-title').value = '';
    document.getElementById('add-note-checkbox').checked = 0;
    document.getElementById('add-date-note').value = '';

    console.log("✅ DateCycle added successfully:", dateCycle);
    closeAddCycle();
    closeDateCycleExports();

    // Ensure `highlightDateCycles` gets the correct date
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
        console.log("Starting dateCycle sync...");
        const buwanaId = localStorage.getItem('buwana_id');
        if (!buwanaId) {
            //alert('Please log in first Buwana account.');
            return;
        }

        let serverCalendars = [];
        let hasInternetConnection = 1;
        let totalDateCyclesUpdated = 0;

        try {
            // 🔹 Fetch server calendars
            const response = await fetch('https://gobrik.com/earthcal/grab_user_calendars.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: buwanaId }),
            });
            if (!response.ok)
                throw new Error(`Failed to fetch server calendars. HTTP Status: ${response.status}`);
            const serverData = await response.json();
            if (!serverData.success)
                throw new Error(serverData.message || 'Failed to retrieve calendar data.');

            // 🔹 Standardize calendar_id to cal_id and include created_at.
            serverCalendars = serverData.calendars.map(calendar => ({
                cal_id: calendar.calendar_id,
                cal_name: calendar.calendar_name,
                cal_color: calendar.calendar_color,
                calendar_public: calendar.calendar_public,
                last_updated: calendar.last_updated,
                created_at: calendar.created_at
            }));

            console.log('✅ Fetched and transformed server calendars:', serverCalendars);
        } catch (error) {
            console.warn('⚠️ Unable to fetch server data:', error);
            hasInternetConnection = 0;
        }

        if (!hasInternetConnection) return;

        // 🔹 If no calendars exist on the server, check local storage.
        const localCalendars = Object.keys(localStorage)
            .filter(key => key.startsWith('calendar_'))
            .map(key => {
                let storedData = JSON.parse(localStorage.getItem(key) || '[]');
                return {
                    cal_id: key.replace('calendar_', ''),
                    created_at: storedData.created_at || 0, // Default to 0 if not available
                    data: storedData
                };
            });

        if (serverCalendars.length === 0 && localCalendars.length === 0) {
            console.warn("⚠️ No calendars found on server or locally. Sync completed.");
            return "No updates available. Your data is already up to date.";
        }

        // 🔹 Merge server and local calendars (by cal_id).
        const calendarsToSync = [...new Map([...serverCalendars, ...localCalendars].map(item => [item.cal_id, item])).values()];
        console.log("📂 Syncing calendars:", calendarsToSync);

        for (const calendar of calendarsToSync) {
            try {
                console.log('📂 Syncing calendar:', calendar);
                if (!buwanaId || !calendar.cal_id) {
                    console.error("❌ Missing buwana_id or cal_id. Cannot fetch calendar data.");
                    continue;
                }
                console.log(`📡 Fetching dateCycles for cal_id: ${calendar.cal_id}, buwana_id: ${buwanaId}`);

                // 🔹 Fetch dateCycles from the server for the current calendar.
                let serverDateCycles = [];
                if (serverCalendars.some(c => c.cal_id === calendar.cal_id)) {
                    const payload = {
                        buwana_id: buwanaId,
                        cal_id: calendar.cal_id
                    };

                    try {
                        const calendarResponse = await fetch('https://gobrik.com/earthcal/get_calendar_data.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                        });
                        const responseData = await calendarResponse.json();
                        if (!responseData.success) {
                            console.error(`⚠️ API Error: ${responseData.message}`);
                        } else {
                            console.log("✅ Server dateCycles fetched successfully:", responseData.dateCycles);
                            serverDateCycles = responseData.dateCycles || [];
                        }
                    } catch (error) {
                        console.error("⚠️ Fetch error when retrieving dateCycles:", error);
                    }
                }
                totalDateCyclesUpdated += serverDateCycles.length;

                // 🔹 Update the Server with unsynced local dateCycles.
                await updateServerDatecycles(calendar.cal_id, serverDateCycles);

                // 🔹 Update Local Storage with server dateCycles.
                await updateLocalDatecycles(calendar.cal_id, serverDateCycles);

            } catch (error) {
                console.error(`⚠️ Error syncing calendar '${calendar.cal_name}':`, error);
            }
        }

        console.log("✅ Sync complete. Local calendars updated.");
        console.log("📥 All locally stored dateCycles:", JSON.stringify(localStorage, null, 2));
        return `Your ${calendarsToSync.length} calendars and ${totalDateCyclesUpdated} datecycles were updated`;
    } catch (error) {
        console.error("Sync failed:", error);
        return "⚠️ Sync failed!";
    }
}



async function updateServerDatecycles(cal_id, serverDateCycles) {
    const buwanaId = localStorage.getItem('buwana_id');
    if (!buwanaId) {
        console.error("❌ Missing buwana_id. Cannot sync dateCycles.");
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

    // Filter only unsynced dateCycles.
    let unsyncedDateCycles = localCalendar.filter(dc => Number(dc.synced) !== 1);

    if (unsyncedDateCycles.length === 0) {
        console.log(`✅ No unsynced dateCycles for calendar ${cal_id}`);
        return;
    }

    console.log(`📤 Uploading ${unsyncedDateCycles.length} unsynced dateCycles for cal_id: ${cal_id}`);

    for (let unsyncedEvent of unsyncedDateCycles) {
        // Ensure unique_key is present.
        if (!unsyncedEvent.unique_key) {
            throw new Error(`Missing unique_key in unsynced event: ${unsyncedEvent.title}`);
        }

        // If the event is marked for deletion, attempt deletion instead of updating.
        if (unsyncedEvent.delete_it === "1" || unsyncedEvent.delete_it === "pending") {
            try {
                const deletePayload = {
                    buwana_id: buwanaId,
                    unique_key: unsyncedEvent.unique_key
                };
                console.log("📤 Sending deletion payload to server:", JSON.stringify(deletePayload, null, 2));

                const delResponse = await fetch('https://gobrik.com/earthcal/delete_datecycle.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(deletePayload)
                });
                const delData = await delResponse.json();
                if (!delResponse.ok || !delData.success) {
                    throw new Error(delData.message || `Failed to delete event ${unsyncedEvent.title}.`);
                }
                console.log(`✅ Successfully deleted dateCycle: ${unsyncedEvent.title}`);
                // Remove the record from the local dictionary.
                delete localDateCycleMap[unsyncedEvent.unique_key];
                continue; // Skip to next unsynced event.
            } catch (error) {
                console.error("⚠️ Error deleting dateCycle:", error);
                // Leave the record in local storage so it can be retried later.
                continue;
            }
        }

        // Check if the event already exists on the server (by unique_key).
        const alreadyExistsOnServer = serverDateCycles.some(dc =>
            dc.unique_key === unsyncedEvent.unique_key && dc.cal_id == unsyncedEvent.cal_id
        );

        if (alreadyExistsOnServer) {
            console.log(`🚫 Skipping already existing event on server: ${unsyncedEvent.title}`);
            continue;
        }

        try {
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
                unique_key: unsyncedEvent.unique_key, // Send the unique key
                datecycle_color: unsyncedEvent.datecycle_color,
                frequency: unsyncedEvent.frequency,
                pinned: unsyncedEvent.pinned,
                completed: unsyncedEvent.completed,
                public: unsyncedEvent.public,
                delete_it: unsyncedEvent.delete_it,
                synced: 1, // Mark as synced when successfully sent
                conflict: unsyncedEvent.conflict
            };

            console.log("📤 Sending payload to server:", JSON.stringify(payload, null, 2));

            const syncResponse = await fetch('https://gobrik.com/earthcal/add_datecycle.php', {
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
            console.error('⚠️ Error syncing dateCycle:', error);
        }
    }

    // Save the updated local calendar.
    localStorage.setItem(`calendar_${cal_id}`, JSON.stringify(Object.values(localDateCycleMap)));
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
        console.table(allDateCycles); // Logs a readable table of dateCycles

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





function cleanupLingeringDateCycles() {
    try {
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith("calendar_"));
        const cleanedCalendars = {};

        // Iterate through each calendar key and clean up its data
        allKeys.forEach(key => {
            const calendarData = JSON.parse(localStorage.getItem(key)) || [];

            // Filter out `000_` IDs
            cleanedCalendars[key] = calendarData.filter(dc => !dc.ID.startsWith('000_'));
        });

        // Update localStorage with cleaned data
        Object.entries(cleanedCalendars).forEach(([key, cleanedData]) => {
            localStorage.setItem(key, JSON.stringify(cleanedData));
            console.log(`Cleaned up lingering dateCycles with '000_' in ID for key: ${key}`);
        });
    } catch (error) {
        console.error('Error cleaning up lingering dateCycles:', error);
    }
}






//*********************************
// SYNC HELPER FUNCTIONS
//*********************************
async function handleNewOrUnlinkedCalendar(localCalendar, calendarName, buwanaId) {
    try {
        let newCalId;

        if (calendarName === 'My Calendar') {
            // Link the calendar to an existing or new ID
            const response = await fetch('https://gobrik.com/api/link_calendar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: buwanaId, calendar_name: calendarName })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to link calendar.');
            }

            newCalId = result.calendar_id; // Extract the new calendar ID
        } else {
            // Create a new calendar for custom names
            const response = await fetch('https://gobrik.com/api/create_calendar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: buwanaId, calendar_name: calendarName })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to create calendar.');
            }

            newCalId = result.calendar_id; // Extract the new calendar ID
        }

        if (newCalId) {
            // Ensure all dateCycles have `Delete: "0"` if not already set to "1"
            localCalendar.forEach(cycle => {
                if (cycle.delete !== "1") {
                    cycle.delete = "0"; // Set to "0" explicitly
                }
            });

            // Update the localCalendar with the new calendar ID and IDs
            const updatedCalendar = mergeDateCycles([], localCalendar, newCalId);

            // Update local storage
            updateLocal(updatedCalendar, calendarName, newCalId);
            console.log(`Local storage updated for calendar: ${calendarName} (ID: ${newCalId})`);

            // Global cleanup of lingering dateCycles with `000_` in their `ID`
            cleanupLingeringDateCycles();
            console.log(`Cleaned Local storage for calendar: ${calendarName} (ID: ${newCalId})`);
        } else {
            throw new Error('Received undefined calendar_id.');
        }
    } catch (error) {
        console.error('Error in handleNewOrUnlinkedCalendar:', error);
        alert('An error occurred while linking or creating the calendar. Please try again.');
    }
}










// Helper function to update the UI with the last sync timestamp
function showLastSynkTimePassed(lastSyncTs) {
    // Update local storage with the new last sync time
    localStorage.setItem('last_sync_ts', lastSyncTs);

    // Retrieve and format calendar names from local storage
    const calendarNames = localStorage.getItem('calendar_names')
        ? localStorage.getItem('calendar_names').split(',').join(', ')
        : 'My Calendar';

    // Update the UI with the last sync time
    const lastSyncedDiv = document.getElementById('last-synced-time');
    if (lastSyncedDiv) {
        lastSyncedDiv.innerHTML = `✅ ${calendarNames} was last synced on ${lastSyncTs}.`;
    }
}





