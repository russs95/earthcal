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
    title: "欢迎使用 EarthCal 0.9！",
    subtitle: "EarthCal 已更新至 2025 年 6 月版本！当前版本为 0.94：",
    features: [
      "你现在可以通过 Buwana 账户登录，以保存并同步你的事件",
      "已启用时区支持！请使用设置按钮切换。",
      "语言支持升级！应用程序现已翻译超过 75%。",
      "现在可以添加公共日历到你的视图中（需要先登录）",
      "黑鹭的迁徙周期已与日历同步。",
      "修复了若干主要和次要的错误。"
    ],
    gotIt: "👍 开始使用！",
    tour: " 🌏 更多内容：EarthCal 指南"
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
  publicCalendarsIntro: "You are subscribed to the following public calendars...",
  webcalHasSubscriptions: "You have the following iCal subscriptions...",
  webcalNoSubscriptions: "You don't yet have any webcal subscriptions.",
  noPersonal: "没有可用的个人日历。",
  addPersonal: "添加新的 Earthcal...",
  browsePublic: "浏览并订阅公共 Earthcal...",
  noPublic: "没有可用的公共日历。",
  noWebcal: "No iCal subscriptions connected yet.",
  syncNow: "立即同步",
  logout: "退出登录",
  notYetSynced: "您的日期循环尚未同步。",
  lastSynced: "上次同步时间"
},

login: {
  emailPlaceholder: "您的电子邮件...",
  passwordPlaceholder: "您的密码...",
  statusFirstTime: (emoji) => `🎉 您的 Buwana 账户已创建！${emoji}`,
  statusReturning: (emoji, name) => `${emoji} 欢迎回来，${name}`,
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
  newsletter: "Earthen.io 通讯",
  guide: "日历指南 ↗",
  purchasePrint: "购买印刷版 ↗",
  about: "关于项目 ↗",
  darkModeToggle: "切换黑夜/日间模式",
  developedBy: "EarthCal 由以下机构开发",
  authBy: "身份验证由以下机构提供"
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
