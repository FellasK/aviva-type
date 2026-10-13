// ============================================================
// AvivaType — keyboard.js
// 75% keyboard popup — click keys to toggle ignored status
// ============================================================

// Default ignored keys (matches background.js defaults)
const DEFAULT_IGNORED = [
  'Escape','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
  'PrintScreen','Insert','Delete','Home','End','PageUp','PageDown',
  'CapsLock','Tab','Shift','Control','Alt','Meta',
  'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
];

// ── 75% keyboard layout ──────────────────────────────────────
// Each key: { key: event.key value, label: display, flex: width unit }
// null key = invisible spacer (gap between key groups)
const ROWS = [
  // ── Function row ──
  {
    cls: 'fn-row',
    keys: [
      { key:'Escape',      label:'Esc',   flex:1   },
      { key:null,                         flex:0.5  },
      { key:'F1',          label:'F1',    flex:0.9 },
      { key:'F2',          label:'F2',    flex:0.9 },
      { key:'F3',          label:'F3',    flex:0.9 },
      { key:'F4',          label:'F4',    flex:0.9 },
      { key:null,                         flex:0.2  },
      { key:'F5',          label:'F5',    flex:0.9 },
      { key:'F6',          label:'F6',    flex:0.9 },
      { key:'F7',          label:'F7',    flex:0.9 },
      { key:'F8',          label:'F8',    flex:0.9 },
      { key:null,                         flex:0.2  },
      { key:'F9',          label:'F9',    flex:0.9 },
      { key:'F10',         label:'F10',   flex:0.9 },
      { key:'F11',         label:'F11',   flex:0.9 },
      { key:'F12',         label:'F12',   flex:0.9 },
      { key:null,                         flex:0.2  },
      { key:'PrintScreen', label:'PrtSc', flex:1   },
      { key:'Insert',      label:'Ins',   flex:1   },
      { key:'Delete',      label:'Del',   flex:1   },
    ],
  },

  // ── Number row ──
  {
    keys: [
      { key:'`',         label:'~',         flex:1   },
      { key:'1',         label:'1',         flex:1   },
      { key:'2',         label:'2',         flex:1   },
      { key:'3',         label:'3',         flex:1   },
      { key:'4',         label:'4',         flex:1   },
      { key:'5',         label:'5',         flex:1   },
      { key:'6',         label:'6',         flex:1   },
      { key:'7',         label:'7',         flex:1   },
      { key:'8',         label:'8',         flex:1   },
      { key:'9',         label:'9',         flex:1   },
      { key:'0',         label:'0',         flex:1   },
      { key:'-',         label:'−',         flex:1   },
      { key:'=',         label:'=',         flex:1   },
      { key:'Backspace', label:'⌫ Bksp',   flex:2   },
      { key:'Home',      label:'Home',      flex:1   },
    ],
  },

  // ── QWERTY row ──
  {
    keys: [
      { key:'Tab',       label:'Tab',  flex:1.5 },
      { key:'q',         label:'Q',    flex:1   },
      { key:'w',         label:'W',    flex:1   },
      { key:'e',         label:'E',    flex:1   },
      { key:'r',         label:'R',    flex:1   },
      { key:'t',         label:'T',    flex:1   },
      { key:'y',         label:'Y',    flex:1   },
      { key:'u',         label:'U',    flex:1   },
      { key:'i',         label:'I',    flex:1   },
      { key:'o',         label:'O',    flex:1   },
      { key:'p',         label:'P',    flex:1   },
      { key:'[',         label:'[',    flex:1   },
      { key:']',         label:']',    flex:1   },
      { key:'\\',        label:'\\',   flex:1.5 },
      { key:'End',       label:'End',  flex:1   },
    ],
  },

  // ── Home row (ASDF) ──
  {
    keys: [
      { key:'CapsLock',  label:'Caps',  flex:1.75 },
      { key:'a',         label:'A',     flex:1    },
      { key:'s',         label:'S',     flex:1    },
      { key:'d',         label:'D',     flex:1    },
      { key:'f',         label:'F',     flex:1    },
      { key:'g',         label:'G',     flex:1    },
      { key:'h',         label:'H',     flex:1    },
      { key:'j',         label:'J',     flex:1    },
      { key:'k',         label:'K',     flex:1    },
      { key:'l',         label:'L',     flex:1    },
      { key:';',         label:';',     flex:1    },
      { key:"'",         label:"'",     flex:1    },
      { key:'Enter',     label:'Enter', flex:2.25 },
      { key:'PageUp',    label:'PgUp',  flex:1    },
    ],
  },

  // ── Shift row ──
  {
    keys: [
      { key:'Shift',      label:'⇧ Shift', flex:2.25 },
      { key:'z',          label:'Z',       flex:1    },
      { key:'x',          label:'X',       flex:1    },
      { key:'c',          label:'C',       flex:1    },
      { key:'v',          label:'V',       flex:1    },
      { key:'b',          label:'B',       flex:1    },
      { key:'n',          label:'N',       flex:1    },
      { key:'m',          label:'M',       flex:1    },
      { key:',',          label:',',       flex:1    },
      { key:'.',          label:'.',       flex:1    },
      { key:'/',          label:'/',       flex:1    },
      { key:'Shift',      label:'Shift ⇧', flex:1.75 },
      { key:'ArrowUp',    label:'↑',       flex:1    },
      { key:'PageDown',   label:'PgDn',    flex:1    },
    ],
  },

  // ── Bottom row ──
  {
    keys: [
      { key:'Control',    label:'Ctrl',   flex:1.25 },
      { key:'Meta',       label:'Win',    flex:1.25 },
      { key:'Alt',        label:'Alt',    flex:1.25 },
      { key:' ',          label:'',       flex:5.5,  cls:'key-space' },
      { key:'Alt',        label:'Alt',    flex:1.25 },
      { key:'Control',    label:'Ctrl',   flex:1.25 },
      { key:'Meta',       label:'Fn',     flex:1.25 },
      { key:'ArrowLeft',  label:'←',      flex:1    },
      { key:'ArrowDown',  label:'↓',      flex:1    },
      { key:'ArrowRight', label:'→',      flex:1    },
    ],
  },
];

// ── State ──────────────────────────────────────────────────
let ignoredKeys = [];

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['ignoredKeys', 'theme'], (data) => {
    ignoredKeys = data.ignoredKeys || [...DEFAULT_IGNORED];
    document.body.setAttribute('data-theme', data.theme || 'dark');
    renderKeyboard();
    updateCount();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) {
      document.body.setAttribute('data-theme', changes.theme.newValue);
    }
    if (changes.ignoredKeys) {
      ignoredKeys = changes.ignoredKeys.newValue;
      refreshHighlights();
      updateCount();
    }
  });

  document.getElementById('kp-reset').addEventListener('click', () => {
    ignoredKeys = [...DEFAULT_IGNORED];
    chrome.storage.sync.set({ ignoredKeys });
    refreshHighlights();
    updateCount();
  });
});

// ── Render ─────────────────────────────────────────────────
function renderKeyboard() {
  const kb = document.getElementById('keyboard');
  kb.innerHTML = '';

  ROWS.forEach(rowDef => {
    const row = document.createElement('div');
    row.className = 'kb-row' + (rowDef.cls ? ' ' + rowDef.cls : '');

    rowDef.keys.forEach(k => {
      const el = document.createElement('div');
      el.style.flex = k.flex;

      if (k.key === null) {
        // invisible spacer
        el.className = 'kb-spacer';
      } else {
        el.className = 'key' + (k.cls ? ' ' + k.cls : '');
        el.textContent = k.label || '';
        el.dataset.keyValue = k.key;

        if (ignoredKeys.includes(k.key)) el.classList.add('active');

        el.addEventListener('click', () => toggleKey(k.key));
      }

      row.appendChild(el);
    });

    kb.appendChild(row);
  });
}

// ── Toggle a key ───────────────────────────────────────────
function toggleKey(keyValue) {
  if (ignoredKeys.includes(keyValue)) {
    ignoredKeys = ignoredKeys.filter(k => k !== keyValue);
  } else {
    ignoredKeys = [...ignoredKeys, keyValue];
  }
  chrome.storage.sync.set({ ignoredKeys });
  refreshHighlights();
  updateCount();
}

// ── Refresh all key highlights ─────────────────────────────
function refreshHighlights() {
  document.querySelectorAll('.key[data-key-value]').forEach(el => {
    el.classList.toggle('active', ignoredKeys.includes(el.dataset.keyValue));
  });
}

// ── Update count label ─────────────────────────────────────
function updateCount() {
  const n = ignoredKeys.length;
  const el = document.getElementById('kp-count');
  el.textContent = n === 0
    ? 'No keys silenced'
    : `${n} key${n === 1 ? '' : 's'} silenced`;
}
