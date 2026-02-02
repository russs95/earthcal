// Load persisted user preferences or defaults
window.userDarkMode = localStorage.getItem('user_dark_mode')
    || localStorage.getItem('dark-mode-toggle')
    || 'light';

const storedClock = localStorage.getItem('user_clock');
window.userClock = storedClock === null ? false : storedClock === 'true';
if (storedClock === null) localStorage.setItem('user_clock', 'false');

const storedAnimations = localStorage.getItem('user_animations');
window.userAnimations = storedAnimations === null ? true : storedAnimations === 'true';
if (storedAnimations === null) localStorage.setItem('user_animations', 'true');

const storedZodiacPositions = localStorage.getItem('user_zodiac_positions');
window.userZodiacPositions = storedZodiacPositions === null ? false : storedZodiacPositions === 'true';
if (storedZodiacPositions === null) localStorage.setItem('user_zodiac_positions', 'false');

const storedLunarCalendar = localStorage.getItem('user_lunar_calendar');
window.userLunarCalendar = storedLunarCalendar === null ? false : storedLunarCalendar === 'true';
if (storedLunarCalendar === null) localStorage.setItem('user_lunar_calendar', 'false');

const storedCometTracking = localStorage.getItem('user_comet_tracking');
window.userCometTracking = storedCometTracking === null ? false : storedCometTracking === 'true';
if (storedCometTracking === null) localStorage.setItem('user_comet_tracking', 'false');

const storedZodiacShadeSetting = localStorage.getItem('zodiac_shade_setting');
const parsedZodiacShadeSetting = Number(storedZodiacShadeSetting);
window.zodiacShadeSetting = storedZodiacShadeSetting === null || Number.isNaN(parsedZodiacShadeSetting)
    ? 0
    : parsedZodiacShadeSetting;
if (storedZodiacShadeSetting === null) localStorage.setItem('zodiac_shade_setting', '0');

function applyUserDarkMode() {
    if (userDarkMode !== 'dark') return;
    const lightLinks = document.querySelectorAll('link[href*="light.css"]');
    const darkLinks = document.querySelectorAll('link[href*="dark.css"]');
    darkLinks.forEach(link => { link.media = 'all'; link.disabled = false; });
    lightLinks.forEach(link => { link.media = 'not all'; link.disabled = true; });
}

if (document.readyState !== 'loading') {
    applyUserDarkMode();
} else {
    document.addEventListener('DOMContentLoaded', applyUserDarkMode);
}

async function displayUserData(time_zone, language) {
    const translations = await loadTranslations(language.toLowerCase());
    userTimeZone = time_zone;

    const userDetailsString = `| ${getUtcOffset(userTimeZone)} | ${language.toUpperCase()}`;

    // ✅ Modern session check (optional payload use)
    const { isLoggedIn: ok } = isLoggedIn({ returnPayload: true });

    const userTimezoneLangDiv = document.getElementById('user-timezone-lang');
    if (userTimezoneLangDiv) {
        userTimezoneLangDiv.innerHTML = `
            <span id="current-user-time"></span>
            <span id="user-details" style="cursor:pointer"
                onclick="showUserCalSettings()"
                onmouseover="this.style.textDecoration='underline'"
                onmouseout="this.style.textDecoration='none'">
                ${userDetailsString}
            </span>
        `;
    }

    // ⏰ Clock setup
    updateTime();
    if (!window.updateTimeInterval) {
        window.updateTimeInterval = setInterval(updateTime, 1000);
    }
}

function clampZodiacShadeSetting(value) {
    return Math.max(-100, Math.min(100, Number(value) || 0));
}

function getZodiacShadeHex(value) {
    const clamped = clampZodiacShadeSetting(value);
    const baseGrey = 128;
    let greyValue = Math.round(baseGrey - (clamped / 100) * baseGrey);
    greyValue = Math.max(0, Math.min(255, greyValue));
    const hex = greyValue.toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}ff`;
}

function updateZodiacGroundShade(value) {
    const shade = getZodiacShadeHex(value);
    const zodiacLines = document.getElementById('zodiac-lines');
    const zodiacTexts = document.getElementById('zodiac-texts');
    const zodiacSymbols = document.getElementById('zodiac-symbols')
        || document.getElementById('g33')
        || document.getElementById('zodiacs');
    const zodiacContrastRow = document.getElementById('zodiac-contrast-row');

    if (zodiacLines) {
        zodiacLines.style.stroke = shade;
        zodiacLines.querySelectorAll('path, line, polyline, polygon, circle, ellipse').forEach((node) => {
            node.style.stroke = shade;
        });
    }
    if (zodiacTexts) {
        zodiacTexts.style.fill = shade;
        zodiacTexts.querySelectorAll('path, text, tspan').forEach((node) => {
            node.style.fill = shade;
        });
    }
    if (zodiacSymbols) {
        zodiacSymbols.style.fill = shade;
        zodiacSymbols.querySelectorAll('path, circle, ellipse, polygon').forEach((node) => {
            node.style.fill = shade;
        });
    }
    if (zodiacContrastRow) {
        zodiacContrastRow.style.setProperty('--zodiac-contrast-color', shade);
    }
}



function updateTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: userTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    });

    const time = formatter.format(now);
    const el = document.getElementById('current-user-time');
    if (el) el.textContent = time;
}







async function fetchUserData(buwanaId = null) {
    try {
        const response = await fetch('https://buwana.ecobricks.org/earthcal/fetch_basic_user_data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: buwanaId ? `buwana_id=${encodeURIComponent(buwanaId)}` : null,
            credentials: 'include' // Send cookies for session-based login
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user data.");
        }

        const data = await response.json();

        return data.logged_in ? data : null;
    } catch (err) {
        console.error("User data fetch failed:", err);
        return null;
    }
}




async function loadTranslations(langCode) {
    const translationVersion = '1.2';
    try {
        const module = await import(`../translations/${langCode}.js?v=${translationVersion}`);
        return module.translations;
    } catch (e) {
        console.warn(`Could not load translations for '${langCode}'. Falling back to English.`);
        const fallback = await import(`../translations/en.js?v=${translationVersion}`);
        return fallback.translations;
    }
}



function setCurrentDate(time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: time_zone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });

        const dateInTZ = new Date(new Date().toLocaleString("en-US", { timeZone: time_zone }));
        const parts = formatter.formatToParts(dateInTZ);



        const dateParts = {};
        for (let part of parts) {
            if (part.type !== 'literal') {
                dateParts[part.type] = parseInt(part.value);
            }
        }

        const year = dateParts.year;
        const month = dateParts.month - 1;
        const day = dateParts.day;

        startDate = new Date(year, 0, 1);
        targetDate = new Date(year, month, day);

    } catch (e) {
        console.error("Failed to parse date with time_zone:", time_zone, e);

        const currentDate = new Date();
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        targetDate = new Date(dateInTZ.getFullYear(), dateInTZ.getMonth(), dateInTZ.getDate());
    }
}




async function displayDayInfo(date, language = 'en', time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    const translations = await loadTranslations(language.toLowerCase());

    // Adjust the date to the user's time_zone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: time_zone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'long'
    });

    const parts = formatter.formatToParts(date);
    const partsMap = {};
    parts.forEach(part => {
        if (part.type !== 'literal') {
            partsMap[part.type] = part.value;
        }
    });

    const year = parseInt(partsMap.year);
    const monthIndex = parseInt(partsMap.month) - 1;
    const dayOfMonth = parseInt(partsMap.day);
    const weekdayIndex = date.getDay(); // still local index for mapping to translations

    // Translation lookups
    const dayOfWeek = translations.daysOfWeek[weekdayIndex];
    const month = translations.monthsOfYear[monthIndex];
    const suffixes = translations.ordinalSuffixes || ['th', 'th', 'th', 'th'];
    const suffixIndex = (dayOfMonth % 10 === 1 && dayOfMonth !== 11) ? 0
        : (dayOfMonth % 10 === 2 && dayOfMonth !== 12) ? 1
            : (dayOfMonth % 10 === 3 && dayOfMonth !== 13) ? 2
                : 3;
    const suffix = suffixes[suffixIndex];
    const dayOfMonthString = `${dayOfMonth}<sup style="font-size: 0.7em;">${suffix}</sup>`;

    const dateString = `${dayOfWeek}, ${month}\u00A0${dayOfMonthString}`;

    const dayOfYear = getDayOfYear(date);
    const dayOfYearString = `${translations.dayTranslations} ${dayOfYear + 1} ${translations.ofTranslations} ${year}`;

    // Update DOM
    const currentDateInfoDiv = document.getElementById('current-date-info');
    if (currentDateInfoDiv) {
        currentDateInfoDiv.innerHTML = `${dateString}`;
    }

    // Optional: if you want to show the day-of-year string as well
    //SEEMS to be happening anyway!
    // const currentDayInfoDiv = document.getElementById('current-day-info');
    // if (currentDayInfoDiv) {
    //     currentDayInfoDiv.innerHTML = `<p style="margin: -12px 0px -10px 0px;">${dayOfYearString}</p>`;
    // }
}




function getTimeZoneOffsetDisplay(timeZone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short'
    });

    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value.replace('GMT', 'UTC') : '';
}

////${settingsContent.darkMode.remember}

function closeFormModalAlert() {
    const modal = document.getElementById('form-modal-alert');
    if (!modal) return;
    modal.classList.add('modal-hidden');
    modal.classList.remove('modal-visible');
    modal.setAttribute('aria-hidden', 'true');
    const actions = document.getElementById('form-modal-alert-actions');
    if (actions) actions.innerHTML = '';
}

function getSignupUrlFromButton() {
    const signupButton = document.getElementById('auth-signup-button');
    if (!signupButton) return null;
    const onclickValue = signupButton.getAttribute('onclick') || '';
    const match = onclickValue.match(/window\.location\.href=['"]([^'"]+)['"]/);
    return match ? match[1] : null;
}

async function navigateToAuthLogin() {
    const loginButton = document.getElementById('auth-login-button');
    if (typeof createJWTloginURL === 'function') {
        const loginUrl = await createJWTloginURL();
        if (loginUrl) {
            window.location.href = loginUrl;
            return;
        }
    }
    if (loginButton && typeof loginButton.onclick === 'function') {
        loginButton.onclick();
    }
}

function navigateToAuthSignup() {
    const signupButton = document.getElementById('auth-signup-button');
    const signupUrl = getSignupUrlFromButton();
    if (signupUrl) {
        window.location.href = signupUrl;
        return;
    }
    if (signupButton && typeof signupButton.onclick === 'function') {
        signupButton.onclick();
    }
}

function showFormModalAlert({ message, actions = [], previewImageSrc = '', previewImageAlt = '' }) {
    const modal = document.getElementById('form-modal-alert');
    const messageEl = document.getElementById('form-modal-alert-message');
    const actionsEl = document.getElementById('form-modal-alert-actions');
    if (!modal || !messageEl || !actionsEl) return;
    messageEl.innerHTML = '';
    if (previewImageSrc) {
        const previewImage = document.createElement('img');
        previewImage.src = previewImageSrc;
        previewImage.alt = previewImageAlt;
        previewImage.className = 'form-modal-alert-preview';
        messageEl.appendChild(previewImage);
    }
    const messageItems = Array.isArray(message) ? message : [message];
    messageItems.forEach((text) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        messageEl.appendChild(paragraph);
    });
    actionsEl.innerHTML = '';
    const loginTemplate = document.getElementById('auth-login-button');
    const signupTemplate = document.getElementById('auth-signup-button');
    actions.forEach((action) => {
        const isSignup = action.template === 'signup';
        const template = isSignup ? signupTemplate : loginTemplate;
        const button = template ? template.cloneNode(true) : document.createElement('button');
        button.type = 'button';
        button.removeAttribute('id');
        button.removeAttribute('onclick');
        button.addEventListener('click', action.onClick);
        if (!template && action.className) {
            button.className = action.className;
        }
        if (action.iconSrc) {
            button.classList.add('form-modal-alert-button-with-icon');
            button.textContent = '';
            const icon = document.createElement('img');
            icon.src = action.iconSrc;
            icon.alt = '';
            icon.className = 'form-modal-alert-button-icon';
            const label = document.createElement('span');
            label.textContent = action.label;
            button.append(icon, label);
        } else {
            button.textContent = action.label;
        }
        actionsEl.appendChild(button);
    });
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    modal.setAttribute('aria-hidden', 'false');
}

async function showUserCalSettings() {
    const modal = document.getElementById('form-modal-message');

    const lang = userLanguage?.toLowerCase() || 'en';
    const translations = await loadTranslations(lang);

    console.log("Loaded lang:", lang);

    const settingsContent = translations.settings;

    const timezones = translations.timezones;

    const loginState = (typeof isLoggedIn === 'function') ? isLoggedIn({ returnPayload: true }) : { isLoggedIn: false };
    const payload = loginState?.payload || null;
    const resolvedBuwanaId = payload?.buwana_id || null;

    const isAuthenticated = Boolean(loginState?.isLoggedIn && resolvedBuwanaId);
    const profile = window.userProfile || {};
    const firstName = profile.first_name || payload?.given_name || 'Earthling';
    const sanitizedFirstName = (typeof escapeHtml === 'function') ? escapeHtml(firstName) : firstName;
    const earthlingEmoji = profile.earthling_emoji || payload?.["buwana:earthlingEmoji"] || '🌍';
    const userPlanType = (window.user_plan || '').toString().trim().toLowerCase();
    const isJediPlan = isAuthenticated && userPlanType === 'jedi';
    const savedOfflineMode = (typeof getSavedOfflineMode === 'function')
        ? getSavedOfflineMode()
        : 'offline';
    const forcedOfflineEnabled = (typeof isForcedOfflineEnabled === 'function')
        ? isForcedOfflineEnabled()
        : false;

    const editProfileUrl = isAuthenticated && resolvedBuwanaId
        ? `https://buwana.ecobricks.org/${lang}/edit-profile.php?buwana=${encodeURIComponent(resolvedBuwanaId)}&app=${encodeURIComponent(payload?.aud || payload?.client_id || "unknown")}`
        : null;

    const jediStatusText = !isAuthenticated
        ? 'Login to unlock Earthcal features'
        : (isJediPlan ? '✅ Full Jedi powers enabled' : 'Upgrade to unlock Jedi features');
    const hasPremiumAccess = isAuthenticated && isJediPlan;
    const showHoverUnlock = !isAuthenticated && !isJediPlan;
    const jediAccessIconClass = isJediPlan ? 'pure-unlocked-icon' : 'pure-locked-icon';
    const jediAccessHoverClass = showHoverUnlock ? 'pure-lock-hover' : '';
    const clockViewLabel = 'Analogue clock view';
    const lockIconHtml = (isUnlocked) => `
        <div class="settings-lock-icon ${isUnlocked ? 'unlocked-icon' : 'locked-icon'}" aria-hidden="true"></div>
    `;
    const showPremiumAccessAlert = ({ previewImageSrc = '', previewImageAlt = '', description = '' } = {}) => {
        if (hasPremiumAccess) return;
        const promptMessage = !isAuthenticated
            ? 'To access this premium Earthcal features you must be logged in first with a Buwana Jedi acount.'
            : 'To access this premium Earthcal power you must upgrade your Earthcal account to Jedi';
        const alertMessage = description ? [description, promptMessage] : promptMessage;
        if (!isAuthenticated) {
            showFormModalAlert({
                message: alertMessage,
                previewImageSrc,
                previewImageAlt,
                actions: [
                    {
                        label: 'Login',
                        template: 'login',
                        iconSrc: 'svgs/earthcal-icon.svg',
                        onClick: async () => {
                            closeFormModalAlert();
                            await navigateToAuthLogin();
                        }
                    },
                    {
                        label: 'Signup to Earthcal',
                        template: 'signup',
                        onClick: () => {
                            closeFormModalAlert();
                            navigateToAuthSignup();
                        }
                    }
                ]
            });
            return;
        }
        showFormModalAlert({
            message: alertMessage,
            previewImageSrc,
            previewImageAlt,
            actions: [
                {
                    label: 'Upgrade to Jedi',
                    template: 'login',
                    onClick: () => {
                        closeFormModalAlert();
                        if (typeof closeTheModal === 'function') {
                            closeTheModal();
                        }
                        if (typeof manageEarthcalUserSub === 'function') {
                            manageEarthcalUserSub();
                        }
                    }
                }
            ]
        });
    };

    const profileButtonsHtml = editProfileUrl
        ? `
            <div class="settings-profile-actions">
                <button type="button" id="edit-buwana-button" class="sync-style confirmation-blur-button enabled edit-buwana-button" onclick="window.open('${editProfileUrl}', '_blank');">
                    Edit Buwana Profile
                </button>
            </div>
        `
        : '';

    const timezoneOptions = timezones.map(tz => {
        const offset = getTimeZoneOffsetDisplay(tz.value);
    return `<option value="${tz.value}" ${tz.value === userTimeZone ? 'selected' : ''}>
        ${tz.label} (${offset})
    </option>`;
}).join('');


    const languageOptions = Object.entries(settingsContent.languages).map(([key, label]) =>
        `<option value="${key}" ${key.toLowerCase() === userLanguage.toLowerCase() ? 'selected' : ''}>${label}</option>`
    ).join('');

    const mainClock = document.getElementById('main-clock');
    const clockVisible = mainClock && mainClock.style.display === 'block';
    userClock = clockVisible;

    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="settings-modal-header">
            <div class="top-settings-icon"></div>
        </div>
        <form id="user-settings-form">
            <button
                type="button"
                class="toggle-row toggle-row-jedi ${isJediPlan ? 'is-jedi' : ''}"
                aria-label="${jediStatusText}"
                style="padding-top: 20px; padding-bottom: 20px;"
            >
                <span>${jediStatusText}</span>
                <div class="jedi-access-indicator ${jediAccessIconClass} ${jediAccessHoverClass}" aria-hidden="true"></div>
            </button>
            <div class="toggle-row settings-select-row">
                <select id="timezone" name="timezone" class="blur-form-field">
                    ${timezoneOptions}
                </select>
            </div>
            <div class="toggle-row settings-select-row">
                <select id="language" name="language" class="blur-form-field">
                    ${languageOptions}
                </select>
            </div>
            <div class="toggle-row toggle-row-dark-mode">
                <span>${settingsContent.darkMode.legend}</span>
                <label class="toggle-switch toggle-switch-advanced">
                    <input type="checkbox" id="dark-mode-toggle-5" ${userDarkMode === 'dark' ? 'checked' : ''} aria-label="Toggle dark mode">
                    <span class="toggle-slider dark-mode-toggle-slider"></span>
                </label>
            </div>
            <div class="toggle-row">
                <span>Solar system animations</span>
                <label class="toggle-switch toggle-switch-advanced">
                    <input type="checkbox" id="solar-animations-toggle" ${userAnimations ? 'checked' : ''} onchange="toggleSolarAnimations(this.checked)" aria-label="Toggle solar system animations">
                    <span class="toggle-slider orbit-toggle-slider"></span>
                </label>
            </div>
            <div class="toggle-row">
                <div class="toggle-row-label">
                    ${lockIconHtml(isAuthenticated)}
                    <span>${clockViewLabel}</span>
                </div>
                <label class="toggle-switch toggle-switch-advanced">
                    <input type="checkbox" id="clock-toggle" ${userClock ? 'checked' : ''} onchange="toggleClockView(this.checked)" aria-label="Analogue clock view">
                    <span class="toggle-slider clock-toggle-slider"></span>
                </label>
            </div>
            <div class="toggle-row toggle-row-offline" id="forced-offline-row">
                <div class="toggle-row-main">
                    <div class="toggle-row-label">
                        ${lockIconHtml(false)}
                        <span>Offline mode when not connected</span>
                    </div>
                    <label class="toggle-switch toggle-switch-advanced">
                        <input type="checkbox" id="forced-offline-toggle" ${forcedOfflineEnabled ? 'checked' : ''} aria-label="Force offline mode">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="toggle-sub-row" id="offline-mode-sub-row" aria-hidden="true">
                    <div class="toggle-row-label offline-mode-label">
                        <span class="offline-mode-emoji" aria-hidden="true">🔌</span>
                        <span>Offline shows cached data</span>
                    </div>
                    <label class="toggle-switch toggle-switch-advanced">
                        <input type="checkbox" id="offline-mode-toggle" ${savedOfflineMode !== 'simple' ? 'checked' : ''} aria-label="Offline mode preference">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            <div class="toggle-row toggle-row-zodiac" id="zodiac-toggle-row">
                <div class="toggle-row-main">
                    <div class="zodiac-toggle-label">
                        ${lockIconHtml(hasPremiumAccess)}
                        <span>View zodiac positions</span>
                    </div>
                    <label class="toggle-switch toggle-switch-advanced">
                        <input type="checkbox" id="zodiac-toggle" ${userZodiacPositions ? 'checked' : ''} aria-label="View zodiac positions">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="zodiac-contrast-row" id="zodiac-contrast-row" aria-hidden="true">
                    <span class="zodiac-contrast-dot" aria-hidden="true"></span>
                    <input type="range" id="zodiac-contrast-slider" min="-100" max="100" value="${zodiacShadeSetting}" step="1" aria-label="Zodiac ground shade">
                </div>
            </div>
            <div class="toggle-row">
                <div class="toggle-row-label">
                    ${lockIconHtml(hasPremiumAccess)}
                    <span>View lunar calendar</span>
                </div>
                <label class="toggle-switch toggle-switch-advanced">
                    <input type="checkbox" id="lunar-calendar-toggle" ${userLunarCalendar ? 'checked' : ''} aria-label="View lunar calendar">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="toggle-row">
                <div class="toggle-row-label">
                    ${lockIconHtml(hasPremiumAccess)}
                    <span>Enable comet tracking</span>
                </div>
                <label class="toggle-switch toggle-switch-advanced">
                    <input type="checkbox" id="comet-tracking-toggle" ${userCometTracking ? 'checked' : ''} aria-label="Enable comet tracking">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="toggle-row">
                <span title="This will clear your browser cache of all Earthcal data. You will need to login again to retreive it.">Clear Earthcal's cache</span>
                <button type="button" id="clear-user-data-button" class="clear-cache-button" aria-label="Clear cached user data">
                    CLEAR
                </button>
            </div>
            <button type="button" name="apply" onclick="animateApplySettingsButton()" class="stellar-submit stellar-submit--apply" style="display:none;">
                ${settingsContent.applySettings}
            </button>
            ${profileButtonsHtml}
        </form>
    `;

    const darkModeToggleEl = modalContent.querySelector('#dark-mode-toggle-5');
    if (darkModeToggleEl) {
        darkModeToggleEl.checked = userDarkMode === 'dark';
        darkModeToggleEl.addEventListener('change', (event) => {
            userDarkMode = event.target.checked ? 'dark' : 'light';
            localStorage.setItem('user_dark_mode', userDarkMode);
            applyUserDarkMode();
        });
    }

    const contentBox = modal.querySelector('.modal-content-box');
    if (contentBox) {
        contentBox.id = 'modal-content-box';
        contentBox.classList.add('dim-blur');
        contentBox.style.backgroundColor = 'transparent';
    }

    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    document.body.style.overflowY = 'hidden';

    modal.setAttribute('tabindex', '0');
    modal.focus();
    modalOpen = true;

    document.addEventListener('focus', focusRestrict, true);

    const timezoneSelect = modalContent.querySelector('#timezone');
    const languageSelect = modalContent.querySelector('#language');
    const applyButton = modalContent.querySelector('.stellar-submit');
    const jediPlanRow = modalContent.querySelector('.toggle-row-jedi');
    const offlineModeToggle = modalContent.querySelector('#offline-mode-toggle');
    const offlineModeSubRow = modalContent.querySelector('#offline-mode-sub-row');
    const zodiacToggle = modalContent.querySelector('#zodiac-toggle');
    const zodiacToggleRow = modalContent.querySelector('#zodiac-toggle-row');
    const zodiacContrastRow = modalContent.querySelector('#zodiac-contrast-row');
    const zodiacContrastSlider = modalContent.querySelector('#zodiac-contrast-slider');
    const lunarCalendarToggle = modalContent.querySelector('#lunar-calendar-toggle');
    const cometTrackingToggle = modalContent.querySelector('#comet-tracking-toggle');

    const initialTimezone = timezoneSelect?.value || '';
    const initialLanguage = (languageSelect?.value || '').toLowerCase();
    const initialZodiacShadeSetting = zodiacContrastSlider
        ? Number(zodiacContrastSlider.value)
        : Number(zodiacShadeSetting);

    const checkSettingsChange = () => {
        const tzChanged = timezoneSelect?.value !== initialTimezone;
        const langChanged = (languageSelect?.value || '').toLowerCase() !== initialLanguage;
        const zodiacChanged = zodiacContrastSlider
            ? Number(zodiacContrastSlider.value) !== initialZodiacShadeSetting
            : false;
        if (tzChanged || langChanged || zodiacChanged) {
            applyButton.style.display = 'block';
        } else {
            applyButton.style.display = 'none';
        }
    };

    timezoneSelect?.addEventListener('change', checkSettingsChange);
    languageSelect?.addEventListener('change', checkSettingsChange);
    checkSettingsChange();

    if (jediPlanRow) {
        jediPlanRow.addEventListener('click', () => {
            if (!isAuthenticated) {
                if (typeof closeTheModal === 'function') {
                    closeTheModal();
                }
                if (typeof sendUpRegistration === 'function') {
                    sendUpRegistration();
                }
                return;
            }

            if (typeof closeTheModal === 'function') {
                closeTheModal();
            }
            if (typeof manageEarthcalUserSub === 'function') {
                manageEarthcalUserSub();
            }
        });
    }

    if (offlineModeToggle) {
        updateOfflineToggleUI(savedOfflineMode);
        offlineModeToggle.addEventListener('change', handleOfflineToggleChange);
    }

    const forcedOfflineToggle = modalContent.querySelector('#forced-offline-toggle');
    const updateOfflineSubRowVisibility = (isForcedOffline) => {
        if (!offlineModeSubRow) return;
        const isHidden = isForcedOffline !== true;
        offlineModeSubRow.style.display = isHidden ? 'none' : 'flex';
        offlineModeSubRow.setAttribute('aria-hidden', String(isHidden));
    };

    if (forcedOfflineToggle) {
        updateOfflineSubRowVisibility(forcedOfflineToggle.checked);
        if (typeof toggleForcedOfflineMode === 'function') {
            forcedOfflineToggle.addEventListener('change', (event) => {
                toggleForcedOfflineMode(event);
                updateOfflineSubRowVisibility(Boolean(event?.target?.checked));
            });
        } else {
            forcedOfflineToggle.addEventListener('change', (event) => {
                updateOfflineSubRowVisibility(Boolean(event?.target?.checked));
            });
        }
    }

    const clearUserDataButton = modalContent.querySelector('#clear-user-data-button');
    if (clearUserDataButton) {
        clearUserDataButton.addEventListener('click', clearAllUserData);
    }

    const setZodiacExpanded = (isExpanded) => {
        if (!zodiacToggleRow || !zodiacContrastRow) return;
        zodiacToggleRow.classList.toggle('expanded', isExpanded);
        zodiacContrastRow.style.display = isExpanded ? 'flex' : 'none';
        zodiacContrastRow.setAttribute('aria-hidden', String(!isExpanded));
    };

    const updateZodiacToggleUI = (isChecked) => {
        if (!isChecked) {
            setZodiacExpanded(false);
            return;
        }
        setZodiacExpanded(true);
        updateZodiacGroundShade(zodiacShadeSetting);
    };

    if (zodiacToggle) {
        updateZodiacToggleUI(zodiacToggle.checked);
                zodiacToggle.addEventListener('change', (event) => {
                    if (!hasPremiumAccess) {
                        event.target.checked = userZodiacPositions;
                        showPremiumAccessAlert({
                            previewImageSrc: 'assets/images/preview-comet.webp',
                            previewImageAlt: 'Zodiac overlay preview',
                            description: 'View an overlay of the twelve houses so that you can gauge where and when the planets will be in particular zodiac zone.'
                        });
                        return;
                    }
                    const isChecked = event.target.checked;
                    toggleZodiacPositions(isChecked);
            updateZodiacToggleUI(isChecked);
        });
    }

    if (lunarCalendarToggle) {
        lunarCalendarToggle.addEventListener('change', (event) => {
            if (!hasPremiumAccess) {
                event.target.checked = userLunarCalendar;
                showPremiumAccessAlert({
                    previewImageSrc: 'assets/images/preview-lunarmonths.webp',
                    previewImageAlt: 'Lunar months preview',
                    description: 'View the lunar months overlaid upon the solar year to help make sense of the Korean, Chinese, Islamic or other lunar calendars'
                });
                return;
            }
            toggleLunarCalendar(event.target.checked);
        });
    }

    if (cometTrackingToggle) {
        cometTrackingToggle.addEventListener('change', (event) => {
            if (!hasPremiumAccess) {
                event.target.checked = userCometTracking;
                showPremiumAccessAlert({
                    previewImageSrc: 'assets/images/preview-comet.webp',
                    previewImageAlt: 'Comet tracking preview',
                    description: 'Track the progress of interstellar comet 3I-ATLAS as it zooms though our solar system in 2025 and 2026.'
                });
                return;
            }
            toggleCometTracking(event.target.checked);
        });
    }

    if (zodiacContrastSlider) {
        zodiacContrastSlider.value = String(clampZodiacShadeSetting(zodiacShadeSetting));
        zodiacContrastSlider.addEventListener('input', (event) => {
            const newValue = clampZodiacShadeSetting(event.target.value);
            event.target.value = String(newValue);
            updateZodiacGroundShade(newValue);
            checkSettingsChange();
        });
    }
}

function getUtcOffset(tz) {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short'
    }).formatToParts(now);

    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value.replace('GMT', 'UTC') : tz;
}



async function animateApplySettingsButton() {
    const applyButton = document.querySelector('#user-settings-form button[name="apply"]');
    if (!applyButton) return;
    const restoreApplyButton = typeof globalSaveSpinner === 'function'
        ? globalSaveSpinner(applyButton)
        : null;
    const applyStartTime = typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
    const zodiacSlider = document.getElementById('zodiac-contrast-slider');
    if (zodiacSlider) {
        const newValue = clampZodiacShadeSetting(zodiacSlider.value);
        zodiacShadeSetting = newValue;
        localStorage.setItem('zodiac_shade_setting', String(newValue));
        updateZodiacGroundShade(newValue);
    }
    await applySettings(applyStartTime);
    restoreApplyButton?.();
}

async function applySettings(applyStartTime) {
    const timezoneSelect = document.getElementById('timezone');
    const languageSelect = document.getElementById('language');

    userTimeZone = timezoneSelect?.value || userTimeZone;
    userLanguage = languageSelect?.value.toLowerCase() || userLanguage;

    localStorage.setItem("user_timezone", userTimeZone);
    localStorage.setItem("user_language", userLanguage);

    // Refresh display based on updated settings
    displayUserData(userTimeZone, userLanguage);
    await setCurrentDate(userTimeZone, userLanguage);
    await displayDayInfo(targetDate, userLanguage, userTimeZone);

    const mainClock = document.getElementById('main-clock');
    if (mainClock?.style.display === 'block') {
        mainClock.style.display = 'none';
    }

    const startTime = typeof applyStartTime === 'number' ? applyStartTime : null;
    if (startTime !== null) {
        const elapsed = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() - startTime
            : Date.now() - startTime;
        const remainingDelay = Math.max(0, 500 - elapsed);
        if (remainingDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    closeTheModal();
}







let clockInterval;

function openClock(time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    const mainClock = document.getElementById('main-clock');
    const secondHand = document.getElementById('main-second-hand');
    const minuteHand = document.getElementById('main-minute-hand');
    const hourHand = document.getElementById('main-hour-hand');
    const solarSystemCenter = document.getElementById('solar-system-center');

    clearInterval(clockInterval);

    if (mainClock.style.display === 'none' || mainClock.style.display === '') {
        mainClock.style.display = 'block';

        if (solarSystemCenter) {
            solarSystemCenter.style.opacity = "0.5";
            solarSystemCenter.style.filter = "brightness(50%)";
        }

        function setClockHands() {
            const now = new Date(new Date().toLocaleString('en-US', { timeZone: time_zone }));
            const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
            const minutes = now.getMinutes() + seconds / 60;
            const hours = now.getHours() + minutes / 60;

            const secondDeg = (seconds / 60) * 360;
            const minuteDeg = (minutes / 60) * 360;
            const hourDeg = (hours / 12) * 360;

            secondHand.setAttribute('transform', `rotate(${secondDeg} 181.07 165.44)`);
            minuteHand.setAttribute('transform', `rotate(${minuteDeg} 181.07 165.44)`);
            hourHand.setAttribute('transform', `rotate(${hourDeg} 181.07 165.44)`);
        }

        function animateClockHands() {
            setClockHands();
            clockInterval = setInterval(setClockHands, 100);
        }

        animateClockHands();
    } else {
        mainClock.style.display = 'none';
        clearInterval(clockInterval);

        if (solarSystemCenter) {
            solarSystemCenter.style.opacity = "";
            solarSystemCenter.style.filter = "";
        }
    }
}

function toggleClockView(isChecked) {
    const mainClock = document.getElementById('main-clock');
    const isVisible = mainClock && mainClock.style.display === 'block';
    if (isChecked && !isVisible) {
        openClock(userTimeZone);
    } else if (!isChecked && isVisible) {
        openClock(userTimeZone);
    }
    userClock = isChecked;
    localStorage.setItem('user_clock', isChecked);
}

function setZodiacVisibility(isVisible) {
    const zodiacGroup = document.getElementById('zodiacs');
    if (!zodiacGroup) return;
    zodiacGroup.style.display = isVisible ? 'inline' : 'none';
}

function toggleZodiacPositions(isChecked) {
    userZodiacPositions = isChecked;
    localStorage.setItem('user_zodiac_positions', isChecked);
    setZodiacVisibility(isChecked);
    if (isChecked) {
        updateZodiacGroundShade(zodiacShadeSetting);
    }
}

function setLunarCalendarVisibility(isVisible) {
    const lunarMonthPaths = document.querySelectorAll('path[id*="lunarmonth-12"]');
    lunarMonthPaths.forEach(path => {
        path.style.opacity = isVisible ? '1' : '';
    });
}

function toggleLunarCalendar(isChecked) {
    userLunarCalendar = isChecked;
    localStorage.setItem('user_lunar_calendar', isChecked);
    setLunarCalendarVisibility(isChecked);
}

function setCometTrackingVisibility(isVisible) {
    const cometSystem = document.getElementById('comet_system-9');
    if (!cometSystem) return;
    cometSystem.style.display = isVisible ? 'inline' : 'none';
}

function toggleCometTracking(isChecked) {
    userCometTracking = isChecked;
    localStorage.setItem('user_comet_tracking', isChecked);
    setCometTrackingVisibility(isChecked);
}

function toggleSolarAnimations(isChecked) {
    userAnimations = isChecked;
    localStorage.setItem('user_animations', isChecked);
    if (isChecked) {
        if (typeof animatePlanetsIfReady === 'function') {
            animatePlanetsIfReady();
        }
    } else {
        const planets = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
        planets.forEach(id => {
            const el = document.getElementById(id);
            el?.getAnimations().forEach(anim => anim.cancel());
        });
    }
}

const layerRevealDelayMs = 4000;
const applyInitialLayerVisibility = () => {
    if (userZodiacPositions) {
        setTimeout(() => {
            setZodiacVisibility(true);
            updateZodiacGroundShade(zodiacShadeSetting);
        }, layerRevealDelayMs);
    } else {
        setZodiacVisibility(false);
    }

    if (userLunarCalendar) {
        setTimeout(() => {
            setLunarCalendarVisibility(true);
        }, layerRevealDelayMs);
    } else {
        setLunarCalendarVisibility(false);
    }

    if (userCometTracking) {
        setTimeout(() => {
            setCometTrackingVisibility(true);
        }, layerRevealDelayMs);
    } else {
        setCometTrackingVisibility(false);
    }
};

if (document.readyState !== 'loading') {
    applyInitialLayerVisibility();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        applyInitialLayerVisibility();
    });
}

function checkScreenSize() {
    const time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const mainClock = document.getElementById('main-clock');

    if (window.innerWidth <= 350) {
        if (mainClock && mainClock.style.display === 'block') {
            openClock(time_zone);
        }
    }
}



// ✅ Run on Window Resize
window.addEventListener("resize", () => checkScreenSize());

// ✅ Run on Page Load (so clock shows immediately if needed)
//window.addEventListener("load", checkScreenSize);
