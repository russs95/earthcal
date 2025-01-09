



    /* auto run the language switcher

    is this needed?!*/

//        var siteName = 'gobrik.com';
    var currentLanguage = 'language'; // Default language code
//    switchLanguage(currentLanguage);
//


/*-------------
MAIN FUNCTIONS
----------------*/
function checkUserSession() {
    // Check if the 'buwana_id' exists in localStorage
    const buwanaId = localStorage.getItem('buwana_id');

    // Return true if 'buwana_id' is found and not empty
    return buwanaId !== null && buwanaId !== '';
}



function sendUpRegistration() {
    const guidedTour = document.getElementById("guided-tour");
    const guidedTourModal = document.querySelector('#guided-tour .modal');

    // Exit if the guided tour modal is visible
    if (guidedTourModal && guidedTourModal.style.display !== "none") {
        return;
    }

    const footer = document.getElementById("registration-footer");
    const emailRegistration = document.getElementById("login-form-section");
    const loggedInView = document.getElementById("logged-in-view");
    const activateEarthCalAccount = document.getElementById("activate-earthcal-account");
    const upArrow = document.getElementById("reg-up-button");
    const downArrow = document.getElementById("reg-down-button");

    // Check if the user session is active
    if (checkUserSession()) {
        try {
            // Retrieve and validate connected_apps from localStorage
            const connectedAppsRaw = localStorage.getItem('connected_apps') || '';
            const connectedApps = connectedAppsRaw.split(',').map(app => app.trim());
            const earthcalAppId = '00002'; // EarthCal App ID

            if (connectedApps.includes(earthcalAppId)) {
                // User is logged in and registered on EarthCal
                showLoggedInView();
            } else if (connectedAppsRaw === '') {
                console.warn('Connected apps are missing in localStorage.');
                showErrorState(emailRegistration, loggedInView, activateEarthCalAccount);
            } else {
                // User is logged in but not registered on EarthCal
                showActivateEarthCalView(emailRegistration, loggedInView, activateEarthCalAccount);
            }
        } catch (error) {
            console.error('Error accessing or parsing connected_apps in localStorage:', error);
            showErrorState(emailRegistration, loggedInView, activateEarthCalAccount);
        }
    } else {
        // User is not logged in, show the login form
        showLoginForm(emailRegistration, loggedInView, activateEarthCalAccount);
    }

    // Adjust the height of the registration footer
    footer.style.height = "102vh";

    // Show or hide the arrows
    upArrow.style.display = "none";
    downArrow.style.display = "block";
}




async function activateEarthcalAccount() {
    try {
        const buwanaId = localStorage.getItem('buwana_id');

        if (!buwanaId) {
            alert("Buwana ID is missing. Please log in again.");
            return;
        }

        const response = await fetch('https://gobrik.com/api/earthcal_activate.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ buwana_id: buwanaId })
        });

        const data = await response.json();

        if (data.success) {
            alert("Your EarthCal account has been successfully activated!");

            // Update connected_apps in localStorage
            let connectedApps = (localStorage.getItem('connected_apps') || '').split(',');
            if (!connectedApps.includes('0002')) {
                connectedApps.push('0002');
                localStorage.setItem('connected_apps', connectedApps.join(','));
            }

            // Update user data in localStorage
            if (data.user_data) {
                localStorage.setItem('first_name', data.user_data.first_name || '');
                localStorage.setItem('continent_code', data.user_data.continent_code || '');
                localStorage.setItem('location_full', data.user_data.location_full || '');

                // Call generateLoggedInView directly after activation
                showLoggedInView();
            } else {
                console.error("Missing user_data in response");
            }
        } else {
            alert(`Activation failed: ${data.message}`);
        }
    } catch (error) {
        console.error('Error activating EarthCal account:', error);
        alert('An error occurred while activating your EarthCal account. Please try again.');
    }
}


// Helper Function
function showLoggedInView() {
    const loggedInView = document.getElementById("logged-in-view");
    const activateView = document.getElementById("activate-earthcal-account");
    activateView.style.display = "none";

    // Retrieve user data from local storage
    const userData = {
        first_name: localStorage.getItem('first_name') || 'User',
        last_sync_ts: localStorage.getItem('last_sync_ts') || '0:00',
        calendar_names: localStorage.getItem('calendar_names') || '',
        location_full: localStorage.getItem('location_full') || 'Unknown Location',
        continent_code: localStorage.getItem('continent_code') || 'N/A'
    };

    console.log('User Data Retrieved from Local Storage:', userData);

    // Ensure proper formatting of calendar names
    const formattedCalendarNames = userData.calendar_names
        ? userData.calendar_names.split(',').join(', ')
        : 'My Calendar'; // Default to "My Calendar" if no other names are available

    // Generate sync status message
    let syncMessage = `<p id="last-synced-time" style="font-size:smaller">`;
    if (userData.last_sync_ts !== '0:00' && formattedCalendarNames) {
        syncMessage += `✔ ${formattedCalendarNames} was last synced on ${userData.last_sync_ts}.`;
    } else {
        syncMessage += `Your dateCycles haven't been synced yet.`;
    }
    syncMessage += `</p>`;

    // Clear existing content
    loggedInView.innerHTML = "";

    // Fetch translations based on the selected language
    const translations = loggedInTranslations[language] || loggedInTranslations.EN;

    // Dynamically generate the logged-in view content
    loggedInView.innerHTML = `
        <h3 style="font-family:'Mulish',sans-serif;" class="logged-in-message">
            ${translations.welcome} ${userData.first_name}.
        </h3>
        <div id="logged-in-buttons" style="width:90%;margin:auto;display: flex;flex-flow: column;">
            <button style="margin-bottom:0px;" class="confirmation-blur-button enabled" onclick="syncUserEvents()">
                🔄 Sync Now
            </button>
            <button onclick="logoutBuwana()" class="confirmation-blur-button cancel">🐳
                ${translations.logout}
            </button>
        </div>
        ${syncMessage}
        <p style="font-family:'Mulish',sans-serif;font-size:smaller;color:var(--subdued-text);">
            ${userData.location_full}, ${userData.continent_code}
        </p>
    `;

    // Display the logged-in view
    loggedInView.style.display = "block";
}





function showActivateEarthCalView(emailRegistration, loggedInView, activateEarthCalAccount) {
    emailRegistration.style.display = "none";
    loggedInView.style.display = "none";
    activateEarthCalAccount.style.display = "block";
}

function showLoginForm(emailRegistration, loggedInView, activateEarthCalAccount) {
    emailRegistration.style.display = "block";
    loggedInView.style.display = "none";
    activateEarthCalAccount.style.display = "none";
}

function showErrorState(emailRegistration, loggedInView, activateEarthCalAccount) {
    console.error('Unexpected error in sendUpRegistration. Showing login form as fallback.');
    showLoginForm(emailRegistration, loggedInView, activateEarthCalAccount);
}







  function sendDownRegistration() {
    var footer = document.getElementById("registration-footer");
    var emailRegistration = document.getElementById("login-form-section");
    var upArrow = document.getElementById("reg-up-button");
    var downArrow = document.getElementById("reg-down-button");


    // Adjust the height of the registration footer
    footer.style.height = "77px";

    // Make the email registration section visible
    emailRegistration.style.display = "none";
    upArrow.style.display = "block";
    downArrow.style.display = "none";
    calendarRefresh();

  }



// Consolidated function to handle error responses and show the appropriate error div
function handleErrorResponse(errorType) {
    // Hide both error divs initially
    document.getElementById('password-error').style.display = 'none';
    document.getElementById('no-buwana-email').style.display = 'none';

    // Show the appropriate error div based on the errorType
    if (errorType === 'invalid_password') {
        document.getElementById('password-error').style.display = 'block'; // Show password error
        shakeElement(document.getElementById('password-form'));
    } else if (errorType === 'invalid_user' || errorType === 'invalid_credential') {
        document.getElementById('no-buwana-email').style.display = 'block'; // Show email error
        shakeElement(document.getElementById('credential-input-field'));
    } else {
        console.error('Unknown error type:', errorType);
        alert('An unexpected error occurred. Please try again.');
    }
}

// Utility function to shake an element (CSS class for shaking animation needed)
function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500); // Remove shake class after 0.5s
}


function generateLoggedInView(userDetails) {
    const loggedInView = document.getElementById("logged-in-view");
    const activateView = document.getElementById("activate-earthcal-account");
    activateView.style.display = "none";

    // Clear existing content
    loggedInView.innerHTML = "";

    // Fetch translations based on the selected language
    const translations = loggedInTranslations[language] || loggedInTranslations.EN;

    // Retrieve last sync time and calendar names from localStorage
    const lastSyncedTs = localStorage.getItem('last_sync_ts') || 'Never';
    const calendarNames = localStorage.getItem('calendar_names')
        ? localStorage.getItem('calendar_names').split(',').join(', ')
        : "My Calendar";

    // Generate sync status message
    const syncMessage = `
        <p style="font-family:'Mulish',sans-serif;">
            ${calendarNames} ${lastSyncedTs !== 'Never'
                ? `was last synced on ${lastSyncedTs}.`
                : "hasn't been synced yet."}
        </p>`;

    // Dynamically set the logged-in content
    loggedInView.innerHTML = `
        <h2 style="font-family:'Mulish',sans-serif;" class="logged-in-message">
            ${translations.welcome} ${userDetails.first_name || 'User'}.
        </h2>
        <div id="logged-in-buttons" style="width:90%;margin:auto;">
            <button class="confirmation-blur-button enabled" onclick="syncUserEvents()">
                ${translations.syncButton}
            </button>
            <button onclick="logoutBuwana()" class="confirmation-blur-button cancel">
                ${translations.logout}
            </button>
        </div>
        ${syncMessage}
        <p style="font-family:'Mulish',sans-serif;font-size:smallest;color:var(--subdued-text);">
            ${userDetails.location_full || 'Unknown Location'}, ${userDetails.continent_code || 'N/A'}
        </p>
    `;

    // Show the logged-in view
    loggedInView.style.display = "block";
}





function viewTerms()  {
       alert("Sorry, our terms of use are still under development along with Buwana login.");
       }

// Logout function
function logoutBuwana() {
    // Clear user-related data
    localStorage.removeItem("buwana_id");

    // Reset views
    document.getElementById("login-form-section").style.display = "block";
    const loggedInView = document.getElementById("logged-in-view");
    const activateView = document.getElementById("activate-earthcal-account");
    loggedInView.style.display = "none";
    activateView.style.display = "none";
    loggedInView.innerHTML = ""; // Clear content

    alert("You have been logged out successfully.");
}

// Placeholder function for syncing user events
function syncUserEvents() {
    alert("Your events are being synced!");
}

/* ---------- ------------------------------
TOGGLE PASSWORD VISIBILITY
-------------------------------------------*/


document.addEventListener("DOMContentLoaded", function() {
    // Select all elements with the class 'toggle-password'
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    togglePasswordIcons.forEach(function(icon) {
        icon.addEventListener('click', function() {
            // Find the associated input field using the 'toggle' attribute
            const input = document.querySelector(icon.getAttribute('toggle'));
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = '🙉'; // 🔓 Change to unlocked emoji
                } else {
                    input.type = 'password';
                    icon.textContent = '🙈'; // 🔒 Change to locked emoji
                }
            }
        });
    });
});



/* Code entry and processing for 2FA */

document.addEventListener('DOMContentLoaded', function () {
    const codeInputs = document.querySelectorAll('.code-box');
    const sendCodeButton = document.getElementById('send-code-button');
    const codeErrorDiv = document.getElementById('code-error');
    const codeStatusDiv = document.getElementById('code-status');
    const credentialKeyInput = document.getElementById('credential_key');

    // Function to move focus to the next input
    function moveToNextInput(currentInput, nextInput) {
        if (nextInput) {
            nextInput.focus();
        }
    }

    // Setup each input box
    codeInputs.forEach((input, index) => {
        // Handle paste event separately
        input.addEventListener('paste', (e) => handlePaste(e));

        // Handle input event for typing data
        input.addEventListener('input', () => handleInput(input, index));

        // Handle backspace for empty fields to jump back to the previous field
        input.addEventListener('keydown', (e) => handleBackspace(e, input, index));
    });

    // Function to handle paste event
    function handlePaste(e) {
        const pastedData = e.clipboardData.getData('text').slice(0, codeInputs.length);
        [...pastedData].forEach((char, i) => codeInputs[i].value = char);
        codeInputs[Math.min(pastedData.length, codeInputs.length) - 1].focus();
        validateCode();
        e.preventDefault();
    }

    // Function to handle input event for typing data
    function handleInput(input, index) {
        if (input.value.length === 1 && index < codeInputs.length - 1) {
            moveToNextInput(input, codeInputs[index + 1]);
        }
        if ([...codeInputs].every(input => input.value.length === 1)) {
            validateCode();
        }
    }

    // Function to handle backspace for empty fields to jump back to the previous field
    function handleBackspace(e, input, index) {
        if (e.key === "Backspace" && input.value === '' && index > 0) {
            codeInputs[index - 1].focus();
        }
    }

    // Function to validate the code if all fields are filled
    function validateCode() {
        const fullCode = [...codeInputs].map(input => input.value.trim()).join('');
        if (fullCode.length === codeInputs.length) {
            console.log("Code to validate: ", fullCode);
            ajaxValidateCode(fullCode);
        }
    }

    // Function to handle AJAX call to validate the code
    function ajaxValidateCode(code) {
        fetch('https://gobrik.com/api/buwana_code_login_process.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `code=${code}&credential_key=${credentialKeyInput.value}`
        })
        .then(response => response.json())
        .then(data => handleAjaxResponse(data))
        .catch(error => console.error('Error:', error));
    }

    // Function to handle AJAX response
    function handleAjaxResponse(data) {
        if (data.status === 'invalid') {
            showErrorMessage("👉 Code is wrong.", 'Incorrect Code', 'red');
            shakeElement(document.getElementById('code-form'));
            clearCodeInputs();
        } else if (data.status === 'success') {
            showSuccessMessage('Code correct! Logging in...');
            window.location.href = data.redirect;
        }
    }

    // Function to show error messages
    function showErrorMessage(errorText, statusText, color) {
        codeErrorDiv.textContent = errorText;
        codeStatusDiv.textContent = statusText;
        codeStatusDiv.style.color = color;
    }

    // Function to show success messages
    function showSuccessMessage(text) {
        codeStatusDiv.textContent = text;
        codeStatusDiv.style.color = 'green';
    }

    // Function to clear all code inputs
    function clearCodeInputs() {
        codeInputs.forEach(input => input.value = '');
        codeInputs[0].focus();
    }

    // Function to handle the shaking animation
    function shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 400);
    }

    // Function to handle the sending of the code
    function submitCodeForm(event) {
        event.preventDefault();
        setButtonState("Sending...", true);
        fetch('https://gobrik.com/api/buwana_code_process.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ 'credential_key': credentialKeyInput.value })
        })
        .then(response => response.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                handleCodeResponse(data);
            } catch (error) {
                showAlertAndResetButton('An unexpected error occurred.');
            }
        })
        .catch(() => showAlertAndResetButton('An unexpected error occurred.'));
    }

    // Function to handle the response after code submission
    function handleCodeResponse(data) {
        codeErrorDiv.textContent = '';
        codeErrorDiv.style.display = 'none';

        switch (data.status) {
            case 'empty_fields':
                alert('Please enter your credential key.');
                resetSendCodeButton();
                break;
            case 'activation_required':
                window.location.href = data.redirect || `activate.php?id=${data.id}`;
                break;
            case 'not_found':
            case 'crednotfound':
                showErrorAndResetButton('Sorry, no matching email was found.');
                break;
            case 'credfound':
                handleSuccessfulCodeSend();
                break;
            default:
                showAlertAndResetButton('An error occurred. Please try again later.');
                break;
        }
    }

    // Function to handle successful code send
    function handleSuccessfulCodeSend() {
        sendCodeButton.value = "✅ Code sent!";
        codeStatusDiv.textContent = 'Code is sent! Check your email.';
        codeStatusDiv.style.display = 'block';
        codeStatusDiv.style.color = '';
        resendCountDown(60, codeStatusDiv, sendCodeButton);
        enableCodeEntry();
    }

    // Function to enable typing in code fields
    function enableCodeEntry() {
        codeInputs.forEach(codeBox => {
            codeBox.style.pointerEvents = 'auto';
            codeBox.style.cursor = 'text';
            codeBox.style.opacity = '1';
        });
    }

    // Function to reset the send code button to its original state
    function resetSendCodeButton() {
        setButtonState("📨 Send Code Again", false);
    }

    // Function to set button state
    function setButtonState(text, isDisabled) {
        sendCodeButton.value = text;
        sendCodeButton.disabled = isDisabled;
        sendCodeButton.style.pointerEvents = isDisabled ? 'none' : 'auto';
        sendCodeButton.style.cursor = isDisabled ? 'auto' : 'pointer';
    }

    // Function to handle alert and reset button
    function showAlertAndResetButton(message) {
        alert(message);
        resetSendCodeButton();
    }

    // Function to show error and reset button
    function showErrorAndResetButton(message) {
        codeErrorDiv.textContent = message;
        codeErrorDiv.style.display = 'block';
        resetSendCodeButton();
    }

    // Function for resend countdown
    function resendCountDown(seconds, displayElement, sendCodeButton) {
        let remaining = seconds;
        const interval = setInterval(() => {
            displayElement.style.color = '';
            displayElement.textContent = `Resend code in ${remaining--} seconds.`;
            if (remaining < 0) {
                clearInterval(interval);
                displayElement.textContent = 'You can now resend the code.';
                resetSendCodeButton();
            }
        }, 1000);
    }

    // Attach submit handler to the send code button
    sendCodeButton.addEventListener('click', submitCodeForm);

});







/*TOGGLE LOGIN BUTTON */



document.addEventListener('DOMContentLoaded', function () {
    const passwordForm = document.getElementById('password-form');
    const codeForm = document.getElementById('code-form');
    const passwordToggle = document.getElementById('password');
    const codeToggle = document.getElementById('code');
    const submitPasswordButton = document.getElementById('submit-password-button');
    const sendCodeButton = document.getElementById('send-code-button');

    // Function to update the form visibility and toggle required attribute based on toggle state
    function updateFormVisibility() {
        if (passwordToggle.checked) {
            // Fade out the code form and then hide it
            codeForm.style.opacity = '0';
            setTimeout(() => {
                codeForm.style.display = 'none';
                passwordForm.style.display = 'block';
                // Fade in the password form
                setTimeout(() => {
                    passwordForm.style.opacity = '1';
                }, 10);
            }, 300); // Time for the fade-out transition

        } else if (codeToggle.checked) {
            // Fade out the password form and then hide it
            passwordForm.style.opacity = '0';
            setTimeout(() => {
                passwordForm.style.display = 'none';
                codeForm.style.display = 'block';
                // Fade in the code form
                setTimeout(() => {
                    codeForm.style.opacity = '1';
                }, 10);
            }, 300); // Time for the fade-out transition
        }
    }

    // Function to update the visibility of the submit buttons
    function updateButtonVisibility() {
        if (passwordToggle.checked) {
            sendCodeButton.style.display = 'none';
            setTimeout(() => {
                submitPasswordButton.style.display = 'block';
            }, 600); // Delay for transition effect
        } else {
            submitPasswordButton.style.display = 'none';
            setTimeout(() => {
                sendCodeButton.style.display = 'block';
            }, 600); // Delay for transition effect
        }
    }

    // Event listener for toggle button clicks
    document.querySelectorAll('.toggle-button').forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('password')) {
                passwordToggle.checked = true;
                codeToggle.checked = false;
            } else {
                codeToggle.checked = true;
                passwordToggle.checked = false;
            }

            // Update form action, visibility, and buttons based on the selected toggle
            updateFormAction();
            updateFormVisibility();
            updateButtonVisibility();
        });
    });

    function updateFormAction() {
        const form = document.getElementById('login');
        const passwordField = document.getElementById('password');

        if (codeToggle.checked) {
            // If the code option is selected
            passwordField.removeAttribute('required');
            form.action = 'https://gobrik.com/api/buwana_code_process.php';
            console.log("Code is checked.");
        } else if (passwordToggle.checked) {
            // If the password option is selected
            passwordField.setAttribute('required', 'required');
            form.action = 'login_process.php';
            console.log("Password is checked.");
        }
    }
});



document.addEventListener("DOMContentLoaded", function () {
    // Function to extract the query parameters from the URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Function to get status messages
    function getStatusMessages(status, lang, firstName = '') {
        const messages = {
            logout: {
                en: {
                    main: "You're logged out.",
                    sub: `When you're ready${firstName ? ' ' + firstName : ''}, login again with your account credentials.`
                },
                fr: {
                    main: "Vous avez été déconnecté.",
                    sub: `Quand vous êtes prêt${firstName ? ' ' + firstName : ''}, reconnectez-vous avec vos identifiants.`
                },
                id: {
                    main: "Anda telah keluar.",
                    sub: `Saat Anda siap${firstName ? ' ' + firstName : ''}, login lagi dengan kredensial akun Anda.`
                },
                es: {
                    main: "Has cerrado tu sesión.",
                    sub: `Cuando estés listo${firstName ? ' ' + firstName : ''}, vuelve a iniciar sesión con tus credenciales.`
                }
            },
            firsttime: {
                en: {
                    main: "Your Buwana Account is Created! 🎉",
                    sub: `And your Earthen subscriptions are confirmed.  Now${firstName ? ' ' + firstName : ''}, please login again with your new account credentials.`
                },
                fr: {
                    main: "Votre compte Buwana est créé ! 🎉",
                    sub: `Maintenant${firstName ? ' ' + firstName : ''}, connectez-vous avec vos nouvelles identifiants.`
                },
                id: {
                    main: "Akun Buwana Anda sudah Dibuat! 🎉",
                    sub: `Sekarang${firstName ? ' ' + firstName : ''}, silakan masuk dengan kredensial baru Anda.`
                },
                es: {
                    main: "¡Tu cuenta de Buwana está creada! 🎉",
                    sub: `Ahora${firstName ? ' ' + firstName : ''}, por favor inicia sesión con tus nuevas credenciales.`
                }
            },
            default: {
                en: {
                    main: "Login to EarthCal",
                    sub: `Please login with your Buwana account credentials.`
                },
                fr: {
                    main: "Bon retour !",
                    sub: `Veuillez vous reconnecter avec vos identifiants.`
                },
                id: {
                    main: "Selamat datang kembali!",
                    sub: `Silakan masuk lagi dengan kredensial akun Anda.`
                },
                es: {
                    main: "¡Bienvenido de nuevo!",
                    sub: `Por favor inicia sesión de nuevo con tus credenciales.`
                }
            }
        };

        const selectedMessages = messages[status] && messages[status][lang]
            ? messages[status][lang]
            : messages.default[lang] || messages.default.en;

        return {
            main: selectedMessages.main,
            sub: selectedMessages.sub
        };
    }
/*

    // Consolidated function to handle error responses and show the appropriate error div
    function handleErrorResponse(errorType) {
        // Hide both error divs initially
        document.getElementById('password-error').style.display = 'none';
        document.getElementById('no-buwana-email').style.display = 'none';

        // Show the appropriate error div based on the errorType
        if (errorType === 'invalid_password') {
            document.getElementById('password-error').style.display = 'block'; // Show password error
            shakeElement(document.getElementById('password-form'));
        } else if (errorType === 'invalid_user' || errorType === 'invalid_credential') {

            shakeElement(document.getElementById('credential-input-field'));
            document.getElementById('no-buwana-email').style.display = 'block'; // Show email error for invalid user/credential
        }
    }

    // Get the values from the URL query parameters
    const status = getQueryParam('status') || ''; // status like 'loggedout', 'firsttime', etc.
    const lang = document.documentElement.lang || 'en'; // Get language from the <html> tag or default to 'en'
    const firstName = getQueryParam('firstName') || ''; // Optional first name for the message
    const credentialKey = getQueryParam('key'); // credential_key
    const code = getQueryParam('code'); // Get the code from the URL
    const buwanaId = getQueryParam('id'); // Get the id from the URL

    // Fetch and display the status message based on the status and language
    const { main, sub } = getStatusMessages(status, lang, firstName);
    document.getElementById('status-message').textContent = main;
    document.getElementById('sub-status-message').textContent = sub;

    // Fill the credential_key input field if present in the URL
    if (credentialKey) {
        document.getElementById('credential_key').value = credentialKey;
    }


    // Handle form submission validation
    document.getElementById('login').addEventListener('submit', function (event) {
        var credentialValue = document.getElementById('credential_key').value;
        var password = document.getElementById('password').value;

        // Simple form validation before submitting
        if (credentialValue === '' || password === '') {
            event.preventDefault();
            handleErrorResponse('invalid_password'); // Show password error if fields are empty
            shakeElement(password-form);
        }
    });

    // Handle errors based on status parameter in URL
    const errorType = status; // Status used as errorType (e.g., invalid_password, invalid_user)
    if (errorType) {
        handleErrorResponse(errorType);
    }
*/


// Check if code and buwana_id are present in the URL for automatic code processing
//if (code && buwanaId) {
//    // Update status messages
//    document.getElementById('status-message').textContent = "Checking your code...";
//    document.getElementById('sub-status-message').textContent = "One moment please.";
//
//    // Add a 0.3 sec pause
//    setTimeout(() => {
//        // Set the toggle to code
//        document.getElementById('code').checked = true;
//
//        // Run functions to update form and button visibility
//        updateFormVisibility();
//        updateButtonVisibility();
//
//        // Update the sendCodeButton and codeStatusDiv
//        const sendCodeButton = document.getElementById('send-code-button');
//        const codeStatusDiv = document.getElementById('code-status');
//        sendCodeButton.value = "Processing..."; // Indicate processing
//        sendCodeButton.disabled = true; // Disable the button to prevent multiple submissions
//        sendCodeButton.style.pointerEvents = 'none'; // Remove pointer events
//        sendCodeButton.style.cursor = 'auto';
//        codeStatusDiv.textContent = "Verifying your login code..."; // Update status message
//
//        // Add another 0.3 sec pause before populating code fields
//        setTimeout(() => {
//            // Populate the five code-fields one by one with 0.2s pauses
//            const codeInputs = document.querySelectorAll('.code-box');
//            code.split('').forEach((digit, index) => {
//                if (index < codeInputs.length) {
//                    setTimeout(() => {
//                        codeInputs[index].value = digit;
//
//                        // Simulate 'input' event to trigger listeners
//                        const event = new Event('input', { bubbles: true });
//                        codeInputs[index].dispatchEvent(event);
//
//                        if (index === codeInputs.length - 1) {
//                            // Run the function to process the login after all fields are filled
//                            updateFormAction();
//                        }
//                    }, index * 200); // Pause 0.2s for each character
//                }
//            });
//        }, 300); // Pause for 0.3 seconds
//    }, 300); // Initial pause for 0.3 seconds
//}




});




/*Globalized functions*/

 function updateFormVisibility() {
  const passwordForm = document.getElementById('password-form');
    const codeForm = document.getElementById('code-form');
    const passwordToggle = document.getElementById('password');
    const codeToggle = document.getElementById('code');
    const submitPasswordButton = document.getElementById('submit-password-button');
    const sendCodeButton = document.getElementById('send-code-button');

        if (passwordToggle.checked) {
            // Fade out the code form and then hide it
            codeForm.style.opacity = '0';
            setTimeout(() => {
                codeForm.style.display = 'none';
                passwordForm.style.display = 'block';
                // Fade in the password form
                setTimeout(() => {
                    passwordForm.style.opacity = '1';
                }, 10);
            }, 300); // Time for the fade-out transition

        } else if (codeToggle.checked) {
            // Fade out the password form and then hide it
            passwordForm.style.opacity = '0';
            setTimeout(() => {
                passwordForm.style.display = 'none';
                codeForm.style.display = 'block';
                // Fade in the code form
                setTimeout(() => {
                    codeForm.style.opacity = '1';
                }, 10);
            }, 300); // Time for the fade-out transition
        }
    }

    // Function to update the visibility of the submit buttons
    function updateButtonVisibility() {
     const passwordForm = document.getElementById('password-form');
    const codeForm = document.getElementById('code-form');
    const passwordToggle = document.getElementById('password');
    const codeToggle = document.getElementById('code');
    const submitPasswordButton = document.getElementById('submit-password-button');
    const sendCodeButton = document.getElementById('send-code-button');

        if (passwordToggle.checked) {
            sendCodeButton.style.display = 'none';
            setTimeout(() => {
                submitPasswordButton.style.display = 'block';
            }, 600); // Delay for transition effect
        } else {
            submitPasswordButton.style.display = 'none';
            setTimeout(() => {
                sendCodeButton.style.display = 'block';
            }, 600); // Delay for transition effect
        }
    }


    function updateFormAction() {
     const passwordForm = document.getElementById('password-form');
    const codeForm = document.getElementById('code-form');
    const passwordToggle = document.getElementById('password');
    const codeToggle = document.getElementById('code');
    const submitPasswordButton = document.getElementById('submit-password-button');
    const sendCodeButton = document.getElementById('send-code-button');

        const form = document.getElementById('login');
        const passwordField = document.getElementById('password');

        if (codeToggle.checked) {
            // If the code option is selected
            passwordField.removeAttribute('required');
            form.action = 'https://gobrik.com/api/buwana_code_process.php';
            console.log("Code is checked.");
        } else if (passwordToggle.checked) {
            // If the password option is selected
            passwordField.setAttribute('required', 'required');
            form.action = 'login_process.php';
            console.log("Password is checked.");
        }
    }

































/*Trigger the credentials menu from the key symbol in the credentials field.*/

document.addEventListener("DOMContentLoaded", function () {
    const toggleSelectIcon = document.querySelector('.toggle-select-key');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const credentialKeyInput = document.getElementById('credential_key');
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');

    // Toggle dropdown menu visibility on click
    toggleSelectIcon.addEventListener('click', function () {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', function (e) {
        if (!toggleSelectIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });

    // Handle dropdown item selection
    dropdownItems.forEach(function (item) {
        item.addEventListener('click', function () {
            if (!item.classList.contains('disabled')) {
                credentialKeyInput.value = item.textContent.trim();
                dropdownMenu.style.display = 'none';
            }
        });
    });
});


/* PASSWORD RESET MODAL  */
function showPasswordReset(type, lang = '<?php echo $lang; ?>', email = '') {
    const modal = document.getElementById('form-modal-message');
    const photobox = document.getElementById('modal-photo-box');
    const messageContainer = modal.querySelector('.modal-message');
    let content = '';
    photobox.style.display = 'none';

    switch (type) {
        case 'reset':
            let title, promptText, buttonText, errorText;

            switch (lang) {
                case 'fr':
                    title = "Réinitialiser le mot de passe";
                    promptText = "Entrez votre email pour réinitialiser votre mot de passe :";
                    buttonText = "Réinitialiser le mot de passe";
                    errorText = "🤔 Hmmm... nous ne trouvons aucun compte utilisant cet email !";
                    break;
                case 'es':
                    title = "Restablecer la contraseña";
                    promptText = "Ingrese su correo electrónico para restablecer su contraseña:";
                    buttonText = "Restablecer la contraseña";
                    errorText = "🤔 Hmmm... no podemos encontrar una cuenta que use este correo electrónico!";
                    break;
                case 'id':
                    title = "Atur Ulang Kata Sandi";
                    promptText = "Masukkan email Anda untuk mengatur ulang kata sandi Anda:";
                    buttonText = "Atur Ulang Kata Sandi";
                    errorText = "🤔 Hmmm... kami tidak dapat menemukan akun yang menggunakan email ini!";
                    break;
                default: // 'en'
                    title = "Reset Password";
                    promptText = "Enter your email to reset your password:";
                    buttonText = "Reset Password";
                    errorText = "🤔 Hmmm... we can't find an account that uses this email!";
                    break;
            }

            content = `
                <div style="text-align:center;width:100%;margin:auto;margin-top:10px;margin-bottom:10px;">
                    <h1>🐵</h1>
                </div>
                <div class="preview-title">${title}</div>
                <form id="resetPasswordForm" action="../scripts/reset_password.php" method="POST">
                    <div class="preview-text" style="font-size:medium;">${promptText}</div>
                    <input type="email" name="email" required value="${email}">
                    <div style="text-align:center;width:100%;margin:auto;margin-top:10px;margin-bottom:10px;">
                        <div id="no-buwana-email" class="form-warning" style="display:none;margin-top:5px;margin-bottom:5px;" data-lang-id="010-no-buwana-email">${errorText}</div>
                        <button type="submit" class="submit-button enabled">${buttonText}</button>
                    </div>
                </form>
            `;
            break;

        default:
            content = '<p>Invalid term selected.</p>';
    }

    messageContainer.innerHTML = content;

    modal.style.display = 'flex';
    document.getElementById('page-content').classList.add('blurred');
    document.getElementById('footer-full').classList.add('blurred');
    document.body.classList.add('modal-open');
}

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);


//Relevant still?  Needs revision for status update of page variables.

    // Check if the 'email_not_found' parameter exists in the URL
    if (urlParams.has('email_not_found')) {
        // Get the email from the URL parameters
        const email = urlParams.get('email') || '';

        // Get the language from the backend (PHP) or default to 'en'
        const lang = '<?php echo $lang; ?>'; // Make sure this is echoed from your PHP

        // Show the reset modal with the pre-filled email and appropriate language
//         showPasswordReset('reset', lang, email);

        // Wait for the modal to load, then display the "email not found" error message
        setTimeout(() => {
            const noBuwanaEmail = document.getElementById('no-buwana-email');
            if (noBuwanaEmail) {
                console.log("Displaying the 'email not found' error.");
                noBuwanaEmail.style.display = 'block';
            }
        }, 100);
    }
};



// Function to enable typing in the code boxes
function enableCodeEntry() {
    const codeBoxes = document.querySelectorAll('.code-box');

    codeBoxes.forEach((box, index) => {
        box.classList.add('enabled');  // Enable typing by adding the 'enabled' class

        box.addEventListener('input', function() {
            if (box.value.length === 1 && index < codeBoxes.length - 1) {
                codeBoxes[index + 1].focus();  // Jump to the next box
            }
        });
    });

    // Set focus on the first box
    codeBoxes[0].focus();
}



