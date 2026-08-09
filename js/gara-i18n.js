// La Gara dei Numeri - Internationalization / Localization
const GARA_I18N = {
    currentLang: 'it', // default language

    strings: {
        it: {
            // Title screen
            gameTitle: 'La Gara dei Numeri',
            gameSubtitle: 'The Number Race',
            gameDesc: 'Un gioco educativo basato sulle neuroscienze per la cognizione numerica',
            playBtn: '▶ Gioca',
            tutorialBtn: '📖 Come si gioca',
            levelLabel: 'Livello:',
            levelBase: 'Base (1-9)',
            levelAdvanced: 'Avanzato (+/-)',
            creditsLine: 'Originale di A. Wilson e S. Dehaene (INSERM-CEA) · Versione web CCNL, Univ. di Padova',

            // Theme choice
            chooseWorld: 'Scegli il tuo Mondo',
            chooseWorldSub: 'Seleziona l\'ambiente per la tua avventura',
            underwaterWorld: 'Mondo Sottomarino',
            jungleWorld: 'Giungla',

            // Character choice
            chooseChar: 'Scegli il tuo Personaggio',
            chooseCharSub: 'Scegli il tuo corridore per la gara dei numeri!',

            // Game screen
            promptMore: 'Quale lato ha <strong>di più</strong>? Scegli velocemente!',
            squareAbbr: 'Cas',
            turnLabel: 'Turno',
            boardBtn: '📋 Tabellone',
            vsLabel: 'VS',

            // Feedback
            correct: '✓ Corretto!',
            correctSquares: '✓ Corretto! +{n} caselle',
            tryAgain: '✗ Riprova!',

            // Board screen
            boardTitle: 'Tabellone di Gara',
            youLabel: 'Tu',
            opponentLabel: 'Avversario',
            trapLabel: '⚠ Trappola',
            backToRace: '← Torna alla Gara',

            // Reward screen
            rescuedAnimal: '🏆 Hai salvato un animale!',
            animalsRescued: 'Animali salvati:',
            continueRacing: 'Continua la Gara →',

            // Game over
            youWin: '🎉 Hai Vinto!',
            gameOver: '😅 Fine della Gara!',
            yourPosition: 'La tua Posizione',
            opponent: 'Avversario',
            accuracy: 'Precisione',
            rescued: 'Salvati',
            playAgain: '🔄 Gioca Ancora',
            mainMenu: '🏠 Menu Principale',
            creditsFooter: 'Gioco originale di A. Wilson, S. Dehaene e colleghi (INSERM-CEA)',
            creditsFooter2: 'Adattamento web · CCNL, Università di Padova',

            // Instructions
            instrGoalTitle: 'L\'Obiettivo',
            instrGoalText: 'Fai correre il tuo personaggio fino al traguardo <strong>scegliendo il lato con di più</strong>! Confronta numeri mostrati come punti, cifre o problemi di addizione.',
            instrChooseTitle: 'Come Scegliere',
            instrChooseText: 'Clicca o tocca il <strong>lato sinistro o destro</strong> — oppure premi i tasti <strong>← / →</strong>. Scegli il lato con il <em>numero più grande</em> per avanzare!',
            instrMoveTitle: 'Movimento',
            instrMoveText: 'Risposta corretta: avanzi del <strong>numero più grande</strong>, l\'avversario del più piccolo. Risposta sbagliata: l\'avversario avanza al posto tuo!',
            instrTrapTitle: 'Attento alle Trappole!',
            instrTrapText: 'Alcune caselle sono <strong>trappole</strong>! Atterrarci ti fa tornare indietro. Tieni d\'occhio il tabellone!',
            instrRescueTitle: 'Salva gli Animali',
            instrRescueText: 'Man mano che avanzi, <strong>salverai animali intrappolati</strong> — raccoglili tutti e 7 per diventare un vero Campione dei Numeri!',
            instrAdaptTitle: 'Difficoltà Adattiva',
            instrAdaptText: 'Il gioco <strong>si adatta alla tua abilità</strong>! Migliorando, le sfide diventano più difficili con numeri più vicini, cifre e persino problemi di addizione.',
            instrPrev: '← Precedente',
            instrNext: 'Avanti →',
            instrDone: 'Capito! ✓',

            // Controls
            toggleSound: 'Attiva/Disattiva Suono',
            toggleMusic: 'Attiva/Disattiva Musica',
            howToPlay: 'Come si gioca',
            fullscreen: 'Schermo intero',

            // Auth
            profileTitle: 'Conserva i tuoi punteggi',
            profileSub: 'Scegli un nome e questo browser ricordera\u0300 i tuoi risultati. Niente viene inviato online e non c\u2019e\u0300 nessun account.',
            usernameLabel: 'Nome giocatore',
            saveScoresBtn: 'Salva i punteggi con questo nome',
            guestBtn: '\u25b6 Gioca ora',
            logoutBtn: 'Esci',
            scoreHistory: 'Cronologia Punteggi',
            noScores: 'Nessun punteggio ancora. Gioca una partita!',
            welcomeBack: 'Bentornato,',
        },

        en: {
            // Title screen
            gameTitle: 'The Number Race',
            gameSubtitle: 'La Gara dei Numeri',
            gameDesc: 'A neuroscience-based educational game for numerical cognition',
            playBtn: '▶ Play Game',
            tutorialBtn: '📖 How to Play',
            levelLabel: 'Level:',
            levelBase: 'Base (1-9)',
            levelAdvanced: 'Advanced (+/-)',
            creditsLine: 'Originally by A. Wilson & S. Dehaene (INSERM-CEA) · Web version by CCNL, Univ. of Padova',

            // Theme choice
            chooseWorld: 'Choose Your World',
            chooseWorldSub: 'Select the environment for your adventure',
            underwaterWorld: 'Underwater World',
            jungleWorld: 'Jungle World',

            // Character choice
            chooseChar: 'Choose Your Character',
            chooseCharSub: 'Pick your racer for the number race!',

            // Game screen
            promptMore: 'Which side has <strong>more</strong>? Choose quickly!',
            squareAbbr: 'Sq',
            turnLabel: 'Turn',
            boardBtn: '📋 Board',
            vsLabel: 'VS',

            // Feedback
            correct: '✓ Correct!',
            correctSquares: '✓ Correct! +{n} squares',
            tryAgain: '✗ Try again!',

            // Board screen
            boardTitle: 'Race Board',
            youLabel: 'You',
            opponentLabel: 'Opponent',
            trapLabel: '⚠ Trap',
            backToRace: '← Back to Race',

            // Reward screen
            rescuedAnimal: '🏆 You rescued an animal!',
            animalsRescued: 'Animals rescued:',
            continueRacing: 'Continue Racing →',

            // Game over
            youWin: '🎉 You Win!',
            gameOver: '😅 Game Over!',
            yourPosition: 'Your Position',
            opponent: 'Opponent',
            accuracy: 'Accuracy',
            rescued: 'Rescued',
            playAgain: '🔄 Play Again',
            mainMenu: '🏠 Main Menu',
            creditsFooter: 'Original game by A. Wilson, S. Dehaene & colleagues (INSERM-CEA)',
            creditsFooter2: 'Web adaptation · CCNL, University of Padova',

            // Instructions
            instrGoalTitle: 'The Goal',
            instrGoalText: 'Race your character to the finish line by <strong>choosing the side with more</strong>! Compare numbers shown as dots, digits, or addition problems.',
            instrChooseTitle: 'How to Choose',
            instrChooseText: 'Click or tap the <strong>left or right side</strong> — or press <strong>← / →</strong> arrow keys. Pick the side with the <em>bigger number</em> to advance!',
            instrMoveTitle: 'Movement',
            instrMoveText: 'Correct answer: you move forward by the <strong>bigger number</strong>, opponent by the smaller. Wrong answer: opponent moves forward instead!',
            instrTrapTitle: 'Watch Out for Traps!',
            instrTrapText: 'Some squares are <strong>traps</strong>! Landing on one sends you back. Keep an eye on the board!',
            instrRescueTitle: 'Rescue Animals',
            instrRescueText: 'As you progress, you\'ll <strong>rescue trapped animals</strong> — collect all 7 to become a true Number Champion!',
            instrAdaptTitle: 'Adaptive Difficulty',
            instrAdaptText: 'The game <strong>adapts to your skill</strong>! As you improve, challenges get harder with closer numbers, digits, and even addition problems.',
            instrPrev: '← Previous',
            instrNext: 'Next →',
            instrDone: 'Got it! ✓',

            // Controls
            toggleSound: 'Toggle Sound',
            toggleMusic: 'Toggle Music',
            howToPlay: 'How to Play',
            fullscreen: 'Fullscreen',

            // Auth
            profileTitle: 'Keep your scores',
            profileSub: 'Pick a name and this browser will remember your results. Nothing is sent anywhere and there is no account.',
            usernameLabel: 'Player name',
            saveScoresBtn: 'Save scores under this name',
            guestBtn: '\u25b6 Play now',
            logoutBtn: 'Sign Out',
            scoreHistory: 'Score History',
            noScores: 'No scores yet. Play a game!',
            welcomeBack: 'Welcome back,',
        }
    },

    // Get a translated string
    t(key) {
        return this.strings[this.currentLang]?.[key] || this.strings['en']?.[key] || key;
    },

    // Set the language
    setLang(lang) {
        if (this.strings[lang]) {
            this.currentLang = lang;
            // Persist preference
            try { localStorage.setItem('gara_lang', lang); } catch(e) {}
        }
    },

    // Initialize from stored preference
    init() {
        try {
            const stored = localStorage.getItem('gara_lang');
            if (stored && this.strings[stored]) this.currentLang = stored;
        } catch(e) {}
    },

    // Get available languages
    getLanguages() {
        return [
            { code: 'it', label: 'Italiano', flag: 'IT' },
            { code: 'en', label: 'English', flag: 'EN' }
        ];
    }
};

// Auto-initialize
GARA_I18N.init();
