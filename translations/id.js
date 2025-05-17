// translations/id.js

export const translations = {
    daysOfWeek: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    monthsOfYear: [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ],
    ordinalSuffixes: ['st', 'nd', 'rd', 'th'], // Tetap dalam bahasa Inggris untuk kompatibilitas

    dayTranslations: 'Hari',
    ofTranslations: 'dari',

    versioning: {
        title: "Selamat datang di EarthCal 0.9!",
        subtitle: "EarthCal telah diperbarui sepenuhnya sebagai persiapan untuk rilis v1.0 pada tahun 2025. Fitur utama baru di v0.9 meliputi:",
        features: [
            "Bulan sekarang dapat diperluas! Klik bilah warna bulan mana pun untuk memperluas lingkarannya.",
            "Tambahkan acara dan siklus: Tekan + untuk menambahkan acara, tujuan, dan tugas ke hari mana pun.",
            "Edit acara, geser ke hari berikutnya atau tandai selesai!",
            "Dukungan multibahasa awal untuk lima bahasa telah ditambahkan.",
            "Tampilan jam. Gunakan EarthCal sebagai jam di monitor kedua.",
            "Siklus migrasi bangau hitam disinkronkan dengan kalender."
        ],
        gotIt: "👍 Mengerti!",
        tour: " 🌏 Lebih lanjut: Tur EarthCal"
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
            legend: "Beralih antara mode gelap dan terang:",
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
        invalidFebruary: "Pastikan Anda memilih tanggal yang masuk akal untuk Februari!",
        invalidLeapYear: "Pilih hari di bawah 29 untuk Februari di tahun non-kabisat!"
    },

    loggedIn: {
        welcome: "Selamat datang",
        syncingInfo: "Anda menyinkronkan kalender pribadi dan publik berikut:",
        noPersonal: "Tidak ada kalender pribadi yang tersedia.",
        noPublic: "Tidak ada kalender publik yang tersedia.",
        syncNow: "Sinkronkan Sekarang",
        logout: "Keluar",
        notYetSynced: "Siklus tanggal Anda belum disinkronkan.",
        lastSynced: "Terakhir disinkronkan pada"
    },

    login: {
        emailPlaceholder: "Email Anda...",
        passwordPlaceholder: "Kata sandi Anda...",
        statusFirstTime: (emoji) => `🎉 Akun Buwana Anda telah dibuat! ${emoji}`,
        statusReturning: (emoji, name) => `${emoji} Selamat datang kembali, ${name}`,
        credentialLabel: "Masuk dengan kredensial akun Buwana Anda.",
        forgotPassword: "Lupa kata sandi Anda?",
        resetLink: "Atur ulang.",
        sendCode: "📨 Kirim Kode",
        login: "Masuk"
    },

    mainMenu: {
        title: "Sinkronkan dengan siklus Bumi",
        featureTour: "Tur Fitur",
        latestVersion: "Info Versi Terbaru",
        newsletter: "Buletin Earthen.io",
        guide: "Panduan Kalender ↗",
        purchasePrint: "Beli Cetakan ↗",
        about: "Tentang Proyek ↗",
        darkModeToggle: "Beralih Tema Gelap/Terang",
        developedBy: "EarthCal dikembangkan oleh",
        authBy: "Otentikasi oleh",
        loggedIn: {
            welcome: "Selamat datang "
        }
    }
};
