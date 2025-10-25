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
                onclick="openAddItem()"
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
    const translationVersion = '1.1';
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

async function showUserCalSettings() {
    const modal = document.getElementById('form-modal-message');

    const lang = userLanguage?.toLowerCase() || 'en';
    const translations = await loadTranslations(lang);

    console.log("Loaded lang:", lang);
    console.log("Loaded timezones:", translations.timezones);

    const settingsContent = translations.settings;

    const timezones = translations.timezones;

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
        <div class="top-settings-icon"></div>
        <form id="user-settings-form">
            <div>
                <select id="timezone" name="timezone" class="blur-form-field">
                    ${timezoneOptions}
                </select>
            </div>
            <div>
                <select id="language" name="language" class="blur-form-field">
                    ${languageOptions}
                </select>
            </div>
            <div class="toggle-row">
                <span>${settingsContent.darkMode.legend}</span>
                <dark-mode-toggle
                    id="dark-mode-toggle-5"
                    class="slider"
                    legend=""
                    remember=""
                    appearance="toggle"
                    permanent>
                </dark-mode-toggle>
            </div>
            <div class="toggle-row">
                <span>Toggle clock view:</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="clock-toggle" ${userClock ? 'checked' : ''} onchange="toggleClockView(this.checked)" aria-label="Toggle clock view">
                    <span class="toggle-slider clock-toggle-slider"></span>
                </label>
            </div>
            <div class="toggle-row">
                <span>Solar system animations:</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="solar-animations-toggle" ${userAnimations ? 'checked' : ''} onchange="toggleSolarAnimations(this.checked)" aria-label="Toggle solar system animations">
                    <span class="toggle-slider orbit-toggle-slider"></span>
                </label>
            </div>
            <button type="button" name="apply" onclick="animateApplySettingsButton()" class="stellar-submit" style="display:none;">
                ${settingsContent.applySettings}
            </button>
        </form>
    `;

    const darkModeToggleEl = modalContent.querySelector('#dark-mode-toggle-5');
    if (darkModeToggleEl) {
        darkModeToggleEl.mode = userDarkMode === 'dark' ? 'dark' : 'light';
        darkModeToggleEl.addEventListener('colorschemechange', (e) => {
            userDarkMode = e.detail.colorScheme;
            localStorage.setItem('user_dark_mode', userDarkMode);
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

    const initialTimezone = timezoneSelect?.value || '';
    const initialLanguage = (languageSelect?.value || '').toLowerCase();

    const checkSettingsChange = () => {
        const tzChanged = timezoneSelect?.value !== initialTimezone;
        const langChanged = (languageSelect?.value || '').toLowerCase() !== initialLanguage;
        if (tzChanged || langChanged) {
            applyButton.style.display = 'block';
        } else {
            applyButton.style.display = 'none';
        }
    };

    timezoneSelect?.addEventListener('change', checkSettingsChange);
    languageSelect?.addEventListener('change', checkSettingsChange);
    checkSettingsChange();
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
    const lang = (userLanguage || 'en').toLowerCase();
    const translations = await loadTranslations(lang);
    const savingText = translations.settings?.saving || 'Saving...';
    applyButton.classList.add('loading');
    applyButton.innerText = savingText;
    await applySettings();
    applyButton.classList.remove('loading');
}

async function applySettings() {
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
