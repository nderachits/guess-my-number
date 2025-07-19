/**
 * @jest-environment jsdom
 */

const { loadGame } = require('../mocks/game-loader');
const VoiceGuessGame = loadGame();

describe('Player Feedback Parsing', () => {
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

  describe('parseFeedback method', () => {
    test('should recognize "correct" variants', () => {
      expect(game.parseFeedback('correct')).toBe('correct');
      expect(game.parseFeedback('yes that is correct')).toBe('correct');
      expect(game.parseFeedback('correct!')).toBe('correct');
      expect(game.parseFeedback('that is correct')).toBe('correct');
      expect(game.parseFeedback('yes correct')).toBe('correct');
      expect(game.parseFeedback('you got it')).toBe('correct');
      expect(game.parseFeedback('thats right')).toBe('correct');
      expect(game.parseFeedback('right')).toBe('correct');
      expect(game.parseFeedback('yes')).toBe('correct');
    });

    test('should recognize "too high" variants', () => {
      expect(game.parseFeedback('too high')).toBe('too_high');
      expect(game.parseFeedback('that is too high')).toBe('too_high');
      expect(game.parseFeedback('way too high')).toBe('too_high');
      expect(game.parseFeedback('nope too high')).toBe('too_high');
      expect(game.parseFeedback('too big')).toBe('too_high');
      expect(game.parseFeedback('thats too high')).toBe('too_high');
      expect(game.parseFeedback('no too high')).toBe('too_high');
      expect(game.parseFeedback('higher no lower')).toBe('too_high'); // "no, lower"
      expect(game.parseFeedback('nope go lower')).toBe('too_high');
    });

    test('should recognize "too low" variants', () => {
      expect(game.parseFeedback('too low')).toBe('too_low');
      expect(game.parseFeedback('that is too low')).toBe('too_low');
      expect(game.parseFeedback('way too low')).toBe('too_low');
      expect(game.parseFeedback('nope too low')).toBe('too_low');
      expect(game.parseFeedback('too small')).toBe('too_low');
      expect(game.parseFeedback('thats too low')).toBe('too_low');
      expect(game.parseFeedback('no too low')).toBe('too_low');
      expect(game.parseFeedback('nope go higher')).toBe('too_low');
      expect(game.parseFeedback('higher')).toBe('too_low'); // means "go higher"
    });

    test('should handle case variations', () => {
      expect(game.parseFeedback('CORRECT')).toBe('correct');
      expect(game.parseFeedback('TOO HIGH')).toBe('too_high');
      expect(game.parseFeedback('Too Low')).toBe('too_low');
      expect(game.parseFeedback('YES')).toBe('correct');
    });

    test('should return null for unrecognized feedback', () => {
      expect(game.parseFeedback('hello world')).toBe(null);
      expect(game.parseFeedback('something else')).toBe(null);
      expect(game.parseFeedback('')).toBe(null);
      expect(game.parseFeedback('maybe')).toBe(null);
    });

    test('should handle extra words gracefully', () => {
      expect(game.parseFeedback('well um that is correct I think')).toBe('correct');
      expect(game.parseFeedback('no no no that is way too high')).toBe('too_high');
      expect(game.parseFeedback('hmm I think that is too low actually')).toBe('too_low');
    });

    test('should prioritize specific feedback over general words', () => {
      // "correct" should win over "right" if both are present
      expect(game.parseFeedback('right that is correct')).toBe('correct');
      expect(game.parseFeedback('yes too high but wait no thats correct')).toBe('correct');
    });
  });

  describe('Reverse game feedback processing', () => {
    test('should process correct feedback in reverse game', () => {
      game.gameState = 'reverse-playing';
      game.gameMode = 'reverse';
      game.currentGuess = 50;
      
      const originalHandleCorrectFeedback = game.handleCorrectFeedback;
      const mockHandleCorrectFeedback = jest.fn();
      game.handleCorrectFeedback = mockHandleCorrectFeedback;
      
      game.processVoiceInput('yes that is correct');
      
      expect(mockHandleCorrectFeedback).toHaveBeenCalled();
      
      game.handleCorrectFeedback = originalHandleCorrectFeedback;
    });

    test('should process too high feedback in reverse game', () => {
      game.gameState = 'reverse-playing';
      game.gameMode = 'reverse';
      game.currentGuess = 75;
      game.lowBound = 1;
      game.highBound = 100;
      
      const originalProcessPlayerFeedback = game.processPlayerFeedback;
      const mockProcessPlayerFeedback = jest.fn();
      game.processPlayerFeedback = mockProcessPlayerFeedback;
      
      game.processVoiceInput('too high');
      
      expect(mockProcessPlayerFeedback).toHaveBeenCalledWith('too_high');
      
      game.processPlayerFeedback = originalProcessPlayerFeedback;
    });

    test('should process too low feedback in reverse game', () => {
      game.gameState = 'reverse-playing';
      game.gameMode = 'reverse';
      game.currentGuess = 25;
      game.lowBound = 1;
      game.highBound = 100;
      
      const originalProcessPlayerFeedback = game.processPlayerFeedback;
      const mockProcessPlayerFeedback = jest.fn();
      game.processPlayerFeedback = mockProcessPlayerFeedback;
      
      game.processVoiceInput('too low');
      
      expect(mockProcessPlayerFeedback).toHaveBeenCalledWith('too_low');
      
      game.processPlayerFeedback = originalProcessPlayerFeedback;
    });

    test('should handle unrecognized feedback gracefully', () => {
      game.gameState = 'reverse-playing';
      game.gameMode = 'reverse';
      
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      game.processVoiceInput('maybe probably not sure');
      
      expect(mockSpeak).toHaveBeenCalledWith(expect.stringContaining('correct'));
      
      game.speak = originalSpeak;
    });
  });
});