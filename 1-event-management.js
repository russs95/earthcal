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

            // Apply the color to the calendar name
            option.style.color = calendar.color.toLowerCase(); // Set the text color to match the calendar color
            option.textContent = calendar.name; // Set the calendar name as the option text

            if (calendar.name === "My Calendar") {
                option.selected = true;
                myCalendarFound = true;
            }

            calendarDropdown.appendChild(option);
            console.log(`Added option with color: ${calendar.color}`);
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

        // Add "+ Add New Calendar..." option at the end
        const addNewOption = document.createElement('option');
        addNewOption.value = "add_new_calendar"; // Custom value for detection
        addNewOption.textContent = "+ Add New Calendar...";
        calendarDropdown.appendChild(addNewOption);
        console.log('Added "+ Add New Calendar..." option.');

        // Listen for the selection of "+ Add New Calendar..."
        calendarDropdown.addEventListener('change', (event) => {
            if (event.target.value === "add_new_calendar") {
                console.log('"Add New Calendar" option selected.');
                showAdderForm(); // Show the form for adding a new calendar
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


















// CREATING A DateCycles



async function submitAddCycleForm() {
    console.log('submitAddCycleForm called.');

    // Retrieve and validate form fields
    const dayField = document.getElementById('day-field2').value;
    const monthField = document.getElementById('month-field2').value;
    const addDateTitle = document.getElementById('add-date-title').value;

    if (!dayField || !monthField || !addDateTitle) {
        alert("Please fill out all the fields to add a new dateCycle to the calendar.");
        return; // Exit the function if validation fails
    }

    const selCalendarElement = document.getElementById('select-calendar');
    const selCalendarName = selCalendarElement.options[selCalendarElement.selectedIndex]?.text;
    const selCalendarId = selCalendarElement.value;

    if (!selCalendarName || selCalendarName === "Select calendar...") {
        alert("Please select a valid calendar.");
        return; // Exit if no valid calendar is selected
    }

    const dateCycleType = document.getElementById('dateCycle-type').value;
    const yearField = dateCycleType === "Annual" ? document.getElementById('year-field2').value || "" : targetDate.getFullYear();

    const addNoteCheckbox = document.getElementById('add-note-checkbox').checked ? "Yes" : "No";
    const addDateNote = document.getElementById('add-date-note').value;
    const DateColorPicker = document.getElementById('DateColorPicker').value;

    // Generate a dateCycle ID (temporary for unsynced records) using cal_id
    const calendarStorageKey = `calendar_${selCalendarId}`;
    const existingCalendar = JSON.parse(localStorage.getItem(calendarStorageKey) || '[]');
    const maxID = existingCalendar.reduce((max, dc) => {
        const id = parseInt((dc.ID || "0").split("_").pop());
        return id > max ? id : max;
    }, 0);
    const newID = `temp_${selCalendarId}_${(maxID + 1).toString().padStart(3, '0')}`;

    // Create the dateCycle JSON
    const dateCycle = {
        ID: newID,
        cal_id: selCalendarId, // Use calendar ID instead of name
        selectCalendar: selCalendarName, // Calendar name for display purposes
        Frequency: dateCycleType,
        Event_name: addDateTitle,
        Day: dayField,
        Month: monthField,
        Year: yearField,
        Date: `-${dayField}-${monthField}-${yearField}`,
        comment: addNoteCheckbox,
        Comments: addDateNote,
        Completed: "no",
        Pinned: dateCycleType === "One-time + pinned" ? "yes" : "no",
        last_edited: new Date().toISOString(),
        datecycle_color: DateColorPicker, // Updated field name
        calendar_color: "under development", // Placeholder field
        public: "No",
        Delete: "No",
        synced: "No" // Mark as not synced initially
    };

    // Add the new dateCycle to the local storage calendar
    existingCalendar.push(dateCycle);
    localStorage.setItem(calendarStorageKey, JSON.stringify(existingCalendar));
    console.log(`Stored dateCycle locally in calendar '${selCalendarName}':`, dateCycle);

    // Attempt to sync with the server
    syncUserEvents(); // Separate sync handling

    // Clear form fields
    document.getElementById('select-calendar').value = 'Select calendar...';
    document.getElementById('dateCycle-type').value = 'One-time';
    document.getElementById('add-date-title').value = '';
    document.getElementById('add-note-checkbox').checked = false;
    document.getElementById('add-date-note').value = '';

    console.log('DateCycle form submission completed.');
    displayMatchingDateCycle();
}






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




async function highlightDateCycles() {
  // 1. Remove the "date_event" class from all previously highlighted elements
  const elementsWithDateEvent = Array.from(document.querySelectorAll("div.date_event, path.date_event"));
  elementsWithDateEvent.forEach(element => {
    element.classList.remove("date_event");
  });

  // 2. Fetch all dateCycles from localStorage
  const dateCycleEvent = fetchDateCycleCalendars(); // Fetch all calendars
  if (!dateCycleEvent || dateCycleEvent.length === 0) {
    console.log("No dateCycles found in storage.");
    return;
  }

  // 3. Get all paths with IDs in the calendar visualization
  const allPaths = Array.from(document.querySelectorAll("path[id]"));

  // 4. Iterate over each dateCycle and highlight matching paths
  dateCycleEvent.forEach(dateCycle => {
    // Normalize the dateCycle.Date
    const normalizedDate = dateCycle.Date || '';

    // Process for matching paths by checking if normalizedDate exists in path.id
    const matchingPaths = allPaths.filter(path => {
      const pathId = path.id;
      return pathId.includes(normalizedDate); // Check if the date is part of the path ID
    });

    // Highlight the matching paths
    matchingPaths.forEach(path => {
      const isDayMarker = path.id.endsWith('-day-marker');
      const currentTitle = path.getAttribute('title');

      // Update the title for paths that are not day markers
      if (!isDayMarker && currentTitle && !currentTitle.includes('|')) {
        const newTitle = `${dateCycle.Event_name} | ${currentTitle}`;
        path.setAttribute('title', newTitle);
      }

      // Add "date_event" class only to paths ending with "-day-marker"
      if (isDayMarker) {
        path.classList.add("date_event");
      }
    });

    // Log any unmatched dateCycles for debugging
    if (matchingPaths.length === 0) {
      console.log(`No matching paths found for dateCycle:`, dateCycle);
    }
  });

  console.log('DateCycles highlighted successfully.');
}







function displayMatchingDateCycle() {
    const dateCycles = fetchDateCycleCalendars();
    if (!dateCycles || dateCycles.length === 0) {
        console.log("No dateCycles found in storage.");
        return;
    }

    // Separate public, pinned, and unpinned dateCycles
    const publicDateCycles = dateCycles.filter(dc => dc.public === 'Yes');
    const pinnedDateCycles = dateCycles.filter(dc =>
        (dc.Pinned || '').trim().toLowerCase() === 'yes' && dc.public !== 'Yes' // Exclude public ones already in publicDateCycles
    );
    const unpinnedDateCycles = dateCycles.filter(dc =>
        (dc.Pinned || '').trim().toLowerCase() !== 'yes' && dc.public !== 'Yes'
    );

    // Filter unpinned dateCycles further to match the target date
    const matchingDateCycles = unpinnedDateCycles.filter(dc =>
        findMatchingDateCycles([dc]).length > 0
    );

    // Get the current date in the same format as targetDate
    const currentDate = new Date();
    const formattedCurrentDate = `-${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

    // Determine if the target date is the current date
    const isToday = findMatchingDateCycles([{ Date: formattedCurrentDate }]).length > 0;

    // Update `current-datecycles` with matching unpinned dateCycles
    const matchingDiv = document.getElementById('current-datecycles');
    if (matchingDiv) {
        matchingDiv.innerHTML = ""; // Clear previous data
        matchingDiv.style.display = matchingDateCycles.length ? 'block' : 'none';
        matchingDateCycles.forEach(dc => writeMatchingDateCycles(matchingDiv, dc));
    }

    // Update `pinned-datecycles` with pinned dateCycles and public dateCycles
    const pinnedDiv = document.getElementById('pinned-datecycles');
    if (pinnedDiv) {
        pinnedDiv.innerHTML = ""; // Clear previous data
        if (isToday) {
            // Combine pinned and public dateCycles for display
            const allPinnedDateCycles = [...pinnedDateCycles, ...publicDateCycles];
            pinnedDiv.style.display = allPinnedDateCycles.length ? 'block' : 'none';
            allPinnedDateCycles.forEach(dc => writeMatchingDateCycles(pinnedDiv, dc));
        } else {
            pinnedDiv.style.display = 'none';
        }
    }

    // Update `current-day-info` with event counts
    const currentDayInfoDiv = document.getElementById('current-day-info');
    if (currentDayInfoDiv) {
        const displayedCurrentEvents = matchingDiv.children.length;
        const displayedPinnedEvents = isToday ? pinnedDiv.children.length : 0;
        const totalEvents = displayedCurrentEvents + displayedPinnedEvents;

        currentDayInfoDiv.innerText = `${totalEvents} events today`; // Default to "hiding"
    }
}







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


function writeMatchingDateCycles(divElement, dateCycle) {
    // Determine styles based on whether the dateCycle is completed or not
    const eventNameStyle = dateCycle.Completed === 'yes' ? 'text-decoration: line-through;' : '';
    const calendarColor = dateCycle.calendar_color;

    // Set content for the bullet or delete button based on Completed status
    let actionButton;
    if (dateCycle.Completed === 'yes') {
        // Render the delete button when the dateCycle is completed
        actionButton = `
            <div class="delete-button-datecycle"
                title="❌ Delete this dateCycle"
                onclick="deleteDateCycle('${dateCycle.ID}'); event.stopPropagation();"
                style="
                    font-size: medium;
                    color: ${calendarColor};
                    cursor: pointer;">
                ❌
            </div>`;
    } else {
        // Render the pin/unpin button for incomplete dateCycles
        actionButton = `
            <button
                class="bullet-pin-button"
                aria-label="${dateCycle.Pinned === 'yes' ? 'Unpin this dateCycle' : 'Pin this dateCycle'}"
                title="${dateCycle.Pinned === 'yes' ? 'Unpin this!' : 'Pin this!'}"
                onclick="pinThisDatecycle(this); event.stopPropagation();"
                onmouseover="this.textContent = '${dateCycle.Pinned === 'yes' ? '↗️' : '📌'}';"
                onmouseout="this.textContent = '${dateCycle.Pinned === 'yes' ? '📌' : '⬤'}';"
                style="
                    font-size: medium;
                    margin: 0;
                    margin-bottom: 2px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    color: ${calendarColor};"
            >${dateCycle.Pinned === 'yes' ? '📌' : '⬤'}</button>`;
    }

    // Add a public label if the dateCycle is from a public calendar
    const publicLabel = dateCycle.public === 'Yes'
        ? `<div class="public-label" style="font-size: small; color: green; font-weight: bold; margin-top: 5px;">
                Public
           </div>`
        : '';

    divElement.innerHTML += `
        <div class="date-info ${dateCycle.ID}" onclick="editDateCycle('${dateCycle.ID}')" style="
            position: relative;
            padding: 16px;
            border: 1px solid #ccc;
            margin-bottom: 10px;
            border-radius: 8px;">

            <!-- Action Buttons Column -->
            <div style="
                position: absolute;
                top: 10px;
                right: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;">

                <!-- Dynamic Action Button (Bullet or Delete) -->
                ${actionButton}

                <!-- Forward Button -->
                <div class="forward-button-datecycle" title="➡️ Push to today"
                    onclick="push2today('${dateCycle.ID}'); event.stopPropagation();"
                    style="
                        font-size: larger;
                        cursor: pointer;">
                    ➜
                </div>

                <!-- Check Button -->
                <div class="close-button-datecycle"
                    title="✅ Done! Check."
                    onclick="strikeDateCycle(this); event.stopPropagation();"
                    style="
                        font-size: larger;
                        cursor: pointer;
                        ${dateCycle.Completed === 'yes' ? 'color: black;' : ''}">
                    ✔
                </div>
            </div>

            <!-- DateCycle Title and Event Name -->
            <div class="current-date-info-title" style="${eventNameStyle}; color:${calendarColor};">
                ${dateCycle.Event_name}
            </div>

            <!-- Additional Data -->
            <div class="current-datecycle-data">
                <div class="current-date-calendar">${dateCycle.selectCalendar}</div>
            </div>

            <!-- Notes -->
            <div class="current-date-notes" style="height: fit-content;">
                ${dateCycle.Comments}
            </div>

            <!-- Public Label -->
            ${publicLabel}
        </div>
    `;
}









function strikeDateCycle(element) {
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
            // Step 4: Toggle the 'Completed' status
            const dateCycle = calendarData[dateCycleIndex];
            dateCycle.Completed = dateCycle.Completed === 'no' ? 'yes' : 'no';

            // Step 5: Update the localStorage with the modified calendar array
            localStorage.setItem(key, JSON.stringify(calendarData));

            console.log(`Updated dateCycle in calendar: ${key}`, dateCycle);

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
            dateCycle.delete = navigator.onLine ? "yes" : "pending"; // "yes" if online, "pending" if offline
            calendarKey = key;

            // Update the local calendar array
            calendarData.splice(dateCycleIndex, 1); // Remove the dateCycle from the array if online
            if (!navigator.onLine) {
                calendarData.push(dateCycle); // If offline, re-add it as marked for deletion
            }

            localStorage.setItem(key, JSON.stringify(calendarData));
            console.log(`Updated dateCycle with ID: ${id} in calendar: ${key}`);
            found = true;

            break;
        }
    }

    // Handle case where the dateCycle ID was not found
    if (!found) {
        console.log(`No dateCycle found with ID: ${id}`);
        return;
    }

    // Step 3: If online, attempt to delete from the server
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

    // Step 4: Refresh the UI
    const divElement = document.getElementById('current-datecycle-info2');
    if (divElement) {
        divElement.innerHTML = ""; // Clear any displayed info
    }

    highlightDateCycles();
    displayMatchingDateCycle();
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
    highlightDateCycles();
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
  populateDropdown();
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


    highlightDateCycles();
    displayMatchingDateCycle();

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




//*********************************
// SYNC DATECYCLES
//*********************************
async function syncUserEvents() {
    try {
        const buwanaId = localStorage.getItem('buwana_id');

        if (!buwanaId) {
            alert('Buwana ID is missing. Please log in again.');
            return;
        }

        // Fetch local calendar data
        const localCalendars = fetchDateCycleCalendars();
        const hasLocalCalendars = localCalendars && localCalendars.length > 0;

        let serverCalendars = [];
        let hasInternetConnection = true;

        try {
            // Fetch server calendar data
            const response = await fetch('https://gobrik.com/earthcal/grab_user_calendars.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: buwanaId })
            });

            const serverData = await response.json();

            if (!serverData.success) {
                throw new Error(serverData.message || 'Failed to retrieve calendar data.');
            }

            serverCalendars = serverData.calendars || [];
        } catch (error) {
            console.warn('Unable to fetch server data:', error);
            hasInternetConnection = false;
        }

        const hasServerCalendars = serverCalendars.length > 0;

        // Alert if no local or server calendars exist and internet is available
        if (!hasLocalCalendars && !hasServerCalendars && hasInternetConnection) {
            alert('Sorry, you haven’t yet added a dateCycle. Add some events or select a public calendar to synchronize.');
            return;
        }

        if (!hasLocalCalendars && !hasInternetConnection) {
            console.warn('No local calendars and no internet connection. Skipping sync.');
            return;
        }

        // Sync logic starts here
        let lastSyncTs = null; // To store the latest sync timestamp

        for (const calendar of serverCalendars) {
            try {
                // Fetch detailed server calendar data
                const calendarResponse = await fetch('https://gobrik.com/earthcal/get_calendar_data.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ buwana_id: buwanaId, calendar_id: calendar.id })
                });

                const calendarData = await calendarResponse.json();

                if (!calendarData.success) {
                    console.error(`Failed to sync calendar: ${calendar.name}`, calendarData.message);
                    continue;
                }

                const serverCalendar = calendarData.data?.events_json_blob || [];
                const localCalendar = fetchLocalCalendarByCalId(calendar.id); // Fetch by cal_id

                if (!localCalendar) {
                    console.warn(`Local calendar not found for cal_id: ${calendar.id}`);
                    continue;
                }

                // Handle unsynced dateCycles locally
                const unsyncedDateCycles = localCalendar.filter(dc => dc.synced === "No");
                for (const unsyncedEvent of unsyncedDateCycles) {
                    try {
                        const syncResponse = await fetch('https://gobrik.com/earthcal/add_datecycle.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(unsyncedEvent)
                        });

                        const syncData = await syncResponse.json();
                        if (syncData.success) {
                            // Update the local calendar with the new ID and mark as synced
                            unsyncedEvent.ID = syncData.id;
                            unsyncedEvent.synced = "Yes";
                            console.log(`DateCycle synced successfully: ${unsyncedEvent.Event_name}`);
                        } else {
                            console.error(`Failed to sync dateCycle: ${unsyncedEvent.Event_name}`, syncData.message);
                        }
                    } catch (error) {
                        console.error('Error syncing dateCycle:', unsyncedEvent.Event_name, error);
                    }
                }

                // Merge server and local calendar data
                const mergedData = mergeDateCycles(serverCalendar, localCalendar);

                // Push merged data to the server
                const serverUpdate = await updateServer(mergedData, calendar.id, buwanaId);
                if (serverUpdate && serverUpdate.last_updated) {
                    lastSyncTs = serverUpdate.last_updated;
                }

                // Update the local calendar with merged data
                updateLocal(mergedData, calendar.id);
            } catch (error) {
                console.error(`Error syncing calendar '${calendar.name}':`, error);
            }
        }

        // Update last sync timestamp in UI and localStorage
        if (lastSyncTs) {
            showLastSynkTimePassed(lastSyncTs);
        } else {
            console.warn('Last sync timestamp not received from server.');
        }

        alert('DateCycles have been successfully synced!');
    } catch (error) {
        console.error('Error during sync:', error);
        alert('An error occurred while syncing your calendars. Please try again.');
    }
}

/**
 * Fetch a local calendar by its cal_id from localStorage.
 * @param {string} calId - The ID of the calendar to fetch.
 * @returns {Array} An array of dateCycles for the calendar, or an empty array if not found.
 */
function fetchLocalCalendarByCalId(calId) {
    if (!calId) {
        console.error('Invalid cal_id provided to fetchLocalCalendarByCalId');
        return [];
    }

    // Generate the key for localStorage
    const calendarKey = `calendar_${calId}`;

    // Fetch the data from localStorage
    const calendarData = localStorage.getItem(calendarKey);

    // Parse and return the data if available, or return an empty array
    if (calendarData) {
        try {
            return JSON.parse(calendarData);
        } catch (error) {
            console.error(`Error parsing calendar data for cal_id ${calId}:`, error);
        }
    }

    return [];
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




function mergeDateCycles(serverData, localData, newCalId = null) {
    const mergedData = [];

    // Combine all data and filter out entries marked for deletion
    const allCycles = [...serverData, ...localData].filter(cycle => cycle.delete !== "yes");

    // Use a Map to store the latest version of each DateCycle
    const latestCycles = new Map();

    allCycles.forEach(cycle => {
        // Update `cal_id` and `ID` if newCalId is provided
        if (newCalId && cycle.ID.startsWith("000_")) {
            const [, uniqueId] = cycle.ID.split("_"); // Extract the unique ID part
            cycle.cal_id = newCalId;
            cycle.ID = `${newCalId}_${uniqueId}`; // Update the ID with the new cal_id
        }

        const existing = latestCycles.get(cycle.ID);

        // Keep the latest version by comparing `last_edited`
        if (!existing || new Date(cycle.last_edited) > new Date(existing.last_edited)) {
            latestCycles.set(cycle.ID, cycle);
        }
    });

    // Push the unique, latest cycles into the merged data
    mergedData.push(...latestCycles.values());

    // Filter out any lingering `dateCycles` with `000` in their ID
    return mergedData.filter(dc => !dc.ID.startsWith("000_"));
}


async function updateServer(dateCycles, calendarName, buwanaId) {
    try {
        console.log("Preparing to send to server:", {
            buwana_id: buwanaId,
            calendar_name: calendarName,
            datecycles: dateCycles,
        });

        const response = await fetch('https://gobrik.com/api/update_calendar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buwana_id: buwanaId,
                calendar_name: calendarName,
                datecycles: dateCycles,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update server data.');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Unknown error occurred on server.');
        }

        console.log("Server update response:", result);
        return { last_updated: result.last_updated }; // Return the latest sync timestamp
    } catch (error) {
        console.error('Error in updateServer:', error);
        throw error;
    }
}





function fetchLocalCalendar(calId) {
    // Retrieve the specific calendar from localStorage based on calId
    const calendarKey = `calendar_${calId}`;
    const calendarData = localStorage.getItem(calendarKey);

    if (!calendarData) {
        console.log(`No calendar found with ID: ${calId}`);
        return null;
    }

    try {
        const parsedCalendar = JSON.parse(calendarData);
        if (Array.isArray(parsedCalendar)) {
            console.log(`Fetched calendar with ID: ${calId}`, parsedCalendar);
            return parsedCalendar;
        } else {
            console.log(`Invalid data format for calendar ID: ${calId}`);
            return null;
        }
    } catch (error) {
        console.log(`Error parsing calendar data for ID: ${calId}: ${error.message}`);
        return null;
    }
}


function updateLocal(dateCycles, calendarName, calId) {
    try {
        const calendarKey = `calendar_${calId}`;
        const existingCalendarData = JSON.parse(localStorage.getItem(calendarKey)) || [];

        // Remove only cycles explicitly marked for deletion
        const filteredDateCycles = existingCalendarData.filter(
            dc => !dateCycles.some(newCycle => newCycle.ID === dc.ID)
        );

        const updatedDateCycles = [...filteredDateCycles, ...dateCycles];
        localStorage.setItem(calendarKey, JSON.stringify(updatedDateCycles));

        console.log(`Local storage updated for calendar: ${calendarName} (ID: ${calId})`);
    } catch (error) {
        console.error('Error updating local storage:', error);
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


async function strikeDateCycle(element) {
    console.log('strikeDateCycle called.');

    // Step 1: Retrieve all calendar keys from localStorage
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));

    // Find the ancestor .date-info div of the clicked element
    const dateInfoDiv = element.closest('.date-info');

    if (!dateInfoDiv) {
        console.error("No date-info element found. Check the DOM structure.");
        return;
    }

    // Step 2: Get the ID from the class list of dateInfoDiv
    const dateCycleID = dateInfoDiv.classList[1];
    if (!dateCycleID) {
        console.error("No valid dateCycle ID found in date-info classes:", dateInfoDiv.classList);
        return;
    }

    console.log(`Attempting to toggle 'Completed' status for dateCycle ID: ${dateCycleID}`);

    let found = false;
    let dateCycle = null;
    let calendarKey = null;

    // Step 3: Iterate through calendar arrays to find and update the dateCycle
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');

        console.log(`Checking calendar: ${key}`, calendarData);

        const dateCycleIndex = calendarData.findIndex(dc => dc.ID === dateCycleID);
        if (dateCycleIndex !== -1) {
            // Step 4: Toggle the 'Completed' status
            dateCycle = calendarData[dateCycleIndex];
            dateCycle.Completed = dateCycle.Completed === 'no' ? 'yes' : 'no';

            console.log(`Toggled 'Completed' status for dateCycle:`, dateCycle);

            // Update the localStorage with the modified calendar array
            calendarData.splice(dateCycleIndex, 1); // Temporarily remove the updated dateCycle
            if (!navigator.onLine) {
                dateCycle.sync_status = "pending"; // Mark for sync if offline
            }
            calendarData.push(dateCycle); // Add it back
            localStorage.setItem(key, JSON.stringify(calendarData));

            console.log(`Updated dateCycle in calendar: ${key}`, dateCycle);

            calendarKey = key; // Store the key for potential server update
            found = true;
            break; // Exit the loop once the dateCycle is found and updated
        }
    }

    // Handle case where the dateCycle ID was not found
    if (!found) {
        console.error(`No dateCycle found with ID: ${dateCycleID}. Verify ID and localStorage data.`);
        return;
    }

    // Step 5: If online, attempt to update the server
    if (navigator.onLine && dateCycle) {
        const buwanaId = localStorage.getItem('buwana_id');
        if (!buwanaId) {
            console.log('User is not logged in. Cannot update server data.');
        } else {
            try {
                const response = await fetch('https://gobrik.com/earthcal/update_datecycle.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        buwana_id: buwanaId,
                        datecycle_id: dateCycleID,
                        completed: dateCycle.Completed
                    })
                });

                const result = await response.json();
                console.log('Server response for updating Completed status:', result);

                if (!result.success) {
                    console.error('Failed to update dateCycle on server:', result.message);
                    alert('Server update failed. It will be retried during the next sync.');
                } else {
                    console.log(`DateCycle with ID: ${dateCycleID} updated on the server.`);
                }
            } catch (error) {
                console.error('Error updating dateCycle on the server:', error);
                alert('An error occurred while updating on the server. It will be retried during the next sync.');
            }
        }
    }

    // Step 6: Refresh the displayed dateCycles
    displayMatchingDateCycle();
}




