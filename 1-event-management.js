


// Function to show the add-note-check-boxed div and confirm-dateCycle button
function showAddNoteCheckbox() {
  const addDateTitleTextarea = document.getElementById('add-date-title');
  const addNoteCheckboxDiv = document.getElementById('add-note-check-boxed');
  const confirmDateCycleButton = document.getElementById('confirm-dateCycle');

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
  
  if (!dayField || !monthField || !addDateTitle) {
    alert("Please be sure to fill out all the fields to add a new dateCycle to the Calendar.");
    //return;  // Exit the function early
  }

  // If the required fields are filled out, then continue with the rest of the function
  var selCalendarElement = document.getElementById('select-calendar');
  var selCalendar = selCalendarElement.options[selCalendarElement.selectedIndex].text; // Get the name of the calendar, not the ID
  var dateCycleType = document.getElementById('dateCycle-type').value;
  var yearField = document.getElementById('year-field2').value || "";
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
    "Date": `-${dayField}-${monthField}-${yearField}`,
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
  // document.getElementById('year-field2').value = '';
  // document.getElementById('day-field2').value = '';
  // document.getElementById('month-field2').value = '';
  document.getElementById('add-date-title').value = '';
  document.getElementById('add-note-checkbox').checked = false;
  document.getElementById('add-date-note').value = '';

  // Set elements to display none
  // document.getElementById('year-field2').style.display = 'none';
  // document.getElementById('set-date').style.display = 'none';
  // document.getElementById('add-date-title').style.display = 'none';
  // document.getElementById('add-note-check-boxed').style.display = 'none';

//alert("Stored dateCycle: " + JSON.stringify(dateCycle)); 
//console.log("Stored dateCycle:", dateCycle);
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


/*to be updated once date's have their highlight flagger.*/

// async function highlightDateCycles() {
//   // 1. Scan the entire HTML document and remove the class "date_event" from divs or paths
//   const elementsWithDateEvent = Array.from(document.querySelectorAll("div.date_event, path.date_event"));
  
//   elementsWithDateEvent.forEach(element => {
//     element.classList.remove("date_event");
//   });

//   // 2. Continue with your original function
//   const dateCycleEvent = await fetchDateCycles();

//   if (!dateCycleEvent) {
//       console.log("No dateCycles found in storage.");
//       return;
//   }

//   const allPaths = Array.from(document.querySelectorAll("path[id]"));

//   dateCycleEvent.forEach(dateCycle => {
//     const datecyclePaths = allPaths.filter(path => path.id.includes(dateCycle.Date));

//     datecyclePaths.forEach(datecyclePath => {
//       const currentTitle = datecyclePath.getAttribute('title');

//       // Only change the title if the original title does not include "|"
//       if (!currentTitle.includes('|')) {
//         const newTitle = `${dateCycle.Event_name} | ${currentTitle}`;
//         datecyclePath.setAttribute('title', newTitle);
//       }

//       datecyclePath.classList.add("date_event");
//     });
//   });
// }


async function highlightDateCycles() {
  // 1. Scan the entire HTML document and remove the class "date_event" from date paths
  const elementsWithDateEvent = Array.from(document.querySelectorAll("div.date_event, path.date_event"));
  
  elementsWithDateEvent.forEach(element => {
    element.classList.remove("date_event");
  });

  // 2. Continue with your original function
  const dateCycleEvent = await fetchDateCycles();

  if (!dateCycleEvent) {
      console.log("No dateCycles found in storage.");
      return;
  }

  const allPaths = Array.from(document.querySelectorAll("path[id]"));

  dateCycleEvent.forEach(dateCycle => {
    const datecyclePaths = allPaths.filter(path => path.id.includes(dateCycle.Date));

    datecyclePaths.forEach(datecyclePath => {
      const isDayMaker = datecyclePath.id.endsWith('-day-marker');
      const currentTitle = datecyclePath.getAttribute('title');

      // Only change the title for paths ending with "-day" and if the original title does not include "|"
      if (!isDayMaker && currentTitle && !currentTitle.includes('|')) {
        const newTitle = `${dateCycle.Event_name} | ${currentTitle}`;
        datecyclePath.setAttribute('title', newTitle);
      }

      // Add "date_event" class only to paths ending with "-day-maker"
      if (isDayMaker) {
        datecyclePath.classList.add("date_event");
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


// Find matching dateCycles
function findMatchingDateCycles(dateCycles) {
  let dateObj = new Date(targetDate);
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1; // month in number
  const year = dateObj.getFullYear();
  
  // Array representing the names of the months
  const monthsNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  
  const dashedDate = `-${day}-${month}-${year}`;
  
// Add month name class only if Completed is "no"
return dateCycles
.filter(dc => dashedDate.includes(dc.Date))
.map(dc => ({
    ...dc,
    monthName: dc.Completed === 'no' ? monthsNames[month - 1] : ''
}));
}

// Write the provided dateCycle to the provided div element
function writeMatchingDateCycles(divElement, dateCycle) {
// Determine styles based on whether the dateCycle is completed or not
const eventNameStyle = dateCycle.Completed === 'yes' ? 'text-decoration: line-through;' : '';
const calendarColorContent = dateCycle.Completed === 'yes' ? '✔' : '⬤';

divElement.innerHTML += `
  <div class="date-info ${dateCycle.ID}">
      <div class="current-date-info-title ${dateCycle.monthName}" style="${eventNameStyle}">${dateCycle.Event_name}</div>
      <div class="current-datecycle-data">
          <div class="current-date-calendar-color" style="color:${dateCycle.calendar_color};">${calendarColorContent}</div>
          <div class="current-date-calendar">${dateCycle.selectCalendar}</div>
          <div>|</div>
          <div class="current-date-frequency">${dateCycle.Frequency} Event</div>
      </div>
      <div class="current-date-notes" style="height:fit-content;">${dateCycle.Comments}</div>
      <div style="display:flex;flex-flow:row;">
      
      <div class="forward-button-datecycle" title="➡️ Push to tomorrow" onclick="push2tomorrow('${dateCycle.ID}')">➜</div>
      <div class="close-button-datecycle" title="✅ Done! Hide." onclick="strikeDateCycle(this)">✔</div>
         <div class="delete-button-datecycle" title="❌ Remove from ${dateCycle.selectCalendar}" onclick="deleteDateCycle('${dateCycle.ID}')">✘</div>
      </div>
  </div>
`;
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

  if (hasDateCycles || hasUserCalendars || hasTourToken) {
    // Ask the user for confirmation
    const userConfirmed = confirm('Are you certain you want to delete all your EarthCal data? This can\'t be undone!');

    if (userConfirmed) {
      if (hasDateCycles) {
        localStorage.removeItem('dateCycles');
      }

      if (hasUserCalendars) {
        localStorage.removeItem('userCalendars');
      }

      // Remove the tourToken
      localStorage.removeItem('tourToken');

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

  alert(JSON.stringify(newCalendar, null, 2));

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





//PUSH DATE TO TOMORRRW

function push2tomorrow(id) {
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

  // Create a Date object for the current dateCycle
  const currentDate = new Date(dateCycle.Year, dateCycle.Month - 1, dateCycle.Day);
  
  // Add one day
  currentDate.setDate(currentDate.getDate() + 1);
  
  // Update the dateCycle object
  dateCycle.Day = currentDate.getDate();
  dateCycle.Month = currentDate.getMonth() + 1; // Months are zero-indexed in JavaScript Dates
  dateCycle.Year = currentDate.getFullYear();
  dateCycle.Date = `-${dateCycle.Day}-${dateCycle.Month}-${dateCycle.Year}`; // Update the Date string as well
  
  // Save the updated array back to localStorage
  localStorage.setItem('dateCycles', JSON.stringify(dateCycles));
  
  // Optionally: Refresh the display or show a message to user
  console.log(`Pushed dateCycle with ID: ${id} to tomorrow`);
  
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