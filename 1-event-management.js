// MAnagement of DateCycles


function submitAddCycleForm() {
    // Check if all required fields are filled out
    const dayField = document.getElementById('day-field2').value;
    const monthField = document.getElementById('month-field2').value;
    const addDateTitle = document.getElementById('add-date-title').value;

    if (!dayField || !monthField || !addDateTitle) {
        alert("Please be sure to fill out all the fields to add a new dateCycle to the Calendar.");
        return; // Exit the function early
    }

    // Get additional form inputs
    const selCalendarElement = document.getElementById('select-calendar');
    const selCalendar = selCalendarElement.options[selCalendarElement.selectedIndex].text; // Get the calendar name
    const dateCycleType = document.getElementById('dateCycle-type').value;

    let yearField = "";
    let dashOrNot = "-";

    if (dateCycleType === 'Monthly') {
        yearField = '';
        dashOrNot = '';
    } else if (dateCycleType !== 'Annual') {
        yearField = document.getElementById('year-field2').value || "";
    }

    const addNoteCheckbox = document.getElementById('add-note-checkbox').checked ? "Yes" : "No";
    const addDateNote = document.getElementById('add-date-note').value;
    const DateColorPicker = document.getElementById('DateColorPicker').value;

    // Get the current date and time for last_edited
    const currentDateTime = new Date().toISOString();

    // Check if there's already a calendar with this name
    const calendarStorageKey = `calendar_${selCalendar}`;
    let existingCalendar = JSON.parse(localStorage.getItem(calendarStorageKey) || '[]');
    let calId = existingCalendar.length > 0 ? existingCalendar[0].cal_id : "000";

    // Generate a unique ID for the new dateCycle
    const maxID = existingCalendar.reduce((max, dc) => {
        const id = parseInt((dc.ID || "0").split("_").pop());
        return id > max ? id : max;
    }, 0);

    const newID = `${calId}_${(maxID + 1).toString().padStart(3, '0')}`;

    // Create the dateCycle object
    const dateCycle = {
        "ID": newID,
        "cal_id": calId,
        "selectCalendar": selCalendar,
        "Frequency": dateCycleType,
        "Event_name": addDateTitle,
        "Day": dayField,
        "Month": monthField,
        "Year": yearField,
        "Date": `-${dayField}-${monthField}${dashOrNot}${yearField}`,
        "comment": addNoteCheckbox,
        "Comments": addDateNote,
        "Completed": 'no',
        "Pinned": 'no', // New field
        "last_edited": currentDateTime, // New field
        "calendar_color": DateColorPicker,
        "public": "No",
        "Delete": "No"
    };

    // Add the new dateCycle to the existing calendar array
    existingCalendar.push(dateCycle);
    localStorage.setItem(calendarStorageKey, JSON.stringify(existingCalendar));

    // Clear the form fields
    document.getElementById('select-calendar').value = 'Select Calendar...';
    document.getElementById('dateCycle-type').value = 'Select frequency...';
    document.getElementById('add-date-title').value = '';
    document.getElementById('add-note-checkbox').checked = false;
    document.getElementById('add-date-note').value = '';

    console.log(`Stored dateCycle in calendar '${selCalendar}':`, dateCycle);
    displayMatchingDateCycle();
}


function fetchDateCycleCalendars() {
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));

    if (calendarKeys.length === 0) {
        console.log('No calendar data found in localStorage.');
        return [];
    }

    try {
        // Collect and combine all valid dateCycles from calendar arrays
        const allDateCycles = calendarKeys.reduce((acc, key) => {
            const calendarData = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(calendarData)) {
                // Filter out dateCycles marked for deletion
                const validDateCycles = calendarData.filter(dc => dc.delete !== "yes");
                acc.push(...validDateCycles); // Add valid dateCycles to the accumulator
            } else {
                console.log(`Invalid data format for key: ${key}`);
            }
            return acc;
        }, []);

        console.log('Fetched and combined valid dateCycles:', allDateCycles);
        return allDateCycles;
    } catch (error) {
        console.log('Error fetching dateCycles from localStorage: ' + error.message);
        return [];
    }
}








// Fetches dateCycles data from local storage
function fetchDateCycles() {
  const dateCyclesString = localStorage.getItem('dateCycles');

  if (!dateCyclesString) {
      return null;
  }

  try {
      const dateCycles = JSON.parse(dateCyclesString);
      if (Array.isArray(dateCycles)) {
          return dateCycles;
      } else {
          console.log('Stored data is not a valid array of dateCycles.');
          return null;
      }
  } catch (error) {
      console.log('Error parsing stored JSON: ' + error.message);
      return null;
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


function deleteDateCycle(id) {
    // Step 1: Retrieve all calendar keys from localStorage
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));

    if (calendarKeys.length === 0) {
        console.log("No calendar data found in storage.");
        return;
    }

    // Confirm with the user
    const userResponse = confirm('Are you sure you want to mark this event for deletion?');
    if (!userResponse) return; // If user clicks "Cancel", exit the function

    let found = false;

    // Step 2: Iterate through calendar arrays to find and mark the dateCycle
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');

        const dateCycleIndex = calendarData.findIndex(dc => dc.ID === id);
        if (dateCycleIndex !== -1) {
            // Step 3: Mark the dateCycle for deletion
            const dateCycle = calendarData[dateCycleIndex];
            dateCycle.delete = "yes"; // Add the delete property

            // Step 4: Update the localStorage with the modified calendar array
            localStorage.setItem(key, JSON.stringify(calendarData));

            console.log(`Marked dateCycle with ID: ${id} for deletion in calendar: ${key}`);
            found = true;

            // Break after marking the dateCycle
            break;
        }
    }

    // Handle case where the dateCycle ID was not found
    if (!found) {
        console.log(`No dateCycle found with ID: ${id}`);
        return;
    }

    // Step 5: Refresh the display
    const divElement = document.getElementById('current-datecycle-info2');
    if (divElement) {
        divElement.innerHTML = ""; // Clear any displayed info
    }

    // Refresh highlights and matching dateCycles
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

// Function to handle the addition of a new calendar.
function addNewCalendar() {
  const calendarNameInput = document.getElementById('calendarName');
  const calendarName = calendarNameInput.value;
  const color = document.getElementById('colorPicker').value;
  const isPublic = document.getElementById('publicCalendar').checked;

  const newCalendar = {
    id: generateID(),
    name: calendarName,
    color: color,
    public: isPublic ? 'yes' : 'no'
  };

  // alert(JSON.stringify(newCalendar, null, 2));

  userCalendars.push(newCalendar);
  localStorage.setItem('userCalendars', JSON.stringify(userCalendars));

  // Append the new calendar to the dropdown.
  const select = document.getElementById('select-calendar');
  const option = document.createElement('option');
  option.value = newCalendar.id;
  option.textContent = newCalendar.name;
  select.appendChild(option);

  // Make the newly added option the selected one.
  select.value = newCalendar.id;

  // Clear the calendarName input field.
  calendarNameInput.value = '';

  // Hide the form.
  document.getElementById('addNewCalendar').style.display = "none";
  document.getElementById('dateCycle-type').style.display = "block";
  document.getElementById('set-date').style.display = "block";

  alert('Your new personal Calendar has been added.  You can now add dateCycles to it.');

  showDateCycleSetter();

}

function populateDropdown() {

  // Set the year, month, and day fields using the global variable targetDate
  document.getElementById("year-field2").value = targetDate.getFullYear();
  document.getElementById("month-field2").value = targetDate.getMonth() + 1; // Months are 0-indexed in JavaScript
  document.getElementById("day-field2").value = targetDate.getDate();
  document.getElementById("dateCycle-type").value = 'One-time';
  const select = document.getElementById('select-calendar');
  const userCalendars = JSON.parse(localStorage.getItem('userCalendars')) || [];

  // 1. Clear any existing options
  select.innerHTML = '';

  // 2. Add the specific options with your desired order
  const defaultOptions = [
    { text: 'Select Calendar...', value: '', disabled: true }, // Set 'disabled' to true
    { text: 'My Calendar', value: 'My Calendar' }
  ];

  defaultOptions.forEach(optionData => {
    const option = document.createElement('option');
    option.textContent = optionData.text;
    option.value = optionData.value;
    
    if (optionData.disabled) {
      option.disabled = true;
    }
    
    select.appendChild(option);
  });

  // 3. Continue adding options from userCalendars
  userCalendars.forEach(calendar => {
    const option = document.createElement('option');
    option.value = calendar.id;
    option.textContent = calendar.name;
    select.appendChild(option);
  });

  // 4. Finally, add the "+ Add New Calendar" option at the end
  const addNewOption = document.createElement('option');
  addNewOption.textContent = '+ Add New Calendar';
  addNewOption.value = 'AddNew';
  select.appendChild(addNewOption);

  // 5. Select "My Calendar" by default
  select.value = 'My Calendar';
}

// Function to handle the dropdown change event
function handleAddNewCal() {
  const select = document.getElementById('select-calendar');
  const selectedValue = select.value;

  if (selectedValue === 'AddNew') {
    // Call the showAdderForm() function when "+ Add New Calendar" is selected
    showAdderForm();
  }
}

// Call the function on page load to populate the dropdown.
//populateDropdown();




//DELETE CALENDAR SELECTOR
function populateCalendarDropdown() {
  const selectElement = document.getElementById('calendarToDelete');
  const userCalendars = JSON.parse(localStorage.getItem('userCalendars')) || [];

  // 1. Clear existing options
  selectElement.innerHTML = '';

  // 2. Add the two specific options
  const defaultOptions = [
    {text: 'Select Calendar...', value: '', disabled: true, selected: true},
    {text: 'My Calendar', value: 'My Calendar'}
  ];

  defaultOptions.forEach(optionData => {
    const option = document.createElement('option');
    option.textContent = optionData.text;
    option.value = optionData.value;

    if (optionData.disabled) option.disabled = true;
    if (optionData.selected) option.selected = true;

    selectElement.appendChild(option);
  });

  // 3. Continue adding options from userCalendars
  userCalendars.forEach(calendar => {
      const option = document.createElement('option');
      option.value = calendar.id;
      option.textContent = calendar.name;
      selectElement.appendChild(option);
  });
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

// Call the populate function on DOMContentLoaded to ensure the dropdown is filled when the page loads
document.addEventListener("DOMContentLoaded", function() {
  populateCalendarDropdown();
});






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

        // Check for local data
        const localCalendars = fetchDateCycleCalendars();
        if (!localCalendars || localCalendars.length === 0) {
            alert('Sorry, you haven’t yet added a dateCycle, so there is nothing to sync! Add some events or select a public calendar to synchronize local and server calendars.');
            return;
        }

        // Fetch server calendar data
        const response = await fetch('https://gobrik.com/api/fetch_user_calendars.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buwana_id: buwanaId })
        });

        const serverData = await response.json();

        if (!serverData.success) {
            console.error('Server Error:', serverData.message);
            throw new Error(serverData.message || 'Failed to retrieve calendar data.');
        }

        const { personal_calendars, subscribed_calendars } = serverData;

        let lastSyncTs = null; // Variable to store the latest sync timestamp

        // Sync personal calendars
        for (const calendar of personal_calendars) {
            const calendarResponse = await fetch('https://gobrik.com/api/get_calendar_data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: buwanaId, calendar_name: calendar.calendar_name })
            });

            const calendarData = await calendarResponse.json();

            if (!calendarData.success) {
                console.error(`Failed to sync calendar: ${calendar.calendar_name}`, calendarData.message);
                continue;
            }

            const serverCalendar = calendarData.data?.events_json_blob || [];
            let localCalendar = fetchLocalCalendar(calendar.calendar_name);

            let isNewCalendar = false;

            // Check for unlinked calendars
            if (localCalendar && localCalendar.some(dc => dc.cal_id === '000')) {
                console.log(`Unlinked calendar detected: ${calendar.calendar_name}`);
                await handleNewOrUnlinkedCalendar(localCalendar, calendar.calendar_name, buwanaId);
                isNewCalendar = true;
            }

            if (!isNewCalendar) {
                // Filter localCalendar to ensure only relevant dateCycles are included
                //localCalendar = localCalendar.filter(dc => dc.cal_id === calendar.calendar_id);

                const mergedData = mergeDateCycles(serverCalendar, localCalendar);

                const serverUpdate = await updateServer(mergedData, calendar.calendar_name, buwanaId);

                if (serverUpdate && serverUpdate.last_updated) {
                    lastSyncTs = serverUpdate.last_updated; // Store the latest sync timestamp
                }

                updateLocal(mergedData, calendar.calendar_name, calendar.calendar_id);
            }
        }

        // Sync public calendars (read-only)
        for (const calendar of subscribed_calendars) {
            const calendarResponse = await fetch('https://gobrik.com/api/get_calendar_data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calendar_name: calendar.calendar_name })
            });

            const calendarData = await calendarResponse.json();

            if (!calendarData.success) {
                console.error(`Failed to fetch public calendar: ${calendar.calendar_name}`, calendarData.message);
                continue;
            }

            const publicCalendar = calendarData.data?.events_json_blob || [];
            updateLocal(publicCalendar, calendar.calendar_name, calendar.calendar_id);
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
        const response = await fetch('https://gobrik.com/api/update_calendar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buwana_id: buwanaId,
                calendar_name: calendarName,
                datecycles: dateCycles
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update server data.');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Unknown error occurred on server.');
        }

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



function strikeDateCycle(element) {
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

    // Step 3: Iterate through calendar arrays to find and update the dateCycle
    for (const key of calendarKeys) {
        const calendarData = JSON.parse(localStorage.getItem(key) || '[]');

        console.log(`Checking calendar: ${key}`, calendarData);

        const dateCycleIndex = calendarData.findIndex(dc => dc.ID === dateCycleID);
        if (dateCycleIndex !== -1) {
            // Step 4: Toggle the 'Completed' status
            const dateCycle = calendarData[dateCycleIndex];
            dateCycle.Completed = dateCycle.Completed === 'no' ? 'yes' : 'no';

            console.log(`Toggled 'Completed' status for dateCycle:`, dateCycle);

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
        console.error(`No dateCycle found with ID: ${dateCycleID}. Verify ID and localStorage data.`);
    }
}



