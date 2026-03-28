// EARTHCAL TRANSLATIONS
// translations/de.js

export const translations = {

// THE GUIDED TOUR

  tour: {
    welcomeIntro: "Willkommen bei EarthCal!",
    welcomeParagraph: "Es ist Zeit, unsere Kalender weiterzuentwickeln! Es ist Zeit, von Linien und Kästchen zu Kreisen und Zyklen überzugehen. EarthCal ist dein neues Fenster zu den Tagen, Monaten, Jahren und anderen irdischen Zyklen, zu denen sich unsere Momente auf dem Planeten Erde bewegen. Nutze EarthCal, um deine Ereignisse mit den Zyklen des Mondes, der Planeten und großartiger Lebewesen zu verwalten und zu synchronisieren.",

    oneOrbitTitle: "Ein Jahr.\nEine Umlaufbahn.",
    oneOrbitDesc: "EarthCal beginnt mit einer Ansicht des aktuellen Jahres. Die Erde braucht etwa 365 Tage, um die Sonne zu umkreisen – daher haben wir den Hauptkreis von EarthCal entsprechend unterteilt (in Schaltjahren machen wir daraus 366!). Klicke auf eine der Teilungen und sieh zu, wie sich die Erde animiert zu dieser Position in ihrem Jahreslauf bewegt. Um zu zoomen, klicke auf einen Monat für eine genauere Ansicht dieses Abschnitts der Erdumlaufbahn.",

    neighborhoodTitle: "Unsere Nachbarschaft",
    neighborhoodDesc: "Wenn du auf einen Tag klickst, kannst du auch den Fortschritt und die Position unserer planetaren Nachbarn sehen. Klicke auf einen Planeten, um detaillierte Orbitdaten zu erhalten. Beobachte in Echtzeit Oppositionen, Konjunktionen und planetare Ausrichtungen. Das hilft uns nicht nur, den Nachthimmel zu verstehen, sondern auch, uns mit viel größeren Zeitzyklen zu verbinden (Neptun braucht 165 Erdjahre für einen Umlauf!).",

    getLunarTitle: "Mondphasen",
    getLunarDesc: "Fällt dir das Zentrum des Kalenders auf, während du durch die Tage des Jahres gehst? Du kannst in Echtzeit sehen, wie sich die Mondphasen im Jahresverlauf verändern. Klicke auf den Mond unten rechts, um detaillierte Orbitdaten anzuzeigen.",

    animalCyclesTitle: "Große irdische Zyklen",
    animalCyclesDesc: "Große Zivilisationen haben nicht nur den Himmel beobachtet, sondern auch die Zyklen großer Tiere um sie herum genutzt, um Zeit zu feiern. Klicke auf das Erdsymbol unten links, um zu sehen, wo sich die Grauwale Nordamerikas zu einer bestimmten Zeit im Jahr in ihrer Migration befinden. Weitere Tiere folgen bald!",

    addEventsTitle: "Ereignisse & Zyklen hinzufügen",
    addEventsDesc: "Nutze EarthCal, um deine Ereignisse und täglichen Aufgaben festzuhalten. Füge einmalige Ereignisse und jährliche Zyklen (wie Geburtstage!) hinzu, indem du auf das Pluszeichen oben links für das markierte Datum klickst. Google-Kalender-Synchronisierung kommt bald.",

    buttonNextWelcome: "So funktioniert’s ➔",
    buttonNextOrbit: "Die Planeten ➔",
    buttonNextPlanets: "Der Mond ➔",
    buttonNextMoon: "Große irdische Zyklen ➔",
    buttonNextCycles: "Weiter ➔",
    buttonDone: "✓ Fertig",
    buttonBack: "↩ Zurück"
  },

// DATE SEARCH

  goToDateTitle: "Zum Datum springen...",
  prevYear: "Vorheriges Jahr",
  nextYear: "Nächstes Jahr",
  goToDate: "Zum Datum",
  invalidDay: "Bitte wähle ein sinnvolles Datum unter 31!",
  invalidFebruary: "Bitte wähle ein gültiges Datum für den Februar!",
  invalidLeapYear: "Bitte wähle für Februar in einem Nicht-Schaltjahr einen Tag unter 29!",

// CORE DATE TERMS

  daysOfWeek: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],

  monthsOfYear: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ],

  ordinalSuffixes: ['st', 'nd', 'rd', 'th'], // not used in German

  dayTranslations: 'Tag',
  ofTranslations: 'von',
  todayYouveGot: 'Heute hast du',
  event: 'Ereignis',
  events: 'Ereignisse',

// VERSION ANNOUNCEMENT

  versioning: {
    title: "Earthcal v1.3",
    subtitle: "Pünktlich zur Frühlings-Tagundnachtgleiche freuen wir uns, Earthcal Version 1.3 zu veröffentlichen. Die gesamte Codebasis wurde überprüft, um Fehler zu beheben und Installation sowie Funktionalität zu verbessern. Aber das ist noch nicht das Aufregendste. Was dann? Wir rufen jetzt die Earthen Auspicer API auf. Earthcal berechnet bereits astronomische Zyklen für Mond, Sonne und Planeten – visuell und numerisch. Aber was bedeuten sie? Indigene Traditionen, Chronobiologie und Biodynamik bieten klare Antworten! Ob der Mond abnimmt und aufsteigt, im Apogäum ist, voll und absteigt – wir haben diese drei Quellen gekreuzreferenziert, um einen Datumsinterpreter zu erstellen. Wenn du nun ein Datumselement hinzufügst, siehst du die Erdlichen Auspizien dieses Datums! Keine Astrologie, keine KI – eine komplexe semantische Engine aus astronomischen Daten, Biodynamik und Vorfahrenwissen. Klappe die Datenfenster aus, um mehr zu sehen.",
    features: [
      "Auspicer Version 1.0 jetzt aktiv (+ drücken, um Ereignis hinzuzufügen)",
      "Jedi-Modus jetzt für erweiterte Funktionen verfügbar",
      "Tierkreispositionen können jetzt ein- und ausgeblendet werden",
      "Neue macOS-Version von EarthCal für den Desktop",
    ],
    gotIt: "👍 Los geht’s!",
    tour: " 🌏 EarthCal Guided Tour",
  },

// SETTINGS

  settings: {
    languages: {
      EN: "EN - Englisch",
      ID: "ID - Indonesisch",
      FR: "FR - Französisch",
      ES: "ES - Spanisch",
      DE: "DE - Deutsch",
      AR: "AR - Arabisch",
      ZH: "ZH - Chinesisch"
    },
    applySettings: "Einstellungen anwenden",
    saving: "Speichern...",
    darkMode: {
      legend: "Dunkel- und Hellmodus umschalten:",
      remember: "Für alle Seiten merken"
    }
  },

  // DATE SEARCH
openDateSearch: {
  title: "Zum Datum gehen...",
  placeholderDay: "Tag",
  months: [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ],
  prevYear: "Vorheriges Jahr",
  nextYear: "Nächstes Jahr",
  goToDate: "Zum Datum",
  invalidDay: "Bitte wähle ein gültiges Datum unter 31!",
  invalidFebruary: "Bitte wähle ein gültiges Datum für den Februar!",
  invalidLeapYear: "Bitte wähle einen Tag unter 29 für Februar in einem Nicht-Schaltjahr!",
  searching: "Suchen..."
},

// LOG IN SCREEN
loggedIn: {
  welcome: "Willkommen",
  syncingInfo: "Du verwaltest die folgenden Earthcals...",
  publicCalendarsIntro: "Du hast folgende öffentliche Kalender abonniert...",
  webcalHasSubscriptions: "Du hast folgende iCal-Abonnements...",
  webcalNoSubscriptions: "Du hast noch keine Webcal-Abonnements.",
  noPersonal: "Keine persönlichen Kalender verfügbar.",
  addPersonal: "Neuen Earthcal hinzufügen...",
  browsePublic: "Öffentliche Earthcals entdecken und abonnieren...",
  noPublic: "Keine öffentlichen Kalender verfügbar.",
  noWebcal: "Noch keine iCal-Abonnements verbunden.",
  syncNow: "Jetzt synchronisieren",
  logout: "Abmelden",
  notYetSynced: "Deine DateCycles wurden noch nicht synchronisiert.",
  lastSynced: "Zuletzt synchronisiert am"
},

login: {
  emailPlaceholder: "Deine E-Mail...",
  passwordPlaceholder: "Dein Passwort...",
  statusFirstTime: (emoji) => `🎉 Dein Buwana-Konto wurde erstellt! ${emoji}`,
  statusReturning: (emoji, name) => `Willkommen ${name}.  Melde dich mit einem Buwana-Konto an, um die leistungsstarken Kalender- und Veranstaltungsfunktionen von EarthCal zu nutzen.`,
  credentialLabel: "Melde dich mit deinen Buwana-Zugangsdaten an.",
  forgotPassword: "Passwort vergessen?",
  resetLink: "Zurücksetzen.",
  sendCode: "📨 Code senden",
  login: "Anmelden"
},

// MAIN MENU
mainMenu: {
  title: "Mit den Zyklen der Erde synchronisieren",
  featureTour: "Funktionen-Rundgang",
  latestVersion: "Neueste Version",
  upgradeToPro: "Auf Pro upgraden",
  newsletter: "Earthen.io Newsletter",
  guide: "Kalenderanleitung ↗",
  purchasePrint: "Gedruckte Version kaufen ↗",
  about: "Über das Projekt ↗",
  darkModeToggle: "Dunkel-/Tagmodus wechseln",
  developedBy: "EarthCal wird entwickelt von",
  authBy: "Authentifizierung durch"
},

subscriptions: {
  heading: "EarthCal upgraden",
  currentPlan: "Du nutzt aktuell den {planName}-Plan.",
  currentStatus: "Status: {status}",
  loginRequired: "Bitte melde dich an, um dein EarthCal-Abonnement zu verwalten.",
  loadError: "Wir konnten deine Abonnementdetails nicht laden. Bitte versuche es in wenigen Augenblicken erneut.",
  noPlans: "Zurzeit sind keine Pläne verfügbar.",
  tableHeaders: {
    plan: "Plan",
    description: "Beschreibung",
    price: "Preis"
  },
  priceFree: "Kostenlos",
  billingSuffix: {
    month: "/ Monat",
    year: "/ Jahr",
    lifetime: "Lebenslanger Zugang"
  },
  currentBadge: "Aktueller Plan"
},

// OFFLINE MESSAGES
offline: {
  bannerNonJedi: "Du scheinst offline zu sein! Wieder verbinden, um zu synchronisieren. Oder... auf Jedi Offline upgraden.",
  bannerJediModeOn: "Du bist im Jedi Offline-Modus! Wieder verbinden, um zu synchronisieren.",
  bannerJediModeOff: "Du bist offline. Offline-Modus ist deaktiviert. Wieder verbinden, um zu synchronisieren.",
  alertPadwan: "Du scheinst offline zu sein! Bitte wieder verbinden, um EarthCal zu nutzen. Oder... auf ein Jedi-Konto upgraden und den nützlichen Offline-Modus verwenden.",
  alertJedi: "Du scheinst offline zu sein! Bitte wieder verbinden oder den Offline-Modus in den Einstellungen aktivieren, um auf zwischengespeicherte Daten zuzugreifen.",
},

// ADD DATECYCLE
addCycle: {
  titlePrefix: "Ereignis hinzufügen für",
  addButton: "+ DateCycle hinzufügen",
  placeholderCalendar: "Mein Kalender"
},

// TIMEZONES
timezones: [
  { value: 'Etc/GMT+12', label: 'Bakerinsel (UTC-12)' },
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
  { value: 'Atlantic/South_Georgia', label: 'Südgeorgien (UTC-2)' },
  { value: 'Atlantic/Azores', label: 'Azoren (UTC-1)' },
  { value: 'Etc/UTC', label: 'UTC (Koordinierte Weltzeit)' },
  { value: 'Europe/London', label: 'London (UTC+0/UTC+1 DST)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (UTC+2)' },
  { value: 'Europe/Moscow', label: 'Moskau (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
  { value: 'Asia/Karachi', label: 'Karatschi (UTC+5)' },
  { value: 'Asia/Dhaka', label: 'Dhaka (UTC+6)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Singapur (UTC+8)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokio (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
  { value: 'Pacific/Guadalcanal', label: 'Guadalcanal (UTC+11)' },
  { value: 'Pacific/Auckland', label: 'Auckland (UTC+12)' }
]



};
