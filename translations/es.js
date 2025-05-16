// translations/es.js

export const translations = {
    daysOfWeek: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],

    monthsOfYear: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],

    ordinalSuffixes: ['', '', '', ''],

    dayTranslations: 'Día',
    ofTranslations: 'de',

    versioning: {
        title: "¡Bienvenido a EarthCal 0.9!",
        subtitle: "EarthCal ha sido completamente renovado en preparación para nuestra versión 1.0 en 2025. Las principales novedades en la v0.9 incluyen:",
        features: [
            "¡Ahora los meses se expanden! Haz clic en la barra de color de cualquier mes para expandir su círculo.",
            "Añade eventos y ciclos: Presiona + para agregar eventos, objetivos y tareas a cualquier día.",
            "Edita un evento, muévelo un día hacia adelante o márcalo como completado.",
            "Se agregó soporte multilingüe inicial para cinco idiomas.",
            "Vista de reloj. Usa EarthCal como un reloj en un segundo monitor.",
            "El ciclo migratorio de la garza negra está sincronizado con el calendario."
        ],
        gotIt: "👍 ¡Entendido!",
        tour: " 🌏 Más: Tour de EarthCal"
    },

    settings: {
        languages: {
            EN: "EN - Inglés",
            ID: "ID - Indonesio",
            FR: "FR - Francés",
            ES: "ES - Español",
            DE: "DE - Alemán",
            AR: "AR - Árabe"
        },
        applySettings: "Aplicar configuración"
    },

    openDateSearch: {
        title: "Ir a la fecha...",
        placeholderDay: "Día",
        months: [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ],
        prevYear: "Año anterior",
        nextYear: "Año siguiente",
        goToDate: "Ir a la fecha",
        invalidDay: "¡Asegúrate de elegir una fecha razonable menor a 31!",
        invalidFebruary: "¡Asegúrate de elegir una fecha razonable para febrero!",
        invalidLeapYear: "¡Elige un día menor a 29 para febrero en un año no bisiesto!"
    },



    loggedIn: {
        welcome: "Bienvenido",
        syncingInfo: "Estás sincronizando los siguientes calendarios personales y públicos:",
        noPersonal: "No hay calendarios personales disponibles.",
        noPublic: "No hay calendarios públicos disponibles.",
        syncNow: "Sincronizar ahora",
        logout: "Cerrar sesión",
        notYetSynced: "Tus ciclos de fechas aún no se han sincronizado.",
        lastSynced: "Última sincronización el"
    },


    login: {
        emailPlaceholder: "Tu correo electrónico...",
        passwordPlaceholder: "Tu contraseña...",
        statusFirstTime: (emoji) => `🎉 ¡Tu cuenta Buwana ha sido creada! ${emoji}`,
        statusReturning: (emoji, name) => `${emoji} Bienvenido de nuevo, ${name}`,
        credentialLabel: "Inicia sesión con tus credenciales de Buwana.",
        forgotPassword: "¿Olvidaste tu contraseña?",
        resetLink: "Restablécela.",
        sendCode: "📨 Enviar código",
        login: "Iniciar sesión"
    },

    mainMenu: {
        title: "Sincroniza con los ciclos de la Tierra",
        featureTour: "Recorrido de Funciones",
        latestVersion: "Última Información de la Versión",
        newsletter: "Boletín de Earthen.io",
        guide: "Guía del Calendario ↗",
        purchasePrint: "Compra Impresa ↗",
        about: "Sobre el Proyecto ↗",
        darkModeToggle: "Cambiar entre temas Oscuro/Día",
        developedBy: "EarthCal es desarrollado por",
        authBy: "Autenticación por",
        loggedIn: {
            welcome: "Bienvenido de nuevo,"
        }
    },

};
