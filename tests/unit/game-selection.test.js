/**
 * @jest-environment jsdom
 */

const { loadGame } = require('../mocks/game-loader');
const VoiceGuessGame = loadGame();

describe('Game Selection', () => {
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

  describe('parseGameSelection method', () => {
    test('should recognize "guess my number" variants', () => {
      expect(game.parseGameSelection('guess my number')).toBe('classic');
      expect(game.parseGameSelection('guess my number please')).toBe('classic');
      expect(game.parseGameSelection('I want to play guess my number')).toBe('classic');
      expect(game.parseGameSelection('let\'s play guess my number')).toBe('classic');
    });

    test('should recognize "I\'ll guess yours" variants', () => {
      expect(game.parseGameSelection('I\'ll guess yours')).toBe('reverse');
      expect(game.parseGameSelection('I will guess yours')).toBe('reverse');
      expect(game.parseGameSelection('I\'ll guess your number')).toBe('reverse');
      expect(game.parseGameSelection('let me guess yours')).toBe('reverse');
    });

    test('should recognize "you guess" variants', () => {
      expect(game.parseGameSelection('you guess mine')).toBe('reverse');
      expect(game.parseGameSelection('you guess my number')).toBe('reverse');
      expect(game.parseGameSelection('you try to guess')).toBe('reverse');
    });

    test('should handle case variations', () => {
      expect(game.parseGameSelection('GUESS MY NUMBER')).toBe('classic');
      expect(game.parseGameSelection('I\'LL GUESS YOURS')).toBe('reverse');
      expect(game.parseGameSelection('Guess My Number')).toBe('classic');
    });

    test('should return null for unrecognized input', () => {
      expect(game.parseGameSelection('hello world')).toBe(null);
      expect(game.parseGameSelection('something else')).toBe(null);
      expect(game.parseGameSelection('')).toBe(null);
    });

    test('should handle extra words gracefully', () => {
      expect(game.parseGameSelection('um I think I want to play guess my number')).toBe('classic');
      expect(game.parseGameSelection('well maybe I\'ll guess yours this time')).toBe('reverse');
    });
  });

  describe('Game selection flow', () => {
    test('should start in game-selection state when activated', () => {
      game.gameState = 'waiting';
      game.startGameSelection();
      
      expect(game.gameState).toBe('game-selection');
    });

    test('should process game selection input correctly', () => {
      game.gameState = 'game-selection';
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      game.processVoiceInput('guess my number');
      
      expect(game.gameMode).toBe('classic');
      expect(game.gameState).toBe('setup');
      expect(mockSpeak).toHaveBeenCalledWith(expect.stringContaining('highest number'));
      
      game.speak = originalSpeak;
    });

    test('should handle reverse game selection', () => {
      game.gameState = 'game-selection';
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      game.processVoiceInput('I\'ll guess yours');
      
      expect(game.gameMode).toBe('reverse');
      expect(game.gameState).toBe('reverse-setup');
      expect(mockSpeak).toHaveBeenCalledWith(expect.stringContaining('Think of a number'));
      
      game.speak = originalSpeak;
    });

    test('should prompt user to try again for invalid selection', () => {
      game.gameState = 'game-selection';
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      game.processVoiceInput('something invalid');
      
      expect(game.gameState).toBe('game-selection');
      expect(mockSpeak).toHaveBeenCalledWith(expect.stringContaining('Say'));
      
      game.speak = originalSpeak;
    });
  });

  describe('Game mode property', () => {
    test('should initialize gameMode property', () => {
      expect(game.gameMode).toBeDefined();
      expect(typeof game.gameMode).toBe('string');
    });

    test('should set gameMode when starting classic game', () => {
      game.startClassicGame();
      expect(game.gameMode).toBe('classic');
    });

    test('should set gameMode when starting reverse game', () => {
      game.startReverseGame();
      expect(game.gameMode).toBe('reverse');
    });
  });
});