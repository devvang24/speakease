require('dotenv').config();
const fs = require('fs');
const OpenAI = require('openai');
const Mic = require('mic');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  async recordAndTranscribe() {
    console.log('Whisper STT: Recording for 5 seconds...');
    const outputFile = 'recording.wav';
    const micInstance = Mic({
      rate: '16000',
      channels: '1',
      debug: false,
      exitOnSilence: 6
    });
    const micInputStream = micInstance.getAudioStream();
    const outputFileStream = fs.createWriteStream(outputFile);
    micInputStream.pipe(outputFileStream);

    micInputStream.on('error', (err) => {
      console.error('Mic error:', err);
    });

    micInstance.start();
    console.log('Recording started...');

    // Stop after 5 seconds
    setTimeout(() => {
      micInstance.stop();
      console.log('Recording stopped.');
    }, 5000);

    // Wait for file to finish writing
    outputFileStream.on('finish', async () => {
      try {
        console.log('Sending audio to Whisper...');
        const resp = await openai.audio.transcriptions.create({
          file: fs.createReadStream(outputFile),
          model: 'whisper-1'
        });
        console.log('Whisper STT transcript:', resp.text);
      } catch (err) {
        console.error('Whisper API error:', err.response?.data || err.message);
      } finally {
        fs.unlinkSync(outputFile);
      }
    });
  }
}; 