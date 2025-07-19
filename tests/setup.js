// Mock Web APIs that don't exist in jsdom/Node.js environment

// Mock SpeechRecognition
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-US';
    this.onstart = null;
    this.onend = null;
    this.onresult = null;
    this.onerror = null;
    this._isStarted = false;
  }

  start() {
    if (this._isStarted) {
      throw new Error('InvalidStateError');
    }
    this._isStarted = true;
    if (this.onstart) {
      setTimeout(() => this.onstart(), 0);
    }
  }

  stop() {
    if (!this._isStarted) return;
    this._isStarted = false;
    if (this.onend) {
      setTimeout(() => this.onend(), 0);
    }
  }

  // Test helper methods
  _simulateResult(transcript, isFinal = true) {
    if (this.onresult && this._isStarted) {
      const event = {
        results: [{
          0: { transcript },
          isFinal
        }]
      };
      this.onresult(event);
    }
  }

  _simulateError(error = 'no-speech') {
    if (this.onerror && this._isStarted) {
      this.onerror({ error });
    }
  }
}

global.SpeechRecognition = MockSpeechRecognition;
global.webkitSpeechRecognition = MockSpeechRecognition;

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.voice = null;
    this.volume = 1;
    this.rate = 1;
    this.pitch = 1;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
    this.onpause = null;
    this.onresume = null;
    this.onmark = null;
    this.onboundary = null;
  }
}

// Mock SpeechSynthesis
class MockSpeechSynthesis {
  constructor() {
    this.pending = false;
    this.speaking = false;
    this.paused = false;
    this._queue = [];
    this._voices = [
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Alex', lang: 'en-US' },
      { name: 'Female Voice', lang: 'en-US' }
    ];
  }

  speak(utterance) {
    this.pending = true;
    this._queue.push(utterance);
    
    setTimeout(() => {
      this.pending = false;
      this.speaking = true;
      
      if (utterance.onstart) {
        utterance.onstart();
      }
      
      // Simulate speech duration
      setTimeout(() => {
        this.speaking = false;
        if (utterance.onend) {
          utterance.onend();
        }
        this._queue.shift();
      }, 100); // Quick for tests
    }, 10);
  }

  cancel() {
    this.pending = false;
    this.speaking = false;
    this._queue.forEach(utterance => {
      if (utterance.onerror) {
        utterance.onerror();
      }
    });
    this._queue = [];
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  getVoices() {
    return this._voices;
  }
}

global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
global.speechSynthesis = new MockSpeechSynthesis();

// Mock getUserMedia
const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: () => [{
    stop: jest.fn()
  }]
});

global.navigator = {
  ...global.navigator,
  mediaDevices: {
    getUserMedia: mockGetUserMedia
  },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Mock DOM elements and methods
Object.defineProperty(global.HTMLElement.prototype, 'classList', {
  value: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  writable: true
});

// Setup DOM for tests
beforeEach(() => {
  document.body.innerHTML = `
    <div class="container">
      <main>
        <div class="game-area">
          <div class="status-display">
            <div id="game-message" class="message">Test message</div>
            <div id="attempts-counter" class="attempts hidden">
              Attempts: <span id="attempts-count">0</span>
            </div>
          </div>
          <div class="controls">
            <button id="mic-button" class="mic-button">
              <div class="mic-icon">🎤</div>
              <div class="mic-status" id="mic-status">Click to Start Listening</div>
            </button>
          </div>
          <div class="visual-feedback">
            <div id="listening-indicator" class="listening-indicator hidden">
              <div class="pulse"></div>
              <div class="text">Listening...</div>
            </div>
          </div>
          <div class="game-controls">
            <button id="new-game-btn" class="action-button hidden">🎮 New Game</button>
          </div>
        </div>
      </main>
    </div>
  `;
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  // Reset speech synthesis state
  global.speechSynthesis.cancel();
});