const DEFAULTS = {
  soundActive: true,
  volume: 50,
  theme: 'dark',
  soundTheme: 'default',
  blockedSites: [],
  customPresets: [],
  ignoreModifiers: true,
  ignoredKeys: [
    'Shift', 'Control', 'CapsLock', 'Tab', 'Meta', 'Alt',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
  ]
};

// get() with an object fills only missing keys with defaults; existing user settings are kept.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (settings) => chrome.storage.sync.set(settings));
});
