
/* EARTHCYCLES CALENDAR PRIMARY JAVASCRIPTS */

function resolveEarthcalApiBase() {
  const origin = (typeof window !== "undefined" && window.location?.origin)
    ? window.location.origin
    : "";
  const normalizedOrigin = origin.replace(/\/$/, "");

  const host = (() => {
    try {
      return origin ? new URL(origin).hostname : "";
    } catch (_) {
      return "";
    }
  })();

  const isLocalHost = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(normalizedOrigin);
  const isEarthcalHost = /(?:^|\.)earthcal\.app$/.test(host);

  // If running locally (Electron/Snap or localhost), always call the hosted API.
  if (isLocalHost) {
    return "https://earthcal.app/api/v1";
  }

  // If the current host is an Earthcal domain (earthcal.app, beta.earthcal.app, etc.),
  // keep requests on the same origin. Otherwise, default to the primary API host to
  // avoid 404s on external mirrors.
  return isEarthcalHost
    ? `${normalizedOrigin}/api/v1`
    : "https://earthcal.app/api/v1";
}

function getApiBase() {
  // Allow an override if needed in future
  return (typeof window !== "undefined" && typeof window.EARTHCAL_API_BASE !== "undefined")
    ? window.EARTHCAL_API_BASE
    : resolveEarthcalApiBase();
}

function globalSaveSpinner(button) {
  if (!button || button.dataset.loading === "true") {
    return null;
  }

  const original = {
    html: button.innerHTML,
    disabled: button.disabled,
  };

  button.dataset.loading = "true";
  button.disabled = true;
  button.classList.add("ec-save-button--loading");
  button.innerHTML =
    '<span class="ec-loading-spinner-wrapper" aria-hidden="true"><object class="ec-loading-spinner ec-loading-spinner--small" data="svgs/earthcal-spinner.svg" type="image/svg+xml" aria-hidden="true"></object></span>';

  return () => {
    button.disabled = original.disabled;
    button.classList.remove("ec-save-button--loading");
    button.innerHTML = original.html;
    button.removeAttribute("data-loading");
  };
}

// Comet tracking is now controlled exclusively through the Settings modal toggle.
// The old handleCometClick button approach has been removed.

/* Declare variables */

let startCoords = { cx: 0, cy: 0 };
let targetDate;
let startDate;
let year = 2025;
let currentDate;
let dayOfYear;
let timezone;
let language;

// Ensure planet-orbits script is present before invoking planet data updates
function ensurePlanetData(date) {
  if (typeof UpdateVenusData === "function") {
    UpdateVenusData(date);
    if (typeof UpdateMarsData === "function") {
      UpdateMarsData(date);
    }
    if (typeof UpdateJupiterData === "function") {
      UpdateJupiterData(date);
    }
    if (typeof UpdateSaturnData === "function") {
      UpdateSaturnData(date);
    }
    if (typeof UpdateMercuryData === "function") {
      UpdateMercuryData(date);
    }
    return;
  }

  let script = document.getElementById("planet-orbits-loader");
  if (!script) {
    script = document.createElement("script");
    script.id = "planet-orbits-loader";
    script.src = "js/planet-orbits-2.js";
    script.defer = true;
    script.onload = () => ensurePlanetData(date);
    document.head.appendChild(script);
  } else {
    script.addEventListener("load", () => ensurePlanetData(date), { once: true });
  }
}


/* DAY SEARCH FUNCTIONS */

// Close the day search modal
function closeSearchModal() {
  const modal = document.getElementById("day-search");
  modal.classList.remove("modal-shown");
  modal.classList.add("modal-hidden");
  modal.classList.remove("dim-blur");
  document.body.style.overflowY = "unset";
}

// Open the day search modal
async function openDateSearch() {
    console.log("Current language:", userLanguage);

    const modal = document.getElementById("day-search");
    const lang = (userLanguage || 'en').toLowerCase();
    const translations = await loadTranslations(lang);

    // Use updated unified translations
    const months = translations.monthsOfYear || [];
    const title = translations.goToDateTitle || "Go to date...";
    const placeholderDay = translations.dayTranslations || "Day";
    const prevYear = translations.prevYear || "Previous Year";
    const nextYear = translations.nextYear || "Next Year";
    const goToDate = translations.goToDate || "Go to Date";

    document.getElementById("date-search-title").textContent = title;

    const dayField = document.getElementById("day-field");
    dayField.placeholder = placeholderDay;

    const monthField = document.getElementById("month-field");
    monthField.innerHTML = "";
    months.forEach((month, index) => {
        const option = document.createElement("option");
        option.value = index + 1;
        option.textContent = month;
        monthField.appendChild(option);
    });

    const prevYearButton = document.getElementById("prev-year-search");
    const nextYearButton = document.getElementById("next-year-search");
    prevYearButton.setAttribute("aria-label", prevYear);
    prevYearButton.setAttribute("title", prevYear);
    nextYearButton.setAttribute("aria-label", nextYear);
    nextYearButton.setAttribute("title", nextYear);

    const searchButton = document.getElementById("search-button");
    searchButton.textContent = goToDate;

    modal.classList.remove("modal-hidden");
    modal.classList.add("modal-shown");
    modal.classList.add("dim-blur");
    document.body.style.overflowY = "hidden";

    const searchedYear = document.querySelector(".searched-year");
    let year = targetDate.getFullYear();
    searchedYear.textContent = year;

    dayField.value = targetDate.getDate();
    monthField.value = targetDate.getMonth() + 1;
const t = translations.openDateSearch || {};
const searchingText = t.searching || 'Searching...';
    searchButton.onclick = () => {
        const day = parseInt(dayField.value, 10);
        const month = parseInt(monthField.value, 10);
        const yeard = parseInt(searchedYear.textContent, 10);

        if (!validateDate(day, month, yeard, t)) return;

        searchButton.classList.add('loading');
        searchButton.innerText = searchingText;
        targetDate = new Date(yeard, month - 1, day);
        searchGoDate(targetDate);
        closeSearchModal();
    };

    prevYearButton.onclick = () => {
        year--;
        searchedYear.textContent = year;
        targetDate.setFullYear(year);
        targetDate.setMonth(0);
        targetDate.setDate(1);
        searchGoDate(targetDate);
    };

    nextYearButton.onclick = () => {
        year++;
        searchedYear.textContent = year;
        targetDate.setFullYear(year);
        targetDate.setMonth(0);
        targetDate.setDate(1);
        searchGoDate(targetDate);
    };
}



// Update the year and refresh associated UI
function updateYear(year, searchedYearElement) {
  searchedYearElement.textContent = year;
  targetDate.setFullYear(year);
  targetDate.setMonth(0);
  targetDate.setDate(1);

  searchGoDate(targetDate);
}

// Validate the selected date and return true if valid
function validateDate(day, month, year, t) {
    if (day > 31) {
        alert(t.invalidDay || "Please make sure you're choosing a reasonable date under 31!");
        return false;
    }

    if (month === 2 && day > 29) {
        alert(t.invalidFebruary || "Please make sure you're choosing a reasonable date for February!");
        return false;
    }

    if (month === 2 && day > 28 && !isLeapYear(year)) {
        alert(t.invalidLeapYear || "Please choose a day under 29 for February in a non-leap year!");
        return false;
    }

    return true;
}



// Helper function to check if a year is a leap year
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Update the calendar for the selected date
function searchGoDate() {
  const currentYear = parseInt(currentYearText.textContent, 10);
  currentYearText.textContent = currentYear.toString();

  updateDayIds(currentYear);
  updateDayTitles(currentYear);

  calendarRefresh();
}



/*Updates certain colors to the Dark or Light theme*/
function updateBackgroundColor() {
  const svg = document.querySelector("html");
  const elementsWithColor = svg.querySelectorAll("[fill='#808000'], [stroke='#808000']");

  for (let element of elementsWithColor) {
    if (element.getAttribute("fill") === "#808000") {
      element.setAttribute("fill", "var(--general-background)");
    }
    if (element.getAttribute("stroke") === "#808000") {
      element.setAttribute("stroke", "var(--general-background)");
    }
  }
}


/*var(--general-background-highlight)*/
function updateHighlightColor() {
  const svg = document.querySelector("html");
  const elementsWithColor = svg.querySelectorAll("[fill='#008000'], [stroke='#008000']");

  for (let element of elementsWithColor) {
    if (element.getAttribute("fill") === "#008000") {
      element.setAttribute("fill", "var(--general-background-highlight)");
    }
    if (element.getAttribute("stroke") === "#008000") {
      element.setAttribute("stroke", "var(--general-background-highlight)");
      element.setAttribute("opacity", "1");

    }
  }
}


// Separate flag for the main menu (avoids collision with the subscription sub-modal)
let mainMenuOpen = false;
// Shared flag used by subscription/item modals (manageEarthcalUserSub etc.)
let modalOpen = false;

// Module-level translation cache — avoids repeated dynamic import() on each menu open
const _menuTranslationCache = {};

// Render-key cache — skip full innerHTML rebuild when auth state/plan haven't changed
let _menuLastRenderKey = null;

async function openMainMenu() {
    const modal = document.getElementById("main-menu-overlay");
    const content = document.getElementById("main-menu-content");

    // Preload the macOS upgrade preview so it displays instantly for padwan users
    new Image().src = 'assets/images/preview-apple-contacts.webp';

    const lang = userLanguage?.toLowerCase() || 'en';

    // Bug 4 fix: memoize translations per language
    if (!_menuTranslationCache[lang]) {
        _menuTranslationCache[lang] = await loadTranslations(lang);
    }
    const { mainMenu } = _menuTranslationCache[lang];

    const safeJsonParse = (value) => {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn('openMainMenu: unable to parse JSON value', error);
            return null;
        }
    };

    const resolveAuthPayload = () => {
        if (typeof isLoggedIn === 'function') {
            try {
                const loginState = isLoggedIn({ returnPayload: true }) || {};
                if (loginState?.payload?.buwana_id) {
                    return loginState.payload;
                }
            } catch (error) {
                console.warn('openMainMenu: unable to read login state', error);
            }
        }

        const sessionPayload = safeJsonParse(sessionStorage.getItem('buwana_user'));
        if (sessionPayload?.buwana_id) return sessionPayload;

        const localProfile = safeJsonParse(localStorage.getItem('user_profile'));
        if (localProfile?.buwana_id) return localProfile;

        return null;
    };

    const payload = resolveAuthPayload();
    const resolvedBuwanaId = payload?.buwana_id || (() => {
        const storedId = localStorage.getItem('buwana_id');
        if (!storedId) return null;
        const numericId = Number(storedId);
        return Number.isNaN(numericId) ? storedId : numericId;
    })();

    const isAuthenticated = Boolean(payload?.buwana_id);
    const userPlan = (window.user_plan || '').toLowerCase();
    const syncStatus = typeof window.syncStore?.getStatus === 'function' ? window.syncStore.getStatus() : null;
    const hasConnectivity = Boolean((syncStatus?.backendReachable ?? navigator.onLine) && (syncStatus?.online ?? true));

    // Bug 1 fix: only rebuild DOM when auth state, plan, connectivity, or language changed
    const renderKey = `${lang}|${isAuthenticated ? 'auth' : 'anon'}|${userPlan}|${hasConnectivity}`;
    if (_menuLastRenderKey !== renderKey || !content.innerHTML.trim()) {

        const appClientId = payload?.aud || payload?.client_id || 'unknown';
        const feedbackUrl = resolvedBuwanaId
            ? `https://buwana.ecobricks.org/${lang}/feedback.php?buwana=${encodeURIComponent(resolvedBuwanaId)}&app=${encodeURIComponent(appClientId)}`
            : `https://buwana.ecobricks.org/${lang}/feedback.php`;

        const feedbackItemHtml = isAuthenticated
            ? `
                <div class="menu-page-item">
                    <div role="button" tabindex="0" class="menu-feedback-link" onclick="closeMainMenu(); window.open('${feedbackUrl}', '_blank');" onkeypress="if(event.key==='Enter' || event.key===' ') { event.preventDefault(); closeMainMenu(); window.open('${feedbackUrl}', '_blank'); }">
                        Feedback &amp; Bugs
                    </div>
                </div>
            `
            : '';

        const menuTopHtml = (() => {
            if (isAuthenticated) {
                const planName = userPlan === 'jedi'
                    ? 'EarthCal Jedi'
                    : userPlan === 'padwan'
                        ? 'EarthCal Padwan'
                        : (window.user_plan ? String(window.user_plan) : 'EarthCal Padwan');
                const planClass = userPlan === 'jedi' ? 'menu-plan-pill-jedi' : 'menu-plan-pill-padwan';
                const showPlanAction = (userPlan === 'padwan' || userPlan === 'jedi') && hasConnectivity;
                const planActionText = userPlan === 'jedi' ? 'Manage Subscription' : 'Upgrade';
                return `
                    <div class="menu-plan-status">
                        <div class="menu-plan-pill ${planClass}">
                            <img class="menu-plan-pill-icon" src="assets/icons/green-check.png" alt="">
                            <span class="menu-plan-pill-text">${planName}</span>
                            ${showPlanAction ? `<button type="button" class="menu-plan-action" onclick="manageEarthcalUserSub();">${planActionText}</button>` : ''}
                        </div>
                    </div>
                `;
            } else {
                // Bug 6 fix: use resolved lang instead of hardcoded 'en' in signup URL
                return `
                    <div class="menu-plan-status">
                        <button type="button" class="main-menu-overlay-login" onclick="closeMainMenu(); setTimeout(() => { const btn = document.getElementById('auth-login-button'); if (btn) btn.click(); }, 300);">Login</button>
                        <a href="https://buwana.ecobricks.org/${lang}/signup-1.php?app=ecal_7f3da821d0a54f8a9b58" class="main-menu-overlay-signup" target="_blank">Sign Up</a>
                    </div>
                `;
            }
        })();

        content.innerHTML = `
            <div id="main-menu-box">
                <div class="earthcal-app-logo">
                    <img src="assets/logo/earthcal-logo-full.svg" alt="EarthCal Logo" title="${mainMenu.title}">
                </div>

                ${menuTopHtml}

                <div id="all-the-main-menu-items"></div>
                <div class="menu-page-item" onclick="sendDownRegistration(); closeMainMenu(); setTimeout(guidedTour, 500);">
                    ${mainMenu.featureTour}
                </div>

                <div class="menu-page-item" onclick="sendDownRegistration(); closeMainMenu(); setTimeout(showIntroModal, 500);">
                    ${mainMenu.latestVersion}
                </div>

                ${feedbackItemHtml}

                <div class="menu-page-item">
                    <a href="https://guide.earthen.io/" target="_blank">${mainMenu.guide}</a>
                </div>

                <div class="menu-page-item menu-page-item-no-border">
                    <a href="https://earthen.io/cycles" target="_blank">${mainMenu.about}</a>
                </div>
            </div>

            <div id="main-menu-footer">
                <div class="app-download">
                    <a href="https://snapcraft.io/earthcal" target="_blank" class="app-download-btn">
                        <img alt="Get it from the Snap Store" src="svgs/snap-store-black.svg" />
                    </a>
                    <button type="button" class="app-download-btn" id="macos-download-btn" aria-label="Download EarthCal for macOS">
                        <img alt="Download for macOS" src="assets/images/download-for-macOS.webp" />
                    </button>
                </div>

                <p style="font-size:small; margin-bottom: 2px;">
                    Developed by <a href="https://earthen.io/earthcal-v0-9/" target="_blank">Earthen.io</a>
                </p>
            </div>
        `;

        _menuLastRenderKey = renderKey;

        const macosBtn = modal.querySelector('#macos-download-btn');
        if (macosBtn) {
            macosBtn.addEventListener('click', () => {
                const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
                const currentPlan = (window.user_plan || '').toString().trim().toLowerCase();
                const isJediOrAbove = loggedIn && (currentPlan === 'jedi' || currentPlan === 'master');
                const isPadwan = loggedIn && currentPlan === 'padwan';

                if (isJediOrAbove) {
                    closeMainMenu();
                    showMacOSModal();
                } else if (isPadwan) {
                    // Padwan user — show upgrade invitation
                    if (typeof showFormModalAlert === 'function') {
                        showFormModalAlert({
                            previewImageSrc: 'assets/images/preview-apple-contacts.webp',
                            previewImageAlt: 'EarthCal for macOS preview',
                            title: 'Jedi Feature',
                            message: "Download the native EarthCal app for macOS. This feature is available to Jedi EarthCal users. Upgrade to Jedi to run EarthCal full-screen on your Mac!",
                            footerMessage: 'Upgrade your EarthCal account to Jedi to access the macOS download.',
                            actions: [
                                {
                                    label: 'Upgrade to Jedi',
                                    template: 'login',
                                    onClick: () => {
                                        if (typeof closeFormModalAlert === 'function') closeFormModalAlert();
                                        closeMainMenu();
                                        if (typeof manageEarthcalUserSub === 'function') manageEarthcalUserSub();
                                    }
                                }
                            ]
                        });
                    }
                } else {
                    // Not logged in — show login/signup prompt
                    if (typeof showFormModalAlert === 'function') {
                        showFormModalAlert({
                            previewImageSrc: 'assets/images/preview-apple-contacts.webp',
                            previewImageAlt: 'EarthCal for macOS',
                            title: 'Jedi Feature',
                            message: 'Download the native EarthCal app for macOS. Free for all Jedi EarthCal users.',
                            footerMessage: 'Login or create a Jedi account to access the macOS download.',
                            actions: [
                                {
                                    label: 'Login',
                                    template: 'login',
                                    iconSrc: 'svgs/earthcal-icon.svg',
                                    onClick: async () => {
                                        if (typeof closeFormModalAlert === 'function') closeFormModalAlert();
                                        closeMainMenu();
                                        if (typeof navigateToAuthLogin === 'function') await navigateToAuthLogin();
                                    }
                                },
                                {
                                    label: 'Signup to Earthcal',
                                    template: 'signup',
                                    onClick: () => {
                                        if (typeof closeFormModalAlert === 'function') closeFormModalAlert();
                                        closeMainMenu();
                                        if (typeof navigateToAuthSignup === 'function') navigateToAuthSignup();
                                    }
                                }
                            ]
                        });
                    }
                }
            });
        }
    }

    modal.style.width = "100%";
    document.body.style.overflowY = "hidden";
    document.body.style.maxHeight = "101vh";
    modal.classList.add("main-menu-open");

    modal.setAttribute("tabindex", "0");
    modal.focus();
    // Bug 2 fix: use dedicated mainMenuOpen flag, not the shared modalOpen
    mainMenuOpen = true;

    document.addEventListener("focus", focusMainMenuRestrict, true);
}







async function manageEarthcalUserSub() {
    closeMainMenu();

    const modal = document.getElementById('form-modal-message');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) {
        console.error('Subscription modal container is missing.');
        return;
    }

    const escapeHtml = (value) => {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const ensureModalReady = () => {
        const contentBox = modal.querySelector('.modal-content-box');
        if (contentBox) {
            contentBox.id = 'modal-content-box';
            contentBox.classList.add('dim-blur', 'subscription-modal-background');
            contentBox.style.backgroundColor = 'transparent';
        }

        modal.classList.remove('modal-hidden');
        modal.classList.add('modal-visible', 'dim-blur');
        document.body.style.overflowY = 'hidden';

        modal.setAttribute('tabindex', '0');
        modal.focus();
        modalOpen = true;
        document.addEventListener('focus', focusRestrict, true);
    };

    const setModalHtml = (html) => {
        modalContent.innerHTML = html;
        ensureModalReady();
    };

    const resolveUser = () => {
        if (typeof getCurrentUser === 'function') {
            try {
                const current = getCurrentUser();
                if (current?.buwana_id) {
                    return current;
                }
            } catch (error) {
                console.warn('Unable to resolve user from getCurrentUser()', error);
            }
        }

        try {
            const sessionUser = JSON.parse(sessionStorage.getItem('buwana_user') || '{}');
            if (sessionUser?.buwana_id) {
                return sessionUser;
            }
        } catch (error) {
            console.warn('Unable to read session storage buwana_user', error);
        }

        const storedId = localStorage.getItem('buwana_id');
        if (storedId) {
            const numericId = Number(storedId);
            return { buwana_id: Number.isNaN(numericId) ? storedId : numericId };
        }

        return null;
    };

    const user = resolveUser();
    if (!user?.buwana_id) {
        setModalHtml(`
            <div class="ec-subscription-modal">
                <h1>Upgrade EarthCal</h1>
                <p id="sales-pitch">The way we perceive and track our time determines our time on planet Earth. EarthCal enables a transition from the Imperial Roman paradigm of linear time, to the circular thinking of great cyclocentric civilizations. Our free EarthCal padwan plan gives you all you need to get going with EarthCal.  Upgrade to Jedi to support EarthCal and get access to bonus features.</p>
                <p>Please sign in with your Buwana account to upgrade.</p>
                <div id="modal-login-buttons" style="text-align:center;width:100%;margin:auto;margin-top:20px;max-width:500px;display:flex;flex-direction:column;gap:10px;">
                    <button id="modal-auth-login-button" class="login-button">Login with Buwana</button>
                    <button id="modal-auth-signup-button" class="signup-button">Sign Up to Earthcal</button>
                </div>
            </div>
        `);

        const modalSignupButton = document.getElementById('modal-auth-signup-button');
        if (modalSignupButton) {
            modalSignupButton.onclick = () => {
                window.location.href = 'https://buwana.ecobricks.org/en/signup-1.php?app=ecal_7f3da821d0a54f8a9b58';
            };
        }

        const modalLoginButton = document.getElementById('modal-auth-login-button');
        if (modalLoginButton && typeof createJWTloginURL === 'function') {
            createJWTloginURL()
                .then((url) => {
                    if (url) {
                        modalLoginButton.onclick = () => {
                            window.location.href = url;
                        };
                    }
                })
                .catch((error) => {
                    console.error('Unable to prepare modal login button', error);
                });
        }

        return;
    }

    modalContent.innerHTML = `
        <div class="ec-subscription-modal">
            <h1>Upgrade EarthCal</h1>
            <p id="sales-pitch">The way we perceive and track our time on planet Earth is fundamental to the harmony we find with the cycles of life. EarthCal is a powerful tool to transition from linear and rectangular time-thinking, to circular and cyclical time. Our free Padwan subscription gives you all you need to get going with EarthCal, while our Jedi subscription gives you access to the latest and greatest features.</p>
            <div class="ec-loading-row">
                <object class="ec-loading-spinner" data="svgs/earthcal-spinner.svg" type="image/svg+xml" aria-hidden="true"></object>
                <span>Checking your subscription&hellip;</span>
            </div>
        </div>
    `;
    ensureModalReady();

    const formatPrice = (plan) => {
        if (!plan) {
            return { priceText: 'Coming soon', intervalText: '' };
        }

        const centsRaw = plan?.price_cents ?? plan?.priceCents;
        const cents = Number.isFinite(centsRaw) ? centsRaw : Number.parseInt(centsRaw ?? '0', 10);
        const currencyRaw = (plan?.currency || 'USD').toString().trim();
        const currency = currencyRaw.length ? currencyRaw.toUpperCase() : 'USD';

        if (!Number.isFinite(cents) || cents <= 0) {
            const intervalText = (plan?.billing_interval || '').toLowerCase() === 'lifetime'
                ? 'Lifetime access'
                : '';
            return { priceText: 'Free', intervalText };
        }

        let formatter;
        try {
            formatter = new Intl.NumberFormat((userLanguage || 'en').toLowerCase(), {
                style: 'currency',
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        } catch (error) {
            formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }

        const priceText = formatter.format(cents / 100);
        let intervalText = '';
        switch ((plan?.billing_interval || '').toLowerCase()) {
            case 'year':
                intervalText = 'Billed yearly';
                break;
            case 'lifetime':
                intervalText = 'Lifetime access';
                break;
            case 'month':
            default:
                intervalText = 'Billed monthly';
                break;
        }

        return { priceText, intervalText };
    };

    const padwanFeatureList = [
        'Harmonize your events with Earthen cycles.',
        'Create up to 200 events, to-dos and journals.',
        'Create and manage up to 3 personal calendars.',
        'Auspice planetary, lunar, solar, Earthen postures for any date.',
        'Download & Sync with the free Unbuntu Earthcal app.',
    ];

    const jediFeatureList = [
        'Up to 10 personal calendars, unlimited date items.',
        'Track/visualize the comet 3I-Atlas over the days of 2025-26',
        'Enable Earthcal lunar calendar layer',
        'Enable Zodiac house visualization layer',
        'Connect to your (and other public) Google calendars',
        'Subscribe to Apple calendars',
        'Subscribe to Outlook calendars',
        'Subscribe to public iCal feeds',
        'Access to the beta Mac desktop app',
        'Support the development of EarthCal into an even more awesome tool! 🤩🙏',
    ];

    const renderFeatures = (plan) => {
        const explicitFeatures = Array.isArray(plan?.featureList)
            ? plan.featureList.map((item) => item && item.toString().trim()).filter(Boolean)
            : [];

        if (explicitFeatures.length) {
            const classes = ['ec-plan-feature-list'];
            if ((plan?.featureVariant || '').toLowerCase() === 'checks') {
                classes.push('ec-plan-feature-list--checks');
            }

            return `
                <ul class="${classes.join(' ')}">
                    ${explicitFeatures.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
            `;
        }

        const description = plan?.description;
        if (!description) {
            return '';
        }

        const features = description
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean);

        if (!features.length) {
            return `<p class="ec-plan-description">${escapeHtml(description)}</p>`;
        }

        return `
            <ul class="ec-plan-feature-list">
                ${features.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
        `;
    };

    try {
        const apiBase = getApiBase();
        const [subscriptionResponse, plansResponse] = await Promise.all([
            fetch(`${apiBase}/check_user_sub.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: user.buwana_id }),
            }),
            fetch(`${apiBase}/get_earthcal_plans.php`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            }),
        ]);

        if (!subscriptionResponse.ok) {
            throw new Error(`Subscription lookup failed with status ${subscriptionResponse.status}`);
        }

        if (!plansResponse.ok) {
            throw new Error(`Plan lookup failed with status ${plansResponse.status}`);
        }

        const [subscriptionData, plansData] = await Promise.all([
            subscriptionResponse.json(),
            plansResponse.json(),
        ]);

        if (!subscriptionData || subscriptionData.ok === false) {
            const reason = subscriptionData?.error || 'subscription_lookup_failed';
            throw new Error(reason);
        }

        if (plansData && plansData.ok === false) {
            const reason = plansData?.error || 'plan_lookup_failed';
            throw new Error(reason);
        }

        const plans = Array.isArray(plansData?.plans)
            ? plansData.plans
            : (Array.isArray(subscriptionData?.plans) ? subscriptionData.plans : []);

        const padwanPlanFromApi = plans.find((plan) => Number(plan?.plan_id) === 1) || null;
        const padwanPlan = {
            ...(padwanPlanFromApi || {}),
            name: padwanPlanFromApi?.name || 'Padwan Plan',
            price_cents: padwanPlanFromApi?.price_cents ?? padwanPlanFromApi?.priceCents ?? 0,
            billing_interval: padwanPlanFromApi?.billing_interval || 'lifetime',
            description: padwanPlanFromApi?.description || '',
            featureList: padwanFeatureList,
            featureVariant: 'bullets',
        };

        const jediPlans = plans.filter((plan) => [2, 3, 4].includes(Number(plan?.plan_id)));

        const jediByInterval = jediPlans.reduce((acc, plan) => {
            const interval = (plan?.billing_interval || '').toLowerCase();
            if (interval && !acc[interval]) {
                acc[interval] = plan;
            }
            return acc;
        }, {});

        const jediFeatureSourceBase = jediPlans.find((plan) => plan?.description)
            || jediPlans[0]
            || {
                name: 'Jedi Plan',
                description: 'Harness advanced EarthCal powers, automation and deeper cosmic insights designed for masters of time.',
            };
        const jediDisplayPlan = {
            ...(jediFeatureSourceBase || {}),
            name: jediFeatureSourceBase?.name || 'Jedi Plan',
            description: jediFeatureSourceBase?.description || '',
            featureList: jediFeatureList,
            featureVariant: 'checks',
        };

        const jediPriceData = {
            month: formatPrice(jediByInterval.month),
            year: formatPrice(jediByInterval.year),
            lifetime: formatPrice(jediByInterval.lifetime),
        };

        const padwanPriceData = formatPrice(padwanPlan);

        const currentSubscription = subscriptionData?.current_subscription || null;
        const currentPlanName = currentSubscription?.plan?.name
            || currentSubscription?.plan_name
            || subscriptionData?.current_plan_name
            || (window.user_plan === 'jedi' ? 'Jedi Plan' : 'Padwan Plan');

        const userPlanType = window.user_plan === 'jedi' ? 'jedi' : 'padwan';

        let planMessage = '';
        if (userPlanType === 'padwan') {
            planMessage = "You're using EarthCal | Padwan.  Upgrade to Jedi for full time powers. 🚀";
        } else if (currentPlanName) {
            planMessage = `You're currently on the ${escapeHtml(currentPlanName)} plan.`;
        }

        const intervalOrder = ['month', 'year', 'lifetime'];
        const firstAvailableInterval = intervalOrder.find((interval) => jediByInterval[interval]) || 'month';

        const jediPriceAttr = (interval, key) => escapeHtml(jediPriceData[interval]?.[key] || 'Coming soon');
        const padwanCardClass = userPlanType === 'padwan' ? ' current-plan' : '';
        const jediCardClass = userPlanType === 'jedi' ? ' current-plan' : '';
        const showUpgradeControls = userPlanType === 'padwan' || userPlanType === 'jedi';
        const downgradeLinkHtml = userPlanType === 'jedi'
            ? `<!-- <a class="ec-downgrade-link" href="#" onclick="return downgradeToPadwanPlan();">Downgrade to Padwan Plan (for beta testers)</a> -->`
            : '';
        const upgradeButtonHtml = showUpgradeControls
            ? `
                <div class="ec-plan-actions">
                    <button type="button" class="confirmation-blur-button greenback" onclick="upgradeUserPlan()">Upgrade</button>
                    <button type="button" class="ec-coupon-toggle" aria-expanded="false" aria-controls="ec-coupon-form">Apply Coupon</button>
                </div>
                <div class="ec-coupon-area">
                    <form id="ec-coupon-form" class="ec-coupon-form" hidden>
                        <label class="ec-coupon-label" for="ec-coupon-input">Coupon Code</label>
                        <div class="ec-coupon-input-wrapper">
                            <input id="ec-coupon-input" class="ec-coupon-input" type="text" name="coupon_code" inputmode="text" autocomplete="off" maxlength="7" pattern="[A-Za-z0-9]{7}" placeholder="XXXXXXX" required />
                        </div>
                        <div class="ec-coupon-actions">
                            <button type="submit" class="ec-coupon-submit">Redeem Coupon</button>
                            <button type="button" class="ec-coupon-cancel">Cancel</button>
                        </div>
                        <div class="ec-coupon-feedback" role="status" aria-live="polite"></div>
                    </form>
                </div>
                ${downgradeLinkHtml ? `<div class="ec-downgrade-footer">${downgradeLinkHtml}</div>` : ''}
            `
            : '';

        const renderPlanHeader = (planName, isCurrentPlan) => `
            <div class="ec-plan-card-header">
                <h2>${escapeHtml(planName)}</h2>
                ${isCurrentPlan ? '<span class="ec-plan-status-pill" aria-label="Subscribed plan">🟢 Subscribed</span>' : ''}
            </div>
        `;

        const padwanCardHtml = `
            <div class="ec-plan-card${padwanCardClass}">
                ${renderPlanHeader(padwanPlan?.name || 'Padwan Plan', userPlanType === 'padwan')}
                <div class="ec-plan-price">${escapeHtml(padwanPriceData.priceText)}</div>
                ${padwanPriceData.intervalText ? `<div class="ec-plan-interval">${escapeHtml(padwanPriceData.intervalText)}</div>` : ''}
                ${renderFeatures(padwanPlan)}
            </div>
        `;

        const jediCardHtml = `
            <div class="ec-plan-card${jediCardClass}">
                ${renderPlanHeader(jediDisplayPlan?.name || 'Jedi Plan', userPlanType === 'jedi')}
                <div class="ec-plan-price" data-role="jedi-price"
                    data-month-price="${jediPriceAttr('month', 'priceText')}"
                    data-month-interval="${jediPriceAttr('month', 'intervalText')}"
                    data-year-price="${jediPriceAttr('year', 'priceText')}"
                    data-year-interval="${jediPriceAttr('year', 'intervalText')}"
                    data-lifetime-price="${jediPriceAttr('lifetime', 'priceText')}"
                    data-lifetime-interval="${jediPriceAttr('lifetime', 'intervalText')}">
                    ${escapeHtml(jediPriceData[firstAvailableInterval]?.priceText || 'Coming soon')}
                </div>
                <div class="ec-plan-interval" data-role="jedi-interval">
                    ${escapeHtml(jediPriceData[firstAvailableInterval]?.intervalText || '')}
                </div>
                ${renderFeatures(jediDisplayPlan)}
            </div>
        `;

        const planCardsHtml = userPlanType === 'jedi'
            ? `${jediCardHtml}${padwanCardHtml}`
            : `${padwanCardHtml}${jediCardHtml}`;

        modalContent.innerHTML = `
            <div class="ec-subscription-modal">
                <h1>Upgrade EarthCal</h1>
                ${planMessage ? `<div class="ec-plan-current-label${userPlanType === 'padwan' ? ' ec-plan-current-label--padwan' : ''}">${planMessage}</div>` : ''}
                <p id="sales-pitch">The way we perceive and track our time on planet Earth is fundamental to the harmony we find with the cycles of life. EarthCal is a powerful tool to transition from linear and rectangular time-thinking, to circular and cyclical time. Our free Padwan subscription gives you all you need to get going with EarthCal, while our Jedi subscription gives you access to the latest and greatest features.</p>
                <div class="ec-plan-toggle" role="group" aria-label="Choose billing interval">
                    <span class="ec-toggle-indicator"></span>
                    <button type="button" class="ec-toggle-option" data-interval="month" aria-pressed="false">Monthly</button>
                    <button type="button" class="ec-toggle-option" data-interval="year" aria-pressed="false">Yearly</button>
                    <button type="button" class="ec-toggle-option" data-interval="lifetime" aria-pressed="false">Lifetime</button>
                </div>
                <div class="ec-plan-columns">
                    ${planCardsHtml}
                </div>
                ${upgradeButtonHtml}
            </div>
        `;

        ensureModalReady();

        const planToggle = modalContent.querySelector('.ec-plan-toggle');
        const toggleButtons = modalContent.querySelectorAll('.ec-toggle-option');
        const jediPriceEl = modalContent.querySelector('[data-role="jedi-price"]');
        const jediIntervalEl = modalContent.querySelector('[data-role="jedi-interval"]');

        if (!planToggle || !jediPriceEl || !jediIntervalEl) {
            return;
        }

        const toggleCount = toggleButtons.length;
        if (toggleCount > 0) {
            planToggle.style.setProperty('--toggle-count', String(toggleCount));
        }

        const updateJediPricing = (interval) => {
            const dataKeyPrice = `${interval}Price`;
            const dataKeyInterval = `${interval}Interval`;
            const priceValue = jediPriceEl.dataset[dataKeyPrice] || 'Coming soon';
            const intervalValue = jediPriceEl.dataset[dataKeyInterval] || '';

            jediPriceEl.textContent = priceValue;

            if (intervalValue) {
                jediIntervalEl.textContent = intervalValue;
                jediIntervalEl.style.display = '';
            } else {
                jediIntervalEl.textContent = '';
                jediIntervalEl.style.display = 'none';
            }
        };

        const setActiveInterval = (interval) => {
            const index = intervalOrder.indexOf(interval);
            const clampedIndex = index >= 0 ? index : 0;
            const activeInterval = intervalOrder[clampedIndex] || intervalOrder[0];
            planToggle.style.setProperty('--toggle-index', String(clampedIndex));
            planToggle.setAttribute('data-active-interval', activeInterval);

            toggleButtons.forEach((button) => {
                const isActive = button.dataset.interval === activeInterval;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            updateJediPricing(activeInterval);
        };

        toggleButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setActiveInterval(button.dataset.interval);
            });
        });

        setActiveInterval(firstAvailableInterval);

        const couponToggleButton = modalContent.querySelector('.ec-coupon-toggle');
        const couponForm = modalContent.querySelector('.ec-coupon-form');
        const couponArea = modalContent.querySelector('.ec-coupon-area');
        const couponInput = modalContent.querySelector('.ec-coupon-input');
        const couponInputWrapper = modalContent.querySelector('.ec-coupon-input-wrapper');
        const couponSubmit = modalContent.querySelector('.ec-coupon-submit');
        const couponFeedback = modalContent.querySelector('.ec-coupon-feedback');
        const couponCancelButton = modalContent.querySelector('.ec-coupon-cancel');
        const upgradeButton = modalContent.querySelector('.confirmation-blur-button.greenback');
        let couponRequestPending = false;
        const COUPON_CELEBRATION_DURATION_MS = 500;
        const COUPON_SUCCESS_HOLD_MS = 1000;
        const COUPON_REDIRECT_BUFFER_MS = 400;

        if (couponInput) {
            couponInput.addEventListener('input', () => {
                const sanitized = couponInput.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .slice(0, 7);
                if (couponInput.value !== sanitized) {
                    couponInput.value = sanitized;
                }
            });
        }

        const setUpgradeVisibility = (isVisible) => {
            if (!upgradeButton) {
                return;
            }
            if (isVisible) {
                upgradeButton.hidden = false;
            } else {
                upgradeButton.hidden = true;
            }
        };

        const resetCouponUi = ({ resetFields = false } = {}) => {
            couponRequestPending = false;
            if (resetFields) {
                couponForm?.reset();
            }
            couponInput?.removeAttribute('aria-busy');
            couponSubmit?.removeAttribute('aria-busy');
            couponInput?.removeAttribute('disabled');
            couponSubmit?.removeAttribute('disabled');
            if (couponFeedback) {
                couponFeedback.textContent = '';
            }
        };

        const hideCouponForm = ({ resetFields = false } = {}) => {
            if (couponForm && couponToggleButton) {
                couponForm.hidden = true;
                couponToggleButton.hidden = false;
                couponToggleButton.setAttribute('aria-expanded', 'false');
            }
            resetCouponUi({ resetFields });
            setUpgradeVisibility(true);
        };

        const showCouponForm = () => {
            if (!couponForm || !couponToggleButton) {
                return;
            }
            couponForm.hidden = false;
            couponToggleButton.hidden = true;
            couponToggleButton.setAttribute('aria-expanded', 'true');
            resetCouponUi({ resetFields: false });
            if (couponInput) {
                couponInput.focus();
            }
            setUpgradeVisibility(false);
        };

        if (couponToggleButton && couponForm) {
            hideCouponForm({ resetFields: true });
            couponToggleButton.addEventListener('click', () => {
                showCouponForm();
            });
        } else {
            resetCouponUi({ resetFields: true });
        }

        if (couponCancelButton) {
            couponCancelButton.addEventListener('click', () => {
                hideCouponForm({ resetFields: true });
                couponToggleButton?.focus();
            });
        }

        if (couponForm) {
            couponForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (couponRequestPending) {
                    return;
                }

                const code = (couponInput?.value || '').trim().toUpperCase();
                if (!/^[A-Z0-9]{7}$/.test(code)) {
                    if (couponFeedback) {
                        couponFeedback.textContent = 'Enter a valid 7-character coupon code.';
                    }
                    couponInput?.focus();
                    return;
                }

                couponRequestPending = true;
                couponInput?.setAttribute('aria-busy', 'true');
                couponSubmit?.setAttribute('aria-busy', 'true');
                if (couponFeedback) {
                    couponFeedback.textContent = 'Checking coupon…';
                }
                couponInput?.setAttribute('disabled', 'true');
                couponSubmit?.setAttribute('disabled', 'true');

                let restoreUi = true;

                try {
                    const response = await fetch('api/v1/check_coupon.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            buwana_id: user.buwana_id,
                            coupon_code: code,
                        }),
                    });

                    const result = await response.json().catch(() => null);

                    if (!response.ok || !result || result.ok === false) {
                        const errorMessage = result?.error_message
                            || result?.error
                            || `Coupon check failed (${response.status})`;
                        if (couponFeedback) {
                            couponFeedback.textContent = String(errorMessage);
                        }
                        return;
                    }

                    restoreUi = false;
                    let successWrapper = null;
                    if (couponArea && couponForm) {
                        successWrapper = document.createElement('div');
                        successWrapper.className = 'ec-coupon-success';
                        successWrapper.textContent = 'Coupon Valid 👍';
                        couponForm.replaceWith(successWrapper);
                    }

                    if (couponToggleButton) {
                        couponToggleButton.hidden = true;
                    }

                    window.setTimeout(() => {
                        if (successWrapper) {
                            successWrapper.classList.add('celebrate-animation');
                        } else if (couponInputWrapper) {
                            couponInputWrapper.classList.remove('celebrate-animation');
                            void couponInputWrapper.offsetWidth;
                            couponInputWrapper.classList.add('celebrate-animation');
                        }

                        window.setTimeout(() => {
                            closeMainMenu();
                            window.location.href = 'billing-success.html?session_id=manual_coupon_redemption';
                        }, COUPON_CELEBRATION_DURATION_MS + COUPON_REDIRECT_BUFFER_MS);
                    }, COUPON_SUCCESS_HOLD_MS);
                } catch (couponError) {
                    console.error('Coupon validation failed:', couponError);
                    if (couponFeedback) {
                        couponFeedback.textContent = 'We could not apply that coupon. Please try again.';
                    }
                } finally {
                    couponRequestPending = false;
                    couponInput?.removeAttribute('aria-busy');
                    couponSubmit?.removeAttribute('aria-busy');

                    if (restoreUi) {
                        couponInput?.removeAttribute('disabled');
                        couponSubmit?.removeAttribute('disabled');
                        couponInput?.focus();
                    }
                }
            });
        }
    } catch (error) {
        console.error('Failed to load subscription details:', error);
        setModalHtml(`
            <div class="ec-subscription-modal">
                <h1>Upgrade EarthCal</h1>
                <p id="sales-pitch">The way we perceive and track our time on planet Earth is fundamental to the harmony we find with the cycles of life. EarthCal is a powerful tool to transition from linear and rectangular time-thinking, to circular and cyclical time. Our free Padwan subscription gives you all you need to get going with EarthCal, while our Jedi subscription gives you access to the latest and greatest features.</p>
                <p>We could not load your subscription details (${escapeHtml(error.message || 'unknown error')}). Please try again in a moment.</p>
            </div>
        `);
    }
}



async function upgradeUserPlan() {
    try {
        // Determine which interval (month / year / lifetime) the user has selected
        const activeInterval = document
            .querySelector('.ec-plan-toggle')
            ?.getAttribute('data-active-interval') || 'month';

        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/create_checkout_session.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buwana_id: getCurrentUser()?.buwana_id,
                interval: activeInterval,     // "month" | "year" | "lifetime"
            }),
        });

        const data = await response.json();

        if (!response.ok || !data?.url) {
            alert(data?.error || "Failed to start checkout.");
            return;
        }

        // Redirect user to Stripe Checkout
        window.location.href = data.url;

    } catch (err) {
        console.error(err);
        alert("Could not start checkout — please try again.");
    }
}


async function manageBilling() {
    const user = getCurrentUser();
    if (!user?.buwana_id) {
        alert("Please log in first.");
        return;
    }

    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/create_portal_session.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buwana_id: user.buwana_id })
    });

    const data = await res.json();

    if (data?.url) {
        window.location.href = data.url;
    } else {
        alert(data?.error || "Unable to open billing portal.");
    }
}


function focusMainMenuRestrict(event) {
    // Bug 2 fix: use mainMenuOpen, not the shared modalOpen flag
    const modal = document.getElementById("main-menu-overlay");
    if (mainMenuOpen && !modal.contains(event.target)) {
        event.stopPropagation();
        modal.focus();
    }
}

function closeMainMenu() {
    const modal = document.getElementById("main-menu-overlay");
    const content = document.getElementById("main-menu-content");
    modal.style.width = "0%";
    document.body.style.overflowY = "unset";
    document.body.style.maxHeight = "unset";
    modal.classList.remove("main-menu-open");

    // Bug 2 fix: clear dedicated flag
    mainMenuOpen = false;

    // Cleanup focus trap
    document.removeEventListener("focus", focusMainMenuRestrict, true);

    // Bug 5 fix: clear stale HTML after the slide-out transition (0.5s) to avoid
    // a flash of old content on re-open
    setTimeout(() => {
        if (content) {
            content.innerHTML = '';
            _menuLastRenderKey = null;
        }
    }, 500);
}

function modalCloseCurtains(event) {
    // Bug 3 fix: only intercept Escape when the main menu is actually open,
    // so other modals (item forms, subscription modal) handle their own Escape
    if (!mainMenuOpen) return;
    if (!event.key || event.key === "Escape") {
        closeMainMenu();
    }
}

document.addEventListener("keydown", modalCloseCurtains);





let downgradeRequestPending = false;

async function downgradeToPadwanPlan(event) {
    if (event) {
        event.preventDefault();
    }

    if (downgradeRequestPending) {
        return false;
    }

    const resolveDowngradeUser = () => {
        if (typeof getCurrentUser === 'function') {
            try {
                const current = getCurrentUser();
                if (current?.buwana_id) {
                    return current;
                }
            } catch (error) {
                console.warn('Unable to resolve user from getCurrentUser()', error);
            }
        }

        try {
            const sessionUser = JSON.parse(sessionStorage.getItem('buwana_user') || '{}');
            if (sessionUser?.buwana_id) {
                return sessionUser;
            }
        } catch (error) {
            console.warn('Unable to read session storage buwana_user', error);
        }

        const storedId = localStorage.getItem('buwana_id');
        if (storedId) {
            const numericId = Number(storedId);
            return { buwana_id: Number.isNaN(numericId) ? storedId : numericId };
        }

        return null;
    };

    const user = resolveDowngradeUser();
    const rawId = user?.buwana_id ?? null;
    const buwanaId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : Number(rawId);

    if (!Number.isInteger(buwanaId) || buwanaId <= 0) {
        alert('We could not find your EarthCal account. Please sign in and try again.');
        return false;
    }

    downgradeRequestPending = true;

    try {
        const response = await fetch('api/v1/downgrade_plan.api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buwana_id: buwanaId }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result || result.ok === false) {
            const message = result?.error_message
                || result?.error
                || `Downgrade failed (${response.status})`;
            throw new Error(String(message));
        }

        alert('Your subscription has been downgraded to the Padwan Plan.');
        closeMainMenu();
        window.location.reload();
    } catch (error) {
        console.error('Downgrade request failed:', error);
        alert(`We could not downgrade your subscription. ${error?.message || error}`);
    } finally {
        downgradeRequestPending = false;
    }

    return false;
}

/* ---------------------------

Animate the planets into position

-------------------------------*/



  // Specific function for the targetDate
function getDayOfYear(targetDate) {
  const startOfYear = new Date(Date.UTC(targetDate.getFullYear(), 0, 1));
  const diff = targetDate.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  let dayOfYear = Math.floor(diff / oneDay) + 1;
  // Adjust for day 366
  if (dayOfYear === 366) {
    dayOfYear = 365;
  }
  return dayOfYear;
}



// Helper function for other functions (like the GetMoonDay)
function getTheDayOfYear(targetDate) {

  const startOfYear = new Date(Date.UTC(targetDate.getFullYear(), 0, 1));
  const diff = targetDate.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  dayOfYear = Math.floor(diff / oneDay) + 1;

  // Adjust for day 366
  if (dayOfYear === 366) {
    dayOfYear = 365;
  }

  return dayOfYear;
}


///


// TRIGGERS PLANET ANIMATION ON DAY PATH CLICK

  function triggerPlanets() {
 // Set startDate to the current value of targetDate
    let paths = document.querySelectorAll('path[id$="-day"]');
    // Event listener for each path element
    
    paths.forEach(path => {
      path.addEventListener('click', () => {
        // Parse date from path ID
        let pathIdArr = path.id.split('-');
        let month = pathIdArr[2] - 1;
        let day = pathIdArr[1];
        let year = pathIdArr[3];
        targetDate = new Date(year, month, day);

        calendarRefresh();

        startDate = targetDate;
        // document.getElementById("reset").style.display = "block";
        // document.getElementById("current-time").style.display = "none";
      
       
      });
      
    });
  }



function whenReady(selector, cb, tries = 30) {
    const el = document.querySelector(selector);
    if (el) return cb(el);
    if (tries <= 0) return console.warn(`Missing ${selector}`);
    setTimeout(() => whenReady(selector, cb, tries - 1), 100);
}



let animatePlanets = null;

function ensurePlanetAnimator() {
    if (animatePlanets) return true;

    const root = document.getElementById("solar-system-center");
    const sol = root?.querySelector?.("#sol");
    if (!root || !sol) return false; // SVG not ready yet

    animatePlanets = buildSolarAnimatorByRotation();
    return true;
}



function calendarRefresh() {
    // Phase 1: immediate UI updates
    updateTargetMonth();
    displayDayInfo(targetDate, userLanguage, userTimeZone);
    resetPaths();
    updateTargetDay();

    // Phase 2: planets (once SVG is ready)
    if (ensurePlanetAnimator()) {
        // Use your UTC-safe dates (your setCurrentDate should create UTC dates)
        animatePlanets(startDate, targetDate);
    }

    if (typeof animateCometTrajectory === "function" && localStorage.getItem('user_comet_tracking') === 'true') {
      animateCometTrajectory(targetDate);
    }

    animateWhaleCycle(targetDate);
    UpdateWhaleCycle(targetDate);
       updateStorkCycle(targetDate);




    // Phase 3: Actions after 1 sec

    highlightDateCycles(targetDate);
    //displayMatchingDateCycle();

    // Refresh the lunar auspices dash panel if it is currently visible
    if (typeof window.refreshLunarAuspicesDashPanel === 'function') {
        window.refreshLunarAuspicesDashPanel();
    }


    // getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    // setLunarMonthForTarget(targetDate);
    

    dayOfYear = getDayOfYear(targetDate);
    const currentYearText = document.getElementById('current-year').querySelector('tspan');
    currentYearText.textContent = targetDate.getFullYear().toString();
    const currentYear = parseInt(currentYearText.textContent);

   setLunarMonthForTarget(targetDate, currentYear);

   setTimeout(function() {
    // displayMoonPhaseInDiv(targetDate); // retired — auspices panel replaces moon-cycle info

    ensurePlanetData(targetDate);

    // redisplayTargetData();
    startDate = targetDate;
  }, 1000);

}

function set2Tomorrow() {
  // Snapshot startDate as a NEW object before mutating targetDate.
  // startDate and targetDate can alias the same object (set via "startDate = targetDate"
  // in the day-path click handler). If we mutate targetDate in place without snapshotting,
  // dayJump becomes 0 and jumpSign defaults to +1, causing unwrapAngleBySign to spin
  // planets forward a full orbit instead of stepping forward one day.
  startDate = new Date(targetDate);
  targetDate.setDate(targetDate.getDate() + 1); // Sets the target date to tomorrow
  calendarRefresh(); // Call the calendarRefresh function
  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "none";
  // document.getElementById("yesterday").style.display = "none";
  // document.getElementById("current-time").style.display = "none";

  
}

function set2Yesterday() {
  // Same aliasing guard as set2Tomorrow — snapshot before mutating.
  startDate = new Date(targetDate);
  targetDate.setDate(targetDate.getDate() - 1); // Sets the target date to yesterday
  calendarRefresh(); // Call the calendarRefresh function
  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "none";
  // document.getElementById("yesterday").style.display = "none";
  // document.getElementById("current-time").style.display = "none";




}

function set2Today() {
  const isSameDay = (first, second) => first instanceof Date
    && second instanceof Date
    && first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();

  const previousTargetDate = targetDate instanceof Date ? new Date(targetDate) : null;
  setCurrentDate();  // Reset target date to the current date
  startDate = previousTargetDate || targetDate;

  if (isSameDay(startDate, targetDate)) {
    const shakeTarget = document.querySelector('.date-time-add-box') || document.querySelector('.date-info');
    const shakeResult = shakeTarget ? 'YES' : 'NO';
    console.log('[set2Today] startDate:', startDate, 'targetDate:', targetDate, `shake: ${shakeResult}`);
    if (shakeTarget && typeof runDateInfoAnimation === 'function') {
      const animation = runDateInfoAnimation(shakeTarget, {
        keyframes: [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-6px)' },
          { transform: 'translateX(6px)' },
          { transform: 'translateX(-6px)' },
          { transform: 'translateX(0)' }
        ],
        options: { duration: 400, easing: 'ease-in-out' },
        className: 'shake-horizontal'
      });
      if (!animation) {
        setTimeout(() => {
          shakeTarget.classList.remove('shake-horizontal');
        }, 400);
      }
    }
  }

  calendarRefresh(); // Call the calendarRefresh function for all updates

  // document.getElementById("yesterday").style.display = "block";
  // document.getElementById("tomorrow").style.display = "block";
  // document.getElementById("reset").style.display = "none";
  // document.getElementById("current-time").style.display = "block";


}








/* SET DATE PATHS being used???!
*/
function getMoonPhaseAndIllumination(date) {
  const julianDate = date / 86400000 + 2440587.5;
  const newMoon = 2451550.1;
  const synodicMonth = 29.53058867;

  const daysSinceNewMoon = julianDate - newMoon;
  const moonPhases = daysSinceNewMoon % synodicMonth;
  
  const phase = (moonPhases / synodicMonth) * 8;
  const phaseIndex = Math.floor((phase < 0 ? phase + 8 : phase) + 0.5) % 8;
  
  const moonPhaseIcons = [
    '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'
  ];
  
  return moonPhaseIcons[phaseIndex];
}






/* ADD TOOL TIP TO ALL TITLES */

function title2tooltip() {
  var paths = document.querySelectorAll('path:not([id$="-day"]):not([id*="phase"]), circle:not([id*="-day"]):not([id*="phase"])');

  for (var i = 0; i < paths.length; i++) {
    var title = paths[i].getAttribute('title');
    if (title) {
      paths[i].addEventListener('mouseover', function(event) {
        var tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = event.target.getAttribute('title');
        document.body.appendChild(tooltip);

        tooltip.style.left = event.clientX + 5 + 'px';
        tooltip.style.top = event.clientY + -20 + 'px'; // adjust the vertical position as needed
      });

      paths[i].addEventListener('mouseout', function(event) {
        var tooltip = document.querySelector('.tooltip');
        if (tooltip) {
          tooltip.parentNode.removeChild(tooltip);
        }
      });
    }
  }
}


function title2datetip() {
  var paths = document.querySelectorAll('path[id$="-day"]');

  for (var i = 0; i < paths.length; i++) {
    var title = paths[i].getAttribute('title');
    if (title) {
      paths[i].addEventListener('mouseover', function(event) {
        var tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = event.target.getAttribute('title');
        document.body.appendChild(tooltip);

        tooltip.style.left = event.clientX + 5 + 'px';
        tooltip.style.top = event.clientY + -20 + 'px'; // adjust the vertical position as needed
      });

      paths[i].addEventListener('mouseout', function(event) {
        var tooltip = document.querySelector('.tooltip');
        if (tooltip) {
          tooltip.parentNode.removeChild(tooltip);
        }
      });
    }
  }
}




/*LUNAR TIME*/

function getMoonPhaseEmoticon(date) {
  const phase = (((date.getTime() / 1000) - 753144) / (29.53059 * 86400)) % 1;
  if (phase < 0.035) return "🌑";
  if (phase < 0.215) return "🌒";
  if (phase < 0.285) return "🌓";
  if (phase < 0.465) return "🌔";
  if (phase < 0.535) return "🌕";
  if (phase < 0.715) return "🌖";
  if (phase < 0.785) return "🌗";
  return "🌘";
}

function addMoonPhaseTitle() {
  const currentDate = new Date();
  const phaseEmoticon = getMoonPhaseEmoticon(currentDate);

  const lunarPath = document.querySelector('svg path[id*="lunar"]');
  if (lunarPath) {
    const illuminatedFraction = Math.round(Math.abs(0.5 - (((currentDate.getTime() / 1000) - 753144) / (29.53059 * 86400)) % 0.5) * 200);
    const title = `Moon today: ${illuminatedFraction}% ${phaseEmoticon}`;
    lunarPath.setAttribute('title', title);
  }
}


function getIlluminatedFraction(date) {
  const julianDate = date / 86400000 + 2440587.5;
  const newMoon = 2451550.1;
  const synodicMonth = 29.53058867;

  const daysSinceNewMoon = julianDate - newMoon;
  const moonPhases = daysSinceNewMoon % synodicMonth;
  
  const phase = (moonPhases / synodicMonth) * 8;
  const phaseIndex = Math.floor((phase < 0 ? phase + 8 : phase) + 0.5) % 8;
  
  const illumination = Math.abs(50 * (1 - Math.cos((2 * Math.PI * moonPhases) / synodicMonth)));

  return {
    phaseIndex: phaseIndex,
    illuminatedFraction: illumination.toFixed(2),
  };
}

function displayCurrentMoonFraction() {
  const currentDate = new Date();
  const moonData = getIlluminatedFraction(currentDate);
  const moonPhaseEmoticon = getMoonPhaseAndIllumination(currentDate);

  const moonFractionDiv = document.querySelector('#moon-fraction');
  if (moonFractionDiv) {
    moonFractionDiv.innerHTML = `Moon: ${moonData.illuminatedFraction}% ${moonPhaseEmoticon}`;
  }
}





/*----------------------------

GUIDED TOUR


----------------------------*/

function closeTour() {
  // Get the modal and set its display to "block" to show it
  var modal = document.getElementById("guided-tour");
  modal.style.display = "none";
  document.getElementById("page-content").classList.remove("blur");
  tourTaken();
  // Reset the tour to the first window (index 0)
  //showInfo(0);
}
 
//
//function guidedTour() {
//  // Get the modal and set its display to "block" to show it
//  var modal = document.getElementById("guided-tour");
//  modal.style.display = "flex";
//
//  // Add the "blur" class to the page content to visually distinguish it from the modal
//  document.getElementById("page-content").classList.add("blur");
//
//  // Get the close button and set its onclick function to hide the modal and remove the "blur" class from the page content
//  // var closeButton = document.getElementByID("close-tour-button");
//  // closeButton.onclick = function() {
//  //   modal.style.display = "none";
//  //   document.getElementById("page-content").classList.remove("blur");
//  // }
//
//    // Get all the "information" elements (which contain the tour content) and set the currentInfo variable to 0 (the first element)
//  var information = document.querySelectorAll(".information");
//  var currentInfo = 0;
//
//  // Define a function to show the nth "information" element and hide the current one
//  function showInfo(infoIndex) {
//    // Check that the requested index is within the bounds of the array before attempting to show the information panel
//    if (infoIndex >= 0 && infoIndex < information.length) {
//      information[currentInfo].style.display = "none";
//      information[infoIndex].style.display = "block";
//      currentInfo = infoIndex;
//    }
//  }
//
//  // Set the onclick function for the first "Next" button to show the second "information" element
//  document.querySelector(".next:first-of-type").onclick = function() {
//    showInfo(1);
//  };
//
//  // Set the onclick function for the second "Next" button to show the third "information" element
//  document.querySelector("#information-two .next").onclick = function() {
//    showInfo(2);
//  };
//
//  // Set the onclick function for the third "Next" button to show the fourth "information" element
//  document.querySelector("#information-three .next").onclick = function() {
//    showInfo(3);
//  };
//
//  // Set the onclick function for the fourth "Next" button to show the fifth "information" element
//  document.querySelector("#information-four .next").onclick = function() {
//    showInfo(4);
//  };
//
//    // Set the onclick function for the fith "Next" button to show the six "information" element
//    document.querySelector("#information-five .next").onclick = function() {
//      showInfo(5);
//    };
//
//  // Set the onclick function for the fifth "Next" button to hide the modal and remove the "blur" class from the page content
//  // document.querySelector("#information-six .next").onclick = function() {
//  //   modal.style.display = "none";
//  //   document.getElementById("page-content").classList.remove("blur");
//  //   showInfo(0);
//  //   tourTaken();
//  // };
//
//// Set the onclick function for the "Back" button in the third "information" element to show the second "information" element
//document.querySelector("#information-two .back").onclick = function() {
//showInfo(0);
//};
//// Set the onclick function for the "Back" button in the third "information" element to show the second "information" element
//document.querySelector("#information-three .back").onclick = function() {
//showInfo(1);
//};
//
//// Set the onclick function for the "Back" button in the fourth "information" element to show the third "information" element
//document.querySelector("#information-four .back").onclick = function() {
//showInfo(2);
//};
//
//// Set the onclick function for the "Back" button in the fifth "information" element to show the fourth "information" element
//document.querySelector("#information-five .back").onclick = function() {
//showInfo(3);
//};
//
//// Set the onclick function for the "Back" button in the fifth "information" element to show the fourth "information" element
//document.querySelector("#information-six .back").onclick = function() {
//  showInfo(4);
//  };
//
//}

function guidedTour() {
  const modal = document.getElementById("guided-tour");
  modal.style.display = "flex";
  document.getElementById("page-content").classList.add("blur");

  // Always reset to slide 1 so re-opening starts from the beginning
  const information = document.querySelectorAll(".information");
  information.forEach((el, i) => {
    el.style.display = i === 0 ? "block" : "none";
  });
  let currentInfo = 0;

  const translationVersion = '1.5';

  import(`../translations/${userLanguage}.js?v=${translationVersion}`).then(module => {
    const t = module.translations.tour;

    // Populate tour text with specific button labels
    document.getElementById("tour-header-1").innerText = t.welcomeIntro;
    document.getElementById("tour-desc-1").innerText = t.welcomeParagraph;
    document.getElementById("next-1").innerText = t.buttonNextWelcome;

    document.getElementById("tour-header-2").innerText = t.oneOrbitTitle;
    document.getElementById("tour-desc-2").innerText = t.oneOrbitDesc;
    document.getElementById("back-2").innerText = t.buttonBack;
    document.getElementById("next-2").innerText = t.buttonNextOrbit;

    document.getElementById("tour-header-3").innerText = t.neighborhoodTitle;
    document.getElementById("tour-desc-3").innerText = t.neighborhoodDesc;
    document.getElementById("back-3").innerText = t.buttonBack;
    document.getElementById("next-3").innerText = t.buttonNextPlanets;

    document.getElementById("tour-header-4").innerText = t.getLunarTitle;
    document.getElementById("tour-desc-4").innerText = t.getLunarDesc;
    document.getElementById("back-4").innerText = t.buttonBack;
    document.getElementById("next-4").innerText = t.buttonNextMoon;

    document.getElementById("tour-desc-5").innerText = t.animalCyclesDesc;
    document.getElementById("back-5").innerText = t.buttonBack;
    document.getElementById("next-5").innerText = t.buttonNextCycles;

    document.getElementById("tour-header-6").innerText = t.addEventsTitle;
    document.getElementById("tour-desc-6").innerText = t.addEventsDesc;
    document.getElementById("back-6").innerText = t.buttonBack;
    document.getElementById("done").innerText = t.buttonDone;
  });

  function showInfo(index) {
    if (index >= 0 && index < information.length) {
      information[currentInfo].style.display = "none";
      information[index].style.display = "block";
      currentInfo = index;
    }
  }

  document.getElementById("next-1").onclick = () => showInfo(1);
  document.getElementById("next-2").onclick = () => showInfo(2);
  document.getElementById("next-3").onclick = () => showInfo(3);
  document.getElementById("next-4").onclick = () => showInfo(4);
  document.getElementById("next-5").onclick = () => showInfo(5);

  document.getElementById("back-2").onclick = () => showInfo(0);
  document.getElementById("back-3").onclick = () => showInfo(1);
  document.getElementById("back-4").onclick = () => showInfo(2);
  document.getElementById("back-5").onclick = () => showInfo(3);
  document.getElementById("back-6").onclick = () => showInfo(4);
}




const initializeCometSystem = () => {
    if (initializeCometSystem.__initialized) {
        return;
    }

    initializeCometSystem.__initialized = true;

    const cometButton = document.getElementById("comet-button");
    const cometSystem = document.getElementById("comet_system");

    if (!cometSystem) {
        return;
    }

    const computedDisplay = window.getComputedStyle(cometSystem).display;
    cometSystem.dataset.cometVisible = computedDisplay !== "none" ? "true" : "false";

    if (!cometSystem.style.transition) {
        cometSystem.style.transition = "opacity 0.6s ease";
    }

    let hideTimeoutId = null;
    let nextCometAnimationOptions = null;
    let cometAnimationInitialized = false;

    const hideCometSystem = (options = {}) => {
        cometSystem.dataset.cometVisible = "false";
        cometSystem.style.opacity = "0";

        if (hideTimeoutId !== null) {
            window.clearTimeout(hideTimeoutId);
            hideTimeoutId = null;
        }

        const finalizeHide = () => {
            if (cometSystem.dataset.cometVisible === "true") {
                return;
            }
            cometSystem.style.display = "none";
        };

        if (options.immediate) {
            finalizeHide();
        } else {
            hideTimeoutId = window.setTimeout(finalizeHide, 300);
        }
    };

    const animateCometIfPossible = (animationOptions) => {
        if (typeof animateCometTrajectory !== "function") {
            return;
        }

        try {
            if (animationOptions) {
                animateCometTrajectory(undefined, animationOptions);
            } else {
                animateCometTrajectory();
            }
        } catch (error) {
            console.error("Unable to animate comet trajectory.", error);
        }
    };

    const showCometSystem = () => {
        if (hideTimeoutId !== null) {
            window.clearTimeout(hideTimeoutId);
            hideTimeoutId = null;
        }

        cometSystem.style.display = "block";
        // Force reflow so opacity transition animates reliably
        void cometSystem.offsetWidth;
        cometSystem.style.opacity = "1";
        cometSystem.dataset.cometVisible = "true";

        const pendingAnimationOptions = nextCometAnimationOptions;
        nextCometAnimationOptions = null;
        animateCometIfPossible(pendingAnimationOptions);
    };

    const coerceLoginBoolean = (value) => {
        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "number") {
            return value !== 0;
        }

        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (["true", "1", "yes", "logged_in"].includes(normalized)) {
                return true;
            }

            if (["false", "0", "no", "logged_out"].includes(normalized)) {
                return false;
            }
        }

        return null;
    };

    const parseJsonSafely = (value) => {
        if (!value || typeof value !== "string") {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    };

    const decodeJwtPayload = (token) => {
        if (!token || typeof token !== "string") {
            return null;
        }

        try {
            const parts = token.split(".");
            if (parts.length < 2) {
                return null;
            }
            const payload = parts[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");
            const decoded = atob(payload);
            return JSON.parse(decoded);
        } catch (error) {
            return null;
        }
    };

    const isPayloadFresh = (payload) => {
        if (!payload || typeof payload !== "object") {
            return false;
        }

        if (!payload.exp) {
            return true;
        }

        const exp = Number(payload.exp);
        if (Number.isNaN(exp)) {
            return true;
        }

        return exp > Math.floor(Date.now() / 1000);
    };

    const resolveStoredAuthPayload = () => {
        if (typeof window === "undefined") {
            return null;
        }

        const sources = [];

        if (window.sessionStorage) {
            sources.push(() => parseJsonSafely(window.sessionStorage.getItem("buwana_user")));
        }

        if (window.localStorage) {
            sources.push(() => parseJsonSafely(window.localStorage.getItem("user_profile")));
            sources.push(() => decodeJwtPayload(window.localStorage.getItem("id_token")));
            sources.push(() => decodeJwtPayload(window.localStorage.getItem("access_token")));
        }

        if (typeof window.name === "string" && window.name.trim()) {
            sources.push(() => {
                const payload = parseJsonSafely(window.name);
                return payload?.__earthcal_oidc || null;
            });
        }

        for (const readSource of sources) {
            try {
                const payload = readSource();
                if (payload?.buwana_id && isPayloadFresh(payload)) {
                    return payload;
                }
            } catch (error) {
                console.warn("⚠️ Unable to read stored authentication payload for comet system.", error);
            }
        }

        return null;
    };

    const deriveLoginState = (loginState) => {
        if (typeof loginState === "boolean") {
            return loginState;
        }

        if (!loginState || typeof loginState !== "object") {
            return null;
        }

        const explicitFlag =
            coerceLoginBoolean(
                loginState.isLoggedIn ??
                    loginState.loggedIn ??
                    loginState.authenticated ??
                    loginState.status,
            );
        if (typeof explicitFlag === "boolean") {
            return explicitFlag;
        }

        const candidatePayload =
            loginState.payload ??
            loginState.user ??
            loginState.session ??
            null;

        if (candidatePayload?.buwana_id && isPayloadFresh(candidatePayload)) {
            return true;
        }

        if (loginState.buwana_id && isPayloadFresh(loginState)) {
            return true;
        }

        return null;
    };

    const isUserLoggedInForComet = () => {
        let loginState;

        if (typeof isLoggedIn === "function") {
            try {
                loginState = isLoggedIn({ returnPayload: true });
            } catch (error) {
                console.warn(
                    "⚠️ Unable to determine login status before showing the comet system.",
                    error,
                );
            }
        }

        const derived = deriveLoginState(loginState);
        if (typeof derived === "boolean") {
            return derived;
        }

        return Boolean(resolveStoredAuthPayload());
    };

    const promptLoginForCometAccess = () => {
        const message =
            "Sorry, to use the comet functionality you must first log in to your Buwana account.";

        showCometSystem();

        const finalizePrompt = () => {
            if (typeof sendUpRegistration === "function") {
                try {
                    sendUpRegistration();
                } catch (error) {
                    console.error("Unable to open the login view after comet alert.", error);
                }
            } else {
                console.warn(
                    "⚠️ sendUpRegistration is not available; unable to display the login view after comet alert.",
                );
            }

            hideCometSystem({ immediate: true });
        };

        window.setTimeout(() => {
            window.alert(message);
            finalizePrompt();
        }, 0);
    };

    const getCometAccessSnapshot = () => {
        const fallbackLoggedIn = isUserLoggedInForComet();
        const fallbackPlan = (window.user_plan || "").toString().trim().toLowerCase();

        const sharedState = window.cometAccessState;
        if (sharedState && typeof sharedState === "object") {
            const normalizedPlan =
                sharedState.plan ??
                sharedState.planType ??
                sharedState.subscription ??
                fallbackPlan;

            return {
                loggedIn: Boolean(
                    sharedState.loggedIn ??
                        sharedState.isLoggedIn ??
                        sharedState.authenticated ??
                        fallbackLoggedIn,
                ),
                plan: (normalizedPlan || "").toString().trim().toLowerCase(),
                planId: sharedState.planId ?? sharedState.plan_id ?? null,
                lastUpdated: sharedState.lastUpdated ?? sharedState.updatedAt ?? null,
                source: sharedState.source || "cometAccessState",
            };
        }

        return {
            loggedIn: Boolean(fallbackLoggedIn),
            plan: fallbackPlan,
            planId: null,
            lastUpdated: null,
            source: "fallback",
        };
    };

    const toggleCometSystem = () => {
        const isVisible = cometSystem.dataset.cometVisible === "true";

        if (isVisible) {
            hideCometSystem();
            return false;
        }

        showCometSystem();

        return false;
    };

    const isOfflineModeActive = () => {
        if (window.isOfflineMode === true || window.isForcedOffline === true) {
            return true;
        }

        if (typeof getSavedOfflineMode === "function") {
            try {
                if (getSavedOfflineMode() === "offline") {
                    return true;
                }
            } catch (error) {
                console.warn("⚠️ Unable to read saved offline mode before comet update.", error);
            }
        }

        if (typeof isForcedOfflineEnabled === "function") {
            try {
                if (isForcedOfflineEnabled()) {
                    return true;
                }
            } catch (error) {
                console.warn("⚠️ Unable to read forced offline mode before comet update.", error);
            }
        }

        try {
            return localStorage.getItem("earthcal_offline_mode") === "offline";
        } catch (error) {
            console.warn("⚠️ Unable to read offline mode from storage before comet update.", error);
        }

        try {
            return localStorage.getItem("earthcal_forced_offline") === "true";
        } catch (error) {
            console.warn("⚠️ Unable to read forced offline flag before comet update.", error);
        }

        return false;
    };

    const updateCometTrajectory = (event, requestedTargetDate) => {
        if (event?.preventDefault) {
            event.preventDefault();
        }
        if (event?.stopPropagation) {
            event.stopPropagation();
        }

        const activeTargetDate = requestedTargetDate ?? targetDate;

        const accessSnapshot = getCometAccessSnapshot();
        const userLoggedIn = Boolean(accessSnapshot.loggedIn);
        const offlineModeEnabled = isOfflineModeActive();
        console.info("🛰️ updateCometTrajectory invoked", {
            loggedIn: userLoggedIn,
            plan: accessSnapshot.plan || "unknown",
            planId: accessSnapshot.planId ?? "unknown",
            offlineMode: offlineModeEnabled,
            lastUpdated: accessSnapshot.lastUpdated ?? "n/a",
            source: accessSnapshot.source,
            timestamp: new Date().toISOString(),
        });

        if (!userLoggedIn && !offlineModeEnabled) {
            promptLoginForCometAccess();
            return false;
        }

        if (typeof renderCometTrajectoryInfo === "function") {
            try {
                renderCometTrajectoryInfo(activeTargetDate);
            } catch (error) {
                console.warn("⚠️ Unable to render comet info before toggling the system.", error);
            }
        }

        const isCometVisible = cometSystem.dataset.cometVisible === "true";
        if (!isCometVisible) {
            if (!cometAnimationInitialized) {
                nextCometAnimationOptions = { skipAnimation: true };
                cometAnimationInitialized = true;
            } else {
                nextCometAnimationOptions = null;
            }
        } else {
            nextCometAnimationOptions = null;
        }

        return toggleCometSystem();
    };

    if (cometButton && !cometButton.hasAttribute("onclick")) {
        cometButton.addEventListener("click", (event) => updateCometTrajectory(event, targetDate));
    }

    window.toggleCometSystem = toggleCometSystem;
    window.hideCometSystem = hideCometSystem;
    window.updateCometTrajectory = updateCometTrajectory;
};

// ============================================================
// LOCATION HELPERS
// ============================================================

/**
 * Returns the user's geographic coordinates.
 * Reads location_lat / location_long from window.userProfile (populated by
 * login-scripts.js from the Buwana buwana:bioregion JWT scope).
 * Falls back to Stonehenge, UK when no user location is available.
 * @returns {{ lat: number, lon: number, isDefault: boolean }}
 */
function getUserLocation() {
    const lat = window.userProfile?.location_lat;
    const lon = window.userProfile?.location_long;
    if (typeof lat === 'number' && typeof lon === 'number') {
        return { lat, lon, isDefault: false };
    }
    // Stonehenge, UK — EarthCal default
    return { lat: 51.1789, lon: -1.8262, isDefault: true };
}
window.getUserLocation = getUserLocation;

/**
 * If the logged-in user has no buwana:bioregion location set and hasn't
 * already dismissed this prompt, show a modal asking them to update their
 * Buwana profile or accept the Stonehenge default.
 */
function promptForBuwanaLocation() {
    if (!window.isLoggedIn || !window.isLoggedIn()) return;
    const profile = window.userProfile;
    if (!profile) return;

    // Already has coordinates — nothing to do
    if (typeof profile.location_lat === 'number' && typeof profile.location_long === 'number') return;

    // User already chose the default — don't nag again
    if (localStorage.getItem('earthcal_location_accepted_default') === 'true') return;

    if (typeof showFormModalAlert !== 'function') return;

    const buwanaId = profile.buwana_id || '';
    const profileUrl = `https://buwana.ecobricks.org/en/edit-profile.php?buwana=${buwanaId}&app=ecal_7f3da821d0a54f8a9b58`;

    showFormModalAlert({
        title: 'Add Your Location',
        message: [
            'EarthCal can personalize moon position, parallactic angle, and sunrise/sunset times for your location.',
            "Your Buwana profile doesn't include location coordinates yet. Add them to get accurate local sky data."
        ],
        actions: [
            {
                label: 'Update Buwana Profile',
                className: 'ec-button-primary',
                onClick: () => {
                    window.open(profileUrl, '_blank', 'noopener');
                    closeFormModalAlert();
                }
            },
            {
                label: 'Use Stonehenge Default',
                className: 'ec-button-secondary',
                onClick: () => {
                    localStorage.setItem('earthcal_location_accepted_default', 'true');
                    closeFormModalAlert();
                }
            }
        ],
        footerMessage: 'Location is used only for local sky calculations — it is never shared.'
    });
}
window.promptForBuwanaLocation = promptForBuwanaLocation;

function showMacOSModal() {
    const modal = document.getElementById('form-modal-alert');
    const messageEl = document.getElementById('form-modal-alert-message');
    const actionsEl = document.getElementById('form-modal-alert-actions');
    if (!modal || !messageEl || !actionsEl) return;

    const modalCard = modal.querySelector('.form-modal-alert-card');

    // Remove any card-level preview from a previous alert
    const existingPreview = modalCard ? modalCard.querySelector('.form-modal-alert-preview') : null;
    if (existingPreview) existingPreview.remove();

    // Build message
    messageEl.innerHTML = '';

    const logo = document.createElement('img');
    logo.src = 'svgs/macOS.svg?v=2';
    logo.alt = 'macOS';
    logo.className = 'macos-modal-logo';
    messageEl.appendChild(logo);

    const heading = document.createElement('h2');
    heading.className = 'form-modal-alert-title macos-modal-title';
    const headingText = document.createElement('span');
    headingText.textContent = 'EarthCal for MacOS';
    const unlockIcon = document.createElement('span');
    unlockIcon.className = 'pure-unlocked-icon macos-modal-unlock-icon';
    unlockIcon.setAttribute('aria-hidden', 'true');
    heading.appendChild(unlockIcon);
    heading.appendChild(headingText);
    messageEl.appendChild(heading);

    const p1 = document.createElement('p');
    p1.textContent = "There's no better place to run EarthCal than full screen on your Mac! As an EarthCal Jedi user you have access to our native MacOS version (requires) Sequoia and above). As EarthCal makes complex astronomical calculations M1 processors and above are recommended.";
    messageEl.appendChild(p1);

    actionsEl.innerHTML = '';

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'macos-dmg-download-btn';
    downloadBtn.innerHTML = '<span class="macos-dmg-icon"><img src="assets/icons/apple_logo.png" alt="" width="20" height="20"></span><span class="macos-dmg-label">Download EarthCal DMG v1.3</span>';
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = 'https://earthcal.app/downloads/EarthCal_1.3.7.dmg';
        link.download = 'EarthCal_1.3.7.dmg';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    actionsEl.appendChild(downloadBtn);

    const footnote = document.createElement('p');
    footnote.className = 'macos-dmg-footnote';
    footnote.textContent = 'EarthCal is not yet on the MacStore so you will need to manually install by dragging the EarthCal icon to your Application folder.';
    actionsEl.appendChild(footnote);

    if (modalCard) {
        let footerEl = modalCard.querySelector('#form-modal-alert-footer');
        if (footerEl) {
            footerEl.textContent = '';
            footerEl.style.display = 'none';
        }
    }

    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    modal.setAttribute('aria-hidden', 'false');
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeCometSystem, { once: true });
    } else {
        initializeCometSystem();
    }
}
