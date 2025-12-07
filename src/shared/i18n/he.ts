const he = {
  tabs: {
    tariff: 'טריף',
    calc: 'מחשבון',
    flash: 'כרטיסיות',
    quiz: 'מבחן',
    progress: 'התקדמות',
    home: 'בית',
    settings: 'הגדרות',
  },

  home: {
    greeting: 'ברוכה הבאה',
    dailyQuoteTitle: 'הציטוט היומי',
    guestTitle: 'ברוכים הבאים ל-TDJP',
    guestSubtitle: 'העוזר האישי שלך לשיפוט התעמלות',
    loginAction: 'התחברות / הרשמה',
    elementOfTheDay: 'האלמנט היומי',
    quickActions: {
      quiz: 'מבחן מהיר',
      calc: 'מחשבון',
      stats: 'הסטטיסטיקה שלי',
      rules: 'חוקה'
    }
  },

  auth: {
    login: 'התחברות',
    register: 'הרשמה',
    logout: 'התנתקות'
  },

  screens: {
    home: 'בית',
    calculator: 'מחשבון',
    quiz: 'מבחן',
    flashcards: 'כרטיסיות',
    tariff: 'תעריף',
    progress: 'התקדמות',
  },

  quiz: {
    settings: {
      title: 'בחן את עצמך !',
      back: 'חזרה',
      next: 'הבא',
      start: 'התחל מבחן',
      modeTitle: 'מצב מבחן',
      modeCustom: 'התאמה אישית',
      modeRandom: 'אקראי',
      formTitle: 'סוג השאלות',
      formMcq: 'רב ברירה',
      formOpen: 'פתוחה',
      promptTitle: 'תצוגת השאלה',
      promptSymbol: 'סימבול',
      promptElementName: 'שם האלמנט',
      mappingTitle: 'כיווניות',
      mappingElementName: 'שם האלמנט',
      mappingElementValue: 'ערך האלמנט',
      countTitle: 'מספר שאלות',
      timerTitle: 'טיימר לשאלה',
      timer10: '10 שנ׳',
      timer20: '20 שנ׳',
      timer30: '30 שנ׳',
      timer60: '60 שנ׳',
      timerUnlimited: 'ללא טיימר',
    },

    templates: {
      nameToValue: 'מה דרגת הקושי של:',
      symbolToValue: 'מה דרגת הקושי של:',
      valueToName: 'מה האלמנט שדרגת הקושי שלו היא:',
      valueToSymbol: 'מה הסימבול שדרגת הקושי שלו היא:',
    },

    actions: {
      next: 'הבא',
      check: 'בדוק',
      correct: 'נכון!',
      wrong: 'לא נכון',
      finish: 'סיום מבחן',
      start: 'התחל',
      back: 'חזרה',
    },

    summary: {
      title: 'סיכום מבחן',
      score: 'ציון',
      correct: 'תשובות נכונות',
      wrong: 'תשובות שגויות',
      total: 'סך הכול שאלות',
      avgTime: 'זמן ממוצע לשאלה',
      restart: 'התחל מבחן חדש',
    },

    timer: {
      unlimited: 'ללא הגבלת זמן',
      seconds: '{{s}} שניות',
    },

    form: {
      title: 'סוג שאלה',
      open: 'פתוחה',
      mcq: 'רב־ברירה',
    },

    prompt: {
      title: 'תצוגת שאלה',
      name: 'שם אלמנט',
      symbol: 'סימבול',
    },

    mapping: {
      title: 'כיוון המרה',
      elementToValue: 'שם/סימבול → ערך',
      valueToElement: 'ערך → שם/סימבול',
    },

    countTimer: {
      title: 'כמות וזמן',
      questions: 'מספר שאלות',
      perQuestion: 'טיימר לשאלה',
    },
  },

  calculator: {
    total: 'סה״כ דרגת קושי:',
    delete: 'מחק',
    clear: 'נקה',
    sort: {
      difficulty: 'דרגת קושי',
      direction: 'כיוון',
      usage: 'שימוש',
    },
  },

  summary: {
    title: 'סיכום מבחן',
    score: 'ציון',
    correct: 'תשובות נכונות',
    wrong: 'תשובות שגויות',
    total: 'סך הכול שאלות',
    avgTime: 'זמן ממוצע לשאלה',
    restart: 'התחל מבחן חדש',
    header: 'המבחן הושלם בהצלחה !',
    correctLabel: 'התשובה הנכונה:',
    wrongLabel: 'תשובה שגויה:',
    unanswered: 'לא נענתה תשובה',
    practiceAgain: 'תרגל שוב',
    close: 'סגור',
  },

  tariff: {
    header: {
      symbolMode: {
        symbols: 'תצוגה: סימבול',
        names: 'תצוגה: שם אלמנט',
      },
    },

    athlete: {
      title: 'פרטי מתעמל/ת',
      country: 'מדינה',
      autoBonus: 'חישוב בונוס אוטומטי',
      countryIsrael: 'ישראל',
      countryBritain: 'בריטניה',
      countryUSA: 'ארצות הברית',
      countryRussia: 'רוסיה',
      countryUkraine: 'אוקראינה',
      countryChina: 'סין',
      countryComingSoon: 'יגיע בקרוב !',
      selectCountry: 'בחר מדינה',
      name: 'שם המתעמל/ת',
      namePlaceholder: 'שם מלא',
      club: 'אגודה',
      clubPlaceholder: 'שם האגודה',
      number: 'מספר מתעמל/ת',
      round: 'סבב',
      gender: 'מגדר',
      genderF: 'F',
      genderM: 'M',
      track: 'מסלול',
      trackLeague: 'ליגה',
      trackNational: 'לאומי',
      trackInternational: 'בינלאומי',
      level: 'דרגה',
    },

    passes: {
      pass1: 'פס 1',
      pass2: 'פס 2',
      select: 'בחר פס',
    },

    messages: {
      selectPassFirst: 'צריך לבחור פס קודם',
    },

    actions: {
      resetPage: 'איפוס עמוד',
      exportPdf: 'ייצא ל-PDF',
    },

    export: {
      successTitle: 'הקובץ נשמר בהצלחה !',
      open: 'פתח',
      close: 'סגור',
      share: 'שתף',
    },
  },

  common: {
    close: 'סגור',
  },
} as const;

export default he;
