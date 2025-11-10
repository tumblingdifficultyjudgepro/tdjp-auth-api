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
      start: 'Start Quiz',
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
    }
  },

  calculator: {
    total: 'Total Difficulty:',
    delete: 'Delete',
    clear: 'Clear',
    sort: { difficulty: 'Difficulty', direction: 'Direction', usage: 'Usage' },
  }
} as const;

export default en;
