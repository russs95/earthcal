

/*-------------
LOGIN FUNCTIONS
----------------*/

const regContainer = document.getElementById('registration-container');
const regDownButton = document.getElementById('reg-down-button');

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
        // Trigger your existing function to close
        sendDownRegistration();
    } else {
        // Snap back to top
        regContainer.style.transform = `translateY(0)`;
    }
}

// Touch
document.addEventListener("DOMContentLoaded", function () {
    const regDownButton = document.getElementById("reg-down-button");
    if (!regDownButton) {
        console.warn("⚠️ reg-down-button not found in DOM.");
        return;
    }

    regDownButton.addEventListener("touchstart", onStartDrag);
    regDownButton.addEventListener("touchmove", onMoveDrag);
    regDownButton.addEventListener("touchend", onEndDrag);

    regDownButton.addEventListener("mousedown", onStartDrag);
    document.addEventListener("mousemove", onMoveDrag);
    document.addEventListener("mouseup", onEndDrag);
});



// Declare globally near the top of your app
let userLanguage = null;
let userTimeZone = null;
let userProfile = null;

async function getUserData() {
    const sessionStatus = document.getElementById('user-session-status');
    console.log("🌿 getUserData: Starting...");

    // 1️⃣ Try sessionStorage first
    let idPayload = null;
    const sessionProfile = sessionStorage.getItem("buwana_user");
    if (sessionProfile) {
        try {
            idPayload = JSON.parse(sessionProfile);
        } catch (e) {
            console.warn("Failed to parse session buwana_user:", e);
        }
    }

    // 2️⃣ Fallback to localStorage
    if (!idPayload) {
        const localProfile = localStorage.getItem("user_profile");
        if (localProfile) {
            try {
                idPayload = JSON.parse(localProfile);
            } catch (e) {
                console.error("[EarthCal] Failed to parse local user_profile:", e);
                updateSessionStatus("⚪ Not logged in: profile parse error");
                useDefaultUser();
                return;
            }
        }
    }

    if (!idPayload) {
        console.warn("⚪ No user profile found in storage");
        updateSessionStatus("⚪ Not logged in: no profile");
        useDefaultUser();
        return;
    }

    // 3️⃣ Validate token expiration
    const now = Math.floor(Date.now() / 1000);
    if (idPayload.exp && idPayload.exp < now) {
        console.warn("[EarthCal] ID token expired.");
        updateSessionStatus("⚪ Not logged in: token expired");
        useDefaultUser();
        return;
    }

    // 4️⃣ Validate buwana_id
    const buwanaId = idPayload.buwana_id;
    if (!buwanaId) {
        console.warn("Missing buwana_id");
        updateSessionStatus("⚪ Not logged in: buwana_id missing");
        useDefaultUser();
        return;
    }

    // 5️⃣ Set up global state
    userLanguage = navigator.language.slice(0, 2);
    userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    userProfile = {
        first_name: idPayload.given_name || "Earthling",
        email: idPayload.email || null,
        buwana_id: buwanaId,
        earthling_emoji: idPayload["buwana:earthlingEmoji"] || "🌎",
        community: idPayload["buwana:community"] || null,
        continent: idPayload["buwana:location.continent"] || null,
        status: idPayload["status"] || "returning"
    };

    console.log("✅ Loaded userProfile:", userProfile);
    displayUserData(userTimeZone, userLanguage);
    setCurrentDate(userTimeZone, userLanguage);

    // 6️⃣ Load cached calendars
    const calendarCache = sessionStorage.getItem("user_calendars");
    if (calendarCache) {
        try {
            const calendarData = JSON.parse(calendarCache);
            console.log("📅 Using cached calendar data:", calendarData);
            showLoggedInView(calendarData);
            updateSessionStatus(`${userProfile.earthling_emoji} Logged in as ${userProfile.first_name}`);
        } catch (e) {
            console.warn("⚠️ Failed to parse cached calendar data:", e);
            updateSessionStatus("⚪ Not logged in: calendar parse error");
            useDefaultUser();
        }
    } else {
        console.warn("⚠️ No calendar data cached");
        updateSessionStatus("⚪ Not logged in: no calendar data");
        useDefaultUser();
    }
}

function updateSessionStatus(message, isLoggedIn = false) {
    const sessionStatus = document.getElementById('user-session-status');
    const regUpButton = document.getElementById('reg-up-button');

    if (sessionStatus) {
        sessionStatus.textContent = message;
        regUpButton?.classList.toggle('active', isLoggedIn);
    } else {
        setTimeout(() => updateSessionStatus(message, isLoggedIn), 100);
    }
}


function checkBuwanaSessionStatus({ updateUI = true } = {}) {
    let payload = null;

    // 1️⃣ Prefer sessionStorage (set by index.html)
    const sessionStr = sessionStorage.getItem("buwana_user");
    if (sessionStr) {
        try {
            payload = JSON.parse(sessionStr);
            console.log("✅ Session user loaded from sessionStorage:", payload);
        } catch (e) {
            console.warn("⚠️ Failed to parse session user:", e);
        }
    }

    // 2️⃣ Fallback to localStorage id_token
    if (!payload) {
        const id_token = localStorage.getItem("id_token");
        if (id_token) {
            try {
                payload = JSON.parse(atob(id_token.split('.')[1]));
            } catch (e) {
                console.error("[SessionStatus] Invalid token format:", e);
            }
        }
    }

    // No payload? Not logged in.
    if (!payload) {
        if (updateUI) updateSessionStatus("⚪ Not logged in: no token/profile", false);
        return { isLoggedIn: false, payload: null };
    }

    // 3️⃣ Expiry check
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
        if (updateUI) updateSessionStatus("⚪ Not logged in: token expired", false);
        return { isLoggedIn: false, payload };
    }

    // 4️⃣ Logged in
    const name = payload.given_name || "User";
    const emoji = payload["buwana:earthlingEmoji"] || "🌍";
    if (updateUI) updateSessionStatus(`🟢 Logged in as ${name} ${emoji}`, true);

    return { isLoggedIn: true, payload };
}


document.addEventListener("DOMContentLoaded", () => {
    checkBuwanaSessionStatus({ updateUI: true });
});




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



function sendUpRegistration() {
    const container = document.getElementById("registration-container");
    container.classList.add("expanded");

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
















// function sendDownRegistration() {
//     const container = document.getElementById("registration-container");
//     container.classList.remove("expanded");
//
//     // Optionally collapse login UI
//     document.getElementById("login-form-section").style.display = "none";
//     document.getElementById("reg-up-button").style.display = "block";
//     calendarRefresh();
// }


function sendDownRegistration() {
    const container = document.getElementById("registration-container");
    const footer = document.getElementById("registration-footer");
    const loggedOutView = document.getElementById("login-form-section");
    const upArrow = document.getElementById("reg-up-button");
    const downArrow = document.getElementById("reg-down-button");

    // ✅ Animate down by removing the .expanded class
    container.classList.remove("expanded");

    // Optionally delay hiding UI until after animation completes (300ms)
    setTimeout(() => {
        footer.style.height = "25px";
        loggedOutView.style.display = "none";
        upArrow.style.display = "block";
        calendarRefresh();
    }, 300); // Match the CSS transition duration
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







