const en = {
  tabs: {
    tariff: 'Tariff',
    calc: 'Calculator',
    flash: 'Flashcards',
    quiz: 'Quiz',
    progress: 'Progress',
    home: 'Home',
    settings: 'Settings'
  },
  screens: {
    home: 'Home',
    calculator: 'Calculator',
    quiz: 'Quiz',
    flashcards: 'Flashcards',
    tariff: 'Tariff',
    progress: 'Progress'
  },
  quiz: {
    settings: {
      title: 'Test Yourself !',
      back: 'Back',
      next: 'Next',
      start: 'התחל מבחן',
      modeTitle: 'Mode',
      modeCustom: 'Custom',
      modeRandom: 'Random',
      formTitle: 'Question Type',
      formMcq: 'Multiple Choice',
      formOpen: 'Open',
      promptTitle: 'Question Display',
      promptSymbol: 'Symbol',
      promptElementName: 'Element Name',
      mappingTitle: 'Mapping',
      mappingElementName: 'Element Name',
      mappingElementValue: 'Element Value',
      countTitle: 'Number of Questions',
      timerTitle: 'Timer per Question',
      timer10: '10s',
      timer20: '20s',
      timer30: '30s',
      timer60: '60s',
      timerUnlimited: 'No timer'
    },

    templates: {
      nameToValue: "What is the difficulty value of:",
      symbolToValue: "What is the difficulty value of:",
      valueToName: "Which element has a difficulty value of:",
      valueToSymbol: "Which symbol has a difficulty value of:",
    },
    actions: {
      next: "Next",
      check: "Check",
      correct: "Correct!",
      wrong: "Incorrect",
      finish: "Finish Quiz",
      start: "Start Test",
      back: "Delete",
    },
    summary: {
      title: "Quiz Summary",
      score: "Score",
      correct: "Correct Answers",
      wrong: "Wrong Answers",
      total: "Total Questions",
      avgTime: "Average Time / Question",
      restart: "Start New Quiz",
    },
    timer: {
      unlimited: "Unlimited",
      seconds: "{{s}}s",
    },
    form: {
      title: "Question Type",
      open: "Open",
      mcq: "Multiple Choice",
    },
    prompt: {
      title: "Question Prompt",
      name: "Element Name",
      symbol: "Symbol",
    },
    mapping: {
      title: "Mapping",
      elementToValue: "Name/Symbol → Value",
      valueToElement: "Value → Name/Symbol",
    },
    countTimer: {
      title: "Count & Timer",
      questions: "Number of Questions",
      perQuestion: "Timer per Question",
    }
  },

  calculator: {
    total: 'Total Difficulty:',
    delete: 'Delete',
    clear: 'Clear',
    sort: { difficulty: 'Difficulty', direction: 'Direction', usage: 'Usage' },
  },

  summary: {
    title: "סיכום מבחן",
    score: "ציון",
    correct: "תשובות נכונות",
    wrong: "תשובות שגויות",
    total: "סך הכול שאלות",
    avgTime: "זמן ממוצע לשאלה",
    restart: "התחל מבחן חדש",
    header: "המבחן הושלם בהצלחה !",
    correctLabel: "התשובה הנכונה:",
    wrongLabel: "תשובה שגויה:",
    unanswered: "לא נענתה תשובה",
    practiceAgain: "תרגל שוב",
    close: "סגור"
},

tariff: {
  header: {
    symbolMode: {
      symbols: 'View: symbol',
      names: 'View: element name',
    },
  },
  athlete: {
    title: 'Athlete details',
    country: 'Country',
    autoBonus: 'Automatic bonus calculation',
    countryIsrael: 'Israel',
    countryBritain: 'Great Britain',
    countryUSA: 'United States',
    countryRussia: 'Russia',
    countryUkraine: 'Ukraine',
    countryChina: 'China',
    countryComingSoon: 'Screen coming soon!',
    selectCountry: 'Select country',
    name: 'Athlete name',
    namePlaceholder: 'Full name',
    club: 'Club',
    clubPlaceholder: 'Club name',
    number: 'Athlete number',
    round: 'Round',
    gender: 'Gender',
    genderF: 'F',
    genderM: 'M',
    track: 'Track',
    trackLeague: 'League',
    trackNational: 'National',
    trackInternational: 'International',
    level: 'Level',
  },

  passes: {
    pass1: 'Pass 1',
    pass2: 'Pass 2',
    select: 'Select Pass',
  },
},

common: {
  close: 'Close',
},


} as const;

export default en;
