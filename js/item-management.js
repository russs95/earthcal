
/* OPENING THE ADD DATECYCLE FORM

but this time using the modal archetecture

then generate the form fully using JS

start by showing add a to do for the current date

Options to change/add calendar, change item type from to-do, to event, to journal, to record, to cycle

Options to add to-do title, color, emoji and description

test heloooo  jkjkjkkjkjkkjjk asdasdsdfsdfsdfasd

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
    notesToggle.addEventListener('change', () => {
        notesBox.style.display = notesToggle.checked ? 'block' : 'none';
    });

    const emojiButton = document.getElementById('ec-emoji-button');
    const emojiPicker = document.getElementById('ec-emoji-picker');
    const emojiHiddenInput = document.getElementById('ec-emoji');
    const emojiPreview = document.getElementById('ec-emoji-preview');

    if (emojiButton && emojiPicker && emojiHiddenInput && emojiPreview) {
        const togglePicker = () => {
            const nowOpen = !emojiPicker.classList.contains('ec-emoji-picker--visible');
            if (nowOpen) {
                emojiPicker.classList.add('ec-emoji-picker--visible');
            } else {
                emojiPicker.classList.remove('ec-emoji-picker--visible');
            }
            emojiButton.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
        };

        emojiButton.addEventListener('click', (event) => {
            event.stopPropagation();
            togglePicker();
        });

        emojiPicker.addEventListener('click', (event) => {
            const option = event.target.closest('.ec-emoji-option');
            if (!option) return;
            const chosen = sanitizeEmojiInput(option.dataset.emoji || option.textContent || '');
            emojiHiddenInput.value = chosen;
            emojiPreview.textContent = chosen || '🙂';
            emojiPicker.classList.remove('ec-emoji-picker--visible');
            emojiButton.setAttribute('aria-expanded', 'false');
        });

        const handleDocumentClick = (event) => {
            if (!document.body.contains(emojiPicker)) {
                document.removeEventListener('click', handleDocumentClick);
                return;
            }
            if (!emojiPicker.classList.contains('ec-emoji-picker--visible')) return;
            if (emojiPicker.contains(event.target) || emojiButton.contains(event.target)) return;
            emojiPicker.classList.remove('ec-emoji-picker--visible');
            emojiButton.setAttribute('aria-expanded', 'false');
        };

        document.addEventListener('click', handleDocumentClick);
    }

    // ============================================================
    // 6. SAVE HANDLER — CALL /api/v1/add_item.php (LIVE)
    // ------------------------------------------------------------
    // Collect fields → POST JSON → handle response. On success,
    // close modal and (optionally) trigger a UI refresh function.
    // ============================================================
    const saveBtn = document.getElementById('ec-save-item');
    saveBtn.addEventListener('click', async () => {
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
    });
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

      <form id="ec-add-item-form" autocomplete="off" onsubmit="return false;">
        <input id="ec-date" type="hidden" value="${escapeAttr(dateStr)}">
        <input id="ec-time" type="hidden" value="${escapeAttr(timeStr)}">
        <input id="ec-tzid" type="hidden" value="${escapeAttr(tzid)}">

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

        <div class="ec-form-field">
          <input id="ec-title" type="text" class="blur-form-field" placeholder="What needs doing?" style="height:45px;width:100%;cursor:text;" aria-label="Title">
        </div>

        <div class="ec-form-field">
          <label for="ec-frequency" class="ec-inline-label">Frequency</label>
          <select id="ec-frequency" class="blur-form-field" style="height:45px;width:100%;text-align:center;">
            <option value="today" selected>Just today</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div id="ec-todo-fields" class="ec-form-inline">
          <div class="ec-inline-field ec-pin-field">
            <span class="ec-inline-label">Pin?</span>
            <label class="toggle-switch" for="ec-pinned">
              <input id="ec-pinned" type="checkbox" aria-label="Pin to calendar">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="ec-inline-field ec-emoji-field">
            <div class="ec-emoji-input">
              <button type="button" id="ec-emoji-button" class="blur-form-field ec-emoji-button" aria-haspopup="true" aria-expanded="false" aria-label="Choose emoji">
                <span id="ec-emoji-preview" class="ec-emoji-preview">🙂</span>
              </button>
              ${buildEmojiPicker()}
              <input type="hidden" id="ec-emoji" value="">
            </div>
          </div>
          <div class="ec-inline-field ec-color-field">
            <input id="ec-color" type="color" value="#0ea5e9" class="blur-form-field ec-color-input" aria-label="Item color">
          </div>
        </div>

        <div class="ec-form-field">
          <label class="ec-checkbox" for="ec-notes-toggle">
            <input id="ec-notes-toggle" type="checkbox"> Add notes
          </label>
          <div id="ec-notes-box" style="display:none;">
            <textarea id="ec-notes" class="blur-form-field" placeholder="Optional notes…" style="width:100%;min-height:110px;cursor:text;"></textarea>
          </div>
        </div>

        <div class="ec-form-actions">
          <button type="button" id="ec-save-item" class="stellar-submit" style="height:44px;">Save To-Do</button>
        </div>
      </form>
    </div>
  `;
}

function buildEmojiPicker() {
    const emojis = [
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

    const options = emojis
        .map(emoji => `<button type="button" class="ec-emoji-option" data-emoji="${escapeAttr(emoji)}">${emoji}</button>`)
        .join('');

    return `
        <div class="ec-emoji-picker" id="ec-emoji-picker" role="listbox" aria-label="Choose an emoji">
          ${options}
        </div>
    `;
}

function toggleKindFields(kind) {
    // When you implement Event/Journal, you’ll show/hide extra blocks here.
    const todoBlock = document.getElementById('ec-todo-fields');
    if (todoBlock) todoBlock.style.display = kind === 'todo' ? 'flex' : 'none';
}

function addNewCalendarV1() {
    alert('Sorry this function is still under construction! In the meantime please use your My Calendar.');
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
function humanDate(yyyy_mm_dd) {
    const [y,m,d] = (yyyy_mm_dd||'').split('-').map(n=>parseInt(n,10));
    const dt = (!isNaN(y)&&!isNaN(m)&&!isNaN(d)) ? new Date(y, m-1, d) : new Date();
    return dt.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
}


// CALENDAR LOOK UP

// ===== Calendars cache + loader (v1) =====

const CAL_CACHE_KEY = 'earthcal_calendars';
const CAL_CACHE_AT_KEY = 'earthcal_calendars_cached_at';

/**
 * Load calendars for a user.
 * - Uses sessionStorage cache by default (5 min TTL).
 * - Set {force:true} to bypass cache, or tweak {maxAgeMs}.
 * - Normalizes field names (id/name/flags) for the UI.
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

/** Normalize assorted backend field names to a stable UI shape. */
function normalizeCalendarShape(c) {
    return {
        calendar_id: c.calendar_id ?? c.id ?? null,
        name: c.name ?? c.calendar_name ?? 'Untitled Calendar',
        is_default: toBool(c.is_default),
        is_readonly: toBool(c.is_readonly),
        visibility: (c.visibility || c.calendar_public === 1 ? 'public' : 'private'),
        category: c.category || 'personal',
        color_hex: c.color_hex || '#3b82f6',
        emoji: c.emoji || '',
        tzid: c.tzid || getUserTZ()
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
        emoji: '📅',
        tzid: getUserTZ()
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

