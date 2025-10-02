const INPUT_FIELD = document.getElementById('input-field');
const MODE = document.getElementById('mode');
const RENDER = document.getElementById('render');
const HISTORY_DROPDOWN = document.getElementById('history-dropdown');
const HISTORY_TOGGLE = document.getElementById('history-toggle');
const HISTORY_MENU = document.getElementById('history-menu');

const HISTORY_KEY = 'mini-mathpad-history-v8';
const MAX_HISTORY_SIZE = 30;
let historyStack = [];
let historySaveTimeout = null;

// LaTeX 到 Unicode 符號的映射表（包含帶空格和不帶空格的版本）
const LATEX_TO_UNICODE = {
  '\\sim ': '~',
  '\\sim': '~',
  '\\to ': '→',
  '\\to': '→',
  '\\land ': '∧',
  '\\land': '∧',
  '\\lor ': '∨',
  '\\lor': '∨',
  '\\equiv ': '≡',
  '\\equiv': '≡',
  '\\{': '{',
  '\\}': '}',
  '\\cup ': '∪',
  '\\cup': '∪',
  '\\setminus ': '∖',
  '\\setminus': '∖',
  '\\subseteq ': '⊆',
  '\\subseteq': '⊆',
  '\\cap ': '∩',
  '\\cap': '∩',
  '\\subset ': '⊂',
  '\\subset': '⊂',
  '\\in ': '∈',
  '\\in': '∈',
  '\\notin ': '∉',
  '\\notin': '∉',
  '\\exists ': '∃',
  '\\exists': '∃',
  '\\neg ': '¬',
  '\\neg': '¬',
  '\\oplus ': '⊕',
  '\\oplus': '⊕',
  '\\leftrightarrow ': '↔',
  '\\leftrightarrow': '↔',
  '\\uparrow ': '↑',
  '\\uparrow': '↑',
  '\\forall ': '∀',
  '\\forall': '∀',
  '\\neq ': '≠',
  '\\neq': '≠',
  '\\downarrow ': '↓',
  '\\downarrow': '↓',
  '\\leq ': '≤',
  '\\leq': '≤',
  '\\geq ': '≥',
  '\\geq': '≥',
  '\\vdash ': '⊢',
  '\\vdash': '⊢',
  '\\models ': '⊨',
  '\\models': '⊨',
  '\\Longrightarrow ': '⟹',
  '\\Longrightarrow': '⟹',
  '\\Longleftrightarrow ': '⟺',
  '\\Longleftrightarrow': '⟺'
};

// Unicode 到 LaTeX 的反向映射表（只保留帶空格的版本）
const UNICODE_TO_LATEX = {
  '~': '\\sim ',
  '→': '\\to ',
  '∧': '\\land ',
  '∨': '\\lor ',
  '≡': '\\equiv ',
  '{': '\\{',
  '}': '\\}',
  '∪': '\\cup ',
  '∖': '\\setminus ',
  '⊆': '\\subseteq ',
  '∩': '\\cap ',
  '⊂': '\\subset ',
  '∈': '\\in ',
  '∉': '\\notin ',
  '∃': '\\exists ',
  '¬': '\\neg ',
  '⊕': '\\oplus ',
  '↔': '\\leftrightarrow ',
  '↑': '\\uparrow ',
  '∀': '\\forall ',
  '≠': '\\neq ',
  '↓': '\\downarrow ',
  '≤': '\\leq ',
  '≥': '\\geq ',
  '⊢': '\\vdash ',
  '⊨': '\\models ',
  '⟹': '\\Longrightarrow ',
  '⟺': '\\Longleftrightarrow '
};

// 當前存儲的 LaTeX 代碼（用於複製和顯示）
let currentLatexCode = '';

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
    contentDiv.textContent = item.latex;
    
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
      if (MODE.value === 'latex') {
        currentLatexCode = item.latex;
        INPUT_FIELD.value = latexToUnicode(item.latex);
      } else {
        INPUT_FIELD.value = item.latex;
        currentLatexCode = '';
      }
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
  
  // 獲取當前光標位置
  const start = INPUT_FIELD.selectionStart;
  const end = INPUT_FIELD.selectionEnd;
  const currentValue = INPUT_FIELD.value || '';
  
  if (MODE.value === 'latex') {
    // LaTeX 模式：在輸入框顯示符號，在 LaTeX 代碼中記錄
    // 直接使用按鈕的 label（這就是符號）
    const displaySymbol = key.label;
    
    // 更新輸入框（顯示符號）
    INPUT_FIELD.value = currentValue.substring(0, start) + displaySymbol + currentValue.substring(end);
    
    // 更新 LaTeX 代碼
    const beforeLatex = unicodeToLatex(currentValue.substring(0, start));
    const afterLatex = unicodeToLatex(currentValue.substring(end));
    currentLatexCode = beforeLatex + latex + afterLatex;
    
    // 設置新的光標位置
    const newPos = start + displaySymbol.length;
    INPUT_FIELD.setSelectionRange(newPos, newPos);
  } else {
    // Unicode 模式：直接插入符號
    INPUT_FIELD.value = currentValue.substring(0, start) + unicode + currentValue.substring(end);
    currentLatexCode = INPUT_FIELD.value;
    
    // 設置新的光標位置
    const newPos = start + unicode.length;
    INPUT_FIELD.setSelectionRange(newPos, newPos);
  }
  
  INPUT_FIELD.focus();
  renderFormula();
}

// 將 Unicode 符號轉換回 LaTeX
function unicodeToLatex(text) {
  let result = text;
  for (const [unicode, latex] of Object.entries(UNICODE_TO_LATEX)) {
    result = result.split(unicode).join(latex);
  }
  return result;
}

// 將 LaTeX 轉換為 Unicode 符號（優先處理長命令）
function latexToUnicode(text) {
  if (!text) return '';
  let result = text;
  
  // 按命令長度排序，先處理長命令避免誤替換
  const sortedEntries = Object.entries(LATEX_TO_UNICODE).sort((a, b) => b[0].length - a[0].length);
  
  for (const [latexCmd, unicode] of sortedEntries) {
    // 使用全局替換
    while (result.includes(latexCmd)) {
      result = result.replace(latexCmd, unicode);
    }
  }
  
  return result;
}

function renderFormula(){
  // 下方顯示區始終顯示 LaTeX 代碼
  if (MODE.value === 'latex') {
    RENDER.textContent = currentLatexCode || '(空白)';
  } else {
    RENDER.textContent = INPUT_FIELD.value || '(空白)';
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

// 複製符號按鈕 - 始終複製輸入框中的符號
document.getElementById('copy-unicode').onclick = () => {
  const content = INPUT_FIELD.value || '';
  navigator.clipboard.writeText(content);
  showCopyFeedback('copy-unicode', '✓ 已複製符號');
};

// 複製 LaTeX 按鈕 - 複製對應的 LaTeX 代碼
document.getElementById('copy-latex').onclick = () => {
  const content = MODE.value === 'latex' ? currentLatexCode : unicodeToLatex(INPUT_FIELD.value);
  navigator.clipboard.writeText(content || '');
  showCopyFeedback('copy-latex', '✓ 已複製 LaTeX');
};

document.getElementById('clear').onclick = () => {
  const contentToSave = MODE.value === 'latex' ? currentLatexCode : INPUT_FIELD.value;
  if (contentToSave.trim()) {
    addToHistory(contentToSave, { cleared: true });
  }
  INPUT_FIELD.value = '';
  currentLatexCode = '';
  renderFormula();
};

function showCopyFeedback(buttonId, feedbackText = '✓ 已複製') {
  const button = document.getElementById(buttonId);
  const originalText = button.textContent;
  const originalBg = button.style.background;
  
  button.textContent = feedbackText;
  button.style.background = '#10b981'; // 綠色表示成功
  
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = originalBg;
  }, 1200);
}

const toggleOtherBtn = document.getElementById('toggle-other');
const otherKeysBody = document.getElementById('keys-other');
toggleOtherBtn.addEventListener('click', () => {
  const isHidden = otherKeysBody.classList.toggle('collapsed');
  toggleOtherBtn.textContent = isHidden ? '顯示' : '隱藏';
});

// 監聽模式切換
MODE.addEventListener('change', () => {
  if (MODE.value === 'latex') {
    // 切換到 LaTeX 模式：將輸入框內容轉換為符號顯示
    const currentValue = INPUT_FIELD.value;
    currentLatexCode = unicodeToLatex(currentValue);
    INPUT_FIELD.value = latexToUnicode(currentLatexCode);
  } else {
    // 切換到 Unicode 模式：保持輸入框內容不變
    currentLatexCode = '';
  }
  renderFormula();
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

// 註冊 Service Worker（開發環境下停用，避免快取干擾）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    if (isLocal) {
      // 解除現有 SW 並清快取
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      if (window.caches) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
      console.log('SW disabled in dev (localhost).');
      return;
    }
    navigator.serviceWorker.register('./sw.js?v=v8.0.2')
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

// 轉換輸入框中的 LaTeX 為符號
function convertInputToSymbols() {
  if (MODE.value === 'latex') {
    const currentValue = INPUT_FIELD.value;
    if (currentValue.includes('\\')) {
      // 保存原始 LaTeX 代碼
      currentLatexCode = currentValue;
      // 轉換為符號並更新輸入框
      const converted = latexToUnicode(currentLatexCode);
      INPUT_FIELD.value = converted;
      console.log('轉換:', currentLatexCode, '→', converted);
    } else {
      // 已經是符號，反向轉換得到 LaTeX
      currentLatexCode = unicodeToLatex(currentValue);
    }
    renderFormula();
  }
}

// 強制清理輸入框中的 LaTeX 代碼
function forceCleanInput() {
  if (MODE.value === 'latex' && INPUT_FIELD.value.includes('\\')) {
    const cursorPos = INPUT_FIELD.selectionStart;
    const original = INPUT_FIELD.value;
    const cleaned = latexToUnicode(original);
    INPUT_FIELD.value = cleaned;
    
    // 盡量保持光標位置
    const newPos = Math.min(cursorPos, cleaned.length);
    INPUT_FIELD.setSelectionRange(newPos, newPos);
    
    currentLatexCode = unicodeToLatex(cleaned);
    console.log('強制清理:', original, '→', cleaned);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateKeys();
  loadHistory();
  
  // 初始化：立即轉換任何 LaTeX 代碼
  setTimeout(() => {
    forceCleanInput();
  }, 50);
  
  renderFormula();
  
  // 監聽輸入事件 - 即時轉換 LaTeX 為符號
  INPUT_FIELD.addEventListener('input', (e) => {
    if (MODE.value === 'latex') {
      // 立即強制清理
      forceCleanInput();
    } else {
      currentLatexCode = '';
    }
    
    renderFormula();
    
    clearTimeout(historySaveTimeout);
    historySaveTimeout = setTimeout(() => {
      const contentToSave = MODE.value === 'latex' ? currentLatexCode : INPUT_FIELD.value;
      addToHistory(contentToSave);
    }, 1500);
  });
  
// 監聽模式切換：即時互轉
MODE.addEventListener('change', () => {
  if (MODE.value === 'latex') {
    // 將輸入框現有內容（可能是符號或殘留 LaTeX）統一清理到符號顯示
    forceCleanInput();
  } else {
    // 切到 Unicode 模式時，不做任何轉換，只清空 LaTeX 緩存
    currentLatexCode = '';
  }
  renderFormula();
});

// 監聽粘貼事件 - 立即轉換
  INPUT_FIELD.addEventListener('paste', (e) => {
    if (MODE.value === 'latex') {
      setTimeout(() => {
        forceCleanInput();
      }, 10);
    }
  });
  
  // 監聽失去焦點事件 - 確保清理
  INPUT_FIELD.addEventListener('blur', () => {
    if (MODE.value === 'latex') {
      forceCleanInput();
    }
  });
  
  // 定期檢查（每500ms），確保絕對沒有 LaTeX 代碼
  setInterval(() => {
    if (MODE.value === 'latex' && INPUT_FIELD.value.includes('\\')) {
      console.warn('檢測到 LaTeX 代碼，執行清理');
      forceCleanInput();
    }
  }, 500);
});
