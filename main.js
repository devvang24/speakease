// main.js
console.log('main.js loaded');
const Mic = require('mic');
const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const keySender = require('node-key-sender');
const whisper = require('./whisper-transcript');
const fs = require('fs');
const os = require('os');
const AutoLaunch = require('auto-launch');

let mainWin, pillWin;
let settingsWin = null;
let tray = null;
let isAutoStartEnabled = false;

// Default hotkeys configuration
const defaultHotkeys = {
  recording: 'Control+;',
  paste: 'Control+Shift+V',
  quickAccess: 'Control+/'
};

// Create auto launcher
const appAutoLauncher = new AutoLaunch({
  name: 'SpeakEase',
  path: app.getPath('exe'),
});

// Auto-start functions
async function checkAutoLaunchStatus() {
  try {
    isAutoStartEnabled = await appAutoLauncher.isEnabled();
    console.log('Auto-start status:', isAutoStartEnabled);
    return isAutoStartEnabled;
  } catch (error) {
    console.error('Error checking auto-start status:', error);
    return false;
  }
}

async function toggleAutoStart() {
  try {
    isAutoStartEnabled = await appAutoLauncher.isEnabled();
    if (isAutoStartEnabled) {
      await appAutoLauncher.disable();
      isAutoStartEnabled = false;
      console.log('Auto-start disabled');
    } else {
      await appAutoLauncher.enable();
      isAutoStartEnabled = true;
      console.log('Auto-start enabled');
    }
    updateTrayMenu();
    return isAutoStartEnabled;
  } catch (error) {
    console.error('Error toggling auto-start:', error);
    return isAutoStartEnabled;
  }
}

// Update the tray menu with current auto-start status
function updateTrayMenu() {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Main Window', click: () => { if (!mainWin) createMain(); mainWin.show(); } },
    { label: 'Show Pill', click: () => { if (pillWin) pillWin.show(); } },
    { type: 'separator' },
    { 
      label: isAutoStartEnabled ? 'Disable Auto-start' : 'Enable Auto-start', 
      click: async () => { await toggleAutoStart(); }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  
  tray.setContextMenu(contextMenu);
}

// Config file path for storing API key
const configPath = path.join(app.getPath('userData'), 'config.json');

function getApiKey() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.apiKey || null;
    }
  } catch (e) { console.error('Error reading config:', e); }
  return null;
}

function setApiKey(apiKey) {
  try {
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    config.apiKey = apiKey;
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf-8');
    console.log('API key set:', apiKey);
  } catch (e) { console.error('Error writing config:', e); }
}

// Function to get hotkeys from config
function getHotkeys() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return { ...defaultHotkeys, ...(config.hotkeys || {}) };
    }
  } catch (e) { console.error('Error reading config:', e); }
  return defaultHotkeys;
}

// Function to save hotkeys to config
function saveHotkeys(hotkeys) {
  try {
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    config.hotkeys = { ...config.hotkeys, ...hotkeys };
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf-8');
    console.log('Hotkeys saved:', hotkeys);
  } catch (e) { console.error('Error writing config:', e); }
}

// Global variables for hotkeys
let registeredHotkeys = {};

// Unregister all hotkeys
function unregisterHotkeys() {
  console.log('Unregistering all hotkeys');
  globalShortcut.unregisterAll();
  registeredHotkeys = {};
}

// Register hotkeys based on configuration
function registerHotkeys() {
  const hotkeys = getHotkeys();
  console.log('Registering hotkeys:', hotkeys);
  
  // Register recording hotkey
  registeredHotkeys.recording = globalShortcut.register(hotkeys.recording, () => {
    if (!isRecording) {
      isRecording = true;
      startMicRecording();
    } else {
      isRecording = false;
      stopMicRecordingAndTranscribe();
    }
  });
  
  // Register paste hotkey
  registeredHotkeys.paste = globalShortcut.register(hotkeys.paste, () => {
    console.log(`Global hotkey ${hotkeys.paste} triggered!`);
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
  
  // Register quick access hotkey
  registeredHotkeys.quickAccess = globalShortcut.register(hotkeys.quickAccess, () => {
    console.log(`Global hotkey ${hotkeys.quickAccess} triggered!`);
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
  
  // Log registration status
  console.log('Hotkey registration status:');
  for (const [type, registered] of Object.entries(registeredHotkeys)) {
    if (registered) {
      console.log(`Global hotkey ${hotkeys[type]} for ${type} registered successfully.`);
    } else {
      console.error(`Failed to register global hotkey ${hotkeys[type]} for ${type}.`);
    }
  }
}

// Update hotkeys
function updateHotkey(type, newHotkey) {
  if (!defaultHotkeys[type]) {
    console.error(`Unknown hotkey type: ${type}`);
    return false;
  }
  
  // Validate the hotkey format
  if (!isValidHotkey(newHotkey)) {
    console.error(`Invalid hotkey format: ${newHotkey}`);
    return false;
  }
  
  const hotkeys = getHotkeys();
  
  // Check for duplicate hotkeys
  for (const [existingType, existingHotkey] of Object.entries(hotkeys)) {
    if (existingType !== type && existingHotkey === newHotkey) {
      console.error(`Hotkey ${newHotkey} is already assigned to ${existingType}`);
      return false;
    }
  }
  
  console.log(`Updating ${type} hotkey from ${hotkeys[type]} to ${newHotkey}`);
  hotkeys[type] = newHotkey;
  saveHotkeys(hotkeys);
  
  // Re-register hotkeys
  unregisterHotkeys();
  registerHotkeys();
  
  return true;
}

// Validate hotkey format
function isValidHotkey(hotkey) {
  // Basic format validation
  if (!hotkey || typeof hotkey !== 'string') {
    return false;
  }
  
  const parts = hotkey.split('+').map(part => part.trim());
  
  // Ensure we have at least one key
  if (parts.length === 0) {
    return false;
  }
  
  // Check if the hotkey is registerable in Electron
  // This is a basic check, Electron might still reject some valid-looking combinations
  return true;
}

// IPC handlers for API key
ipcMain.handle('get-api-key', () => getApiKey());
ipcMain.handle('set-api-key', (event, apiKey) => {
  setApiKey(apiKey);
  updateOpenAIInstance();
  if (pillWin) pillWin.webContents.send('api-key-status', !!apiKey);
});

ipcMain.handle('remove-api-key', () => {
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('API key removed');
    }
  } catch (e) { console.error('Error removing config:', e); }
  updateOpenAIInstance();
  if (pillWin) pillWin.webContents.send('api-key-status', false);
});

// Hot-reload (dev only)
try {
  require('electron-reloader')(module, {
    debug: true,
    watchRenderer: true
  });
  console.log('Hot-reload enabled');
} catch (_) { console.log('Hot-reload disabled'); }

function createMain() {
  console.log('Creating main window...');
  mainWin = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWin.loadFile('index.html');
  mainWin.webContents.openDevTools(); // remove in prod
  console.log('Main window created and DevTools opened');

  // Minimize to tray on close
  mainWin.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWin.hide();
    }
  });
}

function createPill() {
  if (pillWin && !pillWin.isDestroyed()) {
    pillWin.show();
    return;
  }
  console.log('Creating pill window...');
  pillWin = new BrowserWindow({
    width: 50,
    height: 50,
    x: 50,
    y: 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'pill-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  pillWin.loadFile('pill.html');
  pillWin.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      pillWin.hide();
    }
  });
  console.log('Pill window created!');
}

const DUMMY_TEXT = "This is a sample 100-word paragraph that will be copied to the clipboard and pasted wherever your cursor is currently positioned. It's a basic test to demonstrate how NodeKeySender works along with clipboardy (or Electron's clipboard) in an Electron app. No need to use nut.js or other libraries—just click the button, and this paragraph should appear instantly at your cursor location in any focused application.";

let isRecording = false;
let micInstance = null;
let micInputStream = null;
let outputFileStream = null;
let outputFile = null;

const OpenAI = require('openai');
let openai = null;
function updateOpenAIInstance() {
  const apiKey = getApiKey();
  console.log('API key loaded in updateOpenAIInstance:', apiKey);
  if (apiKey) openai = new OpenAI({ apiKey });
  else openai = null;
}
updateOpenAIInstance();

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
  
  // Notify pill window about recording status
  if (pillWin) {
    pillWin.webContents.send('recording-status-change', true);
  }
}

function stopMicRecordingAndTranscribe() {
  if (!micInstance) return;
  micInstance.stop();
  console.log('Global Hotkey: Recording stopped.');
  if (pillWin) pillWin.webContents.send('recording-status-change', false);
  outputFileStream.on('finish', async () => {
    if (!openai) {
      console.error('No API key configured.');
      if (pillWin) pillWin.webContents.send('api-key-status', false);
      return;
    }
    try {
      console.log('Sending audio to Whisper...');
      const resp = await openai.audio.transcriptions.create({
        file: fs.createReadStream(outputFile),
        model: 'whisper-1'
      });
      const transcript = resp.text;
      console.log('Whisper STT transcript:', transcript);
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

app.whenReady().then(async () => {
  console.log('App is ready');

  // Check auto-start status
  await checkAutoLaunchStatus();
  
  // Log the current hotkeys
  const currentHotkeys = getHotkeys();
  console.log('Loaded hotkeys from config:', currentHotkeys);

  // Destroy old tray if it exists
  if (tray) {
    tray.destroy();
    tray = null;
  }

  // Create Tray icon (use a real icon file)
  console.log('Creating tray icon...');
  const iconPath = path.join(__dirname, 'icon.png');
  console.log('Tray icon path:', iconPath);
  if (!fs.existsSync(iconPath)) {
    console.error('Tray icon not found at:', iconPath);
  }
  tray = new Tray(iconPath);
  
  // Create and set tray menu with auto-start option
  updateTrayMenu();
  
  tray.setToolTip('SpeakEase');
  tray.on('click', () => { if (pillWin) pillWin.show(); });
  console.log('Tray icon created!');

  // Destroy old pill window if it exists
  if (pillWin && !pillWin.isDestroyed()) {
    pillWin.close();
    pillWin = null;
  }

  createMain();
  createPill();

  // Check API key on startup
  const apiKey = getApiKey();
  if (!apiKey && pillWin) {
    pillWin.webContents.once('did-finish-load', () => {
      pillWin.webContents.send('api-key-status', false);
    });
  }

  // Register global hotkeys
  registerHotkeys();
});

app.on('will-quit', () => {
  console.log('App quitting, unregistering all global shortcuts.');
  unregisterHotkeys();
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
  // Do nothing: keep app running in tray
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

ipcMain.on('open-main', () => {
  if (!mainWin) createMain();
  mainWin.show();
  mainWin.focus();
});

ipcMain.on('open-settings', () => {
  if (settingsWin) {
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 600,
    height: 680,
    resizable: false,
    modal: true,
    parent: mainWin,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  settingsWin.loadFile('index.html');
  settingsWin.on('closed', () => { settingsWin = null; });
});

// When quitting, set app.isQuitting = true so pill can close
app.on('before-quit', () => { app.isQuitting = true; });

// Add auto-start IPC handlers
ipcMain.handle('get-auto-start', async () => {
  return await checkAutoLaunchStatus();
});

ipcMain.handle('toggle-auto-start', async () => {
  return await toggleAutoStart();
});

// Add hotkey IPC handlers
ipcMain.handle('get-hotkeys', () => {
  return getHotkeys();
});

ipcMain.handle('set-hotkey', (event, { type, hotkey }) => {
  console.log(`Setting ${type} hotkey to ${hotkey}`);
  return updateHotkey(type, hotkey);
});
