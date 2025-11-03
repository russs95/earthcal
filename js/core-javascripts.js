
/* EARTHCYCLES CALENDAR PRIMARY JAVASCRIPTS */

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

  updateWeekTitles(currentYear);
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


let modalOpen = false;

async function openMainMenu() {
    const modal = document.getElementById("main-menu-overlay");
    const content = document.getElementById("main-menu-content");

    const lang = userLanguage?.toLowerCase() || 'en';
    const { mainMenu } = await loadTranslations(lang);

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

    const appClientId = payload?.aud || payload?.client_id || 'unknown';
    const feedbackUrl = resolvedBuwanaId
        ? `https://buwana.ecobricks.org/${lang}/feedback.php?buwana=${encodeURIComponent(resolvedBuwanaId)}&app=${encodeURIComponent(appClientId)}`
        : `https://buwana.ecobricks.org/${lang}/feedback.php`;

    const userPlan = (window.user_plan || '').toLowerCase();
    const planName = userPlan === 'jedi'
        ? 'Time Jedi'
        : userPlan === 'padwan'
            ? 'Padwan'
            : (window.user_plan ? String(window.user_plan) : 'Padwan');
    const planClass = userPlan === 'jedi' ? 'menu-plan-pill-jedi' : 'menu-plan-pill-padwan';
    const upgradeMenuText = userPlan === 'padwan'
        ? 'Upgrade for Time Jedi features'
        : 'Manage Subscription';
    const showSubscriptionLink = Boolean(window.user_plan);

    content.innerHTML = `
        <div id="main-menu-box">
            <div class="earthcal-app-logo">
                <img src="svgs/earthcal-icon.svg" alt="EarthCal Logo" title="${mainMenu.title}">
            </div>

       
        <div id="all-the-main-menu-items"></div>
            <div class="menu-page-item" onclick="sendDownRegistration(); closeMainMenu(); setTimeout(guidedTour, 500);">
                ${mainMenu.featureTour}
            </div>
    
            <div class="menu-page-item" onclick="sendDownRegistration(); closeMainMenu(); setTimeout(showIntroModal, 500);">
                ${mainMenu.latestVersion}
            </div>
            <div class="menu-page-item">
                <a href="https://guide.earthen.io/" target="_blank">${mainMenu.guide}</a>
            </div>
    
            <div class="menu-page-item">
                <a href="https://guide.earthen.io/about" target="_blank">${mainMenu.about}</a>
            </div>
     
            <div class="menu-page-item">
                <div role="button" tabindex="0" class="menu-feedback-link" onclick="closeMainMenu(); window.open('${feedbackUrl}', '_blank');" onkeypress="if(event.key==='Enter' || event.key===' ') { event.preventDefault(); closeMainMenu(); window.open('${feedbackUrl}', '_blank'); }">
                    Feedback &amp; Bugs
                </div>
            </div>
                     <div class="menu-plan-status">
            <span class="menu-plan-pill ${planClass}">${planName} Plan</span>
            ${userPlan === 'padwan' ? `<button type="button" class="menu-plan-upgrade" onclick="manageEarthcalUserSub();">Upgrade for Time Jedi features</button>` : ''}
        </div>
        </div>
        
        <div id="main-menu-footer">
            <a href="https://snapcraft.io/earthcal" style="margin-top:30px">
                <img alt="Get it from the Snap Store" src="svgs/snap-store-black.svg" style="max-width:111px;width:100%;height:auto;" />
            </a>
    
            <p style="font-size:small; margin-bottom: 2px;">
                ${mainMenu.developedBy} <a href="https://earthen.io/earthcal-v0-9/" target="_blank">Earthen.io</a>  ${mainMenu.authBy} <a href="https://buwana.ecobricks.org/en/" target="_blank">Buwana</a>
            </p>
        </div>
    `;

    modal.style.width = "100%";
    document.body.style.overflowY = "hidden";
    document.body.style.maxHeight = "101vh";

    modal.setAttribute("tabindex", "0");
    modal.focus();
    modalOpen = true;

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
                <p id="sales-pitch">The way we perceive and track our time on planet Earth is fundamental to the harmony we find with the cycles of life. EarthCal is a powerful tool to transition from linear and rectangular time-thinking, to circular and cyclical time. Our free Padwan subscription gives you all you need to get going with EarthCal, while our Jedi subscription gives you access to the latest and greatest features.</p>
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
            <p>Checking your subscription&hellip;</p>
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
        'Create events, to-dos and journals.',
        'Visualize your date-items over real-time Earthen cycles.',
        'Create and manage various personal calendars.',
        'Create or subscribe to public calendars.',
        'View the planet positions and orbits for any date.',
        'View detailed lunar information for any date.',
        'View detailed orbital stats for the inner planets for any date.',
        'View migrations of great creatures for any date.',
        'Search by date for future and past planetary positions.',
        'Sync with Ubuntu desktop app',
    ];

    const jediFeatureList = [
        'Subscribe to Google calendars',
        'Subscribe to Apple calendars (coming soon)',
        'Subscribe to Outlook calendars (coming soon)',
        'Subscribe to public iCal feeds',
        'Toggle between Day and Night modes',
        'Access Mac desktop app (coming soon)',
        'Support the development of EarthCal into an even more awesome tool!',
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
        const [subscriptionResponse, plansResponse] = await Promise.all([
            fetch('api/v1/check_user_sub.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: user.buwana_id }),
            }),
            fetch('api/v1/get_earthcal_plans.php', {
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

        const planMessage = currentPlanName
            ? `You are currently using the ${escapeHtml(currentPlanName)} plan.`
            : '';

        const intervalOrder = ['month', 'year', 'lifetime'];
        const firstAvailableInterval = intervalOrder.find((interval) => jediByInterval[interval]) || 'month';

        const jediPriceAttr = (interval, key) => escapeHtml(jediPriceData[interval]?.[key] || 'Coming soon');

        const userPlanType = window.user_plan === 'jedi' ? 'jedi' : 'padwan';
        const padwanCardClass = '';
        const jediCardClass = ' current-plan';
        const upgradeButtonHtml = userPlanType === 'padwan'
            ? `
                <div class="ec-plan-actions">
                    <button type="button" class="confirmation-blur-button greenback" onclick="upgradeUserPlan()">Upgrade</button>
                </div>
            `
            : '';

        modalContent.innerHTML = `
            <div class="ec-subscription-modal">
                <h1>Upgrade EarthCal</h1>
                <p id="sales-pitch">The way we perceive and track our time on planet Earth is fundamental to the harmony we find with the cycles of life. EarthCal is a powerful tool to transition from linear and rectangular time-thinking, to circular and cyclical time. Our free Padwan subscription gives you all you need to get going with EarthCal, while our Jedi subscription gives you access to the latest and greatest features.</p>
                ${planMessage ? `<div class="ec-plan-current-label">${planMessage}</div>` : ''}
                <div class="ec-plan-toggle" role="group" aria-label="Choose billing interval">
                    <span class="ec-toggle-indicator"></span>
                    <button type="button" class="ec-toggle-option" data-interval="month" aria-pressed="false">Monthly</button>
                    <button type="button" class="ec-toggle-option" data-interval="year" aria-pressed="false">Yearly</button>
                    <button type="button" class="ec-toggle-option" data-interval="lifetime" aria-pressed="false">Lifetime</button>
                </div>
                <div class="ec-plan-columns">
                    <div class="ec-plan-card${padwanCardClass}">
                        <h2>${escapeHtml(padwanPlan?.name || 'Padwan Plan')}</h2>
                        <div class="ec-plan-price">${escapeHtml(padwanPriceData.priceText)}</div>
                        ${padwanPriceData.intervalText ? `<div class="ec-plan-interval">${escapeHtml(padwanPriceData.intervalText)}</div>` : ''}
                        ${renderFeatures(padwanPlan)}
                    </div>
                    <div class="ec-plan-card${jediCardClass}">
                        <h2>${escapeHtml(jediDisplayPlan?.name || 'Jedi Plan')}</h2>
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


function focusMainMenuRestrict(event) {
    const modal = document.getElementById("main-menu-overlay");
    if (modalOpen && !modal.contains(event.target)) {
        event.stopPropagation();
        modal.focus();
    }
}

function closeMainMenu() {
    const modal = document.getElementById("main-menu-overlay");
    modal.style.width = "0%";
    document.body.style.overflowY = "unset";
    document.body.style.maxHeight = "unset";

    modalOpen = false;

    // Cleanup event listeners
    document.removeEventListener("focus", focusMainMenuRestrict, true);
}
function modalCloseCurtains(event) {
    if (!event.key || event.key === "Escape") {
        closeMainMenu();
    }
}

document.addEventListener("keydown", modalCloseCurtains);



function upgradeUserPlan() {
    alert("We're still working on plan upgrading!  Don't worry, while we develop this, all user's have full access to Earthcal features.  Enjoy.");
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


  
 
  function calendarRefresh() {
    // Phase 1: instant animations
    updateTargetMonth();
    displayDayInfo(targetDate, userLanguage, userTimeZone);
    // getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    //Sets the lunar month for the target date
    resetPaths();
    updateTargetDay();
  // Phase 2: animations after 0.1sec

    // Animate planets only when the Planet objects are available.
    // Without this check, `mercury`, `venus`, etc. may resolve to DOM
    // elements before `planet-orbits-2.js` initialises the Planet
    // instances, causing Element.animate to be invoked without
    // arguments.  Guarding the calls ensures we only trigger the
    // custom animation logic once the objects exist.
    if (typeof Planet !== "undefined") {
      [mercury, venus, earth, mars, jupiter, saturn, uranus, neptune].forEach(
        (planet) => {
          if (planet instanceof Planet) {
            planet.animate();
          }
        }
      );
    }

    animateWhaleCycle(targetDate);
    UpdateWhaleCycle(targetDate);
       updateStorkCycle(targetDate);




    // Phase 3: Actions after 1 sec

    highlightDateCycles(targetDate);
    //displayMatchingDateCycle();


    // getFirstNewMoon(targetDate);  //Rotate lunar months into alignment with first new moon
    // setLunarMonthForTarget(targetDate);
    

    dayOfYear = getDayOfYear(targetDate);
    const currentYearText = document.getElementById('current-year').querySelector('tspan');
    currentYearText.textContent = targetDate.getFullYear().toString();
    const currentYear = parseInt(currentYearText.textContent);

   setLunarMonthForTarget(targetDate, currentYear);

   setTimeout(function() {
    displayMoonPhaseInDiv(targetDate);

    displayMoonPhaseInDiv(targetDate);

    ensurePlanetData(targetDate);

    // redisplayTargetData();
    startDate = targetDate;
  }, 1000);

}

function set2Tomorrow() {
  // This function sets the target date to tomorrow and then refreshes the calendar
  // targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1); // Sets the target date to tomorrow
  calendarRefresh(); // Call the calendarRefresh function
  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "none";
  // document.getElementById("yesterday").style.display = "none";
  // document.getElementById("current-time").style.display = "none";

  
}

function set2Yesterday() {
  // This function sets the target date to yesterday and then refreshes the calendar
  // targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 1); // Sets the target date to yesterday
  calendarRefresh(); // Call the calendarRefresh function
  // document.getElementById("reset").style.display = "block";
  // document.getElementById("tomorrow").style.display = "none";
  // document.getElementById("yesterday").style.display = "none";
  // document.getElementById("current-time").style.display = "none";




}

function set2Today() {
  setCurrentDate();  // Reset target date to the current date
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

  const translationVersion = '1.2';

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

  const information = document.querySelectorAll(".information");
  let currentInfo = 0;

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
