//  OPENING THE ADD DATECYCLE FORM

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


const EARTHCAL_V1_API_BASE = '../api/v1';

function getActiveUserContext() {
    if (typeof isLoggedIn === 'function') {
        try {
            const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true }) || {};
            if (ok && payload?.buwana_id) {
                return {
                    buwana_id: Number(payload.buwana_id),
                    payload
                };
            }
        } catch (err) {
            console.warn('isLoggedIn helper failed:', err);
        }
    }

    try {
        const sessionUser = JSON.parse(sessionStorage.getItem('buwana_user') || '{}');
        if (sessionUser?.buwana_id) {
            return {
                buwana_id: Number(sessionUser.buwana_id),
                payload: sessionUser
            };
        }
    } catch (err) {
        console.warn('Failed to parse session buwana_user:', err);
    }

    const storedId = localStorage.getItem('buwana_id');
    if (storedId) {
        return {
            buwana_id: Number(storedId),
            payload: { buwana_id: Number(storedId) }
        };
    }

    return { buwana_id: null, payload: null };
}

function getUserTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
    } catch (err) {
        console.warn('Unable to resolve user timezone, defaulting to Etc/UTC:', err);
        return 'Etc/UTC';
    }
}

async function callV1Api(endpoint, payload) {
    const url = `${EARTHCAL_V1_API_BASE}/${endpoint}`;
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
    };

    const response = await fetch(url, options);
    let data = null;
    try {
        data = await response.json();
    } catch (err) {
        console.error(`Failed to parse JSON from ${endpoint}:`, err);
    }

    if (!response.ok || !data || data.ok === false || data.success === false) {
        const errorMessage = data?.error || data?.message || `Request to ${endpoint} failed`;
        throw new Error(errorMessage);
    }

    return data;
}

function parseDateFromItem(dtstartUtc, tzid) {
    if (!dtstartUtc) {
        return {
            date: null,
            timeLabel: null,
            components: { year: null, month: null, day: null }
        };
    }

    try {
        const iso = dtstartUtc.endsWith('Z') ? dtstartUtc : `${dtstartUtc}Z`;
        const startDate = new Date(iso);

        if (Number.isNaN(startDate.getTime())) {
            throw new Error('Invalid start date');
        }

        const year = startDate.getFullYear();
        const month = startDate.getMonth() + 1;
        const day = startDate.getDate();

        const hours = startDate.getHours();
        const minutes = startDate.getMinutes();
        const timeLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        return {
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            timeLabel,
            components: {
                year: String(year),
                month: String(month),
                day: String(day)
            }
        };
    } catch (err) {
        console.warn('parseDateFromItem failed:', dtstartUtc, tzid, err);
        return {
            date: null,
            timeLabel: null,
            components: { year: null, month: null, day: null }
        };
    }
}

function normalizeV1Item(item, calendar, buwanaId) {
    const { date, timeLabel, components } = parseDateFromItem(item.dtstart_utc, item.tzid);
    const calendarColor = calendar.color || '#3b82f6';
    const itemColor = item.item_color || calendarColor;
    const emoji = item.item_emoji || calendar.emoji || '⬤';
    const calEmoji = calendar.emoji || '📅';
    const description = item.description || '';
    const isCompleted =
        (typeof item.percent_complete === 'number' && item.percent_complete >= 100) ||
        (item.status && String(item.status).toUpperCase() === 'COMPLETED') ||
        Boolean(item.completed_at);

    return {
        unique_key: `v1_${calendar.calendar_id}_${item.item_id}`,
        ID: String(item.item_id),
        item_id: Number(item.item_id),
        buwana_id: buwanaId,
        cal_id: Number(calendar.calendar_id),
        cal_name: calendar.name || 'My Calendar',
        cal_color: calendarColor,
        cal_emoji: calEmoji,
        title: item.summary || 'Untitled Event',
        date: date || item.date || '',
        time: timeLabel || '00:00',
        time_zone: item.tzid || calendar.tzid || 'Etc/UTC',
        day: components.day || '1',
        month: components.month || '1',
        year: components.year || new Date().getFullYear().toString(),
        comment: description ? '1' : '0',
        comments: description,
        last_edited: item.updated_at || new Date().toISOString(),
        created_at: item.created_at || new Date().toISOString(),
        unique_id: item.uid || null,
        unique_key_v1: item.uid || null,
        datecycle_color: itemColor,
        date_emoji: emoji,
        frequency: 'One-time',
        pinned: item.pinned ? '1' : '0',
        completed: isCompleted ? '1' : '0',
        public: calendar.visibility === 'public' ? '1' : '0',
        delete_it: '0',
        synced: '1',
        conflict: '0',
        component_type: item.component_type,
        all_day: item.all_day ? 1 : 0,
        tzid: item.tzid || calendar.tzid || 'Etc/UTC',
        dtstart_utc: item.dtstart_utc || null,
        dtend_utc: item.dtend_utc || null,
        due_utc: item.due_utc || null,
        raw_v1: item
    };
}

function findDateCycleInStorage(uniqueKey) {
    const calendarKeys = Object.keys(localStorage).filter(key => key.startsWith('calendar_'));
    for (const key of calendarKeys) {
        let calendarData = [];
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(parsed)) {
                calendarData = parsed;
            }
        } catch (err) {
            console.warn(`Unable to parse localStorage for ${key}:`, err);
            continue;
        }

        const index = calendarData.findIndex(dc => dc?.unique_key === uniqueKey);
        if (index !== -1) {
            return {
                calendarKey: key,
                calendarData,
                index,
                dateCycle: calendarData[index]
            };
        }
    }
    return null;
}

function buildStartLocal(dateCycle) {
    const baseDate = dateCycle?.date || `${dateCycle.year}-${String(dateCycle.month).padStart(2, '0')}-${String(dateCycle.day).padStart(2, '0')}`;
    const timeValue = dateCycle?.time && dateCycle.time !== 'under dev' ? dateCycle.time : '00:00';
    return `${baseDate} ${timeValue.length === 5 ? `${timeValue}:00` : timeValue}`;
}

function resolveColorToHex(colorValue) {
    if (!colorValue) return null;
    if (typeof colorValue === 'string' && colorValue.trim().startsWith('#')) {
        return colorValue.trim();
    }

    const temp = document.createElement('span');
    temp.style.color = colorValue;
    temp.style.display = 'none';
    document.body.appendChild(temp);
    const computed = getComputedStyle(temp).color;
    document.body.removeChild(temp);

    const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return null;

    const r = Number(match[1]).toString(16).padStart(2, '0');
    const g = Number(match[2]).toString(16).padStart(2, '0');
    const b = Number(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
}

async function persistDateCycle(dateCycle, overrides = {}) {
    const { buwana_id } = getActiveUserContext();
    if (!buwana_id) {
        throw new Error('User must be logged in to update datecycles.');
    }

    if (!dateCycle?.item_id) {
        throw new Error('Missing item_id for v1 update. Please sync again.');
    }

    const sanitizedComments = sanitizeComments(dateCycle.comment, dateCycle.comments);
    if (dateCycle) {
        dateCycle.comments = sanitizedComments;
        dateCycle.comment = sanitizedComments ? 1 : 0;
    }

    const payload = {
        buwana_id,
        item_id: Number(dateCycle.item_id),
        calendar_id: Number(dateCycle.cal_id),
        summary: dateCycle.title,
        description: overrides.description !== undefined ? overrides.description : sanitizedComments,
        start_local: buildStartLocal({ ...dateCycle, ...overrides }),
        tzid: overrides.tzid || dateCycle.tzid || getUserTimezone(),
        pinned: overrides.pinned !== undefined ? Boolean(overrides.pinned) : Number(dateCycle.pinned) === 1,
        all_day: overrides.all_day !== undefined ? overrides.all_day : (dateCycle.all_day ? 1 : 0),
        color_hex: overrides.color_hex ? resolveColorToHex(overrides.color_hex) : resolveColorToHex(dateCycle.datecycle_color),
        emoji: overrides.emoji || dateCycle.date_emoji || '⬤',
        percent_complete: overrides.percent_complete !== undefined ? overrides.percent_complete : (Number(dateCycle.completed) === 1 ? 100 : 0),
        status: overrides.status || (Number(dateCycle.completed) === 1 ? 'COMPLETED' : 'NEEDS-ACTION')
    };

    if (overrides.start_local) {
        payload.start_local = overrides.start_local;
    }
    if (overrides.description !== undefined) {
        payload.description = overrides.description;
    }
    if (overrides.summary !== undefined) {
        payload.summary = overrides.summary;
    }

    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
            delete payload[key];
        }
    });

    return await callV1Api('update_item.php', payload);
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
        const data = await callV1Api('list_calendars.php', { buwana_id: Number(buwanaId) });
        const calendars = Array.isArray(data.calendars) ? data.calendars : [];

        let fallbackSet = false;

        calendars.forEach(calendar => {
            const opt = document.createElement('option');
            opt.value = calendar.calendar_id;
            opt.text = calendar.name || 'Unnamed Calendar';
            opt.style.color = calendar.color || '#3b82f6';
            opt.dataset.emoji = calendar.emoji || '📅';
            dd.appendChild(opt);

            if (!fallbackSet && (calendar.is_default || calendar.name === 'My Calendar')) {
                opt.selected = true;
                setId.value = calendar.calendar_id;
                setColor.value = calendar.color || '#3b82f6';
                fallbackSet = true;
            }
        });

        if (!fallbackSet && calendars.length) {
            const first = calendars[0];
            setId.value = first.calendar_id;
            setColor.value = first.color || '#3b82f6';
            dd.selectedIndex = 0;
        }

        const addNew = document.createElement('option');
        addNew.value = 'add_new_calendar';
        addNew.textContent = '+ Add New Calendar...';
        dd.appendChild(addNew);

        dd.onchange = (e) => {
            const opt = e.target.selectedOptions[0];
            if (!opt) return;
            setId.value = opt.value;
            setColor.value = opt.style.color || '#3b82f6';
            if (opt.value === 'add_new_calendar') showAdderForm();
        };

        const addNewForm = document.getElementById('addNewCalendar');
        if (addNewForm) addNewForm.style.display = 'none';
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



async function addNewCalendar() {
    console.log('addNewCalendar called.');

    const calendarName = document.getElementById('calendarName').value;
    const color = document.getElementById('colorPicker').value;
    const isPublic = document.getElementById('publicCalendar').checked;

    if (!calendarName || !color) {
        alert('Please provide a name and select a color for the calendar.');
        return;
    }

    const { buwana_id } = getActiveUserContext();
    if (!buwana_id) {
        alert('You must be logged in to create a calendar.');
        return;
    }

    try {
        const payload = {
            buwana_id,
            name: calendarName,
            color,
            emoji: '📅',
            visibility: isPublic ? 'public' : 'private',
            tzid: getUserTimezone()
        };

        const result = await callV1Api('add_new_cal.php', payload);
        console.log('Response from add_new_cal API:', result);

        if (!result?.calendar?.calendar_id && !result?.calendar_id) {
            throw new Error('Calendar creation response missing calendar_id');
        }

        alert('New calendar added successfully!');

        const form = document.getElementById('addNewCalendar');
        if (form) form.style.display = 'none';

        await populateCalendarDropdown(buwana_id);
        await syncDatecycles();
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

    const modal = document.getElementById("add-datecycle");
    modal.classList.add('modal-hidden');
    modal.classList.remove('modal-shown');
    modal.classList.remove('dim-blur');

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
        await updateDateCycleCount(0, 0); // No events, reset count display
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
    await updateDateCycleCount(matchingPinned.length, matchingCurrent.length);

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


// Toggle the visibility of the date cycle details
function toggleDateCycleView() {
    const allPinnedDateCyclesDiv = document.getElementById("all-pinned-datecycles");
    const allCurrentDateCyclesDiv = document.getElementById("all-current-datecycles");
    const eyeIcon = document.getElementById("eye-icon");

    if (!allPinnedDateCyclesDiv || !allCurrentDateCyclesDiv || !eyeIcon) return;

    const isVisible = window.getComputedStyle(allCurrentDateCyclesDiv).display !== "none";

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

document.addEventListener("DOMContentLoaded", function () {
    const eyeIcon = document.getElementById("eye-icon");
    if (eyeIcon) {
        eyeIcon.addEventListener("click", toggleDateCycleView);
    }

    const dateCycleCountBox = document.getElementById("date-cycle-count-box");
    if (dateCycleCountBox) {
        const pauseNotice = () => clearDateCycleNoticeHide();
        const resumeNotice = () => {
            if (dateCycleCountBox.classList.contains("show")) {
                scheduleDateCycleNoticeHide();
            }
        };

        dateCycleCountBox.addEventListener("mouseenter", pauseNotice);
        dateCycleCountBox.addEventListener("focusin", pauseNotice);
        dateCycleCountBox.addEventListener("mouseleave", resumeNotice);
        dateCycleCountBox.addEventListener("focusout", resumeNotice);

        const closeNoticeButton = document.getElementById("close-datecycle-notice");
        if (closeNoticeButton) {
            closeNoticeButton.addEventListener("click", (event) => {
                event.stopPropagation();
                hideDateCycleNotice();
                closeNoticeButton.blur();
            });
        }
    }
});

const DATE_CYCLE_NOTICE_DURATION = 10000;
let dateCycleNoticeTimeoutId = null;

function clearDateCycleNoticeHide() {
    if (dateCycleNoticeTimeoutId !== null) {
        clearTimeout(dateCycleNoticeTimeoutId);
        dateCycleNoticeTimeoutId = null;
    }
}

function hideDateCycleNotice() {
    clearDateCycleNoticeHide();

    const dateCycleCountBox = document.getElementById("date-cycle-count-box");
    if (!dateCycleCountBox) return;

    dateCycleCountBox.classList.remove("show");
}

function scheduleDateCycleNoticeHide(delay = DATE_CYCLE_NOTICE_DURATION) {
    const dateCycleCountBox = document.getElementById("date-cycle-count-box");
    if (!dateCycleCountBox) return;

    clearDateCycleNoticeHide();

    dateCycleNoticeTimeoutId = setTimeout(() => {
        hideDateCycleNotice();
    }, delay);
}


// Helper to load translations with fallback to English
async function loadTranslationsWithFallback(langCode) {
    if (typeof loadTranslations === "function") {
        return await loadTranslations(langCode);
    }
    try {
        const module = await import(`../translations/${langCode}.js?v=4`);
        return module.translations;
    } catch (e) {
        const fallback = await import("../translations/en.js");
        return fallback.translations;
    }
}

// Update the count box and optionally hide/show elements based on current content
async function updateDateCycleCount(pinnedCount, currentCount) {
    const dateCycleCountBox = document.getElementById("date-cycle-count-box");
    const currentDatecycleCount = document.getElementById("current-datecycle-count");
    const eyeIcon = document.getElementById("eye-icon");

    if (!currentDatecycleCount || !dateCycleCountBox || !eyeIcon) return;

    const totalCount = pinnedCount + currentCount;

    clearDateCycleNoticeHide();

    if (totalCount === 0) {
        hideDateCycleNotice();
        currentDatecycleCount.textContent = "";
        eyeIcon.classList.remove("eye-open");
        eyeIcon.classList.add("eye-closed");
        return;
    }

    eyeIcon.classList.add("eye-open");
    eyeIcon.classList.remove("eye-closed");

    const lang = (window.userLanguage || navigator.language || "en").slice(0, 2).toLowerCase();
    const translations = await loadTranslationsWithFallback(lang);
    const prefix = translations.todayYouveGot || "On this day you've got";
    const eventWord = totalCount === 1
        ? (translations.event || translations.events || "event")
        : (translations.events || translations.event || "events");

    const message = `${prefix} ${totalCount} ${eventWord}`;

    currentDatecycleCount.textContent = message;
    dateCycleCountBox.classList.add("show");
    scheduleDateCycleNoticeHide();
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
                    ${dateCycle.comments || ""}
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



function sanitizeComments(commentFlag, comments) {
    if (commentFlag != 1) return "";
    if (comments === undefined || comments === null) return "";
    const text = String(comments).trim();
    if (!text || text === "0" || text.toLowerCase() === "null") return "";
    return text;
}

async function updateServerDateCycle(dateCycle, overrides = {}) {
    return persistDateCycle(dateCycle, overrides);
}



async function checkOffDatecycle(uniqueKey) {
    console.log(`Toggling completion for dateCycle with unique_key: ${uniqueKey}`);

    const record = findDateCycleInStorage(uniqueKey);
    if (!record) {
        console.warn(`No dateCycle found with unique_key: ${uniqueKey}`);
        return;
    }

    const wasCompleted = Number(record.dateCycle.completed) === 1;
    const updatedDateCycle = {
        ...record.dateCycle,
        completed: wasCompleted ? '0' : '1',
        last_edited: new Date().toISOString()
    };

    const overrides = {
        percent_complete: updatedDateCycle.completed === '1' ? 100 : 0,
        status: updatedDateCycle.completed === '1' ? 'COMPLETED' : 'NEEDS-ACTION'
    };

    try {
        await updateServerDateCycle(updatedDateCycle, overrides);
        await syncDatecycles();

        const dateCycleDiv = document.querySelector(`.date-info[data-key="${uniqueKey}"]`);
        if (updatedDateCycle.completed === '1' && dateCycleDiv) {
            dateCycleDiv.classList.add('celebrate-animation');
            setTimeout(() => {
                dateCycleDiv.classList.remove('celebrate-animation');
                highlightDateCycles(targetDate);
            }, 500);
        } else {
            highlightDateCycles(targetDate);
        }

        console.log(`✅ Server updated completion for ${updatedDateCycle.title}`);
    } catch (error) {
        console.error(`⚠️ Server update failed for ${updatedDateCycle.title}`, error);
        alert('Unable to update completion status right now. Please try again later.');
    }
}




async function pinThisDatecycle(uniqueKey) {
    console.log(`Toggling pin status for dateCycle with unique_key: ${uniqueKey}`);

    const record = findDateCycleInStorage(uniqueKey);
    if (!record) {
        console.warn(`No dateCycle found with unique_key: ${uniqueKey}`);
        return;
    }

    const { dateCycle } = record;
    const newPinned = Number(dateCycle.pinned) === 1 ? 0 : 1;

    try {
        await updateServerDateCycle({ ...dateCycle, pinned: newPinned }, { pinned: newPinned });
        await syncDatecycles();
        highlightDateCycles(targetDate);
        console.log(`✅ Server updated pin for ${dateCycle.title}`);
    } catch (error) {
        console.error(`⚠️ Failed to update pin for ${dateCycle.title}`, error);
        alert('Unable to update pin status right now. Please try again later.');
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
            <button type="button" id="edit-confirm-dateCycle" class="confirmation-blur-button enabled" style="margin-bottom: 14px; width:100%;" onclick="saveDateCycleEditedChanges('${uniqueKey}')">
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

}





async function saveDateCycleEditedChanges(uniqueKey) {
    const frequency = document.getElementById('edit-dateCycle-type').value;
    const yearField = parseInt(document.getElementById('edit-year-field2').value);
    const dayField = parseInt(document.getElementById('edit-day-field2').value);
    const monthField = parseInt(document.getElementById('edit-month-field2').value);
    const title = document.getElementById('edit-add-date-title').value.trim();
    const eventColor = document.getElementById('edit-DateColorPicker').value;
    const comments = document.getElementById('edit-add-date-note').value.trim();
    const formattedDate = `${yearField}-${String(monthField).padStart(2, '0')}-${String(dayField).padStart(2, '0')}`;

    const record = findDateCycleInStorage(uniqueKey);
    if (!record) {
        alert('Could not find the dateCycle to update.');
        return;
    }

    const updatedDateCycle = {
        ...record.dateCycle,
        frequency,
        year: String(yearField),
        day: String(dayField),
        month: String(monthField),
        date: formattedDate,
        title,
        datecycle_color: eventColor,
        comments,
        last_edited: new Date().toISOString()
    };

    const startLocal = `${formattedDate} 00:00:00`;

    try {
        await updateServerDateCycle(updatedDateCycle, {
            summary: title,
            description: comments,
            start_local: startLocal,
            color_hex: resolveColorToHex(eventColor)
        });
        await syncDatecycles();
        console.log(`✅ Server updated for edited dateCycle: ${title}`);
    } catch (error) {
        console.error(`⚠️ Error updating server for edited dateCycle: ${title}`, error);
        alert('Unable to update event right now. Please try again later.');
        return;
    }

    document.getElementById('form-modal-message').classList.replace('modal-visible', 'modal-hidden');
    document.getElementById('page-content').classList.remove('blur');

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




async function push2today(uniqueKey) {
    console.log(`Pushing dateCycle with unique_key: ${uniqueKey} to today`);

    const record = findDateCycleInStorage(uniqueKey);
    if (!record) {
        console.warn(`No dateCycle found with unique_key: ${uniqueKey}`);
        return;
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    const [year, month, day] = formattedDate.split('-');

    const updatedDateCycle = {
        ...record.dateCycle,
        year,
        month,
        day,
        date: formattedDate,
        last_edited: currentDate.toISOString()
    };

    try {
        await updateServerDateCycle(updatedDateCycle, { start_local: `${formattedDate} 00:00:00` });
        await syncDatecycles();
        highlightDateCycles(targetDate);
        console.log(`✅ Server updated for push to today: ${updatedDateCycle.title}`);
    } catch (error) {
        console.error(`⚠️ Error updating server for push to today: ${updatedDateCycle.title}`, error);
        alert('Unable to push this event to today right now. Please try again later.');
    }
}



async function deleteDateCycle(uniqueKey) {
    console.log(`deleteDateCycle called for unique_key: ${uniqueKey}`);

    const record = findDateCycleInStorage(uniqueKey);
    if (!record) {
        console.warn(`No dateCycle found with unique_key: ${uniqueKey}`);
        return;
    }

    const userResponse = confirm('Are you sure you want to delete this event?');
    if (!userResponse) return;

    if (!record.dateCycle?.item_id) {
        alert('Unable to delete this event. Please sync and try again.');
        return;
    }

    const { buwana_id } = getActiveUserContext();
    if (!buwana_id) {
        alert('Please log in to delete events.');
        return;
    }

    try {
        await callV1Api('delete_item.php', {
            buwana_id,
            item_id: Number(record.dateCycle.item_id)
        });
        await syncDatecycles();
        highlightDateCycles(targetDate);
        console.log(`DateCycle with unique_key: ${uniqueKey} deleted from the server.`);
    } catch (error) {
        console.error('Error deleting dateCycle from the server:', error);
        alert('An error occurred while deleting this event. Please try again later.');
    }
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
    console.log('📝 addDatecycle called');

    const dayField = document.getElementById('day-field2').value;
    const monthField = document.getElementById('month-field2').value;
    const addDateTitle = document.getElementById('add-date-title').value.trim();

    if (!dayField || !monthField || !addDateTitle) {
        alert('Please fill out all required fields to add a new event.');
        return;
    }

    const selCalendarId = document.getElementById('set-calendar-id').value;
    const calendarDropdown = document.getElementById('select-calendar');
    const selCalendarName = calendarDropdown?.options[calendarDropdown.selectedIndex]?.text;

    if (!selCalendarId || !selCalendarName) {
        alert('Missing calendar selection.');
        return;
    }

    const { buwana_id } = getActiveUserContext();
    const fallbackBuwanaId = document.getElementById('buwana-id')?.value;
    const resolvedBuwanaId = buwana_id || Number(fallbackBuwanaId);

    if (!resolvedBuwanaId) {
        alert('You must be logged in to add events.');
        return;
    }

    const dateCycleType = document.getElementById('dateCycle-type').value || 'One-time';
    const yearFieldRaw = document.getElementById('year-field2').value;
    const yearField = yearFieldRaw ? Number(yearFieldRaw) : new Date().getFullYear();
    const addDateNote = document.getElementById('add-date-note').value.trim();
    const dateColorPicker = document.getElementById('DateColorPicker').value;

    const paddedMonth = String(monthField).padStart(2, '0');
    const paddedDay = String(dayField).padStart(2, '0');
    const startLocal = `${yearField}-${paddedMonth}-${paddedDay} 00:00:00`;
    const tzid = getUserTimezone();
    const colorHex = resolveColorToHex(dateColorPicker);

    const payload = {
        buwana_id: Number(resolvedBuwanaId),
        calendar_id: Number(selCalendarId),
        title: addDateTitle,
        item_kind: 'event',
        start_local: startLocal,
        tzid,
        notes: addDateNote,
        all_day: 1,
        pinned: false,
        emoji: '',
        color_hex: colorHex,
        frequency: dateCycleType
    };

    try {
        await callV1Api('add_item.php', payload);
        await syncDatecycles();

        document.getElementById('select-calendar').value = 'Select calendar...';
        document.getElementById('dateCycle-type').value = 'One-time';
        document.getElementById('add-date-title').value = '';
        document.getElementById('add-note-checkbox').checked = false;
        document.getElementById('add-date-note').value = '';

        closeAddCycle();
        closeDateCycleExports();

        const targetDate = new Date(yearField, Number(monthField) - 1, Number(dayField));
        console.log(`🔍 Highlighting date: ${targetDate.toISOString()}`);
        await highlightDateCycles(targetDate);
    } catch (error) {
        console.error('Failed to add datecycle via v1 API:', error);
        alert(error.message || 'Unable to add event at this time.');
    }
}




function animateConfirmDateCycleButton() {
    const confirmButton = document.getElementById('confirm-dateCycle-button');

    if (!confirmButton) return; // Exit if button doesn't exist

    // 🔄 Start Loading Animation
    confirmButton.classList.add('loading');
    confirmButton.innerText = "Adding...";

    addDatecycle().then(() => {
        confirmButton.classList.remove('loading');
        confirmButton.innerText = "✅ DateCycle Added!";
    }).catch((error) => {
        confirmButton.classList.remove('loading');
        confirmButton.innerText = "⚠️ Add Failed!";
        console.error('Adding event failed:', error);
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
    const { buwana_id } = getActiveUserContext();
    if (!buwana_id) {
        console.warn('syncDatecycles: no buwana_id found.');
        return 'Please log in to sync your calendars.';
    }

    try {
        const data = await callV1Api('get_user_items.php', { buwana_id });
        const calendars = Array.isArray(data.calendars) ? data.calendars : [];

        const keysToKeep = new Set();
        let totalItems = 0;

        calendars.forEach(calendar => {
            if (!calendar || calendar.calendar_id === undefined || calendar.calendar_id === null) {
                return;
            }

            const storageKey = `calendar_${calendar.calendar_id}`;
            const isActive = calendar.is_active !== false;
            const isVisible = calendar.display_enabled !== false;

            if (!isActive || !isVisible) {
                localStorage.removeItem(storageKey);
                return;
            }

            const items = Array.isArray(calendar.items) ? calendar.items : [];
            const normalized = items.map(item => normalizeV1Item(item, calendar, buwana_id));
            localStorage.setItem(storageKey, JSON.stringify(normalized));
            keysToKeep.add(storageKey);
            totalItems += normalized.length;
        });

        Object.keys(localStorage)
            .filter(key => /^calendar_\d+$/.test(key) && !keysToKeep.has(key))
            .forEach(key => localStorage.removeItem(key));

        try {
            sessionStorage.setItem('user_calendars_v1', JSON.stringify(calendars));
        } catch (storageErr) {
            console.warn('Unable to cache user calendars in sessionStorage:', storageErr);
        }

        const summary = `Your ${calendars.length} calendars and ${totalItems} datecycles were updated`;
        console.log('✅ Sync complete:', summary);
        return summary;
    } catch (error) {
        console.error('Sync failed:', error);
        throw error;
    }
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
        return parsedData.map(dateCycle => {
            const sanitizedComments = sanitizeComments(dateCycle.comment, dateCycle.comments);
            return {
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
                comment: sanitizedComments ? "1" : "0",
                comments: sanitizedComments,
                datecycle_color: dateCycle.datecycle_color || "missing",
                cal_name: dateCycle.cal_name || "missing",
                cal_color: dateCycle.cal_color || "missing",
                synced: dateCycle.synced || "1",
                conflict: dateCycle.conflict || "0",
                delete_it: dateCycle.delete_it || "0",
                last_edited: dateCycle.last_edited || new Date().toISOString(),
                unique_key: dateCycle.unique_key || "",  // Ensure unique_key is returned
                // raw_json: JSON.stringify(dateCycle),
            };
        });
    } catch (error) {
        console.error(`Error parsing calendar data for cal_id ${calId}:`, error);
        return [];
    }
}





function fetchDateCycleCalendars() {
    const calendarKeys = Object.keys(localStorage).filter(k => k.startsWith("calendar_"));
    const allDateCycles = [];

    for (const key of calendarKeys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;

            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed.datecycles)
                    ? parsed.datecycles
                    : [];

            const valid = list.filter(dc => String(dc?.delete_it ?? '0') !== '1');
            allDateCycles.push(...valid);
        } catch (err) {
            console.warn(`❌ Error parsing ${key}:`, err);
        }
    }

    return allDateCycles;
}



//
// function mergeDateCycles(serverCalendar, localCalendar) {
//     const mergedCycles = [];
//
//     // Create a map for server cycles by ID
//     const serverCycleMap = new Map();
//     serverCalendar.forEach(serverCycle => {
//         serverCycleMap.set(serverCycle.ID, serverCycle);
//     });
//
//     // Iterate over local cycles and merge
//     localCalendar.forEach(localCycle => {
//         const serverCycle = serverCycleMap.get(localCycle.ID);
//
//         if (serverCycle) {
//             // Resolve conflicts (e.g., last_edited timestamp)
//             if (new Date(localCycle.last_edited) > new Date(serverCycle.last_edited)) {
//                 // Local is newer
//                 mergedCycles.push(localCycle);
//             } else {
//                 // Server is newer
//                 mergedCycles.push(serverCycle);
//             }
//
//             // Remove from the server map to avoid duplicates
//             serverCycleMap.delete(localCycle.ID);
//         } else {
//             // Local cycle does not exist on the server
//             mergedCycles.push(localCycle);
//         }
//     });
//
//     // Add remaining server cycles that weren't in local
//     serverCycleMap.forEach(serverCycle => mergedCycles.push(serverCycle));
//
//     console.log('Merged dateCycles:', mergedCycles);
//     return mergedCycles;
// }


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





