


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


//ADD A DATECYCLE -- triggered on submit to add dateCyle to cache and page
function submitAddCycleForm() {
  // First, we'll check if all required fields are filled out
  var dayField = document.getElementById('day-field2').value;
  var monthField = document.getElementById('month-field2').value;
  var addDateTitle = document.getElementById('add-date-title').value;
  var dashOrNot = '-';
  
  if (!dayField || !monthField || !addDateTitle) {
    alert("Please be sure to fill out all the fields to add a new dateCycle to the Calendar.");
    //return;  // Exit the function early
  }

  // If the required fields are filled out, then continue with the rest of the function
  var selCalendarElement = document.getElementById('select-calendar');
  var selCalendar = selCalendarElement.options[selCalendarElement.selectedIndex].text; // Get the name of the calendar, not the ID
  var dateCycleType = document.getElementById('dateCycle-type').value;

  // Add logic to set Year to blank if the Frequency is 'Annual'
  var yearField = dateCycleType === 'Annual' ? "" : (document.getElementById('year-field2').value || "");
  
    // Logic for "Monthly" Frequency
    var yearField, monthField;
    if (dateCycleType === 'Monthly') {
      yearField = '';
      monthField = '';
      dashOrNot = '';
    } else {
      // Get values from the form
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

  // Create an object with the data
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
  // 1. Scan the entire HTML document and remove the class "date_event" from date paths
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

  const allPaths = Array.from(document.querySelectorAll("path[id]"));

  dateCycleEvent.forEach(dateCycle => {
    // Process for exact date match
    const exactDateMatchPaths = allPaths.filter(path => path.id.includes(dateCycle.Date));

    // Process for annual cycles
    const annualCyclePaths = allPaths.filter(path =>
      dateCycle.Frequency === 'Annual' &&
      path.id.includes(`-${dateCycle.Day}-${dateCycle.Month}-`)
    );

    // Combine both path arrays
    const combinedPaths = [...exactDateMatchPaths, ...annualCyclePaths];

    combinedPaths.forEach(path => {
      const isDayMarker = path.id.endsWith('-day-marker');
      const currentTitle = path.getAttribute('title');

      // Only change the title for paths ending with "-day" and if the original title does not include "|"
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





// MATCH AND SHOW INFO OF CURRENT DATECYCLE

// Fetch and write info of matching dateCycles  :  Is something missing here?
function displayMatchingDateCycle() {
  const dateCycles = fetchDateCycles();
  if (!dateCycles) {
      console.log("No dateCycles found in storage.");
      return;
  }

  const matchingDateCycles = findMatchingDateCycles(dateCycles);
  if (!matchingDateCycles.length) {
    const currentDateCycleInfo = document.getElementById('current-datecycle-info2');
    if (currentDateCycleInfo) {
      currentDateCycleInfo.style.display = 'none';
    }
    console.log("No matching dateCycles found.");
    return;
  }

  // Clear out any previous data
  const divElement = document.getElementById('current-datecycle-info2');
  if (divElement) {
    divElement.innerHTML = "";
    divElement.style.display = 'block';
  }

  // Write matching dateCycles to the div
  matchingDateCycles.forEach(dc => writeMatchingDateCycles(divElement, dc));
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
        .filter(dc => dashedDate.includes(dc.Date)) // Match the target date
        .map(dc => ({
            ...dc,
            monthName: dc.Completed === 'no' ? monthsNames[month - 1] : '' // Add month name if not completed
        }))
        .sort((a, b) => (colorPriority[a.calendar_color.toLowerCase()] || 99) - (colorPriority[b.calendar_color.toLowerCase()] || 99)); // Sort by color priority
}


// Write the provided dateCycle to the provided div element
function writeMatchingDateCycles(divElement, dateCycle) {
    // Determine styles based on whether the dateCycle is completed or not
    const eventNameStyle = dateCycle.Completed === 'yes' ? 'text-decoration: line-through;' : '';
    let calendarColorContent;

    // Set content based on Completed and Pinned status
    if (dateCycle.Completed === 'yes') {
        calendarColorContent = '✔';
    } else if (dateCycle.Pinned === 'yes') {
        calendarColorContent = '📌';
    } else {
        calendarColorContent = '⬤';
    }

    divElement.innerHTML += `
      <div class="date-info ${dateCycle.ID}" onclick="editDateCycle('${dateCycle.ID}')">
          <div class="current-date-info-title" style="${eventNameStyle};color:${dateCycle.calendar_color};">
              ${dateCycle.Completed !== 'yes' ? `<button
                  class="pin-button"
                  title="${dateCycle.Pinned === 'yes' ? 'Unpin this!' : 'Pin this!'}"
                  onclick="pinThisDatecycle(this); event.stopPropagation();"
                  onmouseover="this.textContent = '${dateCycle.Pinned === 'yes' ? '❌' : '📌'}';"
                  onmouseout="this.textContent = '${calendarColorContent}';"
                  style="font-size: small; margin: 0px 4px 8px 0px; border: none; background: none; cursor: pointer; color: inherit;"
              >${calendarColorContent}</button>` : `<span style="font-size: small; margin: 0px 4px 8px 0px;">${calendarColorContent}</span>`}
              ${dateCycle.Event_name}
          </div>
          <div class="current-datecycle-data">
              <div class="current-date-calendar">${dateCycle.selectCalendar}</div>
              <div>|</div>
              <div class="current-date-frequency">${dateCycle.Frequency} Event</div>
          </div>
          <div class="current-date-notes" style="height:fit-content;">${dateCycle.Comments}</div>
          <div style="display:flex;flex-flow:row;">
              <div class="forward-button-datecycle" title="➡️ Push to today" onclick="push2today('${dateCycle.ID}'); event.stopPropagation();">➜</div>
              <div class="close-button-datecycle" title="✅ Done! Hide." onclick="strikeDateCycle(this); event.stopPropagation();">✔</div>
              <div class="delete-button-datecycle" title="❌ Remove from ${dateCycle.selectCalendar}" onclick="deleteDateCycle('${dateCycle.ID}'); event.stopPropagation();">✘</div>
          </div>
      </div>
    `;
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

            // Optional: Show an alert with the updated dateCycle JSON
            // alert(JSON.stringify(storedDateCycles[dateCycleIndex], null, 2));
        }
    }
}







// Open modal dialogue to let the user edit the dateCycle:
// Function to open modal dialogue and populate form with dateCycle data for editing
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

    <select id="edit-dateCycle-type" class="blur-form-field" style="font-size: 1em; text-align: center; height: 35px; margin: auto; margin-bottom: 10px;width: 100%;" onchange="showYearMonthDaySetter()">
      <option value="" disabled>Select frequency...</option>
      <option value="One-time" ${dateCycle.Frequency === 'One-time' ? 'selected' : ''}>One-time</option>
      <option value="Annual" ${dateCycle.Frequency === 'Annual' ? 'selected' : ''}>Annual</option>
    </select>

    <div id="edit-dateCycle-year-option" >
      <select name="year" id="edit-year-field2" style="width: 100%; font-size: 1em; text-align: center; height: 35px; margin-top: 10px;" class="blur-form-field">
        <option value="" disabled>Select year...</option>
        ${[2023, 2024, 2025, 2026].map(year => `<option value="${year}" ${dateCycle.Year === String(year) ? 'selected' : ''}>${year}</option>`).join('')}
      </select>
    </div>

    <div id="edit-set-date">
      <div class="date-search fields" style="display: flex; flex-flow: row; margin: auto; justify-content: center;" >
        <select name="day" id="edit-day-field2" style="width: 22%; margin-right: 10px; font-size: 1em; text-align: center; height: 35px;margin-left: 0px;" class="blur-form-field">
          <option value="" disabled>Select day...</option>
          ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${dateCycle.Day === String(i + 1) ? 'selected' : ''}>${i + 1}</option>`).join('')}
        </select>
        <select name="month" id="edit-month-field2" style="font-size: 1em; text-align: center; height: 35px;margin-right: 0px;" class="blur-form-field">
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
      <button type="button" id="edit-confirm-dateCycle" class="confirmation-blur-button" style="width: 100%;" onclick="saveDateCycleEditedChanges('${dateCycleID}')">Save Changes</button>
    </div>
  `;

  // Show the modal
  const modal = document.getElementById('form-modal-message');
  modal.classList.remove('modal-hidden');
  modal.classList.add('modal-visible');
  document.getElementById("page-content").classList.add("blur");
}


// Function to save edited dateCycle changes
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

  // Update the dateCycle object
  const updatedDateCycle = {
    ...dateCycles[dateCycleIndex],  // Preserve existing data
    Event_name: updatedTitle,
    Day: updatedDay,
    Month: updatedMonth,
    Year: updatedYear,
    Date: `-${updatedDay}-${updatedMonth}${updatedYear ? '-' + updatedYear : ''}`,
    Frequency: updatedFrequency,
    calendar_color: updatedCalendarColor,
    Comments: updatedComments
  };

  // Replace the original dateCycle with the updated version
  dateCycles[dateCycleIndex] = updatedDateCycle;

  // Save the updated array back to localStorage
  localStorage.setItem('dateCycles', JSON.stringify(dateCycles));

  // Hide the edit-addNewCalendar div after successful completion
  const addNewCalendarDiv = document.getElementById('edit-addNewCalendar');
  if (addNewCalendarDiv) {
    addNewCalendarDiv.style.display = "none";
  }

  // Close modal, unblur page, and refresh the display
  const modal = document.getElementById('form-modal-message');
  modal.classList.add('modal-hidden');
  document.getElementById("page-content").classList.remove("blur");

  // Run the specified functions to update UI
  closeAddCycle();
  highlightDateCycles();
  displayMatchingDateCycle();
  closeTheModal();
}





















function closeDatecycleInfo(element) {
  const dateInfoDiv = element.closest('.date-info');
  if (dateInfoDiv) {
    dateInfoDiv.style.display = 'none';
  }
}



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







//NEW

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




//DELETE SLECTOR
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





// //PUSH DATE TO TOMORRRW

// function push2tomorrow(id) {
//   const dateCycles = fetchDateCycles();
//   if (!dateCycles) {
//     console.log("No dateCycles found in storage.");
//     return;
//   }

//   const dateCycle = dateCycles.find(dc => dc.ID === id);
//   if (!dateCycle) {
//     console.log("No dateCycle found with the provided ID.");
//     return;
//   }

//   // Create a Date object for the current dateCycle
//   const currentDate = new Date(dateCycle.Year, dateCycle.Month - 1, dateCycle.Day);
  
//   // Add one day
//   currentDate.setDate(currentDate.getDate() + 1);
  
//   // Update the dateCycle object
//   dateCycle.Day = currentDate.getDate();
//   dateCycle.Month = currentDate.getMonth() + 1; // Months are zero-indexed in JavaScript Dates
//   dateCycle.Year = currentDate.getFullYear();
//   dateCycle.Date = `-${dateCycle.Day}-${dateCycle.Month}-${dateCycle.Year}`; // Update the Date string as well
  
//   // Save the updated array back to localStorage
//   localStorage.setItem('dateCycles', JSON.stringify(dateCycles));
  
//   // Optionally: Refresh the display or show a message to user
//   console.log(`Pushed dateCycle with ID: ${id} to tomorrow`);
  
//   // Refreshing the display
//   const divElement = document.getElementById('current-datecycle-info2');
//   if (divElement) {
//     divElement.innerHTML = "";  
//     highlightDateCycles();
//     displayMatchingDateCycle();
//   }
// }


// PUSH DATE TO TODAY

function push2today(id) {
  const dateCycles = fetchDateCycles();
  if (!dateCycles) {
    console.log("No dateCycles found in storage.");
    return;
  }

  const dateCycle = dateCycles.find(dc => dc.ID === id);
  if (!dateCycle) {
    console.log("No dateCycle found with the provided ID.");
    return;
  }

  // Create a Date object for today's date
  const currentDate = new Date();
  
  // No need to add one day, as we're setting it to today
  
  // Update the dateCycle object
  dateCycle.Day = currentDate.getDate();
  dateCycle.Month = currentDate.getMonth() + 1; // Months are zero-indexed in JavaScript Dates
  dateCycle.Year = currentDate.getFullYear();
  dateCycle.Date = `-${dateCycle.Day}-${dateCycle.Month}-${dateCycle.Year}`; // Update the Date string as well
  
  // Save the updated array back to localStorage
  localStorage.setItem('dateCycles', JSON.stringify(dateCycles));
  
  // Optionally: Refresh the display or show a message to user
  console.log(`Updated dateCycle with ID: ${id} to today`);
  
  // Refreshing the display
  const divElement = document.getElementById('current-datecycle-info2');
  if (divElement) {
    divElement.innerHTML = "";  
    highlightDateCycles();
    displayMatchingDateCycle();
  }
}



function closeDatecycleInfo(element) {
  const dateInfoDiv = element.closest('.date-info');
  if (dateInfoDiv) {
    dateInfoDiv.style.display = 'none';
  }
}

// // Wait for the DOM to be fully loaded
// document.addEventListener('DOMContentLoaded', function() {
//   // Attach an event listener to the form
//   document.getElementById('calendar-adding-form').addEventListener('keypress', function(event) {
//     // Check if the Enter key was pressed
//     if (event.key === 'Enter') {
//       // Prevent the default form submission behavior
//       event.preventDefault();
//       // Call the addNewCalendar function
//       addNewCalendar();
//     }
//   });
// });

// // Your addNewCalendar function goes here
// function addNewCalendar() {
//   // Function logic
// }



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
        const localDateCycles = fetchDateCycles() || [];
        const localCalendars = [...new Set(localDateCycles.map(dc => dc.selectCalendar))];
        const buwanaId = localStorage.getItem('buwana_id');

        if (!buwanaId) {
            alert('Buwana ID is missing. Please log in again.');
            return;
        }

        const response = await fetch('https://gobrik.com/api/get_calendar_data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buwana_id: buwanaId })
        });

        const serverData = await response.json();
        if (!serverData.success) {
            console.error('Server Error:', serverData.message);
            throw new Error(serverData.message || 'Failed to retrieve calendar data.');
        }

        const serverCalendars = serverData.data.map(c => c.calendar_name);
        const unsyncedCalendars = localCalendars.filter(name => !serverCalendars.includes(name));

        if (unsyncedCalendars.length > 0) {
            console.log('Unsynced Calendars Detected:', unsyncedCalendars);
            const confirmSync = confirm(
                `Looks like ${unsyncedCalendars.join(', ')} have not yet been synced with your Buwana account! Shall we go ahead and sync them?`
            );

            if (confirmSync) {
                for (const calendarName of unsyncedCalendars) {
                    const createResponse = await fetch('https://gobrik.com/api/create_calendar.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            buwana_id: buwanaId,
                            calendar_name: calendarName,
                            calendar_color: 'red', // Example value
                            calendar_public: 0 // Example value
                        })
                    });

                    const createData = await createResponse.json();
                    if (!createData.success) {
                        console.error('Error Creating Calendar:', createData.message);
                        throw new Error(`Failed to create calendar: ${calendarName}`);
                    }
                }

                alert('Unsynced calendars have been successfully created and synced!');
            }
        }

        alert('DateCycles have been successfully synced!');
    } catch (error) {
        console.error('Error during sync:', error);
        alert('An error occurred while syncing your calendars. Please try again.');
    }
}


        // Step 4: Compare and sync dateCycles
        // Fetch server calendar metadata
        const serverCalendarsMetadata = serverData.data;

        for (const localCalendarName of localCalendars) {
            const serverCalendar = serverCalendarsMetadata.find(c => c.calendar_name === localCalendarName);
            const localDateCyclesForCalendar = localDateCycles.filter(dc => dc.selectCalendar === localCalendarName);

            if (serverCalendar) {
                const serverLastUpdated = new Date(serverCalendar.last_updated);
                const localLastModified = new Date(localStorage.getItem('dateCycles_last_modified') || new Date());

                if (localLastModified > serverLastUpdated) {
                    // Local is newer; update the server
                    await updateServer(localDateCyclesForCalendar, localCalendarName, buwanaId);
                } else if (serverLastUpdated > localLastModified) {
                    // Server is newer; update local
                    await updateLocal(serverCalendar.events_json_blob, localCalendarName);
                }
            }
        }

        alert('DateCycles have been successfully synced!');
    } catch (error) {
        console.error('Error during sync:', error);
        alert('An error occurred while syncing your calendars. Please try again.');
    }
}

async function updateServer(dateCycles, calendarName, buwanaId) {
    // Update the server with the provided dateCycles
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

    // Update the local metadata with the new server's last_updated timestamp
    localStorage.setItem('dateCycles_last_modified', result.last_updated);
}

function updateLocal(serverDateCycles, calendarName) {
    // Update the local storage with the provided dateCycles
    const existingDateCycles = fetchDateCycles() || [];
    const filteredDateCycles = existingDateCycles.filter(dc => dc.selectCalendar !== calendarName);
    const updatedDateCycles = [...filteredDateCycles, ...serverDateCycles];

    localStorage.setItem('dateCycles', JSON.stringify(updatedDateCycles));
    localStorage.setItem('dateCycles_last_modified', new Date().toISOString());
}

