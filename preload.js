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
  navigateToHome: () => ipcRenderer.send('navigate-to-home'),
  openSettings: () => ipcRenderer.send('open-settings'),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (key) => ipcRenderer.invoke('set-api-key', key),
  removeApiKey: () => ipcRenderer.invoke('remove-api-key'),
  getAutoStartStatus: () => ipcRenderer.invoke('get-auto-start'),
  toggleAutoStart: () => ipcRenderer.invoke('toggle-auto-start'),
  // Hotkey management
  getHotkeys: () => ipcRenderer.invoke('get-hotkeys'),
  setHotkey: (type, hotkey) => ipcRenderer.invoke('set-hotkey', { type, hotkey })
}); 