/**
 * @jest-environment jsdom
 */

const { loadGame } = require('../mocks/game-loader');
const VoiceGuessGame = loadGame();

describe('Reverse Game Binary Search Algorithm', () => {
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

  describe('Binary search guessing strategy', () => {
    test('should start with middle value for range 1-100', () => {
      // Mock speak to avoid audio during tests
      const originalSpeak = game.speak;
      game.speak = jest.fn();
      
      game.maxNumber = 100;
      game.startReverseGuessing();
      
      expect(game.currentGuess).toBe(50); // (1 + 100) / 2 = 50.5 -> 50
      expect(game.lowBound).toBe(1);
      expect(game.highBound).toBe(100);
      expect(game.attempts).toBe(1);
      
      game.speak = originalSpeak;
    });

    test('should start with middle value for range 1-50', () => {
      // Mock speak to avoid audio during tests
      const originalSpeak = game.speak;
      game.speak = jest.fn();
      
      game.maxNumber = 50;
      game.startReverseGuessing();
      
      expect(game.currentGuess).toBe(25); // (1 + 50) / 2 = 25.5 -> 25
      expect(game.lowBound).toBe(1);
      expect(game.highBound).toBe(50);
      expect(game.attempts).toBe(1);
      
      game.speak = originalSpeak;
    });

    test('should adjust high bound when guess is too high', () => {
      const originalSpeak = game.speak;
      game.speak = jest.fn();
      
      game.maxNumber = 100;
      game.startReverseGuessing(); // First guess: 50
      
      const originalMakeGuess = game.makeGuess;
      const mockMakeGuess = jest.fn();
      game.makeGuess = mockMakeGuess;
      
      game.processPlayerFeedback('too_high');
      
      expect(game.highBound).toBe(49); // 50 - 1
      expect(game.lowBound).toBe(1);
      expect(mockMakeGuess).toHaveBeenCalled();
      
      game.makeGuess = originalMakeGuess;
      game.speak = originalSpeak;
    });

    test('should adjust low bound when guess is too low', () => {
      const originalSpeak = game.speak;
      game.speak = jest.fn();
      
      game.maxNumber = 100;
      game.startReverseGuessing(); // First guess: 50
      
      const originalMakeGuess = game.makeGuess;
      const mockMakeGuess = jest.fn();
      game.makeGuess = mockMakeGuess;
      
      game.processPlayerFeedback('too_low');
      
      expect(game.lowBound).toBe(51); // 50 + 1
      expect(game.highBound).toBe(100);
      expect(mockMakeGuess).toHaveBeenCalled();
      
      game.makeGuess = originalMakeGuess;
      game.speak = originalSpeak;
    });
  });

  describe('Optimal guessing sequence', () => {
    test('should find number 25 in optimal steps for range 1-100', () => {
      game.maxNumber = 100;
      game.startReverseGuessing();
      
      // Simulate the optimal binary search for target number 25
      const guesses = [];
      const originalSpeak = game.speak;
      game.speak = jest.fn(); // Mock speak to avoid audio
      
      // Step 1: Guess 50 (too high)
      expect(game.currentGuess).toBe(50);
      guesses.push(game.currentGuess);
      game.processPlayerFeedback('too_high');
      
      // Step 2: Guess 25 (correct!)
      expect(game.currentGuess).toBe(25); // (1 + 49) / 2 = 25
      guesses.push(game.currentGuess);
      
      expect(guesses).toEqual([50, 25]);
      expect(game.attempts).toBe(2);
      
      game.speak = originalSpeak;
    });

    test('should find number 75 in optimal steps for range 1-100', () => {
      game.maxNumber = 100;
      game.startReverseGuessing();
      
      const guesses = [];
      const originalSpeak = game.speak;
      game.speak = jest.fn();
      
      // Step 1: Guess 50 (too low)
      expect(game.currentGuess).toBe(50);
      guesses.push(game.currentGuess);
      game.processPlayerFeedback('too_low');
      
      // Step 2: Guess 75 (correct!)
      expect(game.currentGuess).toBe(75); // (51 + 100) / 2 = 75.5 -> 75
      guesses.push(game.currentGuess);
      
      expect(guesses).toEqual([50, 75]);
      expect(game.attempts).toBe(2);
      
      game.speak = originalSpeak;
    });

    test('should find number 1 efficiently', () => {
      game.maxNumber = 100;
      game.startReverseGuessing();
      
      const guesses = [];
      const originalSpeak = game.speak;
      game.speak = jest.fn();
      
      // Step 1: Guess 50 (too high)
      guesses.push(game.currentGuess); // 50
      game.processPlayerFeedback('too_high');
      
      // Step 2: Guess 25 (too high) - range is now 1-49
      guesses.push(game.currentGuess); // 25
      game.processPlayerFeedback('too_high');
      
      // Step 3: Guess 12 (too high) - range is now 1-24
      guesses.push(game.currentGuess); // 12
      game.processPlayerFeedback('too_high');
      
      // Step 4: Guess 6 (too high) - range is now 1-11
      guesses.push(game.currentGuess); // 6
      game.processPlayerFeedback('too_high');
      
      // Step 5: Guess 3 (too high) - range is now 1-5
      guesses.push(game.currentGuess); // 3
      game.processPlayerFeedback('too_high');
      
      // Step 6: Guess 1 (correct!) - range is now 1-2, midpoint is 1
      guesses.push(game.currentGuess); // 1
      
      expect(guesses).toEqual([50, 25, 12, 6, 3, 1]);
      expect(game.attempts).toBe(6); // Should be at most log2(100) ≈ 7 steps
      
      game.speak = originalSpeak;
    });

    test('should find number 100 efficiently', () => {
      game.maxNumber = 100;
      game.startReverseGuessing();
      
      const guesses = [];
      const originalSpeak = game.speak;
      game.speak = jest.fn();
      
      // Keep going "too low" until we reach 100
      while (game.currentGuess < 100) {
        guesses.push(game.currentGuess);
        game.processPlayerFeedback('too_low');
      }
      
      guesses.push(game.currentGuess); // Final guess should be 100
      
      expect(game.currentGuess).toBe(100);
      expect(game.attempts).toBeLessThanOrEqual(7); // Should be at most log2(100) ≈ 7 steps
      
      game.speak = originalSpeak;
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle impossible scenario (bounds cross)', () => {
      game.maxNumber = 100;
      game.startReverseGuessing();
      
      const originalSpeak = game.speak;
      const mockSpeak = jest.fn();
      game.speak = mockSpeak;
      
      const originalStartReverseGuessing = game.startReverseGuessing;
      const mockStartReverseGuessing = jest.fn();
      game.startReverseGuessing = mockStartReverseGuessing;
      
      // Force impossible scenario
      game.lowBound = 50;
      game.highBound = 49; // Invalid: low > high
      game.currentGuess = 50;
      
      game.processPlayerFeedback('too_high');
      
      // Should detect invalid state and restart
      expect(mockSpeak).toHaveBeenCalledWith("Wait, I think there might be a mistake. Let's start over!");
      expect(mockStartReverseGuessing).toHaveBeenCalled();
      
      game.speak = originalSpeak;
      game.startReverseGuessing = originalStartReverseGuessing;
    });

    test('should handle single number range correctly', () => {
      game.maxNumber = 1;
      game.startReverseGuessing();
      
      expect(game.currentGuess).toBe(1);
      expect(game.lowBound).toBe(1);
      expect(game.highBound).toBe(1);
      expect(game.attempts).toBe(1);
    });

    test('should handle small ranges efficiently', () => {
      game.maxNumber = 10;
      game.startReverseGuessing();
      
      expect(game.currentGuess).toBe(5); // (1 + 10) / 2 = 5.5 -> 5
      expect(game.lowBound).toBe(1);
      expect(game.highBound).toBe(10);
      
      // Test narrowing down
      const originalSpeak = game.speak;
      game.speak = jest.fn();
      
      game.processPlayerFeedback('too_low'); // Target > 5
      expect(game.currentGuess).toBe(8); // (6 + 10) / 2 = 8
      expect(game.lowBound).toBe(6);
      expect(game.highBound).toBe(10);
      
      game.speak = originalSpeak;
    });
  });

  describe('Algorithm efficiency', () => {
    test('should never exceed log2(n) + 1 guesses for any target', () => {
      const maxNumber = 100;
      const maxExpectedGuesses = Math.ceil(Math.log2(maxNumber)) + 1; // ~7 for 100
      
      // Test several target numbers
      const targetsToTest = [1, 7, 23, 42, 64, 87, 100];
      
      targetsToTest.forEach(target => {
        game = new VoiceGuessGame(); // Fresh instance
        game.maxNumber = maxNumber;
        game.startReverseGuessing();
        
        const originalSpeak = game.speak;
        game.speak = jest.fn();
        
        // Simulate optimal player responses for the target
        while (game.currentGuess !== target && game.attempts < 20) { // Safety limit
          if (game.currentGuess > target) {
            game.processPlayerFeedback('too_high');
          } else {
            game.processPlayerFeedback('too_low');
          }
        }
        
        expect(game.currentGuess).toBe(target);
        expect(game.attempts).toBeLessThanOrEqual(maxExpectedGuesses);
        
        game.speak = originalSpeak;
      });
    });
  });
});