// EARTHCAL TRANSLATIONS
// translations/fr.js

export const translations = {

// THE GUIDED TOUR

  tour: {
    welcomeIntro: "Bienvenue sur EarthCal !",
    welcomeParagraph: "Il est temps de faire évoluer nos calendriers ! Il est temps de passer des lignes et des cases aux cercles et aux cycles. EarthCal est votre nouvelle fenêtre sur les jours, les mois, les années et les autres cycles terrestres auxquels nos moments sur la planète Terre dansent. Utilisez EarthCal pour gérer et synchroniser vos événements avec les cycles de la lune, des planètes et des créatures magnifiques.",

    oneOrbitTitle: "Un an.\nUne orbite.",
    oneOrbitDesc: "EarthCal commence par une vue de l’année en cours. La Terre met environ 365 jours à tourner autour du Soleil, c’est ainsi que nous avons divisé le cercle principal d’EarthCal (nous en faisons 366 lors d’une année bissextile !). Cliquez sur n’importe quelle division et regardez la Terre s’animer jusqu’à cette position dans son orbite annuelle autour du Soleil. Pour zoomer, cliquez sur un mois pour voir de plus près cette portion de l’orbite de la Terre.",

    neighborhoodTitle: "Notre Voisinage",
    neighborhoodDesc: "Lorsque vous cliquez sur un jour, vous pouvez également voir la progression et la position de nos voisins planétaires. Cliquez sur une planète pour obtenir des données orbitales détaillées. Observez les oppositions, conjonctions et alignements planétaires en temps réel. Cela nous aide non seulement à comprendre le ciel nocturne, mais aussi à nous aligner sur des cycles temporels bien plus vastes (Neptune met 165 ans terrestres pour accomplir son orbite !).",

    getLunarTitle: "Observez la Lune",
    getLunarDesc: "Vous remarquez le centre du calendrier en survolant les jours de l’année ? Vous pouvez voir en temps réel comment la phase de la lune change au fil de l’année. Cliquez sur la lune en bas à droite pour accéder aux données orbitales détaillées.",

    animalCyclesTitle: "Grands Cycles Terriens",
    animalCyclesDesc: "Les grandes civilisations ne suivaient pas seulement les cycles célestes, elles utilisaient aussi les cycles des grandes créatures qui les entouraient pour célébrer le temps. Cliquez sur l’icône de la Terre en bas à gauche pour voir où se trouvent les baleines grises d’Amérique du Nord dans leur migration à un moment précis de l’année. D’autres animaux arrivent bientôt !",

    addEventsTitle: "Ajouter des Événements & Cycles",
    addEventsDesc: "Utilisez EarthCal pour enregistrer vos événements et tâches quotidiennes. Ajoutez vos événements ponctuels et vos cycles annuels (comme les anniversaires !) au calendrier en cliquant sur le + en haut à gauche pour la date sélectionnée. Synchronisation avec Google Calendar bientôt disponible.",

    buttonNextWelcome: "Comment ça marche ➔",
    buttonNextOrbit: "Les Planètes ➔",
    buttonNextPlanets: "La Lune ➔",
    buttonNextMoon: "Grands Cycles Terriens ➔",
    buttonNextCycles: "Suivant ➔",
    buttonDone: "✓ Terminé",
    buttonBack: "↩ Retour"
  },

// DATE SEARCH

  goToDateTitle: "Aller à la date...",
  prevYear: "Année Précédente",
  nextYear: "Année Suivante",
  goToDate: "Aller à la Date",
  invalidDay: "Veuillez choisir un jour raisonnable inférieur à 31 !",
  invalidFebruary: "Veuillez choisir une date valable pour le mois de février !",
  invalidLeapYear: "Veuillez choisir un jour inférieur à 29 pour février dans une année non bissextile !",

// CORE DATE TERMS

  daysOfWeek: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],

  monthsOfYear: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],

  ordinalSuffixes: ['st', 'nd', 'rd', 'th'], // Typically omitted in French

  dayTranslations: 'Jour',
  ofTranslations: 'de',
  todayYouveGot: "Aujourd'hui, vous avez",
  event: 'événement',
  events: 'événements',

// VERSION ANNOUNCEMENT

  versioning: {
    title: "Earthcal v1.3",
    subtitle: "À l’occasion de l’équinoxe de printemps, nous sommes heureux de publier Earthcal version 1.3. L’ensemble du code a été revu pour corriger les bogues et améliorer l’installation et les fonctionnalités. Mais ce n’est pas le plus excitant. Qu’est-ce qui l’est ? Nous appelons maintenant l’API Earthen Auspicer. Earthcal effectue déjà des calculs astronomiques pour divers cycles lunaires, solaires et planétaires d’un jour donné – nous les affichons visuellement et numériquement. Mais qu’est-ce que cela signifie ? Les traditions autochtones, la chronobiologie et la biodynamie offrent des interprétations claires et résonantes ! Que la lune soit décroissante et montante, à l’apogée, pleine et descendante – nous avons croisé ces trois sources pour créer un interpréteur de dates. Désormais, en ajoutant un élément de date, vous voyez les auspices terrestres de cette date ! Ce n’est ni de l’astrologie, ni de l’IA – c’est un moteur sémantique complexe fondé sur des données astronomiques solides, la théorie biodynamique et la sagesse ancestrale. Développez les fenêtres de données pour comprendre ce que nous voulons dire.",
    features: [
      "Auspicer version 1.0 maintenant actif (appuyer sur + pour ajouter un Événement)",
      "Le mode Jedi est maintenant disponible pour les fonctions avancées",
      "Les positions du zodiaque peuvent désormais être activées et désactivées",
      "Nouvelle version macOS d’EarthCal pour ordinateur de bureau",
    ],
    gotIt: "👍 C’est parti !",
    tour: " 🌏 EarthCal Guided Tour",
  },

// SETTINGS

  settings: {
    languages: {
      EN: "EN - Anglais",
      ID: "ID - Indonésien",
      FR: "FR - Français",
      ES: "ES - Espagnol",
      DE: "DE - Allemand",
      ZH: 'ZH - Chinoise',
      AR: "AR - Arabe"
    },
    applySettings: "Appliquer les Paramètres",
    saving: "Enregistrement...",
    darkMode: {
      legend: "Basculer entre mode clair et sombre :",
      remember: "Se souvenir pour toutes les pages"
    }
  },

  // DATE SEARCH
openDateSearch: {
  title: "Aller à la date...",
  placeholderDay: "Jour",
  months: [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ],
  prevYear: "Année précédente",
  nextYear: "Année suivante",
  goToDate: "Aller à la date",
  invalidDay: "Veuillez choisir un jour raisonnable inférieur à 31 !",
  invalidFebruary: "Veuillez choisir une date raisonnable pour le mois de février !",
  invalidLeapYear: "Veuillez choisir un jour inférieur à 29 pour février lors d’une année non bissextile !",
  searching: "Recherche..."
},

// LOG IN SCREEN
loggedIn: {
  welcome: "Bienvenue",
  syncingInfo: "Vous gérez les Earthcals suivants...",
  publicCalendarsIntro: "Vous êtes abonné aux calendriers publics suivants...",
  webcalHasSubscriptions: "Vous avez les abonnements iCal suivants...",
  webcalNoSubscriptions: "Vous n'avez pas encore d'abonnements webcal.",
  noPersonal: "Aucun calendrier personnel disponible.",
  addPersonal: "Ajouter un nouvel Earthcal...",
  browsePublic: "Explorer et s'abonner aux Earthcals publics...",
  noPublic: "Aucun calendrier public disponible.",
  noWebcal: "Aucun abonnement iCal connecté pour l'instant.",
  syncNow: "Synchroniser maintenant",
  logout: "Se déconnecter",
  notYetSynced: "Vos cycles de date ne sont pas encore synchronisés.",
  lastSynced: "Dernière synchronisation le"
},

login: {
  emailPlaceholder: "Votre adresse e-mail...",
  passwordPlaceholder: "Votre mot de passe...",
  statusFirstTime: (emoji) => `🎉 Votre compte Buwana a été créé ! ${emoji}`,
  statusReturning: (emoji, name) => `Bienvenue ${name}.  Connectez-vous avec un compte Buwana pour profiter des puissantes fonctionnalités de calendrier et de gestion d’événements d’EarthCal.`,
  credentialLabel: "Connectez-vous avec vos identifiants Buwana.",
  forgotPassword: "Mot de passe oublié ?",
  resetLink: "Réinitialiser.",
  sendCode: "📨 Envoyer le code",
  login: "Se connecter"
},

// MAIN MENU
mainMenu: {
  title: "Synchroniser avec les cycles de la Terre",
  featureTour: "Visite guidée",
  latestVersion: "Infos sur la dernière version",
  upgradeToPro: "Passer à Pro",
  newsletter: "Bulletin Earthen.io",
  guide: "Guide du calendrier ↗",
  purchasePrint: "Acheter la version imprimée ↗",
  about: "À propos du projet ↗",
  darkModeToggle: "Changer thème sombre/jour",
  developedBy: "EarthCal est développé par",
  authBy: "Authentification par"
},

subscriptions: {
  heading: "Améliorer EarthCal",
  currentPlan: "Vous êtes actuellement sur le plan {planName}.",
  currentStatus: "Statut : {status}",
  loginRequired: "Veuillez vous connecter pour gérer votre abonnement EarthCal.",
  loadError: "Nous n'avons pas pu charger les détails de votre abonnement. Veuillez réessayer dans quelques instants.",
  noPlans: "Aucun plan n'est disponible pour le moment.",
  tableHeaders: {
    plan: "Plan",
    description: "Description",
    price: "Prix"
  },
  priceFree: "Gratuit",
  billingSuffix: {
    month: "/ mois",
    year: "/ an",
    lifetime: "Accès à vie"
  },
  currentBadge: "Plan actuel"
},

// OFFLINE MESSAGES
offline: {
  bannerNonJedi: "Vous semblez hors ligne ! Reconnectez-vous pour synchroniser. Ou... passez au mode Jedi Offline.",
  bannerJediModeOn: "Vous êtes en mode Jedi Offline ! Reconnectez-vous pour synchroniser quand vous êtes prêt.",
  bannerJediModeOff: "Vous êtes hors ligne. Le mode Offline est désactivé. Reconnectez-vous pour synchroniser.",
  alertPadwan: "Vous semblez hors ligne ! Veuillez vous reconnecter pour utiliser EarthCal. Ou... passez à un compte Jedi pour profiter de notre super Mode Offline.",
  alertJedi: "Vous semblez hors ligne ! Veuillez vous reconnecter ou activer le Mode Offline dans les paramètres pour utiliser les données en cache.",
},

// ADD DATECYCLE
addCycle: {
  titlePrefix: "Ajouter un événement pour",
  addButton: "+ Ajouter un CycleDate",
  placeholderCalendar: "Mon calendrier"
},

// TIMEZONES
timezones: [
  { value: 'Etc/GMT+12', label: 'Île Baker (UTC-12)' },
  { value: 'Pacific/Pago_Pago', label: 'Samoa (UTC-11)' },
  { value: 'Pacific/Honolulu', label: 'Hawaï (UTC-10)' },
  { value: 'America/Anchorage', label: 'Alaska (UTC-9)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
  { value: 'America/Denver', label: 'Denver (UTC-7)' },
  { value: 'America/Chicago', label: 'Chicago (UTC-6)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'America/Toronto', label: 'Toronto (UTC-5/UTC-4 DST)' },
  { value: 'America/Halifax', label: 'Halifax (UTC-4)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
  { value: 'Atlantic/South_Georgia', label: 'Géorgie du Sud (UTC-2)' },
  { value: 'Atlantic/Azores', label: 'Açores (UTC-1)' },
  { value: 'Etc/UTC', label: 'UTC (Temps Universel Coordonné)' },
  { value: 'Europe/London', label: 'Londres (UTC+0/UTC+1 DST)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (UTC+2)' },
  { value: 'Europe/Moscow', label: 'Moscou (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Dubaï (UTC+4)' },
  { value: 'Asia/Karachi', label: 'Karachi (UTC+5)' },
  { value: 'Asia/Dhaka', label: 'Dacca (UTC+6)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Singapour (UTC+8)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
  { value: 'Pacific/Guadalcanal', label: 'Guadalcanal (UTC+11)' },
  { value: 'Pacific/Auckland', label: 'Auckland (UTC+12)' }
]

};
