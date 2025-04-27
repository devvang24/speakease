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
  }
}); 