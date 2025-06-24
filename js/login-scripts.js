

/*-------------
LOGIN FUNCTIONS
----------------*/


function checkUserSession() {
    const id_token = localStorage.getItem('id_token');
    if (!id_token) {
        console.log("No ID token found.");
        return false;
    }

    try {
        // Decode payload
        const parts = id_token.split('.');
        if (parts.length !== 3) {
            console.error("Malformed ID token structure.");
            return false;
        }

        const payload = JSON.parse(atob(parts[1]));

        // Check standard claims
        const now = Math.floor(Date.now() / 1000);
        const leeway = 60; // allow 1 minute clock skew

        if (!payload.exp || payload.exp < (now - leeway)) {
            console.warn("ID token expired.");
            return false;
        }

        if (!payload.iat || payload.iat > (now + leeway)) {
            console.warn("ID token issued in the future.");
            return false;
        }

        if (!payload.iss || payload.iss !== "https://buwana.ecobricks.org") {
            console.warn("Unexpected issuer.");
            return false;
        }

        if (!payload.aud || payload.aud !== "ecal_7f3da821d0a54f8a9b58") {
            console.warn("Unexpected audience.");
            return false;
        }

        return true;  // ✅ Token looks valid
    } catch (e) {
        console.error("Error parsing ID token:", e);
        return false;
    }
}





async function showLoginForm(loggedOutView, loggedInView, userData = {}) {
    loggedOutView.style.display = "block";
    loggedInView.style.display = "none";

    createJWTloginURL();  // <-- Call here to update login button each time

    const { status, earthling_emoji, first_name } = userData;

    const translations = await loadTranslations(userLanguage.toLowerCase());
    const loginStrings = translations.login;

    const subStatusDiv = document.getElementById('sub-status-message');
    if (status === "firsttime") {
        subStatusDiv.innerHTML = loginStrings.statusFirstTime(earthling_emoji);
    } else {
        subStatusDiv.innerHTML = loginStrings.statusReturning(earthling_emoji, first_name);
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
    const loginButton = document.querySelector("#login-buttons-container button.sync-style");
    if (loginButton) {
        loginButton.onclick = () => window.location.href = url.toString();
    }
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

    // ✅ Check session (JWT exists & valid)
    if (!checkUserSession()) {
        sendUpLogin();
        return;
    }

    try {
        const id_token = localStorage.getItem('id_token');
        if (!id_token) {
            console.error("ID token missing, cannot rebuild profile.");
            sendUpLogin();
            return;
        }

        // ✅ Call userinfo endpoint to rebuild full userProfile
        const userInfoResponse = await fetch('https://buwana.ecobricks.org/userinfo', {
            headers: {
                'Authorization': `Bearer ${id_token}`
            }
        });

        if (!userInfoResponse.ok) {
            console.error("Failed to fetch userinfo.");
            sendUpLogin();
            return;
        }

        const userData = await userInfoResponse.json();

        // ✅ Build global userProfile from userinfo payload
        window.userProfile = {
            first_name: userData.given_name || "Earthling",
            email: userData.email || null,
            buwana_id: extractBuwanaId(userData.sub),
            earthling_emoji: userData["buwana:earthlingEmoji"] || "🐸",
            community: userData["buwana:community"] || null,
            continent: userData["buwana:location.continent"] || null,
            status: "returning"
        };

        console.log("[EarthCal] User profile rebuilt from /userinfo:", window.userProfile);

        // ✅ Now fetch calendar data
        const buwanaId = window.userProfile.buwana_id;
        if (!buwanaId) {
            console.error("Missing buwana_id after userinfo rebuild.");
            sendUpLogin();
            return;
        }

        const calResponse = await fetch('https://buwana.ecobricks.org/earthcal/fetch_all_calendars.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buwana_id: buwanaId }),
            credentials: 'include'
        });

        const calendarData = await calResponse.json();

        if (calendarData.success) {
            showLoggedInView(calendarData);
        } else {
            console.error('Error fetching calendar data:', calendarData.message || 'Unknown error');
            showErrorState(loggedOutView, loggedInView);
        }

    } catch (error) {
        console.error('Error in sendUpRegistration:', error);
        showErrorState(loggedOutView, loggedInView);
    }

    updateFooterAndArrowUI(footer, upArrow, downArrow);
}

// Simple helper to extract buwana_id from sub claim
function extractBuwanaId(sub) {
    if (!sub) return null;
    if (sub.startsWith("buwana_")) {
        return sub.split("_")[1];
    }
    return sub;
}




//
//
// async function sendUpRegistration() {
//     const guidedTour = document.getElementById("guided-tour");
//     const guidedTourModal = guidedTour?.querySelector('.modal');
//     if (guidedTourModal && guidedTourModal.style.display !== "none") return;
//
//     const footer = document.getElementById("registration-footer");
//     const loggedOutView = document.getElementById("login-form-section");
//     const loggedInView = document.getElementById("logged-in-view");
//     const upArrow = document.getElementById("reg-up-button");
//     const downArrow = document.getElementById("reg-down-button");
//
//     const buwanaId = localStorage.getItem('buwana_id');
//
//     if (!buwanaId) {
//         createJWTloginURL();
//         showLoginForm(loggedOutView, loggedInView, null);
//         updateFooterAndArrowUI(footer, upArrow, downArrow);
//         return;
//     }
//
//     try {
//         // Check session validity
//         const userResponse = await fetch(`https://buwana.ecobricks.org/earthcal/fetch_logged_in_user_data.php?id=${buwanaId}`, {
//             credentials: 'include'
//         });
//         const userData = await userResponse.json();
//
//         //If user is not logged in
//         if (!userData.logged_in) {
//             console.warn("Session expired or invalid. Using default user data.");
//
//             window.userProfile = {
//                 first_name: "Earthling",
//                 earthling_emoji: "🐸",
//                 language_id: "en",
//                 time_zone: "America/Toronto", // EST/EDT
//                 location_full: "Ottawa, Ontario, Canada",
//                 location_lat: 45.4215,
//                 location_long: -75.6972,
//                 connection_id: null,
//                 status: "guest"
//             };
//
//             window.userLanguage = "en";
//             window.userTimeZone = "America/Toronto";
//
//             showLoginForm(loggedOutView, loggedInView, null);
//             updateFooterAndArrowUI(footer, upArrow, downArrow);
//             return;
//         }
//
//
//         // Valid session — proceed with user data
//         window.userProfile = {
//             first_name: userData.first_name,
//             earthling_emoji: userData.earthling_emoji,
//             last_sync_ts: userData.last_sync_ts,
//             language_id: userData.language_id,
//             time_zone: userData.time_zone,
//             last_login: userData.last_login,
//             location_full: userData.location_full,
//             location_lat: userData.location_lat,
//             location_long: userData.location_long,
//             connection_id: userData.connection_id
//         };
//
//
//         window.userLanguage = userData.language_id.toLowerCase();
//         window.userTimeZone = userData.time_zone;
//
//         const calResponse = await fetch('https://buwana.ecobricks.org/earthcal/fetch_all_calendars.php', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ buwana_id: buwanaId }),
//             credentials: 'include'
//         });
//
//         const calendarData = await calResponse.json();
//
//         if (calendarData.success) {
//             showLoggedInView(calendarData);
//         } else {
//             console.error('Error fetching calendar data:', calendarData.message || 'Unknown error');
//             showErrorState(loggedOutView, loggedInView);
//         }
//
//     } catch (error) {
//         console.error('Error in registration sequence:', error);
//         showErrorState(loggedOutView, loggedInView);
//     }
//
//     updateFooterAndArrowUI(footer, upArrow, downArrow);
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

    if (!window.userProfile) {
        console.error("User profile is missing.");
        return;
    }

    const {
        first_name,
        earthling_emoji,
        email,
        buwana_id
    } = window.userProfile;

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

    // Build simplified edit profile URL (if you still want it)
    const editProfileUrl = `https://buwana.ecobricks.org/${lang}/edit-profile.php`;

    loggedInView.innerHTML = `
        <div class="add-date-form" style="padding:10px;">
            <h1 style="font-size: 5em; margin-bottom: 20px;">${earthling_emoji || '🌍'}</h1>
            <h2 style="font-family:'Mulish',sans-serif;" class="logged-in-message">
                ${welcome} ${first_name || 'Earthling'}!
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
                ${email || ''}
            </p>

            <p style="font-family:'Mulish',sans-serif; font-size:smaller; color:var(--subdued-text);">
                Buwana ID: ${buwana_id || '—'}
            </p>
        </div>
    `;

    loggedInView.style.display = "block";
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


// Logout function
function logoutBuwana() {
    // Clear tokens and session state
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    sessionStorage.clear();

    // Clear global user profile
    window.userProfile = null;
    window.userLanguage = null;
    window.userTimeZone = null;

    // Clear any service worker caches
    if ('caches' in window) {
        caches.keys().then(names => {
            for (let name of names) {
                caches.delete(name);
            }
        }).catch(err => console.error("Cache deletion failed:", err));
    }

    // Reset views
    document.getElementById("login-form-section").style.display = "block";
    const loggedInView = document.getElementById("logged-in-view");
    loggedInView.style.display = "none";
    loggedInView.innerHTML = "";

    const sessionStatusEl = document.getElementById('user-session-status');
    if (sessionStatusEl) {
        sessionStatusEl.textContent = '⚪';
        sessionStatusEl.title = 'Login status';
    }

    // Optional: redirect after logout
    window.location.href = '/';
}



// Placeholder function for syncing user events
function syncUserEvents() {
    alert("Your events are being synced!");
}







