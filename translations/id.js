export const translations = {



    timezones: [
        { value: 'Etc/GMT+12', label: 'Pulau Baker (UTC-12)' },
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
        { value: 'Etc/UTC', label: 'UTC (Waktu Universal Terkoordinasi)' },
        { value: 'Europe/London', label: 'London (UTC+0/UTC+1 DST)' },
        { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
        { value: 'Europe/Helsinki', label: 'Helsinki (UTC+2)' },
        { value: 'Europe/Moscow', label: 'Moskow (UTC+3)' },
        { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
        { value: 'Asia/Karachi', label: 'Karachi (UTC+5)' },
        { value: 'Asia/Dhaka', label: 'Dhaka (UTC+6)' },
        { value: 'Asia/Jakarta', label: 'Jakarta (UTC+7)' },
        { value: 'Asia/Singapore', label: 'Singapura (UTC+8)' },
        { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
        { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
        { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
        { value: 'Pacific/Guadalcanal', label: 'Guadalcanal (UTC+11)' },
        { value: 'Pacific/Auckland', label: 'Auckland (UTC+12)' }
    ],


//DATE SEARCH
    goToDateTitle: "Pergi ke tanggal...",
    prevYear: "Tahun Sebelumnya",
    nextYear: "Tahun Berikutnya",
    goToDate: "Pergi ke Tanggal",
    invalidDay: "Pastikan Anda memilih tanggal yang masuk akal di bawah 31!",
    invalidFebruary: "Pastikan Anda memilih tanggal yang masuk akal untuk bulan Februari!",
    invalidLeapYear: "Silakan pilih hari di bawah 29 untuk Februari di tahun biasa!",

    daysOfWeek: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],

    monthsOfYear: [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ],

    ordinalSuffixes: ['st', 'nd', 'rd', 'th'], // (optional: Indonesian doesn't typically use these)

    dayTranslations: 'Hari',
    ofTranslations: 'dari',

    versioning: {
        title: "Selamat datang di EarthCal 0.9!",
        subtitle: "EarthCal telah diperbarui sepenuhnya untuk persiapan rilis v1.0 tahun 2025. Fitur utama baru dalam v0.9 meliputi:",
        features: [
            "Bulan sekarang bisa diperluas! Klik batang warna bulan mana saja untuk memperluas lingkarannya.",
            "Tambahkan acara dan siklus: Klik tombol + untuk menambahkan acara, tujuan, dan tugas ke hari apa pun.",
            "Edit acara, geser ke hari berikutnya atau tandai selesai!",
            "Dukungan multi-bahasa awal untuk lima bahasa telah ditambahkan.",
            "Tampilan jam. Tampilkan EarthCal sebagai jam di monitor kedua.",
            "Siklus migrasi burung kuntul hitam disinkronkan dengan kalender."
        ],
        gotIt: "👍 Mengerti!",
        tour: " 🌏 Lihat: Tur EarthCal"
    },

    settings: {
        languages: {
            EN: "EN - Inggris",
            ID: "ID - Indonesia",
            FR: "FR - Prancis",
            ES: "ES - Spanyol",
            DE: "DE - Jerman",
            AR: "AR - Arab"
        },
        applySettings: "Terapkan Pengaturan",
        darkMode: {
            legend: "Alihkan mode terang dan gelap:",
            remember: "Ingat untuk semua halaman"
        }
    },

    openDateSearch: {
        title: "Pergi ke tanggal...",
        placeholderDay: "Hari",
        months: [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ],
        prevYear: "Tahun Sebelumnya",
        nextYear: "Tahun Berikutnya",
        goToDate: "Pergi ke Tanggal",
        invalidDay: "Pastikan Anda memilih tanggal yang masuk akal di bawah 31!",
        invalidFebruary: "Pastikan Anda memilih tanggal yang masuk akal untuk bulan Februari!",
        invalidLeapYear: "Silakan pilih hari di bawah 29 untuk Februari di tahun biasa!"
    },

    loggedIn: {
        welcome: "Selamat datang",
        syncingInfo: "Anda sedang menyinkronkan kalender pribadi dan publik berikut:",
        noPersonal: "Tidak ada kalender pribadi yang tersedia.",
        noPublic: "Tidak ada kalender publik yang tersedia.",
        syncNow: "Sinkronkan Sekarang",
        logout: "Keluar",
        notYetSynced: "DateCycle Anda belum disinkronkan.",
        lastSynced: "Terakhir disinkronkan pada"
    },

    login: {
        emailPlaceholder: "Email Anda...",
        passwordPlaceholder: "Kata sandi Anda...",
        statusFirstTime: (emoji) => `🎉 Akun Buwana Anda telah dibuat! ${emoji}`,
        statusReturning: (emoji, name) => `${emoji} Selamat datang kembali, ${name}`,
        credentialLabel: "Login dengan kredensial akun Buwana Anda.",
        forgotPassword: "Lupa kata sandi?",
        resetLink: "Atur ulang.",
        sendCode: "📨 Kirim Kode",
        login: "Masuk"
    },

    mainMenu: {
        title: "Sinkron dengan siklus Bumi",
        featureTour: "Tur Fitur",
        latestVersion: "Info Versi Terbaru",
        newsletter: "Buletin Earthen.io",
        guide: "Panduan Kalender ↗",
        purchasePrint: "Beli Versi Cetak ↗",
        about: "Tentang Proyek ↗",
        darkModeToggle: "Beralih Tema Gelap/Terang",
        developedBy: "EarthCal dikembangkan oleh",
        authBy: "Otentikasi oleh",

    },


    addCycle: {
        titlePrefix: "Tambahkan acara untuk",
        addButton: "+ Tambahkan DateCycle",
        placeholderCalendar: "Kalender Saya"
    }

};
