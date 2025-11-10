const he = {
  tabs: {
    tariff: 'טריף',
    calc: 'מחשבון',
    flash: 'כרטיסיות',
    quiz: 'מבחן',
    progress: 'התקדמות',
    home: 'בית',
    settings: 'הגדרות'
  },
  screens: {
    home: 'בית',
    calculator: 'מחשבון',
    quiz: 'מבחן',
    flashcards: 'כרטיסיות',
    tariff: 'תעריף',
    progress: 'התקדמות'
  },
  quiz: {
    settings: {
      title: 'בחן את עצמך !',
      back: 'חזרה',
      next: 'הבא',
      start: 'התחלת מבחן',
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
      timerUnlimited: 'ללא טיימר'
    }
  },

  calculator: {
    total: 'סה״כ דרגת קושי:',
    delete: 'מחק',
    clear: 'נקה',
    sort: { difficulty: 'דרגת קושי', direction: 'כיוון', usage: 'שימוש' },
  }

} as const;

export default he;
