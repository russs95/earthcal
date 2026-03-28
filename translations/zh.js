// EARTHCAL TRANSLATIONS
// translations/zh.js

export const translations = {

// THE GUIDED TOUR

  tour: {
    welcomeIntro: "欢迎使用 EarthCal！",
    welcomeParagraph: "是时候进化我们的日历了！是时候从线条和方框转向圆圈和周期了。EarthCal 是你观察日、月、年以及其他地球周期的新窗口，我们在地球上的每个瞬间都随着它们起舞。使用 EarthCal 来管理并同步你的事件与月亮、行星及神奇生物的周期。",

    oneOrbitTitle: "一年。\n一圈轨道。",
    oneOrbitDesc: "EarthCal 从当前年份的视图开始。地球绕太阳一圈大约需要 365 天，所以我们将 EarthCal 的主圆圈分成了 365 部分（在闰年我们设置为 366！）。点击任意分区，可以看到地球在太阳周围按该日位置进行动画演示。点击月份可放大查看该段地球轨道的进展。",

    neighborhoodTitle: "我们的宇宙邻居",
    neighborhoodDesc: "点击任意日期，你还可以查看我们行星邻居的位置与轨迹。点击任意行星可以查看详细的轨道数据。实时观看对冲、合相和行星排列。这不仅有助于我们理解夜空，也帮助我们与更宏大的时间周期保持一致（海王星完成一圈轨道需要 165 个地球年！）。",

    getLunarTitle: "查看月相",
    getLunarDesc: "当你滑过一年的日期时，是否注意到日历中心？你可以实时看到月亮的相位如何随着年份而变化。点击右下角的月亮可查看详细的轨道数据。",

    animalCyclesTitle: "伟大的地球生物周期",
    animalCyclesDesc: "伟大的文明不仅遵循天体周期，也依据周围伟大生物的周期来庆祝时间。点击左下角的地球图标，可查看北美灰鲸在某年特定时间的迁徙位置。更多动物即将上线！",

    addEventsTitle: "添加事件与周期",
    addEventsDesc: "使用 EarthCal 来记录你的事件和每日待办。点击左上角的 + 为选定日期添加一次性事件和年度周期（例如生日！）。即将支持与谷歌日历同步。",

    buttonNextWelcome: "使用说明 ➔",
    buttonNextOrbit: "行星 ➔",
    buttonNextPlanets: "月亮 ➔",
    buttonNextMoon: "地球生物周期 ➔",
    buttonNextCycles: "下一步 ➔",
    buttonDone: "✓ 完成",
    buttonBack: "↩ 返回"
  },

// DATE SEARCH

  goToDateTitle: "跳转到日期...",
  prevYear: "上一年",
  nextYear: "下一年",
  goToDate: "跳转到日期",
  invalidDay: "请选择一个合理的日期，不超过 31！",
  invalidFebruary: "请选择 2 月的合理日期！",
  invalidLeapYear: "在非闰年中，请选择不超过 29 日的日期！",

// CORE DATE TERMS

  daysOfWeek: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],

  monthsOfYear: [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ],

  ordinalSuffixes: ['st', 'nd', 'rd', 'th'], // 不适用于中文，可忽略

  dayTranslations: '日',
  ofTranslations: '的',
  todayYouveGot: '今天你有',
  event: '个事件',
  events: '个事件',

// VERSION ANNOUNCEMENT

  versioning: {
    title: "Earthcal v1.3",
    subtitle: "值此春分之际，我们欣然推出 Earthcal 1.3 版本。整个代码库已经过全面审查，修复了错误，优化了安装流程和功能表现。但这还不是最令人兴奋的。最激动人心的是什么？我们现在接入了 Earthen Auspicer API。Earthcal 已经能够为特定日期计算各种月相、太阳和行星周期的天文数据，并以可视化和数字形式呈现。但它们意味着什么？原住民传统、时间生物学和生物动力学对此有明确而深刻的解读！无论月亮是在下弦月上升、远地点、满月下降，我们都将这三个来源交叉参考，构建了一套日期解析引擎。现在当你添加一个日期项时，你将看到该日期的地球征兆！这不是占星术，也不是人工智能——这是一套基于扎实天文数据、生物动力学理论和先祖智慧构建的复杂语义引擎。展开数据窗口，一探究竟。",
    features: [
      "Auspicer 1.0 版本现已激活（点击 + 添加事件）",
      "Jedi 模式现已开放，可使用高级功能",
      "黄道带位置现在可以切换显示与隐藏",
      "EarthCal macOS 桌面新版本已发布",
    ],
    gotIt: "👍 开始使用！",
    tour: " 🌏 EarthCal Guided Tour",
  },

// SETTINGS

  settings: {
    languages: {
      EN: "EN - 英语",
      ID: "ID - 印度尼西亚语",
      FR: "FR - 法语",
      ES: "ES - 西班牙语",
      DE: "DE - 德语",
      AR: "AR - 阿拉伯语"
    },
    applySettings: "应用设置",
    saving: "保存中...",
    darkMode: {
      legend: "切换明暗模式：",
      remember: "记住所有页面的设置"
    }
  },

  // DATE SEARCH
openDateSearch: {
  title: "跳转到日期...",
  placeholderDay: "日",
  months: [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ],
  prevYear: "上一年",
  nextYear: "下一年",
  goToDate: "跳转到日期",
  invalidDay: "请选择一个不超过31的有效日期！",
  invalidFebruary: "请选择二月份的有效日期！",
  invalidLeapYear: "平年中请选择二月份小于29号的日期！",
  searching: "搜索中..."
},

// LOG IN SCREEN
loggedIn: {
  welcome: "欢迎",
  syncingInfo: "您正在管理以下 Earthcal...",
  publicCalendarsIntro: "你已订阅以下公共日历...",
  webcalHasSubscriptions: "你有以下 iCal 订阅...",
  webcalNoSubscriptions: "你还没有任何 webcal 订阅。",
  noPersonal: "没有可用的个人日历。",
  addPersonal: "添加新的 Earthcal...",
  browsePublic: "浏览并订阅公共 Earthcal...",
  noPublic: "没有可用的公共日历。",
  noWebcal: "尚未连接任何 iCal 订阅。",
  syncNow: "立即同步",
  logout: "退出登录",
  notYetSynced: "您的日期循环尚未同步。",
  lastSynced: "上次同步时间"
},

login: {
  emailPlaceholder: "您的电子邮件...",
  passwordPlaceholder: "您的密码...",
  statusFirstTime: (emoji) => `🎉 您的 Buwana 账户已创建！${emoji}`,
  statusReturning: (emoji, name) => `欢迎 ${name}。  请使用 Buwana 帐户登录，以充分利用 EarthCal 强大的日历和事件管理功能。`,
  credentialLabel: "使用您的 Buwana 账户凭据登录。",
  forgotPassword: "忘记密码？",
  resetLink: "重置密码。",
  sendCode: "📨 发送验证码",
  login: "登录"
},

// MAIN MENU
mainMenu: {
  title: "与地球周期同步",
  featureTour: "功能导览",
  latestVersion: "最新版本信息",
  upgradeToPro: "升级到 Pro",
  newsletter: "Earthen.io 通讯",
  guide: "日历指南 ↗",
  purchasePrint: "购买印刷版 ↗",
  about: "关于项目 ↗",
  darkModeToggle: "切换黑夜/日间模式",
  developedBy: "EarthCal 由以下机构开发",
  authBy: "身份验证由以下机构提供"
},

subscriptions: {
  heading: "升级 EarthCal",
  currentPlan: "你当前使用的是 {planName} 套餐。",
  currentStatus: "状态：{status}",
  loginRequired: "请登录以管理你的 EarthCal 订阅。",
  loadError: "我们无法加载你的订阅详情，请稍后再试。",
  noPlans: "目前没有可用的套餐。",
  tableHeaders: {
    plan: "套餐",
    description: "描述",
    price: "价格"
  },
  priceFree: "免费",
  billingSuffix: {
    month: "/ 月",
    year: "/ 年",
    lifetime: "终身使用"
  },
  currentBadge: "当前套餐"
},

// OFFLINE MESSAGES
offline: {
  bannerNonJedi: "你似乎处于离线状态！重新连接以同步。或者...升级以使用 Jedi 离线模式。",
  bannerJediModeOn: "你正在使用 Jedi 离线模式！准备好后重新连接以同步。",
  bannerJediModeOff: "你处于离线状态。离线模式已关闭。重新连接以同步。",
  alertPadwan: "你似乎处于离线状态！请重新连接以使用 EarthCal。或者...升级到 Jedi 账户，享受超实用的离线模式。",
  alertJedi: "你似乎处于离线状态！请重新连接，或在设置中开启离线模式以使用缓存数据。",
},

// ADD DATECYCLE
addCycle: {
  titlePrefix: "添加事件于",
  addButton: "+ 添加日期循环",
  placeholderCalendar: "我的日历"
},

// TIMEZONES
timezones: [
  { value: 'Etc/GMT+12', label: '贝克岛 (UTC-12)' },
  { value: 'Pacific/Pago_Pago', label: '萨摩亚 (UTC-11)' },
  { value: 'Pacific/Honolulu', label: '夏威夷 (UTC-10)' },
  { value: 'America/Anchorage', label: '阿拉斯加 (UTC-9)' },
  { value: 'America/Los_Angeles', label: '洛杉矶 (UTC-8)' },
  { value: 'America/Denver', label: '丹佛 (UTC-7)' },
  { value: 'America/Chicago', label: '芝加哥 (UTC-6)' },
  { value: 'America/New_York', label: '纽约 (UTC-5)' },
  { value: 'America/Toronto', label: '多伦多 (UTC-5/UTC-4 夏令时)' },
  { value: 'America/Halifax', label: '哈利法克斯 (UTC-4)' },
  { value: 'America/Sao_Paulo', label: '圣保罗 (UTC-3)' },
  { value: 'Atlantic/South_Georgia', label: '南乔治亚岛 (UTC-2)' },
  { value: 'Atlantic/Azores', label: '亚速尔群岛 (UTC-1)' },
  { value: 'Etc/UTC', label: '协调世界时 (UTC)' },
  { value: 'Europe/London', label: '伦敦 (UTC+0/UTC+1 夏令时)' },
  { value: 'Europe/Berlin', label: '柏林 (UTC+1)' },
  { value: 'Europe/Helsinki', label: '赫尔辛基 (UTC+2)' },
  { value: 'Europe/Moscow', label: '莫斯科 (UTC+3)' },
  { value: 'Asia/Dubai', label: '迪拜 (UTC+4)' },
  { value: 'Asia/Karachi', label: '卡拉奇 (UTC+5)' },
  { value: 'Asia/Dhaka', label: '达卡 (UTC+6)' },
  { value: 'Asia/Jakarta', label: '雅加达 (UTC+7)' },
  { value: 'Asia/Singapore', label: '新加坡 (UTC+8)' },
  { value: 'Asia/Shanghai', label: '上海 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '东京 (UTC+9)' },
  { value: 'Australia/Sydney', label: '悉尼 (UTC+10)' },
  { value: 'Pacific/Guadalcanal', label: '瓜达尔卡纳尔 (UTC+11)' },
  { value: 'Pacific/Auckland', label: '奥克兰 (UTC+12)' }
]

};
