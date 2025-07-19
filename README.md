# Voice Guess My Number Game

A kid-friendly voice-controlled number guessing game that works like Amazon Alexa's version, built with vanilla JavaScript and Web Speech API.

## Features

🎤 **Voice Recognition** - Uses Web Speech API for speech-to-text  
🗣️ **Text-to-Speech** - Game responds with encouraging voice messages  
🎯 **Number Guessing** - Classic 1-100 number guessing game  
👶 **Kid-Friendly** - Colorful UI with animations and simple controls  
🎮 **Game States** - Start, playing, won, and restart functionality  
🛡️ **Error Handling** - Graceful handling of speech recognition issues  

## How to Play

1. Open `index.html` in a modern web browser (Chrome, Safari, Edge)
2. Allow microphone permissions when prompted
3. Click the microphone button and say "Start"
4. The game will think of a number between 1 and 100
5. Say your guess out loud
6. Listen for hints: "too high", "too low", or "correct!"
7. Try to guess in as few attempts as possible!

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Safari
- ✅ Edge
- ❌ Firefox (limited Web Speech API support)

## Technical Details

- **No server required** - runs entirely in the browser
- **Privacy-friendly** - all speech processing happens locally
- **Responsive design** - works on desktop and mobile
- **Accessibility** - ARIA labels and keyboard navigation

## Files

- `index.html` - Main game interface
- `styles.css` - Kid-friendly styling and animations  
- `game.js` - Game logic and speech handling
- `PLAN.txt` - Original implementation plan

## Development

The game is built with vanilla HTML, CSS, and JavaScript. No build process or dependencies required - just open `index.html` in a browser!

## Voice Commands

- **"Start"** or **"Begin"** - Start a new game
- **Numbers 1-100** - Make a guess (supports both digits and words)
- **"Yes"** or **"Play again"** - Start another game after winning
- **"No"** or **"Stop"** - End the game

Enjoy playing! 🎉