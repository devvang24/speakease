// renderer.js

console.log('renderer.js loaded');

// Get all the necessary DOM elements
const microphoneSelect = document.getElementById('microphone-select');
const languageSelect = document.getElementById('language-select');
const outputFormatSelect = document.getElementById('output-format');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKeyButton');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const removeApiKeyButton = document.getElementById('removeApiKeyButton');

// Hotkey elements
const recordingHotkey = document.getElementById('recordingHotkey');
const pasteHotkey = document.getElementById('pasteHotkey');
const quickAccessHotkey = document.getElementById('quickAccessHotkey');
const setRecordingHotkey = document.getElementById('setRecordingHotkey');
const setPasteHotkey = document.getElementById('setPasteHotkey');
const setQuickAccessHotkey = document.getElementById('setQuickAccessHotkey');
const resetRecordingHotkey = document.getElementById('resetRecordingHotkey');
const resetPasteHotkey = document.getElementById('resetPasteHotkey');
const resetQuickAccessHotkey = document.getElementById('resetQuickAccessHotkey');

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
    const savedFormat = localStorage.getItem('outputFormat');
    
    if (savedMicrophone) microphoneSelect.value = savedMicrophone;
    if (savedLanguage) languageSelect.value = savedLanguage;
    if (savedFormat) outputFormatSelect.value = savedFormat;
    
    // Load hotkeys
    loadHotkeys();
    
    // Load API Key status
    updateApiKeyStatus();
});

const recordBtn = document.getElementById('recordBtn');
console.log('recordBtn:', recordBtn);
if (recordBtn) {
  recordBtn.addEventListener('click', () => {
    console.log('Record (Whisper STT) button clicked');
    window.electronAPI.startWhisperSTT();
  });
}

// ----- API Key Management Functions -----

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
  try {
    const key = await getApiKey();
    const statusDot = apiKeyStatus.querySelector('.status-dot');
    const statusText = apiKeyStatus.querySelector('span');
    
    if (key) {
      if (statusDot) statusDot.classList.add('valid');
      if (statusText) statusText.textContent = 'API Key configured';
      else apiKeyStatus.textContent = 'API Key configured';
      apiKeyStatus.style.color = '#4CAF50';
      apiKeyInput.value = '';
    } else {
      if (statusDot) statusDot.classList.remove('valid');
      if (statusText) statusText.textContent = 'API Key not configured';
      else apiKeyStatus.textContent = 'API Key not configured';
      apiKeyStatus.style.color = '#e53935';
      apiKeyInput.value = '';
    }
  } catch (err) {
    console.error('Error updating API key status:', err);
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

// ----- Hotkey Management Functions -----

async function getHotkeys() {
  if (window.electronAPI && window.electronAPI.getHotkeys) {
    return await window.electronAPI.getHotkeys();
  } else if (window.require) {
    const { ipcRenderer } = require('electron');
    return await ipcRenderer.invoke('get-hotkeys');
  }
  return { recording: 'Control+;', paste: 'Control+Shift+V', quickAccess: 'Control+/' };
}

async function setHotkey(type, hotkey) {
  if (window.electronAPI && window.electronAPI.setHotkey) {
    return await window.electronAPI.setHotkey(type, hotkey);
  } else if (window.require) {
    const { ipcRenderer } = require('electron');
    return await ipcRenderer.invoke('set-hotkey', { type, hotkey });
  }
  return false;
}

async function loadHotkeys() {
  try {
    const hotkeys = await getHotkeys();
    recordingHotkey.value = hotkeys.recording;
    pasteHotkey.value = hotkeys.paste;
    quickAccessHotkey.value = hotkeys.quickAccess;
    console.log('Loaded hotkeys:', hotkeys);
  } catch (err) {
    console.error('Error loading hotkeys:', err);
  }
}

// Set up hotkey recording functionality
function setupHotkeyRecording(inputElement, setButton, hotkeyType) {
  let isRecording = false;
  let keysPressed = new Set();
  let lastCombination = '';
  let recordingTimer = null;
  
  // Get the status element
  const statusElement = document.getElementById(`${hotkeyType}HotkeyStatus`);
  
  // Event handler for the Set button
  setButton.addEventListener('click', () => {
    if (!isRecording) {
      startRecording();
    } else {
      // If already recording, cancel it
      cancelRecording();
    }
  });
  
  function startRecording() {
    isRecording = true;
    keysPressed.clear();
    lastCombination = inputElement.value;
    inputElement.value = 'Press key combination...';
    inputElement.classList.add('recording');
    
    // Change button text
    setButton.textContent = 'Cancel';
    
    // Clear status
    if (statusElement) {
      statusElement.textContent = '';
      statusElement.className = 'hotkey-status';
    }
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Clear any existing timer
    if (recordingTimer) {
      clearTimeout(recordingTimer);
    }
  }
  
  function handleKeyDown(e) {
    if (!isRecording) return;
    e.preventDefault();
    
    // Add the key to our set of pressed keys
    if (e.key === 'Control' || e.key === 'ctrl') {
      keysPressed.add('Control');
    } else if (e.key === 'Alt') {
      keysPressed.add('Alt');
    } else if (e.key === 'Shift') {
      keysPressed.add('Shift');
    } else if (e.key === 'Escape') {
      cancelRecording();
      return;
    } else {
      // For non-modifier keys, standardize the key name
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      keysPressed.add(key);
    }
    
    // Update the input value to show current key combination
    updateInputValue();
  }
  
  function handleKeyUp(e) {
    if (!isRecording) return;
    
    // If any key is released, save the current combination after a short delay
    // This allows the user to release keys one by one and still register the full combination
    if (recordingTimer) {
      clearTimeout(recordingTimer);
    }
    
    recordingTimer = setTimeout(() => {
      if (keysPressed.size > 0) {
        const hotkey = Array.from(keysPressed).join('+');
        saveNewHotkey(hotkey);
      }
    }, 500); // Wait 500ms after key release to save
  }
  
  function updateInputValue() {
    const keys = Array.from(keysPressed);
    if (keys.length > 0) {
      inputElement.value = keys.join('+');
    } else {
      inputElement.value = 'Press key combination...';
    }
  }
  
  function cancelRecording() {
    inputElement.value = lastCombination;
    stopRecording();
    
    // Show cancelled message
    if (statusElement) {
      statusElement.textContent = 'Recording cancelled';
      statusElement.className = 'hotkey-status';
      
      // Clear message after 3 seconds
      setTimeout(() => {
        statusElement.textContent = '';
      }, 3000);
    }
  }
  
  async function saveNewHotkey(hotkey) {
    try {
      console.log(`Setting ${hotkeyType} hotkey to: ${hotkey}`);
      const success = await setHotkey(hotkeyType, hotkey);
      
      if (success) {
        inputElement.value = hotkey;
        
        // Show success message
        if (statusElement) {
          statusElement.textContent = 'Hotkey saved';
          statusElement.className = 'hotkey-status success';
          
          // Clear message after 3 seconds
          setTimeout(() => {
            statusElement.textContent = '';
          }, 3000);
        }
      } else {
        // Show error message if the main process returned false
        if (statusElement) {
          statusElement.textContent = 'Failed to register hotkey';
          statusElement.className = 'hotkey-status error';
        }
        // Revert to the previous value
        inputElement.value = lastCombination;
      }
      
      stopRecording();
      await loadHotkeys(); // Reload all hotkeys to ensure consistency
    } catch (err) {
      console.error('Error saving hotkey:', err);
      
      // Show error message
      if (statusElement) {
        statusElement.textContent = `Error: ${err.message || 'Failed to save hotkey'}`;
        statusElement.className = 'hotkey-status error';
      }
      
      cancelRecording();
    }
  }
  
  function stopRecording() {
    isRecording = false;
    keysPressed.clear();
    inputElement.classList.remove('recording');
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    
    // Restore button text
    setButton.textContent = 'Set';
    
    if (recordingTimer) {
      clearTimeout(recordingTimer);
      recordingTimer = null;
    }
  }
}

// Setup reset button functionality
resetRecordingHotkey.addEventListener('click', async () => {
  await setHotkey('recording', 'Control+;');
  loadHotkeys();
  
  // Show success message
  const statusElement = document.getElementById('recordingHotkeyStatus');
  if (statusElement) {
    statusElement.textContent = 'Reset to default';
    statusElement.className = 'hotkey-status success';
    
    // Clear message after 3 seconds
    setTimeout(() => {
      statusElement.textContent = '';
    }, 3000);
  }
});

resetPasteHotkey.addEventListener('click', async () => {
  await setHotkey('paste', 'Control+Shift+V');
  loadHotkeys();
  
  // Show success message
  const statusElement = document.getElementById('pasteHotkeyStatus');
  if (statusElement) {
    statusElement.textContent = 'Reset to default';
    statusElement.className = 'hotkey-status success';
    
    // Clear message after 3 seconds
    setTimeout(() => {
      statusElement.textContent = '';
    }, 3000);
  }
});

resetQuickAccessHotkey.addEventListener('click', async () => {
  await setHotkey('quickAccess', 'Control+/');
  loadHotkeys();
  
  // Show success message
  const statusElement = document.getElementById('quickAccessHotkeyStatus');
  if (statusElement) {
    statusElement.textContent = 'Reset to default';
    statusElement.className = 'hotkey-status success';
    
    // Clear message after 3 seconds
    setTimeout(() => {
      statusElement.textContent = '';
    }, 3000);
  }
});

// Initialize hotkey recording
setupHotkeyRecording(recordingHotkey, setRecordingHotkey, 'recording');
setupHotkeyRecording(pasteHotkey, setPasteHotkey, 'paste');
setupHotkeyRecording(quickAccessHotkey, setQuickAccessHotkey, 'quickAccess');
