# Speech-to-Text Application Technical Documentation

## Project Overview

The Speech-to-Text (STT) application is an Electron-based desktop utility designed to provide real-time speech transcription capabilities. The application features a minimalist "pill" UI for quick access, global hotkeys for hands-free operation, and integration with OpenAI's Whisper API for transcription. It runs in the background with a system tray icon, allowing for seamless operation. Configuration options include API key management, hotkey customization, microphone selection, language preferences, and auto-start settings, primarily managed through a unified settings interface.

## System Architecture

The application follows a standard Electron architecture:

### Main Process (`main.js`)
- Controls the application lifecycle.
- Manages window creation and behavior for the main settings window (`index.html`) and the pill window (`pill.html`).
- Handles global hotkey registration, management, and actions. Hotkeys are configurable and stored in `config.json`.
- Manages audio recording via the `mic` package and OpenAI Whisper API integration for transcription initiated by global hotkeys.
- Handles API key storage and retrieval from `config.json`.
- Manages auto-start functionality using the `auto-launch` package.
- Coordinates IPC (Inter-Process Communication) with renderer processes.
- Creates and manages the system tray icon and its context menu.
- Enforces single instances for main UI components.

### Renderer Processes
- **Unified Settings Interface (`index.html` with `renderer.js` and `preload.js`):**
    - Provides UI for all application settings:
        - Microphone selection (saved to `localStorage`).
        - Language preferences (saved to `localStorage`).
        - Output format selection (saved to `localStorage`).
        - Global hotkey configuration (Recording, Paste, Quick Access - saved to `config.json` via IPC).
        - OpenAI API key management (saved to `config.json` via IPC).
    - Handles user input and displays feedback.
    - Communicates with the main process via IPC calls defined in `preload.js`.
- **Pill UI (`pill.html` with `pill-preload.js`):**
    - Minimalist, draggable, always-on-top UI.
    - Provides a button to open the main settings window.
    - Visually indicates recording status.
    - Notifies user if API key is not configured.
    - Communicates with main process via IPC calls in `pill-preload.js`.
- **Build/Info Screen (`build.html`):**
    - A simple informational screen that can link to the main application/settings.

## User Interface Components

### 1. The Pill UI (`pill.html`)
- Small (50x50 pixels), draggable, floating UI element with rounded "pill" shape.
- Always-on-top for easy access.
- Contains a settings gear icon that opens the main settings window (`index.html`).
- Displays a microphone icon and changes background color to indicate recording status (color pulsing animation).
- Shows an alert if the API key is not configured on startup.

### 2. Unified Settings Interface (`index.html`)
- Serves as the main application window and comprehensive settings panel.
- Accessible via the Pill UI or system tray.
- Controls for:
  - **Microphone Selection:** Dropdown to select audio input device. Setting stored in `localStorage`.
  - **Language Selection:** Dropdown for language preference. Setting stored in `localStorage`.
  - **Global Hotkeys:** Interactive UI to set/reset hotkeys for:
    - Start/Stop Recording (default: `Control+;`)
    - Quick Paste (default: `Control+Shift+V`)
    - Quick Access (default: `Control+/`)
    Settings are stored in `config.json`. Provides real-time feedback and validation.
  - **Output Format:** Dropdown for text output format. Setting stored in `localStorage`.
  - **Transcription Engine:** Displays "OpenAI Whisper" (currently not configurable).
  - **OpenAI API Key:** Input field to save/remove API key. Stored in `config.json`. Status (configured/not configured) is displayed.
- Features a sidebar for potential future navigation (currently "Home" and "Settings" icons, with Settings active).

### 3. Build/Info Screen (`build.html`)
- An informational overlay displaying the application title.
- Designed to be clickable to open the main settings window (script attempts `window.electron.openMainWindow()`, may need adjustment to `window.electronAPI.openMain()` based on a standard preload for it).

### 4. System Tray Icon (`icon.png`)
- Always-present icon in the system tray.
- Context menu with options:
  - Show Main Window (opens/shows `index.html`).
  - Show Pill (shows `pill.html`).
  - Enable/Disable Auto-start.
  - Quit.
- Left-click on tray icon shows the pill UI.
- Allows the application to run in the background.

## Data Flow

### 1. Configuration Data Flow
- **API Key & Hotkeys:**
    - Stored in `config.json` within the application's user data directory.
    - Managed by `main.js` (read/write functions: `getApiKey`, `setApiKey`, `removeApiKey`, `getHotkeys`, `saveHotkeys`).
    - `index.html` (renderer) uses IPC calls (via `preload.js`) to get/set these values.
- **UI Preferences (Microphone, Language, Output Format):**
    - Stored in `localStorage` by `renderer.js` in `index.html`.
    - Loaded on `DOMContentLoaded`.
- **Auto-start:**
    - Managed by `auto-launch` package in `main.js`.
    - Status checked and toggled via IPC calls from tray menu and potentially settings UI.

### 2. Audio Recording & Transcription Flow (Global Hotkey - `main.js`)
   - User activates "Start/Stop Recording" hotkey.
   - `main.js` toggles recording state (`isRecording` flag).
   - **Start Recording:** `startMicRecording()` is called.
     - `mic` package initializes the selected microphone.
     - Audio is streamed to a temporary `recording.wav` file.
     - Pill UI is notified to change appearance (`recording-status-change` IPC).
   - **Stop Recording:** `stopMicRecordingAndTranscribe()` is called.
     - `mic` instance stops.
     - Pill UI is notified.
     - On `outputFileStream` finish:
       - If OpenAI API key is configured:
         - `openai.audio.transcriptions.create` sends `recording.wav` to Whisper API.
         - Transcript received, copied to clipboard (`clipboard.writeText`).
         - `node-key-sender` simulates Ctrl+V to paste the transcript.
       - Temporary `recording.wav` is deleted.
       - Pill UI is notified if API key is missing.

### 3. Secondary Transcription Flow (`whisper-transcript.js`)
   - This module provides a `recordAndTranscribe` function.
   - It can be invoked via IPC (`start-whisper-stt` from `renderer.js`, e.g., a button).
   - Uses `dotenv` to potentially load an API key (this might conflict or be a dev-only feature if `main.js` handles the primary API key from `config.json`).
   - Records audio for a fixed duration (5 seconds) using `mic`.
   - Sends the recording to Whisper API.
   - Logs the transcript to console.
   - Deletes the temporary audio file.
   - *Note: This flow is distinct from the global hotkey transcription and does not use `keySender` or clipboard integration.*

### 4. Quick Paste / Quick Access Hotkey Flow (`main.js`)
   - User activates "Quick Paste" or "Quick Access" hotkey.
   - `main.js` handles these hotkeys.
   - Currently, both hotkeys copy a predefined `DUMMY_TEXT` string to the clipboard.
   - `node-key-sender` simulates Ctrl+V to paste this dummy text.
   - *Functionality is not for user-defined snippets or dynamic content yet.*

### 5. Background Operation & Window Management
   - App can be minimized to the system tray.
   - Closing windows (Pill or Main Settings) hides them by default, allowing the app to run in the background.
   - Global hotkeys remain active.
   - Tray icon provides access to show windows or quit the application.

## Key Components & Files

### Main Process Files:
- **`main.js`**: Core application logic.
  - Manages app lifecycle, windows (`BrowserWindow`), IPC (`ipcMain`), global hotkeys (`globalShortcut`), tray (`Tray`, `Menu`).
  - Handles configuration persistence for API key and hotkeys in `config.json`.
  - Integrates `auto-launch` for auto-start feature.
  - Implements primary audio recording/transcription flow using `mic` and `openai` SDK.
  - Uses `node-key-sender` for pasting.
- **`whisper-transcript.js`**: Secondary, self-contained transcription module.
  - Records for a fixed duration, transcribes using OpenAI.
  - Uses `dotenv` for API key (separate from `config.json` managed by `main.js`).
  - Primarily logs output to console.
- **`config.json`** (in user data path, not in project source): Stores API key and hotkey configurations.

### Renderer Files (for Unified Settings Interface - `index.html`):
- **`index.html`**: HTML structure for the unified settings page and main application view.
  - Includes UI elements for all configurable options (mic, language, hotkeys, API key, etc.).
  - Links to `styles.css` and `renderer.js`.
- **`renderer.js`**: JavaScript logic for `index.html`.
  - Handles DOM manipulation, event listeners for settings controls.
  - Manages `localStorage` for UI preferences (mic, language, output format).
  - Interacts with `main.js` via IPC calls (exposed by `preload.js`) for API key and hotkey management.
  - Implements the interactive hotkey recording UI.
- **`preload.js`**: Exposes specific IPC channels to `renderer.js` for `index.html` using `contextBridge`.
  - Provides functions like `getApiKey`, `setApiKey`, `getHotkeys`, `setHotkey`, `openMain`, `toggleAutoStart`, etc.

### Renderer Files (for Pill UI - `pill.html`):
- **`pill.html`**: HTML structure for the minimalist pill UI.
  - Contains buttons and elements for settings access and recording indication.
- **`pill-preload.js`**: Exposes IPC channels to the pill's renderer script.
  - Provides `openMain`, `onRecordingStatusChange`, `onApiKeyStatus`.

### Other Files:
- **`build.html`**: Simple HTML for an informational/splash screen.
- **`styles.css`**: Shared CSS styles for `index.html` and potentially other HTML files.
- **`icon.png`**: Image file for the system tray icon.
- **`package.json`**: Lists project dependencies (`electron`, `auto-launch`, `openai`, `mic`, `node-key-sender`, etc.) and scripts (`start`, `dev`).
- **`.gitignore`**: Specifies intentionally untracked files (e.g., `node_modules`).

## Execution Flow

1.  **Application Startup** (`main.js`):
    *   `app.whenReady()`: Initializes main application logic.
    *   Checks and enables/disables auto-start feature.
    *   Loads hotkey configuration from `config.json` (or defaults).
    *   Creates and configures the system tray icon and its context menu.
    *   Creates the main settings window (`mainWin` loading `index.html`), initially hidden.
    *   Creates the pill window (`pillWin` loading `pill.html`), shown on top.
    *   Registers global hotkeys based on loaded configuration.
    *   Initializes OpenAI instance if API key exists in `config.json`.

2.  **User Interaction**:
    *   **Pill UI:** Click gear icon to open main settings window (`index.html`).
    *   **Tray Menu:** Access options to show main/pill windows, toggle auto-start, or quit.
    *   **Global Hotkeys:**
        *   `Start/Stop Recording`: Triggers audio capture and transcription flow in `main.js`.
        *   `Quick Paste` / `Quick Access`: Copies dummy text and pastes it.
    *   **Settings Window (`index.html`):**
        *   Modify microphone, language, output format (saved to `localStorage`).
        *   Set/Reset hotkeys (saved to `config.json` via IPC).
        *   Save/Remove API key (saved to `config.json` via IPC).

3.  **Settings Management**:
    *   Changes in `index.html` for API key/hotkeys trigger IPC calls to `main.js`.
    *   `main.js` updates `config.json` and re-registers hotkeys if necessary.
    *   Other settings (mic, language, format) are managed by `renderer.js` using `localStorage`.

## Technical Implementation Details

### Global Hotkey Mechanism
- Uses Electron's `globalShortcut` module in `main.js`.
- Hotkeys (Recording, Paste, Quick Access) are configurable via `index.html`.
- Configurations stored in `config.json`.
- Interactive recording UI in `index.html` with real-time feedback and validation.
- Supports multi-key combinations (Ctrl, Shift, Alt + Key).
- Hotkeys are re-registered on change without app restart.

### Audio Recording & Transcription
- **Primary Flow (`main.js`):**
    - `mic` package for audio capture (16kHz, mono).
    - Temporary `recording.wav` file.
    - OpenAI Node.js SDK (`openai` package) for `whisper-1` model transcription.
    - API key from `config.json`.
- **Secondary Flow (`whisper-transcript.js`):**
    - Also uses `mic` and `openai` SDK.
    - API key potentially from `.env` (via `dotenv`).
    - Fixed 5-second recording, console output.

### Configuration Storage
- **`config.json`:** Securely stores OpenAI API key and hotkey mappings in user's app data directory. Managed by `main.js`.
- **`localStorage`:** Used by `renderer.js` for `index.html` to store user preferences like selected microphone, language, and output format.

### Auto-start
- `auto-launch` npm package used in `main.js`.
- Enabled/disabled via tray menu, status stored by the package.

### Clipboard and Key Simulation
- Electron's `clipboard` module for writing text.
- `node-key-sender` package for simulating Ctrl+V paste action.

## Architecture Improvements

### Unified Settings Interface
- Consolidated all primary settings (including API key and hotkey configuration, previously in a separate `settings.html`) into `index.html`.
- Eliminates potential synchronization issues and reduces code duplication.
- Improves maintainability and user experience by providing a single, consistent interface for all settings.

## Future Development Considerations
- **Clarify/Integrate Transcription Flows:** Decide if `whisper-transcript.js` is for development/testing or needs to be integrated into the main user-facing features, perhaps as an alternative transcription mode.
- **Quick Paste/Access Functionality:** Implement user-configurable text snippets for these hotkeys instead of dummy text.
- **Build/Info Screen Preload:** Ensure `build.html` correctly invokes `openMain` by potentially adding a dedicated preload or ensuring `electronAPI` is available if it's loaded in a `BrowserWindow` with preload.
- **Error Handling:** Enhance error handling and user feedback across the application.
- **UI Themes & Customization:** Add options for UI themes.
- **Local Transcription:** Explore options for local, offline transcription.

---

This technical documentation provides a comprehensive overview of the Speech-to-Text application architecture, components, data flow, and implementation details. It serves as a reference for understanding the system's design and functionality. 