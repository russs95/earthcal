// translations/en.js

export const translations = {


// THE GUIDED TOUR

tour: {
    welcomeIntro: "Welcome to EarthCal!",
    welcomeParagraph: "EarthCal is a calendar that connects with Earth's cycles. Use our app to manage and sync your events with the cycles of the moon, the planets, and the Earth. Click through to explore EarthCal's philosophy, functions, and features.",
    oneOrbitTitle: "One Year.\nOne Orbit.",
    oneOrbitDesc: "The EarthCycles calendar lets you see each year as one spin of Earth around the Sun. Click any of the 365 divisions of the EarthCal circle to see where the Earth is in its orbit and that day's data. The progression of colors shows the solar and lunar months.",
    neighborhoodTitle: "Our Neighbourhood",
    neighborhoodDesc: "As you watch Earth spin around the Sun, you can see our planetary neighbours spin too! This helps you understand the night sky and connects you to the much longer cycles of each planet's orbit (Neptune takes 165 Earth years!).",
    getLunarTitle: "Get Lunar",
    getLunarDesc: "Notice the center of the calendar while you skim over the days of the year? You can see how the phase of the moon changes over the year. Click the moon in the bottom left for even more live data.",
    animalCyclesDesc: "Great civilizations used the cycles of animals to track time. Click the Earth icon in the bottom left corner to see where the grey whales of North America are during their yearly migration. More animals coming soon!",
    addEventsTitle: "Add Your Events",
    addEventsDesc: "Use EarthCal to record your events and to-dos. Add one-time events and yearly cycles (like birthdays) by clicking the + at the top left of a date. Google Calendar sync is coming soon.",
    next: "Next ➔",
    back: "↩ Back",
    done: "✓ Done"
  }


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


    addCycle: {
        titlePrefix: "Add an event for",
        addButton: "+ Add DateCycle",
        placeholderCalendar: "My Calendar"
    }


};
