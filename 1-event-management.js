// MAnagement of DateCycles



function submitAddCycleForm() {
  // Check if all required fields are filled out
  var dayField = document.getElementById('day-field2').value;
  var monthField = document.getElementById('month-field2').value;
  var addDateTitle = document.getElementById('add-date-title').value;
  var dashOrNot = '-';

  if (!dayField || !monthField || !addDateTitle) {
    alert("Please be sure to fill out all the fields to add a new dateCycle to the Calendar.");
    return; // Exit the function early
  }

  // Get additional form inputs
  var selCalendarElement = document.getElementById('select-calendar');
  var selCalendar = selCalendarElement.options[selCalendarElement.selectedIndex].text; // Get the name of the calendar
  var dateCycleType = document.getElementById('dateCycle-type').value;

  // Handle "Monthly" Frequency
  var yearField, monthField;
  if (dateCycleType === 'Monthly') {
    yearField = '';
    monthField = '';
    dashOrNot = '';
  } else {
    monthField = document.getElementById('month-field2').value;
    yearField = dateCycleType === 'Annual' ? "" : (document.getElementById('year-field2').value || "");
  }

  var addNoteCheckbox = document.getElementById('add-note-checkbox').checked ? "Yes" : "No";
  var addDateNote = document.getElementById('add-date-note').value;
  var DateColorPicker = document.getElementById('DateColorPicker').value;

  // Get the stored dateCycles and find the maximum ID
  var storedDateCycles = JSON.parse(localStorage.getItem('dateCycles') || '[]');
  var maxID = 0;
  storedDateCycles.forEach(function(dc) {
    var id = parseInt(dc.ID || "0");
    if (id > maxID) {
      maxID = id;
    }
  });

  var newID = (maxID + 1).toString().padStart(3, '0');

  // Get the current date and time for last_edited
  var currentDateTime = new Date().toISOString();

  // Create the dateCycle object
  var dateCycle = {
    "ID": newID,
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
  };

  // Store the object in the browser's local storage
  storedDateCycles.push(dateCycle);
  localStorage.setItem('dateCycles', JSON.stringify(storedDateCycles));

  // Clear the form fields
  document.getElementById('select-calendar').value = 'Select Calendar...';
  document.getElementById('dateCycle-type').value = 'Select frequency...';
  document.getElementById('add-date-title').value = '';
  document.getElementById('add-note-checkbox').checked = false;
  document.getElementById('add-date-note').value = '';

  console.log("Stored dateCycle:", dateCycle);
  displayMatchingDateCycle();
}


function fetchDateCycles() {
    const dateCyclesString = localStorage.getItem('dateCycles');

    if (!dateCyclesString) {
        console.log('No dateCycles data found in localStorage.');
        return null;
    }

    try {
        const dateCycles = JSON.parse(dateCyclesString);
        if (Array.isArray(dateCycles)) {
            console.log('Here are the Fetched dateCycles:', dateCycles);
            return dateCycles;
        } else {
            console.log('Stored data is not a valid array of dateCycles.');
            return null;
        }
    } catch (error) {
        console.log('Error parsing stored JSON for dateCycles: ' + error.message);
        return null;
    }
}






async function highlightDateCycles() {
  // 1. Remove the "date_event" class from all previously highlighted elements
  const elementsWithDateEvent = Array.from(document.querySelectorAll("div.date_event, path.date_event"));
  elementsWithDateEvent.forEach(element => {
    element.classList.remove("date_event");
  });

  // 2. Fetch date cycles
  const dateCycleEvent = await fetchDateCycles();

  if (!dateCycleEvent) {
    console.log("No dateCycles found in storage.");
    return;
  }

  // 3. Get all paths with IDs
  const allPaths = Array.from(document.querySelectorAll("path[id]"));

  dateCycleEvent.forEach(dateCycle => {
    // Normalize `Date` to ensure consistent formatting
    const formattedDate = dateCycle.Date.replace(/^-/, '').replace(/-$/, ''); // Remove leading/trailing dashes

    // Process for exact date match
    const exactDateMatchPaths = allPaths.filter(path => {
      const pathId = path.id.replace(/^-/, '').replace(/-$/, ''); // Normalize path ID
      return pathId.includes(formattedDate);
    });

    // Process for annual cycles
    const annualCyclePaths = allPaths.filter(path => {
      const pathId = path.id.replace(/^-/, '').replace(/-$/, ''); // Normalize path ID
      return dateCycle.Frequency === 'Annual' && pathId.includes(`-${dateCycle.Day}-${dateCycle.Month}-`);
    });

    // Combine both path arrays
    const combinedPaths = [...exactDateMatchPaths, ...annualCyclePaths];

    combinedPaths.forEach(path => {
      const isDayMarker = path.id.endsWith('-day-marker');
      const currentTitle = path.getAttribute('title');

      // Update title for paths that are not day markers
      if (!isDayMarker && currentTitle && !currentTitle.includes('|')) {
        const newTitle = `${dateCycle.Event_name} | ${currentTitle}`;
        path.setAttribute('title', newTitle);
      }

      // Add "date_event" class only to paths ending with "-day-marker"
      if (isDayMarker) {
        path.classList.add("date_event");
      }
    });
  });
}



function displayMatchingDateCycle() {
  const dateCycles = fetchDateCycles();
  if (!dateCycles) {
    console.log("No dateCycles found in storage.");
    return;
  }

  // Separate pinned and unpinned dateCycles
  const pinnedDateCycles = dateCycles.filter(dc =>
    (dc.Pinned || '').trim().toLowerCase() === 'yes'
  );

  const unpinnedDateCycles = dateCycles.filter(dc =>
    (dc.Pinned || '').trim().toLowerCase() !== 'yes'
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

  // Update `pinned-datecycles` with pinned dateCycles only if it's today
  const pinnedDiv = document.getElementById('pinned-datecycles');
  if (pinnedDiv) {
    pinnedDiv.innerHTML = ""; // Clear previous data
    if (isToday) {
      pinnedDiv.style.display = pinnedDateCycles.length ? 'block' : 'none';
      pinnedDateCycles.forEach(dc => writeMatchingDateCycles(pinnedDiv, dc));
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
    </div>
  `;
}










function strikeDateCycle(element) {
  // Retrieve stored dateCycles from localStorage
  var storedDateCycles = JSON.parse(localStorage.getItem('dateCycles') || '[]');

  // Find the ancestor .date-info div of the clicked element
  const dateInfoDiv = element.closest('.date-info');

  if (dateInfoDiv) {
    // Get the ID from the class list of dateInfoDiv
    const dateCycleID = dateInfoDiv.classList[1];

    // Find the corresponding dateCycle object
    let dateCycleIndex = storedDateCycles.findIndex(dc => dc.ID === dateCycleID);
    if (dateCycleIndex !== -1) {
      // Toggle the 'Completed' status
      storedDateCycles[dateCycleIndex].Completed = storedDateCycles[dateCycleIndex].Completed === 'no' ? 'yes' : 'no';

      // Update the localStorage with the new state
      localStorage.setItem('dateCycles', JSON.stringify(storedDateCycles));

      displayMatchingDateCycle();

      // Show an alert with the updated dateCycle JSON
      // alert(JSON.stringify(storedDateCycles[dateCycleIndex], null, 2));
    }
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
        .filter(dc => {
            const normalizedDate = (dc.Date || '').replace(/^-/, '').replace(/-$/, '');
            const normalizedTargetDate = dashedDate.replace(/^-/, '').replace(/-$/, '');
            return normalizedTargetDate === normalizedDate;
        }) // Match the target date
        .map(dc => ({
            ...dc,
            monthName: dc.Completed === 'no' ? monthsNames[month - 1] : '' // Add month name if not completed
        }))
        .sort((a, b) => (colorPriority[a.calendar_color.toLowerCase()] || 99) - (colorPriority[b.calendar_color.toLowerCase()] || 99)); // Sort by color priority
}





function pinThisDatecycle(element) {
    // Retrieve stored dateCycles from localStorage
    var storedDateCycles = JSON.parse(localStorage.getItem('dateCycles') || '[]');

    // Find the ancestor .date-info div of the clicked element
    const dateInfoDiv = element.closest('.date-info');

    if (dateInfoDiv) {
        // Get the ID from the class list of dateInfoDiv
        const dateCycleID = dateInfoDiv.classList[1];

        // Find the corresponding dateCycle object
        let dateCycleIndex = storedDateCycles.findIndex(dc => dc.ID === dateCycleID);
        if (dateCycleIndex !== -1) {
            // Toggle the 'Pinned' status (add if not present)
            let currentDateCycle = storedDateCycles[dateCycleIndex];
            currentDateCycle.Pinned = currentDateCycle.Pinned === 'yes' ? 'no' : 'yes';

            // Update the localStorage with the new state
            localStorage.setItem('dateCycles', JSON.stringify(storedDateCycles));

            displayMatchingDateCycle();

        }
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
  alert('hello!');
  
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
  // Fetch dateCycles from localStorage
  const dateCycles = JSON.parse(localStorage.getItem('dateCycles')) || [];
  const dateCycle = dateCycles.find(dc => dc.ID === dateCycleID);

  if (!dateCycle) {
    console.log(`No dateCycle found with ID: ${dateCycleID}`);
    return;
  }

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
      <button type="button" id="edit-confirm-dateCycle" class="confirmation-blur-button enabled" style="width: 100%;" onclick="saveDateCycleEditedChanges('${dateCycleID}')">🐿️ Save Changes</button>
    </div>
  `;

  // Show the modal
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


//FIX:  Needs a synking solution

function deleteDateCycle(id) {
  const dateCycles = fetchDateCycles();
  if (!dateCycles) {
      console.log("No dateCycles found in storage.");
      return;
  }

  // Confirm with the user
  const userResponse = confirm('Are you sure you want to completely delete this event?');
  if (!userResponse) return; // If user clicks "Cancel", exit the function
  
  // Remove the dateCycle with the provided ID
  const updatedDateCycles = dateCycles.filter(dc => dc.ID !== id);
  localStorage.setItem('dateCycles', JSON.stringify(updatedDateCycles));
  
  // Optionally: Refresh the display or show a message to user
  console.log(`Removed dateCycle with ID: ${id}`);
  
  // Refreshing the display (assuming you want to remove the displayed dateCycle once deleted)
  const divElement = document.getElementById('current-datecycle-info2');
  divElement.innerHTML = "";
  
  highlightDateCycles();
  displayMatchingDateCycle();
}
 


function clearAllDateCycles() {
  let hasDateCycles = localStorage.getItem('dateCycles');
  let hasUserCalendars = localStorage.getItem('userCalendars');
  let hasTourToken = localStorage.getItem('tourToken');
  let hasEarthenRegistration = localStorage.getItem('earthenRegistration'); // Added line for earthenRegistration

  if (hasDateCycles || hasUserCalendars || hasTourToken || hasEarthenRegistration) { // Updated condition to include hasEarthenRegistration
    // Ask the user for confirmation
    const userConfirmed = confirm('Are you certain you want to delete all your EarthCal data? This can\'t be undone!');

    if (userConfirmed) {
      if (hasDateCycles) {
        localStorage.removeItem('dateCycles');
      }

      if (hasUserCalendars) {
        localStorage.removeItem('userCalendars');
      }

      if (hasTourToken) { // Ensure tourToken is specifically checked
        localStorage.removeItem('tourToken');
      }

      if (hasEarthenRegistration) { // Remove earthenRegistration if it exists
        localStorage.removeItem('earthenRegistration');
      }

      alert('All EarthCal data has been cleared from storage.');
    } else {
      alert('Deletion cancelled. Your EarthCal data and tourToken are safe.');
    }
  } else {
    alert('No EarthCal data found in storage.');
  }

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

        // Fetch subscribed calendars
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
            const localDateCycles = fetchDateCycles() || [];
            const mergedData = mergeDateCycles(serverCalendar, localDateCycles);

            // Update the server and local storage
            await updateServer(mergedData, calendar.calendar_name, buwanaId);
            updateLocal(mergedData, calendar.calendar_name);
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
            updateLocal(publicCalendar, calendar.calendar_name); // Update local storage only
        }

        alert('DateCycles have been successfully synced!');
    } catch (error) {
        console.error('Error during sync:', error);
        alert('An error occurred while syncing your calendars. Please try again.');
    }
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

        // Update the local metadata with the server's last_updated timestamp
        localStorage.setItem('dateCycles_last_modified', result.last_updated);

        // Update last sync timestamp in local storage
        const lastSyncTs = new Date(result.last_updated).toISOString();
        localStorage.setItem('last_sync_ts', lastSyncTs);

        // Optionally update the UI to show the last sync time
        showLastSynkTimePassed(lastSyncTs);

        console.log('Server successfully updated with DateCycles.');
    } catch (error) {
        console.error('Error in updateServer:', error);
        throw error;
    }
}



function updateLocal(dateCycles, calendarName) {
    try {
        // Retrieve existing local dateCycles
        const existingDateCycles = fetchDateCycles() || [];

        // Filter out DateCycles from the specific calendar being updated
        const filteredDateCycles = existingDateCycles.filter(dc => dc.selectCalendar !== calendarName);

        // Combine the filtered data with the new data
        const updatedDateCycles = [...filteredDateCycles, ...dateCycles];

        // Save the updated DateCycles to localStorage
        localStorage.setItem('dateCycles', JSON.stringify(updatedDateCycles));

        // Update the last modified timestamp for local storage
        const lastModifiedTs = new Date().toISOString();
        localStorage.setItem('dateCycles_last_modified', lastModifiedTs);

        console.log(`Local storage updated for calendar: ${calendarName}`);
    } catch (error) {
        console.error('Error updating local storage:', error);
    }
}




//*********************************
// SYNC HELPER FUNCTIONS
//*********************************


function mergeDateCycles(serverData, localData) {
    const mergedData = [];

    // Combine all data and prioritize the latest by 'last_edited'
    const allCycles = [...serverData, ...localData];

    // Use a map to store the most recent version of each DateCycle
    const latestCycles = new Map();

    allCycles.forEach(cycle => {
        const existing = latestCycles.get(cycle.ID);
        if (!existing || new Date(cycle.last_edited) > new Date(existing.last_edited)) {
            latestCycles.set(cycle.ID, cycle);
        }
    });

    // Push the unique and latest cycles into the merged data
    mergedData.push(...latestCycles.values());

    return mergedData;
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


function saveDateCycleEditedChanges(dateCycleID) {
  // Retrieve the stored dateCycles from localStorage
  const dateCycles = JSON.parse(localStorage.getItem('dateCycles')) || [];
  const dateCycleIndex = dateCycles.findIndex(dc => dc.ID === dateCycleID);

  // If no matching dateCycle is found, show an error message on the button
  if (dateCycleIndex === -1) {
    const confirmButton = document.getElementById('edit-confirm-dateCycle');
    confirmButton.textContent = "Error Updating DateCycle";
    return;
  }

  // Get updated values from the form
  const updatedTitle = document.getElementById('edit-add-date-title').value;
  const updatedDay = document.getElementById('edit-day-field2').value;
  const updatedMonth = document.getElementById('edit-month-field2').value;
  const updatedYear = document.getElementById('edit-year-field2').value || ""; // Empty if not selected
  const updatedFrequency = document.getElementById('edit-dateCycle-type').value;
  const updatedCalendarColor = document.getElementById('edit-DateColorPicker').value;
  const updatedComments = document.getElementById('edit-add-date-note').value;

  // Get the current date and time for 'last_edited'
  const currentDateTime = new Date().toISOString();

  // Update the dateCycle object
  const updatedDateCycle = {
    ...dateCycles[dateCycleIndex], // Preserve existing data
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
  dateCycles[dateCycleIndex] = updatedDateCycle;

  // Save the updated array back to localStorage
  localStorage.setItem('dateCycles', JSON.stringify(dateCycles));

  // Hide the edit modal after successful update
  const addNewCalendarDiv = document.getElementById('edit-addNewCalendar');
  if (addNewCalendarDiv) {
    addNewCalendarDiv.style.display = "none";
  }

  // Refresh UI
  displayMatchingDateCycle();
  closeTheModal();
}



function strikeDateCycle(element) {
  // Retrieve stored dateCycles from localStorage
  const storedDateCycles = JSON.parse(localStorage.getItem('dateCycles') || '[]');

  // Find the ancestor .date-info div of the clicked element
  const dateInfoDiv = element.closest('.date-info');

  if (dateInfoDiv) {
    // Get the ID from the class list of dateInfoDiv
    const dateCycleID = dateInfoDiv.classList[1];

    // Find the corresponding dateCycle object
    const dateCycleIndex = storedDateCycles.findIndex(dc => dc.ID === dateCycleID);
    if (dateCycleIndex !== -1) {
      // Toggle the 'Completed' status
      storedDateCycles[dateCycleIndex].Completed = storedDateCycles[dateCycleIndex].Completed === 'no' ? 'yes' : 'no';

      // Update 'last_edited' with the current date and time
      storedDateCycles[dateCycleIndex].last_edited = new Date().toISOString();

      // Update the localStorage with the new state
      localStorage.setItem('dateCycles', JSON.stringify(storedDateCycles));

      // Refresh the UI
      displayMatchingDateCycle();
    }
  }
}

