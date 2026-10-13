// ============================================================
// AvivaType v1.0 — popup.js
// ============================================================

// --- Built-in presets (read-only) ---
const BUILT_IN_PRESETS = [
  { id: 'blip',  name: 'Blip',  oscType: 'square',   frequency: 440, decay: 75,  brightness: 1500 },
  { id: 'click', name: 'Click', oscType: 'noise',     frequency: 800, decay: 45,  brightness: 5000 },
  { id: 'thump', name: 'Thump', oscType: 'triangle',  frequency: 140, decay: 200, brightness: 700  },
];

// Keys that never produce a sound in the test input
const TEST_SKIP = new Set([
  'Shift','Control','Alt','Meta','Escape','CapsLock',
  'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
  'PageUp','PageDown','Home','End','Insert','NumLock','ScrollLock','Pause','PrintScreen'
]);

document.addEventListener('DOMContentLoaded', function () {

  // --- Elements ---
  const soundToggle    = document.getElementById('sound-toggle');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const volumeSlider   = document.getElementById('volume-slider');
  const volumeValue    = document.getElementById('volume-value');
  const statusLabel    = document.getElementById('status-label');
  const themePills     = document.querySelectorAll('.theme-pills .pill');
  const siteToggle     = document.getElementById('site-toggle');
  const currentSiteEl  = document.getElementById('current-site');

  const editorWrapper    = document.getElementById('editor-wrapper');
  const wavePills        = document.querySelectorAll('#wave-pills .pill');
  const pitchSlider      = document.getElementById('pitch-slider');
  const pitchValue       = document.getElementById('pitch-value');
  const decaySlider      = document.getElementById('decay-slider');
  const decayValue       = document.getElementById('decay-value');
  const brightnessSlider = document.getElementById('brightness-slider');
  const brightnessValue  = document.getElementById('brightness-value');

  const testInput = document.getElementById('test-input');
  const testDot   = document.getElementById('test-dot');

  const presetChipsEl     = document.getElementById('preset-chips');
  const presetSaveBtn     = document.getElementById('preset-save-btn');
  const presetNameWrapper = document.getElementById('preset-name-wrapper');
  const presetNameInput   = document.getElementById('preset-name-input');
  const presetNameConfirm = document.getElementById('preset-name-confirm');

  const ignoreToggle = document.getElementById('ignore-toggle');
  const keysEditBtn  = document.getElementById('keys-edit-btn');

  // --- State ---
  let currentHost    = '';
  let blockedSites   = [];
  let customTheme    = { oscType: 'sine', frequency: 440, decay: 150, brightness: 2000 };
  let customPresets  = [];
  let ignoreModifiers = true;
  let currentTheme   = 'default';

  // ============================================================
  // Init: hostname
  // ============================================================
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    try {
      currentHost = new URL(tabs[0].url).hostname;
      currentSiteEl.textContent = currentHost || '—';
    } catch {
      currentSiteEl.textContent = '—';
    }
    chrome.storage.sync.get('blockedSites', d => {
      siteToggle.checked = (d.blockedSites || []).includes(currentHost);
    });
  });

  // ============================================================
  // Init: load all settings
  // ============================================================
  chrome.storage.sync.get(
    ['soundActive','theme','volume','soundTheme','blockedSites','customTheme','customPresets','ignoreModifiers'],
    data => {
      const vol = data.volume ?? 50;
      volumeSlider.value = vol;
      volumeValue.textContent = `${vol}%`;
      setFill(volumeSlider, vol, 0, 100);

      const active = data.soundActive ?? true;
      soundToggle.checked = active;
      updateStatusLabel(active);

      applyUiTheme(data.theme || 'dark');

      currentTheme = data.soundTheme || 'default';
      setActivePill(themePills, 'theme', currentTheme);
      if (currentTheme === 'custom') openEditor(false);

      blockedSites = data.blockedSites || [];

      if (data.customTheme) {
        customTheme = data.customTheme;
        applyEditorValues(customTheme);
      }

      customPresets = data.customPresets || [];
      renderPresets();

      ignoreModifiers = data.ignoreModifiers ?? true;
      ignoreToggle.checked = ignoreModifiers;
      updateKeysBtn();
    }
  );

  // ============================================================
  // Controls
  // ============================================================
  soundToggle.addEventListener('change', () => {
    const active = soundToggle.checked;
    updateStatusLabel(active);
    chrome.storage.sync.set({ soundActive: active });
  });

  volumeSlider.addEventListener('input', () => {
    const vol = +volumeSlider.value;
    volumeValue.textContent = `${vol}%`;
    setFill(volumeSlider, vol, 0, 100);
    chrome.storage.sync.set({ volume: vol });
  });

  themeToggleBtn.addEventListener('click', () => {
    const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyUiTheme(next);
    chrome.storage.sync.set({ theme: next });
  });

  // ============================================================
  // Sound theme pills
  // ============================================================
  themePills.forEach(pill => {
    pill.addEventListener('click', function () {
      currentTheme = this.dataset.theme;
      setActivePill(themePills, 'theme', currentTheme);
      chrome.storage.sync.set({ soundTheme: currentTheme });
      if (currentTheme === 'custom') {
        openEditor(true);
      } else {
        closeEditor();
        previewThemeSound(currentTheme, 'Default');
      }
    });
  });

  siteToggle.addEventListener('change', () => {
    if (!currentHost) return;
    if (siteToggle.checked) {
      if (!blockedSites.includes(currentHost)) blockedSites = [...blockedSites, currentHost];
    } else {
      blockedSites = blockedSites.filter(s => s !== currentHost);
    }
    chrome.storage.sync.set({ blockedSites });
  });

  // ============================================================
  // Custom Editor
  // ============================================================
  wavePills.forEach(pill => {
    pill.addEventListener('click', function () {
      setActivePill(wavePills, 'wave', this.dataset.wave);
      customTheme.oscType = this.dataset.wave;
      saveCustomTheme();
    });
  });

  pitchSlider.addEventListener('input', () => {
    const v = +pitchSlider.value;
    pitchValue.textContent = `${v} Hz`;
    setFill(pitchSlider, v, 80, 1200);
    customTheme.frequency = v;
    saveCustomDebounced();
  });

  decaySlider.addEventListener('input', () => {
    const v = +decaySlider.value;
    decayValue.textContent = `${v} ms`;
    setFill(decaySlider, v, 30, 500);
    customTheme.decay = v;
    saveCustomDebounced();
  });

  brightnessSlider.addEventListener('input', () => {
    const v = +brightnessSlider.value;
    brightnessValue.textContent = `${v} Hz`;
    setFill(brightnessSlider, v, 200, 8000);
    customTheme.brightness = v;
    saveCustomDebounced();
  });

  // ============================================================
  // Test zone — previews the CURRENT active theme
  // ============================================================
  testInput.addEventListener('keydown', e => {
    if (TEST_SKIP.has(e.key)) return;
    if (e.key === 'Enter' || e.key === 'Tab') e.preventDefault();

    testDot.classList.remove('ping');
    void testDot.offsetWidth; // restart animation
    testDot.classList.add('ping');
    setTimeout(() => testDot.classList.remove('ping'), 130);

    previewThemeSound(currentTheme, e.key);
  });

  document.querySelector('.test-zone').addEventListener('click', () => testInput.focus());

  // ============================================================
  // Presets
  // ============================================================
  presetSaveBtn.addEventListener('click', () => {
    if (presetNameWrapper.classList.contains('open')) {
      closePresetInput();
    } else {
      presetNameWrapper.classList.add('open');
      presetSaveBtn.textContent = 'Cancel';
      setTimeout(() => presetNameInput.focus(), 150);
    }
  });

  presetNameConfirm.addEventListener('click', savePreset);
  presetNameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  savePreset();
    if (e.key === 'Escape') closePresetInput();
  });

  function savePreset() {
    const name = presetNameInput.value.trim();
    if (!name) return;
    customPresets = [...customPresets, { name, ...customTheme }];
    chrome.storage.sync.set({ customPresets });
    renderPresets();
    presetNameInput.value = '';
    closePresetInput();
  }

  function closePresetInput() {
    presetNameWrapper.classList.remove('open');
    presetSaveBtn.textContent = 'Save';
  }

  function renderPresets() {
    presetChipsEl.innerHTML = '';
    BUILT_IN_PRESETS.forEach(p => presetChipsEl.appendChild(makeChip(p.name, true,  () => loadPreset(p))));
    customPresets.forEach((p, i) => presetChipsEl.appendChild(makeChip(p.name, false, () => loadPreset(p), () => deletePreset(i))));
  }

  function makeChip(name, isBuiltin, onLoad, onDelete) {
    const chip = document.createElement('button');
    chip.className = 'preset-chip' + (isBuiltin ? ' builtin' : '');
    chip.appendChild(document.createTextNode(name));
    chip.addEventListener('click', onLoad);
    if (!isBuiltin && onDelete) {
      const del = document.createElement('button');
      del.className = 'preset-chip-del';
      del.textContent = '×';
      del.title = 'Delete';
      del.addEventListener('click', e => { e.stopPropagation(); onDelete(); });
      chip.appendChild(del);
    }
    return chip;
  }

  function loadPreset(preset) {
    customTheme = {
      oscType:    preset.oscType    || 'sine',
      frequency:  preset.frequency  || 440,
      decay:      preset.decay      || 150,
      brightness: preset.brightness || 2000,
    };
    applyEditorValues(customTheme);
    chrome.storage.sync.set({ customTheme });
    previewThemeSound('custom', 'Default');
  }

  function deletePreset(idx) {
    customPresets = customPresets.filter((_, i) => i !== idx);
    chrome.storage.sync.set({ customPresets });
    renderPresets();
  }

  // ============================================================
  // Ignore keys
  // ============================================================
  ignoreToggle.addEventListener('change', () => {
    ignoreModifiers = ignoreToggle.checked;
    chrome.storage.sync.set({ ignoreModifiers });
    updateKeysBtn();
  });

  keysEditBtn.addEventListener('click', () => {
    if (!ignoreModifiers) return;
    const uiTheme = document.body.getAttribute('data-theme') || 'dark';
    chrome.windows.create({
      url:     chrome.runtime.getURL('keyboard.html') + '?theme=' + uiTheme,
      type:    'popup',
      width:   777,
      height:  385,
      focused: true,
    });
  });

  // ============================================================
  // Helpers
  // ============================================================
  function updateStatusLabel(active) {
    statusLabel.textContent = active ? 'Sound On' : 'Sound Off';
    statusLabel.style.opacity = active ? '1' : '0.5';
  }

  function updateKeysBtn() {
    keysEditBtn.disabled = !ignoreModifiers;
  }

  function applyUiTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeToggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  function setActivePill(list, attr, value) {
    list.forEach(p => p.classList.toggle('active', p.dataset[attr] === value));
  }

  function openEditor(animate) {
    if (!animate) {
      editorWrapper.style.transition = 'none';
      editorWrapper.classList.add('open');
      requestAnimationFrame(() => { editorWrapper.style.transition = ''; });
    } else {
      editorWrapper.classList.add('open');
    }
  }

  function closeEditor() {
    editorWrapper.classList.remove('open');
    closePresetInput();
  }

  function setFill(slider, value, min, max) {
    slider.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
  }

  function applyEditorValues(ct) {
    setActivePill(wavePills, 'wave', ct.oscType || 'sine');
    const freq = ct.frequency || 440;
    pitchSlider.value = freq; pitchValue.textContent = `${freq} Hz`;
    setFill(pitchSlider, freq, 80, 1200);
    const decay = ct.decay || 150;
    decaySlider.value = decay; decayValue.textContent = `${decay} ms`;
    setFill(decaySlider, decay, 30, 500);
    const brightness = ct.brightness || 2000;
    brightnessSlider.value = brightness; brightnessValue.textContent = `${brightness} Hz`;
    setFill(brightnessSlider, brightness, 200, 8000);
  }

  let saveTimer = null;
  function saveCustomDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => chrome.storage.sync.set({ customTheme }), 300);
  }
  function saveCustomTheme() { chrome.storage.sync.set({ customTheme }); }

  // ============================================================
  // Sound preview — mirrors content.js exactly
  // ============================================================
  let previewCtx = null;
  function getCtx() {
    if (!previewCtx) previewCtx = new (window.AudioContext || window.webkitAudioContext)();
    return previewCtx;
  }

  let _noiseBuf = null;
  function getNoiseBuf(ctx) {
    if (_noiseBuf) return _noiseBuf;
    const len = ctx.sampleRate * 0.12;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    _noiseBuf = buf;
    return buf;
  }

  // Default theme: load actual mp3 files
  const previewBuffers = {};
  const MP3_MAP = { 'Enter':'typing-enter.mp3', ' ':'typing-space.mp3', 'Backspace':'typing-backspace.mp3', 'Default':'typing-sound.mp3' };

  async function previewDefaultSound(key) {
    const ctx = getCtx();
    const vol = +volumeSlider.value / 100;
    const fn  = MP3_MAP[key] || MP3_MAP['Default'];
    if (!previewBuffers[fn]) {
      try {
        const res = await fetch(chrome.runtime.getURL(fn));
        previewBuffers[fn] = await ctx.decodeAudioData(await res.arrayBuffer());
      } catch { return; }
    }
    const src = ctx.createBufferSource();
    const g   = ctx.createGain(); g.gain.value = vol;
    src.buffer = previewBuffers[fn];
    src.connect(g); g.connect(ctx.destination); src.start(0);
  }

  function previewThemeSound(theme, key = 'Default') {
    if (theme === 'default') { previewDefaultSound(key); return; }
    const ctx = getCtx();
    const vol = +volumeSlider.value / 100;
    const now = ctx.currentTime;
    if (theme === 'distinct' || theme === 'typewriter') _prevDistinct(ctx, vol, now, key);
    else if (theme === 'custom') _prevCustom(ctx, vol, now, key);
  }

  // ── Distinct (mirrors content.js playDistinct) ──
  function _prevDistinct(ctx, vol, now, key) {
    if (key === 'Enter') {
      const osc = ctx.createOscillator(); osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now); osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);
      const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 900; lpf.Q.value = 3;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.65, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(lpf); lpf.connect(g); g.connect(ctx.destination); osc.start(now); osc.stop(now + 0.1);
      const bell = ctx.createOscillator(); bell.type = 'sine'; bell.frequency.value = 1760;
      const bellG = ctx.createGain(); bellG.gain.setValueAtTime(vol * 0.10, now + 0.04); bellG.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      bell.connect(bellG); bellG.connect(ctx.destination); bell.start(now + 0.04); bell.stop(now + 0.33);
    } else if (key === ' ') {
      const osc = ctx.createOscillator(); osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(38, now + 0.08);
      const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 700; lpf.Q.value = 2;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.55, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(lpf); lpf.connect(g); g.connect(ctx.destination); osc.start(now); osc.stop(now + 0.1);
    } else if (key === 'Backspace') {
      const osc = ctx.createOscillator(); osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now); osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.45, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(g); g.connect(ctx.destination); osc.start(now); osc.stop(now + 0.05);
    } else {
      const osc = ctx.createOscillator(); osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, now); osc.frequency.exponentialRampToValueAtTime(42, now + 0.065);
      const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 1200; lpf.Q.value = 4;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.65, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(lpf); lpf.connect(g); g.connect(ctx.destination); osc.start(now); osc.stop(now + 0.09);
      const noise = ctx.createBufferSource(); noise.buffer = getNoiseBuf(ctx);
      const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 2000; bpf.Q.value = 2;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(vol * 0.16, now); ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      noise.connect(bpf); bpf.connect(ng); ng.connect(ctx.destination); noise.start(now); noise.stop(now + 0.03);
    }
  }

  // ── Custom (mirrors content.js playCustom) ──
  function _prevCustom(ctx, vol, now, key) {
    const ct = customTheme;
    const pitchMod = key === 'Enter' ? 0.7 : key === 'Backspace' ? 0.88 : key === ' ' ? 0.92 : 1.0;
    const decayMod = key === 'Enter' ? 1.5 : key === 'Backspace' ? 0.75 : 1.0;
    const freq      = (ct.frequency  || 440) * pitchMod;
    const decaySec  = ((ct.decay     || 150) * decayMod) / 1000;
    const brightness = ct.brightness || 2000;

    if (ct.oscType === 'noise') {
      const noise = ctx.createBufferSource(); noise.buffer = getNoiseBuf(ctx);
      const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = brightness; bpf.Q.value = 2;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.45, now); g.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);
      noise.connect(bpf); bpf.connect(g); g.connect(ctx.destination); noise.start(now); noise.stop(now + decaySec + 0.01);
    } else {
      const osc = ctx.createOscillator(); osc.type = ct.oscType || 'sine'; osc.frequency.value = freq;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = brightness;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol * 0.2, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);
      osc.connect(filter); filter.connect(g); g.connect(ctx.destination); osc.start(now); osc.stop(now + decaySec + 0.01);
    }
  }
});
