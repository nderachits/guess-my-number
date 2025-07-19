class VoiceGuessGame {
    constructor() {
        this.targetNumber = null;
        this.attempts = 0;
        this.gameState = 'waiting'; // waiting, game-selection, setup, playing, won, reverse-setup, reverse-playing
        this.isListening = false;
        this.continuousMode = false;
        this.listeningTimeout = null;
        this.maxNumber = 100;
        this.isSpeaking = false;
        this.gameMode = 'classic'; // 'classic' or 'reverse'
        
        this.initializeElements();
        this.initializeSpeech();
        this.setupEventListeners();
        
        this.speak("Welcome to Guess My Number! Click the microphone to start playing and choose your number range!");
    }
    
    initializeElements() {
        this.micButton = document.getElementById('mic-button');
        this.micStatus = document.getElementById('mic-status');
        this.gameMessage = document.getElementById('game-message');
        this.attemptsCounter = document.getElementById('attempts-counter');
        this.attemptsCount = document.getElementById('attempts-count');
        this.listeningIndicator = document.getElementById('listening-indicator');
        this.newGameBtn = document.getElementById('new-game-btn');
    }
    
    async initializeSpeech() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError("Sorry, your browser doesn't support speech recognition. Please use Chrome, Safari, or Edge.");
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => this.onListeningStart();
        this.recognition.onend = () => this.onListeningEnd();
        this.recognition.onresult = (event) => this.onSpeechResult(event);
        this.recognition.onerror = (event) => this.onSpeechError(event);
        
        this.synthesis = window.speechSynthesis;
    }
    
    getOptimizedMicrophoneConstraints() {
        const isChrome = navigator.userAgent.includes('Chrome');
        const isFirefox = navigator.userAgent.includes('Firefox');
        const isSafari = navigator.userAgent.includes('Safari') && !isChrome;
        
        let constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
        
        // Chrome-specific optimizations
        if (isChrome) {
            constraints.audio.googEchoCancellation = true;
            constraints.audio.googAutoGainControl = true;
            constraints.audio.googNoiseSuppression = true;
            constraints.audio.googHighpassFilter = true;
            constraints.audio.googEchoCancellationType = 'browser';
        }
        
        // Firefox has aggressive noise suppression by default
        if (isFirefox) {
            // Keep noise suppression enabled for Firefox as it works well
            constraints.audio.noiseSuppression = true;
        }
        
        return constraints;
    }
    
    updateSpeakingVisuals(isSpeaking) {
        if (isSpeaking) {
            this.micButton.classList.add('speaking');
            this.micButton.classList.remove('listening');
            this.micStatus.textContent = 'Speaking...';
        } else {
            this.micButton.classList.remove('speaking');
            if (this.continuousMode) {
                this.micStatus.textContent = 'Always Listening';
            }
        }
    }
    
    setupEventListeners() {
        this.micButton.addEventListener('click', () => this.toggleListening());
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
    }
    
    speak(text, callback = null) {
        // Set speaking state to filter out speech results (but keep recognition running)
        this.isSpeaking = true;
        this.updateSpeakingVisuals(true);
        
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        const voices = this.synthesis.getVoices();
        const femaleVoice = voices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('Karen') || 
            voice.name.includes('Samantha')
        );
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateSpeakingVisuals(false);
            if (callback) callback();
            // Recognition keeps running - no need to restart
        };
        
        utterance.onerror = () => {
            this.isSpeaking = false;
            this.updateSpeakingVisuals(false);
            // Recognition keeps running - no need to restart
        };
        
        this.synthesis.speak(utterance);
    }
    
    toggleListening() {
        if (!this.continuousMode) {
            this.continuousMode = true;
            this.micButton.classList.add('continuous');
            this.micStatus.textContent = 'Always Listening';
            this.speak("Welcome! Which game would you like to play? Say 'Guess My Number' if you want to guess my number, or say 'I'll Guess Yours' if you want me to guess your number!", () => {
                this.gameState = 'game-selection';
                this.startListening();
            });
        }
    }
    
    startListening() {
        // Don't start listening if we're speaking or already listening
        if (!this.recognition || this.isListening || this.isSpeaking) {
            return;
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            if (error.name === 'InvalidStateError') {
                setTimeout(() => {
                    if (this.continuousMode && !this.isListening && !this.isSpeaking) {
                        this.startListening();
                    }
                }, 500);
            } else {
                this.onSpeechError({ error: 'not-allowed' });
            }
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    onListeningStart() {
        this.isListening = true;
        this.micButton.classList.add('listening');
        this.micStatus.textContent = 'Listening...';
        this.listeningIndicator.classList.remove('hidden');
    }
    
    onListeningEnd() {
        this.isListening = false;
        this.micButton.classList.remove('listening');
        
        if (this.continuousMode) {
            if (this.isSpeaking) {
                this.micStatus.textContent = 'Speaking...';
            } else {
                this.micStatus.textContent = 'Always Listening';
                // Auto-restart recognition if it stops unexpectedly (browser timeout, etc.)
                setTimeout(() => {
                    if (this.continuousMode && !this.isSpeaking && !this.isListening) {
                        this.startListening();
                    }
                }, 100); // Quick restart to maintain continuity
            }
        } else {
            this.micStatus.textContent = 'Click to Start Listening';
        }
        
        this.listeningIndicator.classList.add('hidden');
    }
    
    onSpeechResult(event) {
        const results = event.results;
        let transcript = '';
        
        for (let i = results.length - 1; i >= 0; i--) {
            if (results[i].isFinal) {
                transcript = results[i][0].transcript.toLowerCase().trim();
                break;
            }
        }
        
        if (!transcript && results.length > 0) {
            transcript = results[results.length - 1][0].transcript.toLowerCase().trim();
        }
        
        console.log('Speech result - Raw transcript:', transcript);
        console.log('Speech result - Game state:', this.gameState);
        console.log('Speech result - isSpeaking:', this.isSpeaking);
        
        // Ignore speech results if we're currently speaking (feedback prevention)
        if (this.isSpeaking) {
            console.log('Ignoring speech result - app is speaking');
            return;
        }
        if (transcript && !this.isSpeaking) {
            this.processVoiceInput(transcript);
        }
    }
    
    onSpeechError(event) {
        console.log('Speech error:', event.error);
        
        if (event.error === 'no-speech' && this.continuousMode) {
            setTimeout(() => {
                if (this.continuousMode && (this.gameState === 'playing' || this.gameState === 'won' || this.gameState === 'waiting')) {
                    this.startListening();
                }
            }, 500);
            return;
        }
        
        let errorMessage = "Sorry, I couldn't hear you clearly. Please try again!";
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = "I didn't hear anything. Please try speaking again!";
                break;
            case 'audio-capture':
                errorMessage = "I can't access your microphone. Please check your settings!";
                break;
            case 'not-allowed':
                errorMessage = "Please allow microphone access to play the game!";
                break;
            case 'network':
                errorMessage = "Network error. Please check your internet connection!";
                break;
        }
        
        this.updateMessage(errorMessage, 'error');
        this.speak(errorMessage);
    }
    
    processVoiceInput(input) {
        const cleanInput = input.replace(/[^\w\s]/g, '').toLowerCase();
        console.log('Processing input:', cleanInput, 'in state:', this.gameState);
        
        if (this.gameState === 'waiting') {
            if (cleanInput.includes('start') || cleanInput.includes('begin') || cleanInput.includes('play')) {
                this.startNewGame();
            } else {
                this.speak("Say 'start' to begin playing!");
                this.updateMessage("Say 'start' to begin playing!");
            }
            return;
        }
        
        if (this.gameState === 'game-selection') {
            const selectedGame = this.parseGameSelection(input);
            if (selectedGame === 'classic') {
                this.startClassicGame();
            } else if (selectedGame === 'reverse') {
                this.startReverseGame();
            } else {
                this.speak("Say 'Guess My Number' if you want to guess my number, or 'I'll Guess Yours' if you want me to guess your number!");
                this.updateMessage("Say 'Guess My Number' or 'I'll Guess Yours'");
            }
            return;
        }
        
        if (this.gameState === 'setup') {
            const maxNumber = this.extractNumber(cleanInput);
            if (maxNumber && maxNumber >= 10 && maxNumber <= 1000) {
                this.maxNumber = maxNumber;
                this.startNewGame();
            } else {
                this.speak("Please say a number between 10 and 1000, like 50 or 100!");
                this.updateMessage("Please say a number between 10 and 1000 for the maximum range!");
            }
            return;
        }
        
        if (this.gameState === 'playing') {
            const guess = this.extractNumber(cleanInput);
            console.log('Extracted guess:', guess);
            if (guess !== null && guess >= 1 && guess <= this.maxNumber) {
                this.processGuess(guess);
            } else {
                this.speak(`Please say a number between 1 and ${this.maxNumber}! I heard: ` + cleanInput);
                this.updateMessage(`I didn't hear a valid number. I heard: '${cleanInput}'. Please say a number between 1 and ${this.maxNumber}!`);
            }
        }
        
        if (this.gameState === 'reverse-setup') {
            const maxNumber = this.extractNumber(cleanInput);
            if (maxNumber && maxNumber >= 10 && maxNumber <= 1000) {
                this.maxNumber = maxNumber;
                this.startReverseGuessing();
            } else {
                this.speak("Please say a number between 10 and 1000, like 50 or 100!");
                this.updateMessage("Please say a number between 10 and 1000 for the maximum range!");
            }
            return;
        }
        
        if (this.gameState === 'reverse-playing') {
            const feedback = this.parseFeedback(input);
            if (feedback === 'correct') {
                this.handleCorrectFeedback();
            } else if (feedback === 'too_high' || feedback === 'too_low') {
                this.processPlayerFeedback(feedback);
            } else {
                this.speak("Please say 'correct', 'too high', or 'too low' to help me guess your number!");
                this.updateMessage("Say 'correct', 'too high', or 'too low'");
            }
            return;
        }
        
        if (this.gameState === 'won') {
            if (cleanInput.includes('yes') || cleanInput.includes('again') || cleanInput.includes('play')) {
                this.gameState = 'game-selection';
                this.speak("Great! Which game would you like to play next? Say 'Guess My Number' if you want to guess my number, or 'I'll Guess Yours' if you want me to guess your number!");
                this.updateMessage("Which game would you like to play next? Say 'Guess My Number' or 'I'll Guess Yours'!");
            } else if (cleanInput.includes('no') || cleanInput.includes('stop') || cleanInput.includes('quit')) {
                this.continuousMode = false;
                this.micButton.classList.remove('continuous');
                this.speak("Thanks for playing! Click the microphone to start listening again!");
                this.updateMessage("Thanks for playing! Click the microphone to start listening again!");
                this.gameState = 'waiting';
                this.newGameBtn.classList.add('hidden');
                this.micStatus.textContent = 'Click to Start Listening';
            }
        }
    }
    
    parseFeedback(input) {
        console.log('Parsing feedback from:', input);
        
        const cleanInput = input.replace(/[^\w\s']/g, '').toLowerCase();
        
        // Check for "correct" feedback (highest priority)
        if (cleanInput.includes('correct') ||
            (cleanInput.includes('yes') && (cleanInput.includes('correct') || cleanInput.includes('right') || cleanInput.includes('got it'))) ||
            cleanInput.includes('you got it') ||
            cleanInput.includes('thats right') ||
            cleanInput.includes('that is right') ||
            (cleanInput.includes('yes') && cleanInput.split(' ').length <= 2)) { // simple "yes"
            console.log('Detected correct feedback');
            return 'correct';
        }
        
        // Check for "too high" feedback
        if (cleanInput.includes('too high') ||
            cleanInput.includes('too big') ||
            (cleanInput.includes('high') && cleanInput.includes('too')) ||
            (cleanInput.includes('big') && cleanInput.includes('too')) ||
            cleanInput.includes('go lower') ||
            cleanInput.includes('lower') && !cleanInput.includes('go higher')) {
            console.log('Detected too high feedback');
            return 'too_high';
        }
        
        // Check for "too low" feedback  
        if (cleanInput.includes('too low') ||
            cleanInput.includes('too small') ||
            (cleanInput.includes('low') && cleanInput.includes('too')) ||
            (cleanInput.includes('small') && cleanInput.includes('too')) ||
            cleanInput.includes('go higher') ||
            (cleanInput.includes('higher') && !cleanInput.includes('no'))) {
            console.log('Detected too low feedback');
            return 'too_low';
        }
        
        // Check for simple "right" (less specific than "correct")
        if (cleanInput.includes('right') && !cleanInput.includes('not right')) {
            console.log('Detected correct feedback (right)');
            return 'correct';
        }
        
        console.log('No feedback detected');
        return null;
    }

    parseGameSelection(input) {
        console.log('Parsing game selection from:', input);
        
        const cleanInput = input.replace(/[^\w\s']/g, '').toLowerCase();
        
        // Check for reverse game patterns first (more specific)
        if (cleanInput.includes('ill guess yours') || 
            cleanInput.includes('i will guess yours') ||
            cleanInput.includes('ill guess your') ||
            cleanInput.includes('i will guess your') ||
            cleanInput.includes('let me guess') ||
            cleanInput.includes('you guess mine') ||
            cleanInput.includes('you guess my') ||
            cleanInput.includes('you try to guess') ||
            (cleanInput.includes('you') && cleanInput.includes('guess') && !cleanInput.includes('want you to guess'))) {
            console.log('Detected reverse game');
            return 'reverse';
        }
        
        // Check for classic game patterns
        if (cleanInput.includes('guess my number') || 
            cleanInput.includes('guess my') ||
            (cleanInput.includes('guess') && cleanInput.includes('my') && !cleanInput.includes('you guess my'))) {
            console.log('Detected classic game');
            return 'classic';
        }
        
        console.log('No game selection detected');
        return null;
    }

    extractNumber(input) {
        console.log('Extracting number from:', input);
        
        const words = input.split(' ');
        const numberWords = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
            'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
            'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000
        };
        
        // First try to find direct digit matches
        for (let word of words) {
            const num = parseInt(word);
            if (!isNaN(num) && num >= 1) {
                console.log('Found digit:', num);
                return num;
            }
        }
        
        // Handle "one hundred", "two hundred", etc.
        for (let i = 0; i < words.length - 1; i++) {
            const word1 = words[i].replace(/[^a-z]/g, '');
            const word2 = words[i + 1].replace(/[^a-z]/g, '');
            
            if (numberWords[word1] && word2 === 'hundred') {
                const result = numberWords[word1] * 100;
                console.log('Found hundreds:', word1, 'hundred =', result);
                return result;
            }
            
            if (word1 === 'one' && word2 === 'thousand') {
                console.log('Found one thousand');
                return 1000;
            }
        }
        
        // Then try single word matches
        for (let word of words) {
            const cleanWord = word.replace(/[^a-z]/g, '');
            if (numberWords[cleanWord]) {
                console.log('Found word number:', cleanWord, '=', numberWords[cleanWord]);
                return numberWords[cleanWord];
            }
        }
        
        // Handle compound numbers like "twenty one", "thirty five", etc.
        const twentyToNinetyNine = input.match(/(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]?(?:one|two|three|four|five|six|seven|eight|nine)?/);
        if (twentyToNinetyNine) {
            const parts = twentyToNinetyNine[0].split(/[\s-]/);
            let result = numberWords[parts[0]] || 0;
            if (parts[1] && numberWords[parts[1]]) {
                result += numberWords[parts[1]];
            }
            console.log('Found compound number:', result);
            return result;
        }
        
        console.log('No number found in:', input);
        return null;
    }
    
    startNewGame() {
        this.targetNumber = Math.floor(Math.random() * this.maxNumber) + 1;
        this.attempts = 0;
        this.gameState = 'playing';
        this.updateAttempts();
        this.attemptsCounter.classList.remove('hidden');
        this.newGameBtn.classList.add('hidden');
        
        const message = `Great! I'm thinking of a number between 1 and ${this.maxNumber}. What's your first guess?`;
        this.updateMessage(message);
        this.speak(message);
        
        console.log('Target number:', this.targetNumber, 'Range: 1 to', this.maxNumber); // For testing
    }
    
    processGuess(guess) {
        this.attempts++;
        this.updateAttempts();
        
        if (guess === this.targetNumber) {
            this.handleCorrectGuess();
        } else if (guess < this.targetNumber) {
            this.handleIncorrectGuess(guess, 'higher');
        } else {
            this.handleIncorrectGuess(guess, 'lower');
        }
    }
    
    handleCorrectGuess() {
        this.gameState = 'won';
        const message = `Congratulations! You got it! The number was ${this.targetNumber}! You guessed it in ${this.attempts} ${this.attempts === 1 ? 'attempt' : 'attempts'}! Would you like to play again?`;
        
        this.updateMessage(message, 'celebration');
        this.speak(message);
        this.newGameBtn.classList.remove('hidden');
    }
    
    handleIncorrectGuess(guess, direction) {
        const responses = {
            higher: [
                `${guess} is too low! Try a higher number!`,
                `Nope, ${guess} is too small! Go higher!`,
                `${guess} is not quite there! Think bigger!`,
                `Too low! The number is higher than ${guess}!`
            ],
            lower: [
                `${guess} is too high! Try a lower number!`,
                `Oops, ${guess} is too big! Go lower!`,
                `${guess} is not it! Think smaller!`,
                `Too high! The number is lower than ${guess}!`
            ]
        };
        
        const responseList = responses[direction];
        const message = responseList[Math.floor(Math.random() * responseList.length)];
        
        this.updateMessage(message);
        this.speak(message);
    }
    
    updateMessage(text, className = '') {
        this.gameMessage.textContent = text;
        this.gameMessage.className = 'message';
        if (className) {
            this.gameMessage.classList.add(className);
        }
    }
    
    updateAttempts() {
        this.attemptsCount.textContent = this.attempts;
    }
    
    showError(message) {
        this.updateMessage(message, 'error-state');
        this.micButton.disabled = true;
        this.micStatus.textContent = 'Error';
    }
    
    startGameSelection() {
        this.gameState = 'game-selection';
        this.updateMessage("Which game would you like to play?");
        this.speak("Which game would you like to play? Say 'Guess My Number' if you want to guess my number, or say 'I'll Guess Yours' if you want me to guess your number!");
    }
    
    startClassicGame() {
        this.gameMode = 'classic';
        this.gameState = 'setup';
        this.updateMessage("Great! What's the highest number I should pick - say a number like 50 or 100?");
        this.speak("Great! What's the highest number I should pick - say a number like 50 or 100?");
    }
    
    startReverseGame() {
        this.gameMode = 'reverse';
        this.gameState = 'reverse-setup';
        this.updateMessage("Perfect! Think of a number and I'll try to guess it. What's the highest number you might pick?");
        this.speak("Perfect! Think of a number and I'll try to guess it. What's the highest number you might pick - say a number like 50 or 100?");
    }
    
    startReverseGuessing() {
        this.lowBound = 1;
        this.highBound = this.maxNumber;
        this.attempts = 0;
        this.gameState = 'reverse-playing';
        this.attemptsCounter.classList.remove('hidden');
        this.newGameBtn.classList.add('hidden');
        
        this.makeGuess();
    }
    
    makeGuess() {
        this.currentGuess = Math.floor((this.lowBound + this.highBound) / 2);
        this.attempts++;
        this.updateAttempts();
        
        const message = `Is your number ${this.currentGuess}? Say 'correct' if I got it, 'too high' if my guess is too high, or 'too low' if my guess is too low.`;
        this.updateMessage(message);
        this.speak(message);
        
        console.log('App guess:', this.currentGuess, 'Range:', this.lowBound, 'to', this.highBound);
    }
    
    processPlayerFeedback(feedback) {
        if (feedback === 'too_high') {
            this.highBound = this.currentGuess - 1;
        } else if (feedback === 'too_low') {
            this.lowBound = this.currentGuess + 1;
        }
        
        if (this.lowBound > this.highBound) {
            this.speak("Wait, I think there might be a mistake. Let's start over!");
            this.startReverseGuessing();
            return;
        }
        
        this.makeGuess();
    }
    
    handleCorrectFeedback() {
        this.gameState = 'won';
        const message = `Yes! I guessed your number ${this.currentGuess} in ${this.attempts} ${this.attempts === 1 ? 'attempt' : 'attempts'}! Would you like to play again?`;
        
        this.updateMessage(message, 'celebration');
        this.speak(message);
        this.newGameBtn.classList.remove('hidden');
    }
}
window.VoiceGuessGame = VoiceGuessGame;

document.addEventListener('DOMContentLoaded', () => {
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
            new VoiceGuessGame();
        };
        
        if (speechSynthesis.getVoices().length > 0) {
            new VoiceGuessGame();
        }
    } else {
        document.getElementById('game-message').textContent = 'Sorry, your browser does not support text-to-speech.';
    }
});
