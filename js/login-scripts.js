

/*-------------
LOGIN FUNCTIONS
----------------*/

// Declare globally near the top of your app
let userLanguage = null;
let userTimeZone = null;
let userProfile = null;


async function getUserData() {
    const sessionStatus = document.getElementById('user-session-status');
    console.log("🌿 getUserData: Starting...");

    // 1️⃣ Retrieve full profile from localStorage
    const profileString = localStorage.getItem("user_profile");
    if (!profileString) {
        console.warn("[EarthCal] Sorry, no user_profile found in localStorage.");
        updateSessionStatus("⚪ Not logged in: no profile stored");
        useDefaultUser();
        return;
    }

    let idPayload = null;
    try {
        idPayload = JSON.parse(profileString);
    } catch (e) {
        console.error("[EarthCal] Failed to parse user_profile:", e);
        updateSessionStatus("⚪ Not logged in: profile parse error");
        useDefaultUser();
        return;
    }

    // 2️⃣ Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (idPayload.exp < now) {
        console.warn("[EarthCal] ID token expired.");
        updateSessionStatus("⚪ Not logged in: token expired");
        useDefaultUser();
        return;
    }

    // 3️⃣ Validate buwana_id
    const buwanaId = idPayload.buwana_id || null;
    if (!buwanaId) {
        console.error("[EarthCal] Missing buwana_id in stored profile.");
        updateSessionStatus("⚪ Not logged in: buwana_id missing");
        useDefaultUser();
        return;
    }

    // 4️⃣ Populate global state
    userLanguage = navigator.language.slice(0, 2);
    userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    userProfile = {
        first_name: idPayload.given_name || "Earthling",
        email: idPayload.email || null,
        buwana_id: buwanaId,
        earthling_emoji: idPayload["buwana:earthlingEmoji"] || "🌎",
        community: idPayload["buwana:community"] || null,
        continent: idPayload["buwana:location.continent"] || null,
        status: idPayload["status"] || "returning"  // ✅ Pick status from payload if present
    };

    console.log("[EarthCal] User profile loaded from localStorage:", userProfile);

    displayUserData(userTimeZone, userLanguage);
    setCurrentDate(userTimeZone, userLanguage);

    // 5️⃣ Load calendar data
    try {
        const calResponse = await fetch('https://buwana.ecobricks.org/earthcal/fetch_all_calendars.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buwana_id: buwanaId }),
            credentials: 'include'
        });

        const calendarData = await calResponse.json();

        if (calendarData.success) {
            showLoggedInView(calendarData);
            updateSessionStatus(`${userProfile.earthling_emoji} Logged in as ${userProfile.first_name} `);
        } else {
            console.error('Calendar fetch failed:', calendarData.message || 'Unknown error');
            updateSessionStatus("⚪ Not logged in: calendar fetch failed");
            useDefaultUser();
        }
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        updateSessionStatus("⚪ Not logged in: calendar fetch error");
        useDefaultUser();
    }
}


function isDarkModeActive() {
    const darkModeStyles = document.querySelectorAll('link[rel="stylesheet"][media*="prefers-color-scheme"][media*="dark"]');
    for (const link of darkModeStyles) {
        if (!link.disabled && link.media === 'all') {
            return true;
        }
    }
    return false;
}

function updateSessionStatus(message) {
    const sessionStatus = document.getElementById('user-session-status');
    const regUpButton = document.getElementById('reg-up-button');

    if (sessionStatus) {
        sessionStatus.textContent = message;

        if (regUpButton) {
            const darkMode = isDarkModeActive();

            const bgNormal = darkMode
                ? '../svgs/up-reg-arrow-dark-active.svg'
                : '../svgs/up-reg-arrow-light-active.svg';

            const bgHover = darkMode
                ? '../svgs/up-reg-arrow-dark-active-hover.svg'
                : '../svgs/up-reg-arrow-light-active-hover.svg';

            regUpButton.style.background = `url(${bgNormal}) center no-repeat`;
            regUpButton.style.backgroundSize = 'contain';

            regUpButton.onmouseover = () => {
                regUpButton.style.background = `url(${bgHover}) center no-repeat`;
            };
            regUpButton.onmouseout = () => {
                regUpButton.style.background = `url(${bgNormal}) center no-repeat`;
            };
        }
    } else {
        setTimeout(() => updateSessionStatus(message), 100);
    }
}



async function checkBuwanaSessionStatus() {
    const statusEl = document.getElementById('user-session-status');
    if (!statusEl) return;

    // Check if id_token exists
    const id_token = localStorage.getItem("id_token");
    if (!id_token) {
        statusEl.textContent = "⚪ Not logged in: no token";
        return;
    }

    // Decode token payload
    let payload;
    try {
        payload = JSON.parse(atob(id_token.split('.')[1]));
    } catch (e) {
        console.error("[SessionStatus] Invalid token format:", e);
        statusEl.textContent = "⚪ Not logged in: invalid token";
        return;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
        statusEl.textContent = "⚪ Not logged in: token expired";
        return;
    }

    // OPTIONAL: Verify remotely with Buwana
    try {
        const verifyResp = await fetch("https://buwana.ecobricks.org/.well-known/jwks.php", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token })
        });

        const verifyData = await verifyResp.json();
        if (verifyData.valid) {
            statusEl.textContent = `🟢 Logged in as ${payload.given_name} ${payload["buwana:earthlingEmoji"] || "🌍"}`;
        } else {
            statusEl.textContent = "⚪ Not logged in: server rejected token";
        }
    } catch (err) {
        console.error("[SessionStatus] Verification error:", err);
        statusEl.textContent = "⚪ Error checking session";
    }
}





function useDefaultUser() {
    userLanguage = navigator.language.slice(0, 2);
    userTimeZone = "America/New_York";
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


//
// function checkUserSession() {
//     const id_token = localStorage.getItem('id_token');
//     if (!id_token) {
//         console.log("No ID token found.");
//         return false;
//     }
//
//     try {
//         // Decode payload
//         const parts = id_token.split('.');
//         if (parts.length !== 3) {
//             console.error("Malformed ID token structure.");
//             return false;
//         }
//
//         const payload = JSON.parse(atob(parts[1]));
//
//         // Check standard claims
//         const now = Math.floor(Date.now() / 1000);
//         const leeway = 60; // allow 1 minute clock skew
//
//         if (!payload.exp || payload.exp < (now - leeway)) {
//             console.warn("ID token expired.");
//             return false;
//         }
//
//         if (!payload.iat || payload.iat > (now + leeway)) {
//             console.warn("ID token issued in the future.");
//             return false;
//         }
//
//         if (!payload.iss || payload.iss !== "https://buwana.ecobricks.org") {
//             console.warn("Unexpected issuer.");
//             return false;
//         }
//
//         if (!payload.aud || payload.aud !== "ecal_7f3da821d0a54f8a9b58") {
//             console.warn("Unexpected audience.");
//             return false;
//         }
//
//         return true;  // ✅ Token looks valid
//     } catch (e) {
//         console.error("Error parsing ID token:", e);
//         return false;
//     }
// }





function checkUserSession() {
    const id_token = localStorage.getItem('id_token');
    if (!id_token) return false;

    try {
        const payload = JSON.parse(atob(id_token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
    } catch (e) {
        console.error("Invalid ID token:", e);
        return false;
    }
}



// Helper function to update footer and arrows when the registration-footer is displayed
function updateFooterAndArrowUI(footer, upArrow, downArrow) {

    footer.style.height = "100%";
    footer.style.marginBottom = "0px";
    upArrow.style.display = "none";
    downArrow.style.display = "block";
}


// If not logged in then...






function showErrorState(loggedOutView, loggedInView) {
    console.error('Unexpected error in sendUpRegistration. Showing login form as fallback.');
    showLoginForm(loggedOutView, loggedInView);
}

async function showLoggedInView(calendarData = {}) {
    const loggedInView = document.getElementById("logged-in-view");

    // 🌀 Pull latest user_profile directly from localStorage
    const profileString = localStorage.getItem("user_profile");
    if (!profileString) {
        console.error("No user profile found in storage.");
        return;
    }

    let userProfile = null;
    try {
        userProfile = JSON.parse(profileString);
    } catch (e) {
        console.error("Failed to parse stored user_profile:", e);
        return;
    }

    const {
        given_name: first_name = "Earthling",
        "buwana:earthlingEmoji": earthling_emoji = "🌍",
        email = '',
        buwana_id = userProfile.buwana_id || "—"
    } = userProfile;

    const {
        personal_calendars = [],
        subscribed_calendars = [],
        public_calendars = []
    } = calendarData;

    const lang = window.userLanguage?.toLowerCase() || 'en';
    const translations = await loadTranslations(lang);
    console.log("LoggedIn block:", translations.loggedIn);
    console.log("Lang for translations:", lang);

    const {
        welcome,
        syncingInfo,
        noPersonal,
        noPublic,
        syncNow,
        logout
    } = translations.loggedIn;

    const personalCalendarHTML = personal_calendars.length > 0
        ? personal_calendars.map(cal => `
            <div class="calendar-item">
                <input type="checkbox" id="personal-${cal.calendar_id}" name="personal_calendar" value="${cal.calendar_id}" checked disabled />
                <label for="personal-${cal.calendar_id}">${cal.calendar_name}</label>
            </div>
        `).join('')
        : `<p>${noPersonal}</p>`;

    const publicCalendarHTML = public_calendars.length > 0
        ? public_calendars.map(cal => {
            const isChecked = subscribed_calendars.some(sub => sub.calendar_id === cal.calendar_id);
            return `
                <div class="calendar-item">
                    <input type="checkbox" id="public-${cal.calendar_id}" name="public_calendar" value="${cal.calendar_id}"
                        ${isChecked ? 'checked' : ''}
                        onchange="toggleSubscription('${cal.calendar_id}', this.checked)" />
                    <label for="public-${cal.calendar_id}">${cal.calendar_name}</label>
                </div>
            `;
        }).join('')
        : `<p>${noPublic}</p>`;

    const personalSection = `<div class="form-item">${personalCalendarHTML}</div>`;
    const publicSection = `<div class="form-item">${publicCalendarHTML}</div>`;

    // 🍃 Build the edit profile URL with buwana_id and client_id as params
    const editProfileUrl = `https://buwana.ecobricks.org/${lang}/edit-profile.php?buwana=${encodeURIComponent(buwana_id)}&app=${encodeURIComponent(userProfile.aud || userProfile.client_id || "unknown")}`;


    loggedInView.innerHTML = `
        <div class="add-date-form" style="padding:10px;">
            <h1 style="font-size: 5em; margin-bottom: 20px;">${earthling_emoji}</h1>
            <h2 style="font-family:'Mulish',sans-serif;" class="logged-in-message">
                ${welcome} ${first_name}!
            </h2>
            <p>${syncingInfo}</p>

            <form id="calendar-selection-form" style="text-align:left; width:360px; margin:auto;">
                ${personalSection}
                ${publicSection}
            </form>

            <div id="logged-in-buttons" style="max-width: 90%; margin: auto; display: flex; flex-direction: column; gap: 10px;">
                <button type="button" id="sync-button" class="sync-style confirmation-blur-button enabled" onclick="animateSyncButton();">
                    🔄 ${syncNow}
                </button>
                <button type="button" class="sync-style confirmation-blur-button enabled" onclick="window.open('${editProfileUrl}', '_blank');">
                    ✏️ Edit Buwana Profile
                </button>
                <button type="button" onclick="logoutBuwana()" class="confirmation-blur-button cancel">
                    🐳 ${logout}
                </button>
            </div>

            <p id="cal-datecycle-count"></p>

            <p style="font-family:'Mulish',sans-serif; font-size:smaller; color:var(--subdued-text);">
                ${email}
            </p>

            <p style="font-family:'Mulish',sans-serif; font-size:smaller; color:var(--subdued-text);">
                Buwana ID: ${buwana_id}
            </p>
        </div>
    `;

    loggedInView.style.display = "block";
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





function buildJWTuserProfile() {
    const id_token = localStorage.getItem('id_token');
    if (!id_token) return null;

    try {
        const payload = JSON.parse(atob(id_token.split('.')[1]));

        // Derive buwana_id from sub
        let buwanaId = null;
        if (payload.sub.startsWith("buwana_")) {
            buwanaId = payload.sub.split("_")[1];
        } else {
            buwanaId = payload.sub;
        }

        const jwtProfile = {
            sub: payload.sub,
            buwana_id: buwanaId,
            email: payload.email,
            first_name: payload.given_name,
            earthling_emoji: payload["buwana:earthlingEmoji"],
            community: payload["buwana:community"],
            continent: payload["buwana:location.continent"]
        };

        console.log("JWTuserProfile:", jwtProfile);
        return jwtProfile;
    } catch (e) {
        console.error("Failed to parse ID token:", e);
        return null;
    }
}


/*-------------------------

LOGIN FORM

------------------------ */








async function showLoginForm(loggedOutView, loggedInView) {
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
}

async function sendUpLogin() {
    const footer = document.getElementById("registration-footer");
    const loggedOutView = document.getElementById("login-form-section");
    const loggedInView = document.getElementById("logged-in-view");
    const upArrow = document.getElementById("reg-up-button");
    const downArrow = document.getElementById("reg-down-button");

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





async function sendUpRegistration() {
    const footer = document.getElementById("registration-footer");
    const loggedOutView = document.getElementById("login-form-section");
    const loggedInView = document.getElementById("logged-in-view");
    const upArrow = document.getElementById("reg-up-button");
    const downArrow = document.getElementById("reg-down-button");

    const id_token = localStorage.getItem('id_token');

    if (!id_token) {
        console.warn("[EarthCal] No ID token found. Showing login form.");
        showLoginForm(loggedOutView, loggedInView);
        updateFooterAndArrowUI(footer, upArrow, downArrow);
        return;
    }

    let payload = null;
    try {
        payload = JSON.parse(atob(id_token.split('.')[1]));
    } catch (e) {
        console.error("[EarthCal] Invalid ID token format. Showing login form.");
        showLoginForm(loggedOutView, loggedInView);
        updateFooterAndArrowUI(footer, upArrow, downArrow);
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
        console.warn("[EarthCal] ID token expired. Showing login form.");
        showLoginForm(loggedOutView, loggedInView);
        updateFooterAndArrowUI(footer, upArrow, downArrow);
        return;
    }

    // ✅ Token is valid — show logged-in view which is already populated by getUserData
    console.log("[EarthCal] Valid token found. Showing logged-in view.");

    loggedOutView.style.display = "none";
    loggedInView.style.display = "block";
    footer.style.display = "block";

    updateFooterAndArrowUI(footer, upArrow, downArrow);
}






async function toggleSubscription(calendarId, subscribe) {
        // Always fetch buwana_id from localStorage.
        const buwanaId = localStorage.getItem('buwana_id');

        console.log(`Updating subscription for user ${buwanaId} for calendar ${calendarId}, subscribe: ${subscribe}`);

        try {
            const response = await fetch("https://gobrik.com/earthcal/update_pub_cal_subscriptions.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    buwana_id: buwanaId,
                    calendar_id: calendarId,
                    subscribe: subscribe ? "1" : "0"
                }),
            });

            const result = await response.json();

            if (result.success) {
                console.log(`Successfully updated subscription for calendar ${calendarId}`);
            } else {
                console.error(`Failed to update subscription: ${result.error}`);
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error updating subscription:", error);
            alert("An error occurred while updating your subscription. Please try again.");
        }
    }



















  function sendDownRegistration() {
    var footer = document.getElementById("registration-footer");
    var loggedOutView = document.getElementById("login-form-section");
    var upArrow = document.getElementById("reg-up-button");
    var downArrow = document.getElementById("reg-down-button");


    // Adjust the height of the registration footer
    footer.style.height = "25px";
      // footer.style.marginBottom = "unset";
    // Make the email registration section visible
    loggedOutView.style.display = "none";
    upArrow.style.display = "block";
//    downArrow.style.display = "none";
    calendarRefresh();

  }



// Utility function to shake an element (CSS class for shaking animation needed)
function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500); // Remove shake class after 0.5s
}



function viewTerms()  {
       alert("Sorry, our terms of use are still under development along with Buwana login.");
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

    // 🌿 Update login status message
    const sessionStatusEl = document.getElementById('user-session-status');
    if (sessionStatusEl) {
        updateSessionStatus("⚪ Not logged in: user logged out");

    }

    // 🌿 (Optional) Re-generate login URL again if needed
    createJWTloginURL();
}



// Placeholder function for syncing user events
function syncUserEvents() {
    alert("Your events are being synced!");
}







