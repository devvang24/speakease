console.log('preload.js loaded');
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  copyDummyTextAndPaste: (dummyText) => {
    console.log('preload: copyDummyTextAndPaste called');
    ipcRenderer.send('send-clipboard-content', dummyText);
    console.log('preload: IPC sent with dummyText');
  },
  startWhisperSTT: () => {
    console.log('preload: startWhisperSTT called');
    ipcRenderer.send('start-whisper-stt');
  },
  setMicrophone: (deviceId) => ipcRenderer.send('set-microphone', deviceId),
  setLanguage: (language) => ipcRenderer.send('set-language', language),
  setHotkey: (hotkey) => ipcRenderer.send('set-hotkey', hotkey),
  setOutputFormat: (format) => ipcRenderer.send('set-output-format', format),
  configureEngine: () => ipcRenderer.send('configure-engine'),
  navigateToHome: () => ipcRenderer.send('navigate-to-home')
}); 