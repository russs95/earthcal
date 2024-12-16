 // Define the day and month names for each language
  const daysOfWeek = {
    EN: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ID: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    FR: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    ES: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    DE: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    AR: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  };

  const monthsOfYear = {
    EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ID: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    FR: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    ES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    DE: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    AR: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };

  const ordinalSuffixes = {
    EN: ['st', 'nd', 'rd', 'th'],
    ID: ['', '', '', ''],
    FR: ['er', '', '', ''],
    ES: ['', '', '', ''],
    DE: ['.', '.', '.', '.'],
    AR: ['', '', '', '']
  };

  const dayTranslations = {
    EN: 'Day',
    ID: 'Hari',
    FR: 'Jour',
    ES: 'Día',
    DE: 'Tag',
    AR: 'يوم'
  };

  const ofTranslations = {
    EN: 'of',
    ID: 'dari',
    FR: 'de',
    ES: 'de',
    DE: 'von',
    AR: 'من'
  };

const versioningTranslations = {
    EN: {
        title: "Welcome to EarthCal 0.9!",
        subtitle: "EarthCal has been completely overhauled in preparation for our 2025 v1.0 release. Major new features in v0.9 include:",
        features: [
            "Months now break out!  Click any month's color bar to expand its circle.",
            "Add events and cycles: Hit the + to add events, goals, and to-dos to any day.",
            "Edit an event, push it forward a day or check it off!",
            "Initial multi-lingual support for five languages added.",
            "Clock view. Keep EarthCal up as a clock on a second monitor.",
            "The migratory cycle of the black heron is synced with the calendar."
        ],
        gotIt: "👍 Got it!",
        tour: " 🌏 More: EarthCal Tour"
    },
    ID: {
        title: "Selamat datang di EarthCal 0.9!",
        subtitle: "EarthCal telah sepenuhnya diperbarui sebagai persiapan untuk rilis versi 1.0 pada tahun 2025. Fitur utama di v0.9 meliputi:",
        features: [
            "Bulan kini dapat diperbesar! Klik bilah warna bulan mana saja untuk memperbesar lingkarannya.",
            "Tambahkan acara dan siklus: Tekan + untuk menambahkan acara, tujuan, dan tugas ke hari apa pun.",
            "Edit acara, geser maju sehari atau centang selesai!",
            "Dukungan multi-bahasa awal untuk lima bahasa ditambahkan.",
            "Tampilan jam. Gunakan EarthCal sebagai jam di monitor kedua.",
            "Siklus migrasi bangau hitam disinkronkan dengan kalender."
        ],
        gotIt: "👍 Mengerti!",
        tour: " 🌏 Selengkapnya: Tur Terpandu"
    },
    ES: {
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
        tour: " 🌏 Más: Tour Guiado"
    },
    DE: {
        title: "Willkommen bei EarthCal 0.9!",
        subtitle: "EarthCal wurde vollständig überarbeitet, um auf unsere Version 1.0 im Jahr 2025 vorzubereiten. Die wichtigsten neuen Funktionen in v0.9 umfassen:",
        features: [
            "Monate können jetzt ausgeklappt werden! Klicke auf die Farbleiste eines Monats, um seinen Kreis zu vergrößern.",
            "Ereignisse und Zyklen hinzufügen: Drücke +, um Ereignisse, Ziele und Aufgaben zu jedem Tag hinzuzufügen.",
            "Bearbeite ein Ereignis, verschiebe es um einen Tag oder hake es ab!",
            "Erste mehrsprachige Unterstützung für fünf Sprachen hinzugefügt.",
            "Uhrenansicht. Nutze EarthCal als Uhr auf einem zweiten Monitor.",
            "Der Migrationszyklus des schwarzen Reihers ist mit dem Kalender synchronisiert."
        ],
        gotIt: "👍 Verstanden!",
        tour: " 🌏 Mehr: Geführte Tour"
    },
    AR: {
        title: "مرحبًا بك في EarthCal 0.9!",
        subtitle: "تم إعادة تصميم EarthCal بالكامل استعدادًا لإصدارنا 1.0 في عام 2025. الميزات الجديدة الرئيسية في الإصدار 0.9 تشمل:",
        features: [
            "يمكن الآن فتح الأشهر! انقر على شريط اللون لأي شهر لتوسيع دائرته.",
            "أضف أحداثًا ودورات: اضغط على + لإضافة أحداث، أهداف، ومهام إلى أي يوم.",
            "قم بتحرير حدث، ادفعه إلى الأمام يومًا واحدًا أو قم بوضع علامة عليه كمنجز!",
            "تمت إضافة دعم متعدد اللغات الأولي لخمس لغات.",
            "عرض الساعة. استخدم EarthCal كساعة على شاشة ثانية.",
            "تمت مزامنة دورة هجرة مالك الحزين الأسود مع التقويم."
        ],
        gotIt: "👍 فهمت!",
        tour: " 🌏 المزيد: جولة إرشادية"
    },
    FR: {
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
    }
};


const settingsTranslations = {
    EN: {
        languages: {
            EN: "EN - English",
            ID: "ID - Indonesian",
            FR: "FR - Français",
            ES: "ES - Español",
            DE: "DE - Deutsch",
            AR: "AR - العربية"
        },
        applySettings: "Apply Settings"
    },
    ID: {
        languages: {
            EN: "EN - Inggris",
            ID: "ID - Indonesia",
            FR: "FR - Prancis",
            ES: "ES - Spanyol",
            DE: "DE - Jerman",
            AR: "AR - العربية"
        },
        applySettings: "Terapkan Pengaturan"
    },
    FR: {
        languages: {
            EN: "EN - Anglais",
            ID: "ID - Indonésien",
            FR: "FR - Français",
            ES: "ES - Espagnol",
            DE: "DE - Allemand",
            AR: "AR - العربية"
        },
        applySettings: "Appliquer les paramètres"
    },
    ES: {
        languages: {
            EN: "EN - Inglés",
            ID: "ID - Indonesio",
            FR: "FR - Francés",
            ES: "ES - Español",
            DE: "DE - Alemán",
            AR: "AR - العربية"
        },
        applySettings: "Aplicar configuración"
    },
    DE: {
        languages: {
            EN: "EN - Englisch",
            ID: "ID - Indonesisch",
            FR: "FR - Französisch",
            ES: "ES - Spanisch",
            DE: "DE - Deutsch",
            AR: "AR - العربية"
        },
        applySettings: "Einstellungen anwenden"
    },
    AR: {
        languages: {
            EN: "EN - الإنجليزية",
            ID: "ID - الإندونيسية",
            FR: "FR - الفرنسية",
            ES: "ES - الإسبانية",
            DE: "DE - الألمانية",
            AR: "AR - العربية"
        },
        applySettings: "تطبيق الإعدادات"
    }
};


const openDateSearchTranslations = {
    EN: {
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
    FR: {
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

    ES: {
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
    ID: {
        title: "Pergi ke tanggal...",
        placeholderDay: "Hari",
        months: [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ],
        prevYear: "Tahun sebelumnya",
        nextYear: "Tahun berikutnya",
        goToDate: "Pergi ke tanggal",
        invalidDay: "Pastikan Anda memilih tanggal yang masuk akal di bawah 31!",
        invalidFebruary: "Pastikan Anda memilih tanggal yang masuk akal untuk Februari!",
        invalidLeapYear: "Pilih hari di bawah 29 untuk Februari di tahun non-kabisat!"
    },
    DE: {
        title: "Zum Datum gehen...",
        placeholderDay: "Tag",
        months: [
            "Januar", "Februar", "März", "April", "Mai", "Juni",
            "Juli", "August", "September", "Oktober", "November", "Dezember"
        ],
        prevYear: "Vorheriges Jahr",
        nextYear: "Nächstes Jahr",
        goToDate: "Zum Datum gehen",
        invalidDay: "Bitte stellen Sie sicher, dass Sie ein gültiges Datum unter 31 auswählen!",
        invalidFebruary: "Bitte stellen Sie sicher, dass Sie ein gültiges Datum für Februar auswählen!",
        invalidLeapYear: "Bitte wählen Sie einen Tag unter 29 für Februar in einem Nicht-Schaltjahr!"
    },
    AR: {
        title: "اذهب إلى التاريخ...",
        placeholderDay: "اليوم",
        months: [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ],
        prevYear: "السنة السابقة",
        nextYear: "السنة التالية",
        goToDate: "اذهب إلى التاريخ",
        invalidDay: "يرجى التأكد من اختيارك تاريخًا معقولًا أقل من 31!",
        invalidFebruary: "يرجى التأكد من اختيارك تاريخًا معقولًا لشهر فبراير!",
        invalidLeapYear: "يرجى اختيار يوم أقل من 29 لفبراير في سنة غير كبيسة!"
    }


};


const mainMenuTranslations = {
    EN: {
        title: "Sync with Earth's cycles",
        featureTour: "Feature Tour",
        latestVersion: "Latest Version Info",
        newsletter: "Earthen.io Newsletter",
        guide: "Calendar Guide ↗",
        purchasePrint: "Purchase Print ↗",
        about: "About the Project ↗",
        darkModeToggle: "Switch Dark/Day themes",
        developedBy: "EarthCal is developed by",
    },
    ES: {
        title: "Sincroniza con los ciclos de la Tierra",
        featureTour: "Recorrido de Funciones",
        latestVersion: "Última Información de la Versión",
        newsletter: "Boletín de Earthen.io",
        guide: "Guía del Calendario ↗",
        purchasePrint: "Compra Impresa ↗",
        about: "Sobre el Proyecto ↗",
        darkModeToggle: "Cambiar entre temas Oscuro/Día",
        developedBy: "EarthCal es desarrollado por",
    },
    FR: {
        title: "Synchronisez avec les cycles de la Terre",
        featureTour: "Visite des Fonctionnalités",
        latestVersion: "Dernière Version Info",
        newsletter: "Bulletin d'Earthen.io",
        guide: "Guide du Calendrier ↗",
        purchasePrint: "Acheter Imprimé ↗",
        about: "À propos du Projet ↗",
        darkModeToggle: "Changer entre les thèmes Sombre/Jour",
        developedBy: "EarthCal est développé par",
    },
    DE: {
        title: "Synchronisieren mit den Zyklen der Erde",
        featureTour: "Feature-Tour",
        latestVersion: "Neueste Versionsinfo",
        newsletter: "Earthen.io Newsletter",
        guide: "Kalenderanleitung ↗",
        purchasePrint: "Druck kaufen ↗",
        about: "Über das Projekt ↗",
        darkModeToggle: "Zwischen Dunkel-/Tagthemen wechseln",
        developedBy: "EarthCal wird entwickelt von",
    },
    ID: {
        title: "Sinkronkan dengan siklus Bumi",
        featureTour: "Tur Fitur",
        latestVersion: "Informasi Versi Terbaru",
        newsletter: "Newsletter Earthen.io",
        guide: "Panduan Kalender ↗",
        purchasePrint: "Beli Cetak ↗",
        about: "Tentang Proyek ↗",
        darkModeToggle: "Beralih Tema Gelap/Hari",
        developedBy: "EarthCal dikembangkan oleh",
    },
    AR: {
        title: "تزامن مع دورات الأرض",
        featureTour: "جولة الميزات",
        latestVersion: "معلومات النسخة الأحدث",
        newsletter: "نشرة Earthen.io",
        guide: "دليل التقويم ↗",
        purchasePrint: "شراء نسخة مطبوعة ↗",
        about: "حول المشروع ↗",
        darkModeToggle: "تبديل بين الوضع الليلي/النهاري",
        developedBy: "تم تطوير EarthCal بواسطة",
    },
};
