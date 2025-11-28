
// LOGIN SCRIPTS V2

// Global plan tracker shared across EarthCal modules
window.user_plan = window.user_plan || "padwan";

// LOGIN CHECKING

// ---------- helpers ----------
function persistOidcFallback(values) {
    try {
        const existingName = window.name;
        let existingPayload = {};

        if (existingName) {
            try {
                existingPayload = JSON.parse(existingName);
            } catch {
                existingPayload = {};
            }
        }

        const oidcData = {
            ...(existingPayload.__earthcal_oidc || {}),
            ...values,
            timestamp: Date.now(),
        };

        window.name = JSON.stringify({
            ...existingPayload,
            __earthcal_oidc: oidcData,
        });
    } catch (error) {
        console.warn('[OIDC] Unable to persist fallback auth data:', error);
        try {
            window.name = JSON.stringify({
                __earthcal_oidc: { ...values, timestamp: Date.now() },
            });
        } catch (nestedError) {
            console.warn('[OIDC] Unable to set window.name fallback:', nestedError);
        }
    }
}

function parseJwt(tkn) {
    try {
        const [, payload] = tkn.split('.');
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

function isExpired(payload) {
    if (!payload?.exp) return true; // strict
    return payload.exp <= Math.floor(Date.now() / 1000);
}



function isLoggedIn({ returnPayload = false } = {}) {
    const tryParse = (json) => {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
    };

    let payload = null;

    // 1) Check sessionStorage
    const s = sessionStorage.getItem("buwana_user");
    if (s) {
        const p = tryParse(s);
        if (p && !isExpired(p)) payload = p;
    }

    // 2) Check localStorage.user_profile
    if (!payload) {
        const lp = localStorage.getItem("user_profile");
        const p = tryParse(lp);
        if (p && !isExpired(p)) payload = p;
    }

    // 3) Check id_token or access_token
    if (!payload) {
        const idTok = localStorage.getItem("id_token");
        const accTok = localStorage.getItem("access_token");
        const p = parseJwt(idTok) || parseJwt(accTok);
        if (p && !isExpired(p)) payload = p;
    }

    const isValid = payload?.buwana_id && !isExpired(payload);
    return returnPayload
        ? { isLoggedIn: !!isValid, payload: isValid ? payload : null }
        : !!isValid;
}

// -----------------------------



/*-------------
LOGIN FUNCTIONS
----------------*/
document.addEventListener("DOMContentLoaded", function () {
    const regContainer = document.getElementById('registration-container');
    const regDownButton = document.getElementById("reg-down-button");

    if (!regContainer || !regDownButton) {
        console.warn("⚠️ Required DOM elements not found for drag gesture.");
        return;
    }

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    function onStartDrag(e) {
        isDragging = true;
        regContainer.classList.add('grabbed');
        startY = e.touches ? e.touches[0].clientY : e.clientY;
    }

    function onMoveDrag(e) {
        if (!isDragging) return;
        currentY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0) {
            regContainer.style.transform = `translateY(${deltaY}px)`;
        }
    }

    function onEndDrag() {
        if (!isDragging) return;
        isDragging = false;
        regContainer.classList.remove('grabbed');
        const deltaY = currentY - startY;

        if (deltaY > 100) {
            sendDownRegistration();
        } else {
            regContainer.style.transform = `translateY(0)`;
        }
    }

    regDownButton.addEventListener("touchstart", onStartDrag);
    regDownButton.addEventListener("touchmove", onMoveDrag);
    regDownButton.addEventListener("touchend", onEndDrag);

    regDownButton.addEventListener("mousedown", onStartDrag);
    document.addEventListener("mousemove", onMoveDrag);
    document.addEventListener("mouseup", onEndDrag);
});


async function getUserData() {
    console.log("🌿 getUserData: Starting...");

    const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });

    if (!ok || !payload?.buwana_id) {
        console.warn("⚪ Not logged in or token expired. Using default view.");
        useDefaultUser();
        updateSessionStatus("⚪ Not logged in", false);
        window.user_plan = "padwan";
        window.cometAccessState = {
            loggedIn: false,
            plan: null,
            planId: null,
            lastUpdated: new Date().toISOString(),
            source: "getUserData",
        };
        return;
    }

    // 🔐 Cache auth payload for downstream functions
    if (!sessionStorage.getItem("buwana_user")) {
        sessionStorage.setItem("buwana_user", JSON.stringify(payload));
    }

    // 🌍 Populate globals
    const buwanaId = payload.buwana_id;
    userLanguage = navigator.language.slice(0, 2);
    userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    userProfile = {
        first_name: payload.given_name || "Earthling",
        email: payload.email || null,
        buwana_id: buwanaId,
        earthling_emoji: payload["buwana:earthlingEmoji"] || "🌎",
        community: payload["buwana:community"] || null,
        continent: payload["buwana:location.continent"] || null,
        status: payload["status"] || "returning"
    };

    console.log("✅ Loaded userProfile:", userProfile);

    let resolvedPlanId = null;
    let userPlanType = "padwan";

    try {
        const response = await fetch('api/v1/check_user_sub.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buwana_id: buwanaId })
        });

        if (!response.ok) {
            throw new Error(`Subscription lookup failed with status ${response.status}`);
        }

        const subscriptionData = await response.json();

        const extractPlanId = (source) => {
            if (!source) return null;
            const planId = source.plan_id ?? source.planId;
            const numeric = Number(planId);
            return Number.isFinite(numeric) ? numeric : null;
        };

        resolvedPlanId = extractPlanId(subscriptionData?.current_subscription) ??
            extractPlanId(subscriptionData?.current_subscription?.plan);

        if (!resolvedPlanId && Array.isArray(subscriptionData?.plans)) {
            const activePlan = subscriptionData.plans.find((plan) => plan?.is_current || plan?.isCurrent);
            resolvedPlanId = extractPlanId(activePlan);
        }

        const mapPlanIdToType = (planId) => {
            if (planId === 1) return "padwan";
            if ([2, 3, 4].includes(planId)) return "jedi";
            return "padwan";
        };

        userPlanType = mapPlanIdToType(resolvedPlanId ?? 1);
        window.user_plan = userPlanType;
        console.log(`🛰️ EarthCal user_plan set to "${userPlanType}" (plan_id: ${resolvedPlanId ?? 'unknown'})`);
    } catch (error) {
        window.user_plan = "padwan";
        console.warn('⚠️ Unable to determine subscription plan, defaulting to "padwan".', error);
    }

    window.cometAccessState = {
        loggedIn: true,
        plan: userPlanType,
        planId: resolvedPlanId,
        lastUpdated: new Date().toISOString(),
        source: "getUserData",
    };

    updateSessionStatus(
        `🟢 Logged in as ${userProfile.first_name} ${userProfile.earthling_emoji}`,
        true
    );

    displayUserData(userTimeZone, userLanguage);
    setCurrentDate(userTimeZone, userLanguage);

    // 📅 Load calendar data: session first, then fetch from API if missing
    const calendarCache = sessionStorage.getItem('user_calendars_v1');

    let calendars = null;
    if (calendarCache) {
        try {
            const parsed = JSON.parse(calendarCache);
            if (Array.isArray(parsed)) {
                calendars = parsed;
                console.log('📅 Using cached v1 calendar data');
            }
        } catch (e) {
            console.warn('⚠️ Cached v1 calendar data was corrupted. Will fetch fresh data.');
        }
    }

    if (!calendars) {
        try {
            const calendarRes = await fetch('/api/v1/list_calendars.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ buwana_id: buwanaId })
            });

            if (!calendarRes.ok) {
                throw new Error(`HTTP ${calendarRes.status}`);
            }

            const freshData = await calendarRes.json();

            if (freshData?.ok && Array.isArray(freshData.calendars)) {
                calendars = freshData.calendars;
                sessionStorage.setItem('user_calendars_v1', JSON.stringify(calendars));
                try {
                    sessionStorage.setItem('user_calendars', JSON.stringify(buildLegacyCalendarCache(calendars)));
                } catch (err) {
                    console.warn('⚠️ Unable to cache legacy calendar view:', err);
                }
                console.log('📡 Fetched and cached fresh v1 calendar data.');
            } else {
                console.warn('⚠️ API calendar fetch failed:', freshData?.error || freshData?.message || 'unknown_error');
            }
        } catch (err) {
            console.error('❌ Error fetching calendar data from API:', err);
        }
    }

    if (!calendars) {
        useDefaultUser();
        return;
    }

    // 🌟 Prepare logged-in panel but keep it hidden until the user opens it
    showLoggedInView(calendars, { autoExpand: false });
    await syncDatecycles();  // 🔄 Begin sync with latest calendar state
}




function updateSessionStatus(message, isLoggedIn = false) {
    const sessionStatus = document.getElementById('user-session-status');
    const regUpButton = document.getElementById('reg-up-button');

    if (sessionStatus) sessionStatus.textContent = message;
    if (regUpButton) regUpButton.classList.toggle('active', isLoggedIn);
}

// Promise helper to wait for an element to appear
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });

        if (timeout) {
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`waitForElement timed out: ${selector}`));
            }, timeout);
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await waitForElement("#reg-up-button");

        const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });
        const name  = payload?.given_name || "User";
        const emoji = payload?.["buwana:earthlingEmoji"] || "🌍";

        updateSessionStatus(
            ok ? `🟢 Logged in as ${name} ${emoji}` : "⚪ Not logged in",
            ok
        );
    } catch (e) {
        console.warn(e.message);
    }
});




function useDefaultUser() {
    userLanguage = (navigator.language || 'en').slice(0, 2);

    try {
        userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
    } catch (e) {
        userTimeZone = "Asia/Jakarta"; // fallback if browser doesn't support timeZone
    }

    userProfile = {
        first_name: "Earthling",
        earthling_emoji: "🐸",
        email: null,
        buwana_id: null,
        status: "new"
    };

    displayUserData(userTimeZone, userLanguage);
    setCurrentDate(userTimeZone, userLanguage);
}

const OFFLINE_MODE_STORAGE_KEY = 'earthcal_offline_mode';

function getSavedOfflineMode() {
    const saved = localStorage.getItem(OFFLINE_MODE_STORAGE_KEY);
    return saved === 'simple' ? 'simple' : 'offline';
}

function setOfflineModeChoice(mode) {
    const normalized = mode === 'simple' ? 'simple' : 'offline';
    localStorage.setItem(OFFLINE_MODE_STORAGE_KEY, normalized);
    window.earthcalMode = normalized;
    window.isOfflineMode = normalized === 'offline';
    window.isSimpleMode = normalized === 'simple';
    return normalized;
}

function updateOfflineToggleUI(mode) {
    const toggle = document.getElementById('offline-mode-toggle');
    const status = document.getElementById('offline-mode-status');
    const normalized = mode === 'simple' ? 'simple' : 'offline';

    if (toggle) {
        toggle.checked = normalized === 'offline';
    }

    if (status) {
        status.textContent = normalized === 'offline'
            ? 'Offline Mode: Load cached data and continue where you left off.'
            : 'Simple Mode: Start fresh without cached data.';
    }
}

function handleOfflineToggleChange(event) {
    const mode = event.target.checked ? 'offline' : 'simple';
    const normalized = setOfflineModeChoice(mode);
    updateOfflineToggleUI(normalized);
}

function showOfflineForm() {
    const offlineForm = document.getElementById('offline-form-section');
    const loginForm = document.getElementById('login-form-section');
    const loggedInView = document.getElementById('logged-in-view');

    if (!offlineForm) {
        console.warn('❌ Missing offline form section.');
        return;
    }

    const mode = getSavedOfflineMode();
    setOfflineModeChoice(mode);
    updateOfflineToggleUI(mode);

    offlineForm.style.display = 'block';
    offlineForm.setAttribute('aria-hidden', 'false');

    if (loginForm) {
        loginForm.style.display = 'none';
    }

    if (loggedInView) {
        loggedInView.style.display = 'none';
    }

    const toggle = document.getElementById('offline-mode-toggle');
    if (toggle && !toggle.dataset.bound) {
        toggle.addEventListener('change', handleOfflineToggleChange);
        toggle.dataset.bound = 'true';
    }

    const goButton = document.getElementById('offline-go-button');
    if (goButton && !goButton.dataset.bound) {
        goButton.addEventListener('click', () => {
            const useCachedData = getSavedOfflineMode() !== 'simple';
            getOfflineUserData({ useCachedData });

            if (typeof displayDayInfo === 'function' && typeof window.targetDate !== 'undefined') {
                displayDayInfo(window.targetDate, window.userLanguage, window.userTimeZone);
            }

            if (typeof sendDownRegistration === 'function') {
                sendDownRegistration();
            }
        });
        goButton.dataset.bound = 'true';
    }

    setRegistrationFooterBackground('login');
}

function hideOfflineForm() {
    const offlineForm = document.getElementById('offline-form-section');
    const loginForm = document.getElementById('login-form-section');
    const loggedInView = document.getElementById('logged-in-view');

    if (offlineForm) {
        offlineForm.style.display = 'none';
        offlineForm.setAttribute('aria-hidden', 'true');
    }

    if (loginForm) {
        loginForm.style.display = 'block';
    }

    if (loggedInView) {
        loggedInView.style.display = 'none';
    }
}

function getOfflineUserData({ useCachedData = true } = {}) {
    const mode = setOfflineModeChoice(useCachedData ? 'offline' : 'simple');

    if (!useCachedData) {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('calendar_')) {
                localStorage.removeItem(key);
            }
        });
        sessionStorage.removeItem('user_calendars');
        sessionStorage.removeItem('user_calendars_v1');
    }

    useDefaultUser();

    if (typeof window.targetDate === 'undefined' || !(window.targetDate instanceof Date)) {
        window.targetDate = new Date();
    }

    if (typeof window.currentYear === 'undefined' || Number.isNaN(window.currentYear)) {
        window.currentYear = window.targetDate.getFullYear();
    }

    return { mode, useCachedData, targetDate: window.targetDate };
}





// Helper function to update footer and arrows when the registration-footer is displayed
function updateFooterAndArrowUI(footer, upArrow, downArrow) {

    footer.style.height = "100%";
    footer.style.marginBottom = "0px";
    upArrow.style.display = "none";
    downArrow.style.display = "block";
}


function setRegistrationFooterBackground(mode) {
    const footer = document.getElementById('registration-footer');
    if (!footer) {
        return;
    }

    footer.classList.remove('showing-login', 'showing-logged-in');

    if (mode === 'login') {
        footer.classList.add('showing-login');
    } else if (mode === 'logged-in') {
        footer.classList.add('showing-logged-in');
    }
}


// If not logged in then...






function showErrorState(loggedOutView, loggedInView) {
    console.error('Unexpected error in sendUpRegistration. Showing login form as fallback.');
    showLoginForm(loggedOutView, loggedInView);
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch] || ch));
}

function parseNumericId(rawValue) {
    if (rawValue === undefined || rawValue === null) {
        return null;
    }

    const trimmed = String(rawValue).trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
        return null;
    }

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? numericValue : null;
}

function formatDateDisplay(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function sanitizeCalendarColor(color) {
    if (typeof color !== 'string') return '#3b82f6';
    const trimmed = color.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
        return trimmed;
    }
    return '#3b82f6';
}

function buildLegacyCalendarCache(calendars) {
    const list = normalizeCalendarList(calendars);
    return {
        personal_calendars: list.map(cal => ({
            calendar_id: cal?.calendar_id ?? null,
            calendar_name: cal?.name ?? 'Untitled Calendar',
            calendar_color: cal?.color || cal?.color_hex || '#3b82f6',
            calendar_public: cal?.visibility === 'public' ? 1 : 0,
            last_updated: cal?.updated_at ?? null,
            calendar_created: cal?.created_at ?? null,
            description: cal?.description ?? '',
            category: cal?.category ?? '',
            emoji: cal?.emoji ?? '',
            is_readonly: cal?.is_readonly ? 1 : 0,
            is_active: normalizeCalendarActiveValue(cal?.is_active) ? 1 : 0
        })),
        subscribed_calendars: [],
        public_calendars: []
    };
}

function sortCalendarsByName(calendars) {
    if (!Array.isArray(calendars)) {
        return [];
    }

    return [...calendars].sort((a, b) => {
        const nameA = (a?.name || '').toLocaleLowerCase();
        const nameB = (b?.name || '').toLocaleLowerCase();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
}

function normalizeCalendarActiveValue(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            return false;
        }
        return value !== 0;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'y', 'on', 'active'].includes(normalized)) {
            return true;
        }
        if (['0', 'false', 'no', 'n', 'off', 'inactive', ''].includes(normalized)) {
            return false;
        }
    }

    if (value === null || value === undefined) {
        return false;
    }

    return Boolean(value);
}

function normalizeCalendarEntry(entry) {
    if (!entry || typeof entry !== 'object') {
        return entry;
    }

    const next = { ...entry };
    if ('cal_active' in next && !('is_active' in next)) {
        next.is_active = normalizeCalendarActiveValue(next.cal_active);
    } else {
        next.is_active = normalizeCalendarActiveValue(next.is_active);
    }
    return next;
}

function normalizeCalendarList(calendars) {
    if (!Array.isArray(calendars)) {
        return [];
    }

    return calendars.map((entry) => normalizeCalendarEntry(entry));
}

function renderCalendarSelectionForm(calendars, {
    container,
    publicContainer,
    webcalContainer,
    noPersonalText,
    noPublicText,
    noWebcalText,
    addPersonalLabel,
    browsePublicLabel,
    hostElement,
    webcalIntroHasText,
    webcalIntroEmptyText
} = {}) {
    const personalForm = container || document.getElementById('user-owned-calendars');
    const publicForm = publicContainer || document.getElementById('public-calendar-selection-form');
    const webcalForm = webcalContainer || document.getElementById('webcal-calendar-selection-form');

    if (!personalForm && !publicForm && !webcalForm) {
        return;
    }

    const list = normalizeCalendarList(calendars);

    const getHost = () => {
        if (hostElement instanceof HTMLElement) return hostElement;
        const fallback = (personalForm || webcalForm || publicForm)?.closest('#logged-in-view')
            || document.getElementById('logged-in-view');
        return fallback instanceof HTMLElement ? fallback : null;
    };

    const overlayHost = getHost();

    const getNormalizedSourceType = (cal) => {
        if (!cal) return '';
        const candidates = [
            cal?.source_type,
            cal?.source,
            cal?.sourceType,
            cal?.source_name,
            cal?.sourceName,
        ];

        for (const candidate of candidates) {
            if (candidate === null || candidate === undefined) continue;
            const normalized = candidate.toString().trim().toLowerCase();
            if (normalized) {
                return normalized;
            }
        }

        return '';
    };

    const isWebcalSourceType = (cal) => {
        if (!cal) return false;

        const source = getNormalizedSourceType(cal);
        const webcalSources = ['webcal', 'google', 'ical', 'ics', 'gcal'];
        if (source && webcalSources.includes(source)) {
            return true;
        }

        const url = (cal?.url || '').toString().trim().toLowerCase();
        if (url.startsWith('webcal://') || url.endsWith('.ics')) {
            return true;
        }

        return false;
    };

    if (personalForm) {
        const emptyState = typeof noPersonalText === 'string'
            ? noPersonalText
            : (personalForm.dataset.noPersonal || 'No personal calendars available.');
        personalForm.dataset.noPersonal = emptyState;

        const addLabel = typeof addPersonalLabel === 'string'
            ? addPersonalLabel
            : (personalForm.dataset.addLabel || 'Add new Earthcal');
        personalForm.dataset.addLabel = addLabel;

        personalForm.__ecAddCalendarHost = overlayHost;

        const personalCalendars = list.filter((cal) => {
            if (!cal) return false;

            const provider = (cal?.provider || '').toString().trim().toLowerCase();
            if (provider === 'google') {
                return false;
            }

            if (provider && provider !== 'earthcal') {
                return false;
            }

            const sourceType = getNormalizedSourceType(cal);
            if (sourceType && sourceType !== 'personal') {
                return false;
            }

            return true;
        });

        const rowsHtml = personalCalendars.length > 0
            ? personalCalendars.map((cal, index) => {
                const emoji = cal?.emoji?.trim() || '📅';
                const sourceType = escapeHtml((cal?.source_type || 'personal').toString());
                const providerName = (cal?.provider || 'EarthCal').toString();
                const safeProvider = escapeHtml(providerName);
                const calendarIdValue = cal?.calendar_id != null ? String(cal.calendar_id).trim() : '';
                const subscriptionIdValue = cal?.subscription_id != null ? String(cal.subscription_id) : '';
                const safeCalendarId = escapeHtml(calendarIdValue);
                const safeSubscriptionId = escapeHtml(subscriptionIdValue);
                const safeCalendarName = escapeHtml(cal?.name || 'Untitled Calendar');
                const isActive = normalizeCalendarActiveValue(cal?.is_active);
                const checkedAttr = isActive ? 'checked' : '';
                const activeState = isActive ? 'true' : 'false';
                const calColor = (cal?.cal_color || '').toString().trim();
                const safeCalColor = escapeHtml(calColor);
                const toggleActiveColor = escapeHtml(calColor || '#2ecc71');
                const toggleStyle = isActive ? ` style="--toggle-bg-active: ${toggleActiveColor};"` : '';
                const rowKey = calendarIdValue || (subscriptionIdValue ? `sub-${subscriptionIdValue}` : `idx-${index}`);
                const rowId = `cal-row-${rowKey}`;

                return `
                <div class="cal-toggle-row" id="${rowId}" data-calendar-id="${safeCalendarId}" data-source-type="${sourceType}" data-subscription-id="${safeSubscriptionId}" data-provider="${safeProvider}" data-calendar-name="${safeCalendarName}">
                    <div class="cal-row-summary" onclick="toggleCalDetails('${rowId}')">
                        <span class="cal-row-emoji" data-emoji="${escapeHtml(emoji)}" aria-hidden="true"></span>
                        <span class="cal-row-name">${safeCalendarName}</span>
                        <label class="toggle-switch cal-row-toggle" onclick="event.stopPropagation();"${toggleStyle}>
                            <input type="checkbox" aria-label="Toggle calendar visibility" ${checkedAttr} data-calendar-id="${safeCalendarId}" data-source-type="${sourceType}" data-subscription-id="${safeSubscriptionId}" data-active="${activeState}" data-cal-color="${safeCalColor}" data-provider="${safeProvider}" onchange="toggleV1CalVisibility(this)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="cal-row-details" data-calendar-id="${safeCalendarId}" data-loaded="false">
                        <div class="cal-details-content" aria-live="polite">
                            <p class="cal-details-placeholder">Expand to load calendar details.</p>
                        </div>
                        <div class="cal-row-actions">
                            <button type="button" class="cal-row-action" onclick="event.stopPropagation(); collapseCalDetails('${rowId}')" aria-label="Collapse calendar details">⬆️</button>
                            <button type="button" class="cal-row-action" onclick="event.stopPropagation(); editV1cal(${cal.calendar_id})" aria-label="Edit calendar">✏️</button>
                            <button type="button" class="cal-row-action" onclick="event.stopPropagation(); exportUserCalendar2ICS(${cal.calendar_id}, this)" aria-label="Download calendar as ICS" title="Download calendar as ICS">💾</button>
                            <button type="button" class="cal-row-action" onclick="event.stopPropagation(); deleteV1cal(${cal.calendar_id}, ${cal.is_default ? 'true' : 'false'})" aria-label="Delete calendar" title="Delete calendar">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
            }).join('')
            : `<p>${escapeHtml(emptyState)}</p>`;

        const addRowLabel = escapeHtml(addLabel);
        const addRowHtml = `
        <div class="cal-toggle-row cal-add-personal-row">
            <div class="cal-row-summary" role="button" tabindex="0" aria-label="${addRowLabel}">
                <span class="cal-row-emoji cal-row-icon" aria-hidden="true"><img src="assets/icons/earthcal-app.png" alt="" width="24" height="24"></span>
                <span class="cal-row-name">${addRowLabel}</span>
                <span class="cal-row-action-icon" aria-hidden="true"></span>
            </div>
        </div>
    `;

        personalForm.innerHTML = `${rowsHtml}${addRowHtml}`;

        const addSummary = personalForm.querySelector('.cal-add-personal-row .cal-row-summary');
        if (addSummary) {
            const handleActivate = (event) => {
                event.preventDefault();
                event.stopPropagation();

                const host = personalForm.__ecAddCalendarHost instanceof HTMLElement
                    ? personalForm.__ecAddCalendarHost
                    : document.getElementById('logged-in-view');

                if (typeof addNewCalendarV1 === 'function' && host) {
                    addNewCalendarV1({ host });
                }
            };

            addSummary.addEventListener('click', handleActivate);
            addSummary.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space') {
                    handleActivate(event);
                }
            });
        }
    }

    if (webcalForm) {
        const emptyWebcalText = typeof noWebcalText === 'string'
            ? noWebcalText
            : (webcalForm.dataset.noWebcal || '');
        webcalForm.dataset.noWebcal = emptyWebcalText;

        webcalForm.__ecAddCalendarHost = overlayHost;

        const webcalCalendars = list.filter((cal) => isWebcalSourceType(cal));

        const webcalRowsHtml = webcalCalendars.length > 0
            ? webcalCalendars.map((cal, index) => {
                const rawSourceType = (cal?.source_type || cal?.source || 'webcal').toString();
                const sourceType = escapeHtml(rawSourceType.toLowerCase());
                let providerNameRaw = (cal?.provider || '').toString().trim();
                const urlLower = (cal?.url || '').toString().trim().toLowerCase();
                if (!providerNameRaw && urlLower.includes('google.com')) {
                    providerNameRaw = 'Google';
                }
                const providerName = providerNameRaw || 'Webcal';
                const providerKey = providerName.toLowerCase();
                const isGoogleProvider = providerKey.includes('google') || urlLower.includes('google.com');
                const isAppleProvider = providerKey.includes('apple') || urlLower.includes('apple.com') || urlLower.includes('icloud.com');
                const safeProvider = escapeHtml(providerName);
                let providerIcon = 'assets/icons/earthcal-app.png';
                if (isGoogleProvider) {
                    providerIcon = 'assets/icons/google-g.png';
                } else if (isAppleProvider) {
                    providerIcon = 'assets/icons/apple-touch-icon.png';
                }
                const providerAlt = `${providerName} icon`;
                const providerIconSize = 24;
                const calendarIdValue = cal?.calendar_id != null ? String(cal.calendar_id).trim() : '';
                const calendarIdNum = Number(cal?.calendar_id);
                const subscriptionIdValue = cal?.subscription_id != null ? String(cal.subscription_id) : '';
                const safeCalendarId = escapeHtml(calendarIdValue);
                const safeSubscriptionId = escapeHtml(subscriptionIdValue);
                const safeCalendarName = escapeHtml(cal?.name || providerName);
                const isActive = normalizeCalendarActiveValue(cal?.is_active);
                const checkedAttr = isActive ? 'checked' : '';
                const activeState = isActive ? 'true' : 'false';
                const calColor = (cal?.cal_color || '').toString().trim();
                const safeCalColor = escapeHtml(calColor);
                const toggleActiveColor = escapeHtml(calColor || '#2ecc71');
                const toggleStyle = isActive ? ` style="--toggle-bg-active: ${toggleActiveColor};"` : '';
                const rowKey = calendarIdValue || (subscriptionIdValue ? `sub-${subscriptionIdValue}` : `web-${index}`);
                const rowId = `webcal-row-${rowKey}`;
                const editCalendarId = Number.isFinite(calendarIdNum) ? calendarIdNum : 'null';
                const deleteCalendarId = editCalendarId;

                const subscriptionIdNumeric = Number(subscriptionIdValue);
                const hasSubscriptionId = Number.isFinite(subscriptionIdNumeric) && subscriptionIdNumeric > 0;
                const syncButtonHtml = hasSubscriptionId
                    ? `<button type="button" class="cal-row-action cal-row-sync-button" data-subscription-id="${safeSubscriptionId}" data-provider="${safeProvider}" aria-label="Sync calendar" title="Sync calendar">🔃</button>`
                    : '';

                const canExport = Number.isFinite(calendarIdNum) && calendarIdNum > 0;
                const exportButtonHtml = canExport
                    ? `<button type="button" class="cal-row-action" onclick="event.stopPropagation(); exportUserCalendar2ICS(${calendarIdNum}, this)" aria-label="Download calendar as ICS" title="Download calendar as ICS">💾</button>`
                    : '';

                return `
                <div class="cal-toggle-row cal-webcal-row" id="${rowId}" data-calendar-id="${safeCalendarId}" data-source-type="${sourceType}" data-subscription-id="${safeSubscriptionId}" data-provider="${safeProvider}" data-calendar-name="${safeCalendarName}">
                    <div class="cal-row-summary" onclick="toggleCalDetails('${rowId}')">
                        <span class="cal-row-emoji cal-row-icon" aria-hidden="true"><img src="${providerIcon}" alt="${escapeHtml(providerAlt)}" width="${providerIconSize}" height="${providerIconSize}"></span>
                        <span class="cal-row-name">${safeCalendarName}</span>
                        <label class="toggle-switch cal-row-toggle" onclick="event.stopPropagation();"${toggleStyle}>
                            <input type="checkbox" aria-label="Toggle calendar visibility" ${checkedAttr} data-calendar-id="${safeCalendarId}" data-source-type="${sourceType}" data-subscription-id="${safeSubscriptionId}" data-active="${activeState}" data-cal-color="${safeCalColor}" data-provider="${safeProvider}" onchange="toggleV1CalVisibility(this)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="cal-row-details" data-calendar-id="${safeCalendarId}" data-loaded="false">
                        <div class="cal-details-content" aria-live="polite">
                            <p class="cal-details-placeholder">Expand to load calendar details.</p>
                        </div>
                        <div class="cal-row-actions">
                            <button type="button" class="cal-row-action" onclick="event.stopPropagation(); collapseCalDetails('${rowId}')" aria-label="Collapse calendar details">⬆️</button>
                            <button type="button" class="cal-row-action" onclick="event.stopPropagation(); editV1cal(${editCalendarId})" aria-label="Edit calendar">✏️</button>
                            ${syncButtonHtml}
                            ${exportButtonHtml}
                            <button type="button" class="cal-row-action" onclick="event.stopPropagation(); deleteV1cal(${deleteCalendarId}, ${cal.is_default ? 'true' : 'false'})" aria-label="Delete calendar" title="Delete calendar">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
            }).join('')
            : '';

        const connectGoogleRowHtml = `
        <div class="cal-toggle-row cal-connect-google-row">
            <div class="cal-row-summary" role="button" tabindex="0" aria-label="Add Google Calendar">
                <span class="cal-row-emoji cal-row-icon" aria-hidden="true"><img src="assets/icons/google-g.png" alt="" width="24" height="24"></span>
                <span class="cal-row-name">Add Google Calendar</span>
                <span class="cal-row-action-icon" aria-hidden="true" style="background-image: var(--cal-row-add-icon-hover) !important;"></span>
            </div>
        </div>
    `;

        const connectAppleRowHtml = `
        <div class="cal-toggle-row cal-connect-apple-row">
            <div class="cal-row-summary" role="button" tabindex="0" aria-label="Add Apple Calendar">
                <span class="cal-row-emoji cal-row-icon" aria-hidden="true"><img src="assets/icons/apple_logo.png" alt="" width="24" height="24"></span>
                <span class="cal-row-name">Add Apple Calendar</span>
                <span class="cal-row-action-icon" aria-hidden="true"  style="background-image: var(--cal-row-add-icon-hover) !important;"></span>
            </div>
        </div>
    `;

        const connectOutlookRowHtml = `
        <div class="cal-toggle-row cal-connect-outlook-row">
            <div class="cal-row-summary" role="button" tabindex="0" aria-label="Add Outlook Calendar">
                <span class="cal-row-emoji cal-row-icon" aria-hidden="true"><img src="assets/icons/outlook_logo.png" alt="" width="24" height="24"></span>
                <span class="cal-row-name">Add Outlook Calendar</span>
                <span class="cal-row-action-icon" aria-hidden="true"  style="background-image: var(--cal-row-add-icon-hover) !important;"></span>
            </div>
        </div>
    `;

        webcalForm.innerHTML = `${webcalRowsHtml}${connectGoogleRowHtml}${connectAppleRowHtml}${connectOutlookRowHtml}`;

        const webcalIntroEl = document.getElementById('webcal-intro-text');
        if (webcalIntroEl) {
            const hasWebcals = webcalCalendars.length > 0;
            const introText = hasWebcals
                ? (typeof webcalIntroHasText === 'string' ? webcalIntroHasText : 'You have the following iCal subscriptions...')
                : (typeof webcalIntroEmptyText === 'string' ? webcalIntroEmptyText : "You don't yet have any webcal subscriptions.");
            webcalIntroEl.textContent = introText;
        }

        const ensureJediPlanAccess = (onAllowed) => {
            const plan = (window.user_plan || '').toString().trim().toLowerCase();
            if (plan === 'jedi') {
                if (typeof onAllowed === 'function') {
                    onAllowed();
                }
                return true;
            }

            alert('Sorry, these advanced EarthCal features require a Jedi account.  Upgrade your account to support EarthCal development and access.');

            if (typeof manageEarthcalUserSub === 'function') {
                try {
                    manageEarthcalUserSub();
                } catch (error) {
                    console.error('Unable to open subscription modal after Jedi alert.', error);
                }
            }

            return false;
        };

        const connectSummary = webcalForm.querySelector('.cal-connect-google-row .cal-row-summary');
        if (connectSummary) {
            const handleConnect = (event) => {
                event.preventDefault();
                event.stopPropagation();
                ensureJediPlanAccess(() => {
                    if (typeof openGoogleCalendarConnectModal === 'function') {
                        openGoogleCalendarConnectModal();
                    }
                });
            };

            connectSummary.addEventListener('click', handleConnect);
            connectSummary.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space') {
                    handleConnect(event);
                }
            });
        }

        const appleSummary = webcalForm.querySelector('.cal-connect-apple-row .cal-row-summary');
        if (appleSummary) {
            const handleAppleConnect = (event) => {
                event.preventDefault();
                event.stopPropagation();
                ensureJediPlanAccess(() => {
                    if (typeof connectAppleCalendar === 'function') {
                        connectAppleCalendar();
                    }
                });
            };

            appleSummary.addEventListener('click', handleAppleConnect);
            appleSummary.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space') {
                    handleAppleConnect(event);
                }
            });
        }

        const outlookSummary = webcalForm.querySelector('.cal-connect-outlook-row .cal-row-summary');
        if (outlookSummary) {
            const handleOutlookConnect = (event) => {
                event.preventDefault();
                event.stopPropagation();
                ensureJediPlanAccess(() => {
                    if (typeof connectOutlookCalendar === 'function') {
                        connectOutlookCalendar();
                    }
                });
            };

            outlookSummary.addEventListener('click', handleOutlookConnect);
            outlookSummary.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space') {
                    handleOutlookConnect(event);
                }
            });
        }

        const syncButtons = webcalForm.querySelectorAll('.cal-row-sync-button');
        const handleSyncClick = async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const button = event.currentTarget;
            if (!(button instanceof HTMLElement)) return;

            const parentRow = button.closest('.cal-toggle-row');
            const providerNormalized = ((button.dataset.provider || parentRow?.dataset?.provider || '')
                .toString()
                .trim()
                .toLowerCase());

            const subscriptionId = Number(button.dataset.subscriptionId || '');
            if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) {
                alert('Cannot sync this calendar right now.');
                return;
            }

            const originalText = button.textContent;
            button.textContent = '⏳';
            button.disabled = true;
            button.classList.add('is-syncing');

            try {
                const res = await fetch('/api/v1/sync_ical.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ subscription_id: subscriptionId, force_full: true }),
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok && data?.ok) {
                    if (providerNormalized === 'google') {
                        const previewItems = Array.isArray(data?.items) ? data.items.slice(0, 10) : [];
                        const totalItems = Number(data?.items_total) || previewItems.length;
                        if (previewItems.length > 0) {
                            console.log(`[webcal sync] Preview of first ${previewItems.length} Google webcal items (of ${totalItems} total):`, previewItems);
                        } else {
                            console.log('[webcal sync] Google calendar sync completed with no preview items returned.');
                        }
                    }

                    if (data?.skipped) {
                        alert('Calendar feed is already up to date.');
                    } else {
                        const inserted = Number(data?.inserted) || 0;
                        const updated = Number(data?.updated) || 0;
                        const parts = [];
                        if (inserted > 0) parts.push(`${inserted} new events`);
                        if (updated > 0) parts.push(`${updated} updates`);
                        const summary = parts.length ? parts.join(' and ') : 'No changes';
                        alert(`Sync complete: ${summary}.`);
                    }
                } else {
                    const detail = data?.detail || data?.error || 'Unable to sync calendar.';
                    alert(`Sync failed: ${detail}`);
                }
            } catch (error) {
                console.error('[webcal sync] Failed to sync calendar', error);
                alert('Sync failed: A network error occurred.');
            } finally {
                button.textContent = originalText || '🔄';
                button.disabled = false;
                button.classList.remove('is-syncing');
            }
        };

        syncButtons.forEach((button) => {
            if (button instanceof HTMLElement) {
                if (button.dataset.syncBound === 'true') return;
                button.dataset.syncBound = 'true';
                button.addEventListener('click', handleSyncClick);
            }
        });
    }

    if (publicForm) {
        const emptyPublicText = typeof noPublicText === 'string'
            ? noPublicText
            : (publicForm.dataset.noPublic || "You don't yet have any public calendars subscriptions.");
        publicForm.dataset.noPublic = emptyPublicText;

        const browseLabel = typeof browsePublicLabel === 'string'
            ? browsePublicLabel
            : (publicForm.dataset.browseLabel || 'Browse and subscribe to public Earthcals...');
        publicForm.dataset.browseLabel = browseLabel;

        publicForm.__ecBrowsePublicHost = overlayHost;

        const publicCalendars = list.filter((cal) => {
            if (!cal) return false;

            const sourceType = getNormalizedSourceType(cal);
            if (sourceType !== 'earthcal') {
                return false;
            }

            const subscriptionId = cal?.subscription_id;
            const normalizedSubscriptionId = subscriptionId === null || subscriptionId === undefined
                ? NaN
                : Number(subscriptionId);

            const visibility = (cal.visibility || '').toString().toLowerCase();
            const isPublicVisibility = visibility === 'public' || visibility === 'unlisted';

            return Number.isFinite(normalizedSubscriptionId) && isPublicVisibility;
        });

        const publicRowsHtml = publicCalendars.length > 0
            ? publicCalendars.map((cal, index) => {
                const emoji = cal?.emoji?.trim() || '📅';
                const sourceType = escapeHtml((cal?.source_type || 'earthcal').toString());
                const calendarIdValue = cal?.calendar_id != null ? String(cal.calendar_id).trim() : '';
                const subscriptionIdValue = cal?.subscription_id != null ? String(cal.subscription_id) : '';
                const safeCalendarId = escapeHtml(calendarIdValue);
                const safeSubscriptionId = escapeHtml(subscriptionIdValue);
                const isActive = normalizeCalendarActiveValue(cal?.is_active);
                const checkedAttr = isActive ? 'checked' : '';
                const activeState = isActive ? 'true' : 'false';
                const calColor = (cal?.color || cal?.cal_color || '').toString().trim();
                const safeCalColor = escapeHtml(calColor);
                const toggleActiveColor = escapeHtml(calColor || '#2ecc71');
                const toggleStyle = isActive ? ` style="--toggle-bg-active: ${toggleActiveColor};"` : '';
                const rowKey = calendarIdValue || (subscriptionIdValue ? `sub-${subscriptionIdValue}` : `pub-${index}`);
                const rowId = `public-cal-row-${rowKey}`;

                const hasCalendarId = calendarIdValue !== '';
                const summaryClickAttr = hasCalendarId ? ` onclick="toggleCalDetails('${rowId}')"` : '';
                const detailsHtml = hasCalendarId
                    ? `
                    <div class="cal-row-details" data-calendar-id="${safeCalendarId}" data-loaded="false">
                        <div class="cal-details-content" aria-live="polite">
                            <p class="cal-details-placeholder">Expand to load calendar details.</p>
                        </div>
                    </div>
                `
                    : '';

                return `
                <div class="cal-toggle-row cal-public-cal-row" id="${rowId}" data-calendar-id="${safeCalendarId}" data-source-type="${sourceType}" data-subscription-id="${safeSubscriptionId}">
                    <div class="cal-row-summary"${summaryClickAttr}>
                        <span class="cal-row-emoji" data-emoji="${escapeHtml(emoji)}" aria-hidden="true"></span>
                        <span class="cal-row-name">${escapeHtml(cal?.name || 'Untitled Calendar')}</span>
                        <label class="toggle-switch cal-row-toggle" onclick="event.stopPropagation();"${toggleStyle}>
                            <input type="checkbox" aria-label="Toggle calendar visibility" ${checkedAttr} data-calendar-id="${safeCalendarId}" data-source-type="${sourceType}" data-subscription-id="${safeSubscriptionId}" data-active="${activeState}" data-cal-color="${safeCalColor}" onchange="toggleV1CalVisibility(this)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    ${detailsHtml}
                </div>
            `;
            }).join('')
            : '';

        const safeBrowseLabel = escapeHtml(browseLabel);
        const browseRowHtml = `
        <div class="cal-toggle-row cal-browse-public-row">
            <div class="cal-row-summary" role="button" tabindex="0" aria-label="${safeBrowseLabel}">
                <span class="cal-row-emoji cal-row-icon" aria-hidden="true"><img src="assets/icons/earthcal-app.png" alt="" width="24" height="24"></span>
                <span class="cal-row-name">${safeBrowseLabel}</span>
                <span class="cal-row-action-icon" aria-hidden="true"></span>
            </div>
        </div>
    `;

        publicForm.innerHTML = `${publicRowsHtml}${browseRowHtml}`;

        const publicMessageEl = document.getElementById('public-cal-message');
        if (publicMessageEl) {
            publicMessageEl.textContent = publicCalendars.length > 0
                ? 'Your public calendar subscriptions..'
                : "You don't yet have any public calendars subscriptions.";
        }

        const browseSummary = publicForm.querySelector('.cal-browse-public-row .cal-row-summary');
        if (browseSummary) {
            const handleBrowse = (event) => {
                event.preventDefault();
                event.stopPropagation();

                const host = publicForm.__ecBrowsePublicHost instanceof HTMLElement
                    ? publicForm.__ecBrowsePublicHost
                    : document.getElementById('logged-in-view');

                if (typeof showPublicCalendars === 'function' && host) {
                    showPublicCalendars({ host });
                }
            };

            browseSummary.addEventListener('click', handleBrowse);
            browseSummary.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space') {
                    handleBrowse(event);
                }
            });
        }
    }
}


function refreshLoggedInCalendarLists(nextCalendars) {
    const loggedInView = document.getElementById('logged-in-view');
    if (!(loggedInView instanceof HTMLElement)) {
        return;
    }

    const personalForm = loggedInView.querySelector('#user-owned-calendars');
    const webcalForm = loggedInView.querySelector('#webcal-calendar-selection-form');
    const publicForm = loggedInView.querySelector('#public-calendar-selection-form');

    if (!personalForm && !publicForm && !webcalForm) {
        return;
    }

    let calendars = Array.isArray(nextCalendars) ? nextCalendars : null;

    if (!calendars) {
        try {
            const cachedRaw = sessionStorage.getItem('user_calendars_v1');
            if (cachedRaw) {
                const parsed = JSON.parse(cachedRaw);
                if (Array.isArray(parsed)) {
                    calendars = parsed;
                }
            }
        } catch (err) {
            console.debug('[refreshLoggedInCalendarLists] unable to parse cached calendars', err);
        }
    }

    if (!Array.isArray(calendars)) {
        calendars = [];
    }

    const normalizedCalendars = normalizeCalendarList(calendars);
    const sortedCalendars = sortCalendarsByName(normalizedCalendars);

    renderCalendarSelectionForm(sortedCalendars, {
        container: personalForm || undefined,
        webcalContainer: webcalForm || undefined,
        publicContainer: publicForm || undefined,
        noPersonalText: personalForm?.dataset?.noPersonal,
        noPublicText: publicForm?.dataset?.noPublic,
        noWebcalText: webcalForm?.dataset?.noWebcal,
        addPersonalLabel: personalForm?.dataset?.addLabel,
        hostElement: loggedInView
    });
}

if (typeof window !== 'undefined') {
    window.sortCalendarsByName = sortCalendarsByName;
    window.renderCalendarSelectionForm = renderCalendarSelectionForm;
    window.refreshLoggedInCalendarLists = refreshLoggedInCalendarLists;
}

const CAL_CACHE_KEY_NAME = 'earthcal_calendars';
const CAL_CACHE_AT_KEY_NAME = 'earthcal_calendars_cached_at';

function showCalendarToggleStatus(isActive) {
    const message = isActive
        ? '✅ Calendar is now active on your Earthcal!'
        : '🙈 Calendar is now hidden from your Earthcal.';

    if (typeof setSyncStatus === 'function') {
        setSyncStatus(message, '', false, { temporary: true, duration: 3000 });
        return;
    }

    const syncStatus = document.getElementById('sync-status');
    if (!syncStatus) {
        return;
    }

    const previousContent = syncStatus.innerHTML;
    syncStatus.textContent = message;

    if (syncStatus.__toggleTimer) {
        clearTimeout(syncStatus.__toggleTimer);
    }

    syncStatus.__toggleTimer = window.setTimeout(() => {
        syncStatus.innerHTML = typeof syncStatus.dataset?.defaultHtml === 'string'
            ? syncStatus.dataset.defaultHtml
            : previousContent;
        syncStatus.__toggleTimer = null;
    }, 3000);
}

function updateCachedCalendarActiveState({ calendarId, subscriptionId, sourceType, isActive }) {
    const normalizedSource = (sourceType || 'personal').toString().toLowerCase();
    const matchCalendar = (entry) => {
        if (!entry || typeof entry !== 'object') return false;
        const entrySource = (entry.source_type || entry.sourceType || 'personal').toString().toLowerCase();
        if (entrySource !== normalizedSource) return false;

        if (normalizedSource === 'webcal') {
            const subId = Number(entry.subscription_id ?? entry.subscriptionId);
            return Number.isFinite(subId) && Number(subId) === Number(subscriptionId);
        }

        const calId = Number(entry.calendar_id ?? entry.id);
        return Number.isFinite(calId) && Number(calId) === Number(calendarId);
    };

    const updateListCache = (key) => {
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;

            let changed = false;
            const next = parsed.map((entry) => {
                if (matchCalendar(entry)) {
                    changed = true;
                    return { ...entry, is_active: !!isActive };
                }
                return entry;
            });

            if (changed) {
                sessionStorage.setItem(key, JSON.stringify(next));
                sessionStorage.setItem(CAL_CACHE_AT_KEY_NAME, String(Date.now()));
            }
        } catch (err) {
            console.debug('[updateCachedCalendarActiveState] unable to refresh cache', err);
        }
    };

    updateListCache(CAL_CACHE_KEY_NAME);
    updateListCache('user_calendars_v1');

    try {
        const legacyRaw = sessionStorage.getItem('user_calendars');
        if (!legacyRaw) return;
        const legacy = JSON.parse(legacyRaw);
        if (!legacy || typeof legacy !== 'object') return;
        let changed = false;
        if (Array.isArray(legacy.personal_calendars)) {
            legacy.personal_calendars = legacy.personal_calendars.map((entry) => {
                if (matchCalendar(entry)) {
                    changed = true;
                    return { ...entry, is_active: isActive ? 1 : 0 };
                }
                return entry;
            });
        }
        if (changed) {
            sessionStorage.setItem('user_calendars', JSON.stringify(legacy));
        }
    } catch (err) {
        console.debug('[updateCachedCalendarActiveState] unable to update legacy cache', err);
    }
}

async function showLoggedInView(calendars = [], { autoExpand = true } = {}) {
    const loggedInView = document.getElementById("logged-in-view");
    const registrationContainer = document.getElementById('registration-container');
    const footer = document.getElementById('registration-footer');
    const loggedOutView = document.getElementById('login-form-section');
    const upArrow = document.getElementById('reg-up-button');
    const downArrow = document.getElementById('reg-down-button');

    // ✅ Validate login status first
    const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });
    if (!ok || !payload?.buwana_id) {
        console.warn("❌ Cannot show logged-in view — user not authenticated.");
        return;
    }

    const isContainerExpanded = registrationContainer?.classList.contains('expanded');
    const shouldShowPanel = autoExpand || isContainerExpanded;

    if (shouldShowPanel) {
        if (registrationContainer) {
            registrationContainer.classList.add('expanded');
            registrationContainer.classList.remove('collapsing');
        }

        if (loggedOutView) {
            loggedOutView.style.display = 'none';
        }

        if (loggedInView) {
            loggedInView.style.display = 'block';
        }

        setRegistrationFooterBackground('logged-in');

        if (footer && upArrow && downArrow) {
            updateFooterAndArrowUI(footer, upArrow, downArrow);
        }
    } else {
        if (registrationContainer) {
            registrationContainer.classList.remove('collapsing');
        }

        if (loggedInView) {
            loggedInView.style.display = 'none';
        }
    }

    const first_name = payload.given_name || "Earthling";
    const earthling_emoji = payload["buwana:earthlingEmoji"] || "🌍";
    const buwana_id = payload.buwana_id;

    const lang = window.userLanguage?.toLowerCase() || 'en';
    const translations = await loadTranslations(lang);
    const loggedInStrings = translations.loggedIn || {};
    const {
        welcome,
        syncingInfo,
        noPersonal,
        noPublic,
        addPersonal: addPersonalLabel = 'Add new Earthcal',
        browsePublic: browsePublicLabel = 'Browse and subscribe to public Earthcals...',
        publicCalendarsIntro = 'You are subscribed to the following public calendars...',
        webcalHasSubscriptions = 'You have the following iCal subscriptions...',
        webcalNoSubscriptions = "You don't yet have any webcal subscriptions.",
        noWebcal: noWebcalText
    } = loggedInStrings;

    const fallbackCalendars = Array.isArray(calendars) ? [...calendars] : [];
    let calendarList = [];

    if (typeof loadUserCalendars === 'function') {
        try {
            calendarList = await loadUserCalendars(buwana_id, { force: true });
        } catch (err) {
            console.warn('[showLoggedInView] Unable to refresh v1 calendars:', err);
            calendarList = [];
        }
    } else {
        calendarList = [...fallbackCalendars];
    }

    if (!Array.isArray(calendarList) || !calendarList.length) {
        calendarList = [...fallbackCalendars];
    }

    if (!Array.isArray(calendarList)) {
        calendarList = [];
    }

    const normalizedCalendars = normalizeCalendarList(calendarList);

    try {
        sessionStorage.setItem('user_calendars_v1', JSON.stringify(normalizedCalendars));
    } catch (err) {
        console.debug('[showLoggedInView] Unable to cache v1 calendars:', err);
    }

    try {
        sessionStorage.setItem('user_calendars', JSON.stringify(buildLegacyCalendarCache(normalizedCalendars)));
    } catch (err) {
        console.debug('[showLoggedInView] Unable to refresh legacy calendar cache:', err);
    }

    const sortedCalendars = sortCalendarsByName(normalizedCalendars);

    const editProfileUrl = `https://buwana.ecobricks.org/${lang}/edit-profile.php?buwana=${encodeURIComponent(buwana_id)}&app=${encodeURIComponent(payload.aud || payload.client_id || "unknown")}`;

    document.removeEventListener('click', handleCalOutsideClick, true);
    currentExpandedCalRowId = null;

    loggedInView.innerHTML = `
        <div class="add-date-form" style="padding:10px;">
            <h2 style="font-family:'Mulish',sans-serif;" class="logged-in-message">
                ${welcome} ${first_name}!
            </h2>
             <div id="sync-status">
                <p>${syncingInfo}</p>
            </div>


            <div id="user-owned-calendars" class="cal-toggle-list" style="text-align:left; max-width:500px; margin:0 auto 32px;"></div>
            <p id="public-cal-message" style="text-align:center; margin-bottom: 8px;">${publicCalendarsIntro}</p>
            <div id="public-calendar-selection-form" class="cal-toggle-list" style="text-align:left; max-width:500px; margin:0 auto 32px;"></div>
            <p id="webcal-intro-text" style="text-align:center; margin-bottom: 8px;"></p>
            <div id="webcal-calendar-selection-form" class="cal-toggle-list" style="text-align:left; max-width:500px; margin:0 auto 32px;"></div>

            <div id="logged-in-buttons" style="max-width: 90%; margin: auto; display: flex; flex-direction: column; gap: 10px;">
                <button type="button" class="sync-style confirmation-blur-button enabled" onclick="window.open('${editProfileUrl}', '_blank');">
                    Edit Buwana Profile
                </button>
                <p class="ec-profile-connection-note" style="margin:0;text-align:center;font-size:0.85rem;color:var(--subdued-text, #6b7280);">
                    You are connected to Earthcal with your ${earthling_emoji} ${escapeHtml(first_name)} Buwana account.
                </p>
            </div>

            <p id="cal-datecycle-count"></p>
        </div>
    `;

    renderCalendarSelectionForm(sortedCalendars, {
        container: loggedInView.querySelector('#user-owned-calendars'),
        webcalContainer: loggedInView.querySelector('#webcal-calendar-selection-form'),
        publicContainer: loggedInView.querySelector('#public-calendar-selection-form'),
        noPersonalText: noPersonal,
        noPublicText: noPublic,
        addPersonalLabel,
        browsePublicLabel,
        hostElement: loggedInView,
        noWebcalText,
        webcalIntroHasText: webcalHasSubscriptions,
        webcalIntroEmptyText: webcalNoSubscriptions
    });

    loggedInView.style.display = "block";

    const syncStatusDiv = loggedInView.querySelector('#sync-status');
    if (syncStatusDiv) {
        const defaultHtml = syncStatusDiv.innerHTML;
        syncStatusDiv.dataset.defaultHtml = defaultHtml;
        if (syncStatusDiv.__resetTimer) {
            clearTimeout(syncStatusDiv.__resetTimer);
            syncStatusDiv.__resetTimer = null;
        }
    }

}

function openGoogleCalendarConnectModal() {
    const modal = document.getElementById('form-modal-message');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) {
        console.warn('[GoogleCalendar] Modal container not available.');
        return;
    }

    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    document.body.style.overflowY = 'hidden';

    modalContent.innerHTML = `
        <div class="add-date-form" style="margin:auto;text-align:center;">
            <img src="assets/icons/google-g.png" alt="" width="75" height="75" aria-hidden="true" style="display:block;margin:0 auto 12px;">
            <h3 class="ec-form-title">Please add the URL of a public Google Calendar to sync it with your Earthcal.</h3>
            <form id="ec-google-calendar-form" autocomplete="off" style="display:flex;flex-direction:column;gap:10px;">
                <label class="ec-visually-hidden" for="ec-google-calendar-url">Google Calendar URL</label>
                <input id="ec-google-calendar-url" type="url" name="google_calendar_url" required
                       placeholder="https://calendar.google.com/calendar/..."
                       class="blur-form-field" style="text-align:left;">
                <button type="submit" class="stellar-submit" style="background-color:#d93025;color:#fff;">Connect</button>
                <p id="ec-google-calendar-feedback" aria-live="polite" style="margin:0;color:#d93025;font-size:0.9rem;min-height:1.2em;display:none;"></p>
                <div id="ec-google-calendar-instructions" style="text-align:left;font-size:0.85rem;color:var(--subdued-text,#4b5563);">
                    <p style="margin:0;">
                        To find you google calendars ical URL, go to calendar.google.com and find the calendar that you want to sync on the left hand side column.  Hover over it.  You will see three dots.  Click.  Select "Setting and Sharing".  Navigate to the bottom of the page.  Find the "Public Address in iCal format".  Copy this URL and use in the field above.
                    </p>
                </div>
            </form>
        </div>
    `;

    const form = document.getElementById('ec-google-calendar-form');
    const feedbackEl = document.getElementById('ec-google-calendar-feedback');
    if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.style.display = 'none';
    }
    if (form) {
        const submitButton = form.querySelector('button[type="submit"]');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const urlInput = document.getElementById('ec-google-calendar-url');
            const calendarUrl = urlInput ? urlInput.value.trim() : '';

            if (typeof connectGcal === 'function') {
                connectGcal(calendarUrl, { form, submitButton, feedbackElement: feedbackEl });
            } else {
                console.warn('[GoogleCalendar] connectGcal is not defined.');
            }
        });
    }

    const urlField = document.getElementById('ec-google-calendar-url');
    if (urlField) {
        urlField.focus();
        if (typeof urlField.select === 'function') {
            urlField.select();
        }
    }
}

function openAppleCalendarConnectModal() {
    const modal = document.getElementById('form-modal-message');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) {
        console.warn('[AppleCalendar] Modal container not available.');
        return;
    }

    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    document.body.style.overflowY = 'hidden';

    modalContent.innerHTML = `
        <div class="add-date-form" style="margin:auto;text-align:center;">
            <img src="assets/icons/apple_logo.png" alt="" width="48" height="48" aria-hidden="true" style="display:block;margin:0 auto 12px;">
            <h3 class="ec-form-title">Paste the public link for the Apple Calendar you want to sync to Earthcal.</h3>
            <form id="ec-apple-calendar-form" autocomplete="off" style="display:flex;flex-direction:column;gap:10px;">
                <label class="ec-visually-hidden" for="ec-apple-calendar-url">Apple Calendar URL</label>
                <input id="ec-apple-calendar-url" type="url" name="apple_calendar_url" required
                       placeholder="https://pXX-caldav.icloud.com/.../public.ics"
                       class="blur-form-field" style="text-align:left;">
                <button type="submit" class="stellar-submit" style="background-color:#0a84ff;color:#fff;">Connect</button>
                <p id="ec-apple-calendar-feedback" aria-live="polite" style="margin:0;color:#0a84ff;font-size:0.9rem;min-height:1.2em;"></p>
                <div id="ec-apple-calendar-instructions" style="text-align:left;font-size:0.85rem;color:var(--subdued-text,#4b5563);">
                    <p style="margin:0 0 8px;">
                        On your Mac, open the Calendar app and Control-click the calendar you want to share. Choose
                        <strong>Share Calendar…</strong>, then turn on <strong>Public Calendar</strong>. Copy the link that appears and paste it above.
                    </p>
                    <p style="margin:0;">
                        From iCloud.com, open <strong>Calendar</strong>, click the wireless share icon next to the calendar name, enable
                        <strong>Public Calendar</strong>, and use the <strong>Copy Link</strong> option to grab the <code>.ics</code> address.
                    </p>
                </div>
            </form>
        </div>
    `;

    const form = document.getElementById('ec-apple-calendar-form');
    const feedbackEl = document.getElementById('ec-apple-calendar-feedback');
    if (feedbackEl) {
        feedbackEl.textContent = '';
    }
    if (form) {
        const submitButton = form.querySelector('button[type="submit"]');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const urlInput = document.getElementById('ec-apple-calendar-url');
            const calendarUrl = urlInput ? urlInput.value.trim() : '';

            if (typeof connectAppleCal === 'function') {
                connectAppleCal(calendarUrl, { form, submitButton, feedbackElement: feedbackEl });
            } else {
                console.warn('[AppleCalendar] connectAppleCal is not defined.');
            }
        });
    }

    const urlField = document.getElementById('ec-apple-calendar-url');
    if (urlField) {
        urlField.focus();
        if (typeof urlField.select === 'function') {
            urlField.select();
        }
    }
}

function connectAppleCalendar() {
    openAppleCalendarConnectModal();
}

if (typeof window !== 'undefined') {
    window.connectAppleCalendar = connectAppleCalendar;
}

function openOutlookCalendarConnectModal() {
    const modal = document.getElementById('form-modal-message');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) {
        console.warn('[OutlookCalendar] Modal container not available.');
        return;
    }

    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    document.body.style.overflowY = 'hidden';

    modalContent.innerHTML = `
        <div class="add-date-form" style="margin:auto;text-align:center;">
            <img src="assets/icons/outlook_logo.png" alt="" width="52" height="52" aria-hidden="true" style="display:block;margin:0 auto 12px;">
            <h3 class="ec-form-title">Paste the Outlook calendar ICS link you want to sync with Earthcal.</h3>
            <form id="ec-outlook-calendar-form" autocomplete="off" style="display:flex;flex-direction:column;gap:10px;">
                <label class="ec-visually-hidden" for="ec-outlook-calendar-url">Outlook Calendar URL</label>
                <input id="ec-outlook-calendar-url" type="url" name="outlook_calendar_url" required
                       placeholder="https://outlook.office365.com/.../calendar.ics"
                       class="blur-form-field" style="text-align:left;">
                <button type="submit" class="stellar-submit" style="background-color:#0078d4;color:#fff;">Connect</button>
                <p id="ec-outlook-calendar-feedback" aria-live="polite" style="margin:0;color:#0078d4;font-size:0.9rem;min-height:1.2em;"></p>
                <div id="ec-outlook-calendar-instructions" style="text-align:left;font-size:0.85rem;color:var(--subdued-text,#4b5563);">
                    <p style="margin:0 0 8px;">
                        In Outlook on the web, open <strong>Settings</strong> → <strong>View all Outlook settings</strong> → <strong>Calendar</strong> → <strong>Shared calendars</strong>.
                        Under <strong>Publish a calendar</strong>, choose your calendar, select <em>Can view all details</em>, publish it, and copy the <strong>ICS link</strong> shown.
                    </p>
                    <p style="margin:0;">
                        From the Outlook desktop app you can go to <strong>File → Save Calendar</strong> and choose <code>.ics</code> to export. Upload that file to a public location and paste its link above to keep it in sync.
                    </p>
                </div>
            </form>
        </div>
    `;

    const form = document.getElementById('ec-outlook-calendar-form');
    const feedbackEl = document.getElementById('ec-outlook-calendar-feedback');
    if (feedbackEl) {
        feedbackEl.textContent = '';
    }
    if (form) {
        const submitButton = form.querySelector('button[type="submit"]');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const urlInput = document.getElementById('ec-outlook-calendar-url');
            const calendarUrl = urlInput ? urlInput.value.trim() : '';

            if (typeof connectOutlookCal === 'function') {
                connectOutlookCal(calendarUrl, { form, submitButton, feedbackElement: feedbackEl });
            } else {
                console.warn('[OutlookCalendar] connectOutlookCal is not defined.');
            }
        });
    }

    const urlField = document.getElementById('ec-outlook-calendar-url');
    if (urlField) {
        urlField.focus();
        if (typeof urlField.select === 'function') {
            urlField.select();
        }
    }
}

function connectOutlookCalendar() {
    openOutlookCalendarConnectModal();
}

if (typeof window !== 'undefined') {
    window.connectOutlookCalendar = connectOutlookCalendar;
}








// Helper: generate random string (state, nonce, code_verifier)
function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    array.forEach(val => result += charset[val % charset.length]);
    return result;
}

// Helper: generate PKCE code_challenge (SHA-256 hash of code_verifier)
async function generateCodeChallenge(code_verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code_verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
}

// Helper: base64url encoding function (RFC 7636 spec)
function base64UrlEncode(arrayBuffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}




//
// function buildJWTuserProfile() {
//     const id_token = localStorage.getItem('id_token');
//     if (!id_token) return null;
//
//     try {
//         const payload = JSON.parse(atob(id_token.split('.')[1]));
//
//         // Derive buwana_id from sub
//         let buwanaId = null;
//         if (payload.sub.startsWith("buwana_")) {
//             buwanaId = payload.sub.split("_")[1];
//         } else {
//             buwanaId = payload.sub;
//         }
//
//         const jwtProfile = {
//             sub: payload.sub,
//             buwana_id: buwanaId,
//             email: payload.email,
//             first_name: payload.given_name,
//             earthling_emoji: payload["buwana:earthlingEmoji"],
//             community: payload["buwana:community"],
//             continent: payload["buwana:location.continent"]
//         };
//
//         console.log("JWTuserProfile:", jwtProfile);
//         return jwtProfile;
//     } catch (e) {
//         console.error("Failed to parse ID token:", e);
//         return null;
//     }
// }


/*-------------------------

LOGIN FORM

------------------------ */




async function showLoginForm(loggedOutView, loggedInView) {
    setRegistrationFooterBackground('login');

    loggedOutView.style.display = "block";
    loggedInView.style.display = "none";

    createJWTloginURL(); // 🌱 Always refresh the login URL

    // 🌿 Pull from persistent profile or global scope
    let profile = window.userProfile;
    if (!profile) {
        const profileStr = localStorage.getItem("user_profile");
        if (profileStr) {
            try {
                profile = JSON.parse(profileStr);
            } catch (e) {
                console.warn("[showLoginForm] Failed to parse cached user profile:", e);
            }
        }
    }

    const {
        status = "returning",
        earthling_emoji = "🌱",
        first_name = "Earthling"
    } = profile || {};

    const lang = (window.userLanguage || navigator.language.slice(0, 2)).toLowerCase();
    const translations = await loadTranslations(lang);
    const loginStrings = translations.login;

    const subStatusDiv = document.getElementById('sub-status-message');
    if (subStatusDiv) {
        subStatusDiv.innerHTML = (status === "firsttime")
            ? loginStrings.statusFirstTime(earthling_emoji)
            : loginStrings.statusReturning(earthling_emoji, first_name);
    }
}




async function createJWTloginURL() {
    // Buwana configuration
    const buwanaAuthorizeURL = "https://buwana.ecobricks.org/authorize";
    const client_id = "ecal_7f3da821d0a54f8a9b58";
    const redirect_uri = "https://earthcal.app/auth/callback";  // No need to encodeURIComponent here yet
    const scope = "openid email profile";
    const lang = "en"; // You can replace this with dynamic language detection if needed

    // Generate random state and nonce
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);
    sessionStorage.setItem("oidc_state", state);
    sessionStorage.setItem("oidc_nonce", nonce);

    // 🔑 Generate PKCE code_verifier and code_challenge
    const code_verifier = generateRandomString(64);
    const code_challenge = await generateCodeChallenge(code_verifier);
    sessionStorage.setItem("pkce_code_verifier", code_verifier);
    persistOidcFallback({
        oidc_state: state,
        oidc_nonce: nonce,
        pkce_code_verifier: code_verifier,
    });

    // Build full authorize URL with PKCE parameters
    const url = new URL(buwanaAuthorizeURL);
    url.searchParams.append("client_id", client_id);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", scope);
    url.searchParams.append("redirect_uri", redirect_uri);
    url.searchParams.append("state", state);
    url.searchParams.append("nonce", nonce);
    url.searchParams.append("code_challenge", code_challenge);
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("lang", lang);

    // Log for debugging
    console.log("Generated PKCE Login URL:", url.toString());

    // Assign to login button
    const loginButton = document.getElementById("auth-login-button");
    if (loginButton) {
        loginButton.onclick = () => window.location.href = url.toString();
    }

    return url.toString();
}

async function sendUpRegistration() {
    const container = document.getElementById("registration-container");
    const footer = document.getElementById("registration-footer");
    const loggedOutView = document.getElementById("login-form-section");
    const loggedInView = document.getElementById("logged-in-view");
    const upArrow = document.getElementById("reg-up-button");
    const downArrow = document.getElementById("reg-down-button");

    if (!container || !footer || !loggedOutView || !loggedInView) {
        console.warn("❌ Missing UI components for registration panel.");
        return;
    }

    container.classList.add("expanded");

    if (!navigator.onLine) {
        console.warn("[EarthCal] Offline detected. Showing offline mode chooser.");
        showOfflineForm();
        updateFooterAndArrowUI(footer, upArrow, downArrow);
        return;
    }

    hideOfflineForm();

    const { isLoggedIn: loggedIn, payload } = isLoggedIn({ returnPayload: true });

    if (loggedIn) {
        console.log("[EarthCal] Valid token found. Showing logged-in view.");
        loggedOutView.style.display = "none";
        loggedInView.style.display = "block";

        let calendars = null;
        const v1Cache = sessionStorage.getItem("user_calendars_v1");

        if (v1Cache) {
            try {
                const parsed = JSON.parse(v1Cache);
                if (Array.isArray(parsed)) {
                    calendars = parsed;
                    console.log("📅 Using cached v1 calendar data.");
                }
            } catch (e) {
                console.warn("⚠️ Failed to parse cached v1 calendar data:", e);
            }
        }

        if (!calendars && payload?.buwana_id) {
            console.log("📡 Fetching fresh v1 calendar data...");
            try {
                const calRes = await fetch('/api/v1/list_calendars.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ buwana_id: payload.buwana_id })
                });

                if (!calRes.ok) {
                    throw new Error(`HTTP ${calRes.status}`);
                }

                const calJson = await calRes.json();
                if (calJson?.ok && Array.isArray(calJson.calendars)) {
                    calendars = calJson.calendars;
                    sessionStorage.setItem('user_calendars_v1', JSON.stringify(calendars));
                    try {
                        sessionStorage.setItem('user_calendars', JSON.stringify(buildLegacyCalendarCache(calendars)));
                    } catch (err) {
                        console.warn('⚠️ Unable to cache legacy calendar view:', err);
                    }
                    console.log("✅ Fresh v1 calendar data loaded.");
                } else {
                    console.warn("⚠️ Calendar fetch failed:", calJson?.error || calJson?.message || 'unknown_error');
                }
            } catch (e) {
                console.error("❌ Error fetching v1 calendar data:", e);
            }
        }

        if (calendars) {
            try {
                sessionStorage.setItem('user_calendars', JSON.stringify(buildLegacyCalendarCache(calendars)));
            } catch (err) {
                console.debug('Unable to update legacy calendar cache:', err);
            }
            showLoggedInView(calendars);
        } else {
            console.warn("❌ No calendar data available to render logged-in view.");
        }
    } else {
        console.warn("[EarthCal] Not logged in. Showing login form.");
        showLoginForm(loggedOutView, loggedInView);
    }

    updateFooterAndArrowUI(footer, upArrow, downArrow);
}

let currentExpandedCalRowId = null;

async function requestCalendarDetails(calendarId) {
    if (!calendarId) {
        throw new Error('missing_calendar_id');
    }

    let buwanaId = null;
    try {
        const loginState = isLoggedIn({ returnPayload: true }) || {};
        if (loginState.isLoggedIn && loginState.payload?.buwana_id) {
            buwanaId = loginState.payload.buwana_id;
        }
    } catch (err) {
        console.warn('⚠️ Unable to determine login state before fetching calendar info:', err);
    }

    const body = { calendar_id: calendarId };
    if (buwanaId) {
        body.buwana_id = buwanaId;
    }

    const response = await fetch('/api/v1/get_cal_info.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data?.ok || !data.calendar) {
        const error = data?.error || 'unknown_error';
        throw new Error(`calendar_fetch_failed:${error}`);
    }

    return data.calendar;
}

async function loadCalDetailsForRow(row) {
    if (!row) {
        return;
    }

    const detailsContainer = row.querySelector('.cal-row-details');
    if (!detailsContainer) {
        return;
    }

    if (detailsContainer.dataset.loaded === 'true' || detailsContainer.dataset.loading === 'true') {
        return;
    }

    const calendarId = Number.parseInt(detailsContainer.dataset.calendarId, 10);
    if (!Number.isFinite(calendarId) || calendarId <= 0) {
        console.warn('⚠️ Unable to load calendar details — invalid calendar id.');
        return;
    }

    const detailsContent = detailsContainer.querySelector('.cal-details-content');
    if (detailsContent) {
        detailsContent.innerHTML = '<p class="cal-details-placeholder">Loading calendar details...</p>';
    }

    detailsContainer.dataset.loading = 'true';

    try {
        const calendar = await requestCalendarDetails(calendarId);
        const description = calendar?.description
            ? escapeHtml(calendar.description)
            : '<span class="cal-detail-empty">—</span>';
        const eventCount = (typeof calendar?.item_count === 'number' && calendar.item_count >= 0)
            ? calendar.item_count
            : '—';
        const createdAt = formatDateDisplay(calendar?.created_at);
        const updatedAt = formatDateDisplay(calendar?.updated_at);
        const category = calendar?.category
            ? escapeHtml(calendar.category)
            : '<span class="cal-detail-empty">—</span>';
        const visibility = calendar?.visibility
            ? escapeHtml(calendar.visibility)
            : '<span class="cal-detail-empty">—</span>';
        const color = sanitizeCalendarColor(calendar?.color);

        if (detailsContent) {
            detailsContent.innerHTML = `
                <dl class="cal-details-list">
                    <div class="cal-detail-item">
                        <dt>Description</dt>
                        <dd>${description}</dd>
                    </div>
                    <div class="cal-detail-item">
                        <dt>Events</dt>
                        <dd>${eventCount}</dd>
                    </div>
                    <div class="cal-detail-item">
                        <dt>Created</dt>
                        <dd>${createdAt}</dd>
                    </div>
                    <div class="cal-detail-item">
                        <dt>Last updated</dt>
                        <dd>${updatedAt}</dd>
                    </div>
                    <div class="cal-detail-item">
                        <dt>Category</dt>
                        <dd>${category}</dd>
                    </div>
                    <div class="cal-detail-item">
                        <dt>Visibility</dt>
                        <dd>${visibility}</dd>
                    </div>
                    <div class="cal-detail-item">
                        <dt>Color</dt>
                        <dd><span class="cal-color-dot" style="background:${color};"></span> ${escapeHtml(color)}</dd>
                    </div>
                </dl>
            `;
        }

        const emoji = typeof calendar?.emoji === 'string' ? calendar.emoji.trim() : '';
        if (emoji) {
            const emojiSpan = row.querySelector('.cal-row-emoji');
            if (emojiSpan) {
                emojiSpan.setAttribute('data-emoji', emoji);
            }
        }

        detailsContainer.dataset.loaded = 'true';
    } catch (error) {
        console.error('❌ Unable to load calendar details:', error);
        if (detailsContent) {
            detailsContent.innerHTML = '<p class="cal-details-error">Unable to load calendar details. Please try again later.</p>';
        }
    } finally {
        delete detailsContainer.dataset.loading;
    }
}

async function toggleCalDetails(rowId) {
    const row = document.getElementById(rowId);
    if (!row) {
        return;
    }

    if (currentExpandedCalRowId && currentExpandedCalRowId !== rowId) {
        collapseCalDetails(currentExpandedCalRowId);
    }

    const willExpand = !row.classList.contains('is-expanded');
    row.classList.toggle('is-expanded');

    if (willExpand) {
        loadCalDetailsForRow(row).catch((err) => {
            console.error('❌ Error while loading calendar details:', err);
        });
        currentExpandedCalRowId = rowId;
        document.addEventListener('click', handleCalOutsideClick, true);
    } else if (currentExpandedCalRowId === rowId) {
        currentExpandedCalRowId = null;
        document.removeEventListener('click', handleCalOutsideClick, true);
    }
}

function collapseCalDetails(rowId) {
    const row = document.getElementById(rowId);
    if (!row) {
        return;
    }

    row.classList.remove('is-expanded');

    if (currentExpandedCalRowId === rowId) {
        currentExpandedCalRowId = null;
        document.removeEventListener('click', handleCalOutsideClick, true);
    }
}

function handleCalOutsideClick(event) {
    if (!currentExpandedCalRowId) {
        document.removeEventListener('click', handleCalOutsideClick, true);
        return;
    }

    const currentRow = document.getElementById(currentExpandedCalRowId);
    if (!currentRow) {
        currentExpandedCalRowId = null;
        document.removeEventListener('click', handleCalOutsideClick, true);
        return;
    }

    if (currentRow.contains(event.target)) {
        return;
    }

    collapseCalDetails(currentExpandedCalRowId);
}

async function toggleV1CalVisibility(toggleInput) {
    if (!toggleInput) {
        return;
    }

    const previousActive = toggleInput.dataset.active === 'true';
    const desiredActive = !!toggleInput.checked;
    const sourceType = (toggleInput.dataset.sourceType || 'personal').toLowerCase();
    const parentRow = toggleInput.closest('.cal-toggle-row');
    const calendarIdRaw = toggleInput.dataset.calendarId ?? parentRow?.dataset?.calendarId;
    const subscriptionIdRaw = toggleInput.dataset.subscriptionId ?? parentRow?.dataset?.subscriptionId;
    const calendarId = parseNumericId(calendarIdRaw);
    const subscriptionId = parseNumericId(subscriptionIdRaw);

    if (!['personal', 'earthcal', 'webcal'].includes(sourceType)) {
        console.warn('[toggleV1CalVisibility] Unknown source type:', sourceType);
        toggleInput.checked = previousActive;
        return;
    }

    if (sourceType === 'webcal' && !Number.isFinite(subscriptionId)) {
        console.warn('[toggleV1CalVisibility] Missing subscription_id for webcal source.');
        toggleInput.checked = previousActive;
        return;
    }

    if (sourceType !== 'webcal' && !Number.isFinite(calendarId)) {
        console.warn('[toggleV1CalVisibility] Missing calendar_id for source:', sourceType);
        toggleInput.checked = previousActive;
        return;
    }

    if (previousActive === desiredActive) {
        return;
    }

    const loginState = isLoggedIn({ returnPayload: true }) || {};
    if (!loginState.isLoggedIn || !loginState.payload?.buwana_id) {
        toggleInput.checked = previousActive;
        alert('You must be logged in to change calendar visibility.');
        return;
    }

    const buwanaId = Number(loginState.payload.buwana_id);
    const requestBody = {
        buwana_id: buwanaId,
        source_type: sourceType,
        is_active: desiredActive
    };

    if (Number.isFinite(calendarId) && calendarId !== null) {
        requestBody.calendar_id = calendarId;
    }

    if (Number.isFinite(subscriptionId) && subscriptionId !== null) {
        requestBody.subscription_id = subscriptionId;
    }

    toggleInput.disabled = true;

    try {
        const response = await fetch('/api/v1/cal_active_toggle.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`http_${response.status}`);
        }

        const data = await response.json().catch(() => ({}));
        if (!data?.ok) {
            const reason = data?.error || 'toggle_failed';
            throw new Error(reason);
        }

        toggleInput.dataset.active = desiredActive ? 'true' : 'false';
        const toggleLabel = toggleInput.closest('.toggle-switch');
        if (toggleLabel) {
            if (desiredActive) {
                const rawColor = (toggleInput.dataset.calColor || '').trim();
                const resolvedColor = rawColor || '#2ecc71';
                toggleLabel.style.setProperty('--toggle-bg-active', resolvedColor);
            } else {
                toggleLabel.style.removeProperty('--toggle-bg-active');
            }
        }
        console.log('[cal_active_toggle] Updated calendar visibility:', {
            calendar_id: calendarId,
            subscription_id: subscriptionId,
            source_type: sourceType,
            is_active: desiredActive,
            response: data
        });
        showCalendarToggleStatus(desiredActive);
        updateCachedCalendarActiveState({
            calendarId,
            subscriptionId,
            sourceType,
            isActive: desiredActive
        });
    } catch (err) {
        console.error('[toggleV1CalVisibility] Unable to update calendar visibility:', err);
        toggleInput.checked = previousActive;
        alert('We could not update your calendar visibility. Please try again.');
    } finally {
        toggleInput.disabled = false;
    }
}

async function editV1cal(calendarId) {
    const normalizedId = Number.parseInt(calendarId, 10);
    if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
        console.warn('[editV1cal] Invalid calendar id provided.', calendarId);
        return;
    }

    const personalContainer = document.getElementById('user-owned-calendars');
    const hostTarget = personalContainer?.__ecAddCalendarHost
        || personalContainer
        || document.getElementById('logged-in-view')
        || document.getElementById('modal-content')
        || document.body;

    const tryFindCalendar = (list) => {
        if (!Array.isArray(list)) return null;
        return list.find((entry) => {
            const entryId = Number.parseInt(entry?.calendar_id ?? entry?.id, 10);
            return Number.isFinite(entryId) && entryId === normalizedId;
        }) || null;
    };

    let calendar = null;

    if (typeof readCalendarsFromCache === 'function') {
        try {
            const cached = readCalendarsFromCache(Infinity);
            calendar = tryFindCalendar(cached);
        } catch (err) {
            console.debug('[editV1cal] Unable to read cached calendars via helper:', err);
        }
    }

    if (!calendar) {
        try {
            const raw = sessionStorage.getItem('user_calendars_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                calendar = tryFindCalendar(parsed);
            }
        } catch (err) {
            console.debug('[editV1cal] Unable to read calendar cache from sessionStorage:', err);
        }
    }

    if (!calendar && typeof getCurrentUser === 'function' && typeof loadUserCalendars === 'function') {
        try {
            const currentUser = getCurrentUser();
            if (currentUser?.buwana_id) {
                const latest = await loadUserCalendars(currentUser.buwana_id, { force: true });
                calendar = tryFindCalendar(latest);
            }
        } catch (err) {
            console.debug('[editV1cal] Unable to load calendars from API:', err);
        }
    }

    if (!calendar) {
        alert('We could not load that calendar for editing. Please refresh and try again.');
        return;
    }

    if (typeof openEditCalendarOverlay === 'function') {
        openEditCalendarOverlay({ calendar, hostTarget });
    } else {
        console.warn('[editV1cal] openEditCalendarOverlay is not available.');
    }
}

async function deleteV1cal(calendarId, isDefault = false) {
    if (!calendarId) {
        return;
    }

    if (isDefault) {
        alert('Sorry but "My Calendar" is your default Earthcal and cannot be deleted.  If you really need it gone, you must delete your account.');
        return;
    }

    const warningMessage = "Are you sure you want to delete this calendar?  It and all its to-dos, events and journals will also be irrevocably deleted!";
    const confirmed = window.confirm(warningMessage);
    if (!confirmed) {
        return;
    }

    const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });
    if (!ok || !payload?.buwana_id) {
        alert("You must be logged in to delete a calendar.");
        return;
    }

    const buwanaId = payload.buwana_id;

    try {
        setSyncStatus("Deleting calendar...", "🗑️", true);

        const response = await fetch('/api/v1/delete_cal.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ buwana_id: buwanaId, calendar_id: calendarId })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result?.ok) {
            const errorMsg = result?.error || 'unknown_error';
            if (errorMsg === 'default_calendar_protected') {
                alert('Sorry but "My Calendar" is your default Earthcal and cannot be deleted.  If you really need it gone, you must delete your account.');
                setSyncStatus("⚠️ Cannot delete default calendar.");
            } else {
                alert(`Unable to delete calendar: ${errorMsg}`);
                setSyncStatus("⚠️ Failed to delete calendar.");
            }
            return;
        }

        localStorage.removeItem(`calendar_${calendarId}`);

        try {
            const calRes = await fetch('/api/v1/list_calendars.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ buwana_id: buwanaId })
            });

            if (calRes.ok) {
                const calData = await calRes.json();
                if (calData?.ok && Array.isArray(calData.calendars)) {
                    sessionStorage.setItem('user_calendars_v1', JSON.stringify(calData.calendars));
                    try {
                        sessionStorage.setItem('user_calendars', JSON.stringify(buildLegacyCalendarCache(calData.calendars)));
                    } catch (err) {
                        console.warn('⚠️ Unable to refresh legacy calendar cache after delete:', err);
                    }
                    showLoggedInView(calData.calendars);
                }
            }
        } catch (refreshErr) {
            console.warn('⚠️ Calendar list refresh failed after delete:', refreshErr);
        }

        setSyncStatus("✅ Calendar successfully deleted.", '', false, { temporary: true, duration: 4000 });
    } catch (error) {
        console.error('❌ deleteV1cal failed:', error);
        alert('Something went wrong while deleting the calendar. Please try again.');
        setSyncStatus("⚠️ Calendar deletion failed.");
    }
}

async function exportUserCalendar2ICS(calendarId, triggerButton = null) {
    const normalizedId = Number.parseInt(calendarId, 10);
    if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
        console.warn('[exportUserCalendar2ICS] Invalid calendar id', calendarId);
        return;
    }

    const confirmMessage = 'Would you like to download this calendar as an ICS file? It can then be used with other calendar programs.';
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
        return;
    }

    const { isLoggedIn: isUserLoggedIn, payload } = isLoggedIn({ returnPayload: true });
    if (!isUserLoggedIn || !payload?.buwana_id) {
        alert('You must be logged in to export your calendar.');
        return;
    }

    const button = triggerButton instanceof HTMLElement ? triggerButton : null;
    const originalButtonText = button?.textContent;
    if (button) {
        button.disabled = true;
        button.textContent = '…';
    }

    const escapeSelector = (value) => {
        const stringValue = (value || '').toString();
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
            return CSS.escape(stringValue);
        }
        return stringValue.replace(/"/g, '\\"');
    };

    const findRow = () => {
        if (button) {
            const row = button.closest('.cal-toggle-row');
            if (row) return row;
        }
        return document.querySelector(`.cal-toggle-row[data-calendar-id="${escapeSelector(String(normalizedId))}"]`);
    };

    const rowElement = findRow();
    const rawName = rowElement?.dataset?.calendarName || rowElement?.querySelector('.cal-row-name')?.textContent || 'EarthCal Calendar';
    const slugify = (value) => {
        const safe = (value || '').toString().trim().toLowerCase();
        if (!safe) return 'earthcal-calendar';
        return safe
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            || 'earthcal-calendar';
    };

    if (typeof setSyncStatus === 'function') {
        setSyncStatus('Preparing your ICS download…', '💾', true, { temporary: true, duration: 5000 });
    }

    try {
        const response = await fetch('/api/v1/export_user_ics.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                buwana_id: payload.buwana_id,
                calendar_id: normalizedId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const headerName = response.headers.get('X-Calendar-Filename');
        const suggestedName = headerName || `${slugify(rawName)}-${normalizedId}.ics`;

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = suggestedName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);

        if (typeof setSyncStatus === 'function') {
            setSyncStatus('💾 Calendar export ready!', '', false, { temporary: true, duration: 3500 });
        }
    } catch (error) {
        console.error('[exportUserCalendar2ICS] Failed to export calendar', error);
        alert('We could not export your calendar right now. Please try again later.');
        if (typeof setSyncStatus === 'function') {
            setSyncStatus('⚠️ Failed to export calendar.', '', false, { temporary: true, duration: 4000 });
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalButtonText || '💾';
        }
    }
}

if (typeof window !== 'undefined') {
    window.exportUserCalendar2ICS = exportUserCalendar2ICS;
}





async function sendUpLogin() {
    const footer = document.getElementById("registration-footer");
    const loggedOutView = document.getElementById("login-form-section");
    const loggedInView = document.getElementById("logged-in-view");
    const upArrow = document.getElementById("reg-up-button");
    const downArrow = document.getElementById("reg-down-button");

    setRegistrationFooterBackground('login');

    // Always hide logged-in view and show logged-out view
    loggedInView.style.display = "none";
    loggedOutView.style.display = "block";

    createJWTloginURL();  // Always regenerate login link

    // Get translations for current user language
    const translations = await loadTranslations(userLanguage.toLowerCase());
    const loginStrings = translations.login;

    const subStatusDiv = document.getElementById('sub-status-message');

    // Use info from userProfile if available
    if (userProfile?.status === "firsttime") {
        subStatusDiv.innerHTML = loginStrings.statusFirstTime(userProfile.earthling_emoji || "🐸");
    } else if (userProfile) {
        subStatusDiv.innerHTML = loginStrings.statusReturning(userProfile.earthling_emoji || "🐸", userProfile.first_name || "Earthling");
    } else {
        subStatusDiv.innerHTML = loginStrings.statusReturning("🐸", "Earthling");
    }

    updateFooterAndArrowUI(footer, upArrow, downArrow);
}



function parseV1UtcDateParts(dtstartUtc) {
    if (!dtstartUtc) {
        return {
            date: null,
            timeLabel: null,
            components: { year: null, month: null, day: null }
        };
    }

    try {
        const iso = typeof dtstartUtc === 'string' && dtstartUtc.endsWith('Z')
            ? dtstartUtc
            : `${dtstartUtc}Z`;
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
        console.warn('parseV1UtcDateParts failed:', dtstartUtc, err);
        return {
            date: null,
            timeLabel: null,
            components: { year: null, month: null, day: null }
        };
    }
}

function normalizeV1ItemForStorage(item, calendar, buwanaId) {
    if (!item || typeof item !== 'object') return null;

    const normalizedCalendar = calendar && typeof calendar === 'object' ? calendar : {};
    const calendarIdValue = normalizedCalendar.calendar_id ?? item.calendar_id ?? item.cal_id ?? null;
    const calendarIdNumber =
        calendarIdValue !== null && calendarIdValue !== undefined && calendarIdValue !== ''
            ? Number(calendarIdValue)
            : NaN;
    const calendarId = Number.isFinite(calendarIdNumber) ? calendarIdNumber : null;
    const calendarName = normalizedCalendar.name || item.calendar_name || 'My Calendar';
    const calendarColor = normalizedCalendar.color || normalizedCalendar.color_hex || '#3b82f6';
    const providerLower = (normalizedCalendar.provider || '').toString().toLowerCase();
    const calendarUrlLower = (normalizedCalendar.url || '').toString().toLowerCase();
    const isGoogleCalendar = providerLower.includes('google') || calendarUrlLower.includes('google.com');
    const calendarEmoji = normalizedCalendar.emoji || normalizedCalendar.cal_emoji || '📅';
    const { date, timeLabel, components } = parseV1UtcDateParts(item.dtstart_utc);
    const itemColor = item.item_color || (isGoogleCalendar ? '#9ca3af' : calendarColor);
    const dateEmoji = item.item_emoji || calendarEmoji || '⬤';
    const description = item.description || '';
    const pinnedRaw = item.pinned;
    const pinned = pinnedRaw === true || pinnedRaw === 1 || pinnedRaw === '1' ? '1' : '0';
    const percentComplete = typeof item.percent_complete === 'number' ? item.percent_complete : Number(item.percent_complete);
    const isCompleted = (typeof percentComplete === 'number' && percentComplete >= 100)
        || (item.status && String(item.status).toUpperCase() === 'COMPLETED')
        || Boolean(item.completed_at);

    const fallbackYear = new Date().getFullYear().toString();

    return {
        unique_key: calendarId !== null ? `v1_${calendarId}_${item.item_id}` : `v1_unknown_${item.item_id}`,
        ID: String(item.item_id),
        item_id: Number(item.item_id),
        buwana_id: Number.isFinite(Number(buwanaId)) ? Number(buwanaId) : null,
        cal_id: calendarId,
        cal_name: calendarName,
        cal_color: calendarColor,
        cal_emoji: calendarEmoji,
        title: item.summary || 'Untitled Event',
        date: date || item.date || '',
        time: timeLabel || '00:00',
        time_zone: item.tzid || normalizedCalendar.tzid || 'Etc/UTC',
        day: components.day || '1',
        month: components.month || '1',
        year: components.year || fallbackYear,
        comment: description ? '1' : '0',
        comments: description,
        last_edited: item.updated_at || new Date().toISOString(),
        created_at: item.created_at || new Date().toISOString(),
        unique_id: item.uid || null,
        unique_key_v1: item.uid || null,
        datecycle_color: itemColor,
        date_emoji: dateEmoji,
        frequency: 'One-time',
        pinned,
        completed: isCompleted ? '1' : '0',
        public: normalizedCalendar.visibility === 'public' ? '1' : '0',
        delete_it: '0',
        synced: '1',
        conflict: '0',
        component_type: item.component_type,
        all_day: item.all_day ? 1 : 0,
        tzid: item.tzid || normalizedCalendar.tzid || 'Etc/UTC',
        dtstart_utc: item.dtstart_utc || null,
        dtend_utc: item.dtend_utc || null,
        due_utc: item.due_utc || null,
        raw_v1: item
    };
}

function mapV1ItemsToDateCycles(items, calendar, buwanaId) {
    if (!Array.isArray(items)) return [];
    return items
        .map(item => normalizeV1ItemForStorage(item, calendar, buwanaId))
        .filter(Boolean);
}

async function fetchCalendarDatecycles(buwanaId, calendarId, options = {}) {
    const opts = (options && typeof options === 'object') ? options : {};
    const sourceType = typeof opts.source === 'string' ? opts.source : (typeof opts.type === 'string' ? opts.type : 'public');
    const numericBuwanaId = Number.isFinite(Number(buwanaId)) ? Number(buwanaId) : buwanaId;

    let endpoint = '/api/v1/get_pub_cal_items.php';
    let payload = { buwana_id: numericBuwanaId, calendar_id: calendarId };

    if (sourceType === 'user') {
        endpoint = '/api/v1/get_user_items.php';
        payload = { buwana_id: numericBuwanaId };

        if ('include_public' in opts) {
            payload.include_public = !!opts.include_public;
        }
        if ('only_active' in opts) {
            payload.only_active = !!opts.only_active;
        }
        if ('year' in opts && opts.year !== null && opts.year !== undefined && opts.year !== '') {
            payload.year = opts.year;
        }
    }

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || (data && data.success === false) || (data && data.ok === false)) {
        const errorMessage = data?.error || data?.message || 'Failed to fetch datecycles';
        throw new Error(errorMessage);
    }

    if (sourceType === 'user') {
        const calendars = Array.isArray(data?.calendars) ? data.calendars : [];
        const numericCalendarId = Number(calendarId);
        const matchingCalendar = calendars.find((entry) => {
            if (!entry || typeof entry !== 'object') return false;
            const candidateId = entry.calendar_id ?? entry.cal_id;
            if (candidateId === undefined || candidateId === null || candidateId === '') return false;
            if (Number.isFinite(numericCalendarId)) {
                return Number(candidateId) === numericCalendarId;
            }
            return String(candidateId) === String(calendarId);
        });

        const calendar = matchingCalendar ? { ...matchingCalendar } : { calendar_id: calendarId };
        const items = Array.isArray(matchingCalendar?.items) ? matchingCalendar.items : [];

        if ('items' in calendar) {
            delete calendar.items;
        }

        return mapV1ItemsToDateCycles(items, calendar, buwanaId);
    }

    const calendar = data?.calendar || { calendar_id: calendarId };
    const items = Array.isArray(data?.items) ? data.items : [];
    return mapV1ItemsToDateCycles(items, calendar, buwanaId);
}



function setSyncStatus(text, emoji = '', spinning = false, options = {}) {
    const statusDiv = document.getElementById("sync-status");
    if (!statusDiv) return;

    const opts = (typeof options === 'object' && options !== null) ? options : {};
    const temporary = Boolean(opts.temporary);
    const duration = typeof opts.duration === 'number' && opts.duration > 0 ? opts.duration : 4000;

    if (!statusDiv.dataset.defaultHtml) {
        statusDiv.dataset.defaultHtml = statusDiv.innerHTML || '';
    }

    if (statusDiv.__resetTimer) {
        clearTimeout(statusDiv.__resetTimer);
        statusDiv.__resetTimer = null;
    }

    const spinnerMarkup = spinning
        ? `<span class="sync-spinner" style="display:inline-block; margin-right:6px;">${emoji}</span>`
        : `${emoji}`;
    statusDiv.innerHTML = `<p>${spinnerMarkup} ${text}</p>`;

    if (temporary) {
        statusDiv.__resetTimer = window.setTimeout(() => {
            const fallbackHtml = statusDiv.dataset.defaultHtml || '';
            if (fallbackHtml) {
                statusDiv.innerHTML = fallbackHtml;
            } else {
                statusDiv.textContent = '';
            }
            statusDiv.__resetTimer = null;
        }, duration);
    }
}

async function toggleSubscription(calendarId, subscribe, subscriptionId = null) {
    const desiredActive = !!subscribe;
    const numericCalendarId = Number(calendarId);
    const providedSubscriptionId = Number(subscriptionId);
    const summary = {
        calendar_id: Number.isFinite(numericCalendarId) ? numericCalendarId : null,
        subscription_id: Number.isFinite(providedSubscriptionId) ? providedSubscriptionId : null,
        source_type: null,
        desiredActive,
        is_active: null,
        response: null
    };

    const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });
    if (!ok || !payload?.buwana_id) {
        console.warn("❌ toggleSubscription: Not logged in or no buwana_id.");
        return { ...summary, success: false, error: "not_logged_in" };
    }

    if (!calendarId) {
        console.warn("❌ toggleSubscription: Missing calendarId");
        return { ...summary, success: false, error: "no_calendar_id" };
    }

    const buwanaId = payload.buwana_id;
    let latestCalendars = null;
    console.log(`🔄 Updating subscription for calendar ${calendarId}, subscribe: ${subscribe ? '1' : '0'}`);

    try {
        // 🟢 Show sync in-progress UI
        if (subscribe) {
            setSyncStatus("Subscribing to calendar...", "🟢", true);
        } else {
            setSyncStatus("Removing calendar subscription...", "🔴", true);
        }

        const endpoint = '/api/v1/toggle_pub_subscriptions.php';

        const requestBody = {
            buwana_id: buwanaId,
            calendar_id: Number.isFinite(numericCalendarId) ? numericCalendarId : calendarId,
            subscribe: desiredActive
        };

        if (Number.isFinite(summary.subscription_id)) {
            requestBody.subscription_id = summary.subscription_id;
        }

        console.info('📨 public subscription payload', {
            url: endpoint,
            body: requestBody
        });

        // 1. Subscribe/unsubscribe server call
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(requestBody),
        });
        const result = await response.json();
        console.info('📩 public subscription response', {
            status: response.status,
            ok: response.ok,
            result
        });
        summary.response = result;
        if (Number.isFinite(Number(result?.calendar_id))) {
            summary.calendar_id = Number(result.calendar_id);
        }
        if (Number.isFinite(Number(result?.subscription_id))) {
            summary.subscription_id = Number(result.subscription_id);
        }
        if (typeof result?.subscribed === 'boolean') {
            summary.is_active = result.subscribed;
        }
        if (!response.ok || result.success === false || result.ok === false) {
            const errorMessage = result?.error || result?.message || 'update_failed';
            console.error(`❌ Failed to update subscription: ${errorMessage}`);
            alert(`Error: ${errorMessage}`);
            return { ...summary, success: false, error: errorMessage };
        }

        // 2. Add or remove datecycles
        if (subscribe) {
            try {
                const dateCycles = await fetchCalendarDatecycles(buwanaId, calendarId);

                localStorage.setItem(
                    `calendar_${calendarId}`,
                    JSON.stringify({
                        cal_id: calendarId,
                        last_synced: Date.now(),
                        datecycles: dateCycles
                    })
                );
                setSyncStatus("✅ Calendar added.");
            } catch (e) {
                console.error("❌ Could not fetch/store datecycles:", e);
                setSyncStatus("⚠️ Failed to add calendar.");
            }
        } else {
            const key = `calendar_${calendarId}`;
            localStorage.removeItem(key);
            console.log(`🧼 Removed localStorage entry: ${key}`);
            setSyncStatus("👋 Calendar removed.");
            summary.is_active = false;
        }

        // 3. Refresh calendar metadata cache
        try {
            const calRes = await fetch('/api/v1/list_calendars.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ buwana_id: buwanaId })
            });

            if (!calRes.ok) {
                throw new Error(`HTTP ${calRes.status}`);
            }

            const calData = await calRes.json();
            if (calData?.ok && Array.isArray(calData.calendars)) {
                const calendars = normalizeCalendarList(calData.calendars);

                if (subscribe) {
                    const targetCal = calendars.find((entry) => Number(entry?.calendar_id) === Number(calendarId));
                    if (targetCal) {
                        const normalizedSource = (targetCal.source_type || 'earthcal').toString().toLowerCase();
                        summary.source_type = normalizedSource;
                        const activationPayload = {
                            buwana_id: Number(buwanaId) || buwanaId,
                            source_type: normalizedSource,
                            is_active: true
                        };
                        const calendarIdNum = Number(targetCal.calendar_id);
                        const subscriptionIdNum = Number(targetCal.subscription_id);

                        if (Number.isFinite(calendarIdNum)) {
                            summary.calendar_id = calendarIdNum;
                        }
                        if (Number.isFinite(subscriptionIdNum)) {
                            summary.subscription_id = subscriptionIdNum;
                        }

                        if (normalizedSource === 'webcal' && Number.isFinite(subscriptionIdNum)) {
                            activationPayload.subscription_id = subscriptionIdNum;
                        } else if (Number.isFinite(calendarIdNum)) {
                            activationPayload.calendar_id = calendarIdNum;
                        }

                        if (activationPayload.calendar_id !== undefined || activationPayload.subscription_id !== undefined) {
                            try {
                                const activateRes = await fetch('/api/v1/cal_active_toggle.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'same-origin',
                                    body: JSON.stringify(activationPayload)
                                });

                                if (!activateRes.ok) {
                                    throw new Error(`http_${activateRes.status}`);
                                }

                                const activateJson = await activateRes.json().catch(() => ({}));
                                if (!activateJson?.ok) {
                                    throw new Error(activateJson?.error || 'activate_failed');
                                }

                                targetCal.is_active = true;
                            } catch (activateErr) {
                                console.warn('[toggleSubscription] Unable to activate subscription:', activateErr);
                            }
                        }
                    }
                } else if (!summary.source_type) {
                    const fallback = calendars.find((entry) => Number(entry?.calendar_id) === summary.calendar_id);
                    if (fallback && fallback.source_type) {
                        summary.source_type = fallback.source_type.toString().toLowerCase();
                    }
                    if (fallback && Number.isFinite(Number(fallback.subscription_id))) {
                        summary.subscription_id = Number(fallback.subscription_id);
                    }
                }

                sessionStorage.setItem('user_calendars_v1', JSON.stringify(calendars));
                try {
                    sessionStorage.setItem('user_calendars', JSON.stringify(buildLegacyCalendarCache(calendars)));
                } catch (err) {
                    console.warn('⚠️ Unable to refresh legacy calendar cache:', err);
                }

                latestCalendars = calendars;
                console.log('🔁 user_calendars cache refreshed.');
            }
        } catch (e) {
            console.warn('⚠️ Calendar list refresh failed:', e);
        }

        // Optional: UI refresh hooks
        if (typeof calendarRefresh === "function") calendarRefresh();

        if (summary.is_active === null) {
            summary.is_active = desiredActive;
        }

        return { ...summary, success: true, calendars: latestCalendars };
    } catch (err) {
        console.error("❌ Error in toggleSubscription:", err);
        alert("Something went wrong. Please try again.");
        setSyncStatus("⚠️ Sync error occurred.");
        return { ...summary, success: false, error: "network_error" };
    }
}




function getSubscribedCalendarIdsFromCache() {
    const cache = sessionStorage.getItem("user_calendars");
    if (!cache) return [];

    try {
        const data = JSON.parse(cache);
        const personal = (data.personal_calendars || []).map(c => Number(c.calendar_id));
        const subscribed = (data.subscribed_calendars || []).map(c => Number(c.calendar_id));
        // Personal calendars are always “subscribed” for the owner
        return Array.from(new Set([...personal, ...subscribed]));
    } catch (e) {
        console.warn("getSubscribedCalendarIdsFromCache: failed to parse cache", e);
        return [];
    }
}

function purgeUnsubscribedCalendarsFromLocalStorage(subscribedIds) {
    const keep = new Set(subscribedIds.map(Number));
    Object.keys(localStorage)
        .filter(k => /^calendar_\d+$/.test(k))
        .forEach(k => {
            const id = Number(k.split('_')[1]);
            if (!keep.has(id)) {
                localStorage.removeItem(k);
                console.log(`🧼 Purged ${k} (unsubscribed)`);
            }
        });
}


async function sendDownRegistration() {
    const container    = document.getElementById("registration-container");
    const footer       = document.getElementById("registration-footer");
    const loggedOutView= document.getElementById("login-form-section");
    const upArrow      = document.getElementById("reg-up-button");
    const downArrow    = document.getElementById("reg-down-button");

    let cleanupExecuted = false;
    const runCleanup = async () => {
        if (cleanupExecuted) return;
        cleanupExecuted = true;

        if (footer) {
            footer.style.height = "25px";
            footer.style.marginBottom = "";
        }

        if (loggedOutView) {
            loggedOutView.style.display = "none";
        }

        if (upArrow) {
            upArrow.style.display = "block";
        }

        if (downArrow) {
            downArrow.style.display = "none";
        }

        const subscribedIds = getSubscribedCalendarIdsFromCache();
        purgeUnsubscribedCalendarsFromLocalStorage(subscribedIds);

        if (typeof calendarRefresh === 'function') {
            calendarRefresh();
        }

        try {
            await syncDatecycles();
        } catch (e) {
            console.warn("syncDatecycles failed after closing modal:", e);
        }
    };

    if (container) {
        container.classList.remove("expanded");
        container.classList.add('collapsing');

        const handleTransitionEnd = async (event) => {
            if (event.target !== container || event.propertyName !== 'transform') {
                return;
            }
            container.removeEventListener('transitionend', handleTransitionEnd);
            container.classList.remove('collapsing');
            await runCleanup();
        };

        container.addEventListener('transitionend', handleTransitionEnd);

        window.setTimeout(async () => {
            if (!container.classList.contains('collapsing')) {
                return;
            }
            container.removeEventListener('transitionend', handleTransitionEnd);
            container.classList.remove('collapsing');
            await runCleanup();
        }, 450);
    } else {
        await runCleanup();
    }
}






function logoutBuwana() {
    // 🌿 Clear tokens and session state
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_profile');  // <-- ✅ remove the cached user profile

    sessionStorage.clear();

    // 🌿 Clear global JS state
    window.userProfile = null;
    window.userLanguage = null;
    window.userTimeZone = null;

    // 🌿 Clear any service worker caches (optional)
    if ('caches' in window) {
        caches.keys().then(names => {
            for (let name of names) {
                caches.delete(name);
            }
        }).catch(err => console.error("Cache deletion failed:", err));
    }

    // 🌿 Reset views to show login form again
    const loggedOutView = document.getElementById("login-form-section");
    const loggedInView = document.getElementById("logged-in-view");

    if (loggedOutView) loggedOutView.style.display = "block";
    if (loggedInView) {
        loggedInView.style.display = "none";
        loggedInView.innerHTML = "";
    }

    setRegistrationFooterBackground('login');

    // 🌿 Update login status message
    const sessionStatusEl = document.getElementById('user-session-status');
    if (sessionStatusEl) {
        updateSessionStatus("⚪ Not logged in: user logged out");

    }

    // 🌿 (Optional) Re-generate login URL again if needed
    sendDownRegistration();
}








