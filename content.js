// ============================================================
// AvivaType v1.0 — content.js
// ============================================================

// --- State ---
let soundActive    = true;
let volume         = 50;
let soundTheme     = 'default';
let blockedSites   = [];
let customTheme    = { oscType: 'sine', frequency: 440, decay: 150, brightness: 2000 };
let ignoreModifiers = true;
let ignoredKeysSet  = new Set([
  'Shift', 'Control', 'CapsLock', 'Tab', 'Meta', 'Alt',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'
]);

// --- AudioContext (shared, lazy) ---
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// --- Buffer cache for Default theme ---
const bufferCache = {};
const MP3_SOUND_MAP = {
  'Enter':     'typing-enter.mp3',
  ' ':         'typing-space.mp3',
  'Backspace': 'typing-backspace.mp3',
  'Default':   'typing-sound.mp3'
};

// ============================================================
// Default theme — decode mp3 once, play from buffer cache
// ============================================================
async function loadBuffer(filename) {
  if (bufferCache[filename]) return bufferCache[filename];
  try {
    const url  = chrome.runtime.getURL(filename);
    const res  = await fetch(url);
    const ab   = await res.arrayBuffer();
    const buf  = await getAudioCtx().decodeAudioData(ab);
    bufferCache[filename] = buf;
    return buf;
  } catch { return null; }
}

function playBuffer(buffer) {
  if (!buffer) return;
  const ctx = getAudioCtx();
  const src = ctx.createBufferSource();
  const g   = ctx.createGain();
  g.gain.value = volume / 100;
  src.buffer = buffer;
  src.connect(g); g.connect(ctx.destination);
  src.start(0);
}

async function playDefaultSound(key) {
  const filename = MP3_SOUND_MAP[key] || MP3_SOUND_MAP['Default'];
  playBuffer(await loadBuffer(filename));
}

// ============================================================
// Shared noise buffer
// ============================================================
let noiseBuffer = null;
function getNoiseBuffer(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const len  = ctx.sampleRate * 0.12;
  const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

// ============================================================
// Distinct theme (formerly Typewriter)
// Per-key:
//   Regular — triangle oscillator with LPF + noise snap
//   Space   — softer low thonk
//   Enter   — low clunk + typewriter bell ring
//   Backspace — bright upward pitch
// ============================================================
function playDistinct(key) {
  const ctx = getAudioCtx();
  const vol = volume / 100;
  const now = ctx.currentTime;

  if (key === 'Enter') {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 900; lpf.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.65, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
    // Bell ring
    const bell = ctx.createOscillator();
    bell.type = 'sine'; bell.frequency.value = 1760;
    const bellG = ctx.createGain();
    bellG.gain.setValueAtTime(vol * 0.10, now + 0.04);
    bellG.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    bell.connect(bellG); bellG.connect(ctx.destination);
    bell.start(now + 0.04); bell.stop(now + 0.33);

  } else if (key === ' ') {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.08);
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 700; lpf.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.55, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);

  } else if (key === 'Backspace') {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.45, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.05);

  } else {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.065);
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 1200; lpf.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.65, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.09);
    // Snap transient
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 2000; bpf.Q.value = 2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.16, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    noise.connect(bpf); bpf.connect(ng); ng.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.03);
  }
}

// ============================================================
// Custom theme
// ============================================================
function playCustom(key) {
  const ctx = getAudioCtx();
  const vol = volume / 100;
  const now = ctx.currentTime;
  const ct  = customTheme;

  const pitchMod = key === 'Enter' ? 0.7 : key === 'Backspace' ? 0.88 : key === ' ' ? 0.92 : 1.0;
  const decayMod = key === 'Enter' ? 1.5 : key === 'Backspace' ? 0.75 : 1.0;

  const freq      = (ct.frequency  || 440) * pitchMod;
  const decaySec  = ((ct.decay     || 150) * decayMod) / 1000;
  const brightness = ct.brightness || 2000;

  if (ct.oscType === 'noise') {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = brightness; bpf.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.45, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);
    noise.connect(bpf); bpf.connect(g); g.connect(ctx.destination);
    noise.start(now); noise.stop(now + decaySec + 0.01);
  } else {
    const osc = ctx.createOscillator();
    osc.type = ct.oscType || 'sine'; osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = brightness;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol * 0.2, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);
    osc.connect(filter); filter.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + decaySec + 0.01);
  }
}

// ============================================================
// Main dispatcher
// ============================================================
function playTypingSound(key) {
  if (!soundActive) return;
  switch (soundTheme) {
    case 'distinct':
    case 'typewriter': // legacy alias
      playDistinct(key); break;
    case 'custom':
      playCustom(key); break;
    default:
      playDefaultSound(key); break;
  }
}

// ============================================================
// Site-blocking check
// ============================================================
function isCurrentSiteBlocked() {
  try {
    const host = window.location.hostname;
    return blockedSites.some(site => host === site || host.endsWith('.' + site));
  } catch { return false; }
}

// ============================================================
// DOM listener management
// ============================================================
function handleKeyDown(event) {
  if (isCurrentSiteBlocked()) return;
  if (ignoreModifiers && ignoredKeysSet.has(event.key)) return;
  playTypingSound(event.key);
}

function addListener(el) {
  if (el.dataset.avivaTypeAttached) return;
  el.addEventListener('keydown', handleKeyDown);
  el.dataset.avivaTypeAttached = 'true';
}

function init() {
  const selector = [
    'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
    ':not([type="submit"]):not([type="button"])',
    ', textarea',
    ', [contenteditable="true"]'
  ].join('');

  document.querySelectorAll(selector).forEach(addListener);

  const observer = new MutationObserver(mutations => {
    for (const { type, addedNodes } of mutations) {
      if (type !== 'childList') continue;
      for (const node of addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches?.(selector)) addListener(node);
        node.querySelectorAll?.(selector).forEach(addListener);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ============================================================
// Load settings & live updates
// ============================================================
chrome.storage.sync.get(
  ['soundActive','volume','soundTheme','blockedSites','customTheme','ignoreModifiers','ignoredKeys'],
  data => {
    if (data.soundActive     !== undefined) soundActive     = data.soundActive;
    if (data.volume          !== undefined) volume          = data.volume;
    if (data.soundTheme      !== undefined) soundTheme      = data.soundTheme;
    if (data.blockedSites    !== undefined) blockedSites    = data.blockedSites;
    if (data.customTheme     !== undefined) customTheme     = data.customTheme;
    if (data.ignoreModifiers !== undefined) ignoreModifiers = data.ignoreModifiers;
    if (data.ignoredKeys     !== undefined) ignoredKeysSet  = new Set(data.ignoredKeys);
  }
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.soundActive)     soundActive     = changes.soundActive.newValue;
  if (changes.volume)          volume          = changes.volume.newValue;
  if (changes.soundTheme)      soundTheme      = changes.soundTheme.newValue;
  if (changes.blockedSites)    blockedSites    = changes.blockedSites.newValue;
  if (changes.customTheme)     customTheme     = changes.customTheme.newValue;
  if (changes.ignoreModifiers) ignoreModifiers = changes.ignoreModifiers.newValue;
  if (changes.ignoredKeys)     ignoredKeysSet  = new Set(changes.ignoredKeys.newValue);
});

// ============================================================
// Boot
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
