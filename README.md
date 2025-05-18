# SpeakEase

A productivity tool that converts your speech to text using OpenAI's Whisper API. Perfect for quick note-taking, transcription, and accessibility.

## Features

- **Speech-to-Text**: Convert your speech to text using OpenAI's Whisper API
- **Global Hotkeys**: Start/stop recording with customizable keyboard shortcuts
- **Always-On Indicator**: Floating pill UI shows recording status
- **Clipboard Integration**: Automatically pastes transcribed text
- **System Tray**: Runs in the background for easy access
- **Auto-Start**: Option to launch on system startup

## Installation

### Windows

1. Download the latest installer from the [Releases](https://github.com/yourusername/speakease/releases) page
2. Run the installer and follow the prompts
3. The app will start automatically after installation

### From Source

If you prefer to build from source:

```bash
# Clone the repository
git clone https://github.com/yourusername/speakease.git

# Install dependencies
cd speakease
npm install

# Run the app
npm start

# Build for Windows
npm run build:win
```

## Usage

### First Setup

1. When you first launch the app, you'll need to enter your OpenAI API key
2. You can get an API key from [OpenAI's platform](https://platform.openai.com/api-keys)
3. The app will save your API key for future use

### Recording

1. Press the default hotkey `Ctrl+;` to start recording
2. Speak clearly into your microphone
3. Press `Ctrl+;` again to stop recording
4. Your speech will be transcribed and automatically pasted at your cursor position

### The Pill Indicator

- The floating pill shows your recording status:
  - Blue: Idle
  - Pulsing blue: Recording in progress
- You can drag the pill anywhere on your screen
- The pill will stay visible even when other windows are closed
- If you lose the pill off-screen, use the "Reset Pill Position" option in the tray menu

### Customizing Hotkeys

1. Open the main window from the tray icon
2. Go to Settings
3. Customize the hotkeys for recording and pasting

## Troubleshooting

### No Audio Detected

- Make sure your microphone is properly connected
- Check that SpeakEase has microphone permissions
- Test your microphone in Windows sound settings

### Hotkeys Not Working

- Check for conflicts with other applications
- Try setting different hotkey combinations
- Restart the application after changing hotkeys

### API Key Issues

- Verify your OpenAI API key is correct
- Ensure your account has sufficient credits
- Check your internet connection

## Privacy

SpeakEase:
- Only records when you activate recording with the hotkey
- Only sends audio to OpenAI's servers during transcription
- Does not store any audio files permanently
- Does not collect user data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- Built with [Electron](https://www.electronjs.org/)
- Transcription powered by [OpenAI Whisper](https://openai.com/research/whisper) 