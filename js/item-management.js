
/* OPENING THE ADD DATECYCLE FORM v=3.3

but this time using the modal archetecture

then generate the form fully using JS

start by showing add a to do for the current date

Options to change/add calendar, change item type from to-do, to event, to journal, to record, to cycle

Options to add to-do title, color, emoji and description


 */

// ===== Add Item (v1) =====

/**
 * Opens the "Add Item" modal and renders a To-Do form for the current targetDate.
 * - Presets: item_kind = 'todo', calendar = user's default ("My Calendar"), date/time from targetDate.
 * - Shows fields: title, pinned, emoji, color, notes.
 * - Switching to Event/Journal shows an alert and reverts to To-Do (for now).
 *
 * Expects existing modal structure:
 *   <div id="form-modal-message" class="modal-hidden">
 *     <button type="button" onclick="closeTheModal()" class="x-button"></button>
 *     <div class="modal-content-box"><div id="modal-content" class="modal-message"></div></div>
 *   </div>
 */


async function openAddItem() {
    async function initSyncStoreForUser(user) {
        if (!user?.buwana_id || !window.syncStore?.initSyncStore) return false;
        try {
            await window.syncStore.initSyncStore({ buwana_id: user.buwana_id });
            return true;
        } catch (err) {
            console.warn('[openAddItem] sync-store init failed', err);
            return false;
        }
    }

    // ============================================================
    // 0. ENSURE USER IS LOGGED IN
    // ------------------------------------------------------------
    // We need a valid buwana_id to associate the new item and to
    // scope calendar reads/writes. If missing, prompt login/registration.
    // ============================================================
    const user = getCurrentUser(); // { buwana_id, time_zone?, name? }

    console.log('[openAddItem] user object:', getCurrentUser());

    if (!user?.buwana_id) {
        alert('Please log in to add items.');
        if (typeof sendUpRegistration === 'function') sendUpRegistration();
        return;
    }

    // ============================================================
    // 1. GET TARGET DATE
    // ------------------------------------------------------------
    // Convert the global targetDate (or now) into date and time strings.
    // Example outputs: dateStr='2025-10-06', timeStr='09:30'
    // ============================================================
    const { dateStr, timeStr } = resolveTargetDateParts();



    // ============================================================
// 2. ENSURE DEFAULT "MY CALENDAR" EXISTS (CREATE IF MISSING)
// ------------------------------------------------------------
// We try to load the user's calendars. If none exist or there is
// no valid default_my_calendar (or no "My Calendar" by name), we call
// create_my_calendar.php to create it, then reload the list.
// ============================================================
    console.log('[openAddItem] checking for existing My Calendar…');

    const normalizeOwnedCalendars = (list) => {
        if (!Array.isArray(list)) return [];
        const validCalendars = list.filter((c) => {
            const validId = Number.isInteger(c?.calendar_id) && c.calendar_id > 0;
            const validName = typeof c?.name === 'string' && c.name.trim() !== '';
            const isV1 = c?.tzid || c?.category || c?.visibility;
            return validId && validName && isV1;
        });
        return validCalendars.filter((c) => (c?.source_type || '').toLowerCase() === 'personal');
    };

    let calendars = [];
    try {
        calendars = await loadUserCalendars(user.buwana_id, { force: true });
        console.log('[openAddItem] calendars loaded:', calendars);
    } catch (err) {
        console.error('[openAddItem] loadUserCalendars() failed:', err);
        calendars = [];
    }

    let ownedCalendars = normalizeOwnedCalendars(calendars);

    console.log('[openAddItem] owned calendars (valid only):', ownedCalendars);

    let defaultCal = null;
    if (ownedCalendars.length > 0) {
        defaultCal =
            ownedCalendars.find(c => c.is_default) ||
            ownedCalendars.find(c => /my\s*calendar/i.test(c.name || '')) ||
            ownedCalendars[0];
    }

    console.log('[openAddItem] defaultCal initial:', defaultCal);

// 🧩 If no valid calendar, trigger creation
    if (!defaultCal) {
        console.log('[openAddItem] no valid default calendar found — creating new v1 My Calendar…');
        try {
            const payload = {
                buwana_id: user.buwana_id,
                tzid: getUserTZ(),
            };
            console.log('[openAddItem] sending create_my_calendar request with payload:', payload);

            const makeRes = await fetch('/api/v1/create_my_calendar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            console.log('[openAddItem] create_my_calendar status:', makeRes.status);
            const makeJson = await makeRes.json().catch(() => ({}));
            console.log('[openAddItem] create_my_calendar response:', makeJson);

            if (!makeRes.ok || !makeJson?.ok) {
                console.warn('[openAddItem] create_my_calendar failed:', makeJson);
                alert('Could not create your default calendar. Please try again.');
                return;
            }

            // 🔄 Re-fetch updated calendar list
            calendars = await loadUserCalendars(user.buwana_id, { force: true }).catch(() => []);
            ownedCalendars = normalizeOwnedCalendars(calendars);
            console.log('[openAddItem] calendars after creation:', calendars);
            console.log('[openAddItem] owned calendars after creation:', ownedCalendars);

            defaultCal =
                ownedCalendars.find(c => c.is_default) ||
                ownedCalendars.find(c => /my\s*calendar/i.test(c.name || '')) ||
                ownedCalendars[0] || null;

            console.log('[openAddItem] defaultCal after creation:', defaultCal);

        } catch (err) {
            console.error('[openAddItem] create_my_calendar network or logic error:', err);
            alert('Could not reach the server to create your calendar.');
            return;
        }
    }

    if (!defaultCal && ownedCalendars.length === 0) {
        ownedCalendars = [fallbackMyCalendar()];
        defaultCal = ownedCalendars[0];
    }

    const calendarId = defaultCal?.calendar_id ?? null;
    const calendarName = defaultCal?.name ?? 'My Calendar';

    console.log('[openAddItem] final defaultCal:', defaultCal);
    console.log('[openAddItem] calendarId:', calendarId);

    if (!calendarId) {
        alert('No calendar was found or created. Please try again.');
        return;
    }



    // ============================================================
    // 3. OPEN THE MODAL CONTAINER
    // ------------------------------------------------------------
    // Show your pre-existing modal shell, prevent page scroll.
    // ============================================================
    const modal = document.getElementById('form-modal-message');
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    document.body.style.overflowY = 'hidden';

    // ============================================================
    // 4. RENDER THE ADD-ITEM FORM (PRESET FOR TO-DO)
    // ------------------------------------------------------------
    // We render the form's HTML into #modal-content with defaults:
    // - item_kind: 'todo'
    // - calendar: user's default
    // - date/time: targetDate
    // ============================================================
    const modalContent = document.getElementById('modal-content');
    const displayDateLabel = humanDate(dateStr);

    modalContent.innerHTML = buildAddItemFormHTML({
        displayDate: displayDateLabel,
        dateStr,
        timeStr,
        calendarId,
        calendarName,
        tzid: getUserTZ(),
        calendars: ownedCalendars
    });

    const formRoot = modalContent.querySelector('#ec-add-form-root');

    const resolvedMoonDate = (() => {
        if (typeof targetDate !== 'undefined' && targetDate instanceof Date && !Number.isNaN(targetDate.getTime())) {
            return new Date(targetDate);
        }
        if (typeof dateStr === 'string' && dateStr) {
            const isoCandidate = `${dateStr}T${timeStr || '00:00'}`;
            const candidate = new Date(isoCandidate);
            if (!Number.isNaN(candidate.getTime())) {
                return candidate;
            }
        }
        return new Date();
    })();

    const moonPhaseInfo = displayMoonPhasev1({
        date: resolvedMoonDate,
        container: formRoot
    }) || null;

    const presetMoonEmoji = sanitizeEmojiInput(moonPhaseInfo?.emoji || '') || '';

    const kindStates = { todo: null, event: null, journal: null };
    const kindContext = {
        displayDate: displayDateLabel,
        dateStr,
        timeStr,
        presetMoonEmoji
    };

    applyKindToForm('todo', kindContext, {});

    const titleInput = document.getElementById('ec-title');
    if (titleInput) {
        titleInput.focus();
        titleInput.select();
    }

    const kindSelect = document.getElementById('ec-item-kind');
    if (kindSelect) {
        kindSelect.addEventListener('change', (e) => {
            const nextKind = (e.target.value || 'todo').toLowerCase();
            if (!Object.prototype.hasOwnProperty.call(ADD_ITEM_KIND_CONFIG, nextKind)) {
                e.target.value = 'todo';
                return;
            }

            const activeKind = formRoot?.dataset?.activeKind || 'todo';
            if (Object.prototype.hasOwnProperty.call(ADD_ITEM_KIND_CONFIG, activeKind)) {
                kindStates[activeKind] = captureKindFieldsState();
            }

            applyKindToForm(nextKind, kindContext, {
                restoreState: kindStates[nextKind] || null
            });
        });
    }

    const calendarSelect = document.getElementById('ec-calendar-select');
    if (calendarSelect) {
        const setPreviousValue = (value) => {
            calendarSelect.dataset.previousValue = value;
        };
        setPreviousValue(calendarSelect.value);
        calendarSelect.addEventListener('change', (e) => {
            if (e.target.value === '__add_new__') {
                if (typeof addNewCalendarV1 === 'function') {
                    addNewCalendarV1();
                }
                const fallback = calendarSelect.dataset.previousValue ?? String(calendarId ?? '');
                calendarSelect.value = fallback;
                setPreviousValue(calendarSelect.value);
            } else {
                setPreviousValue(e.target.value);
            }
        });
    }

    // ============================================================
    // 6. SAVE HANDLER — CALL /api/v1/add_item.php (LIVE)
    // ------------------------------------------------------------
    // Collect fields → POST JSON → handle response. On success,
    // close modal and (optionally) trigger a UI refresh function.
    // ============================================================
    const form = document.getElementById('ec-add-item-form');
    const saveBtn = document.getElementById('ec-save-item');
    const handleSubmit = async (event) => {
        if (event) event.preventDefault();
        if (!saveBtn) return;
        // Basic front-end validation
        const kind = (document.getElementById('ec-item-kind')?.value || 'todo').toLowerCase();
        const titleVal = (document.getElementById('ec-title')?.value || '').trim();
        if (!titleVal) {
            const prompts = {
                todo: 'Please enter a title for your to-do.',
                event: 'Please enter a title for your event.',
                journal: 'Please enter a title for your journal entry.'
            };
            alert(prompts[kind] || prompts.todo);
            document.getElementById('ec-title')?.focus();
            return;
        }

        const payload = collectAddItemFormData(user);
        if (!payload.calendar_id) {
            alert('Please choose a calendar.');
            return;
        }

        // Prevent double submits
        const origText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';

        try {
            const usedSyncStore = await initSyncStoreForUser(user);
            if (usedSyncStore) {
                const result = await window.syncStore.createOrUpdateItem(payload);
                if (result?.queued) {
                    console.info('[openAddItem] item queued for background sync');
                }
            } else {
                const res = await fetch('/api/v1/add_item.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(payload)
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || !data?.ok) {
                    console.warn('[openAddItem] add_item error:', data);
                    alert(data?.error || 'Sorry, we could not save your item.');
                    return;
                }
            }

            // Success UX — close modal, refresh cached data, then update highlights
            if (typeof closeTheModal === 'function') closeTheModal();

            if (typeof syncDatecycles === 'function') {
                try {
                    await syncDatecycles();
                } catch (syncErr) {
                    console.warn('[openAddItem] syncDatecycles error after add_item:', syncErr);
                }
            }

            if (typeof highlightDateCycles === 'function') {
                const ensureValidDate = (value) => {
                    if (value instanceof Date && !Number.isNaN(value.getTime())) {
                        return value;
                    }
                    return null;
                };

                let highlightTarget = ensureValidDate(typeof targetDate !== 'undefined' ? targetDate : null);

                if (!highlightTarget && typeof payload?.start_local === 'string') {
                    const [datePart] = payload.start_local.split(' ');
                    if (datePart) {
                        const [yyyy, mm, dd] = datePart.split('-').map(Number);
                        if ([yyyy, mm, dd].every((num) => Number.isFinite(num))) {
                            highlightTarget = ensureValidDate(new Date(yyyy, mm - 1, dd));
                        }
                    }
                }

                if (!highlightTarget) {
                    highlightTarget = new Date();
                }

                try {
                    highlightDateCycles(highlightTarget);
                } catch (highlightErr) {
                    console.warn('[openAddItem] highlightDateCycles error:', highlightErr);
                }
            }
            // Optionally toast:
            // showToast('To-Do added!', 'success');

        } catch (err) {
            console.error('[openAddItem] network error:', err);
            alert('Network error saving your item. Please try again.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = origText;
        }
    };

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}



// ===== Helpers =====

const ADD_ITEM_KIND_CONFIG = {
    todo: {
        className: 'add-to-do-form',
        heading: (displayDate) => `Add a to-do item for this ${displayDate}.`,
        buttonLabel: 'Save To-Do',
        titlePlaceholder: 'What needs doing?',
        notesPlaceholder: 'Optional notes…'
    },
    event: {
        className: 'add-event-form',
        heading: (displayDate) => `Schedule an event for ${displayDate}.`,
        buttonLabel: 'Save Event',
        titlePlaceholder: 'What is happening?',
        notesPlaceholder: 'Add event details, agenda, or notes…'
    },
    journal: {
        className: 'add-journal-form',
        heading: (displayDate) => `Journal your ${displayDate} reflections.`,
        buttonLabel: 'Save Journal Entry',
        titlePlaceholder: 'Give this entry a title…',
        notesPlaceholder: 'Write your entry…'
    }
};

function buildActionControls() {
    return `
          <div class="date-action-buttons">
            <div class="ec-inline-field ec-color-field">
              <input id="ec-color" type="color" value="#0ea5e9" class="blur-form-field ec-color-input" aria-label="Item color">
            </div>

            <div class="ec-inline-field ec-emoji-field">
              <div class="ec-emoji-input">
                <button type="button" id="ec-emoji-button" class="blur-form-field ec-emoji-button" aria-haspopup="true" aria-expanded="false" aria-label="Choose emoji">
                  <span id="ec-emoji-preview" class="ec-emoji-preview">🙂</span>
                </button>
                <input type="hidden" id="ec-emoji" value="">
              </div>
            </div>
            <button type="button" id="ec-notes-toggle" class="ec-notes-toggle-button" aria-expanded="false" aria-controls="ec-notes-box" aria-label="Show notes" title="Show notes">
              <span class="ec-notes-toggle-track" aria-hidden="true">
                <span class="ec-notes-toggle-thumb"></span>
              </span>
            </button>
          </div>
    `;
}

function buildNotesSection({ placeholder }) {
    return `
        <div class="ec-form-field ec-notes-field">
          <div id="ec-notes-box" class="ec-notes-collapsible" aria-hidden="true">
            <textarea id="ec-notes" class="blur-form-field" placeholder="${placeholder}" style="width:100%;min-height:110px;cursor:text;"></textarea>
          </div>
        </div>
    `;
}

function buildTodoFields({ notesPlaceholder }) {
    return `
        <div class="ec-form-field ec-frequency-row" id="ec-frequency-row">
          <select id="ec-frequency" class="blur-form-field ec-frequency-select" style="height:45px;text-align:center;">
            <option value="today" selected>One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          ${buildActionControls()}
        </div>
        ${buildNotesSection({ placeholder: notesPlaceholder })}
    `;
}

function buildEventFields({ dateStr, timeStr, notesPlaceholder }) {
    const defaultEnd = (() => {
        if (!timeStr) return '01:00';
        const [hourStr, minuteStr] = timeStr.split(':');
        const startMinutes = (parseInt(hourStr, 10) || 0) * 60 + (parseInt(minuteStr, 10) || 0);
        const endMinutes = startMinutes + 60;
        const endHour = Math.floor((endMinutes % (24 * 60)) / 60);
        const endMinute = endMinutes % 60;
        return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    })();

    return `
        <div class="ec-form-field ec-event-date-row ec-event-start-row">
          <div class="ec-datetime-inputs">
            <div class="ec-datetime-input-with-label">
              <label for="ec-event-start-date">Start</label>
              <input type="date" id="ec-event-start-date" class="blur-form-field" value="${escapeAttr(dateStr)}">
            </div>
            <input type="time" id="ec-event-start-time" class="blur-form-field" value="${escapeAttr(timeStr || '')}">
          </div>
        </div>
        <div class="ec-form-field ec-event-date-row ec-event-end-row">
          <div class="ec-datetime-inputs">
            <div class="ec-datetime-input-with-label">
              <label for="ec-event-end-date">End</label>
              <input type="date" id="ec-event-end-date" class="blur-form-field" value="${escapeAttr(dateStr)}">
            </div>
            <input type="time" id="ec-event-end-time" class="blur-form-field" value="${escapeAttr(defaultEnd)}">
          </div>
        </div>
        <div class="ec-form-field ec-event-options-row">
          <label class="ec-checkbox">
            <input type="checkbox" id="ec-event-all-day">
            <span>All day</span>
          </label>
        </div>
        <div class="ec-form-field">
          <input type="text" id="ec-event-location" class="blur-form-field" placeholder="Where will this take place?" aria-label="Event location">
        </div>
        <div class="ec-form-field ec-event-url-field is-hidden" id="ec-event-url-field">
          <input type="url" id="ec-event-url" class="blur-form-field" placeholder="Event URL (i.e. Zoom or Jitsi link)." aria-label="Event URL">
        </div>
        <div class="ec-form-field ec-event-action-row">
          ${buildActionControls()}
        </div>
        ${buildNotesSection({ placeholder: notesPlaceholder })}
    `;
}

function buildJournalFields({ dateStr, timeStr, notesPlaceholder }) {
    return `
        <div class="ec-form-field ec-journal-timing-row">
          <div class="ec-inline-field">
            <label for="ec-journal-entry-date">Entry date</label>
            <input type="date" id="ec-journal-entry-date" class="blur-form-field" value="${escapeAttr(dateStr)}">
          </div>
          <div class="ec-inline-field">
            <label for="ec-journal-entry-time">Entry time</label>
            <input type="time" id="ec-journal-entry-time" class="blur-form-field" value="${escapeAttr(timeStr || '')}">
          </div>
        </div>
        <div class="ec-form-field ec-journal-mood-row">
          <div class="ec-inline-field">
            <label for="ec-journal-mood">Mood</label>
            <select id="ec-journal-mood" class="blur-form-field">
              <option value="">Select mood…</option>
              <option value="joyful">Joyful</option>
              <option value="content">Content</option>
              <option value="focused">Focused</option>
              <option value="tired">Tired</option>
              <option value="stressed">Stressed</option>
              <option value="grateful">Grateful</option>
              <option value="concerned">Concerned</option>
            </select>
          </div>
          <div class="ec-inline-field">
            <label for="ec-journal-energy">Energy</label>
            <select id="ec-journal-energy" class="blur-form-field">
              <option value="">Select energy…</option>
              <option value="1">Very low</option>
              <option value="2">Low</option>
              <option value="3">Steady</option>
              <option value="4">High</option>
              <option value="5">Excited</option>
            </select>
          </div>
        </div>
        <div class="ec-form-field">
          <input type="text" id="ec-journal-weather" class="blur-form-field" placeholder="Weather, environment, or setting" aria-label="Journal weather">
        </div>
        <div class="ec-form-field">
          <input type="text" id="ec-journal-gratitude" class="blur-form-field" placeholder="What are you grateful for today?" aria-label="Journal gratitude">
        </div>
        <div class="ec-form-field">
          <input type="text" id="ec-journal-tags" class="blur-form-field" placeholder="Tags (comma separated)" aria-label="Journal tags">
        </div>
        <div class="ec-form-field ec-journal-action-row">
          ${buildActionControls()}
        </div>
        ${buildNotesSection({ placeholder: notesPlaceholder })}
    `;
}

function buildKindSpecificFields(kind, { dateStr, timeStr }) {
    const config = ADD_ITEM_KIND_CONFIG[kind] || ADD_ITEM_KIND_CONFIG.todo;
    const notesPlaceholder = config.notesPlaceholder;
    if (kind === 'event') {
        return buildEventFields({ dateStr, timeStr, notesPlaceholder });
    }
    if (kind === 'journal') {
        return buildJournalFields({ dateStr, timeStr, notesPlaceholder });
    }
    return buildTodoFields({ notesPlaceholder });
}

function buildAddItemFormHTML({ displayDate, dateStr, timeStr, calendarId, calendarName, tzid, calendars = [] }) {
    const calendarOptions = Array.isArray(calendars) && calendars.length
        ? calendars.map(cal => {
            const idRaw = cal.calendar_id ?? cal.id ?? '';
            const id = escapeAttr(idRaw);
            const name = escapeHTML(cal.name ?? cal.calendar_name ?? 'Untitled calendar');
            const selected = String(idRaw) === String(calendarId) ? ' selected' : '';
            return `<option value="${id}"${selected}>${name}</option>`;
        }).join('')
        : `<option value="${escapeAttr(calendarId)}" selected>${escapeHTML(calendarName)}</option>`;

    return `
    <div class="ec-add-form ${ADD_ITEM_KIND_CONFIG.todo.className}" id="ec-add-form-root" data-active-kind="todo" style="margin:auto;">
      <h3 class="ec-form-title" id="ec-add-form-title">${ADD_ITEM_KIND_CONFIG.todo.heading(displayDate)}</h3>

      <form id="ec-add-item-form" autocomplete="off">
        <input id="ec-date" type="hidden" value="${escapeAttr(dateStr)}">
        <input id="ec-time" type="hidden" value="${escapeAttr(timeStr)}">
        <input id="ec-tzid" type="hidden" value="${escapeAttr(tzid)}">

        <div class="ec-form-field ec-title-row">
          <input id="ec-title" type="text" class="blur-form-field" placeholder="${ADD_ITEM_KIND_CONFIG.todo.titlePlaceholder}" style="height:45px;width:100%;cursor:text;margin-bottom: 5px;margin-top:10px;" aria-label="Title">
        </div>

        <div class="ec-form-field">
          <select id="ec-item-kind" class="blur-form-field" style="height:45px;width:100%;text-align:center;" aria-label="Item type">
            <option value="todo" selected>To-Do</option>
            <option value="event">Event</option>
            <option value="journal">Journal</option>
          </select>
        </div>

        <div class="ec-form-field">
          <select id="ec-calendar-select" class="blur-form-field" style="height:45px;width:100%;text-align:center;" aria-label="Calendar">
            ${calendarOptions}
            <option value="__add_new__">+ Add new calendar</option>
          </select>
        </div>

        <div id="ec-kind-fields" class="ec-kind-fields">
          ${buildKindSpecificFields('todo', { dateStr, timeStr })}
        </div>

        <div class="ec-form-actions">
          <button type="submit" id="ec-save-item" class="stellar-submit" style="height:44px;">${ADD_ITEM_KIND_CONFIG.todo.buttonLabel}</button>
        </div>
      </form>
    </div>
  `;
}

function captureKindFieldsState(container = document.getElementById('ec-kind-fields')) {
    if (!container) return null;
    const elements = container.querySelectorAll('input, select, textarea');
    if (!elements.length) return null;
    const state = {};
    elements.forEach((el) => {
        if (!el.id) return;
        if (el.type === 'checkbox' || el.type === 'radio') {
            state[el.id] = { checked: el.checked };
        } else {
            state[el.id] = { value: el.value };
        }
    });
    return state;
}

function restoreKindFieldsState(container = document.getElementById('ec-kind-fields'), state) {
    if (!container || !state) return;
    Object.entries(state).forEach(([id, stored]) => {
        const el = document.getElementById(id);
        if (!el || !container.contains(el)) return;
        if (stored && typeof stored === 'object') {
            if (Object.prototype.hasOwnProperty.call(stored, 'checked')) {
                el.checked = !!stored.checked;
            }
            if (Object.prototype.hasOwnProperty.call(stored, 'value')) {
                el.value = stored.value;
            }
        }
    });
}

function setupNotesToggle({ collapsedLabel = 'Show notes', expandedLabel = 'Hide notes' } = {}) {
    const notesToggle = document.getElementById('ec-notes-toggle');
    const notesBox = document.getElementById('ec-notes-box');
    if (!notesToggle || !notesBox) return;

    const notesField = notesBox.querySelector('textarea');
    const track = notesToggle.querySelector('.ec-notes-toggle-track');
    const thumb = notesToggle.querySelector('.ec-notes-toggle-thumb');

    const updateMaxHeight = () => {
        notesBox.style.maxHeight = `${notesBox.scrollHeight}px`;
    };

    const setNotesExpanded = (expanded) => {
        notesToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        notesToggle.setAttribute('aria-label', expanded ? expandedLabel : collapsedLabel);
        notesToggle.title = expanded ? expandedLabel : collapsedLabel;
        notesToggle.classList.toggle('is-open', expanded);
        if (track) track.classList.toggle('is-open', expanded);
        if (thumb) thumb.classList.toggle('is-open', expanded);

        notesBox.classList.toggle('is-open', expanded);
        notesBox.setAttribute('aria-hidden', expanded ? 'false' : 'true');
        if (expanded) {
            updateMaxHeight();
        } else {
            notesBox.style.maxHeight = '0px';
        }
    };

    setNotesExpanded(false);

    notesToggle.addEventListener('click', (event) => {
        event.preventDefault();
        const currentlyExpanded = notesToggle.getAttribute('aria-expanded') === 'true';
        setNotesExpanded(!currentlyExpanded);
    });

    if (notesField) {
        notesField.addEventListener('input', () => {
            if (notesToggle.getAttribute('aria-expanded') === 'true') {
                updateMaxHeight();
            }
        });
    }
}

function initializeEventFormInteractions() {
    const allDayCheckbox = document.getElementById('ec-event-all-day');
    const startTime = document.getElementById('ec-event-start-time');
    const endTime = document.getElementById('ec-event-end-time');
    const startDate = document.getElementById('ec-event-start-date');
    const endDate = document.getElementById('ec-event-end-date');
    const actionButtons = document.querySelector('.ec-event-action-row .date-action-buttons');
    let linkToggle = document.getElementById('ec-event-link-toggle');
    if (!linkToggle && actionButtons) {
        linkToggle = document.createElement('button');
        linkToggle.type = 'button';
        linkToggle.id = 'ec-event-link-toggle';
        linkToggle.className = 'ec-link-toggle-button';
        linkToggle.setAttribute('aria-expanded', 'false');
        linkToggle.setAttribute('aria-controls', 'ec-event-url-field');
        linkToggle.setAttribute('aria-label', 'Add event link');
        linkToggle.title = 'Add event link';
        linkToggle.textContent = '🔗';
        const notesToggle = actionButtons.querySelector('#ec-notes-toggle');
        if (notesToggle) {
            actionButtons.insertBefore(linkToggle, notesToggle);
        } else {
            actionButtons.appendChild(linkToggle);
        }
    }
    const eventUrlField = document.getElementById('ec-event-url-field');
    const eventUrlInput = document.getElementById('ec-event-url');

    if (allDayCheckbox) {
        const applyAllDayState = () => {
            const isAllDay = allDayCheckbox.checked;
            if (startTime) {
                startTime.disabled = isAllDay;
                if (isAllDay && !startTime.value) {
                    startTime.value = '00:00';
                }
            }
            if (endTime) {
                endTime.disabled = isAllDay;
                if (isAllDay) {
                    endTime.value = '';
                }
            }
        };

        applyAllDayState();
        allDayCheckbox.addEventListener('change', applyAllDayState);
    }

    if (startDate && endDate) {
        startDate.addEventListener('change', () => {
            if (!endDate.value) {
                endDate.value = startDate.value;
            }
        });
    }

    if (linkToggle && eventUrlField) {
        const setLinkFieldVisible = (visible, { focus = true } = {}) => {
            linkToggle.setAttribute('aria-expanded', visible ? 'true' : 'false');
            linkToggle.setAttribute('aria-label', visible ? 'Hide event link' : 'Add event link');
            linkToggle.title = visible ? 'Hide event link' : 'Add event link';
            linkToggle.classList.toggle('is-active', visible);
            eventUrlField.classList.toggle('is-hidden', !visible);
            if (visible && focus && eventUrlInput) {
                eventUrlInput.focus();
            }
        };

        linkToggle.addEventListener('click', (event) => {
            event.preventDefault();
            const isExpanded = linkToggle.getAttribute('aria-expanded') === 'true';
            setLinkFieldVisible(!isExpanded);
        });

        const shouldShowField = Boolean(eventUrlInput && eventUrlInput.value.trim() !== '');
        setLinkFieldVisible(shouldShowField, { focus: false });
    }
}

function applyKindToForm(kind, context = {}, { restoreState = null } = {}) {
    const root = document.getElementById('ec-add-form-root');
    const fieldsContainer = document.getElementById('ec-kind-fields');
    if (!root || !fieldsContainer) return;

    const config = ADD_ITEM_KIND_CONFIG[kind] || ADD_ITEM_KIND_CONFIG.todo;
    const allClasses = Object.values(ADD_ITEM_KIND_CONFIG).map(cfg => cfg.className);
    root.classList.remove(...allClasses);
    root.classList.add(config.className);
    root.dataset.activeKind = kind;

    const heading = document.getElementById('ec-add-form-title');
    if (heading) {
        const headingText = typeof config.heading === 'function'
            ? config.heading(context.displayDate || '')
            : config.heading;
        heading.textContent = headingText || '';
    }

    const titleInput = document.getElementById('ec-title');
    if (titleInput && config.titlePlaceholder) {
        titleInput.placeholder = config.titlePlaceholder;
    }

    const saveBtn = document.getElementById('ec-save-item');
    if (saveBtn && config.buttonLabel) {
        saveBtn.textContent = config.buttonLabel;
    }

    fieldsContainer.innerHTML = buildKindSpecificFields(kind, { dateStr: context.dateStr, timeStr: context.timeStr });

    if (restoreState) {
        restoreKindFieldsState(fieldsContainer, restoreState);
    }

    const notesLabels = {
        todo: { collapsed: 'Show notes', expanded: 'Hide notes' },
        event: { collapsed: 'Show details', expanded: 'Hide details' },
        journal: { collapsed: 'Show entry', expanded: 'Hide entry' }
    };
    const labelSet = notesLabels[kind] || notesLabels.todo;
    setupNotesToggle({ collapsedLabel: labelSet.collapsed, expandedLabel: labelSet.expanded });

    const storedEmoji = restoreState ? restoreState['ec-emoji'] : null;
    const emojiValue = sanitizeEmojiInput((storedEmoji && storedEmoji.value) || context.presetMoonEmoji || '🙂') || '🙂';
    const emojiInput = document.getElementById('ec-emoji');
    const emojiPreview = document.getElementById('ec-emoji-preview');
    if (emojiInput) emojiInput.value = emojiValue;
    if (emojiPreview) emojiPreview.textContent = emojiValue;
    if (root) {
        root.dataset.presetEmoji = emojiValue;
    }

    wireEmojiPicker({
        buttonId: 'ec-emoji-button',
        hiddenInputId: 'ec-emoji',
        previewId: 'ec-emoji-preview',
        defaultEmoji: emojiValue
    });

    const storedColor = restoreState ? restoreState['ec-color'] : null;
    if (storedColor && typeof storedColor.value === 'string') {
        const colorInput = document.getElementById('ec-color');
        if (colorInput) {
            colorInput.value = storedColor.value;
        }
    }

    if (kind === 'event') {
        initializeEventFormInteractions();
    }
}

const FEATURED_EC_EMOJIS = [
    '👍','🙏','🚀','🎉','❤️','💪','⚠️','😍','🤩','🤞','💾',
    '☀️','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌙','🌚','🌛','🌜','🌝',
    '🌎','🌍','🌏','🪐','☿️','♀️','♂️','♃','♄','♅','♆','♇'
];

const BASE_EC_EMOJIS = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
    '🙂','🙃','😉','😌','🥰','😘','😗','😙','😚',
    '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥳',
    '😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖',
    '😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯',
    '😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔',
    '🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦',
    '😧','😮','😲','🥱','😴','🤤','😪','😵','😵‍💫','🤐',
    '🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀',
    '☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼'
];

const EC_EMOJI_OPTIONS = Array.from(new Set([
    ...FEATURED_EC_EMOJIS,
    ...BASE_EC_EMOJIS
]));

function buildEmojiPicker() {
    return EC_EMOJI_OPTIONS
        .map(emoji => `<button type="button" class="ec-emoji-option" data-emoji="${escapeAttr(emoji)}">${emoji}</button>`)
        .join('');
}

function ensureGlobalEmojiPicker() {
    const selector = document.getElementById('ec-global-emoji-selector');
    if (!selector) return null;
    if (typeof document !== 'undefined' && document.body && selector.parentElement !== document.body) {
        try {
            document.body.appendChild(selector);
        } catch (err) {
            console.debug('[ensureGlobalEmojiPicker] unable to reparent selector', err);
        }
    }
    const grid = selector.querySelector('.ec-emoji-picker');
    if (!grid) return null;

    if (!grid.dataset.initialized) {
        grid.innerHTML = buildEmojiPicker();
        grid.dataset.initialized = 'true';
    }

    const closeButton = selector.querySelector('.ec-emoji-selector-close');
    return { selector, grid, closeButton };
}

let activeEmojiPickerControl = null;

function openGlobalEmojiPicker(button, onSelect) {
    const globalPicker = ensureGlobalEmojiPicker();
    if (!globalPicker) return null;

    const { selector, grid, closeButton } = globalPicker;

    if (activeEmojiPickerControl && activeEmojiPickerControl.close) {
        activeEmojiPickerControl.close();
    }

    let closed = false;

    const close = () => {
        if (closed) return;
        closed = true;
        selector.classList.remove('ec-emoji-selector--visible');
        selector.setAttribute('aria-hidden', 'true');
        selector.removeAttribute('data-active-button');
        button.setAttribute('aria-expanded', 'false');
        grid.removeEventListener('click', handleGridClick);
        if (closeButton) closeButton.removeEventListener('click', handleCloseClick);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleOutsideClick);
        if (activeEmojiPickerControl?.button === button) {
            activeEmojiPickerControl = null;
        }
    };

    const handleGridClick = (event) => {
        const option = event.target.closest('.ec-emoji-option');
        if (!option) return;
        const chosen = sanitizeEmojiInput(option.dataset.emoji || option.textContent || '');
        if (chosen) {
            onSelect(chosen);
        } else {
            onSelect('');
        }
        close();
    };

    const handleCloseClick = (event) => {
        event.preventDefault();
        close();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    };

    const handleOutsideClick = (event) => {
        if (selector.contains(event.target) || button.contains(event.target)) return;
        close();
    };
    let outsideHandlerAttached = false;

    selector.classList.add('ec-emoji-selector--visible');
    selector.setAttribute('aria-hidden', 'false');
    selector.dataset.activeButton = button.id || '';
    button.setAttribute('aria-expanded', 'true');

    grid.addEventListener('click', handleGridClick);
    if (closeButton) closeButton.addEventListener('click', handleCloseClick);
    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
        if (!closed) {
            document.addEventListener('click', handleOutsideClick);
            outsideHandlerAttached = true;
        }
    }, 0);

    const firstOption = grid.querySelector('.ec-emoji-option');
    if (firstOption) firstOption.focus();

    activeEmojiPickerControl = { button, close };
    const originalClose = close;
    activeEmojiPickerControl.close = () => {
        if (outsideHandlerAttached) {
            document.removeEventListener('click', handleOutsideClick);
            outsideHandlerAttached = false;
        }
        originalClose();
    };
    return activeEmojiPickerControl.close;
}

function wireEmojiPicker({ buttonId, hiddenInputId, previewId, defaultEmoji = '🙂' }) {
    const button = document.getElementById(buttonId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const preview = document.getElementById(previewId);

    if (!button || !hiddenInput || !preview) {
        return () => {};
    }

    ensureGlobalEmojiPicker();

    const fallbackEmoji = sanitizeEmojiInput(defaultEmoji) || '🙂';

    const applyEmoji = (emoji) => {
        const sanitized = sanitizeEmojiInput(emoji) || fallbackEmoji;
        hiddenInput.value = sanitized;
        preview.textContent = sanitized;
    };

    const handleButtonClick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (activeEmojiPickerControl?.button === button) {
            activeEmojiPickerControl.close();
            return;
        }

        openGlobalEmojiPicker(button, applyEmoji);
    };

    button.addEventListener('click', handleButtonClick);

    if (hiddenInput.value) {
        const sanitized = sanitizeEmojiInput(hiddenInput.value) || fallbackEmoji;
        hiddenInput.value = sanitized;
        preview.textContent = sanitized;
    } else {
        hiddenInput.value = fallbackEmoji;
        preview.textContent = fallbackEmoji;
    }

    return () => {
        button.removeEventListener('click', handleButtonClick);
        if (activeEmojiPickerControl?.button === button) {
            activeEmojiPickerControl.close();
        }
    };
}

/* ADD V1 CALENDAR  */

function resolveOverlayHost(hostTarget) {
    const isElement = (node) => node instanceof HTMLElement;

    if (isElement(hostTarget)) {
        return hostTarget;
    }

    if (hostTarget && typeof hostTarget === 'object') {
        if (isElement(hostTarget.host)) {
            return hostTarget.host;
        }
        if (isElement(hostTarget.container)) {
            return hostTarget.container;
        }
        if (hostTarget.currentTarget && isElement(hostTarget.currentTarget)) {
            const maybeHost = hostTarget.currentTarget.closest('#modal-content, #logged-in-view');
            if (maybeHost) return maybeHost;
        }
    }

    return document.getElementById('modal-content')
        || document.getElementById('logged-in-view')
        || document.body;
}

function prepareHostForOverlay(hostElement) {
    if (!hostElement) return () => {};

    const datasetKey = 'ecOverlayOriginalPosition';
    const datasetHadValue = Object.prototype.hasOwnProperty.call(hostElement.dataset, datasetKey);
    const previousInlinePosition = hostElement.style.position;
    const computedPosition = window.getComputedStyle(hostElement).position;
    let weChangedPosition = false;

    if (computedPosition === 'static') {
        if (!datasetHadValue) {
            hostElement.dataset[datasetKey] = previousInlinePosition || '__empty__';
        }
        hostElement.style.position = 'relative';
        weChangedPosition = true;
    }

    return () => {
        if (!weChangedPosition) return;

        if (!datasetHadValue) {
            const stored = hostElement.dataset[datasetKey];
            if (stored === '__empty__' || stored === undefined) {
                hostElement.style.removeProperty('position');
            } else {
                hostElement.style.position = stored;
            }
            delete hostElement.dataset[datasetKey];
        } else {
            hostElement.style.position = previousInlinePosition;
        }
    };
}

function removeOverlayById(id) {
    if (!id) return;
    const existingOverlay = document.getElementById(id);
    if (!existingOverlay) return;

    if (typeof existingOverlay.__ecTeardown === 'function') {
        existingOverlay.__ecTeardown();
    } else {
        existingOverlay.remove();
    }
}

function hijackHostCloseButton(hostElement, onClose) {
    if (!hostElement || typeof onClose !== 'function') {
        return () => {};
    }

    const findCloseButton = () => {
        const modalContainer = hostElement.closest('#form-modal-message');
        if (modalContainer) {
            const modalClose = modalContainer.querySelector('.x-button');
            if (modalClose) return modalClose;
        }

        const registrationFooter = hostElement.closest('#registration-footer');
        if (registrationFooter) {
            const footerClose = registrationFooter.querySelector('.x-button');
            if (footerClose) return footerClose;
        }

        return hostElement.querySelector('.x-button');
    };

    const closeButton = findCloseButton();
    if (!closeButton) {
        console.warn('[overlay] Unable to locate close button for host overlay.');
        return () => {};
    }

    const handler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
        onClose();
    };

    closeButton.addEventListener('click', handler, true);

    return () => {
        closeButton.removeEventListener('click', handler, true);
    };
}

async function addNewCalendarV1(hostTarget) {
    const hostElement = resolveOverlayHost(hostTarget);

    if (!(hostElement instanceof HTMLElement)) {
        console.warn('[addNewCalendarV1] overlay host not found.');
        return;
    }

    const user = getCurrentUser?.();
    if (!user?.buwana_id) {
        alert('Please log in to create a calendar.');
        if (typeof sendUpRegistration === 'function') sendUpRegistration();
        return;
    }

    const restoreHostPosition = prepareHostForOverlay(hostElement);

    // Remove any existing overlay
    removeOverlayById('ec-add-calendar-overlay');

    // Build overlay
    const overlay = document.createElement('div');
    overlay.id = 'ec-add-calendar-overlay';
    overlay.classList.add('main-background');
    Object.assign(overlay.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '20',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        gap: '20px',
        overflowY: 'auto',
        borderRadius: '10px',
        background: 'var(--general-background)'
    });

    overlay.innerHTML = `
        <div class="ec-add-calendar-header" style="display:flex;flex-direction:column;gap:8px;">
            <h2 style="margin:0;font-size:1.5rem;">Add New Calendar</h2>
            <p style="margin:0;color:var(--subdued-text);font-size:0.95rem;">
                Private calendars help you manage personal events, public calendars let folks subscribe to your lists of events.
            </p>
        </div>
        <form id="ec-add-calendar-form" style="display:flex;flex-direction:column;gap:16px;width:100%;max-width:100%;">
            <div style="display:flex;flex-direction:column;width:100%;">
                <label class="ec-visually-hidden" for="ec-cal-name">Calendar name</label>
                <input id="ec-cal-name" name="calendar_name" type="text" placeholder="Name your new calendar..." required
                       aria-label="Calendar name"
                       style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;flex-direction:column;width:100%;">
                <label class="ec-visually-hidden" for="ec-cal-description">Description</label>
                <input id="ec-cal-description" name="calendar_description" type="text"
                       placeholder="Describe what this calendar is for"
                       aria-label="Calendar description"
                       style="padding:10px;border-radius:8px;border:1px solid grey;font-weight:400;background:var(--top-header);width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;width:100%;">
                <div style="flex:1 1 200px;display:flex;flex-direction:column;min-width:min(200px,100%);">
                    <label class="ec-visually-hidden" for="ec-cal-category">Calendar category</label>
                    <select id="ec-cal-category" name="calendar_category"
                            aria-label="Calendar category"
                            style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;">
                        <option value="" disabled selected>Select calendar category...</option>
                        <option value="personal">Personal</option>
                        <option value="holidays">Holidays</option>
                        <option value="birthdays">Birthdays</option>
                        <option value="astronomy">Astronomy</option>
                        <option value="migration">Migration</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="ec-inline-field ec-emoji-field" style="width:auto;">
                    <div class="ec-emoji-input">
                        <button type="button" id="ec-cal-emoji-button" class="blur-form-field ec-emoji-button"
                                aria-haspopup="true" aria-expanded="false" aria-label="Choose calendar emoji"
                                style="width:45px;height:45px;display:flex;align-items:center;justify-content:center;">
                            <span id="ec-cal-emoji-preview" class="ec-emoji-preview">🌍</span>
                        </button>
                        <input type="hidden" id="ec-cal-emoji" name="calendar_emoji" value="🌍">
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;width:100%;">
                <div style="flex:1 1 200px;display:flex;flex-direction:column;min-width:min(200px,100%);">
                    <label class="ec-visually-hidden" for="ec-cal-visibility">Visibility</label>
                    <select id="ec-cal-visibility" name="calendar_visibility"
                            aria-label="Calendar visibility"
                            style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;">
                        <option value="public">Public</option>
                        <option value="private" selected>Private</option>
                    </select>
                </div>
                <div class="ec-inline-field ec-color-field" style="width:auto;display:flex;align-items:center;">
                    <input id="ec-cal-color" name="calendar_color" type="color" value="#ff6b6b"
                           class="blur-form-field ec-color-input" aria-label="Calendar color"
                           style="width:40px;height:40px;padding:0;">
                </div>
            </div>
            <div class="ec-add-calendar-actions" style="margin-top:8px;display:flex;">
                <button type="submit" class="stellar-submit">Create calendar</button>
            </div>
        </form>
    `;

    // 🧩 Append overlay to host
    hostElement.appendChild(overlay);

    const cleanupFns = [];

    // 🧠 Emoji picker integration
    const detachEmojiPicker = wireEmojiPicker({
        buttonId: 'ec-cal-emoji-button',
        hiddenInputId: 'ec-cal-emoji',
        previewId: 'ec-cal-emoji-preview',
        defaultEmoji: '🌍'
    });
    cleanupFns.push(detachEmojiPicker);

    let closed = false;
    const teardownOverlay = () => {
        if (closed) return;
        closed = true;
        while (cleanupFns.length) {
            const fn = cleanupFns.shift();
            try { fn && fn(); } catch (err) { console.debug('[addNewCalendarV1] cleanup failed:', err); }
        }
        if (overlay.parentElement) overlay.remove();
        restoreHostPosition();
        delete overlay.__ecTeardown;
    };
    overlay.__ecTeardown = teardownOverlay;

    const detachCloseButton = hijackHostCloseButton(hostElement, teardownOverlay);
    cleanupFns.push(detachCloseButton);

    // 📨 Form submission
    const form = overlay.querySelector('#ec-add-calendar-form');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const payload = {
                buwana_id: user.buwana_id,
                name: valueOf('#ec-cal-name'),
                description: valueOf('#ec-cal-description'),
                emoji: valueOf('#ec-cal-emoji'),
                color: valueOf('#ec-cal-color'),
                category: valueOf('#ec-cal-category'),
                visibility: valueOf('#ec-cal-visibility'),
                tzid: getUserTZ()
            };

            console.log('[addNewCalendarV1] Submitting new calendar:', payload);

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating…';

            try {
                const res = await fetch('/api/v1/add_new_cal.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(payload)
                });

                const data = await res.json().catch(() => ({}));
                console.log('[addNewCalendarV1] Response:', data);

                if (!res.ok || !data.ok) {
                    alert(data?.error || 'Could not create your calendar. Please try again.');
                    return;
                }

                // ✅ Success — Close overlay & refresh calendars
                alert(`✅ Calendar "${payload.name}" created successfully!`);
                teardownOverlay();

                if (typeof loadUserCalendars === 'function') {
                    let updatedCalendars = [];
                    try {
                        updatedCalendars = await loadUserCalendars(user.buwana_id, { force: true });
                    } catch (err) {
                        console.debug('[addNewCalendarV1] Unable to refresh calendars after create:', err);
                    }

                    let sortedCalendars = Array.isArray(updatedCalendars) ? [...updatedCalendars] : [];
                    if (typeof sortCalendarsByName === 'function') {
                        try {
                            sortedCalendars = sortCalendarsByName(updatedCalendars);
                        } catch (err) {
                            console.debug('[addNewCalendarV1] Unable to sort calendars for render:', err);
                        }
                    }

                    if (typeof persistCalendarListCache === 'function') {
                        try {
                            persistCalendarListCache(updatedCalendars || []);
                        } catch (err) {
                            console.debug('[addNewCalendarV1] Unable to refresh v1 calendar cache:', err);
                        }
                    } else {
                        try {
                            const payload = JSON.stringify(updatedCalendars || []);
                            sessionStorage.setItem('user_calendars_v1', payload);
                            localStorage.setItem('user_calendars_v1', payload);
                        } catch (err) {
                            console.debug('[addNewCalendarV1] Unable to refresh v1 calendar cache:', err);
                        }
                    }

                    if (typeof buildLegacyCalendarCache === 'function') {
                        try {
                            sessionStorage.setItem('user_calendars', JSON.stringify(buildLegacyCalendarCache(updatedCalendars || [])));
                        } catch (err) {
                            console.debug('[addNewCalendarV1] Unable to refresh legacy calendar cache:', err);
                        }
                    }

                    if (typeof renderCalendarSelectionForm === 'function') {
                        renderCalendarSelectionForm(sortedCalendars, { hostElement });
                    }
                }

            } catch (err) {
                console.error('[addNewCalendarV1] Error creating calendar:', err);
                alert('Network error — could not reach the server.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}

function openEditCalendarOverlay({ calendar, hostTarget } = {}) {
    if (!calendar || typeof calendar !== 'object') {
        console.warn('[openEditCalendarOverlay] calendar details missing or invalid.', calendar);
        return;
    }

    const hostElement = resolveOverlayHost(hostTarget);
    if (!(hostElement instanceof HTMLElement)) {
        console.warn('[openEditCalendarOverlay] overlay host not found.');
        return;
    }

    removeOverlayById('ec-add-calendar-overlay');
    removeOverlayById('ec-edit-calendar-overlay');

    const overlay = document.createElement('div');
    overlay.id = 'ec-edit-calendar-overlay';
    overlay.className = 'ec-calendar-overlay';

    const restoreHostPosition = prepareHostForOverlay(hostElement);

    Object.assign(overlay.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '20',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        gap: '20px',
        overflowY: 'auto',
        borderRadius: '10px',
        background: 'var(--general-background)'
    });

    overlay.innerHTML = `
        <div class="ec-add-calendar-header" style="display:flex;flex-direction:column;gap:8px;">
            <h2 style="margin:0;font-size:1.5rem;">Edit Your Calendar</h2>
            <p style="margin:0;color:var(--subdued-text);font-size:0.95rem;">
                Adjust the core information for your EarthCal calendar...
            </p>
        </div>
        <form id="ec-edit-calendar-form" style="display:flex;flex-direction:column;gap:16px;width:100%;max-width:100%;">
            <div style="display:flex;flex-direction:column;width:100%;">
                <label class="ec-visually-hidden" for="ec-edit-cal-name">Calendar name</label>
                <input id="ec-edit-cal-name" name="calendar_name" type="text" placeholder="Name your calendar..." required
                       aria-label="Calendar name"
                       style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;flex-direction:column;width:100%;">
                <label class="ec-visually-hidden" for="ec-edit-cal-description">Description</label>
                <input id="ec-edit-cal-description" name="calendar_description" type="text"
                       placeholder="Describe what this calendar is for"
                       aria-label="Calendar description"
                       style="padding:10px;border-radius:8px;border:1px solid grey;font-weight:400;background:var(--top-header);width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;width:100%;">
                <div style="flex:1 1 200px;display:flex;flex-direction:column;min-width:min(200px,100%);">
                    <label class="ec-visually-hidden" for="ec-edit-cal-category">Calendar category</label>
                    <select id="ec-edit-cal-category" name="calendar_category"
                            aria-label="Calendar category"
                            style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;">
                        <option value="" disabled>Select calendar category...</option>
                        <option value="personal">Personal</option>
                        <option value="holidays">Holidays</option>
                        <option value="birthdays">Birthdays</option>
                        <option value="astronomy">Astronomy</option>
                        <option value="migration">Migration</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="ec-inline-field ec-emoji-field" style="width:auto;">
                    <div class="ec-emoji-input">
                        <button type="button" id="ec-edit-cal-emoji-button" class="blur-form-field ec-emoji-button"
                                aria-haspopup="true" aria-expanded="false" aria-label="Choose calendar emoji"
                                style="width:45px;height:45px;display:flex;align-items:center;justify-content:center;">
                            <span id="ec-edit-cal-emoji-preview" class="ec-emoji-preview">🌍</span>
                        </button>
                        <input type="hidden" id="ec-edit-cal-emoji" name="calendar_emoji" value="🌍">
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;width:100%;">
                <div style="flex:1 1 200px;display:flex;flex-direction:column;min-width:min(200px,100%);">
                    <label class="ec-visually-hidden" for="ec-edit-cal-visibility">Visibility</label>
                    <select id="ec-edit-cal-visibility" name="calendar_visibility"
                            aria-label="Calendar visibility"
                            style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                </div>
                <div class="ec-inline-field ec-color-field" style="width:auto;display:flex;align-items:center;">
                    <input id="ec-edit-cal-color" name="calendar_color" type="color" value="#ff6b6b"
                           class="blur-form-field ec-color-input" aria-label="Calendar color"
                           style="width:40px;height:40px;padding:0;">
                </div>
            </div>
            <div class="ec-add-calendar-actions" style="margin-top:8px;display:flex;">
                <button type="submit" class="stellar-submit">💾 Save Calendar</button>
            </div>
            <p id="ec-edit-calendar-feedback" aria-live="polite" style="margin:0;color:var(--subdued-text);min-height:1.2em;font-size:0.9rem;"></p>
        </form>
    `;

    hostElement.appendChild(overlay);

    const cleanupFns = [];

    const normalizedCalendarId = Number.parseInt(calendar?.calendar_id ?? calendar?.id, 10);
    const rawName = (calendar?.name ?? calendar?.calendar_name ?? '').toString();
    const rawDescription = (calendar?.description ?? calendar?.calendar_description ?? '').toString();
    const rawCategory = (calendar?.category ?? calendar?.calendar_category ?? '').toString();
    const rawVisibility = (calendar?.visibility ?? (calendar?.calendar_public ? 'public' : 'private') ?? 'private').toString();
    const rawEmoji = (calendar?.emoji ?? calendar?.cal_emoji ?? calendar?.calendar_emoji ?? '🌍').toString();
    const rawColor = calendar?.color
        ?? calendar?.cal_color
        ?? calendar?.color_hex
        ?? calendar?.calendar_color
        ?? '#ff6b6b';

    const sanitizedEmoji = sanitizeEmojiInput(rawEmoji) || '🌍';
    const sanitizedColor = sanitizeHexColor(rawColor, '#ff6b6b');
    const categoryLower = rawCategory.trim().toLowerCase();
    const visibilityLower = rawVisibility.trim().toLowerCase() === 'public' ? 'public' : 'private';

    const nameField = overlay.querySelector('#ec-edit-cal-name');
    if (nameField) {
        nameField.value = rawName.trim();
    }

    const descriptionField = overlay.querySelector('#ec-edit-cal-description');
    if (descriptionField) {
        descriptionField.value = rawDescription.trim();
    }

    const categorySelect = overlay.querySelector('#ec-edit-cal-category');
    if (categorySelect instanceof HTMLSelectElement) {
        let matched = false;
        Array.from(categorySelect.options).forEach((option) => {
            if (option.value === categoryLower) {
                option.selected = true;
                matched = true;
            } else {
                option.selected = false;
            }
        });

        if (!matched && categoryLower) {
            const customOption = new Option(rawCategory.trim(), categoryLower, true, true);
            categorySelect.add(customOption);
        }
    }

    const visibilitySelect = overlay.querySelector('#ec-edit-cal-visibility');
    if (visibilitySelect instanceof HTMLSelectElement) {
        Array.from(visibilitySelect.options).forEach((option) => {
            option.selected = option.value === visibilityLower;
        });
    }

    const colorField = overlay.querySelector('#ec-edit-cal-color');
    if (colorField instanceof HTMLInputElement) {
        colorField.value = sanitizedColor;
    }

    const emojiHidden = overlay.querySelector('#ec-edit-cal-emoji');
    if (emojiHidden instanceof HTMLInputElement) {
        emojiHidden.value = sanitizedEmoji;
    }

    const emojiPreview = overlay.querySelector('#ec-edit-cal-emoji-preview');
    if (emojiPreview) {
        emojiPreview.textContent = sanitizedEmoji;
    }

    const detachEmojiPicker = wireEmojiPicker({
        buttonId: 'ec-edit-cal-emoji-button',
        hiddenInputId: 'ec-edit-cal-emoji',
        previewId: 'ec-edit-cal-emoji-preview',
        defaultEmoji: sanitizedEmoji
    });
    cleanupFns.push(detachEmojiPicker);

    let closed = false;
    const teardownOverlay = () => {
        if (closed) return;
        closed = true;
        while (cleanupFns.length) {
            const fn = cleanupFns.shift();
            try { fn && fn(); } catch (err) { console.debug('[openEditCalendarOverlay] cleanup failed:', err); }
        }
        if (overlay.parentElement) overlay.remove();
        restoreHostPosition();
        delete overlay.__ecTeardown;
    };
    overlay.__ecTeardown = teardownOverlay;

    const detachCloseButton = hijackHostCloseButton(hostElement, teardownOverlay);
    cleanupFns.push(detachCloseButton);

    const feedbackEl = overlay.querySelector('#ec-edit-calendar-feedback');

    const form = overlay.querySelector('#ec-edit-calendar-form');
    if (form instanceof HTMLFormElement) {
        const handleSubmit = async (event) => {
            event.preventDefault();

            const nameValue = (nameField?.value || '').toString().trim();
            const descriptionValue = (descriptionField?.value || '').toString().trim();
            const categoryValue = categorySelect instanceof HTMLSelectElement
                ? (categorySelect.value || '').toString().trim()
                : '';
            const visibilityValue = visibilitySelect instanceof HTMLSelectElement
                ? (visibilitySelect.value || '').toString().trim().toLowerCase()
                : 'private';
            const colorValue = colorField instanceof HTMLInputElement ? colorField.value : '#ff6b6b';
            const emojiValue = emojiHidden instanceof HTMLInputElement ? emojiHidden.value : sanitizedEmoji;

            if (!nameValue) {
                if (feedbackEl) {
                    feedbackEl.textContent = 'Please provide a calendar name before saving.';
                }
                if (nameField) {
                    nameField.focus();
                }
                return;
            }

            const normalizedVisibility = visibilityValue === 'public' ? 'public' : 'private';
            const normalizedCategory = categoryValue.toLowerCase();
            const sanitizedColorValue = sanitizeHexColor(colorValue, sanitizedColor);
            const sanitizedEmojiValue = sanitizeEmojiInput(emojiValue) || sanitizedEmoji;

            const detail = {
                calendarId: normalizedCalendarId,
                values: {
                    name: nameValue,
                    description: descriptionValue,
                    category: normalizedCategory,
                    visibility: normalizedVisibility,
                    color: sanitizedColorValue,
                    emoji: sanitizedEmojiValue
                },
                form,
                calendar
            };

            const editEvent = new CustomEvent('earthcal:edit-calendar-submit', {
                detail,
                bubbles: false,
                cancelable: true
            });

            const proceed = document.dispatchEvent(editEvent);

            if (!proceed) {
                return;
            }

            if (!Number.isFinite(normalizedCalendarId) || normalizedCalendarId <= 0) {
                if (feedbackEl) {
                    feedbackEl.textContent = 'We could not determine which calendar to update.';
                }
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton?.textContent || '💾 Save Calendar';
            const setButtonState = (disabled, label) => {
                if (!(submitButton instanceof HTMLButtonElement)) return;
                submitButton.disabled = disabled;
                if (typeof label === 'string') {
                    submitButton.textContent = label;
                }
            };

            setButtonState(true, 'Saving…');

            const { isLoggedIn: isUserLoggedIn, payload } = typeof isLoggedIn === 'function'
                ? isLoggedIn({ returnPayload: true })
                : { isLoggedIn: false, payload: null };

            if (!isUserLoggedIn || !payload?.buwana_id) {
                alert('You must be logged in to save changes to your calendar.');
                setButtonState(false, originalButtonText);
                return;
            }

            try {
                const response = await fetch('/api/v1/save_user_calendar.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        buwana_id: payload.buwana_id,
                        calendar_id: normalizedCalendarId,
                        name: nameValue,
                        description: descriptionValue,
                        category: normalizedCategory,
                        visibility: normalizedVisibility,
                        color: sanitizedColorValue,
                        emoji: sanitizedEmojiValue
                    })
                });

                const result = await response.json().catch(() => null);

                if (!response.ok || !result?.ok) {
                    const errorKey = result?.error || `HTTP_${response.status}`;
                    throw new Error(errorKey);
                }
            } catch (error) {
                console.error('[openEditCalendarOverlay] Failed to save calendar via API', error);
                if (feedbackEl) {
                    feedbackEl.textContent = 'We could not save your calendar. Please try again.';
                }
                if (typeof setSyncStatus === 'function') {
                    setSyncStatus('⚠️ Unable to save calendar changes.', '', false, { temporary: true, duration: 4000 });
                }
                setButtonState(false, originalButtonText);
                return;
            }

            let storedCalendars = [];
            let updated = false;
            try {
                if (typeof readCalendarListCache === 'function') {
                    storedCalendars = readCalendarListCache() || [];
                } else {
                    const raw = sessionStorage.getItem('user_calendars_v1') || localStorage.getItem('user_calendars_v1');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            storedCalendars = parsed;
                        }
                    }
                }
            } catch (err) {
                console.debug('[openEditCalendarOverlay] Unable to read cached calendars:', err);
            }

            const nowIso = new Date().toISOString();

            const mapper = (entry) => {
                const entryId = Number.parseInt(entry?.calendar_id ?? entry?.id, 10);
                if (!Number.isFinite(entryId) || entryId !== normalizedCalendarId) {
                    return entry;
                }
                updated = true;
                return {
                    ...entry,
                    name: nameValue,
                    calendar_name: nameValue,
                    description: descriptionValue,
                    calendar_description: descriptionValue,
                    category: normalizedCategory,
                    calendar_category: normalizedCategory,
                    visibility: normalizedVisibility,
                    calendar_public: normalizedVisibility === 'public' ? 1 : 0,
                    emoji: sanitizedEmojiValue,
                    cal_emoji: sanitizedEmojiValue,
                    calendar_emoji: sanitizedEmojiValue,
                    color: sanitizedColorValue,
                    cal_color: sanitizedColorValue,
                    color_hex: sanitizedColorValue,
                    calendar_color: sanitizedColorValue,
                    updated_at: nowIso,
                    last_updated: nowIso
                };
            };

            const nextCalendars = storedCalendars.map(mapper);

            if (updated) {
                if (typeof persistCalendarListCache === 'function') {
                    try {
                        persistCalendarListCache(nextCalendars);
                    } catch (err) {
                        console.debug('[openEditCalendarOverlay] Unable to update calendar cache:', err);
                    }
                } else {
                    try {
                        const payload = JSON.stringify(nextCalendars);
                        sessionStorage.setItem('user_calendars_v1', payload);
                        localStorage.setItem('user_calendars_v1', payload);
                    } catch (err) {
                        console.debug('[openEditCalendarOverlay] Unable to update calendar cache:', err);
                    }
                }

                if (typeof buildLegacyCalendarCache === 'function') {
                    try {
                        const legacyCache = buildLegacyCalendarCache(nextCalendars);
                        sessionStorage.setItem('user_calendars', JSON.stringify(legacyCache));
                    } catch (err) {
                        console.debug('[openEditCalendarOverlay] Unable to update legacy calendar cache:', err);
                    }
                }

                if (typeof showLoggedInView === 'function') {
                    try {
                        showLoggedInView(nextCalendars);
                    } catch (err) {
                        console.debug('[openEditCalendarOverlay] Unable to refresh calendar view:', err);
                    }
                }

                if (typeof setSyncStatus === 'function') {
                    setSyncStatus('💾 Calendar details updated!', '', false, { temporary: true, duration: 3500 });
                }

                if (feedbackEl) {
                    feedbackEl.textContent = 'Calendar updated!';
                }

                setButtonState(false, originalButtonText);

                setTimeout(() => {
                    if (feedbackEl) {
                        feedbackEl.textContent = '';
                    }
                    teardownOverlay();
                }, 400);
            } else {
                if (feedbackEl) {
                    feedbackEl.textContent = 'Unable to locate this calendar in your list.';
                }
                setButtonState(false, originalButtonText);
            }
        };

        form.addEventListener('submit', handleSubmit);
        cleanupFns.push(() => form.removeEventListener('submit', handleSubmit));
    }

    requestAnimationFrame(() => {
        if (nameField instanceof HTMLInputElement) {
            nameField.focus();
            nameField.select();
        }
    });
}

function displayMoonPhasev1({ date, container } = {}) {
    let host = null;
    if (container instanceof HTMLElement) {
        host = container;
    } else {
        host = document.querySelector('#modal-content .ec-add-form')
            || document.querySelector('#modal-content .add-date-form');
    }
    if (!host) {
        console.warn('[displayMoonPhasev1] Unable to locate add item form container.');
        return null;
    }

    if (typeof SunCalc === 'undefined' || typeof SunCalc.getMoonIllumination !== 'function') {
        console.warn('[displayMoonPhasev1] SunCalc library is unavailable.');
        return null;
    }

    const isValidDate = value => value instanceof Date && !Number.isNaN(value.getTime());
    const target = isValidDate(date) ? date : new Date();

    const lat = -8.506853;
    const lon = 115.262477;

    const safeToFixed = (value, digits) => (Number.isFinite(value) ? value.toFixed(digits) : null);
    const normalizePhase = phase => (Number.isFinite(phase) ? phase : 0);
    const getPhaseIndexLocal = phase => Math.round(normalizePhase(phase) * 30);
    const getMoonPhaseEmojiLocal = phase => {
        const phaseIndex = getPhaseIndexLocal(phase);
        if (phaseIndex <= 1) return '🌑';
        if (phaseIndex > 1 && phaseIndex <= 6) return '🌒';
        if (phaseIndex > 6 && phaseIndex <= 9) return '🌓';
        if (phaseIndex > 9 && phaseIndex <= 14) return '🌔';
        if (phaseIndex > 14 && phaseIndex <= 16) return '🌕';
        if (phaseIndex > 16 && phaseIndex <= 22) return '🌖';
        if (phaseIndex > 22 && phaseIndex <= 24) return '🌗';
        if (phaseIndex > 24 && phaseIndex <= 29) return '🌘';
        return '🌑';
    };
    const getMoonPhaseNameLocal = phase => {
        const phaseIndex = getPhaseIndexLocal(phase);
        if (phaseIndex > 0 && phaseIndex <= 1) return 'New Moon';
        if (phaseIndex > 1 && phaseIndex <= 7) return 'Waxing Crescent';
        if (phaseIndex === 8) return 'First Quarter';
        if (phaseIndex > 8 && phaseIndex <= 14) return 'Waxing Gibbous';
        if (phaseIndex > 14 && phaseIndex <= 16) return 'Full Moon';
        if (phaseIndex > 16 && phaseIndex <= 23) return 'Waning Gibbous';
        if (phaseIndex === 24) return 'Last Quarter';
        if (phaseIndex > 24 && phaseIndex <= 29) return 'Waning Crescent';
        return 'New Moon';
    };

    const moonIllumination = SunCalc.getMoonIllumination(target);
    const phase = normalizePhase(moonIllumination?.phase);
    const fraction = Number.isFinite(moonIllumination?.fraction) ? moonIllumination.fraction : null;
    const emoji = getMoonPhaseEmojiLocal(phase);

    let moonPosition;
    try {
        moonPosition = SunCalc.getMoonPosition(target, lat, lon);
    } catch (err) {
        console.warn('[displayMoonPhasev1] Unable to compute moon position.', err);
    }

    const distance = Number.isFinite(moonPosition?.distance) ? moonPosition.distance : null;

    const maxMoonDist = 406700;
    const minMoonDist = 363300;
    const percentOfMax = Number.isFinite(distance)
        ? ((distance - minMoonDist) / (maxMoonDist - minMoonDist)) * 100
        : null;

    const metrics = [];
    if (fraction !== null) {
        metrics.push({
            text: `${Math.round(fraction * 100)}% illuminated`,
            className: 'ec-moon-phase-metric--illumination'
        });
    }
    if (percentOfMax !== null && Number.isFinite(percentOfMax)) {
        metrics.push({
            text: `${safeToFixed(percentOfMax, 0)}% max distance`,
            className: 'ec-moon-phase-metric--distance'
        });
    }

    const existing = host.querySelector('.ec-moon-phase');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'ec-moon-phase';
    const metricsHtml = metrics.map(({ text, className }) => {
        const classes = ['ec-moon-phase-metric'];
        if (className) classes.push(className);
        return `<div class="${classes.join(' ')}">${text}</div>`;
    }).join('');

    wrapper.innerHTML = `
        <div class="ec-moon-phase-emoji" aria-hidden="true">${emoji}</div>
        <div class="ec-moon-phase-details">
            <div class="ec-moon-phase-name">${getMoonPhaseNameLocal(phase)}</div>
            ${metricsHtml}
        </div>
    `;


    const title = host.querySelector('.ec-form-title');
    if (title && title.parentNode === host) {
        host.insertBefore(wrapper, title);
    } else {
        host.prepend(wrapper);
    }

    return {
        emoji,
        phase,
        fraction,
        distance,
        element: wrapper
    };
}



async function showPublicCalendars(hostTarget) {
    const hostElement = resolveOverlayHost(hostTarget);

    if (!(hostElement instanceof HTMLElement)) {
        console.warn('[showPublicCalendars] overlay host not found.');
        return;
    }

    const langGuess = window.userLanguage || (typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en';
    const normalizedLang = typeof langGuess === 'string' ? langGuess.slice(0, 2).toLowerCase() : 'en';
    let noPublicText = 'No public calendars available.';

    if (typeof loadTranslations === 'function') {
        try {
            const translations = await loadTranslations(normalizedLang);
            if (translations?.loggedIn?.noPublic) {
                noPublicText = translations.loggedIn.noPublic;
            }
        } catch (err) {
            console.debug('[showPublicCalendars] Unable to load translations:', err);
        }
    }

    const restoreHostPosition = prepareHostForOverlay(hostElement);
    removeOverlayById('ec-public-cal-overlay');

    const overlay = document.createElement('div');
    overlay.id = 'ec-public-cal-overlay';
    overlay.classList.add('main-background');
    Object.assign(overlay.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '20',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        overflowY: 'auto',
        borderRadius: '10px',
        background: 'var(--general-background)',
        fontFamily: "'Mulish', 'Helvetica Neue', Arial, sans-serif",
        boxSizing: 'border-box',
        width: '100%'
    });

    overlay.innerHTML = `
        <div class="ec-public-cal-overlay-content" role="dialog" aria-labelledby="ec-public-overlay-heading">
            <div class="ec-add-calendar-header" style="display:flex;flex-direction:column;gap:8px;">
                <h2 id="ec-public-overlay-heading" style="margin:0;font-size:1.5rem;">Explore public Earthcals</h2>
                <p style="margin:0;color:var(--subdued-text);font-size:0.95rem;">
                    Subscribe to community calendars curated by fellow Earthcal keepers.
                </p>
            </div>
            <div id="ec-select-public-cals" class="ec-public-cal-list" role="list"></div>
            <div class="ec-public-pagination">
                <button type="button" class="ec-public-nav-link" data-ec-public-nav="prev">← Previous 10</button>
                <span class="ec-public-page-status"></span>
                <button type="button" class="ec-public-nav-link" data-ec-public-nav="next">Next 10 →</button>
            </div>
        </div>
    `;

    hostElement.appendChild(overlay);

    const cleanupFns = [];
    let closed = false;
    const teardownOverlay = () => {
        if (closed) return;
        closed = true;
        while (cleanupFns.length) {
            const fn = cleanupFns.shift();
            try { fn && fn(); } catch (err) { console.debug('[showPublicCalendars] cleanup failed:', err); }
        }
        if (overlay.parentElement) overlay.remove();
        restoreHostPosition();
        delete overlay.__ecTeardown;
    };
    overlay.__ecTeardown = teardownOverlay;

    const detachCloseButton = hijackHostCloseButton(hostElement, teardownOverlay);
    cleanupFns.push(detachCloseButton);

    const handleEscape = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            teardownOverlay();
        }
    };
    document.addEventListener('keydown', handleEscape);
    cleanupFns.push(() => document.removeEventListener('keydown', handleEscape));

    const listContainer = overlay.querySelector('#ec-select-public-cals');
    const pagination = overlay.querySelector('.ec-public-pagination');
    const prevBtn = overlay.querySelector('[data-ec-public-nav="prev"]');
    const nextBtn = overlay.querySelector('[data-ec-public-nav="next"]');
    const pageStatus = overlay.querySelector('.ec-public-page-status');

    if (!listContainer) {
        console.warn('[showPublicCalendars] list container not found.');
        teardownOverlay();
        return;
    }

    const loader = document.createElement('div');
    loader.className = 'ec-public-loader';
    loader.textContent = 'Loading public calendars…';
    loader.style.color = 'var(--subdued-text)';
    listContainer.appendChild(loader);

    let calendars = [];
    try {
        calendars = await loadPublicCalendars({ force: true });
    } catch (err) {
        console.warn('[showPublicCalendars] Unable to load public calendars:', err);
    }

    if (loader.parentElement) loader.remove();

    calendars = Array.isArray(calendars) ? calendars.filter(Boolean) : [];
    calendars.sort((a, b) => {
        const nameA = (a?.name || '').toLocaleLowerCase();
        const nameB = (b?.name || '').toLocaleLowerCase();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });

    if (!calendars.length) {
        const empty = document.createElement('p');
        empty.textContent = noPublicText;
        empty.style.margin = '0';
        empty.style.color = 'var(--subdued-text)';
        listContainer.appendChild(empty);
        if (pagination) pagination.style.display = 'none';
        return;
    }

    const pageSize = 10;
    let pageIndex = 0;
    let expandedRowId = null;

    const collapseRow = (rowId) => {
        const row = document.getElementById(rowId);
        if (!row) return;
        row.classList.remove('is-expanded');
        if (expandedRowId === rowId) {
            expandedRowId = null;
        }
    };

    const toggleRow = (rowId) => {
        const row = document.getElementById(rowId);
        if (!row) return;
        const willExpand = !row.classList.contains('is-expanded');
        if (expandedRowId && expandedRowId !== rowId) {
            collapseRow(expandedRowId);
        }
        row.classList.toggle('is-expanded', willExpand);
        expandedRowId = willExpand ? rowId : null;
    };

    const createTextValue = (value) => {
        if (value === null || value === undefined) {
            const empty = document.createElement('span');
            empty.className = 'cal-detail-empty';
            empty.textContent = '—';
            return empty;
        }
        const str = typeof value === 'string' ? value.trim() : String(value);
        if (!str) {
            const empty = document.createElement('span');
            empty.className = 'cal-detail-empty';
            empty.textContent = '—';
            return empty;
        }
        const span = document.createElement('span');
        span.textContent = str;
        return span;
    };

    const formatDateValue = (value) => {
        if (!value) return createTextValue(null);
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return createTextValue(date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
        }
        return createTextValue(value);
    };

    const buildRow = (cal, absoluteIndex) => {
        const safeSuffix = String(cal?.calendar_id ?? `index-${absoluteIndex}`).replace(/[^a-zA-Z0-9_-]/g, '-');
        const rowId = `public-cal-row-${safeSuffix}`;
        const row = document.createElement('div');
        row.className = 'cal-toggle-row';
        row.id = rowId;
        row.dataset.calendarId = cal?.calendar_id ?? '';

        const summary = document.createElement('div');
        summary.className = 'cal-row-summary';
        summary.addEventListener('click', () => toggleRow(rowId));

        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'cal-row-emoji';
        const emoji = sanitizeEmojiInput(cal?.emoji || '📅') || '📅';
        emojiSpan.dataset.emoji = emoji;
        emojiSpan.setAttribute('aria-hidden', 'true');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'cal-row-name';
        nameSpan.textContent = cal?.name || 'Untitled Calendar';

        const subscribeLabel = document.createElement('label');
        subscribeLabel.className = 'ec-public-cal-checkbox';
        subscribeLabel.title = 'Subscribe to this calendar';
        subscribeLabel.addEventListener('click', (event) => event.stopPropagation());

        const subscribeCheckbox = document.createElement('input');
        subscribeCheckbox.type = 'checkbox';
        subscribeCheckbox.checked = !!cal?.is_subscribed;
        subscribeCheckbox.setAttribute('aria-label', 'Subscribe to this calendar');
        subscribeCheckbox.addEventListener('click', (event) => event.stopPropagation());

        const subscribeText = document.createElement('span');
        subscribeText.style.fontSize = '0.65em';

        const updateSubscribeState = () => {
            const isChecked = !!subscribeCheckbox.checked;
            subscribeLabel.classList.toggle('is-active', isChecked);
            subscribeCheckbox.setAttribute(
                'aria-label',
                isChecked ? 'Unsubscribe from this calendar' : 'Subscribe to this calendar'
            );
            subscribeLabel.title = isChecked ? 'Unsubscribe from this calendar' : 'Subscribe to this calendar';
            subscribeText.textContent = isChecked ? 'Subscribed' : 'Not subscribed';
        };

        updateSubscribeState();

        subscribeCheckbox.addEventListener('change', async (event) => {
            event.stopPropagation();

            const desired = !!event.target.checked;
            const previous = !desired;
            const calendarNumericId = Number(cal?.calendar_id);

            if (!Number.isFinite(calendarNumericId)) {
                console.warn('[showPublicCalendars] Missing calendar_id for public calendar subscribe.');
                event.target.checked = previous;
                updateSubscribeState();
                alert('Unable to identify this calendar. Please try again later.');
                return;
            }

            if (typeof toggleSubscription !== 'function') {
                console.warn('[showPublicCalendars] toggleSubscription function is unavailable.');
                event.target.checked = previous;
                updateSubscribeState();
                alert('Subscriptions are unavailable right now. Please try again later.');
                return;
            }

            subscribeLabel.classList.add('is-loading');
            subscribeCheckbox.disabled = true;
            subscribeText.textContent = desired ? 'Subscribing…' : 'Removing…';

            try {
                const result = await toggleSubscription(calendarNumericId, desired, cal?.subscription_id);
                if (!result?.success) {
                    event.target.checked = previous;
                    updateSubscribeState();
                    return;
                }

                if (desired) {
                    cal.is_subscribed = true;
                    cal.is_active = true;
                } else {
                    cal.is_subscribed = false;
                    cal.is_active = false;
                }

                if (Array.isArray(result.calendars)) {
                    const match = result.calendars.find((entry) => Number(entry?.calendar_id) === calendarNumericId);
                    if (match) {
                        cal.subscription_id = match.subscription_id;
                        cal.is_active = !!match.is_active;
                        if (match.source_type) {
                            cal.source_type = match.source_type;
                        }
                    } else if (!desired) {
                        delete cal.subscription_id;
                    }

                    if (typeof refreshLoggedInCalendarLists === 'function') {
                        refreshLoggedInCalendarLists(result.calendars);
                    }
                } else if (typeof refreshLoggedInCalendarLists === 'function') {
                    refreshLoggedInCalendarLists();
                }
            } catch (err) {
                console.error('[showPublicCalendars] Unable to update subscription:', err);
                event.target.checked = previous;
            } finally {
                subscribeCheckbox.disabled = false;
                subscribeLabel.classList.remove('is-loading');
                updateSubscribeState();
            }
        });

        subscribeLabel.appendChild(subscribeCheckbox);
        subscribeLabel.appendChild(subscribeText);

        summary.appendChild(emojiSpan);
        summary.appendChild(nameSpan);
        summary.appendChild(subscribeLabel);

        const details = document.createElement('div');
        details.className = 'cal-row-details';

        const detailsList = document.createElement('dl');
        detailsList.className = 'cal-details-list';

        const appendDetail = (label, valueNode) => {
            const item = document.createElement('div');
            item.className = 'cal-detail-item';
            const dt = document.createElement('dt');
            dt.textContent = label;
            const dd = document.createElement('dd');
            if (valueNode instanceof HTMLElement) {
                dd.appendChild(valueNode);
            } else if (typeof valueNode === 'string') {
                dd.textContent = valueNode;
            } else {
                dd.appendChild(createTextValue(null));
            }
            item.appendChild(dt);
            item.appendChild(dd);
            detailsList.appendChild(item);
        };

        appendDetail('Description', createTextValue(cal?.description));
        const curator = cal?.owner || cal?.curator || cal?.publisher || cal?.creator || cal?.creator_name;
        if (curator) {
            appendDetail('Curated by', createTextValue(curator));
        }

        const eventCount = Number(cal?.event_count);
        appendDetail('Events', createTextValue(Number.isFinite(eventCount) ? eventCount : null));
        appendDetail('Category', createTextValue(cal?.category));
        appendDetail('Updated', formatDateValue(cal?.updated_at));
        appendDetail('Created', formatDateValue(cal?.created_at));

        const colorHex = sanitizeHexColor(cal?.color_hex || cal?.color || cal?.calendar_color);
        const colorValue = document.createElement('span');
        const colorDot = document.createElement('span');
        colorDot.className = 'cal-color-dot';
        colorDot.style.background = colorHex;
        colorValue.appendChild(colorDot);
        colorValue.appendChild(document.createTextNode(` ${colorHex}`));
        appendDetail('Color', colorValue);

        const sourceUrl = sanitizeUrl(cal?.source_url || cal?.url || cal?.website || cal?.link);
        if (sourceUrl) {
            const link = document.createElement('a');
            link.href = sourceUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = sourceUrl;
            appendDetail('More info', link);
        }

        details.appendChild(detailsList);

        row.appendChild(summary);
        row.appendChild(details);
        row.setAttribute('role', 'listitem');

        return row;
    };

    const renderPage = () => {
        const start = pageIndex * pageSize;
        const pageItems = calendars.slice(start, start + pageSize);
        listContainer.innerHTML = '';
        pageItems.forEach((cal, idx) => {
            const row = buildRow(cal, start + idx);
            listContainer.appendChild(row);
        });
        const rangeEnd = Math.min(start + pageItems.length, calendars.length);
        if (pageStatus) {
            pageStatus.textContent = `Showing ${start + 1}–${rangeEnd} of ${calendars.length}`;
        }
        if (prevBtn) prevBtn.disabled = pageIndex === 0;
        if (nextBtn) nextBtn.disabled = rangeEnd >= calendars.length;
        if (pagination) {
            pagination.style.display = calendars.length > pageSize ? 'flex' : 'none';
        }
    };

    const handlePrev = (event) => {
        event.preventDefault();
        if (pageIndex === 0) return;
        pageIndex -= 1;
        expandedRowId = null;
        renderPage();
    };

    const handleNext = (event) => {
        event.preventDefault();
        if ((pageIndex + 1) * pageSize >= calendars.length) return;
        pageIndex += 1;
        expandedRowId = null;
        renderPage();
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', handlePrev);
        cleanupFns.push(() => prevBtn.removeEventListener('click', handlePrev));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', handleNext);
        cleanupFns.push(() => nextBtn.removeEventListener('click', handleNext));
    }

    renderPage();
}


function collectAddItemFormData(user) {
    const kind = (valueOf('#ec-item-kind') || 'todo').toLowerCase();
    const calendarSelection = valueOf('#ec-calendar-select');
    const calendar_id = calendarSelection && calendarSelection !== '__add_new__' ? calendarSelection : null;
    const title = valueOf('#ec-title')?.trim() || '';
    const pinned = checked('#ec-pinned');
    const formRoot = document.getElementById('ec-add-form-root');
    const emojiPreview = document.getElementById('ec-emoji-preview');
    const rawEmojiInput = valueOf('#ec-emoji');
    const fallbackEmoji = emojiPreview?.textContent || formRoot?.dataset?.presetEmoji || '';
    const rawEmoji = rawEmojiInput || fallbackEmoji;
    const emoji = rawEmoji ? sanitizeEmojiInput(rawEmoji) : null;
    const color_hex = valueOf('#ec-color') || null;
    const tzid = valueOf('#ec-tzid') || getUserTZ();
    const baseDate = valueOf('#ec-date');
    const baseTime = valueOf('#ec-time');
    const notes = valueOf('#ec-notes') || null;

    const payload = {
        buwana_id: user.buwana_id,
        calendar_id,
        item_kind: ['event', 'journal'].includes(kind) ? kind : 'todo',
        title,
        tzid,
        pinned,
        emoji,
        color_hex,
        notes
    };

    if (payload.item_kind === 'todo') {
        const frequency = valueOf('#ec-frequency') || 'today';
        const start_local = `${baseDate} ${baseTime || '00:00'}`.trim();
        payload.start_local = start_local;
        payload.all_day = false;
        payload.frequency = frequency;
    } else if (payload.item_kind === 'event') {
        const startDate = valueOf('#ec-event-start-date') || baseDate;
        const startTime = valueOf('#ec-event-start-time') || baseTime || '00:00';
        const endDate = valueOf('#ec-event-end-date') || startDate;
        const endTime = valueOf('#ec-event-end-time') || startTime;
        const allDay = checked('#ec-event-all-day');
        const location = valueOf('#ec-event-location') || null;
        const url = valueOf('#ec-event-url') || null;

        const startLocal = `${startDate} ${allDay ? '00:00' : (startTime || '00:00')}`.trim();
        let endLocal = null;
        let durationMinutes = null;

        if (allDay) {
            endLocal = `${endDate} 00:00`.trim();
            const startDay = startDate ? new Date(`${startDate}T00:00:00`) : null;
            const endDay = endDate ? new Date(`${endDate}T00:00:00`) : null;
            const startValid = startDay instanceof Date && !Number.isNaN(startDay.getTime());
            const endValid = endDay instanceof Date && !Number.isNaN(endDay.getTime());
            if (startValid && endValid) {
                const diffMs = endDay.getTime() - startDay.getTime();
                if (Number.isFinite(diffMs) && diffMs > 0) {
                    durationMinutes = Math.round(diffMs / 60000);
                } else {
                    durationMinutes = 24 * 60;
                }
            }
        } else {
            endLocal = `${endDate} ${endTime || startTime}`.trim();
            const startDateTime = startDate ? new Date(`${startDate}T${(startTime || '00:00')}:00`) : null;
            const endDateTime = endDate ? new Date(`${endDate}T${(endTime || startTime || '00:00')}:00`) : null;
            const startValid = startDateTime instanceof Date && !Number.isNaN(startDateTime.getTime());
            const endValid = endDateTime instanceof Date && !Number.isNaN(endDateTime.getTime());
            if (startValid && endValid) {
                const diffMs = endDateTime.getTime() - startDateTime.getTime();
                if (Number.isFinite(diffMs) && diffMs > 0) {
                    durationMinutes = Math.round(diffMs / 60000);
                }
            }
        }

        payload.start_local = startLocal;
        payload.end_local = endLocal;
        payload.all_day = allDay;
        if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
            payload.duration_minutes = durationMinutes;
        }
        if (location) payload.location = location;
        if (url) payload.url = url;
    } else if (payload.item_kind === 'journal') {
        const entryDate = valueOf('#ec-journal-entry-date') || baseDate;
        const entryTime = valueOf('#ec-journal-entry-time') || baseTime || '00:00';
        const mood = valueOf('#ec-journal-mood') || null;
        const energy = valueOf('#ec-journal-energy') || null;
        const weather = valueOf('#ec-journal-weather') || null;
        const gratitude = valueOf('#ec-journal-gratitude') || null;
        const tagsRaw = valueOf('#ec-journal-tags') || '';

        payload.start_local = `${entryDate} ${entryTime || '00:00'}`.trim();
        payload.all_day = false;

        const extras = {};
        if (mood) extras.mood = mood;
        if (energy) extras.energy = Number(energy) || energy;
        if (weather) extras.weather = weather;
        if (gratitude) extras.gratitude = gratitude;

        const categories = tagsRaw
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean);
        if (categories.length) {
            payload.categories = categories;
        }

        if (Object.keys(extras).length) {
            payload.extras = extras;
        }
    }

    return payload;
}

// ---- Small utilities ----

function getCurrentUser() {
    try {
        const s = JSON.parse(sessionStorage.getItem('buwana_user') || '{}');
        if (s && s.buwana_id) return s;
    } catch {}
    const id = localStorage.getItem('buwana_id');
    if (id) return { buwana_id: Number(id) || id };
    return null;
}

function getUserTZ() {
    const u = getCurrentUser();
    if (u?.time_zone && typeof u.time_zone === 'string' && u.time_zone.length) return u.time_zone;
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC'; } catch { return 'Etc/UTC'; }
}

function resolveTargetDateParts() {
    // Use global `targetDate` if present, else now.
    let d = (typeof targetDate !== 'undefined' && targetDate) ? targetDate : new Date();
    if (typeof d === 'string') d = new Date(d);
    if (!(d instanceof Date) || isNaN(d)) d = new Date();

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const MM = String(d.getMinutes()).padStart(2, '0');
    return {
        dateStr: `${yyyy}-${mm}-${dd}`,
        timeStr: `${HH}:${MM}`,
        isoLocal: d.toISOString()
    };
}

async function getDefaultCalendarForUser(buwana_id) {
    // Best effort:
    // 1) cached default id/name in sessionStorage
    // 2) cached calendar list in sessionStorage
    // 3) fallback to "My Calendar" label with blank id
    try {
        const cached = JSON.parse(sessionStorage.getItem('earthcal_calendars') || '[]');
        if (Array.isArray(cached) && cached.length) {
            // heuristic: is_default flag, else name match, else first personal
            const def = cached.find(c => c.is_default) ||
                cached.find(c => /my\s*calendar/i.test(c.name || c.calendar_name)) ||
                cached.find(c => (c.category || '').toLowerCase() === 'personal') ||
                cached[0];
            if (def) return { id: def.calendar_id ?? def.id ?? '', name: def.name ?? def.calendar_name ?? 'My Calendar' };
        }
    } catch {}
    // If you have an API to fetch calendars, call it here and cache.
    return { id: '', name: 'My Calendar' };
}

function valueOf(sel) {
    const el = document.querySelector(sel);
    return el ? el.value : '';
}
function checked(sel) {
    const el = document.querySelector(sel);
    return !!(el && el.checked);
}
function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
function escapeAttr(s){ return escapeHTML(s); }
function sanitizeEmojiInput(v) {
    // Keep it tiny; users can paste 1–2 glyphs. Trim spaces, cap length.
    return (v || '').trim().slice(0, 4);
}

function sanitizeHexColor(color, fallback = '#3b82f6') {
    if (typeof color !== 'string') return fallback;
    const trimmed = color.trim();
    if (/^#([0-9a-f]{3})$/i.test(trimmed)) {
        return '#' + trimmed.slice(1).split('').map((ch) => ch + ch).join('');
    }
    if (/^#([0-9a-f]{6})$/i.test(trimmed)) {
        return trimmed;
    }
    return fallback;
}

function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    let trimmed = url.trim();
    if (!trimmed) return '';

    // Normalize common calendar schemes (webcal → https)
    trimmed = trimmed.replace(/^webcal:/i, 'https:');

    // If the user omitted a scheme (e.g. "calendar.google.com/..."), normalize.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
        if (/^\/\//.test(trimmed)) {
            // Protocol-relative URL ("//example.com/foo") → https
            trimmed = `https:${trimmed}`;
        } else if (trimmed.startsWith('/')) {
            // Relative paths are not valid external feeds
            return '';
        } else {
            trimmed = `https://${trimmed}`;
        }
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (_) {
        // ignore invalid URLs
    }
    return '';
}
function humanDate(yyyy_mm_dd) {
    const [y,m,d] = (yyyy_mm_dd||'').split('-').map(n=>parseInt(n,10));
    const dt = (!isNaN(y)&&!isNaN(m)&&!isNaN(d)) ? new Date(y, m-1, d) : new Date();
    return dt.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
}


// CALENDAR LOOK UP

// ===== Calendars cache + loader (v1) =====

const CAL_CACHE_KEY = 'earthcal_calendars';
const CAL_CACHE_AT_KEY = 'earthcal_calendars_cached_at';
const PUBLIC_CAL_CACHE_KEY = 'earthcal_public_calendars';
const PUBLIC_CAL_CACHE_AT_KEY = 'earthcal_public_calendars_cached_at';

/**
 * Load calendars for a user.
 * - Uses sessionStorage cache by default (5 min TTL).
 * - Set {force:true} to bypass cache, or tweak {maxAgeMs}.
 * - Normalizes field names (id/name/flags) for the UI.
 *
 */
async function loadUserCalendars(buwana_id, { force = false, maxAgeMs = 5 * 60 * 1000 } = {}) {
    if (!buwana_id) throw new Error('loadUserCalendars: buwana_id is required');

    if (!force) {
        const cached = readCalendarsFromCache(maxAgeMs);
        if (cached) return cached;
    }

    let res;
    try {
        res = await fetch('/api/v1/list_calendars.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ buwana_id })
        });
    } catch (e) {
        console.error('[loadUserCalendars] network error:', e);
        // If we have stale cache, return it rather than failing hard
        const stale = readCalendarsFromCache(Infinity);
        if (stale) return stale;
        // Otherwise fallback to a synthetic "My Calendar"
        return [fallbackMyCalendar()];
    }

    if (!res.ok) {
        console.warn('[loadUserCalendars] HTTP', res.status);
        const stale = readCalendarsFromCache(Infinity);
        if (stale) return stale;
        return [fallbackMyCalendar()];
    }

    let data;
    try {
        data = await res.json();
    } catch {
        console.warn('[loadUserCalendars] invalid JSON');
        const stale = readCalendarsFromCache(Infinity);
        if (stale) return stale;
        return [fallbackMyCalendar()];
    }

    const raw = Array.isArray(data?.calendars) ? data.calendars : [];
    const calendars = raw.map(normalizeCalendarShape);

    if (!calendars.length) {
        // keep UX smooth with a minimal default
        const fallback = [fallbackMyCalendar()];
        saveCalendarsToCache(fallback);
        return fallback;
    }

    saveCalendarsToCache(calendars);
    return calendars;
}

/** Read calendar cache if not older than maxAgeMs; else null. */
function readCalendarsFromCache(maxAgeMs) {
    try {
        const at = Number(sessionStorage.getItem(CAL_CACHE_AT_KEY) || 0);
        if (at && Date.now() - at <= maxAgeMs) {
            const arr = JSON.parse(sessionStorage.getItem(CAL_CACHE_KEY) || '[]');
            if (Array.isArray(arr) && arr.length) return arr;
        }
    } catch {}
    return null;
}

function saveCalendarsToCache(list) {
    try {
        sessionStorage.setItem(CAL_CACHE_KEY, JSON.stringify(list || []));
        sessionStorage.setItem(CAL_CACHE_AT_KEY, String(Date.now()));
    } catch (e) {
        console.debug('saveCalendarsToCache failed (quota?)', e);
    }
}

function invalidateCalendarsCache() {
    sessionStorage.removeItem(CAL_CACHE_KEY);
    sessionStorage.removeItem(CAL_CACHE_AT_KEY);
}

async function loadPublicCalendars({ force = false, maxAgeMs = 5 * 60 * 1000 } = {}) {
    let cached = null;
    if (!force) {
        cached = readPublicCalendarsFromCache(maxAgeMs);
        if (cached) return mergePublicCalendarSubscriptions(cached);
    } else {
        cached = readPublicCalendarsFromCache(Infinity);
    }

    const legacy = readLegacyPublicCalendars();

    const fetched = await fetchPublicCalendarsFromApi();
    if (fetched.length) {
        const mergedFetched = mergePublicCalendarSubscriptions(fetched);
        savePublicCalendarsToCache(mergedFetched);
        return mergedFetched;
    }

    if (legacy.length) {
        const mergedLegacy = mergePublicCalendarSubscriptions(legacy);
        if (!force) savePublicCalendarsToCache(mergedLegacy);
        return mergedLegacy;
    }

    if (cached && Array.isArray(cached) && cached.length) {
        return mergePublicCalendarSubscriptions(cached);
    }

    return [];
}

function readPublicCalendarsFromCache(maxAgeMs) {
    try {
        const at = Number(sessionStorage.getItem(PUBLIC_CAL_CACHE_AT_KEY) || 0);
        if (at && Date.now() - at <= maxAgeMs) {
            const arr = JSON.parse(sessionStorage.getItem(PUBLIC_CAL_CACHE_KEY) || '[]');
            if (Array.isArray(arr) && arr.length) return arr;
        }
    } catch (_) {}
    return null;
}

function savePublicCalendarsToCache(list) {
    try {
        sessionStorage.setItem(PUBLIC_CAL_CACHE_KEY, JSON.stringify(list || []));
        sessionStorage.setItem(PUBLIC_CAL_CACHE_AT_KEY, String(Date.now()));
    } catch (e) {
        console.debug('savePublicCalendarsToCache failed (quota?)', e);
    }
}

function getSubscribedPublicCalendarMap() {
    const map = new Map();
    const cached = readCalendarsFromCache(Infinity);
    if (!Array.isArray(cached)) return map;

    for (const entry of cached) {
        if (!entry) continue;
        const subscriptionId = Number(entry.subscription_id ?? entry.sub_id ?? entry.subscriptionId);
        if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) continue;
        const calendarId = Number(entry.calendar_id ?? entry.id);
        if (!Number.isFinite(calendarId) || calendarId <= 0) continue;
        const source = (entry.source_type || '').toString().toLowerCase();
        if (source !== 'earthcal' && source !== 'public') continue;

        const isActive = typeof entry.is_active === 'boolean' ? entry.is_active : toBool(entry.is_active ?? true);
        const displayFlag = entry.display_enabled;
        const normalizedDisplay = displayFlag === undefined
            ? undefined
            : (typeof displayFlag === 'boolean' ? displayFlag : toBool(displayFlag));

        const state = {
            subscription_id: subscriptionId,
            is_active: isActive,
            is_subscribed: true
        };

        if (normalizedDisplay !== undefined) {
            state.display_enabled = normalizedDisplay;
        }

        map.set(calendarId, state);
    }

    return map;
}

function mergePublicCalendarSubscriptions(list) {
    if (!Array.isArray(list)) return [];
    const map = getSubscribedPublicCalendarMap();
    if (!map.size) {
        return list.map((entry) => (entry && typeof entry === 'object') ? { ...entry } : entry);
    }

    return list.map((entry) => {
        if (!entry || typeof entry !== 'object') return entry;
        const merged = { ...entry };
        const calendarId = Number(merged.calendar_id ?? merged.id);
        if (Number.isFinite(calendarId) && map.has(calendarId)) {
            const state = map.get(calendarId);
            merged.is_subscribed = true;
            if (state.subscription_id !== undefined) {
                merged.subscription_id = state.subscription_id;
            }
            if (state.is_active !== undefined) {
                merged.is_active = state.is_active;
            }
            if (state.display_enabled !== undefined) {
                merged.display_enabled = state.display_enabled;
            }
        } else {
            merged.is_subscribed = false;
            if (!map.has(calendarId)) {
                merged.subscription_id = null;
            }
        }
        return merged;
    });
}

function readLegacyPublicCalendars() {
    try {
        const raw = sessionStorage.getItem('user_calendars');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed?.public_calendars) ? parsed.public_calendars : [];
        return list
            .map(normalizeLegacyPublicCalendarShape)
            .filter(Boolean);
    } catch (err) {
        console.debug('readLegacyPublicCalendars failed:', err);
        return [];
    }
}

async function fetchPublicCalendarsFromApi() {
    const endpoint = '/api/v1/get_public_cals.php';
    const attempts = [
        { method: 'GET', options: { method: 'GET', headers: { 'Accept': 'application/json' } } },
        { method: 'POST', options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' } }
    ];
    let lastError = null;

    for (const attempt of attempts) {
        try {
            const response = await fetch(endpoint, { credentials: 'same-origin', ...attempt.options });
            if (!response.ok) {
                lastError = new Error(`HTTP ${response.status}`);
                continue;
            }

            const data = await response.json().catch(() => ({}));
            const rawList = Array.isArray(data?.calendars) ? data.calendars : [];
            if (rawList.length) {
                return rawList.map(normalizePublicCalendarShape);
            }
        } catch (err) {
            lastError = err;
        }
    }

    if (lastError) {
        console.warn('[loadPublicCalendars] Unable to fetch public calendars:', lastError);
    }
    return [];
}

/** Normalize assorted backend field names to a stable UI shape. */
function normalizeCalendarShape(c) {
    const source = (c?.source_type || '').toString().toLowerCase();
    const source_type = ['personal', 'earthcal', 'webcal'].includes(source) ? source : 'personal';
    const color_hex = sanitizeHexColor(c.color_hex || c.color || c.calendar_color || '#3b82f6');
    const emoji = sanitizeEmojiInput(c.emoji || c.cal_emoji || '');
    const calendar_id = c.calendar_id ?? c.id ?? null;
    const subscription_id = c.subscription_id ?? null;

    return {
        calendar_id: calendar_id !== null ? Number(calendar_id) : null,
        subscription_id: subscription_id !== null ? Number(subscription_id) : null,
        name: c.name ?? c.calendar_name ?? 'Untitled Calendar',
        description: c.description ?? c.calendar_description ?? '',
        is_default: toBool(c.is_default ?? c.default_my_calendar),
        is_readonly: toBool(c.is_readonly),
        visibility: (c.visibility || c.calendar_public === 1 ? 'public' : 'private'),
        category: c.category || 'personal',
        color_hex,
        color: color_hex,
        emoji,
        tzid: c.tzid || getUserTZ(),
        source_type,
        display_enabled: typeof c.display_enabled === 'boolean' ? c.display_enabled : toBool(c.display_enabled ?? true),
        is_active: typeof c.is_active === 'boolean' ? c.is_active : toBool(c.is_active ?? true),
        url: c.url ?? null,
        feed_title: c.feed_title ?? null,
        created_at: c.created_at ?? c.calendar_created ?? null,
        updated_at: c.updated_at ?? c.last_updated ?? null,
        last_fetch_at: c.last_fetch_at ?? null,
        last_error: c.last_error ?? null
    };
}

function normalizePublicCalendarShape(c) {
    if (!c || typeof c !== 'object') return null;
    const eventCount = Number(c.event_count);
    const rawSubscriptionId = c.subscription_id ?? c.sub_id ?? c.subscriptionId ?? c.follow_id ?? null;
    const subscriptionId = Number(rawSubscriptionId);
    const normalizedSubscriptionId = Number.isFinite(subscriptionId) && subscriptionId > 0 ? subscriptionId : null;
    const displayFlag = c.display_enabled ?? c.display ?? null;
    const normalizedDisplay = displayFlag === null || displayFlag === undefined
        ? undefined
        : (typeof displayFlag === 'boolean' ? displayFlag : toBool(displayFlag));
    const rawSubscribed = c.is_subscribed ?? c.subscribed ?? c.following ?? c.is_following;
    const hasExplicitSubscribed = rawSubscribed !== undefined && rawSubscribed !== null;
    const isSubscribed = hasExplicitSubscribed ? toBool(rawSubscribed) : false;
    const isActive = typeof c.is_active === 'boolean'
        ? c.is_active
        : toBool(c.is_active ?? (normalizedDisplay !== undefined ? normalizedDisplay : isSubscribed));

    return {
        calendar_id: c.calendar_id ?? c.id ?? null,
        name: c.name ?? c.calendar_name ?? 'Untitled Calendar',
        description: c.description ?? c.calendar_description ?? '',
        emoji: sanitizeEmojiInput(c.emoji || c.cal_emoji || '📅') || '📅',
        color_hex: sanitizeHexColor(c.color_hex || c.color || c.calendar_color),
        category: c.category ?? c.calendar_category ?? '',
        event_count: Number.isFinite(eventCount) ? eventCount : null,
        updated_at: c.updated_at ?? c.last_updated ?? null,
        created_at: c.created_at ?? c.calendar_created ?? null,
        owner: c.owner ?? c.curator ?? c.publisher ?? c.creator ?? c.creator_name ?? '',
        tzid: c.tzid ?? c.time_zone ?? null,
        visibility: 'public',
        source_type: 'earthcal',
        is_subscribed: isSubscribed,
        subscription_id: normalizedSubscriptionId,
        is_active: isActive,
        display_enabled: normalizedDisplay,
        source_url: c.source_url ?? c.url ?? c.website ?? c.link ?? ''
    };
}

function normalizeLegacyPublicCalendarShape(c) {
    if (!c || typeof c !== 'object') return null;
    const eventCount = Number(c.event_count ?? c.total_events);
    const rawSubscriptionId = c.subscription_id ?? c.sub_id ?? c.subscriptionId ?? c.follow_id ?? null;
    const subscriptionId = Number(rawSubscriptionId);
    const normalizedSubscriptionId = Number.isFinite(subscriptionId) && subscriptionId > 0 ? subscriptionId : null;
    const displayFlag = c.display_enabled ?? c.display ?? null;
    const normalizedDisplay = displayFlag === null || displayFlag === undefined
        ? undefined
        : (typeof displayFlag === 'boolean' ? displayFlag : toBool(displayFlag));
    const rawSubscribed = c.is_subscribed ?? c.subscribed ?? c.following ?? c.is_following;
    const hasExplicitSubscribed = rawSubscribed !== undefined && rawSubscribed !== null;
    const isSubscribed = hasExplicitSubscribed ? toBool(rawSubscribed) : false;
    const isActive = typeof c.is_active === 'boolean'
        ? c.is_active
        : toBool(c.is_active ?? (normalizedDisplay !== undefined ? normalizedDisplay : isSubscribed));

    return {
        calendar_id: c.calendar_id ?? c.id ?? null,
        name: c.calendar_name ?? c.name ?? 'Untitled Calendar',
        description: c.description ?? c.calendar_description ?? '',
        emoji: sanitizeEmojiInput(c.emoji || c.cal_emoji || '📅') || '📅',
        color_hex: sanitizeHexColor(c.calendar_color || c.color_hex || c.color),
        category: c.category ?? c.calendar_category ?? '',
        event_count: Number.isFinite(eventCount) ? eventCount : null,
        updated_at: c.last_updated ?? c.updated_at ?? null,
        created_at: c.calendar_created ?? c.created_at ?? null,
        owner: c.owner ?? c.curator ?? c.publisher ?? c.creator ?? c.creator_name ?? '',
        tzid: c.tzid ?? c.time_zone ?? null,
        visibility: 'public',
        source_type: 'earthcal',
        is_subscribed: isSubscribed,
        subscription_id: normalizedSubscriptionId,
        is_active: isActive,
        display_enabled: normalizedDisplay,
        source_url: c.source_url ?? c.url ?? c.website ?? c.link ?? ''
    };
}

function toBool(v) {
    if (typeof v === 'boolean') return v;
    if (v === 1 || v === '1' || v === 'true' || v === 'TRUE') return true;
    return false;
}

/** Minimal fallback if API/cache unavailable. */
function fallbackMyCalendar() {
    return {
        calendar_id: null,
        name: 'My Calendar',
        is_default: true,
        is_readonly: false,
        visibility: 'private',
        category: 'personal',
        color_hex: '#3b82f6',
        color: '#3b82f6',
        emoji: '📅',
        tzid: getUserTZ(),
        source_type: 'personal',
        display_enabled: true,
        is_active: true,
        subscription_id: null,
        description: '',
        url: null,
        feed_title: null,
        created_at: null,
        updated_at: null,
        last_fetch_at: null,
        last_error: null
    };
}

/**
 * Updated default-calendar helper:
 * - Uses cache if available, else calls loadUserCalendars()
 * - Heuristics: is_default → name match "My Calendar" → first personal → first
 */
async function getDefaultCalendarForUser(buwana_id) {
    let list = readCalendarsFromCache(5 * 60 * 1000);
    if (!list) list = await loadUserCalendars(buwana_id).catch(() => [fallbackMyCalendar()]);

    const def = list.find(c => c.is_default)
        || list.find(c => /my\s*calendar/i.test(c.name))
        || list.find(c => (c.category || '').toLowerCase() === 'personal')
        || list[0];

    return def ? { id: def.calendar_id, name: def.name } : { id: null, name: 'My Calendar' };
}

