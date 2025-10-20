// EARTHCAL TRANSLATIONS
// translations/en.js


export const translations = {


// THE GUIDED TOUR

  tour: {
    welcomeIntro: "Welcome to EarthCal!",
    welcomeParagraph: "It's time to evolve our calendars! It's time to transition from lines and squares, to circles and cycles. EarthCal is your new window to the days, months, years and other Earthen cycles to which our moments on planet Earth dance. Use EarthCal to manage and sync your events with the cycles of the moon, the planets and magnificent creatures.",

    oneOrbitTitle: "One Year.\nOne Orbit.",
    oneOrbitDesc: "EarthCal starts with a view of the current year. Earth takes ~365 days to spin around the Sun so that's how we've divided up EarthCal's main circle (we make it 366 on a leap year!). Click any of the divisions and watch as Earth animates to that position in its yearly spin around the Sun for that particular day. To zoom, click a month for a closer view of that portion of Earth's orbital progress.",

    neighborhoodTitle: "Our Neighbourhood",
    neighborhoodDesc: "When you click on any day, you can also view the progress and position of our planetary neighbours. Click any planet to get detailed orbital data. Watch oppositions, conjunctions and planetary alignments happen in real time. This not only helps us understand the night sky, it helps us align with much larger cycles of time (Neptune takes 165 Earth years to complete its orbit!).",

    getLunarTitle: "Get Lunar",
    getLunarDesc: "Notice the center of the calendar while you skim over the days of the year? You can see in real-time how the phase of the moon changes over the course of the year. Click the moon in the bottom right for detailed orbital data.",

    animalCyclesTitle: "Great Earthling Cycles",
    animalCyclesDesc: "Great civilizations didn't just follow celestial cycles, they used the cycles of the great creatures around them to celebrate time. Click on the Earth icon at the bottom left corner to see where the grey whales of North America are in their migration at a particular time of the year. More animals coming soon!",

    addEventsTitle: "Add Events & Cycles",
    addEventsDesc: "Use EarthCal to record your events and daily to-dos. Add your one time events and annual cycles (like birthdays!) to the calendar by clicking the top left + for the highlighted date. Google Calendar sync coming soon.",

    buttonNextWelcome: "How it works ➔",
    buttonNextOrbit: "The Planets ➔",
    buttonNextPlanets: "The Moon ➔",
    buttonNextMoon: "Great Earthling Cycles ➔",
    buttonNextCycles: "Next ➔",
    buttonDone: "✓ Done",
    buttonBack: "↩ Back"
  },

//DATE SEARCH

    goToDateTitle: "Go to date...",
    prevYear: "Previous Year",
    nextYear: "Next Year",
    goToDate: "Go to Date",
    invalidDay: "Please make sure you're choosing a reasonable date under 31!",
    invalidFebruary: "Please make sure you're choosing a reasonable date for February!",
    invalidLeapYear: "Please choose a day under 29 for February in a non-leap year!",


// CORE DATE TERMS
    daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    monthsOfYear: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ],

    ordinalSuffixes: ['st', 'nd', 'rd', 'th'],

    dayTranslations: 'Day',
    ofTranslations: 'of',
    todayYouveGot: "On this day you've got",
    event: "event",
    events: "events",


//VERSION ANNOUNCEMENT
    versioning: {
        title: "Welcome to EarthCal 0.9!",
        subtitle: "EarthCal has been updated for June 2025! We're now at version 0.94.:",
        features: [
            "You can now login with a Buwana account to save and sync your events",
            "Time zone support is now activated! Use the settings button to switch.",
            "Language support upgrade!  Now up to 75% of the app is translated.",
            "Public calendars are now available to add to your view (you must login first)",
            "The migratory cycle of the black heron is synced with the calendar.",
            "Minor and major bug fixes.",

        ],
        gotIt: "👍 Let's Go!",
        tour: " 🌏 More: EarthCal Tour",
    },

// SETTINGS
settings: {
    languages: {
        EN: "EN - English",
        ID: "ID - Indonesian",
        FR: "FR - Français",
        ES: "ES - Español",
        DE: "DE - Deutsch",
        AR: "AR - العربية",
        ZH: "ZH - 中文" // ✅ Chinese added
    },
    applySettings: "Apply Settings",
    saving: "Saving...",
    darkMode: {
        legend: "Toggle dark and light mode:",
        remember: "Remember for all pages"
    }
},


// DATE SEARCH
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
        invalidLeapYear: "Please choose a day under 29 for February in a non-leap year!",
        searching: "Searching..."
    },


//LOG IN SCREEN
    loggedIn: {
        welcome: "Welcome",
        syncingInfo: "You are managing the following personal and public calendars...",
        publicCalendarsIntro: "You are subscribed to the following public calendars...",
        noPersonal: "No personal calendars available.",
        addPersonal: "Add new personal calendar",
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


//MAIN MENU
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
        authBy: "Authentication by"

    },


    // ADD DATECYCLE - still needs work!

addCycle: {
        titlePrefix: "Add an event for",
        addButton: "+ Add DateCycle",
        placeholderCalendar: "My Calendar"
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
