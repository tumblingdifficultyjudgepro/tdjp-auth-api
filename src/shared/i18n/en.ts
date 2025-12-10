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
    guestSubtitle: 'Your personal tumbling judging companion',
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
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone',
    country: 'Country',
    role: 'Role',
    judge: 'Judge',
    coach: 'Coach',
    club: 'Club',
    judgeLevel: 'Judge Level',
    selectJudgeLevel: 'Select Level',
    selectCountry: 'Select Country',
    selectClubPlaceholder: 'Select Club',
    brevet: 'Brevet',
    submitLogin: 'Sign In',
    submitRegister: 'Sign Up',
    rememberMe: 'Remember me',
    noAccount: "Don't have an account? ",
    registerLink: 'Sign up here',
    placeholders: {
      email: 'name@example.com',
      password: '********',
      name: 'John Doe'
    },
    forgotPassword: 'Forgot Password?',
    verifyTitle: 'Verify Account',
    verifySubtitle: 'For security, a code was sent to email:',
    enterCode: 'Enter Verification Code',
    verifyBtn: 'Verify Account',
    verifySuccess: 'Verification Successful!',
    errors: {
      fillAll: 'Please fill in all required fields',
      invalidEmail: 'Invalid email address',
      emailTaken: 'Email is already registered',
      neutralJudge: 'Neutral Judge',
      chooseGallery: 'Choose from Gallery',
      takePhoto: 'Take Photo',
      cancel: 'Cancel',
      selectAvatar: 'Select Profile Picture',
      invalidPhone: 'Invalid phone number',
      phoneTaken: 'Phone number is already registered',
      passwordShort: 'Password must be at least 8 characters',
      selectClub: 'Please select a club',
      invalidJudgeLevel: 'Invalid judge level',
      selectBrevet: 'Please select a brevet level',
      invalidCredentials: 'Invalid email or password',
      invalidCode: 'Invalid verification code',
      codeExpired: 'Verification code expired',
      server: 'System error, please try again',
      network: 'Network error, check your connection'
    },
    changePassword: {
      title: 'Change Password',
      descriptionStart: 'To change your password, we need to verify it\'s you.\nWe will send a code to your registered email.',
      sendCode: 'Send Verification Code',
      verifyInstruction: 'Enter the 6-digit code:',
      newPasswordPlaceholder: 'New Password',
      confirmPasswordPlaceholder: 'Confirm Password',
      saveFinish: 'Save & Finish',
      btnLabel: 'Change Password',
      success: 'Password changed successfully!',
      codeSentTitle: 'Code Sent',
      codeSentBody: 'A verification code has been sent to your email',
      forgotTitle: 'Reset Password',
      forgotDesc: 'Enter your email to receive a verification code',
      enterEmail: 'Enter Email',
      emailNotFound: 'Email not found'
    },
    editUser: {
      myAccountTitle: 'My Account',
      editUserTitle: 'Edit User',
      deleteAccount: 'Delete Account',
      deleteConfirmTitle: 'Delete Account',
      deleteConfirmBody: 'Are you sure? This action cannot be undone.',
      deleteConfirmBtn: 'Delete',
      save: 'Save'
    }
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
    myAccount: 'My Account',
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
      start: 'Start Test',
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
