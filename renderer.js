// renderer.js

console.log('renderer.js loaded');

// 1. Find the button
const injectBtn = document.getElementById('injectBtn');
console.log('injectBtn:', injectBtn);

if (injectBtn) {
  injectBtn.addEventListener('click', () => {
    console.log('Inject button clicked');
    // 2. Your 100-word (or so) text
    const dummyText =  
      "This is a sample 100-word paragraph that will be copied to the clipboard and pasted " +
      "wherever your cursor is currently positioned. It's a basic test to demonstrate how " +
      "NodeKeySender works along with clipboardy (or Electron's clipboard) in an Electron app. " +
      "No need to use nut.js or other libraries—just click the button, and this paragraph should " +
      "appear instantly at your cursor location in any focused application.";
    
    try {
      console.log('About to call electronAPI.copyDummyTextAndPaste');
      window.electronAPI.copyDummyTextAndPaste(dummyText);
      console.log('electronAPI.copyDummyTextAndPaste called');
    } catch (err) {
      console.error('Error calling electronAPI.copyDummyTextAndPaste:', err);
    }
  });
} else {
  console.error('injectBtn not found in DOM');
}

const recordBtn = document.getElementById('recordBtn');
console.log('recordBtn:', recordBtn);
if (recordBtn) {
  recordBtn.addEventListener('click', () => {
    console.log('Record (Whisper STT) button clicked');
    window.electronAPI.startWhisperSTT();
  });
}
