// Declare globally near the top of your app
let userLanguage = null;
let userTimeZone = null;
let userProfile = null;

async function getUserData() {
    const urlParams = new URLSearchParams(window.location.search);
    const buwanaIdParam = urlParams.get('id');
    const langParam = urlParams.get('lang');
    const tzParam = urlParams.get('timezone');
    const statusParam = urlParams.get('status');

    const cacheToken = localStorage.getItem('basic_user_data');
    let parsedCache = null;

    if (cacheToken) {
        try {
            parsedCache = JSON.parse(cacheToken);
        } catch (e) {
            console.warn("Corrupt cache detected, will fetch fresh data.");
        }
    }

    // Scenario 2: URL parameters present
    if (buwanaIdParam && langParam && tzParam) {
        const userData = await fetchUserData(buwanaIdParam);
        if (userData) {
            userLanguage = langParam;
            userTimeZone = tzParam;

            userProfile = {
                first_name: userData.first_name,
                earthling_emoji: userData.earthling_emoji,
                email: userData.email,
                status: statusParam || "returning"
            };

            displayUserData(userTimeZone, userLanguage);
            await setCurrentDate(userTimeZone, userLanguage);

            sendUpRegistration();
        }
        return;
    }

    // Scenario 3: Cache exists and is valid
    if (parsedCache && parsedCache.time_zone && parsedCache.language) {
        userLanguage = parsedCache.language;
        userTimeZone = parsedCache.time_zone;

        userProfile = {
            first_name: parsedCache.first_name,
            earthling_emoji: parsedCache.earthling_emoji,
            email: parsedCache.email,
            status: "returning"
        };

        displayUserData(userTimeZone, userLanguage);
        await setCurrentDate(userTimeZone, userLanguage);

        sendUpRegistration();
        return;
    }

    // Scenario 4: Logged-in user with session
    const sessionData = await fetchUserData(); // No param: session will be used
    if (sessionData && sessionData.logged_in) {
        localStorage.setItem("basic_user_data", JSON.stringify(sessionData));

        userLanguage = sessionData.language_id;
        userTimeZone = sessionData.time_zone;

        userProfile = {
            first_name: sessionData.first_name,
            earthling_emoji: sessionData.earthling_emoji,
            email: sessionData.email,
            status: "returning"
        };

        displayUserData(userTimeZone, userLanguage);
        await setCurrentDate(userTimeZone, userLanguage);
        return;
    }

    // Scenario 5/6: Attempt fallback using buwana_id from cache or params
    const fallbackId = parsedCache?.buwana_id || buwanaIdParam;
    if (fallbackId) {
        const fallbackData = await fetchUserData(fallbackId);
        if (fallbackData) {
            userLanguage = fallbackData.language_id;
            userTimeZone = fallbackData.time_zone;

            userProfile = {
                first_name: fallbackData.first_name,
                earthling_emoji: fallbackData.earthling_emoji,
                email: fallbackData.email,
                status: "returning"
            };

            displayUserData(userTimeZone, userLanguage);
            await setCurrentDate(userTimeZone, userLanguage);

            localStorage.setItem("basic_user_data", JSON.stringify(fallbackData));
            return;
        }
    }

    // Scenario 1: Completely new visitor
    userLanguage = navigator.language.slice(0, 2);
    userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    userProfile = {
        first_name: "Earthling",
        earthling_emoji: "🌍",
        email: null,
        status: "new"
    };

    displayUserData(userTimeZone, userLanguage);
    await setCurrentDate(userTimeZone, userLanguage);
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


async function displayUserData(time_zone, language) {
    const translations = await loadTranslations(language.toLowerCase());

    function updateTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: time_zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    });

    const time = formatter.format(now);
    const el = document.getElementById('current-user-time');
    if (el) el.textContent = time;
}

    const userDetailsString = `| ${time_zone} | ${language.toUpperCase()}`;
    const isUserLoggedIn = checkUserSession();

    const loginIndicator = isUserLoggedIn
        ? '🟢'
        : '⚪';

    const userTimezoneLangDiv = document.getElementById('user-timezone-lang');
    userTimezoneLangDiv.innerHTML = `
        <span id="current-user-time"></span>
        <span id="user-details" style="cursor:pointer"
              onclick="showUserCalSettings()"
              onmouseover="this.style.textDecoration='underline'"
              onmouseout="this.style.textDecoration='none'">
              ${userDetailsString} ⚙️
        </span>
        <span id="user-session-status" 
              title="Login status" 
              style="cursor:pointer;font-size:0.9em;" 
              onclick="sendUpRegistration()">
              ${loginIndicator}
        </span>
    `;

    updateTime();
    setInterval(updateTime, 1000);
}



async function loadTranslations(langCode) {
    try {
        const module = await import(`../translations/${langCode}.js?v=3`);
        return module.translations;
    } catch (e) {
        console.warn(`Could not load translations for '${langCode}'. Falling back to English.`);
        const fallback = await import(`../translations/en.js`);
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

        const parts = formatter.formatToParts(new Date());
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
        targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
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



async function showUserCalSettings() {
    const modal = document.getElementById('form-modal-message');

    const lang = userLanguage?.toLowerCase() || 'en';
    const translations = await loadTranslations(lang);
    const settingsContent = translations.settings;

    const timezones = translations.timezones;


    const timezoneOptions = translations.timezones.map(tz => {
    const offset = getTimeZoneOffsetDisplay(tz.value);
    return `<option value="${tz.value}" ${tz.value === userTimeZone ? 'selected' : ''}>
        ${tz.label} (${offset})
    </option>`;
}).join('');


    const languageOptions = Object.entries(settingsContent.languages).map(([key, label]) =>
        `<option value="${key}" ${key.toLowerCase() === userLanguage.toLowerCase() ? 'selected' : ''}>${label}</option>`
    ).join('');

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
            <div class="compro-toggle" style="margin: 15px auto 10px auto; width: fit-content;">
                <div style="text-align:center;">
                    <dark-mode-toggle
                        id="dark-mode-toggle-5" style="padding:10px;"
                        class="slider"
                        legend="${settingsContent.darkMode.legend}"
                        remember="${settingsContent.darkMode.remember}"
                        appearance="toggle">
                    </dark-mode-toggle>
                </div>
            </div>
            <button type="button" name="apply" onclick="applySettings()" class="confirmation-blur-button">
                ${settingsContent.applySettings}
            </button>
        </form>
    `;

    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    document.getElementById("page-content").classList.add("blur");

    modal.setAttribute('tabindex', '0');
    modal.focus();
    modalOpen = true;

    document.addEventListener('focus', focusRestrict, true);
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

    openClock(userTimeZone);
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



let clockVisible = false;

function checkScreenSize(time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    const mainClock = document.getElementById('main-clock');

    if (window.innerWidth <= 350) {
        if (!clockVisible) {
            clockVisible = true;
            if (time_zone) {
                openClock(time_zone);
            } else {
                console.warn("No time_zone passed. Falling back to UTC.");
                openClock("UTC");
            }
        }
    } else {
        if (clockVisible) {
            clockVisible = false;
            if (mainClock) mainClock.style.display = 'none';
        }
    }
}



// ✅ Run on Window Resize
window.addEventListener("resize", checkScreenSize);

// ✅ Run on Page Load (so clock shows immediately if needed)
//window.addEventListener("load", checkScreenSize);