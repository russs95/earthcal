// translations/en.js

export const translations = {


//DATE SEARCH

    goToDateTitle: "Go to date...",
    prevYear: "Previous Year",
    nextYear: "Next Year",
    goToDate: "Go to Date",
    invalidDay: "Please make sure you're choosing a reasonable date under 31!",
    invalidFebruary: "Please make sure you're choosing a reasonable date for February!",
    invalidLeapYear: "Please choose a day under 29 for February in a non-leap year!",



    daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    monthsOfYear: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ],

    ordinalSuffixes: ['st', 'nd', 'rd', 'th'],

    dayTranslations: 'Day',
    ofTranslations: 'of',

    versioning: {
        title: "Welcome to EarthCal 0.9!",
        subtitle: "EarthCal has been completely overhauled in preparation for our 2025 v1.0 release. Major new features in v0.9 include:",
        features: [
            "Months now break out! Click any month's color bar to expand its circle.",
            "Add events and cycles: Hit the + to add events, goals, and to-dos to any day.",
            "Edit an event, push it forward a day or check it off!",
            "Initial multi-lingual support for five languages added.",
            "Clock view. Keep EarthCal up as a clock on a second monitor.",
            "The migratory cycle of the black heron is synced with the calendar."
        ],
        gotIt: "👍 Got it!",
        tour: " 🌏 More: EarthCal Tour",
    },


    settings: {
        languages: {
            EN: "EN - English",
            ID: "ID - Indonesian",
            FR: "FR - Français",
            ES: "ES - Español",
            DE: "DE - Deutsch",
            AR: "AR - العربية"
        },
        applySettings: "Apply Settings",
        darkMode: {
            legend: "Toggle dark and light mode:",
            remember: "Remember for all pages"
        }
    },

    openDateSearch: {
        title: "Go to date...",
        placeholderDay: "Day",
        months: [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],
        prevYear: "Previous Year",
        nextYear: "Next Year",
        goToDate: "Go to Date",
        invalidDay: "Please make sure you're choosing a reasonable date under 31!",
        invalidFebruary: "Please make sure you're choosing a reasonable date for February!",
        invalidLeapYear: "Please choose a day under 29 for February in a non-leap year!"
    },



    loggedIn: {
        welcome: "Welcome",
        syncingInfo: "You are syncing the following personal and public calendars:",
        noPersonal: "No personal calendars available.",
        noPublic: "No public calendars available.",
        syncNow: "Sync Now",
        logout: "Logout",
        notYetSynced: "Your dateCycles haven’t been synced yet.",
        lastSynced: "Last synced on"
    },


    login: {
        emailPlaceholder: "Your e-mail...",
        passwordPlaceholder: "Your password...",
        statusFirstTime: (emoji) => `🎉 Your Buwana Account has been created! ${emoji}`,
        statusReturning: (emoji, name) => `${emoji} Welcome back, ${name}`,
        credentialLabel: "Login with your Buwana account credentials.",
        forgotPassword: "Forgot your password?",
        resetLink: "Reset it.",
        sendCode: "📨 Send Code",
        login: "Login"
    },

    mainMenu: {
        title: "Sync with Earth's cycles",
        featureTour: "Feature Tour",
        latestVersion: "Latest Version Info",
        newsletter: "Earthen.io Newsletter",
        guide: "Calendar Guide ↗",
        purchasePrint: "Purchase Print ↗",
        about: "About the Project ↗",
        darkModeToggle: "Switch Dark/Day themes",
        developedBy: "EarthCal is developed by",
        authBy: "Authentication by",
        loggedIn: {
            welcome: "Welcome "
        }
    },

    timezones: [
    { value: 'Etc/GMT+12', label: 'Baker Island (UTC-12)' },
    { value: 'Pacific/Pago_Pago', label: 'Samoa (UTC-11)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii (UTC-10)' },
    { value: 'America/Anchorage', label: 'Alaska (UTC-9)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { value: 'America/Denver', label: 'Denver (UTC-7)' },
    { value: 'America/Chicago', label: 'Chicago (UTC-6)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'America/Toronto', label: 'Toronto (UTC-5/UTC-4 DST)' },
    { value: 'America/Halifax', label: 'Halifax (UTC-4)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'Atlantic/South_Georgia', label: 'South Georgia (UTC-2)' },
    { value: 'Atlantic/Azores', label: 'Azores (UTC-1)' },
    { value: 'Etc/UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Europe/London', label: 'London (UTC+0/UTC+1 DST)' },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
    { value: 'Europe/Helsinki', label: 'Helsinki (UTC+2)' },
    { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' },
    { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
    { value: 'Asia/Karachi', label: 'Karachi (UTC+5)' },
    { value: 'Asia/Dhaka', label: 'Dhaka (UTC+6)' },
    { value: 'Asia/Jakarta', label: 'Jakarta (UTC+7)' },
    { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
    { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
    { value: 'Pacific/Guadalcanal', label: 'Guadalcanal (UTC+11)' },
    { value: 'Pacific/Auckland', label: 'Auckland (UTC+12)' }
],




};
