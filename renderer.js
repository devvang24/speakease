// renderer.js

console.log('renderer.js loaded');

// Get all the necessary DOM elements
const microphoneSelect = document.getElementById('microphone-select');
const languageSelect = document.getElementById('language-select');
const hotkeyButton = document.getElementById('hotkey-button');
const outputFormatSelect = document.getElementById('output-format');
const configureEngineButton = document.getElementById('configure-engine');

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

configureEngineButton.addEventListener('click', () => {
    // Open configuration dialog or navigate to engine settings
    console.log('Configure engine clicked');
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
