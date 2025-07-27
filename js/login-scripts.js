


// LOGIN CHECKING

// ---------- helpers ----------
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
    if (!ok) {
        console.warn("⚪ Not logged in (or token expired). Loading default user.");
        useDefaultUser();
        return;
    }

    // Cache to session if missing (useful if we arrived directly on dash.html)
    if (!sessionStorage.getItem("buwana_user")) {
        sessionStorage.setItem("buwana_user", JSON.stringify(payload));
    }

    // ✅ Populate globals
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

    displayUserData(userTimeZone, userLanguage);
    setCurrentDate(userTimeZone, userLanguage);

    // 📅 Calendars (only if logged in)
    const calendarCache = sessionStorage.getItem("user_calendars");
    if (calendarCache) {
        try {
            const calendarData = JSON.parse(calendarCache);
            console.log("📅 Using cached calendar data:", calendarData);
            showLoggedInView(calendarData);
        } catch (e) {
            console.warn("⚠️ Failed to parse cached calendar data:", e);
            useDefaultUser();
        }
    } else {
        console.warn("⚠️ No calendar data cached");
        useDefaultUser();
    }
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

    // ✅ Validate login status first
    const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });
    if (!ok || !payload?.buwana_id) {
        console.warn("❌ Cannot show logged-in view — user not authenticated.");
        return;
    }

    const first_name = payload.given_name || "Earthling";
    const earthling_emoji = payload["buwana:earthlingEmoji"] || "🌍";
    const buwana_id = payload.buwana_id;

    const {
        personal_calendars = [],
        subscribed_calendars = [],
        public_calendars = []
    } = calendarData;

    const lang = window.userLanguage?.toLowerCase() || 'en';
    const translations = await loadTranslations(lang);
    const {
        welcome,
        syncingInfo,
        noPersonal,
        noPublic,
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

    const editProfileUrl = `https://buwana.ecobricks.org/${lang}/edit-profile.php?buwana=${encodeURIComponent(buwana_id)}&app=${encodeURIComponent(payload.aud || payload.client_id || "unknown")}`;

    loggedInView.innerHTML = `
        <div class="add-date-form" style="padding:10px;">
            <h1 style="font-size: 5em; margin-bottom: 20px;margin-top:10px;">${earthling_emoji}</h1>
            <h2 style="font-family:'Mulish',sans-serif;" class="logged-in-message">
                ${welcome} ${first_name}!
            </h2>
             <div id="sync-status">
                <p>${syncingInfo}</p>
            </div>
            

            <form id="calendar-selection-form" style="text-align:left; width:360px; margin:auto;">
                ${personalSection}
                ${publicSection}
            </form>

            <div id="logged-in-buttons" style="max-width: 90%; margin: auto; display: flex; flex-direction: column; gap: 10px;">
                <button type="button" class="sync-style confirmation-blur-button enabled" onclick="window.open('${editProfileUrl}', '_blank');">
                    ✏️ Edit Buwana Profile
                </button>
                <button type="button" onclick="logoutBuwana()" class="confirmation-blur-button cancel">
                    🐳 ${logout}
                </button>
            </div>

            <p id="cal-datecycle-count"></p>
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

    const { isLoggedIn: loggedIn, payload } = isLoggedIn({ returnPayload: true });

    if (loggedIn) {
        console.log("[EarthCal] Valid token found. Showing logged-in view.");
        loggedOutView.style.display = "none";
        loggedInView.style.display = "block";

        let calendarData = null;
        const calendarCache = sessionStorage.getItem("user_calendars");

        if (calendarCache) {
            try {
                calendarData = JSON.parse(calendarCache);
                console.log("📅 Using cached calendar data.");
            } catch (e) {
                console.warn("⚠️ Failed to parse cached calendar data:", e);
            }
        }

        if (!calendarData && payload?.buwana_id) {
            console.log("📡 Fetching fresh calendar data...");
            try {
                const calRes = await fetch("https://buwana.ecobricks.org/earthcal/fetch_all_calendars.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ buwana_id: payload.buwana_id })
                });
                const calJson = await calRes.json();
                if (calJson.success) {
                    calendarData = calJson;
                    sessionStorage.setItem("user_calendars", JSON.stringify(calJson));
                    console.log("✅ Fresh calendar data loaded.");
                } else {
                    console.warn("⚠️ Calendar fetch failed:", calJson.message);
                }
            } catch (e) {
                console.error("❌ Error fetching calendar data:", e);
            }
        }

        if (calendarData) {
            showLoggedInView(calendarData);
        } else {
            console.warn("❌ No calendar data available to render logged-in view.");
        }
    } else {
        console.warn("[EarthCal] Not logged in. Showing login form.");
        showLoginForm(loggedOutView, loggedInView);
    }

    updateFooterAndArrowUI(footer, upArrow, downArrow);
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









async function fetchCalendarDatecycles(buwanaId, calendarId) {
    const res = await fetch("https://buwana.ecobricks.org/earthcal/get_calendar_data.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buwana_id: buwanaId, cal_id: calendarId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Failed to fetch datecycles");
    return data.dateCycles || [];
}



function setSyncStatus(text, emoji = '', spinning = false) {
    const statusDiv = document.getElementById("sync-status");
    if (!statusDiv) return;

    const spinner = spinning ? `<span class="sync-spinner" style="display:inline-block; margin-right:6px;">${emoji}</span>` : `${emoji}`;
    statusDiv.innerHTML = `<p>${spinner} ${text}</p>`;
}

async function toggleSubscription(calendarId, subscribe) {
    const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });
    if (!ok || !payload?.buwana_id) {
        console.warn("❌ toggleSubscription: Not logged in or no buwana_id.");
        return { success: false, error: "not_logged_in" };
    }

    if (!calendarId) {
        console.warn("❌ toggleSubscription: Missing calendarId");
        return { success: false, error: "no_calendar_id" };
    }

    const buwanaId = payload.buwana_id;
    const subFlag = subscribe ? "1" : "0";
    console.log(`🔄 Updating subscription for calendar ${calendarId}, subscribe: ${subFlag}`);

    try {
        // 🟢 Show sync in-progress UI
        if (subscribe) {
            setSyncStatus("Subscribing to calendar...", "🟢", true);
        } else {
            setSyncStatus("Removing calendar subscription...", "🔴", true);
        }

        // 1. Subscribe/unsubscribe server call
        const response = await fetch("https://buwana.ecobricks.org/earthcal/update_pub_cal_subs.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buwana_id: buwanaId, calendar_id: calendarId, subscribe: subFlag }),
        });
        const result = await response.json();
        if (!result.success) {
            console.error(`❌ Failed to update subscription: ${result.error}`);
            alert(`Error: ${result.error}`);
            return { success: false, error: result.error };
        }

        // 2. Add or remove datecycles
        if (subscribe) {
            try {
                const res = await fetch("https://buwana.ecobricks.org/earthcal/get_calendar_data.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ buwana_id: buwanaId, cal_id: calendarId })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message || "Fetch failed");
                const dateCycles = data.dateCycles || [];

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
        }

        // 3. Refresh calendar metadata cache
        try {
            const calRes = await fetch("https://buwana.ecobricks.org/earthcal/fetch_all_calendars.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ buwana_id: buwanaId })
            });

            const calData = await calRes.json();
            if (calData.success) {
                sessionStorage.setItem("user_calendars", JSON.stringify(calData));
                console.log("🔁 user_calendars cache refreshed.");
            }
        } catch (e) {
            console.warn("⚠️ Calendar list refresh failed:", e);
        }

        // Optional: UI refresh hooks
        if (typeof calendarRefresh === "function") calendarRefresh();

        return { success: true };
    } catch (err) {
        console.error("❌ Error in toggleSubscription:", err);
        alert("Something went wrong. Please try again.");
        setSyncStatus("⚠️ Sync error occurred.");
        return { success: false, error: "network_error" };
    }
}







function sendDownRegistration() {
    const container = document.getElementById("registration-container");
    const footer = document.getElementById("registration-footer");
    const loggedOutView = document.getElementById("login-form-section");
    const upArrow = document.getElementById("reg-up-button");
    const downArrow = document.getElementById("reg-down-button");

    container.classList.remove("expanded");

    setTimeout(() => {
        footer.style.height = "25px";
        loggedOutView.style.display = "none";
        upArrow.style.display = "block";
        calendarRefresh();  // refresh calendar UI
        syncDatecycles();   // 🔄 trigger sync now!
    }, 300);
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
    sendDownRegistration();
}








