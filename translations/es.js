// EARTHCAL TRANSLATIONS
// translations/es.js

export const translations = {

// THE GUIDED TOUR

  tour: {
    welcomeIntro: "¡Bienvenido a EarthCal!",
    welcomeParagraph: "¡Es hora de evolucionar nuestros calendarios! Es hora de pasar de líneas y cuadros a círculos y ciclos. EarthCal es tu nueva ventana a los días, meses, años y otros ciclos terrestres al compás de los cuales danzan nuestros momentos en el planeta Tierra. Usa EarthCal para gestionar y sincronizar tus eventos con los ciclos de la luna, los planetas y criaturas magníficas.",

    oneOrbitTitle: "Un Año.\nUna Órbita.",
    oneOrbitDesc: "EarthCal comienza con una vista del año actual. La Tierra tarda aproximadamente 365 días en girar alrededor del Sol, así que hemos dividido el círculo principal de EarthCal de esa forma (¡hacemos que sean 366 en un año bisiesto!). Haz clic en cualquiera de las divisiones y observa cómo la Tierra se anima hasta esa posición en su giro anual alrededor del Sol. Para ampliar, haz clic en un mes y obtendrás una vista más cercana de esa parte del progreso orbital de la Tierra.",

    neighborhoodTitle: "Nuestro Vecindario",
    neighborhoodDesc: "Cuando haces clic en cualquier día, también puedes ver el progreso y la posición de nuestros vecinos planetarios. Haz clic en cualquier planeta para obtener datos orbitales detallados. Observa oposiciones, conjunciones y alineaciones planetarias en tiempo real. Esto no solo nos ayuda a entender el cielo nocturno, sino que también nos alinea con ciclos de tiempo mucho más grandes (¡Neptuno tarda 165 años terrestres en completar su órbita!).",

    getLunarTitle: "Fase Lunar",
    getLunarDesc: "¿Notas el centro del calendario mientras repasas los días del año? Puedes ver en tiempo real cómo cambia la fase de la luna a lo largo del año. Haz clic en la luna en la parte inferior derecha para ver datos orbitales detallados.",

    animalCyclesTitle: "Grandes Ciclos Terrestres",
    animalCyclesDesc: "Las grandes civilizaciones no solo seguían los ciclos celestes, también usaban los ciclos de las grandes criaturas a su alrededor para celebrar el tiempo. Haz clic en el ícono de la Tierra en la esquina inferior izquierda para ver dónde están las ballenas grises de América del Norte en su migración en determinado momento del año. ¡Pronto habrá más animales!",

    addEventsTitle: "Agregar Eventos y Ciclos",
    addEventsDesc: "Usa EarthCal para registrar tus eventos y tareas diarias. Agrega tus eventos únicos y ciclos anuales (¡como cumpleaños!) al calendario haciendo clic en el + en la parte superior izquierda para la fecha seleccionada. La sincronización con Google Calendar estará disponible pronto.",

    buttonNextWelcome: "Cómo funciona ➔",
    buttonNextOrbit: "Los Planetas ➔",
    buttonNextPlanets: "La Luna ➔",
    buttonNextMoon: "Grandes Ciclos Terrestres ➔",
    buttonNextCycles: "Siguiente ➔",
    buttonDone: "✓ Hecho",
    buttonBack: "↩ Atrás"
  },

// DATE SEARCH

  goToDateTitle: "Ir a la fecha...",
  prevYear: "Año Anterior",
  nextYear: "Próximo Año",
  goToDate: "Ir a la Fecha",
  invalidDay: "¡Asegúrate de elegir una fecha razonable menor de 31!",
  invalidFebruary: "¡Asegúrate de elegir una fecha razonable para febrero!",
  invalidLeapYear: "¡Elige un día menor de 29 para febrero en un año no bisiesto!",

// CORE DATE TERMS

  daysOfWeek: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],

  monthsOfYear: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],

  ordinalSuffixes: ['st', 'nd', 'rd', 'th'], // Not used in Spanish, can be ignored or left unchanged

  dayTranslations: 'Día',
  ofTranslations: 'de',
  todayYouveGot: 'Hoy tienes',
  event: 'evento',
  events: 'eventos',

// VERSION ANNOUNCEMENT

  versioning: {
    title: "¡Bienvenido a EarthCal 0.9!",
    subtitle: "¡EarthCal ha sido actualizado para junio de 2025! Ahora estamos en la versión 0.94.:",
    features: [
      "Ahora puedes iniciar sesión con una cuenta de Buwana para guardar y sincronizar tus eventos",
      "¡Soporte de zona horaria activado! Usa el botón de configuración para cambiar.",
      "¡Mejora del soporte de idiomas! Ahora hasta el 75% de la aplicación está traducida.",
      "Los calendarios públicos ahora están disponibles para añadir a tu vista (debes iniciar sesión primero)",
      "El ciclo migratorio de la garza negra está sincronizado con el calendario.",
      "Correcciones de errores menores y mayores."
    ],
    gotIt: "👍 ¡Vamos allá!",
    tour: " 🌏 Más: Tour de EarthCal"
  },



// SETTINGS

  settings: {
    languages: {
      EN: "EN - Inglés",
      ID: "ID - Indonesio",
      FR: "FR - Francés",
      ES: "ES - Español",
      DE: "DE - Alemán",
      AR: "AR - Árabe"
    },
    applySettings: "Aplicar Configuración",
    darkMode: {
      legend: "Cambiar entre modo claro y oscuro:",
      remember: "Recordar en todas las páginas"
    }
  },

// DATE SEARCH
openDateSearch: {
  title: "Ir a la fecha...",
  placeholderDay: "Día",
  months: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ],
  prevYear: "Año Anterior",
  nextYear: "Próximo Año",
  goToDate: "Ir a la Fecha",
  invalidDay: "¡Asegúrate de elegir una fecha válida menor de 31!",
  invalidFebruary: "¡Asegúrate de elegir una fecha válida para febrero!",
  invalidLeapYear: "¡Elige un día menor de 29 para febrero en un año no bisiesto!"
},

// LOG IN SCREEN
loggedIn: {
  welcome: "Bienvenido",
  syncingInfo: "Estás sincronizando los siguientes calendarios personales y públicos:",
  noPersonal: "No hay calendarios personales disponibles.",
  noPublic: "No hay calendarios públicos disponibles.",
  syncNow: "Sincronizar ahora",
  logout: "Cerrar sesión",
  notYetSynced: "Tus ciclos de fecha aún no se han sincronizado.",
  lastSynced: "Última sincronización el"
},

login: {
  emailPlaceholder: "Tu correo electrónico...",
  passwordPlaceholder: "Tu contraseña...",
  statusFirstTime: (emoji) => `🎉 ¡Tu cuenta de Buwana ha sido creada! ${emoji}`,
  statusReturning: (emoji, name) => `${emoji} Bienvenido de nuevo, ${name}`,
  credentialLabel: "Inicia sesión con tus credenciales de Buwana.",
  forgotPassword: "¿Olvidaste tu contraseña?",
  resetLink: "Restablecer.",
  sendCode: "📨 Enviar código",
  login: "Iniciar sesión"
},

// MAIN MENU
mainMenu: {
  title: "Sincroniza con los ciclos de la Tierra",
  featureTour: "Recorrido de funciones",
  latestVersion: "Información de la última versión",
  newsletter: "Boletín de Earthen.io",
  guide: "Guía del calendario ↗",
  purchasePrint: "Comprar versión impresa ↗",
  about: "Sobre el proyecto ↗",
  darkModeToggle: "Cambiar entre modo claro/oscuro",
  developedBy: "EarthCal ha sido desarrollado por",
  authBy: "Autenticación por"
},

// ADD DATECYCLE
addCycle: {
  titlePrefix: "Agregar un evento para",
  addButton: "+ Agregar CicloDeFecha",
  placeholderCalendar: "Mi calendario"
},

// TIMEZONES
timezones: [
  { value: 'Etc/GMT+12', label: 'Isla Baker (UTC-12)' },
  { value: 'Pacific/Pago_Pago', label: 'Samoa (UTC-11)' },
  { value: 'Pacific/Honolulu', label: 'Hawái (UTC-10)' },
  { value: 'America/Anchorage', label: 'Alaska (UTC-9)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8)' },
  { value: 'America/Denver', label: 'Denver (UTC-7)' },
  { value: 'America/Chicago', label: 'Chicago (UTC-6)' },
  { value: 'America/New_York', label: 'Nueva York (UTC-5)' },
  { value: 'America/Toronto', label: 'Toronto (UTC-5/UTC-4 DST)' },
  { value: 'America/Halifax', label: 'Halifax (UTC-4)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
  { value: 'Atlantic/South_Georgia', label: 'Georgia del Sur (UTC-2)' },
  { value: 'Atlantic/Azores', label: 'Azores (UTC-1)' },
  { value: 'Etc/UTC', label: 'UTC (Tiempo Universal Coordinado)' },
  { value: 'Europe/London', label: 'Londres (UTC+0/UTC+1 DST)' },
  { value: 'Europe/Berlin', label: 'Berlín (UTC+1)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (UTC+2)' },
  { value: 'Europe/Moscow', label: 'Moscú (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Dubái (UTC+4)' },
  { value: 'Asia/Karachi', label: 'Karachi (UTC+5)' },
  { value: 'Asia/Dhaka', label: 'Daca (UTC+6)' },
  { value: 'Asia/Jakarta', label: 'Yakarta (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Singapur (UTC+8)' },
  { value: 'Asia/Shanghai', label: 'Shanghái (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokio (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sídney (UTC+10)' },
  { value: 'Pacific/Guadalcanal', label: 'Guadalcanal (UTC+11)' },
  { value: 'Pacific/Auckland', label: 'Auckland (UTC+12)' }
]

};
