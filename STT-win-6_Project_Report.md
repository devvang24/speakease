# Speech-to-Text Application Technical Documentation

## Project Overview

The Speech-to-Text (STT) application is an Electron-based desktop utility designed to provide real-time speech transcription capabilities across the system. The application features a minimalist "pill" UI for minimal distraction, global hotkeys for hands-free operation, and integration with OpenAI's Whisper API for accurate transcription.

## System Architecture

The application follows a standard Electron architecture with main and renderer processes:

### Main Process
- Runs in `main.js`
- Controls application lifecycle
- Manages window creation and behavior
- Handles global hotkeys
- Manages audio recording and OpenAI API integration
- Coordinates IPC (Inter-Process Communication) between windows

### Renderer Processes
- Multiple UI interfaces (pill, settings, main view)
- Handle user input and display feedback
- Communicate with the main process via IPC

## User Interface Components

### 1. The Pill UI (`pill.html`)
- Small, minimalist, draggable floating UI element
- Size: 50x50 pixels
- Features a settings gear icon button
- Allows quick access to main functionality
- Always-on-top behavior for easy access

### 2. Main Settings Interface (`index.html`)
- Full-featured settings panel
- Controls for:
  - Microphone selection
  - Language preferences
  - Hotkey configuration
  - Output format selection
  - Transcription engine settings

### 3. Settings Modal (`settings.html`)
- Focused configuration panel for OpenAI API settings
- Manages:
  - API key storage
  - Global hotkey configuration
  - Language settings

### 4. Build/Info Screen (`build.html`)
- Informational overlay
- Provides application title and brief instructions
- Click-through to access main settings

## Data Flow

1. **Audio Recording Flow**:
   - User activates recording via hotkey (Control+;) or UI button
   - Main process initializes microphone through the `mic` npm package
   - Audio is captured and saved temporarily as a WAV file
   - File is sent to OpenAI Whisper API for transcription
   - Transcription is returned and placed in clipboard
   - Text is automatically pasted at cursor position
   - Temporary audio file is deleted

2. **Settings Data Flow**:
   - User preferences saved in localStorage
   - API keys stored securely
   - Configuration changes are sent via IPC to main process
   - Main process applies settings (e.g., updates hotkeys, changes microphone)

3. **Quick Text Insertion Flow**:
   - Pre-configured text snippets available via hotkeys
   - When activated, text is copied to clipboard
   - Main process triggers a key combination (Ctrl+V) to paste
   - Works across all applications due to global hotkey registration

## Key Components & Files

### Main Process Files:
- **main.js**: Application entry point and main logic
  - Window management
  - Global hotkey configuration
  - IPC event handling
  - Clipboard management and key simulation
  - App lifecycle management

- **whisper-transcript.js**: Audio recording and transcription module
  - Microphone access and recording
  - File management for temporary recordings
  - API communication with OpenAI Whisper
  - Error handling and cleanup

### Renderer Files:
- **pill.html**: Minimalist floating UI
  - Simple button interface
  - Draggable component
  - Transparent background with pill shape

- **pill-preload.js**: Preload script for pill UI
  - Exposes IPC communication to pill renderer
  - Maintains security through contextBridge

- **index.html**: Main settings interface
  - User preferences UI
  - Microphone selection
  - Language settings
  - Output format options

- **renderer.js**: Logic for settings UI
  - DOM manipulation
  - Event handling
  - LocalStorage management
  - Microphone enumeration

- **preload.js**: Bridge for main settings
  - Exposes API functions to renderer
  - Handles IPC communication
  - Maintains security context isolation

- **settings.html**: API key and global settings UI
  - OpenAI API key management
  - Hotkey configuration
  - Language selection

- **build.html**: Information screen
  - Application branding
  - Click-through to settings

- **styles.css**: Shared styling
  - Common UI elements
  - Color schemes
  - Layout components

## Execution Flow

1. **Application Startup**:
   - `main.js` initializes the app
   - Creates both pill and main windows
   - Main window is hidden initially
   - Pill window is displayed as the primary interface
   - Global hotkeys are registered

2. **User Interaction**:
   - User can click pill to access settings
   - User can use global hotkeys without UI interaction:
     - `Control+;` to start/stop recording
     - `Control+Shift+V` to paste predefined text

3. **Recording Process**:
   - When recording is activated:
     - Boolean flag `isRecording` is set to true
     - Microphone recording begins via `startMicRecording()`
     - When stopped, `stopMicRecordingAndTranscribe()` is called
     - Audio is sent to OpenAI API
     - Transcription is received and pasted at cursor location

4. **Settings Management**:
   - When settings are changed, they are saved to localStorage
   - IPC events notify the main process of changes
   - Main process updates application behavior accordingly

## Technical Implementation Details

### Global Hotkey Mechanism
- Uses Electron's `globalShortcut` module
- Registers system-wide keyboard shortcuts
- Functions even when app is not focused
- Configurable through settings interface

### Audio Recording
- Utilizes the `mic` npm package
- Captures audio at 16kHz sample rate, mono channel
- Saves temporary file in application directory
- File is cleaned up after processing

### OpenAI Whisper Integration
- Uses OpenAI Node.js SDK
- Audio transcription via `whisper-1` model
- Requires API key stored in environment or settings
- Handles streaming audio data to API

### Clipboard and Key Simulation
- Uses Electron's `clipboard` module for text management
- Employs `node-key-sender` for cross-application key simulation
- Simulates keyboard shortcuts (Ctrl+V) to paste text

### Window Management
- Transparent, frameless window for pill UI
- Standard framed window for settings
- Communication between windows via IPC
- Position persistence for pill UI

## Configuration Options

### API Settings
- OpenAI API key configuration
- Model selection capabilities

### User Preferences
- Microphone device selection
- Language preferences
- UI behavior settings
- Output format options

### Hotkey Configuration
- Custom global shortcuts
- Start/stop recording hotkey
- Quick paste hotkey

## Security Considerations

- API keys stored securely
- Context isolation implemented in renderer processes
- Node integration disabled in renderers
- Preload scripts used for secure IPC communication

## Performance Optimization

- Minimal UI footprint with the pill interface
- Efficient audio recording with configurable parameters
- Temporary file cleanup to manage disk usage
- Background processing to maintain UI responsiveness

## Future Development Considerations

- Multiple transcription engine support
- Advanced text formatting options
- Custom voice commands
- UI themes and additional customization
- Local transcription options for offline use

---

This technical documentation provides a comprehensive overview of the Speech-to-Text application architecture, components, data flow, and implementation details. It serves as a reference for understanding the system's design and functionality. 