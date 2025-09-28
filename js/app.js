const MF = document.getElementById('mf');
const MODE = document.getElementById('mode');
const RENDER = document.getElementById('render');
const HISTORY_DROPDOWN = document.getElementById('history-dropdown');
const HISTORY_TOGGLE = document.getElementById('history-toggle');
const HISTORY_MENU = document.getElementById('history-menu');

const HISTORY_KEY = 'mini-mathpad-history-v7';
const MAX_HISTORY_SIZE = 30;
let historyStack = [];
let historySaveTimeout = null;

const KEY_DATA = {
  common: [
    {label:'p'}, {label:'q'},
    {label:'~', latex:'\\sim '}, {label:'→', latex:'\\to '}, {label:'∧', latex:'\\land '}, {label:'∨', latex:'\\lor '},
    {label:'≡', latex:'\\equiv '}, {label:'[', latex:'['}, {label:']', latex:']'}, {label:'(', latex:'('}, {label:')', latex:')'}
  ],
  numbers: [
    {label:'7'}, {label:'8'}, {label:'9'},
    {label:'4'}, {label:'5'}, {label:'6'},
    {label:'1'}, {label:'2'}, {label:'3'},
    {label:'0'}
  ],
  other: [
    {label:'{', latex:'\\{'}, {label:'}', latex:'\\}'}, {label:'|', latex:'|'}, {label:'∪', latex:'\\cup '},
    {label:'∖', latex:'\\setminus '}, {label:'⊆', latex:'\\subseteq '}, {label:'∩', latex:'\\cap '}, {label:'⊂', latex:'\\subset '},
    {label:'∈', latex:'\\in '}, {label:'∉', latex:'\\notin '}, {label:'∃', latex:'\\exists '}, {label:'¬', latex:'\\neg '},
    {label:'⊕', latex:'\\oplus '}, {label:'↔', latex:'\\leftrightarrow '}, {label:'↑', latex:'\\uparrow '}, {label:'∀', latex:'\\forall '},
    {label:'=', latex:'='}, {label:'≠', latex:'\\neq '}, {label:'↓', latex:'\\downarrow '}, {label:'≤', latex:'\\leq '},
    {label:'≥', latex:'\\geq '}, {label:'⊢', latex:'\\vdash '}, {label:'⊨', latex:'\\models '}, {label:'⟹', latex:'\\Longrightarrow '},
    {label:'⟺', latex:'\\Longleftrightarrow '}
  ]
};

function loadHistory() {
  try {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      historyStack = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error("無法載入歷史紀錄", e);
    historyStack = [];
  }
  updateHistoryDropdown();
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyStack));
}

function addToHistory(latex, options = {}) {
  const trimmedLatex = latex.trim();
  if (!trimmedLatex) return;
  if (historyStack.length > 0 && historyStack[0].latex === trimmedLatex) return;

  historyStack.unshift({
    latex: trimmedLatex,
    cleared: options.cleared || false,
    timestamp: Date.now()
  });

  if (historyStack.length > MAX_HISTORY_SIZE) {
    historyStack.pop();
  }

  saveHistory();
  updateHistoryDropdown();
}

function updateHistoryDropdown() {
  HISTORY_MENU.innerHTML = '';
  HISTORY_DROPDOWN.style.display = 'block'; // Always show the dropdown button

  if (historyStack.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'history-item';
    emptyItem.textContent = '暫無歷史紀錄';
    emptyItem.style.color = 'var(--muted)';
    emptyItem.style.cursor = 'default';
    emptyItem.style.fontStyle = 'italic';
    HISTORY_MENU.appendChild(emptyItem);
    return;
  }

  historyStack.forEach(item => {
    const historyItemEl = document.createElement('div');
    historyItemEl.className = 'history-item';
    
    const contentDiv = document.createElement('div');
    contentDiv.style.flex = '1';
    
    try {
      contentDiv.innerHTML = katex.renderToString(item.latex, {
        throwOnError: false,
        displayMode: false
      });
    } catch (e) {
      contentDiv.textContent = item.latex;
    }
    
    historyItemEl.appendChild(contentDiv);
    
    if (item.cleared) {
      const trashIcon = document.createElement('span');
      trashIcon.textContent = '🗑️';
      trashIcon.style.fontSize = '16px';
      trashIcon.style.flexShrink = '0';
      trashIcon.style.marginLeft = '8px';
      historyItemEl.appendChild(trashIcon);
    }

    historyItemEl.addEventListener('click', () => {
      MF.setValue(item.latex);
      renderFormula();
      HISTORY_MENU.style.display = 'none';
    });
    
    HISTORY_MENU.appendChild(historyItemEl);
  });
}


function createKeyBtn(key){
  const btn = document.createElement('button');
  btn.className = 'key';
  btn.textContent = key.label;
  btn.dataset.key = key.label;
  btn.addEventListener('click', () => insertToken(key));
  return btn;
}

function insertToken(key){
  const latex = key.latex ?? key.label;
  const unicode = key.uni ?? key.label;
  if (MODE.value === 'latex') {
    // Use MathLive's insert method to correctly handle spacing
    MF.insert(latex, { insertionMode: 'insertPast', selectionMode: 'after' });
  } else {
    // For plain text, direct manipulation is fine
    MF.value = (MF.value||'') + unicode;
  }
  MF.focus();
  renderFormula();
}

function renderFormula(){
  RENDER.innerHTML = '';
  try{
    katex.render(MF.getValue('latex-expanded') || '\\;', RENDER);
  }catch(err){
    RENDER.textContent = 'LaTeX 錯誤：' + err.message;
  }
}

function populateKeys() {
  const commonContainer = document.getElementById('keys-common');
  const numbersContainer = document.getElementById('keys-numbers');
  const otherContainer = document.getElementById('keys-other');
  
  KEY_DATA.common.forEach(k => commonContainer.appendChild(createKeyBtn(k)));
  KEY_DATA.numbers.forEach(k => numbersContainer.appendChild(createKeyBtn(k)));
  KEY_DATA.other.forEach(k => otherContainer.appendChild(createKeyBtn(k)));
}

document.getElementById('copy-latex').onclick = () => navigator.clipboard.writeText(MF.getValue('latex-expanded')||'');
document.getElementById('copy-unicode').onclick = () => navigator.clipboard.writeText(MF.value||'');
document.getElementById('clear').onclick = () => {
  const currentLatex = MF.getValue();
  if (currentLatex.trim()) {
    addToHistory(currentLatex, { cleared: true });
  }
  MF.setValue(''); 
  MF.value=''; 
  renderFormula();
};

const toggleOtherBtn = document.getElementById('toggle-other');
const otherKeysBody = document.getElementById('keys-other');
toggleOtherBtn.addEventListener('click', () => {
  const isHidden = otherKeysBody.classList.toggle('collapsed');
  toggleOtherBtn.textContent = isHidden ? '顯示' : '隱藏';
});

HISTORY_TOGGLE.addEventListener('click', () => {
  const isHidden = HISTORY_MENU.style.display === 'none';
  HISTORY_MENU.style.display = isHidden ? 'block' : 'none';
});

document.addEventListener('click', (e) => {
  if (!HISTORY_DROPDOWN.contains(e.target)) {
    HISTORY_MENU.style.display = 'none';
  }
});


// PWA 功能
let deferredPrompt;
let installButton = null;

// 註冊 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA 安裝提示
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  if (!installButton) {
    installButton = document.createElement('button');
    installButton.textContent = '📱 安裝應用';
    installButton.className = 'install-btn';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      background: var(--accent);
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(96,165,250,0.4);
      cursor: pointer;
      transition: transform 0.2s ease;
    `;
    
    installButton.onmouseover = () => installButton.style.transform = 'scale(1.05)';
    installButton.onmouseout = () => installButton.style.transform = 'scale(1)';
    
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installButton.remove();
        installButton = null;
      }
    });
    
    document.body.appendChild(installButton);
    
    // 10秒後自動隱藏安裝按鈕
    setTimeout(() => {
      if (installButton) {
        installButton.style.opacity = '0.7';
      }
    }, 10000);
  }
}

// 監聽應用安裝事件
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  if (installButton) {
    installButton.remove();
    installButton = null;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  populateKeys();
  loadHistory();
  renderFormula();
  MF.addEventListener('input', () => {
    renderFormula();
    clearTimeout(historySaveTimeout);
    historySaveTimeout = setTimeout(() => {
      addToHistory(MF.getValue());
    }, 1500);
  });
});
