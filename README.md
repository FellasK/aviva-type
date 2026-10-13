# AvivaType

**Make typing feel alive.**

AvivaType is a browser extension that adds keyboard sounds to every keystroke — making writing more tactile, intuitive, and satisfying. Whether you're coding, writing, or filling out a form, the subtle audio feedback brings a physical dimension back to digital typing.

Designed with inclusivity in mind: the sounds help users who benefit from multisensory feedback to better perceive and engage with their own typing rhythm.

---

## Features

- 🔊 **5 sound themes** — Default (real keyboard samples), Mechanical, Typewriter, and Soft (synthesized via Web Audio API), plus **Custom** to design your own
- 🔇 **Site-specific muting** — silence the extension on any site without disabling it globally
- 🎚️ **Volume control** — fine-tune to your environment
- 🌓 **Light & dark mode**
- ⚡ **Zero latency** — sounds use the Web Audio API, not pre-loaded files
- 🚫 **No telemetry**, **no data collection** — everything is stored locally
- 🔒 **Private by design**

## Installation

1. Download or clone this repository: `git clone https://github.com/FellasK/aviva-type.git`
2. Open your browser and go to `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer Mode**
4. Click **Load Unpacked** and select the `aviva-type` folder
5. Done — start typing!

## Usage

Click the AvivaType icon in your browser toolbar to open the popup. From there you can:

- Toggle sounds on/off
- Adjust volume
- Choose a sound theme (click to preview)
- Design a custom theme with the built-in synthesizer
- Mute on the current site

## Sound Themes

| Theme | Description |
|---|---|
| **Default** | Real recordings of a membrane keyboard, with per-key audio samples |
| **Mechanical** | Synthesized click-clack — double-tap on Enter, wide thonk on Space |
| **Typewriter** | Retro percussive thump + a carriage-bell ding on Enter |
| **Soft** | Gentle sine tones — each key plays a different note |
| **Custom ✦** | Design your own: waveform, pitch, decay and brightness |

## Compatibility

Chrome 88+ and Microsoft Edge 88+.

## Credits

Made by [@Fellas](https://x.com/fanta_roxa) on X / [@FellasK](https://github.com/FellasK) on GitHub.

## License

All rights reserved. Redistribution or modification without explicit permission from the author is prohibited.
