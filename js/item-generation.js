/* OPENING THE ADD DATECYCLE FORM

but this time using the modal archetecture

then generate the form fully using JS

start by showing add a to do for the current date

Options to change/add calendar, change item type from to-do, to event, to journal, to record, to cycle

Options to add to-do title, color, emoji and description

test heloooo  jkjkjkkjkjkkjjk asdasdsdfsdfsdfasd

 */

async function openAddCycle() {
    console.log('openAddCycle called');

    const craftBuwana =
        JSON.parse(sessionStorage.getItem('buwana_user') || '{}').buwana_id ||
        localStorage.getItem('buwana_id') ||
        null;

    if (!craftBuwana) {
        alert('Please log in to add events.');
        sendUpRegistration();
        return;
    }

    document.body.style.overflowY = 'hidden';
    const modal = document.getElementById('add-datecycle');
    modal.classList.replace('modal-hidden','modal-shown');
    modal.classList.add('dim-blur');
    populateDateFields(targetDate);

    const confirmBtn = document.getElementById('confirm-dateCycle-button');
    if (confirmBtn) confirmBtn.innerText = '+ Add DateCycle';

    await populateCalendarDropdown(craftBuwana);
}


async function populateCalendarDropdown(buwanaId) {
    console.log('populateCalendarDropdown:', buwanaId);

    const dd = document.getElementById('select-calendar');
    const setId = document.getElementById('set-calendar-id');
    const setColor = document.getElementById('set-calendar-color');
    const setBuwana = document.getElementById('buwana-id');

    dd.innerHTML = '';
    setBuwana.value = buwanaId;

    try {
        const res = await fetch('https://buwana.ecobricks.org/earthcal/grab_user_calendars.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buwana_id: buwanaId }),
        });

        const { success, calendars = [], buwana_id } = await res.json();
        if (!success) throw new Error("API calendar fetch failed");

        let fallbackSet = false;

        calendars.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.calendar_id;
            opt.text = c.calendar_name;
            opt.style.color = c.calendar_color;
            dd.appendChild(opt);

            if (c.calendar_name === "My Calendar" && !fallbackSet) {
                opt.selected = true;
                setId.value = c.calendar_id;
                setColor.value = c.calendar_color;
                fallbackSet = true;
            }
        });

        if (!fallbackSet && calendars.length) {
            const first = calendars[0];
            setId.value = first.calendar_id;
            setColor.value = first.calendar_color;
            dd.selectedIndex = 0;
        }

        const addNew = document.createElement('option');
        addNew.value = "add_new_calendar";
        addNew.textContent = "+ Add New Calendar...";
        dd.appendChild(addNew);

        dd.onchange = (e) => {
            const opt = e.target.selectedOptions[0];
            setId.value = opt.value;
            setColor.value = opt.style.color;
            if (opt.value === "add_new_calendar") showAdderForm();
        };

        document.getElementById('addNewCalendar').style.display = 'none';
    } catch (err) {
        console.error("❌ Calendar dropdown error:", err);
        dd.innerHTML = '<option disabled selected>Error loading calendars</option>';
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
