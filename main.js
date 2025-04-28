// main.js
console.log('main.js loaded');

const { app, BrowserWindow, ipcMain, clipboard, globalShortcut } = require('electron');
const path = require('path');
const keySender = require('node-key-sender');
const whisper = require('./whisper-transcript');

// Hot-reload (dev only)
try {
  require('electron-reloader')(module, {
    debug: true,
    watchRenderer: true
  });
  console.log('Hot-reload enabled');
} catch (_) { console.log('Hot-reload disabled'); }

function createWindow() {
  console.log('Creating main window...');
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools(); // remove in prod
  console.log('Main window created and DevTools opened');
}

const DUMMY_TEXT = "This is a sample 100-word paragraph that will be copied to the clipboard and pasted wherever your cursor is currently positioned. It's a basic test to demonstrate how NodeKeySender works along with clipboardy (or Electron's clipboard) in an Electron app. No need to use nut.js or other libraries—just click the button, and this paragraph should appear instantly at your cursor location in any focused application.";

let isRecording = false;
let micInstance = null;
let micInputStream = null;
let outputFileStream = null;
let outputFile = null;

const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const Mic = require('mic');
const fs = require('fs');

function startMicRecording() {
  outputFile = 'recording.wav';
  micInstance = Mic({
    rate: '16000',
    channels: '1',
    debug: false,
    exitOnSilence: 6
  });
  micInputStream = micInstance.getAudioStream();
  outputFileStream = fs.createWriteStream(outputFile);
  micInputStream.pipe(outputFileStream);
  micInputStream.on('error', (err) => {
    console.error('Mic error:', err);
  });
  micInstance.start();
  console.log('Global Hotkey: Recording started...');
}

function stopMicRecordingAndTranscribe() {
  if (!micInstance) return;
  micInstance.stop();
  console.log('Global Hotkey: Recording stopped.');
  outputFileStream.on('finish', async () => {
    try {
      console.log('Sending audio to Whisper...');
      const resp = await openai.audio.transcriptions.create({
        file: fs.createReadStream(outputFile),
        model: 'whisper-1'
      });
      const transcript = resp.text;
      console.log('Whisper STT transcript:', transcript);
      // Inject transcript at cursor position
      clipboard.writeText(transcript);
      console.log('Transcript copied to clipboard');
      console.log('Waiting 30ms before sending Ctrl+V to paste transcript...');
      setTimeout(async () => {
        try {
          console.log('About to send Ctrl+V using node-key-sender for transcript');
          await keySender.sendCombination(['control', 'v']);
          console.log('Transcript paste command sent');
        } catch (err) {
          console.error('Error sending paste for transcript:', err);
        }
      }, 30);
    } catch (err) {
      console.error('Whisper API error:', err.response?.data || err.message);
    } finally {
      fs.unlinkSync(outputFile);
    }
  });
}

app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();

  // Register global hotkey
  const hotkey1 = 'Control+Shift+V';
  const hotkey2 = 'Control+/';
  const hotkey3 = 'Control+;';
  const registered1 = globalShortcut.register(hotkey1, () => {
    console.log(`Global hotkey ${hotkey1} triggered!`);
    try {
      clipboard.writeText(DUMMY_TEXT);
      console.log('Clipboard write complete');
      console.log('Waiting 30ms before sending Ctrl+V...');
      setTimeout(async () => {
        try {
          console.log('About to send Ctrl+V using node-key-sender');
          await keySender.sendCombination(['control', 'v']);
          console.log('Paste command sent');
        } catch (err) {
          console.error('Error sending paste:', err);
        }
      }, 30);
    } catch (err) {
      console.error('Error in clipboard write or paste:', err);
    }
  });
  const registered2 = globalShortcut.register(hotkey2, () => {
    console.log(`Global hotkey ${hotkey2} triggered!`);
    try {
      clipboard.writeText(DUMMY_TEXT);
      console.log('Clipboard write complete');
      console.log('Waiting 30ms before sending Ctrl+V...');
      setTimeout(async () => {
        try {
          console.log('About to send Ctrl+V using node-key-sender');
          await keySender.sendCombination(['control', 'v']);
          console.log('Paste command sent');
        } catch (err) {
          console.error('Error sending paste:', err);
        }
      }, 30);
    } catch (err) {
      console.error('Error in clipboard write or paste:', err);
    }
  });
  const registered3 = globalShortcut.register(hotkey3, () => {
    if (!isRecording) {
      isRecording = true;
      startMicRecording();
    } else {
      isRecording = false;
      stopMicRecordingAndTranscribe();
    }
  });
  if (registered1) {
    console.log(`Global hotkey ${hotkey1} registered successfully.`);
  } else {
    console.error(`Failed to register global hotkey ${hotkey1}.`);
  }
  if (registered2) {
    console.log(`Global hotkey ${hotkey2} registered successfully.`);
  } else {
    console.error(`Failed to register global hotkey ${hotkey2}.`);
  }
  if (registered3) {
    console.log(`Global hotkey ${hotkey3} registered successfully.`);
  } else {
    console.error(`Failed to register global hotkey ${hotkey3}.`);
  }
});

app.on('will-quit', () => {
  console.log('App quitting, unregistering all global shortcuts.');
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('start-whisper-stt', async () => {
  console.log('IPC: start-whisper-stt received');
  try {
    await whisper.recordAndTranscribe();
    console.log('Whisper STT finished');
  } catch (err) {
    console.error('Error in Whisper STT:', err);
  }
});
