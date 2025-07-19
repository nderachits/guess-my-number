/**
 * @jest-environment jsdom
 */

const { loadGame } = require('../mocks/game-loader');
const VoiceGuessGame = loadGame();

describe('Game State Management', () => {
  let game;

  beforeEach(async () => {
    game = new VoiceGuessGame();
    await new Promise(resolve => setTimeout(resolve, 50)); // Wait for async init
  });

  afterEach(() => {
    if (game.recognition) {
      game.recognition.stop();
    }
  });

  describe('Initial state', () => {
    test('should initialize with correct default values', () => {
      expect(game.targetNumber).toBe(null);
      expect(game.attempts).toBe(0);
      expect(game.gameState).toBe('waiting');
      expect(game.isListening).toBe(false);
      expect(game.continuousMode).toBe(false);
      expect(game.isSpeaking).toBe(true);
      expect(game.maxNumber).toBe(100);
    });

    test('should have required DOM elements', () => {
      expect(game.micButton).toBeTruthy();
      expect(game.micStatus).toBeTruthy();
      expect(game.gameMessage).toBeTruthy();
      expect(game.attemptsCounter).toBeTruthy();
      expect(game.attemptsCount).toBeTruthy();
      expect(game.listeningIndicator).toBeTruthy();
      expect(game.newGameBtn).toBeTruthy();
    });
  });

  describe('State transitions', () => {
    test('should transition from waiting to setup when continuous mode activated', () => {
      expect(game.gameState).toBe('waiting');
      
      game.toggleListening();
      
      // After toggleListening, should be in continuous mode but state changes in callback
      expect(game.continuousMode).toBe(true);
    });

    test('should handle setup to playing transition', () => {
      game.gameState = 'setup';
      game.maxNumber = 50;
      
      game.startNewGame();
      
      expect(game.gameState).toBe('playing');
      expect(game.targetNumber).toBeGreaterThanOrEqual(1);
      expect(game.targetNumber).toBeLessThanOrEqual(50);
      expect(game.attempts).toBe(0);
    });

    test('should handle playing to won transition', () => {
      game.gameState = 'playing';
      game.targetNumber = 50;
      game.attempts = 0;
      
      game.processGuess(50);
      
      expect(game.gameState).toBe('won');
      expect(game.attempts).toBe(1);
    });
  });

  describe('Game setup', () => {
    test('should set max number and start new game', () => {
      game.gameState = 'setup';
      game.maxNumber = 100;
      
      const originalStartNewGame = game.startNewGame;
      const mockStartNewGame = jest.fn();
      game.startNewGame = mockStartNewGame;
      
      game.processVoiceInput('fifty');
      
      expect(game.maxNumber).toBe(50);
      expect(mockStartNewGame).toHaveBeenCalled();
      
      // Restore original method
      game.startNewGame = originalStartNewGame;
    });

    test('should reject invalid max numbers', () => {
      game.gameState = 'setup';
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      game.processVoiceInput('five'); // Too small (< 10)
      
      expect(mockSpeak).toHaveBeenCalledWith(expect.stringContaining('between 10 and 1000'));
      expect(game.gameState).toBe('setup'); // Should stay in setup
      
      game.speak = originalSpeak;
    });
  });

  describe('Game playing', () => {
    beforeEach(() => {
      game.gameState = 'playing';
      game.targetNumber = 50;
      game.maxNumber = 100;
      game.attempts = 0;
    });

    test('should process correct guess', () => {
      const originalHandleCorrectGuess = game.handleCorrectGuess;
      const mockHandleCorrectGuess = jest.fn();
      game.handleCorrectGuess = mockHandleCorrectGuess;
      
      game.processGuess(50);
      
      expect(game.attempts).toBe(1);
      expect(mockHandleCorrectGuess).toHaveBeenCalled();
      
      game.handleCorrectGuess = originalHandleCorrectGuess;
    });

    test('should process incorrect guess - too low', () => {
      const originalHandleIncorrectGuess = game.handleIncorrectGuess;
      const mockHandleIncorrectGuess = jest.fn();
      game.handleIncorrectGuess = mockHandleIncorrectGuess;
      
      game.processGuess(25);
      
      expect(game.attempts).toBe(1);
      expect(mockHandleIncorrectGuess).toHaveBeenCalledWith(25, 'higher');
      
      game.handleIncorrectGuess = originalHandleIncorrectGuess;
    });

    test('should process incorrect guess - too high', () => {
      const originalHandleIncorrectGuess = game.handleIncorrectGuess;
      const mockHandleIncorrectGuess = jest.fn();
      game.handleIncorrectGuess = mockHandleIncorrectGuess;
      
      game.processGuess(75);
      
      expect(game.attempts).toBe(1);
      expect(mockHandleIncorrectGuess).toHaveBeenCalledWith(75, 'lower');
      
      game.handleIncorrectGuess = originalHandleIncorrectGuess;
    });

    test('should reject out-of-range guesses', () => {
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      game.processVoiceInput('150'); // Too high for maxNumber=100
      
      expect(mockSpeak).toHaveBeenCalledWith(expect.stringContaining('between 1 and 100'));
      expect(game.attempts).toBe(0); // Should not increment attempts
      
      game.speak = originalSpeak;
    });
  });

  describe('Game won state', () => {
    beforeEach(() => {
      game.gameState = 'won';
      game.continuousMode = true;
    });

    test('should restart game when user says yes', () => {
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      game.processVoiceInput('yes');
      
      expect(game.gameState).toBe('game-selection');
      expect(mockSpeak).toHaveBeenCalledWith(expect.stringContaining('Which game would you like to play next'));
      
      game.speak = originalSpeak;
    });

    test('should end continuous mode when user says no', () => {
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      game.processVoiceInput('no');
      
      expect(game.continuousMode).toBe(false);
      expect(game.gameState).toBe('waiting');
      expect(mockSpeak).toHaveBeenCalledWith(expect.stringContaining('Thanks for playing'));
      
      game.speak = originalSpeak;
    });
  });
});