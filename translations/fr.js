// translations/fr.js

export const translations = {
    daysOfWeek: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],

    monthsOfYear: [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],

    ordinalSuffixes: ['er', '', '', ''],

    dayTranslations: 'Jour',
    ofTranslations: 'de',

    versioning: {
        title: "Bienvenue sur EarthCal 0.9 !",
        subtitle: "EarthCal a été entièrement remanié en préparation de notre version 1.0 en 2025. Les principales nouvelles fonctionnalités de la v0.9 incluent :",
        features: [
            "Les mois peuvent maintenant s'agrandir ! Cliquez sur la barre colorée de n'importe quel mois pour agrandir son cercle.",
            "Ajoutez des événements et des cycles : Appuyez sur + pour ajouter des événements, des objectifs et des tâches à un jour quelconque.",
            "Modifiez un événement, repoussez-le d'un jour ou cochez-le comme terminé !",
            "Support multilingue initial pour cinq langues ajouté.",
            "Vue horloge. Utilisez EarthCal comme horloge sur un second écran.",
            "Le cycle migratoire du héron noir est synchronisé avec le calendrier."
        ],
        gotIt: "👍 Compris !",
        tour: " 🌏 Plus : Visite guidée"
    },

    settings: {
        languages: {
            EN: "EN - Anglais",
            ID: "ID - Indonésien",
            FR: "FR - Français",
            ES: "ES - Espagnol",
            DE: "DE - Allemand",
            AR: "AR - Arabe"
        },
        applySettings: "Appliquer les paramètres",
        darkMode: {
            legend: "Basculer entre les modes clair et sombre :",
            remember: "Se souvenir pour toutes les pages"
        }
    },


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
        invalidFebruary: "Veuillez choisir une date raisonnable pour février !",
        invalidLeapYear: "Veuillez choisir un jour inférieur à 29 pour février dans une année non bissextile !"
    },


    loggedIn: {
        welcome: "Bienvenue",
        syncingInfo: "Vous synchronisez les calendriers personnels et publics suivants :",
        noPersonal: "Aucun calendrier personnel disponible.",
        noPublic: "Aucun calendrier public disponible.",
        syncNow: "Synchroniser maintenant",
        logout: "Se déconnecter",
        notYetSynced: "Vos cycles de dates ne sont pas encore synchronisés.",
        lastSynced: "Dernière synchronisation le"
    },

    login: {
        emailPlaceholder: "Votre e-mail...",
        passwordPlaceholder: "Votre mot de passe...",
        statusFirstTime: (emoji) => `🎉 Votre compte Buwana a été créé ! ${emoji}`,
        statusReturning: (emoji, name) => `${emoji} Bon retour, ${name}`,
        credentialLabel: "Connectez-vous avec vos identifiants Buwana.",
        forgotPassword: "Mot de passe oublié ?",
        resetLink: "Réinitialisez-le.",
        sendCode: "📨 Envoyer le code",
        login: "Connexion"
    },

    mainMenu: {
        title: "Synchronisez avec les cycles de la Terre",
        featureTour: "Visite des Fonctionnalités",
        latestVersion: "Dernière Version Info",
        newsletter: "Bulletin d'Earthen.io",
        guide: "Guide du Calendrier ↗",
        purchasePrint: "Acheter Imprimé ↗",
        about: "À propos du Projet ↗",
        darkModeToggle: "Changer entre les thèmes Sombre/Jour",
        developedBy: "EarthCal est développé par",
        authBy: "Authentification par",
        loggedIn: {
            welcome: "Bon retour,"
        }
    },

};
