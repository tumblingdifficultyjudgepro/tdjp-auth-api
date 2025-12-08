const en = {
  tabs: {
    tariff: 'Tariff',
    calc: 'Calculator',
    flash: 'Flashcards',
    quiz: 'Quiz',
    progress: 'Progress',
    home: 'Home',
    settings: 'Settings',
  },

  home: {
    greeting: 'Welcome Back',
    dailyQuoteTitle: 'Daily Quote',
    guestTitle: 'Welcome to TDJP',
    guestSubtitle: 'Your personal gymnastics judging companion',
    loginAction: 'Login / Register',
    elementOfTheDay: 'Element of the Day',
    quickActions: {
      quiz: 'Quick Quiz',
      calc: 'Calculator',
      stats: 'My Stats',
      rules: 'Rulebook'
    }
  },

  auth: {
    login: 'Login',
    register: 'Register',
    logout: 'Logout'
  },

  settings: {
    tariffLocation: {
      title: 'Tariff files location',
      choose: 'Choose location',
      change: 'Change location',
      currentPrefix: 'Current location:',
      notSet: 'Not selected yet',
    },
    tariffAllowIllegalExport: {
      title: 'Allow tariff export for illegal passes',
    },
  },

  screens: {
    home: 'Home',
    calculator: 'Calculator',
    quiz: 'Quiz',
    flashcards: 'Flashcards',
    tariff: 'Tariff',
    progress: 'Progress',
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
      timerUnlimited: 'No timer',
    },

    templates: {
      nameToValue: 'What is the difficulty value of:',
      symbolToValue: 'What is the difficulty value of:',
      valueToName: 'Which element has a difficulty value of:',
      valueToSymbol: 'Which symbol has a difficulty value of:',
    },

    actions: {
      next: 'Next',
      check: 'Check',
      correct: 'Correct!',
      wrong: 'Incorrect',
      finish: 'Finish Quiz',
      start: 'Start Test',
      back: 'Delete',
    },

    summary: {
      title: 'Quiz Summary',
      score: 'Score',
      correct: 'Correct Answers',
      wrong: 'Wrong Answers',
      total: 'Total Questions',
      avgTime: 'Average Time / Question',
      restart: 'Start New Quiz',
    },

    timer: {
      unlimited: 'Unlimited',
      seconds: '{{s}}s',
    },

    form: {
      title: 'Question Type',
      open: 'Open',
      mcq: 'Multiple Choice',
    },

    prompt: {
      title: 'Question Prompt',
      name: 'Element Name',
      symbol: 'Symbol',
    },

    mapping: {
      title: 'Mapping',
      elementToValue: 'Name/Symbol → Value',
      valueToElement: 'Value → Name/Symbol',
    },

    countTimer: {
      title: 'Count & Timer',
      questions: 'Number of Questions',
      perQuestion: 'Timer per Question',
    },
  },

  calculator: {
    total: 'Total Difficulty:',
    delete: 'Delete',
    clear: 'Clear',
    sort: {
      difficulty: 'Difficulty',
      direction: 'Direction',
      usage: 'Usage',
    },
  },

  summary: {
    title: 'Quiz Summary',
    score: 'Score',
    correct: 'Correct Answers',
    wrong: 'Wrong Answers',
    total: 'Total Questions',
    avgTime: 'Average Time / Question',
    restart: 'Start New Quiz',
    header: 'Quiz Completed Successfully!',
    correctLabel: 'Correct Answer:',
    wrongLabel: 'Wrong Answer:',
    unanswered: 'No Answer Provided',
    practiceAgain: 'Practice Again',
    close: 'Close',
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

    messages: {
      selectPassFirst: 'You need to select a pass first',
      passesIllegal: 'Passes are not legal',
    },

    actions: {
      resetPage: 'Reset page',
      exportPdf: 'Export to PDF',
    },

    export: {
      successTitle: 'File saved successfully!',
      open: 'Open',
      close: 'Close',
      share: 'Share',
    },

    confirmIllegalExport: {
      title: 'Passes are not legal',
      message: 'Passes are not legal. Do you want to export to PDF anyway?',
      yes: 'Yes',
      no: 'No',
    },
  },

  common: {
    close: 'Close',
  },

  errors: {
    intraRepeat: 'Element repeated in pass',
    maxBackFull: 'Max 3 back fulls per pass',
    crossRepeat: 'Element repeated across passes',
    doubleBackFullFinish: 'Only one pass may end with a Back Full',
    flickToForward: 'Back handspring into a forward element',
    tempoToForward: 'Whip/Tempo into a forward element',
    directionChange: 'Change of direction in middle of pass',
    cannotExport: 'Cannot export PDF while errors exist',
  },

  dialogs: {
    exitApp: {
      title: 'Exit App',
      message: 'Are you sure you want to exit?',
      exit: 'Exit',
      stay: 'Stay',
    },
  },

  feedback: {
    btnLabel: 'Suggest Idea / Report Bug',
    title: 'Send Feedback',
    typeIdea: 'Feature Idea',
    typeBug: 'Bug Report',
    name: 'Full Name',
    subject: 'Subject',
    message: 'Message',
    attach: 'Attach Image',
    send: 'Send',
    cancel: 'Cancel',
    maxImages: 'Max 3 images',
    noPermission: 'Gallery permission denied',
    errorTitle: 'Error',
    sendError: 'Send failed',
    successIdeaTitle: 'Thanks for the idea!',
    successIdeaBody: 'We will consider it.',
    successBugTitle: 'Thanks for the report!',
    successBugBody: 'We will fix it soon.',
    close: 'Close',
  },
} as const;

export default en;
