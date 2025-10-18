
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

    let calendars = [];
    try {
        calendars = await loadUserCalendars(user.buwana_id, { force: true });
        console.log('[openAddItem] calendars loaded:', calendars);
    } catch (err) {
        console.error('[openAddItem] loadUserCalendars() failed:', err);
        calendars = [];
    }

// 🧠 Filter out any legacy or invalid calendar entries
    calendars = calendars.filter(c => {
        const validId = Number.isInteger(c.calendar_id) && c.calendar_id > 0;
        const validName = typeof c.name === 'string' && c.name.trim() !== '';
        const isV1 = c?.tzid || c?.category || c?.visibility; // new v1 fields
        return validId && validName && isV1;
    });

    console.log('[openAddItem] filtered calendars (valid only):', calendars);

    let defaultCal = null;
    if (Array.isArray(calendars) && calendars.length > 0) {
        defaultCal =
            calendars.find(c => c.is_default) ||
            calendars.find(c => /my\s*calendar/i.test(c.name || ''));
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
            console.log('[openAddItem] calendars after creation:', calendars);

            defaultCal =
                calendars.find(c => c.is_default) ||
                calendars.find(c => /my\s*calendar/i.test(c.name || ''));

            console.log('[openAddItem] defaultCal after creation:', defaultCal);

        } catch (err) {
            console.error('[openAddItem] create_my_calendar network or logic error:', err);
            alert('Could not reach the server to create your calendar.');
            return;
        }
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
    modalContent.innerHTML = buildAddItemFormHTML({
        displayDate: humanDate(dateStr),
        dateStr,
        timeStr,
        calendarId,
        calendarName,
        tzid: getUserTZ(),
        calendars
    });

    const titleInput = document.getElementById('ec-title');
    if (titleInput) {
        titleInput.focus();
        titleInput.select();
    }

    // ============================================================
    // 5. WIRE UI INTERACTIONS (KIND TOGGLING, NOTES TOGGLE, EMOJI)
    // ------------------------------------------------------------
    // For now, only To-Do is enabled. Event/Journal show an alert and
    // revert to To-Do. Notes reveal/hide a textarea. Emoji is sanitized.
    // ============================================================
    const kindSelect = document.getElementById('ec-item-kind');
    kindSelect.addEventListener('change', (e) => {
        if (e.target.value !== 'todo') {
            alert('Sorry, this item type is still under development! Only To-Do items are working so far.');
            e.target.value = 'todo';
            toggleKindFields('todo');
        } else {
            toggleKindFields('todo');
        }
    });
    toggleKindFields('todo'); // initial state

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

    const notesToggle = document.getElementById('ec-notes-toggle');
    const notesBox = document.getElementById('ec-notes-box');
    if (notesToggle && notesBox) {
        const notesField = notesBox.querySelector('textarea');
        const updateMaxHeight = () => {
            notesBox.style.maxHeight = `${notesBox.scrollHeight}px`;
        };
        const setNotesExpanded = (expanded) => {
            notesToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            notesToggle.setAttribute('aria-label', expanded ? 'Hide notes' : 'Show notes');
            notesToggle.title = expanded ? 'Hide notes' : 'Show notes';
            notesToggle.classList.toggle('is-open', expanded);
            notesToggle.textContent = expanded ? '▼' : '▲';

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

    wireEmojiPicker({
        buttonId: 'ec-emoji-button',
        hiddenInputId: 'ec-emoji',
        previewId: 'ec-emoji-preview',
        defaultEmoji: '🙂'
    });

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
        const titleVal = (document.getElementById('ec-title')?.value || '').trim();
        if (!titleVal) {
            alert('Please enter a title for your to-do.');
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

            // Success UX — close modal, optionally refresh items for that day
            if (typeof closeTheModal === 'function') closeTheModal();
            if (typeof highlightDateCycles === 'function') highlightDateCycles(); // or your newer refresh method
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
    <div class="add-date-form" style="margin:auto;">
      <h3 class="ec-form-title">Add a to-do item for this ${displayDate}.</h3>

      <form id="ec-add-item-form" autocomplete="off">
        <input id="ec-date" type="hidden" value="${escapeAttr(dateStr)}">
        <input id="ec-time" type="hidden" value="${escapeAttr(timeStr)}">
        <input id="ec-tzid" type="hidden" value="${escapeAttr(tzid)}">
        
        
        <div class="ec-form-field ec-title-row">
          <input id="ec-title" type="text" class="blur-form-field" placeholder="What needs doing?" style="height:45px;width:100%;cursor:text;" aria-label="Title">
          <button type="button" id="ec-notes-toggle" class="ec-notes-toggle-button" aria-expanded="false" aria-controls="ec-notes-box" aria-label="Show notes" title="Show notes">▲</button>
        </div>

        <div class="ec-form-field ec-notes-field">
          <div id="ec-notes-box" class="ec-notes-collapsible" aria-hidden="true">
            <textarea id="ec-notes" class="blur-form-field" placeholder="Optional notes…" style="width:100%;min-height:110px;cursor:text;"></textarea>
          </div>
        </div>

        <div class="ec-form-field">
          <select id="ec-item-kind" class="blur-form-field" style="height:45px;width:100%;text-align:center;" aria-label="Item type">
            <option value="todo" selected>To-Do</option>
            <option value="event">Event</option>
            <option value="journal">Journal</option>
          </select>
        </div>

        <div id="ec-frequency-row" class="ec-form-field ec-frequency-row">
          <select id="ec-frequency" class="blur-form-field ec-frequency-select" style="height:45px;text-align:center;">
            <option value="today" selected>One-time</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <div class="ec-inline-field ec-emoji-field">
            <div class="ec-emoji-input">
              <button type="button" id="ec-emoji-button" class="blur-form-field ec-emoji-button" aria-haspopup="true" aria-expanded="false" aria-label="Choose emoji">
                <span id="ec-emoji-preview" class="ec-emoji-preview">🙂</span>
              </button>
              <input type="hidden" id="ec-emoji" value="">
            </div>
          </div>
          <div class="ec-inline-field ec-color-field">
            <input id="ec-color" type="color" value="#0ea5e9" class="blur-form-field ec-color-input" aria-label="Item color">
          </div>

        </div>

        <div class="ec-form-field">
          <select id="ec-calendar-select" class="blur-form-field" style="height:45px;width:100%;text-align:center;" aria-label="Calendar">
            ${calendarOptions}
            <option value="__add_new__">+ Add new calendar</option>
          </select>
        </div>

        <div class="ec-form-actions">
          <button type="submit" id="ec-save-item" class="stellar-submit" style="height:44px;">Save To-Do</button>
        </div>
      </form>
    </div>
  `;
}

const EC_EMOJI_OPTIONS = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
    '🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
    '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥳',
    '😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖',
    '😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯',
    '😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔',
    '🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦',
    '😧','😮','😲','🥱','😴','🤤','😪','😵','😵‍💫','🤐',
    '🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀',
    '☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼'
];

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

    const applyEmoji = (emoji) => {
        const sanitized = sanitizeEmojiInput(emoji) || defaultEmoji;
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
        const sanitized = sanitizeEmojiInput(hiddenInput.value) || defaultEmoji;
        hiddenInput.value = sanitized;
        preview.textContent = sanitized;
    } else {
        preview.textContent = defaultEmoji;
    }

    return () => {
        button.removeEventListener('click', handleButtonClick);
        if (activeEmojiPickerControl?.button === button) {
            activeEmojiPickerControl.close();
        }
    };
}

function toggleKindFields(kind) {
    // When you implement Event/Journal, you’ll show/hide extra blocks here.
    const frequencyRow = document.getElementById('ec-frequency-row');
    if (frequencyRow) frequencyRow.style.display = kind === 'todo' ? 'flex' : 'none';
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

                    try {
                        sessionStorage.setItem('user_calendars_v1', JSON.stringify(updatedCalendars || []));
                    } catch (err) {
                        console.debug('[addNewCalendarV1] Unable to refresh v1 calendar cache:', err);
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

function addNewiCal({ hostTarget, meta = {}, icalUrl = '' } = {}) {
    const hostElement = resolveOverlayHost(hostTarget);

    if (!(hostElement instanceof HTMLElement)) {
        console.warn('[addNewiCal] overlay host not found.');
        return;
    }

    const user = getCurrentUser?.();
    if (!user?.buwana_id) {
        alert('Please log in to connect a calendar.');
        if (typeof sendUpRegistration === 'function') sendUpRegistration();
        return;
    }

    const restoreHostPosition = prepareHostForOverlay(hostElement);

    removeOverlayById('ec-add-calendar-overlay');
    removeOverlayById('ec-add-ical-overlay');

    const overlay = document.createElement('div');
    overlay.id = 'ec-add-ical-overlay';
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

    const feedTitle = typeof meta?.feed_title === 'string' && meta.feed_title.trim()
        ? meta.feed_title.trim()
        : 'Google Calendar';
    const feedDescription = typeof meta?.description === 'string'
        ? meta.description.trim()
        : '';
    const eventCount = Number.isFinite(meta?.item_count)
        ? Number(meta.item_count)
        : null;
    const sizeKb = Number.isFinite(meta?.size_kb)
        ? Number(meta.size_kb)
        : null;
    const defaultColor = sanitizeHexColor(meta?.default_color || '#d93025', '#d93025');
    const normalizedUrl = sanitizeUrl(meta?.ical_url || icalUrl) || (meta?.ical_url || icalUrl || '');
    const safeTitle = escapeHTML(feedTitle);
    const safeDescription = escapeHTML(feedDescription);
    const summaryParts = [];
    if (eventCount !== null) summaryParts.push(`${eventCount} events detected`);
    if (sizeKb !== null) summaryParts.push(`${sizeKb} KB download`);
    const summaryHtml = summaryParts.length
        ? `<p style="margin:0;color:var(--subdued-text);font-size:0.9rem;">${escapeHTML(summaryParts.join(' · '))}</p>`
        : '';

    const defaultEmoji = sanitizeEmojiInput(meta?.emoji || '📆') || '📆';
    const categoryDefault = (meta?.category || 'other').toLowerCase();
    const visibilityDefault = (meta?.visibility || 'private').toLowerCase();

    const categoryOptions = [
        { value: 'personal', label: 'Personal' },
        { value: 'holidays', label: 'Holidays' },
        { value: 'birthdays', label: 'Birthdays' },
        { value: 'astronomy', label: 'Astronomy' },
        { value: 'migration', label: 'Migration' },
        { value: 'other', label: 'Other' },
    ].map(({ value, label }) => {
        const isSelected = value === categoryDefault;
        return `<option value="${value}"${isSelected ? ' selected' : ''}>${label}</option>`;
    }).join('');

    const visibilityOptions = [
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' }
    ].map(({ value, label }) => {
        const isSelected = value === visibilityDefault;
        return `<option value="${value}"${isSelected ? ' selected' : ''}>${label}</option>`;
    }).join('');

    overlay.innerHTML = `
        <div class="ec-add-calendar-header" style="display:flex;flex-direction:column;gap:8px;">
            <h2 style="margin:0;font-size:1.5rem;">Add Google Calendar</h2>
            <p style="margin:0;color:var(--subdued-text);font-size:0.95rem;">
                Customize how <strong>${safeTitle}</strong> should appear in your Earthcal.
            </p>
            ${summaryHtml}
        </div>
        <form id="ec-add-ical-form" style="display:flex;flex-direction:column;gap:16px;width:100%;max-width:100%;">
            <input type="hidden" id="ec-ical-url" name="ical_url" value="${escapeAttr(normalizedUrl)}">
            <div style="display:flex;flex-direction:column;width:100%;">
                <label class="ec-visually-hidden" for="ec-cal-name">Calendar name</label>
                <input id="ec-cal-name" name="calendar_name" type="text" placeholder="Name your new calendar..." required
                       aria-label="Calendar name"
                       value="${escapeAttr(feedTitle)}"
                       style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;flex-direction:column;width:100%;">
                <label class="ec-visually-hidden" for="ec-cal-description">Description</label>
                <input id="ec-cal-description" name="calendar_description" type="text"
                       placeholder="Describe what this calendar is for"
                       aria-label="Calendar description"
                       value="${escapeAttr(feedDescription)}"
                       style="padding:10px;border-radius:8px;border:1px solid grey;font-weight:400;background:var(--top-header);width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;width:100%;">
                <div style="flex:1 1 200px;display:flex;flex-direction:column;min-width:min(200px,100%);">
                    <label class="ec-visually-hidden" for="ec-cal-category">Calendar category</label>
                    <select id="ec-cal-category" name="calendar_category"
                            aria-label="Calendar category"
                            style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;">
                        <option value="" disabled>Select calendar category...</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="ec-inline-field ec-emoji-field" style="width:auto;">
                    <div class="ec-emoji-input">
                        <button type="button" id="ec-cal-emoji-button" class="blur-form-field ec-emoji-button"
                                aria-haspopup="true" aria-expanded="false" aria-label="Choose calendar emoji"
                                style="width:45px;height:45px;display:flex;align-items:center;justify-content:center;">
                            <span id="ec-cal-emoji-preview" class="ec-emoji-preview">${escapeHTML(defaultEmoji)}</span>
                        </button>
                        <input type="hidden" id="ec-cal-emoji" name="calendar_emoji" value="${escapeAttr(defaultEmoji)}">
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;width:100%;">
                <div style="flex:1 1 200px;display:flex;flex-direction:column;min-width:min(200px,100%);">
                    <label class="ec-visually-hidden" for="ec-cal-visibility">Visibility</label>
                    <select id="ec-cal-visibility" name="calendar_visibility"
                            aria-label="Calendar visibility"
                            style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;">
                        ${visibilityOptions}
                    </select>
                </div>
                <div class="ec-inline-field ec-color-field" style="width:auto;display:flex;align-items:center;">
                    <input id="ec-cal-color" name="calendar_color" type="color" value="${escapeAttr(defaultColor)}"
                           class="blur-form-field ec-color-input" aria-label="Calendar color"
                           style="width:40px;height:40px;padding:0;">
                </div>
            </div>
            <div class="ec-add-calendar-actions" style="margin-top:8px;display:flex;">
                <button type="submit" class="stellar-submit">Add calendar</button>
            </div>
        </form>
    `;

    hostElement.appendChild(overlay);

    overlay.dataset.icalUrl = normalizedUrl;
    overlay.dataset.feedTitle = feedTitle;

    const cleanupFns = [];

    const detachEmojiPicker = wireEmojiPicker({
        buttonId: 'ec-cal-emoji-button',
        hiddenInputId: 'ec-cal-emoji',
        previewId: 'ec-cal-emoji-preview',
        defaultEmoji
    });
    cleanupFns.push(detachEmojiPicker);

    let closed = false;
    const teardownOverlay = () => {
        if (closed) return;
        closed = true;
        while (cleanupFns.length) {
            const fn = cleanupFns.shift();
            try { fn && fn(); } catch (err) { console.debug('[addNewiCal] cleanup failed:', err); }
        }
        if (overlay.parentElement) overlay.remove();
        restoreHostPosition();
        delete overlay.__ecTeardown;
    };
    overlay.__ecTeardown = teardownOverlay;

    const detachCloseButton = hijackHostCloseButton(hostElement, teardownOverlay);
    cleanupFns.push(detachCloseButton);

    const form = overlay.querySelector('#ec-add-ical-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Saving Google Calendar connections is coming soon!');
        });
    }

    const nameField = overlay.querySelector('#ec-cal-name');
    if (nameField) {
        nameField.focus();
        nameField.select();
    }
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
        padding: '24px',
        gap: '20px',
        overflowY: 'auto',
        borderRadius: '10px',
        background: 'var(--general-background)'
    });

    overlay.innerHTML = `
        <div class="ec-add-calendar-header" style="display:flex;flex-direction:column;gap:8px;">
            <h2 style="margin:0;font-size:1.5rem;">Explore public Earthcals</h2>
            <p style="margin:0;color:var(--subdued-text);font-size:0.95rem;">
                Subscribe to community calendars curated by fellow Earthcal keepers.
            </p>
        </div>
        <div id="ec-select-public-cals" style="display:flex;flex-direction:column;gap:12px;" role="list"></div>
        <div class="ec-public-pagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:12px;">
            <button type="button" class="confirmation-blur-button cancel" data-ec-public-nav="prev" style="min-width:120px;">← Previous 10</button>
            <span class="ec-public-page-status" style="flex:1;text-align:center;color:var(--subdued-text);font-size:0.9rem;"></span>
            <button type="button" class="confirmation-blur-button cancel" data-ec-public-nav="next" style="min-width:120px;">Next 10 →</button>
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

        const updateSubscribeState = () => {
            const isChecked = !!subscribeCheckbox.checked;
            subscribeLabel.classList.toggle('is-active', isChecked);
            subscribeCheckbox.setAttribute(
                'aria-label',
                isChecked ? 'Unsubscribe from this calendar' : 'Subscribe to this calendar'
            );
            subscribeLabel.title = isChecked ? 'Unsubscribe from this calendar' : 'Subscribe to this calendar';
            subscribeText.textContent = isChecked ? 'Subscribed' : 'Subscribe';
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
                const result = await toggleSubscription(calendarNumericId, desired);
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
    const kind = valueOf('#ec-item-kind') || 'todo';
    const calendarSelection = valueOf('#ec-calendar-select');
    const calendar_id = calendarSelection && calendarSelection !== '__add_new__' ? calendarSelection : null;
    const title = valueOf('#ec-title')?.trim() || '';
    const pinned = checked('#ec-pinned');
    const rawEmoji = valueOf('#ec-emoji');
    const emoji = rawEmoji ? sanitizeEmojiInput(rawEmoji) : null;
    const color_hex = valueOf('#ec-color') || null;
    const frequency = valueOf('#ec-frequency') || 'today';
    const tzid = valueOf('#ec-tzid') || getUserTZ();
    const dateStr = valueOf('#ec-date');
    const timeStr = valueOf('#ec-time');
    const notes = valueOf('#ec-notes') || null;

    // Compose a local datetime string for backend conversion → UTC
    const start_local = `${dateStr} ${timeStr || '00:00'}`.trim();

    return {
        // required for backend:
        buwana_id: user.buwana_id,
        calendar_id,
        item_kind: kind,              // 'todo' | 'event' | 'journal' (todo for now)
        title,
        tzid,
        start_local,                  // 'YYYY-MM-DD HH:mm' (backend will convert to UTC)
        all_day: false,               // future: derive from empty time toggle
        // earthcal UI extras:
        pinned,
        emoji,
        color_hex,
        frequency,
        notes
    };
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
    const trimmed = url.trim();
    if (!trimmed) return '';
    try {
        const base = (typeof window !== 'undefined' && window.location) ? window.location.origin : 'https://earthcal.app';
        const parsed = new URL(trimmed, base);
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
        if (cached) return cached;
    } else {
        cached = readPublicCalendarsFromCache(Infinity);
    }

    const legacy = readLegacyPublicCalendars();

    const fetched = await fetchPublicCalendarsFromApi();
    if (fetched.length) {
        savePublicCalendarsToCache(fetched);
        return fetched;
    }

    if (legacy.length) {
        if (!force) savePublicCalendarsToCache(legacy);
        return legacy;
    }

    if (cached && Array.isArray(cached) && cached.length) {
        return cached;
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
        is_subscribed: toBool(c.is_subscribed ?? c.subscribed ?? c.following ?? c.is_following ?? 0),
        source_url: c.source_url ?? c.url ?? c.website ?? c.link ?? ''
    };
}

function normalizeLegacyPublicCalendarShape(c) {
    if (!c || typeof c !== 'object') return null;
    const eventCount = Number(c.event_count ?? c.total_events);
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
        is_subscribed: toBool(c.subscribed ?? c.is_subscribed ?? c.following ?? c.is_following ?? 0),
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

