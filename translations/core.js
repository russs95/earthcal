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
            title: "Welcome to EarthCal 1.0!",
            subtitle: "We're super excited to announce the first official release of EarthCal after two years of development",
            description: "EarthCal has been completely overhauled for 2025. Major new features now include:",
            features: [
                "Months now break out into sub circles! Take a close look at each month's days of the week.",
                "Add events and cycles to your calendar: Use the calendar to keep track of events, goals, and to-dos each day.",
                "Edit events, push them forward a day or check them off!",
                "Initial multi-lingual support for five languages added.",
                "Clock view. Keep EarthCal up as a clock on a decorative monitor.",
                "The migratory cycle of the black heron is synced with the calendar."
            ],
            gotIt: "Got it! 👍",
            tour: "EarthCal Tour 🌏"
        },


    ID: {
        title: "Selamat datang di EarthCal 1.0!",
        subtitle: "Kami sangat bersemangat untuk mengumumkan rilis resmi pertama EarthCal setelah dua tahun pengembangan",
        description: "EarthCal telah sepenuhnya diperbarui untuk tahun 2025. Fitur baru utama sekarang mencakup:",
        features: [
            "Bulan kini dibagi menjadi lingkaran kecil! Perhatikan setiap hari dalam seminggu.",
            "Tambahkan acara dan siklus ke kalender Anda: Gunakan kalender untuk melacak acara, tujuan, dan tugas harian Anda.",
            "Edit acara, dorong ke depan sehari, atau tandai selesai!",
            "Dukungan multi-bahasa awal untuk lima bahasa ditambahkan.",
            "Tampilan jam. Gunakan EarthCal sebagai jam di monitor dekoratif.",
            "Siklus migrasi burung kuntul hitam disinkronkan dengan kalender."
        ],
        gotIt: "Mengerti! 👍",
        tour: "Tur EarthCal 🌏"
    },
    FR: {
        title: "Bienvenue dans EarthCal 1.0 !",
        subtitle: "Nous sommes très heureux d'annoncer la première version officielle d'EarthCal après deux ans de développement",
        description: "EarthCal a été entièrement révisé pour 2025. Les nouvelles fonctionnalités principales incluent désormais :",
        features: [
            "Les mois se divisent désormais en sous-cercles ! Regardez de près les jours de la semaine de chaque mois.",
            "Ajoutez des événements et des cycles à votre calendrier : utilisez le calendrier pour suivre les événements, les objectifs et les tâches quotidiennes.",
            "Modifiez les événements, poussez-les d'un jour ou cochez-les comme terminés !",
            "Prise en charge multilingue initiale pour cinq langues ajoutée.",
            "Affichage de l'horloge. Gardez EarthCal comme horloge sur un moniteur décoratif.",
            "Le cycle migratoire du héron noir est synchronisé avec le calendrier."
        ],
        gotIt: "Compris ! 👍",
        tour: "Tour EarthCal 🌏"
    },
    AR: {
        title: "مرحبًا بك في EarthCal 1.0!",
        subtitle: "يسعدنا جدًا الإعلان عن الإصدار الرسمي الأول من EarthCal بعد عامين من التطوير",
        description: "تمت إعادة تصميم EarthCal بالكامل لعام 2025. الميزات الجديدة الرئيسية تشمل الآن:",
        features: [
            "الأشهر مقسمة الآن إلى دوائر فرعية! ألق نظرة عن قرب على أيام الأسبوع لكل شهر.",
            "أضف الأحداث والدورات إلى التقويم الخاص بك: استخدم التقويم لتتبع الأحداث والأهداف والمهام اليومية.",
            "حرّر الأحداث، ادفعها يومًا للأمام أو حددها على أنها مكتملة!",
            "إضافة دعم متعدد اللغات لخمسة لغات.",
            "عرض الساعة. احتفظ بـ EarthCal كساعة على شاشة زخرفية.",
            "تمت مزامنة دورة هجرة مالك الحزين الأسود مع التقويم."
        ],
        gotIt: "فهمت! 👍",
        tour: "جولة EarthCal 🌏"
    },
    ES: {
        title: "¡Bienvenido a EarthCal 1.0!",
        subtitle: "Estamos muy emocionados de anunciar el primer lanzamiento oficial de EarthCal después de dos años de desarrollo",
        description: "EarthCal ha sido completamente renovado para 2025. Las principales nuevas características incluyen ahora:",
        features: [
            "¡Los meses ahora se dividen en subcírculos! Echa un vistazo a los días de la semana de cada mes.",
            "Agrega eventos y ciclos a tu calendario: utiliza el calendario para hacer un seguimiento de eventos, metas y tareas diarias.",
            "Edita eventos, adelántalos un día o márcalos como completados.",
            "Soporte multilingüe inicial para cinco idiomas agregado.",
            "Vista de reloj. Mantén EarthCal como un reloj en un monitor decorativo.",
            "El ciclo migratorio de la garza negra está sincronizado con el calendario."
        ],
        gotIt: "¡Entendido! 👍",
        tour: "Recorrido por EarthCal 🌏"
    },
    DE: {
        title: "Willkommen bei EarthCal 1.0!",
        subtitle: "Wir freuen uns sehr, die erste offizielle Version von EarthCal nach zwei Jahren Entwicklung anzukündigen",
        description: "EarthCal wurde vollständig für 2025 überarbeitet. Wichtige neue Funktionen umfassen jetzt:",
        features: [
            "Monate sind jetzt in Unterkreise unterteilt! Werfen Sie einen genauen Blick auf die Wochentage jedes Monats.",
            "Fügen Sie Ereignisse und Zyklen zu Ihrem Kalender hinzu: Verwenden Sie den Kalender, um Ereignisse, Ziele und tägliche Aufgaben zu verfolgen.",
            "Bearbeiten Sie Ereignisse, verschieben Sie sie um einen Tag oder markieren Sie sie als abgeschlossen!",
            "Erste mehrsprachige Unterstützung für fünf Sprachen hinzugefügt.",
            "Uhransicht. Verwenden Sie EarthCal als Uhr auf einem dekorativen Monitor.",
            "Der Wanderzyklus des schwarzen Reihers ist mit dem Kalender synchronisiert."
        ],
        gotIt: "Verstanden! 👍",
        tour: "EarthCal-Tour 🌏"
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
