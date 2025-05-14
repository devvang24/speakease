// renderer.js

console.log('renderer.js loaded');

// Get all the necessary DOM elements
const microphoneSelect = document.getElementById('microphone-select');
const languageSelect = document.getElementById('language-select');
const hotkeyButton = document.getElementById('hotkey-button');
const outputFormatSelect = document.getElementById('output-format');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKeyButton');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const removeApiKeyButton = document.getElementById('removeApiKeyButton');

// Initialize microphone devices
async function initializeMicrophones() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphones = devices.filter(device => device.kind === 'audioinput');
        
        // Clear existing options
        microphoneSelect.innerHTML = '<option value="default">Default Device</option>';
        
        // Add all available microphones
        microphones.forEach(mic => {
            const option = document.createElement('option');
            option.value = mic.deviceId;
            option.text = mic.label || `Microphone ${microphoneSelect.options.length + 1}`;
            microphoneSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error getting microphone devices:', error);
    }
}

// Event Listeners
microphoneSelect.addEventListener('change', (e) => {
    const selectedDevice = e.target.value;
    console.log('Selected microphone:', selectedDevice);
    // Save the selected device
    localStorage.setItem('selectedMicrophone', selectedDevice);
});

languageSelect.addEventListener('change', (e) => {
    const selectedLanguage = e.target.value;
    console.log('Selected language:', selectedLanguage);
    localStorage.setItem('selectedLanguage', selectedLanguage);
});

let isRecordingHotkey = false;
hotkeyButton.addEventListener('click', () => {
    if (!isRecordingHotkey) {
        isRecordingHotkey = true;
        hotkeyButton.textContent = 'Press any key...';
        hotkeyButton.classList.add('recording');
        
        const hotkeyHandler = (e) => {
            e.preventDefault();
            const keys = [];
            if (e.ctrlKey) keys.push('Ctrl');
            if (e.shiftKey) keys.push('Shift');
            if (e.altKey) keys.push('Alt');
            if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
                keys.push(e.key.toUpperCase());
            }
            
            if (keys.length > 0) {
                const hotkey = keys.join('+');
                hotkeyButton.textContent = hotkey;
                localStorage.setItem('hotkey', hotkey);
                console.log('Set hotkey:', hotkey);
            }
            
            isRecordingHotkey = false;
            hotkeyButton.classList.remove('recording');
            document.removeEventListener('keydown', hotkeyHandler);
        };
        
        document.addEventListener('keydown', hotkeyHandler);
    }
});

outputFormatSelect.addEventListener('change', (e) => {
    const selectedFormat = e.target.value;
    console.log('Selected output format:', selectedFormat);
    localStorage.setItem('outputFormat', selectedFormat);
});

// Navigation
document.querySelector('.nav-item.home').addEventListener('click', () => {
    // Navigate to home/main view
    console.log('Navigate to home');
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize microphones
    initializeMicrophones();
    
    // Load saved settings
    const savedMicrophone = localStorage.getItem('selectedMicrophone');
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const savedHotkey = localStorage.getItem('hotkey');
    const savedFormat = localStorage.getItem('outputFormat');
    
    if (savedMicrophone) microphoneSelect.value = savedMicrophone;
    if (savedLanguage) languageSelect.value = savedLanguage;
    if (savedHotkey) hotkeyButton.textContent = savedHotkey;
    if (savedFormat) outputFormatSelect.value = savedFormat;
});

const recordBtn = document.getElementById('recordBtn');
console.log('recordBtn:', recordBtn);
if (recordBtn) {
  recordBtn.addEventListener('click', () => {
    console.log('Record (Whisper STT) button clicked');
    window.electronAPI.startWhisperSTT();
  });
}

async function getApiKey() {
  if (window.electronAPI && window.electronAPI.getApiKey) {
    return await window.electronAPI.getApiKey();
  } else if (window.require) {
    const { ipcRenderer } = require('electron');
    return await ipcRenderer.invoke('get-api-key');
  }
  return null;
}

async function setApiKey(key) {
  if (window.electronAPI && window.electronAPI.setApiKey) {
    await window.electronAPI.setApiKey(key);
  } else if (window.require) {
    const { ipcRenderer } = require('electron');
    await ipcRenderer.invoke('set-api-key', key);
  }
}

async function updateApiKeyStatus() {
  const key = await getApiKey();
  if (key) {
    apiKeyStatus.textContent = 'API Key configured';
    apiKeyStatus.style.color = '#4CAF50';
    apiKeyInput.value = '';
  } else {
    apiKeyStatus.textContent = 'API Key not configured';
    apiKeyStatus.style.color = '#e53935';
    apiKeyInput.value = '';
  }
}

saveApiKeyButton.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  await setApiKey(key);
  updateApiKeyStatus();
});

async function removeApiKey() {
  if (window.electronAPI && window.electronAPI.removeApiKey) {
    await window.electronAPI.removeApiKey();
  } else if (window.require) {
    const { ipcRenderer } = require('electron');
    await ipcRenderer.invoke('remove-api-key');
  }
}

removeApiKeyButton.addEventListener('click', async () => {
  await removeApiKey();
  updateApiKeyStatus();
});

// On load
updateApiKeyStatus();
