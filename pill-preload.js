const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openMain: () => ipcRenderer.send('open-main'),
  onRecordingStatusChange: (callback) => ipcRenderer.on('recording-status-change', (_, isRecording) => callback(isRecording)),
  onApiKeyStatus: (callback) => ipcRenderer.on('api-key-status', (_, configured) => callback(configured))
}); 