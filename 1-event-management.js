//  OPENING THE ADD DATECYLCE FORM



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
    //const targetDate = new Date();
    let formattedDate = targetDate.toLocaleDateString('en-US', options);
    formattedDate = formattedDate.replace(/ /g, '\u00A0'); // Replace spaces with non-breaking spaces

    // Update the modal title
    const titleElement = document.getElementById("add-event-title");
    titleElement.textContent = `Add an event for ${formattedDate}`;
    console.log('Formatted date set in modal');

    // Populate the date fields
    populateDateFields(targetDate);

    // Add listener for Enter key to submit the form
    document.addEventListener("keydown", handleEnterKeySubmit);

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
    const hiddenBuwanaId = document.getElementById('buwana-id'); // Reference to the hidden buwana_id field

    if (!calendarDropdown || !hiddenCalendarId || !hiddenCalendarColor || !hiddenBuwanaId) {
        console.error('Dropdown or hidden fields not found or inaccessible.');
        return;
    }

    try {
        let calendars = [];
        let myCalendarFound = false;

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

            calendars = result.calendars || [];

            // Look for "My Calendar"
            const myCalendar = calendars.find(calendar => calendar.name === "My Calendar");

            if (myCalendar) {
                myCalendarFound = true;
                hiddenCalendarId.value = myCalendar.cal_id; // Use cal_id
                hiddenCalendarColor.value = myCalendar.color;

                console.log(`Prepopulated hidden fields with My Calendar: ID = ${myCalendar.cal_id}, Color = ${myCalendar.color}`);
            }
        }

        // Clear existing options
        calendarDropdown.innerHTML = '';

        if (!myCalendarFound) {
            console.log('My Calendar not found in database, using default settings.');
            hiddenCalendarId.value = '000';
            hiddenCalendarColor.value = 'Blue';
            hiddenBuwanaId.value = 'undefined'; // Set a default buwana_id for offline use
            console.log('Default values set in hidden fields: ID = 000, Color = Blue');

            calendars.unshift({
                cal_id: '000', // Use cal_id
                name: 'My Calendar',
                color: 'Blue',
            });
        }

        if (calendars.length === 0) {
            console.log('No calendars found. Adding placeholder.');
            calendarDropdown.innerHTML = '<option disabled selected>No calendars found. Add a new one below.</option>';
            document.getElementById('addNewCalendar').style.display = 'block';
            return;
        }

        // Populate the dropdown with calendars
        calendars.forEach(calendar => {
            if (!calendar.name || !calendar.color) {
                console.warn('Skipping invalid calendar:', calendar);
                return;
            }

            const option = document.createElement('option');
            option.value = calendar.cal_id; // Use cal_id
            option.style.color = calendar.color.toLowerCase();
            option.textContent = calendar.name;

            if (calendar.name === "My Calendar") {
                option.selected = true;
            }

            calendarDropdown.appendChild(option);
            console.log(`Added option with color: ${calendar.color}`);
        });

        const addNewOption = document.createElement('option');
        addNewOption.value = "add_new_calendar";
        addNewOption.textContent = "+ Add New Calendar...";
        calendarDropdown.appendChild(addNewOption);
        console.log('Added "+ Add New Calendar..." option.');

        calendarDropdown.addEventListener('change', (event) => {
            const selectedOption = event.target.selectedOptions[0];
            const selectedCalendarId = selectedOption.value;
            const selectedCalendarColor = selectedOption.style.color || '';
            const selectedCalendarName = selectedOption.textContent;

            hiddenCalendarId.value = selectedCalendarId;
            hiddenCalendarColor.value = selectedCalendarColor;

            console.log(`Updated hidden fields: ID = ${selectedCalendarId}, Color = ${selectedCalendarColor}, Name = ${selectedCalendarName}`);

            if (selectedCalendarId === "add_new_calendar") {
                console.log('"Add New Calendar" option selected.');
                showAdderForm();
            }
        });

        document.getElementById('addNewCalendar').style.display = 'none';
        console.log('Dropdown populated successfully.');
    } catch (error) {
        console.error('Error populating dropdown:', error);
        calendarDropdown.innerHTML = '<option disabled selected>Loading calendars....</option>';
    }
}










function populateDateFields(targetDate) {
    console.log('populateDateFields called with targetDate:', targetDate);

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
    console.log('Frequency dropdown preset to "One-time".');

    // Day dropdown
    const dayDropdown = document.getElementById('day-field2');
    if (dayDropdown) {
        dayDropdown.value = targetDate.getDate().toString(); // Set to current day
        console.log(`Day dropdown preset to: ${dayDropdown.value}`);
    } else {
        console.error('Day dropdown element not found.');
    }

    // Month dropdown
    const monthDropdown = document.getElementById('month-field2');
    if (monthDropdown) {
        monthDropdown.value = (targetDate.getMonth() + 1).toString(); // Months are 0-based, so add 1
        console.log(`Month dropdown preset to: ${monthDropdown.value}`);
    } else {
        console.error('Month dropdown element not found.');
    }

    // Year dropdown
    const yearDropdown = document.getElementById('year-field2');
    if (yearDropdown) {
        yearDropdown.value = targetDate.getFullYear().toString(); // Set to current year
        console.log(`Year dropdown preset to: ${yearDropdown.value}`);
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

    const newCalendar = {
        buwana_id: buwanaId,
        name: calendarName,
        color: color,
        public: isPublic ? 1 : 0 // Convert boolean to 1/0 for PHP
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
                public: isPublic
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




function modalCloseCurtains ( e ) {
  if ( !e.keyCode || e.keyCode === 27 ) {

  document.body.style.overflowY = "unset";
  document.getElementById("right-settings-overlay").style.width = "0%";
  /*document.getElementById("knack-overlay-curtain").style.height = "0%";*/

  }
}

document.addEventListener('keydown', modalCloseCurtains);




function fetchDateCycleCalendars() {
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));

    if (calendarKeys.length === 0) {
        console.log('No calendar data found in localStorage.');
        return [];
    }

    try {
        const allDateCycles = calendarKeys.reduce((acc, key) => {
            const calendarData = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(calendarData)) {
                // Include only valid, non-deleted dateCycles
                const validDateCycles = calendarData.filter(dc => dc.Delete !== "Yes");
                acc.push(...validDateCycles);
            } else {
                console.log(`Invalid data format for key: ${key}`);
            }
            return acc;
        }, []);

        console.log('Fetched and combined valid dateCycles:', allDateCycles);
        return allDateCycles;
    } catch (error) {
        console.log('Error fetching dateCycles from localStorage:', error.message);
        return [];
    }
}



function prepLocalDatecycles(localCalendars) {
    const preparedCycles = [];

    localCalendars.forEach(calendar => {
        calendar.forEach(dateCycle => {
            let parsedData = null;
//            try {
//                parsedData = JSON.parse(dateCycle.raw_json || '{}'); // Parse raw JSON safely
//            } catch (error) {
//                console.error('Error parsing raw_json for dateCycle:', dateCycle, error);
//            }

            // Map the new database/JSON field names
            const preparedCycle = {
                buwana_id: localStorage.getItem('buwana_id') || 'missing',
                cal_id: dateCycle.cal_id || parsedData?.cal_id || 'missing',
                event_name: dateCycle.title || parsedData?.title || 'missing',
                date: dateCycle.date || parsedData?.date || 'missing',
                time: dateCycle.time || parsedData?.time || 'under dev',
                time_zone: dateCycle.time_zone || parsedData?.time_zone || 'under dev',
                day: dateCycle.day || parsedData?.day || 'missing',
                month: dateCycle.month || parsedData?.month || 'missing',
                year: dateCycle.year || parsedData?.year || 'missing',
                comment: dateCycle.comment || parsedData?.comment || 'No',
                comments: dateCycle.comments || parsedData?.comments || '',
                frequency: dateCycle.frequency || parsedData?.frequency || 'One-time',
                pinned: dateCycle.pinned || parsedData?.pinned || 'No',
                completed: dateCycle.completed || parsedData?.completed || 'No',
                public: dateCycle.public || parsedData?.public || 'No',
                delete_it: dateCycle.delete_it || parsedData?.delete_it || 'No', // ✅ Updated field name
                synced: dateCycle.synced || parsedData?.synced || 'No',
                conflict: dateCycle.conflict || parsedData?.conflict || 'No',
                datecycle_color: dateCycle.datecycle_color || parsedData?.datecycle_color || 'missing',
                cal_name: dateCycle.cal_name || parsedData?.cal_name || 'missing',
                cal_color: dateCycle.cal_color || parsedData?.cal_color || 'missing',
                last_edited: dateCycle.last_edited || parsedData?.last_edited || new Date().toISOString(),
                //raw_json: JSON.stringify(dateCycle), // Store the original object as JSON for debugging or re-parsing
            };

            preparedCycles.push(preparedCycle);
        });
    });

    return preparedCycles; // Return the array of prepared dateCycles
}







async function highlightDateCycles(targetDate) {
    // Normalize `targetDate` to match the stored dateCycle format
    const formattedTargetDate = `-${targetDate.getDate()}-${targetDate.getMonth() + 1}-${targetDate.getFullYear()}`;

    // 1. Remove the "date_event" class from all previously highlighted elements
    const elementsWithDateEvent = Array.from(document.querySelectorAll("div.date_event, path.date_event"));
    elementsWithDateEvent.forEach(element => {
        element.classList.remove("date_event");
    });

    // 2. Fetch all dateCycles from localStorage
    const dateCycleEvents = fetchDateCycleCalendars();
    if (!dateCycleEvents || dateCycleEvents.length === 0) {
        return;
    }

    // 3. Get all paths with IDs in the calendar visualization
    const allPaths = Array.from(document.querySelectorAll("path[id]"));

    // 4. Variables to store matching dateCycles
    let matchingDateCycles = [];

    // 5. Iterate over each dateCycle and highlight matching paths
    dateCycleEvents.forEach(dateCycle => {
        const normalizedDate = dateCycle.date?.trim() || '';

        // Check if the dateCycle matches the formatted targetDate
        if (normalizedDate === formattedTargetDate) {
            matchingDateCycles.push(dateCycle);
        }

        // Process for matching paths by checking if normalizedDate exists in path.id
        const matchingPaths = allPaths.filter(path => path.id.includes(normalizedDate));

        // Highlight the matching paths
        matchingPaths.forEach(path => {
            const isDayMarker = path.id.endsWith('-day-marker');
            const currentTitle = path.getAttribute('title');

            // Update the title for paths that are not day markers
            if (!isDayMarker && currentTitle && !currentTitle.includes('|')) {
                const newTitle = `${dateCycle.event_name} | ${currentTitle}`;
                path.setAttribute('title', newTitle);
            }

            // Add "date_event" class only to paths ending with "-day-marker"
            if (isDayMarker) {
                path.classList.add("date_event");
            }
        });
    });

    // 6. Write matching dateCycles to the `current_datecycles` div
    const matchingDiv = document.getElementById('current-datecycles');
    if (matchingDiv) {
        matchingDiv.innerHTML = "";
        matchingDiv.style.display = matchingDateCycles.length ? 'block' : 'none';

        // Write each matching dateCycle to the div
        matchingDateCycles.forEach(dc => writeMatchingDateCycles(matchingDiv, dc));
    }
}



function writeMatchingDateCycles(divElement, dateCycle) {
    console.log("Writing dateCycle:", JSON.stringify(dateCycle, null, 2));

    // Ensure correct field names
    const eventName = dateCycle.title || "Untitled Event";  // Using 'title' instead of 'event_name'
    const bulletColor = dateCycle.datecycle_color || "#000"; // Bullet & Title use 'datecycle_color'
    const calendarColor = dateCycle.cal_color || "#000"; // Calendar name uses 'cal_color'

    const eventNameStyle = dateCycle.completed === "yes" ? "text-decoration: line-through;" : "";

    let actionButton;
    if (dateCycle.completed === "yes") {
        actionButton = `
            <div class="delete-button-datecycle"
                title="❌ Delete this dateCycle"
                onclick="deleteDateCycle('${dateCycle.ID}'); event.stopPropagation();"
                style="font-size: medium; color: ${bulletColor}; cursor: pointer;">
                ❌
            </div>`;
    } else {
        actionButton = `
            <button class="bullet-pin-button"
                aria-label="${dateCycle.pinned === 'yes' ? 'Unpin this dateCycle' : 'Pin this DateCycle'}"
                title="${dateCycle.pinned === 'yes' ? 'Unpin this!' : 'Pin this!'}"
                onclick="pinThisDatecycle(this); event.stopPropagation();"
                onmouseover="this.textContent = '${dateCycle.pinned === 'yes' ? '↗️' : '📌'}';"
                onmouseout="this.textContent = '${dateCycle.pinned === 'yes' ? '📌' : '⬤'}';"
                style="font-size: medium; margin: 0; margin-bottom: 2px; border: none; background: none; cursor: pointer; color: ${bulletColor};">
                ${dateCycle.pinned === 'yes' ? '📌' : '⬤'}
            </button>`;
    }

    const publicLabel = dateCycle.public === "Yes"
        ? `<div class="public-label" style="font-size: small; color: green; font-weight: bold; margin-top: 5px;">
                Public
           </div>`
        : "";

    divElement.innerHTML += `
        <div class="date-info ${dateCycle.ID}" onclick="editDateCycle('${dateCycle.ID}')" style="
            position: relative;
            padding: 16px;
            border: 1px solid #ccc;
            margin-bottom: 10px;
            border-radius: 8px;">

            <div style="
                position: absolute;
                top: 10px;
                right: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;">

                ${actionButton}

                <div class="forward-button-datecycle" title="➡️ Push to today"
                    onclick="push2today('${dateCycle.ID}'); event.stopPropagation();"
                    style="font-size: larger; cursor: pointer;">
                    ➜
                </div>

                <div class="close-button-datecycle"
                    title="✅ Done! Check."
                    onclick="strikeDateCycle('${dateCycle.ID}'); event.stopPropagation();"
                    style="font-size: larger; cursor: pointer; ${dateCycle.completed === 'yes' ? 'color: black;' : ''}">
                    ✔
                </div>
            </div>

            <div class="current-date-info-title" style="${eventNameStyle}; color:${bulletColor};">
                ${eventName}
            </div>

            <div class="current-datecycle-data">
                <div class="current-date-calendar" style="color: ${calendarColor};">${dateCycle.cal_name}</div>
            </div>

            <div class="current-date-notes" style="height: fit-content;">
                ${dateCycle.comments}
            </div>

            ${publicLabel}
        </div>
    `;
}




//
//
//
//function displayMatchingDateCycle() {
//    const dateCycles = fetchDateCycleCalendars();
//    if (!dateCycles || dateCycles.length === 0) {
//        console.log("No dateCycles found in storage.");
//        return;
//    }
//
//    // Separate public, pinned, and unpinned dateCycles
//    const publicDateCycles = dateCycles.filter(dc => dc.public.toLowerCase() === 'yes');
//    const pinnedDateCycles = dateCycles.filter(dc =>
//        (dc.pinned || '').trim().toLowerCase() === 'yes' && dc.public.toLowerCase() !== 'yes' // Exclude public ones
//    );
//    const unpinnedDateCycles = dateCycles.filter(dc =>
//        (dc.pinned || '').trim().toLowerCase() !== 'yes' && dc.public.toLowerCase() !== 'yes' &&
//        (dc.delete_it || '').trim().toLowerCase() !== 'yes' // Exclude deleted cycles
//    );
//
//    // Filter unpinned dateCycles further to match the target date
//    const matchingDateCycles = unpinnedDateCycles.filter(dc =>
//        findMatchingDateCycles([dc]).length > 0
//    );
//
//    // Get the current date in the same format as targetDate
//    const currentDate = new Date();
//    const formattedCurrentDate = `-${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
//
//    // Determine if the target date is the current date
//    const isToday = findMatchingDateCycles([{ date: formattedCurrentDate }]).length > 0;
//
//    // 🔹 **Update `current-datecycles` with matching unpinned dateCycles**
//    const matchingDiv = document.getElementById('current-datecycles');
//    if (matchingDiv) {
//        matchingDiv.innerHTML = ""; // Clear previous data
//        matchingDiv.style.display = matchingDateCycles.length ? 'block' : 'none';
//        matchingDateCycles.forEach(dc => writeMatchingDateCycles(matchingDiv, dc));
//    }
//
//    // 🔹 **Update `pinned-datecycles` with pinned & public dateCycles**
//    const pinnedDiv = document.getElementById('pinned-datecycles');
//    if (pinnedDiv) {
//        pinnedDiv.innerHTML = ""; // Clear previous data
//        if (isToday) {
//            // Combine pinned and public dateCycles for display
//            const allPinnedDateCycles = [...pinnedDateCycles, ...publicDateCycles];
//            pinnedDiv.style.display = allPinnedDateCycles.length ? 'block' : 'none';
//            allPinnedDateCycles.forEach(dc => writeMatchingDateCycles(pinnedDiv, dc));
//        } else {
//            pinnedDiv.style.display = 'none';
//        }
//    }
//
//    // 🔹 **Update `current-day-info` with event counts**
//    const currentDayInfoDiv = document.getElementById('current-day-info');
//    if (currentDayInfoDiv) {
//        const displayedCurrentEvents = matchingDiv.children.length;
//        const displayedPinnedEvents = isToday ? pinnedDiv.children.length : 0;
//        const totalEvents = displayedCurrentEvents + displayedPinnedEvents;
//
//        currentDayInfoDiv.innerText = `${totalEvents} events today`;
//    }
//}








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








function strikeDateCycle(dateCycleID) {
    console.log(`Toggling completion for dateCycle ID: ${dateCycleID}`);

    // Ensure the ID is a string for consistent comparison
    const targetID = String(dateCycleID);

    // Step 1: Retrieve all calendar keys from localStorage
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    let found = false;
    let updatedDateCycle = null;

    // Step 2: Iterate through calendar arrays to find and update the dateCycle
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');

        // Convert stored IDs to strings for comparison
        const dateCycleIndex = calendarData.findIndex(dc => String(dc.ID) === targetID);

        if (dateCycleIndex !== -1) {
            // Step 3: Toggle the 'completed' status
            let dateCycle = calendarData[dateCycleIndex];
            dateCycle.completed = dateCycle.completed === 'no' ? 'yes' : 'no';

            // Step 4: If 'synced' is 'Yes', change it to 'No' and update the server
            if (dateCycle.synced === 'Yes') {
                dateCycle.synced = 'No';
                updateServerDateCycle(dateCycle);
            }

            // Step 5: Update localStorage with the modified calendar data
            calendarData[dateCycleIndex] = dateCycle;
            localStorage.setItem(key, JSON.stringify(calendarData));

            console.log(`✅ Updated dateCycle in calendar: ${key}`, dateCycle);
            updatedDateCycle = dateCycle;
            found = true;
            break; // Exit loop once updated
        }
    }

    // Step 6: Handle case where the dateCycle ID was not found
    if (!found) {
        console.error(`❌ Huh...No dateCycle found with ID: ${targetID}`);
    } else {
        // Step 7: Refresh the UI
        highlightDateCycles(targetDate);
    }
}



function updateServerDateCycle(dateCycle) {
    console.log(`Updating server for dateCycle ID: ${dateCycle.ID}`);

    fetch('/update-datecycle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ID: dateCycle.ID,
            completed: dateCycle.completed,
            synced: 'No'  // Explicitly setting it to 'No'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Server update response:", data);
    })
    .catch(error => {
        console.error("Error updating server:", error);
    });
}






// Find matching dateCycles and sort them by color
function findMatchingDateCycles(dateCycles) {
    const targetDateObj = new Date(targetDate);
    const day = targetDateObj.getDate();
    const month = targetDateObj.getMonth() + 1; // JavaScript months are 0-indexed
    const year = targetDateObj.getFullYear();

    const dashedDate = `-${day}-${month}-${year}`;
    const monthsNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    // Define the color priority for sorting
    const colorPriority = { red: 1, orange: 2, yellow: 3, green: 4, blue: 5 };

    // Filter, map, and sort the dateCycles
    return dateCycles
        .filter(dc => dashedDate.includes(dc.Date)) // Match the target date
        .map(dc => ({
            ...dc,
            monthName: dc.Completed === 'no' ? monthsNames[month - 1] : '' // Add month name if not completed
        }))
        .sort((a, b) => (colorPriority[a.calendar_color.toLowerCase()] || 99) - (colorPriority[b.calendar_color.toLowerCase()] || 99)); // Sort by color priority
}



function pinThisDatecycle(element) {
    // Step 1: Retrieve all calendar keys from localStorage
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));

    // Find the ancestor .date-info div of the clicked element
    const dateInfoDiv = element.closest('.date-info');

    if (!dateInfoDiv) {
        console.log("No date-info element found.");
        return;
    }

    // Step 2: Get the ID from the class list of dateInfoDiv
    const dateCycleID = dateInfoDiv.classList[1];
    let found = false;

    // Step 3: Iterate through calendar arrays to find and update the dateCycle
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');

        const dateCycleIndex = calendarData.findIndex(dc => dc.ID === dateCycleID);
        if (dateCycleIndex !== -1) {
            // Step 4: Toggle the 'Pinned' status (add if not present)
            const currentDateCycle = calendarData[dateCycleIndex];
            currentDateCycle.Pinned = currentDateCycle.Pinned === 'yes' ? 'no' : 'yes';

            // Step 5: Update the localStorage with the modified calendar array
            localStorage.setItem(key, JSON.stringify(calendarData));

            console.log(`Updated dateCycle in calendar: ${key}`, currentDateCycle);

            // Step 6: Refresh the displayed dateCycles
            displayMatchingDateCycle();

            found = true;
            break; // Exit the loop once the dateCycle is found and updated
        }
    }

    // Handle case where the dateCycle ID was not found
    if (!found) {
        console.log(`No dateCycle found with ID: ${dateCycleID}`);
    }
}









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

function showDateCycleSetter() {
  document.getElementById("datecycle-setter").style.display = "block";
  document.getElementById('dateCycle-type').value = 'Select frequency...';

}

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

function editDateCycle(dateCycleID) {
    // Step 1: Fetch all calendar keys from localStorage
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));

    let dateCycle = null;
    let calendarKey = null;

    // Step 2: Search through each calendar for the matching dateCycle ID
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');
        dateCycle = calendarData.find(dc => dc.ID === dateCycleID);

        if (dateCycle) {
            calendarKey = key; // Save the calendar key where the dateCycle was found
            break; // Exit the loop once the matching dateCycle is found
        }
    }

    // Step 3: Handle case where the dateCycle is not found
    if (!dateCycle) {
        console.log(`No dateCycle found with ID: ${dateCycleID}`);
        return;
    }

    // Step 4: Populate the modal with the dateCycle details
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div id="edit-datecycle-setter" style="width:100%;text-align:center;color:var(--text-color)"><h1>Edit DateCycle</h1></div>

        <select id="edit-dateCycle-type" class="blur-form-field" style="font-size: 1em; text-align: center; height: 45px; margin: auto; margin-bottom: 10px;width: 100%;" onchange="showYearMonthDaySetter()">
          <option value="" disabled>Select frequency...</option>
          <option value="One-time" ${dateCycle.Frequency === 'One-time' ? 'selected' : ''}>One-time</option>
          <option value="Annual" ${dateCycle.Frequency === 'Annual' ? 'selected' : ''}>Annual</option>
          <option value="Weekly" disabled>Weekly</option>
          <option value="Monthly" disabled>Monthly</option>
        </select>

        <div id="edit-dateCycle-year-option" >
          <select name="year" id="edit-year-field2" style="width: 100%; font-size: 1em; text-align: center; height: 45px; margin-top: 10px;" class="blur-form-field">
            <option value="" disabled>Select year...</option>
            ${[2025, 2026, 2027, 2028].map(year => `<option value="${year}" ${dateCycle.Year === String(year) ? 'selected' : ''}>${year}</option>`).join('')}
          </select>
        </div>

        <div id="edit-set-date">
          <div class="date-search fields" style="display: flex; flex-flow: row; margin: auto; justify-content: center;" >
            <select name="day" id="edit-day-field2" style="width: 22%; margin-right: 10px; font-size: 1em; text-align: center; height: 45px;margin-left: 0px;" class="blur-form-field">
              <option value="" disabled>Select day...</option>
              ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${dateCycle.Day === String(i + 1) ? 'selected' : ''}>${i + 1}</option>`).join('')}
            </select>
            <select name="month" id="edit-month-field2" style="font-size: 1em; text-align: center; height: 45px;margin-right: 0px;" class="blur-form-field">
              <option value="" disabled>Select month...</option>
              ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                .map((month, i) => `<option value="${i + 1}" ${dateCycle.Month === String(i + 1) ? 'selected' : ''}>${month}</option>`).join('')}
            </select>
          </div>

          <div id="edit-name-event" style="margin-top: 0px; display: flex; justify-content: center;margin-left: 0px;margin-right: auto; border-radius: 10px 0px 0px 10px;width: 100%;">
            <textarea id="edit-add-date-title" class="blur-form-field" placeholder="Event name..." style="margin-left: 0px;margin-right: auto; border-radius: 10px 0px 0px 10px;width: calc(100% - 80px);">${dateCycle.Event_name || ''}</textarea>
            <select id="edit-DateColorPicker" class="blur-form-field" name="color" style="padding: 10px; border-radius: 0px 10px 10px 0px; font-size: 1.5em;width:60px; margin-left: -40px;margin-right: 0px;">
              <option value="green" ${dateCycle.calendar_color === 'green' ? 'selected' : ''}>🟢</option>
              <option value="yellow" ${dateCycle.calendar_color === 'yellow' ? 'selected' : ''}>🟡</option>
              <option value="orange" ${dateCycle.calendar_color === 'orange' ? 'selected' : ''}>🟠</option>
              <option value="red" ${dateCycle.calendar_color === 'red' ? 'selected' : ''}>🔴</option>
              <option value="blue" ${dateCycle.calendar_color === 'blue' ? 'selected' : ''}>🔵</option>
            </select>
          </div>

          <div id="edit-add-note-form" style="margin-top: 0px; margin-bottom: 0px;">
            <textarea id="edit-add-date-note" class="blur-form-field" style="width: calc(100% - 10px);padding-right:0px;" placeholder="Add a note to this event...">${dateCycle.Comments || ''}</textarea>
          </div>
          <button type="button" id="edit-confirm-dateCycle" class="confirmation-blur-button enabled" style="width: 100%;" onclick="saveDateCycleEditedChanges('${dateCycleID}', '${calendarKey}')">🐿️ Save Changes</button>
        </div>
    `;

    // Step 5: Show the modal
    const modal = document.getElementById('form-modal-message');
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    document.getElementById("page-content").classList.add("blur");
}



function closeDatecycleInfo(element) {
  const dateInfoDiv = element.closest('.date-info');
  if (dateInfoDiv) {
    dateInfoDiv.style.display = 'none';
  }
}



async function deleteDateCycle(id) {
    console.log(`deleteDateCycle called for ID: ${id}`);

    // Step 1: Retrieve all calendar keys from localStorage
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    if (calendarKeys.length === 0) {
        console.log("No calendar data found in storage.");
        return;
    }

    // Confirm with the user
    const userResponse = confirm('Are you sure you want to delete this event?');
    if (!userResponse) return; // If user clicks "Cancel", exit the function

    let found = false;
    let dateCycle = null;
    let calendarKey = null;

    // Step 2: Find the dateCycle in local storage
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');
        const dateCycleIndex = calendarData.findIndex(dc => dc.ID === id);

        if (dateCycleIndex !== -1) {
            dateCycle = calendarData[dateCycleIndex];
            dateCycle.delete_it = navigator.onLine ? "yes" : "pending"; // "yes" if online, "pending" if offline
            calendarKey = key;

            // If online, remove the dateCycle from localStorage, otherwise mark it for deletion
            if (navigator.onLine) {
                calendarData.splice(dateCycleIndex, 1);
            } else {
                calendarData[dateCycleIndex] = dateCycle;
            }

            localStorage.setItem(key, JSON.stringify(calendarData));
            console.log(`Updated dateCycle with ID: ${id} in calendar: ${key}`);
            found = true;
            break;
        }
    }

    // Step 3: Handle case where the dateCycle ID was not found
    if (!found) {
        console.log(`No dateCycle found with ID: ${id}`);
        return;
    }

    // Step 4: If online, attempt to delete from the server
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
                        datecycle_id: id // Send the ID of the dateCycle to delete
                    })
                });

                const result = await response.json();
                console.log('Server response for deletion:', result);

                if (!result.success) {
                    console.error('Failed to delete dateCycle from server:', result.message);
                    alert('Server deletion failed. It will be retried during the next sync.');
                } else {
                    console.log(`DateCycle with ID: ${id} deleted from the server.`);
                }
            } catch (error) {
                console.error('Error deleting dateCycle from the server:', error);
                alert('An error occurred while deleting from the server. It will be retried during the next sync.');
            }
        }
    }

    // Step 5: Refresh the UI
    highlightDateCycles(targetDate);
    //displayMatchingDateCycle();

    console.log(`Final state of localStorage after deletion:`);
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('calendar_')) {
            console.log(`Key: ${key}, Value:`, JSON.parse(localStorage.getItem(key)));
        }
    });
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

function generateID() {
  const storedUserCalendars = JSON.parse(localStorage.getItem('userCalendars')) || [];

  if (storedUserCalendars && storedUserCalendars.length > 0) {
      // Convert all the existing IDs to numbers, find the maximum value, and add 1
      const newIdNumber = Math.max(...storedUserCalendars.map(calendar => Number(calendar.id))) + 1;
      return String(newIdNumber).padStart(3, '0');
  } else {
      // If userCalendars is empty or doesn't exist, start with ID '001'
      return '001';
  }
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









function push2today(id) {
  // Fetch the dateCycles from localStorage
  const dateCycles = fetchDateCycles();

  // Find the dateCycle by ID
  const dateCycle = dateCycles.find(dc => dc.ID === id);

  // Create a Date object for today's date
  const currentDate = new Date();
  const formattedDate = `-${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`; // Today's date string

  // Update the dateCycle object
  dateCycle.Day = currentDate.getDate();
  dateCycle.Month = currentDate.getMonth() + 1; // Months are zero-indexed in JavaScript Dates
  dateCycle.Year = currentDate.getFullYear();
  dateCycle.Date = formattedDate;

  // Update "last_edited" to the current datetime
  dateCycle.last_edited = currentDate.toISOString();

  // If Pinned hasn't been set, update it to "no"
  if (!dateCycle.Pinned) {
    dateCycle.Pinned = 'no';
  }

  // Update the Comments field to indicate the original date
  //const originalDate = dateCycle.Date || 'an unspecified date';
  //dateCycle.Comments = `Originally set to ${originalDate}`;

  // Save the updated array back to localStorage
  localStorage.setItem('dateCycles', JSON.stringify(dateCycles));

  // Refresh the display or show a message to the user
  console.log(`Updated dateCycle with ID: ${id} to today`);


    highlightDateCycles(targetDate);
    //displayMatchingDateCycle();

}



function closeDatecycleInfo(element) {
  const dateInfoDiv = element.closest('.date-info');
  if (dateInfoDiv) {
    dateInfoDiv.style.display = 'none';
  }
}



function handleKeyPress(event) {
  if (event.keyCode === 13) { // 13 is the key code for the enter key
     event.preventDefault(); // Prevent the default action to stop form submission
     addNewCalendar(); // Call your search function without arguments
  }
}




//**************************
// ADD DATECYCLE
//**************



async function addDatecycle() {
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
    const yearField =
        dateCycleType === "Annual"
            ? document.getElementById('year-field2').value || ""
            : new Date().getFullYear();

    // Note and color picker fields
    const addNoteCheckbox = document.getElementById('add-note-checkbox').checked ? "Yes" : "No";
    const addDateNote = document.getElementById('add-date-note').value;
    const dateColorPicker = document.getElementById('DateColorPicker').value;

    // Generate a dateCycle ID
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

    const newID = `temp_${selCalendarId}_${(maxID + 1).toString().padStart(3, '0')}`;

  const buwanaId = document.getElementById('buwana-id').value; // Get buwana_id

    const dateCycle = {
        ID: newID,
        buwana_id: buwanaId, // Include the buwana_id
        cal_id: selCalendarId,
        cal_name: selCalendarName,
        cal_color: selCalendarColor,
        title: addDateTitle,
        date: `-${dayField}-${monthField}-${yearField}`,
        time: "under dev",
        time_zone: "under dev",
        day: dayField,
        month: monthField,
        year: yearField,
        comment: addNoteCheckbox,
        comments: addDateNote,
        last_edited: new Date().toISOString(),
        datecycle_color: dateColorPicker,
        frequency: dateCycleType,
        pinned: dateCycleType === "One-time + pinned" ? "yes" : "no",
        completed: "no",
        public: "No",
        delete_it: "No",
        synced: "No",
        conflict: "No",
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

    // Attempt to sync with the server
    syncDatecycles();

    // Clear form fields
    document.getElementById('select-calendar').value = 'Select calendar...';
    document.getElementById('dateCycle-type').value = 'One-time';
    document.getElementById('add-date-title').value = '';
    document.getElementById('add-note-checkbox').checked = false;
    document.getElementById('add-date-note').value = '';

    console.log('DateCycle added successfully:', dateCycle);
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
            alert('Buwana ID is missing. Please log in again.');
            return;
        }

        let serverCalendars = [];
        let hasInternetConnection = true;
        let totalDateCyclesUpdated = 0;

        try {
            // 🔹 Fetch server calendars
            const response = await fetch('https://gobrik.com/earthcal/grab_user_calendars.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: buwanaId }),
            });

            if (!response.ok) throw new Error(`Failed to fetch server calendars. HTTP Status: ${response.status}`);
            const serverData = await response.json();
            if (!serverData.success) throw new Error(serverData.message || 'Failed to retrieve calendar data.');

            // 🔹 **Standardize `calendar_id` to `cal_id`**
            serverCalendars = serverData.calendars.map(calendar => ({
                cal_id: calendar.calendar_id, // Rename key
                cal_name: calendar.calendar_name,
                cal_color: calendar.calendar_color,
                calendar_public: calendar.calendar_public,
                last_updated: calendar.last_updated
            }));

            console.log('✅ Fetched and transformed server calendars:', serverCalendars);
        } catch (error) {
            console.warn('⚠️ Unable to fetch server data:', error);
            hasInternetConnection = false;
        }

        if (!hasInternetConnection) return;

        // 🔹 **If no calendars exist on the server, check local storage**
        const localCalendars = Object.keys(localStorage)
            .filter(key => key.startsWith('calendar_'))
            .map(key => ({
                cal_id: key.replace('calendar_', ''), // Extract calendar ID
                data: JSON.parse(localStorage.getItem(key) || '[]'),
            }));

        if (serverCalendars.length === 0 && localCalendars.length === 0) {
            console.warn("⚠️ No calendars found on server or locally. Sync completed.");
            return "No updates available. Your data is already up to date.";
        }

        const calendarsToSync = serverCalendars.length > 0 ? serverCalendars : localCalendars;
        console.log("📂 Syncing calendars:", calendarsToSync);

        for (const calendar of calendarsToSync) {
            try {
                console.log('📂 Processing calendar:', calendar);

                // 🔹 **Validate `buwanaId` and `cal_id` Before API Call**
                if (!buwanaId) {
                    console.error("❌ Missing buwana_id. Cannot fetch calendar data.");
                    continue;
                }

                if (!calendar.cal_id) {
                    console.error("❌ Missing cal_id for calendar:", calendar);
                    continue;
                }

                console.log(`📡 Fetching dateCycles for cal_id: ${calendar.cal_id}, buwana_id: ${buwanaId}`);

                // 🔹 Fetch dateCycles from the server (if the calendar exists on the server)
                let serverDateCycles = [];
                if (serverCalendars.length > 0) {
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

                // 🔹 **Update the Server with Unsynced Local dateCycles**
                await updateServerDatecycles(calendar.cal_id, serverDateCycles);

                // 🔹 **Update Local Storage with Server dateCycles**
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
    const buwanaId = localStorage.getItem('buwana_id'); // Ensure we get the buwana_id
    if (!buwanaId) {
        console.error("❌ Missing buwana_id. Cannot sync dateCycles.");
        return;
    }

    const localCalendar = JSON.parse(localStorage.getItem(`calendar_${cal_id}`)) || [];
    const unsyncedDateCycles = localCalendar.filter(dc => dc.synced !== "Yes");

    if (unsyncedDateCycles.length === 0) {
        console.log(`✅ No unsynced dateCycles for calendar ${cal_id}`);
        return;
    }

    console.log(`📤 Uploading ${unsyncedDateCycles.length} unsynced dateCycles for cal_id: ${cal_id}`);

    for (const unsyncedEvent of unsyncedDateCycles) {
        try {
            const payload = {
                buwana_id: buwanaId,
                cal_id: cal_id,
                calendarName: unsyncedEvent.cal_name, // Ensuring calendarName is passed
                dateCycle: unsyncedEvent
            };

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

            // ✅ Update Local Storage Copy to "Yes"
            unsyncedEvent.ID = syncData.id;
            unsyncedEvent.synced = "Yes";

        } catch (error) {
            console.error('⚠️ Error syncing dateCycle:', error);
        }
    }

    // 🔹 Save updated local storage after syncing
    localStorage.setItem(`calendar_${cal_id}`, JSON.stringify(localCalendar));
}






async function updateLocalDatecycles(cal_id, serverDateCycles) {
    let localCalendar = JSON.parse(localStorage.getItem(`calendar_${cal_id}`)) || [];

    // 🔹 Convert local storage into a dictionary for faster lookups
    let localDateCycleMap = {};
    localCalendar.forEach(dc => {
        localDateCycleMap[dc.ID] = dc;
    });

    let updatedLocalCalendar = [...localCalendar];

    for (const serverDateCycle of serverDateCycles) {
        const localCopy = localDateCycleMap[serverDateCycle.ID];

        if (!localCopy) {
            // 🔹 If dateCycle is missing in local storage, add it
            updatedLocalCalendar.push(serverDateCycle);
            console.log(`📥 Downloaded new dateCycle: ${serverDateCycle.title}`);
        } else if (new Date(serverDateCycle.last_edited) > new Date(localCopy.last_edited)) {
            // 🔹 If the server version is newer, overwrite local
            Object.assign(localCopy, serverDateCycle);
            console.log(`🔄 Overwriting local dateCycle: ${serverDateCycle.title} with newer server version.`);
        }
    }

    // 🔹 Save updated local storage
    localStorage.setItem(`calendar_${cal_id}`, JSON.stringify(updatedLocalCalendar));
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
                        (dc.delete_it || '').trim().toLowerCase() !== "yes"
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




//
//async function updateServer(dateCycles, calendarName, buwanaId) {
//    try {
//        // Ensure all dateCycles have required fields
//        const validCycles = dateCycles.map(dc => ({
//            ...dc,
//            Event_name: dc.Event_name || "Unnamed Event",
//            Day: dc.Day || "01",
//            Month: dc.Month || "01",
//            Year: dc.Year || new Date().getFullYear().toString(),
//            synced: "Yes", // Mark cycles as synced before sending
//        }));
//
//        console.log("Sending to server:", {
//            buwana_id: buwanaId,
//            calendar_name: calendarName,
//            datecycles: validCycles,
//        });
//
//        const response = await fetch('https://gobrik.com/earthcal/update_calendar.php', {
//            method: 'POST',
//            headers: { 'Content-Type': 'application/json' },
//            body: JSON.stringify({
//                buwana_id: buwanaId,
//                calendar_name: calendarName,
//                datecycles: validCycles,
//            }),
//        });
//
//        if (!response.ok) {
//            throw new Error('Failed to update server data.');
//        }
//
//        const result = await response.json();
//        if (!result.success) {
//            throw new Error(result.message || 'Unknown server error.');
//        }
//
//        console.log("Server update response:", result);
//        return { last_updated: result.last_updated }; // Return the latest sync timestamp
//    } catch (error) {
//        console.error('Error in updateServer:', error);
//        throw error;
//    }
//}
//
//
//function updateLocal(dateCycles, calendarName, calId) {
//    try {
//        const calendarKey = `calendar_${calId}`;
//        const existingCalendarData = JSON.parse(localStorage.getItem(calendarKey)) || [];
//
//        // Ensure all new cycles have required fields
//        const validDateCycles = dateCycles.map(dc => ({
//            ...dc,
//            synced: dc.synced || "Yes", // Default to "Yes" if not explicitly set
//        }));
//
//        // Remove only cycles explicitly marked for deletion or replaced by new data
//        const filteredDateCycles = existingCalendarData.filter(
//            dc => !validDateCycles.some(newCycle => newCycle.ID === dc.ID)
//        );
//
//        const updatedDateCycles = [...filteredDateCycles, ...validDateCycles];
//        localStorage.setItem(calendarKey, JSON.stringify(updatedDateCycles));
//
//        console.log(`Local storage updated for calendar: ${calendarName} (ID: ${calId})`);
//    } catch (error) {
//        console.error('Error updating local storage:', error);
//    }
//}


function fetchLocalCalendarByCalId(calId) {
    // Log the passed calId
    console.log('passed to fetchLocalCalendarByCalId:', calId);

    // Validate calId
    if (calId === undefined || calId === null || isNaN(calId)) {
        console.error('Invalid cal_id provided to fetchLocalCalendarByCalId:', calId);
        return [];
    }

    // Generate the key for localStorage
    const calendarKey = `calendar_${calId}`; // No need to convert to a string explicitly
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

        // Map over the parsed data to ensure each dateCycle has required fields
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
            completed: dateCycle.completed || "No",
            pinned: dateCycle.pinned || "No",
            public: dateCycle.public || "No",
            comment: dateCycle.comment || "No",
            comments: dateCycle.comments || "",
            datecycle_color: dateCycle.datecycle_color || "missing",
            cal_name: dateCycle.cal_name || "missing",
            cal_color: dateCycle.cal_color || "missing",
            synced: dateCycle.synced || "No",
            conflict: dateCycle.conflict || "No",
            delete_it: dateCycle.delete || "No",
            last_edited: dateCycle.last_edited || new Date().toISOString(),
            //raw_json: JSON.stringify(dateCycle),
        }));
    } catch (error) {
        console.error(`Error parsing calendar data for cal_id ${calId}:`, error);
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
            // Ensure all dateCycles have `Delete: "No"` if not already set to "Yes"
            localCalendar.forEach(cycle => {
                if (cycle.delete !== "yes") {
                    cycle.delete = "no"; // Set to "No" explicitly
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



function saveDateCycleEditedChanges(dateCycleID, calendarKey) {
    // Step 1: Retrieve the calendar array from localStorage
    const calendarData = JSON.parse(localStorage.getItem(calendarKey) || '[]');

    // Step 2: Find the index of the dateCycle within the calendar array
    const dateCycleIndex = calendarData.findIndex(dc => dc.ID === dateCycleID);

    // If no matching dateCycle is found, show an error message on the button
    if (dateCycleIndex === -1) {
        const confirmButton = document.getElementById('edit-confirm-dateCycle');
        confirmButton.textContent = "Error Updating DateCycle";
        return;
    }

    // Step 3: Get updated values from the form
    const updatedTitle = document.getElementById('edit-add-date-title').value;
    const updatedDay = document.getElementById('edit-day-field2').value;
    const updatedMonth = document.getElementById('edit-month-field2').value;
    const updatedYear = document.getElementById('edit-year-field2').value || ""; // Empty if not selected
    const updatedFrequency = document.getElementById('edit-dateCycle-type').value;
    const updatedCalendarColor = document.getElementById('edit-DateColorPicker').value;
    const updatedComments = document.getElementById('edit-add-date-note').value;

    // Step 4: Get the current date and time for 'last_edited'
    const currentDateTime = new Date().toISOString();

    // Step 5: Update the dateCycle object
    const updatedDateCycle = {
        ...calendarData[dateCycleIndex], // Preserve existing data
        Event_name: updatedTitle,
        Day: updatedDay,
        Month: updatedMonth,
        Year: updatedYear,
        Date: `-${updatedDay}-${updatedMonth}${updatedYear ? '-' + updatedYear : ''}`,
        Frequency: updatedFrequency,
        calendar_color: updatedCalendarColor,
        Comments: updatedComments,
        last_edited: currentDateTime // Update 'last_edited'
    };

    // Replace the original dateCycle with the updated version
    calendarData[dateCycleIndex] = updatedDateCycle;

    // Step 6: Save the updated calendar array back to localStorage
    localStorage.setItem(calendarKey, JSON.stringify(calendarData));

    // Step 7: Hide the edit modal after successful update
    const addNewCalendarDiv = document.getElementById('edit-addNewCalendar');
    if (addNewCalendarDiv) {
        addNewCalendarDiv.style.display = "none";
    }

    // Step 8: Refresh UI
    displayMatchingDateCycle();
    closeTheModal();

    console.log(`DateCycle with ID ${dateCycleID} updated in calendar ${calendarKey}:`, updatedDateCycle);
}

function strikeDateCycle(dateCycleID) {
    console.log(`Toggling completion for dateCycle ID: ${dateCycleID}`);

    // Step 1: Retrieve all calendar keys from localStorage
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    let found = false;
    let updatedDateCycle = null;

    // Step 2: Iterate through calendar arrays to find and update the dateCycle
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');

        const dateCycleIndex = calendarData.findIndex(dc => dc.ID === dateCycleID);
        if (dateCycleIndex !== -1) {
            // Step 3: Toggle the 'Completed' status
            let dateCycle = calendarData[dateCycleIndex];
            dateCycle.completed = dateCycle.completed === 'no' ? 'yes' : 'no';

            // Step 4: If Synced is 'Yes', change it to 'No' (to indicate local edit)
            if (dateCycle.synced === 'Yes') {
                dateCycle.synced = 'No';

                // Step 5: Update the server record asynchronously
                updateServerDateCycle(dateCycle);
            }

            // Step 6: Update localStorage with the modified calendar data
            calendarData[dateCycleIndex] = dateCycle;
            localStorage.setItem(key, JSON.stringify(calendarData));

            console.log(`Updated dateCycle in calendar: ${key}`, dateCycle);
            updatedDateCycle = dateCycle;
            found = true;
            break; // Exit loop once updated
        }
    }

    // Step 7: Handle case where the dateCycle ID was not found
    if (!found) {
        console.log(`No dateCycle found with ID: ${dateCycleID}`);
    } else {
        // Step 8: Refresh the UI
        displayMatchingDateCycle();
    }
}





