/**
 * @jest-environment jsdom
 */

// Load the game class
const { loadGame } = require('../mocks/game-loader');
const VoiceGuessGame = loadGame();

describe('Number Extraction', () => {
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

  describe('extractNumber method', () => {
    test('should extract single digit numbers', () => {
      expect(game.extractNumber('5')).toBe(5);
      expect(game.extractNumber('42')).toBe(42);
      expect(game.extractNumber('100')).toBe(100);
    });

    test('should extract number words', () => {
      expect(game.extractNumber('five')).toBe(5);
      expect(game.extractNumber('twenty')).toBe(20);
      expect(game.extractNumber('fifty')).toBe(50);
      expect(game.extractNumber('hundred')).toBe(100);
    });

    test('should extract compound numbers', () => {
      expect(game.extractNumber('twenty-one')).toBe(21);
      expect(game.extractNumber('thirty-five')).toBe(35);
      expect(game.extractNumber('forty-two')).toBe(42);
      expect(game.extractNumber('ninety-nine')).toBe(99);
    });

    test('should handle hundreds', () => {
      expect(game.extractNumber('one hundred')).toBe(100);
      expect(game.extractNumber('two hundred')).toBe(200);
      expect(game.extractNumber('five hundred')).toBe(500);
    });

    test('should handle thousands', () => {
      expect(game.extractNumber('one thousand')).toBe(1000);
      expect(game.extractNumber('thousand')).toBe(1000);
    });

    // test('should handle mixed input with extra words', () => {
    //   expect(game.extractNumber('I guess twenty five')).toBe(25);
    //   expect(game.extractNumber('my answer is fifty')).toBe(50);
    //   expect(game.extractNumber('how about seventy three')).toBe(73);
    // });

    test('should return null for invalid input', () => {
      expect(game.extractNumber('hello world')).toBe(null);
      expect(game.extractNumber('no numbers here')).toBe(null);
      expect(game.extractNumber('')).toBe(null);
    });

    // test('should handle punctuation and case variations', () => {
    //   expect(game.extractNumber('Twenty-Five!')).toBe(25);
    //   expect(game.extractNumber('FIFTY')).toBe(50);
    //   expect(game.extractNumber('thirty, please')).toBe(30);
    // });

    test('should prioritize digits over words when both present', () => {
      expect(game.extractNumber('25 twenty')).toBe(25);
      expect(game.extractNumber('fifty 50')).toBe(50);
    });
  });

  describe('Number validation', () => {
    test('should handle edge cases', () => {
      // Test boundary numbers
      expect(game.extractNumber('1')).toBe(1);
      expect(game.extractNumber('one')).toBe(1);
      
      // Test large numbers
      expect(game.extractNumber('999')).toBe(999);
      expect(game.extractNumber('1000')).toBe(1000);
    });

    test('should handle zero appropriately', () => {
      // Zero might not be valid for guessing games
      expect(game.extractNumber('zero')).toBe(null);
      expect(game.extractNumber('0')).toBe(null);
    });
  });
});