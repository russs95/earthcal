// EARTHCAL TRANSLATIONS
// translations/ar.js

export const translations = {

// THE GUIDED TOUR

  tour: {
    welcomeIntro: "مرحبًا بك في EarthCal!",
    welcomeParagraph: "لقد حان الوقت لتطوير تقاويمنا! حان الوقت للانتقال من الخطوط والمربعات إلى الدوائر والدورات. EarthCal هو نافذتك الجديدة إلى الأيام، الأشهر، السنوات والدورات الأرضية الأخرى التي ترقص فيها لحظاتنا على كوكب الأرض. استخدم EarthCal لإدارة أحداثك ومزامنتها مع دورات القمر والكواكب والمخلوقات الرائعة.",

    oneOrbitTitle: "سنة واحدة.\nدورة واحدة.",
    oneOrbitDesc: "يبدأ EarthCal بعرض للسنة الحالية. تستغرق الأرض حوالي 365 يومًا للدوران حول الشمس، ولهذا قسمنا الدائرة الرئيسية في EarthCal بناءً على ذلك (نجعلها 366 في السنة الكبيسة!). انقر على أي تقسيم وشاهد الأرض تتحرك إلى هذا الموقع في دورتها السنوية حول الشمس. للتكبير، انقر على شهر لرؤية أوضح لذلك الجزء من تقدم مدار الأرض.",

    neighborhoodTitle: "جيراننا الكوكبيون",
    neighborhoodDesc: "عند النقر على أي يوم، يمكنك أيضًا مشاهدة تقدم وموقع الكواكب المجاورة لنا. انقر على أي كوكب للحصول على بيانات مدارية مفصلة. شاهد المعارضة، والاقتران، ومحاذاة الكواكب تحدث في الوقت الحقيقي. هذا لا يساعدنا فقط على فهم السماء الليلية، بل يساعدنا أيضًا على التوافق مع دورات زمنية أكبر بكثير (يستغرق نبتون 165 سنة أرضية لإكمال مداره!).",

    getLunarTitle: "تتبع القمر",
    getLunarDesc: "هل تلاحظ مركز التقويم أثناء مرورك على أيام السنة؟ يمكنك أن ترى في الوقت الحقيقي كيف تتغير أطوار القمر على مدار السنة. انقر على القمر في الزاوية اليمنى السفلى للحصول على بيانات مدار مفصلة.",

    animalCyclesTitle: "دورات الكائنات الأرضية الكبرى",
    animalCyclesDesc: "لم تتبع الحضارات العظيمة الدورات السماوية فقط، بل استخدمت أيضًا دورات الكائنات العظيمة من حولها للاحتفال بالزمن. انقر على رمز الأرض في الزاوية السفلية اليسرى لرؤية مكان تواجد الحيتان الرمادية في أمريكا الشمالية أثناء هجرتها في وقت معين من السنة. المزيد من الحيوانات قادمة قريبًا!",

    addEventsTitle: "إضافة الأحداث والدورات",
    addEventsDesc: "استخدم EarthCal لتسجيل أحداثك والمهام اليومية. أضف أحداثك لمرة واحدة والدورات السنوية (مثل أعياد الميلاد!) إلى التقويم بالنقر على الزر + في أعلى اليسار للتاريخ المحدد. قريبًا سيتم تفعيل مزامنة تقويم Google.",

    buttonNextWelcome: "كيف يعمل ➔",
    buttonNextOrbit: "الكواكب ➔",
    buttonNextPlanets: "القمر ➔",
    buttonNextMoon: "دورات الكائنات الأرضية ➔",
    buttonNextCycles: "التالي ➔",
    buttonDone: "✓ تم",
    buttonBack: "↩ رجوع"
  },

// DATE SEARCH

  goToDateTitle: "اذهب إلى التاريخ...",
  prevYear: "السنة السابقة",
  nextYear: "السنة التالية",
  goToDate: "اذهب إلى التاريخ",
  invalidDay: "يرجى التأكد من اختيار يوم مناسب أقل من 31!",
  invalidFebruary: "يرجى التأكد من اختيار يوم مناسب لشهر فبراير!",
  invalidLeapYear: "يرجى اختيار يوم أقل من 29 لفبراير في سنة غير كبيسة!",

// CORE DATE TERMS

  daysOfWeek: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],

  monthsOfYear: [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ],

  ordinalSuffixes: ['st', 'nd', 'rd', 'th'], // Not used in Arabic

  dayTranslations: 'يوم',
  ofTranslations: 'من',
  todayYouveGot: 'لديك اليوم',
  event: 'حدث',
  events: 'أحداث',

// VERSION ANNOUNCEMENT

  versioning: {
    title: "مرحبًا بك في EarthCal 0.9!",
    subtitle: "تم تحديث EarthCal لشهر يونيو 2025! نحن الآن في الإصدار 0.94:",
    features: [
      "يمكنك الآن تسجيل الدخول باستخدام حساب Buwana لحفظ ومزامنة أحداثك",
      "تم تفعيل دعم المناطق الزمنية! استخدم زر الإعدادات للتغيير.",
      "تحسين دعم اللغة! الآن تم ترجمة ما يصل إلى 75% من التطبيق.",
      "التقاويم العامة متاحة الآن للإضافة إلى العرض (يجب تسجيل الدخول أولاً)",
      "تمت مزامنة دورة هجرة البلشون الأسود مع التقويم.",
      "تصحيحات أخطاء بسيطة وكبيرة."
    ],
    gotIt: "👍 لنبدأ!",
    tour: " 🌏 المزيد: جولة EarthCal"
  },

// SETTINGS

  settings: {
    languages: {
      EN: "EN - الإنجليزية",
      ID: "ID - الإندونيسية",
      FR: "FR - الفرنسية",
      ES: "ES - الإسبانية",
      DE: "DE - الألمانية",
      AR: "AR - العربية"
    },
    applySettings: "تطبيق الإعدادات",
    saving: "جارٍ الحفظ...",
    darkMode: {
      legend: "تبديل بين الوضع الداكن والفاتح:",
      remember: "تذكر لجميع الصفحات"
    }
  },

  // DATE SEARCH
openDateSearch: {
  title: "الانتقال إلى التاريخ...",
  placeholderDay: "اليوم",
  months: [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ],
  prevYear: "السنة السابقة",
  nextYear: "السنة التالية",
  goToDate: "الانتقال إلى التاريخ",
  invalidDay: "يرجى التأكد من اختيار يوم مناسب أقل من 31!",
  invalidFebruary: "يرجى التأكد من اختيار تاريخ مناسب لشهر فبراير!",
  invalidLeapYear: "يرجى اختيار يوم أقل من 29 لشهر فبراير في سنة غير كبيسة!",
  searching: "جارٍ البحث..."
},

// LOG IN SCREEN
loggedIn: {
  welcome: "مرحبًا",
  syncingInfo: "أنت تدير Earthcals التالية...",
  publicCalendarsIntro: "You are subscribed to the following public calendars...",
  webcalHasSubscriptions: "You have the following iCal subscriptions...",
  webcalNoSubscriptions: "You don't yet have any webcal subscriptions.",
  noPersonal: "لا توجد تقاويم شخصية متاحة.",
  addPersonal: "أضف Earthcal جديدًا...",
  browsePublic: "تصفح واشترك في Earthcals العامة...",
  noPublic: "لا توجد تقاويم عامة متاحة.",
  noWebcal: "No iCal subscriptions connected yet.",
  syncNow: "مزامنة الآن",
  logout: "تسجيل الخروج",
  notYetSynced: "لم يتم مزامنة دورات التاريخ الخاصة بك بعد.",
  lastSynced: "آخر مزامنة في"
},

login: {
  emailPlaceholder: "بريدك الإلكتروني...",
  passwordPlaceholder: "كلمة المرور...",
  statusFirstTime: (emoji) => `🎉 تم إنشاء حسابك في Buwana! ${emoji}`,
  statusReturning: (emoji, name) => `${emoji} مرحبًا بعودتك، ${name}`,
  credentialLabel: "سجّل الدخول باستخدام بيانات اعتماد حساب Buwana الخاص بك.",
  forgotPassword: "هل نسيت كلمة المرور؟",
  resetLink: "إعادة التعيين.",
  sendCode: "📨 إرسال الرمز",
  login: "تسجيل الدخول"
},

// MAIN MENU
mainMenu: {
  title: "مزامنة مع دورات الأرض",
  featureTour: "جولة في الميزات",
  latestVersion: "معلومات الإصدار الأخير",
  upgradeToPro: "Upgrade to Pro",
  newsletter: "النشرة الإخبارية لـ Earthen.io",
  guide: "دليل التقويم ↗",
  purchasePrint: "شراء النسخة المطبوعة ↗",
  about: "حول المشروع ↗",
  darkModeToggle: "تبديل بين الوضع الليلي/النهاري",
  developedBy: "تم تطوير EarthCal بواسطة",
  authBy: "المصادقة بواسطة"
},

subscriptions: {
  heading: "Select Moment Mastery",
  currentPlan: "You are currently on the {planName} plan.",
  currentStatus: "Status: {status}",
  loginRequired: "Please sign in to manage your EarthCal subscription.",
  loadError: "We were unable to load your subscription details. Please try again in a few moments.",
  noPlans: "No plans are available right now.",
  tableHeaders: {
    plan: "Plan",
    description: "Description",
    price: "Price"
  },
  priceFree: "Free",
  billingSuffix: {
    month: "/ month",
    year: "/ year",
    lifetime: "Lifetime access"
  },
  currentBadge: "Current plan"
},

// ADD DATECYCLE
addCycle: {
  titlePrefix: "إضافة حدث لـ",
  addButton: "+ إضافة دورة تاريخ",
  placeholderCalendar: "تقويمي"
},

// TIMEZONES
timezones: [
  { value: 'Etc/GMT+12', label: 'جزيرة بيكر (UTC-12)' },
  { value: 'Pacific/Pago_Pago', label: 'ساموا (UTC-11)' },
  { value: 'Pacific/Honolulu', label: 'هاواي (UTC-10)' },
  { value: 'America/Anchorage', label: 'ألاسكا (UTC-9)' },
  { value: 'America/Los_Angeles', label: 'لوس أنجلوس (UTC-8)' },
  { value: 'America/Denver', label: 'دنفر (UTC-7)' },
  { value: 'America/Chicago', label: 'شيكاغو (UTC-6)' },
  { value: 'America/New_York', label: 'نيويورك (UTC-5)' },
  { value: 'America/Toronto', label: 'تورنتو (UTC-5/UTC-4 DST)' },
  { value: 'America/Halifax', label: 'هاليفاكس (UTC-4)' },
  { value: 'America/Sao_Paulo', label: 'ساو باولو (UTC-3)' },
  { value: 'Atlantic/South_Georgia', label: 'جورجيا الجنوبية (UTC-2)' },
  { value: 'Atlantic/Azores', label: 'جزر الأزور (UTC-1)' },
  { value: 'Etc/UTC', label: 'UTC (التوقيت العالمي المنسق)' },
  { value: 'Europe/London', label: 'لندن (UTC+0/UTC+1 DST)' },
  { value: 'Europe/Berlin', label: 'برلين (UTC+1)' },
  { value: 'Europe/Helsinki', label: 'هلسنكي (UTC+2)' },
  { value: 'Europe/Moscow', label: 'موسكو (UTC+3)' },
  { value: 'Asia/Dubai', label: 'دبي (UTC+4)' },
  { value: 'Asia/Karachi', label: 'كراتشي (UTC+5)' },
  { value: 'Asia/Dhaka', label: 'دكا (UTC+6)' },
  { value: 'Asia/Jakarta', label: 'جاكرتا (UTC+7)' },
  { value: 'Asia/Singapore', label: 'سنغافورة (UTC+8)' },
  { value: 'Asia/Shanghai', label: 'شنغهاي (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'طوكيو (UTC+9)' },
  { value: 'Australia/Sydney', label: 'سيدني (UTC+10)' },
  { value: 'Pacific/Guadalcanal', label: 'جوادالكانال (UTC+11)' },
  { value: 'Pacific/Auckland', label: 'أوكلاند (UTC+12)' }
]

};
