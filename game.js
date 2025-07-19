class VoiceGuessGame {
    constructor() {
        this.targetNumber = null;
        this.attempts = 0;
        this.gameState = 'waiting'; // waiting, playing, won
        this.isListening = false;
        this.continuousMode = false;
        this.listeningTimeout = null;
        
        this.initializeElements();
        this.initializeSpeech();
        this.setupEventListeners();
        
        this.speak("Welcome to Guess My Number! Click the microphone once to enable continuous listening, then say 'start' to begin playing!");
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
    
    initializeSpeech() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError("Sorry, your browser doesn't support speech recognition. Please use Chrome, Safari, or Edge.");
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => this.onListeningStart();
        this.recognition.onend = () => this.onListeningEnd();
        this.recognition.onresult = (event) => this.onSpeechResult(event);
        this.recognition.onerror = (event) => this.onSpeechError(event);
        
        this.synthesis = window.speechSynthesis;
    }
    
    setupEventListeners() {
        this.micButton.addEventListener('click', () => this.toggleListening());
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
    }
    
    speak(text, callback = null) {
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
            if (callback) callback();
            
            if (this.continuousMode && (this.gameState === 'playing' || this.gameState === 'won')) {
                setTimeout(() => {
                    this.startListening();
                }, 500);
            }
        };
        
        this.synthesis.speak(utterance);
    }
    
    toggleListening() {
        if (!this.continuousMode) {
            this.continuousMode = true;
            this.micButton.classList.add('continuous');
            this.micStatus.textContent = 'Always Listening';
            this.updateMessage("Great! Now I'm always listening. Say 'start' to begin!");
            this.speak("Perfect! Now I'm always listening. Say 'start' to begin playing!");
            this.startListening();
        }
    }
    
    startListening() {
        if (!this.recognition || this.isListening) {
            return;
        }
        
        if (this.listeningTimeout) {
            clearTimeout(this.listeningTimeout);
        }
        
        try {
            this.recognition.start();
            
            this.listeningTimeout = setTimeout(() => {
                if (this.isListening) {
                    this.recognition.stop();
                    setTimeout(() => {
                        if (this.continuousMode && (this.gameState === 'playing' || this.gameState === 'won' || this.gameState === 'waiting')) {
                            this.startListening();
                        }
                    }, 100);
                }
            }, 10000);
        } catch (error) {
            if (error.name === 'InvalidStateError') {
                setTimeout(() => {
                    if (this.continuousMode) {
                        this.startListening();
                    }
                }, 100);
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
            this.micStatus.textContent = 'Always Listening';
        } else {
            this.micStatus.textContent = 'Click to Start Listening';
        }
        
        this.listeningIndicator.classList.add('hidden');
        
        if (this.listeningTimeout) {
            clearTimeout(this.listeningTimeout);
            this.listeningTimeout = null;
        }
    }
    
    onSpeechResult(event) {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Heard:', transcript);
        this.processVoiceInput(transcript);
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
        
        if (this.gameState === 'waiting') {
            if (cleanInput.includes('start') || cleanInput.includes('begin') || cleanInput.includes('play')) {
                this.startNewGame();
            } else {
                this.speak("Say 'start' to begin playing!");
                this.updateMessage("Say 'start' to begin playing!");
            }
            return;
        }
        
        if (this.gameState === 'playing') {
            const guess = this.extractNumber(cleanInput);
            if (guess !== null) {
                this.processGuess(guess);
            } else {
                this.speak("Please say a number between 1 and 100!");
                this.updateMessage("I didn't hear a number. Please say a number between 1 and 100!");
            }
        }
        
        if (this.gameState === 'won') {
            if (cleanInput.includes('yes') || cleanInput.includes('again') || cleanInput.includes('play')) {
                this.startNewGame();
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
    
    extractNumber(input) {
        const words = input.split(' ');
        const numberWords = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
            'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
            'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100
        };
        
        for (let word of words) {
            const num = parseInt(word);
            if (!isNaN(num) && num >= 1 && num <= 100) {
                return num;
            }
            
            if (numberWords.hasOwnProperty(word)) {
                return numberWords[word];
            }
        }
        
        const twentyToNinetyNine = input.match(/(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]?(?:one|two|three|four|five|six|seven|eight|nine)?/);
        if (twentyToNinetyNine) {
            const parts = twentyToNinetyNine[0].split(/[\s-]/);
            let result = numberWords[parts[0]] || 0;
            if (parts[1]) {
                result += numberWords[parts[1]] || 0;
            }
            return result;
        }
        
        return null;
    }
    
    startNewGame() {
        this.targetNumber = Math.floor(Math.random() * 100) + 1;
        this.attempts = 0;
        this.gameState = 'playing';
        this.updateAttempts();
        this.attemptsCounter.classList.remove('hidden');
        this.newGameBtn.classList.add('hidden');
        
        const message = "Great! I'm thinking of a number between 1 and 100. What's your first guess?";
        this.updateMessage(message);
        this.speak(message);
        
        console.log('Target number:', this.targetNumber); // For testing
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
}

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