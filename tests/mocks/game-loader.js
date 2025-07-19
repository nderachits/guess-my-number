const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load and modify the game.js file to make it testable
function loadGame() {
  const gameCode = fs.readFileSync(path.join(__dirname, '../../game.js'), 'utf8');
  
  // Remove the automatic instantiation at the end of the file
  const modifiedCode = gameCode.replace(
    /document\.addEventListener\('DOMContentLoaded'[\s\S]*?\}\);?\s*$/,
    ''
  );
  
  // Create a context with necessary globals
  const context = {
    window: global,
    document: global.document,
    navigator: global.navigator,
    SpeechRecognition: global.SpeechRecognition,
    webkitSpeechRecognition: global.webkitSpeechRecognition,
    SpeechSynthesisUtterance: global.SpeechSynthesisUtterance,
    speechSynthesis: global.speechSynthesis,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    VoiceGuessGame: null
  };
  
  // Execute the modified code in the context
  vm.createContext(context);
  vm.runInContext(modifiedCode, context);
  
  return VoiceGuessGame;
}

module.exports = { loadGame };