const INPUT_FIELD = document.getElementById('input-field');
const MODE = document.getElementById('mode');
const RENDER = document.getElementById('render');
const HISTORY_DROPDOWN = document.getElementById('history-dropdown');
const HISTORY_TOGGLE = document.getElementById('history-toggle');
const HISTORY_MENU = document.getElementById('history-menu');
const ERROR_HINT = document.getElementById('error-hint');
const LINE_NUMBERS = document.getElementById('line-numbers');
const MATRIX_STYLE_SELECTOR = document.getElementById('matrix-style-selector');
const MATRIX_STYLE = document.getElementById('matrix-style');
const ALLOW_OSK = document.getElementById('allow-osk');

const HISTORY_KEY = 'mini-mathpad-history-v9';
const MAX_HISTORY_SIZE = 30;
let historyStack = [];
let historySaveTimeout = null;
let longPressTimer = null;
let isLongPress = false;
let breathingLineTimeout = null;

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
    {label:'p'}, {label:'q'}, {label:'~', latex:'\\sim '}, {label:'→', latex:'\\to '},
    {label:'∧', latex:'\\land '}, {label:'∨', latex:'\\lor '}, {label:'(', latex:'('}, {label:')', latex:')'},
    {label:'[', latex:'['}, {label:']', latex:']'}, {label:'t'}, {label:'r'},
    {label:'f'}, {label:'s'}, {label:'≡', latex:'\\equiv '}, {label:'---', latex:'---\n', isDivider: true},
    {label:'↵', latex:'\n', isNewline: true}
  ],
  matrix: [
    {label:'1'}, {label:'2'}, {label:'3'}, {label:'-'},
    {label:'4'}, {label:'5'}, {label:'6'}, {label:'|', isRowSep: true},
    {label:'7'}, {label:'8'}, {label:'9'}, {label:' ', label_display:'空格'},
    {label:'0'}, {label:'.'}, {label:'↵', latex:'\n', isNewline: true}, {label:'⌫', isBackspace: true}
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
  ],
  matrixOther: [
    {label:'+'}, {label:'-'}, {label:'×', latex:'\\times '}, {label:'·', latex:'\\cdot '},
    {label:'='}, {label:'≠', latex:'\\neq '}, {label:'A'}, {label:'B'},
    {label:'C'}, {label:'D'}, {label:'E'}, {label:'F'},
    {label:'^', latex:'^'}, {label:'T', latex:'^T'}, {label:'⁻¹', latex:'^{-1}'}, {label:'det', latex:'\\det'}
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

// 獲取歷史紀錄顯示文字（智慧摘要）
function getHistoryDisplayText(latex) {
  // 如果包含 | （可能是矩陣），檢查是否為矩陣格式
  if (latex.includes('|')) {
    const matrixData = parseMatrixInput(latex);
    if (matrixData) {
      return `[矩陣] ${matrixData.rows}×${matrixData.cols}`;
    }
  }
  
  // 如果包含換行（證明樹內容），顯示摘要
  if (latex.includes('\n')) {
    const lines = latex.split('\n').map(s => s.trim()).filter(Boolean);
    const sepIndex = lines.findIndex(l => /^-{3,}$/.test(l));
    
    if (sepIndex >= 0) {
      const premises = lines.slice(0, sepIndex);
      const conclusion = lines[sepIndex + 1] || '';
      return `[樹] ${premises.slice(0, 2).join(', ')}${premises.length > 2 ? '...' : ''} ⇒ ${conclusion}`;
    } else {
      // 只有前提
      return `[樹] ${lines.slice(0, 2).join(', ')}${lines.length > 2 ? '...' : ''}`;
    }
  }
  
  // 如果是 bussproofs LaTeX，顯示摘要
  if (latex.includes('\\begin{prooftree}')) {
    return '[樹] (LaTeX 證明樹)';
  }
  
  // 普通內容，截斷過長文字
  return latex.length > 50 ? latex.substring(0, 50) + '...' : latex;
}

// 載入歷史紀錄項目（智慧適配當前模式）
function loadHistoryItem(latex) {
  if (MODE.value === 'latex') {
    currentLatexCode = latex;
    INPUT_FIELD.value = latexToUnicode(latex);
  } else if (MODE.value === 'prooftree') {
    // 證明樹模式：直接載入原始輸入
    INPUT_FIELD.value = latex;
    currentLatexCode = '';
    autoResizeTextarea();
  } else if (MODE.value === 'matrix') {
    // 矩陣模式：直接載入原始輸入
    INPUT_FIELD.value = latex;
    currentLatexCode = '';
  } else {
    // Unicode 模式
    INPUT_FIELD.value = latex;
    currentLatexCode = '';
  }
  renderFormula();
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
    
    // 顯示摘要：證明樹模式顯示前提摘要，其他模式顯示原始內容
    const displayText = getHistoryDisplayText(item.latex);
    contentDiv.textContent = displayText;
    
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
      loadHistoryItem(item.latex);
      HISTORY_MENU.style.display = 'none';
    });
    
    HISTORY_MENU.appendChild(historyItemEl);
  });
}


function createKeyBtn(key){
  const btn = document.createElement('button');
  btn.className = 'key';
  btn.textContent = key.label_display || key.label;
  btn.dataset.key = key.label;
  
  // 特殊樣式
  if (key.isNewline) {
    btn.classList.add('key-newline');
  }
  if (key.isDivider) {
    btn.classList.add('key-divider');
  }
  if (key.isRowSep) {
    btn.classList.add('key-rowsep');
  }
  if (key.isBackspace) {
    btn.classList.add('key-backspace');
  }
  
  // 長按功能：針對字母按鈕（p, q, t, r, f, s）切換大小寫
  const isLetterKey = /^[pqtrfs]$/.test(key.label);
  
  // 普通點擊（優先處理，確保響應迅速）
  btn.addEventListener('click', (e) => {
    // 防止焦點轉移到輸入框（僅在禁止 OSK 時）
    if (!ALLOW_OSK?.checked) {
      e.preventDefault();
      // 保持按鈕焦點，防止輸入框獲得焦點
      btn.focus();
      // 立即失焦，避免按鈕保持焦點狀態
      setTimeout(() => btn.blur(), 10);
    }
    
    if (!isLongPress) {
      insertToken(key);
    }
    isLongPress = false;
  });
  
  // 長按功能（僅字母按鈕）
  if (isLetterKey) {
    // 觸控裝置
    btn.addEventListener('touchstart', (e) => {
      isLongPress = false;
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        const upperKey = {label: key.label.toUpperCase(), latex: key.label.toUpperCase()};
        insertToken(upperKey);
        navigator.vibrate && navigator.vibrate(50);
      }, 500);
    }, {passive: true});
    
    btn.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
    });
    
    btn.addEventListener('touchcancel', () => {
      clearTimeout(longPressTimer);
      isLongPress = false;
    });
    
    // 滑鼠裝置
    btn.addEventListener('mousedown', () => {
      isLongPress = false;
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        const upperKey = {label: key.label.toUpperCase(), latex: key.label.toUpperCase()};
        insertToken(upperKey);
      }, 500);
    });
    
    btn.addEventListener('mouseup', () => {
      clearTimeout(longPressTimer);
    });
    
    btn.addEventListener('mouseleave', () => {
      clearTimeout(longPressTimer);
      isLongPress = false;
    });
  }
  
  return btn;
}

function insertToken(key){
  const latex = key.latex ?? key.label;
  const unicode = key.uni ?? key.label;
  
  // 暫時移除 readonly 以允許程式化插入（只在禁止 OSK 時需要）
  const wasReadonly = INPUT_FIELD.hasAttribute('readonly');
  if (wasReadonly && !ALLOW_OSK?.checked) {
    INPUT_FIELD.removeAttribute('readonly');
  }
  
  // 獲取當前光標位置
  const start = INPUT_FIELD.selectionStart;
  const end = INPUT_FIELD.selectionEnd;
  const currentValue = INPUT_FIELD.value || '';
  
  if (MODE.value === 'latex') {
    // LaTeX 模式：在輸入框顯示符號，在 LaTeX 代碼中記錄
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
  } else if (MODE.value === 'prooftree') {
    // 證明樹模式：特殊處理換行和橫線
    if (key.isNewline) {
      // 換行按鈕：插入換行並添加呼吸效果
      INPUT_FIELD.value = currentValue.substring(0, start) + '\n' + currentValue.substring(end);
      const newPos = start + 1;
      INPUT_FIELD.setSelectionRange(newPos, newPos);
      
      // 應用呼吸效果
      applyBreathingEffect();
    } else if (key.isDivider) {
      // 橫線按鈕：計算並插入適當長度的橫線
      const divider = calculateDividerWidth();
      INPUT_FIELD.value = currentValue.substring(0, start) + '\n' + divider + '\n' + currentValue.substring(end);
      const newPos = start + divider.length + 2;
      INPUT_FIELD.setSelectionRange(newPos, newPos);
    } else {
      // 普通符號
      INPUT_FIELD.value = currentValue.substring(0, start) + unicode + currentValue.substring(end);
      const newPos = start + unicode.length;
      INPUT_FIELD.setSelectionRange(newPos, newPos);
    }
    
    // 調整 textarea 高度和更新行號
    autoResizeTextarea();
    updateLineNumbers();
  } else if (MODE.value === 'matrix') {
    // 矩陣模式：特殊處理
    if (key.isBackspace) {
      // 退格按鈕
      if (start > 0) {
        INPUT_FIELD.value = currentValue.substring(0, start - 1) + currentValue.substring(end);
        INPUT_FIELD.setSelectionRange(start - 1, start - 1);
      }
    } else if (key.isRowSep) {
      // 行分隔符 |：插入 | 並自動換行
      INPUT_FIELD.value = currentValue.substring(0, start) + ' | ' + currentValue.substring(end);
      const newPos = start + 3;
      INPUT_FIELD.setSelectionRange(newPos, newPos);
    } else {
      // 普通輸入
      INPUT_FIELD.value = currentValue.substring(0, start) + unicode + currentValue.substring(end);
      const newPos = start + unicode.length;
      INPUT_FIELD.setSelectionRange(newPos, newPos);
    }
  } else {
    // Unicode 模式：直接插入符號
    INPUT_FIELD.value = currentValue.substring(0, start) + unicode + currentValue.substring(end);
    currentLatexCode = INPUT_FIELD.value;
    
    // 設置新的光標位置
    const newPos = start + unicode.length;
    INPUT_FIELD.setSelectionRange(newPos, newPos);
  }
  
  // 恢復 readonly 屬性（如果原本是 readonly）
  if (wasReadonly && !ALLOW_OSK?.checked) {
    INPUT_FIELD.setAttribute('readonly', 'readonly');
  }
  
  INPUT_FIELD.focus();
  renderFormula();
}

// 自動調整 textarea 高度
function autoResizeTextarea() {
  INPUT_FIELD.style.height = 'auto';
  const newHeight = Math.min(Math.max(INPUT_FIELD.scrollHeight, 50), 300); // 最小 50px，最大 300px
  INPUT_FIELD.style.height = newHeight + 'px';
}

// 更新行號顯示
function updateLineNumbers() {
  if (MODE.value !== 'prooftree') {
    LINE_NUMBERS.classList.remove('active');
    return;
  }
  
  LINE_NUMBERS.classList.add('active');
  const lines = INPUT_FIELD.value.split('\n');
  const lineCount = Math.max(lines.length, 1);
  
  // 獲取當前光標所在行
  const cursorPos = INPUT_FIELD.selectionStart;
  const textBeforeCursor = INPUT_FIELD.value.substring(0, cursorPos);
  const currentLine = textBeforeCursor.split('\n').length;
  
  // 生成行號 HTML
  let lineNumbersHTML = '';
  for (let i = 1; i <= lineCount; i++) {
    const isCurrent = i === currentLine;
    lineNumbersHTML += `<span class="line-number${isCurrent ? ' current' : ''}">${i}</span>`;
  }
  
  LINE_NUMBERS.innerHTML = lineNumbersHTML;
  
  // 同步滾動
  LINE_NUMBERS.scrollTop = INPUT_FIELD.scrollTop;
}

// 計算橫線寬度
function calculateDividerWidth() {
  const lines = INPUT_FIELD.value.split('\n').filter(line => !line.match(/^[─—-]+$/));
  const maxLength = Math.max(...lines.map(line => line.length), 0);
  return '—'.repeat(Math.max(maxLength + 2, 3));
}

// 呼吸動畫效果
function applyBreathingEffect() {
  // 移除現有的呼吸效果
  INPUT_FIELD.classList.remove('breathing-line');
  
  // 清除之前的計時器
  if (breathingLineTimeout) {
    clearTimeout(breathingLineTimeout);
  }
  
  // 立即重新添加以觸發動畫
  setTimeout(() => {
    INPUT_FIELD.classList.add('breathing-line');
  }, 10);
  
  // 3秒後自動移除效果
  breathingLineTimeout = setTimeout(() => {
    INPUT_FIELD.classList.remove('breathing-line');
  }, 3000);
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

// 證明樹 DSL 解析：將簡化語法轉換為 bussproofs LaTeX
function buildBussproofsFromSimpleList(text) {
  const lines = (text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  let sepIndex = lines.findIndex(l => /^[─—-]{3,}$/.test(l)); // 支援視覺化橫線
  
  // 錯誤處理：沒有分隔符
  if (sepIndex < 0) {
    if (lines.length === 0) {
      return '';
    }
    // 全部視為前提，無結論
    showError('未找到分隔符，將全部視為前提');
    sepIndex = lines.length;
  }
  
  const premises = lines.slice(0, sepIndex).filter(line => !line.match(/^[─—-]+$/));
  const conclusions = lines.slice(sepIndex + 1).filter(line => !line.match(/^[─—-]+$/));
  const conclusion = conclusions[0] || '';
  
  // 錯誤處理：前提過多
  if (premises.length > 5) {
    showError(`前提數量過多 (${premises.length} 個)，建議不超過 5 個以保證顯示效果`);
  }
  
  // 錯誤處理：無前提
  if (premises.length === 0) {
    showError('沒有前提，至少需要一個前提');
  }
  
  // 生成 Axiom 行
  const axiomLines = premises.map(p => `  \\AxiomC{$${unicodeToLatex(p)}$}`).join('\n');
  
  // 根據前提數量選擇推理規則
  const inferenceMap = {
    0: 'Nullary',
    1: 'Unary',
    2: 'Binary',
    3: 'Trinary',
    4: 'Quaternary',
    5: 'Quinary'
  };
  const infRule = inferenceMap[premises.length] || 'Binary';
  
  return [
    '\\begin{prooftree}',
    axiomLines || '  % (無前提)',
    `  \\${infRule}InfC{$${unicodeToLatex(conclusion)}$}`,
    '\\end{prooftree}'
  ].join('\n');
}

// 顯示錯誤提示
function showError(message) {
  if (!ERROR_HINT) return;
  const errorText = ERROR_HINT.querySelector('.error-text');
  if (errorText) {
    errorText.textContent = message;
  }
  ERROR_HINT.style.display = 'flex';
  
  // 3秒後自動隱藏
  setTimeout(() => {
    ERROR_HINT.style.display = 'none';
  }, 3000);
}

// 隱藏錯誤提示
function hideError() {
  if (ERROR_HINT) {
    ERROR_HINT.style.display = 'none';
  }
}

// 控制系統鍵盤（OSK）的顯示行為
function applyOskPolicy() {
  if (!ALLOW_OSK || !INPUT_FIELD) return;
  
  if (ALLOW_OSK.checked) {
    // 允許系統鍵盤：移除 readonly，設置 inputmode 為 text
    INPUT_FIELD.removeAttribute('readonly');
    INPUT_FIELD.setAttribute('inputmode', 'text');
    // 不自動 focus，讓使用者自己點擊輸入框
  } else {
    // 禁止系統鍵盤：設置 readonly，設置 inputmode 為 none
    INPUT_FIELD.setAttribute('readonly', 'readonly');
    INPUT_FIELD.setAttribute('inputmode', 'none');
    INPUT_FIELD.blur();
  }
}

// 矩陣 DSL 解析：將簡化輸入轉換為矩陣陣列
function parseMatrixInput(text) {
  if (!text || !text.trim()) return null;
  
  // 按行分割（支援 | 或換行）
  const rows = text.split(/[|\n]/).map(row => row.trim()).filter(Boolean);
  
  if (rows.length === 0) return null;
  
  // 解析每一行的元素（按空格分割）
  const matrix = rows.map(row => {
    return row.split(/\s+/).filter(el => el.length > 0);
  });
  
  // 檢查矩陣有效性
  if (matrix.length === 0 || matrix[0].length === 0) {
    return null;
  }
  
  // 檢查每行元素數量是否一致
  const colCount = matrix[0].length;
  const irregularRow = matrix.findIndex(row => row.length !== colCount);
  
  if (irregularRow >= 0) {
    showError(`第 ${irregularRow + 1} 列有 ${matrix[irregularRow].length} 個元素，但第 1 列有 ${colCount} 個元素`);
  }
  
  return {
    matrix: matrix,
    rows: matrix.length,
    cols: colCount,
    isValid: irregularRow < 0
  };
}

// 生成矩陣 LaTeX
function buildMatrixLatex(matrixData, style = 'bmatrix') {
  if (!matrixData || !matrixData.matrix) return '';
  
  const {matrix} = matrixData;
  
  // 生成矩陣內容
  const matrixContent = matrix.map(row => {
    return row.join(' & ');
  }).join(' \\\\\n  ');
  
  return [
    `\\begin{${style}}`,
    `  ${matrixContent}`,
    `\\end{${style}}`
  ].join('\n');
}

// 獲取矩陣歷史顯示文字
function getMatrixHistoryDisplayText(text) {
  const matrixData = parseMatrixInput(text);
  if (matrixData) {
    return `[矩陣] ${matrixData.rows}×${matrixData.cols}`;
  }
  return text.length > 30 ? text.substring(0, 30) + '...' : text;
}

function renderFormula(){
  // 矩陣模式：使用 MathJax 渲染
  if (MODE.value === 'matrix') {
    const raw = INPUT_FIELD.value || '';
    hideError(); // 清除舊錯誤
    
    const matrixData = parseMatrixInput(raw);
    
    if (matrixData && matrixData.isValid) {
      const style = MATRIX_STYLE ? MATRIX_STYLE.value : 'bmatrix';
      const latex = buildMatrixLatex(matrixData, style);
      currentLatexCode = latex;
      
      RENDER.innerHTML = '\\[' + latex + '\\]';
      // 使用 MathJax 渲染
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([RENDER]).catch((err) => {
          console.error('MathJax 渲染錯誤:', err);
          showError('渲染失敗，請檢查輸入格式');
        });
      }
    } else if (raw.trim()) {
      RENDER.textContent = '請輸入矩陣（格式：1 2 3 | 4 5 6）';
    } else {
      RENDER.textContent = '(空白)';
    }
    return;
  }
  
  // 證明樹模式：使用 MathJax 渲染
  if (MODE.value === 'prooftree') {
    const raw = INPUT_FIELD.value || '';
    hideError(); // 清除舊錯誤
    
    // 如果使用者直接貼了完整 bussproofs，直接渲染；否則用 DSL 轉換
    const latex = /\\begin\{prooftree\}/.test(raw) ? raw : buildBussproofsFromSimpleList(raw);
    currentLatexCode = latex;
    
    if (latex) {
      RENDER.innerHTML = '\\[' + latex + '\\]';
      // 使用 MathJax 渲染
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([RENDER]).catch((err) => {
          console.error('MathJax 渲染錯誤:', err);
          showError('渲染失敗，請檢查輸入格式');
        });
      }
    } else {
      RENDER.textContent = '(空白)';
    }
    return;
  }
  
  // LaTeX 模式
  if (MODE.value === 'latex') {
    RENDER.textContent = currentLatexCode || '(空白)';
  } else {
    // Unicode 模式
    RENDER.textContent = INPUT_FIELD.value || '(空白)';
  }
}

function populateKeys() {
  const commonContainer = document.getElementById('keys-common');
  const numbersContainer = document.getElementById('keys-numbers');
  const otherContainer = document.getElementById('keys-other');
  
  // 清空現有按鈕
  commonContainer.innerHTML = '';
  numbersContainer.innerHTML = '';
  otherContainer.innerHTML = '';
  
  // 根據模式選擇鍵盤佈局
  if (MODE.value === 'matrix') {
    // 矩陣模式：使用矩陣專用鍵盤
    commonContainer.classList.add('matrix-mode');
    KEY_DATA.matrix.forEach(k => commonContainer.appendChild(createKeyBtn(k)));
    KEY_DATA.matrixOther.forEach(k => otherContainer.appendChild(createKeyBtn(k)));
    // 矩陣模式不使用數字區（已整合到常用區）
    numbersContainer.parentElement.style.display = 'none';
  } else {
    // 其他模式：使用原始鍵盤
    commonContainer.classList.remove('matrix-mode');
    KEY_DATA.common.forEach(k => commonContainer.appendChild(createKeyBtn(k)));
    KEY_DATA.numbers.forEach(k => numbersContainer.appendChild(createKeyBtn(k)));
    KEY_DATA.other.forEach(k => otherContainer.appendChild(createKeyBtn(k)));
    numbersContainer.parentElement.style.display = '';
  }
}

// 複製符號按鈕 - 始終複製輸入框中的符號
document.getElementById('copy-unicode').onclick = () => {
  const content = INPUT_FIELD.value || '';
  navigator.clipboard.writeText(content);
  showCopyFeedback('copy-unicode', '✓ 已複製符號');
};

// 複製 LaTeX 按鈕 - 複製對應的 LaTeX 代碼
document.getElementById('copy-latex').onclick = () => {
  let content = '';
  if (MODE.value === 'latex') {
    content = currentLatexCode;
  } else if (MODE.value === 'prooftree') {
    // 證明樹模式：複製完整的 bussproofs LaTeX
    content = currentLatexCode || buildBussproofsFromSimpleList(INPUT_FIELD.value);
  } else if (MODE.value === 'matrix') {
    // 矩陣模式：複製完整的矩陣 LaTeX
    const matrixData = parseMatrixInput(INPUT_FIELD.value);
    if (matrixData) {
      const style = MATRIX_STYLE ? MATRIX_STYLE.value : 'bmatrix';
      content = buildMatrixLatex(matrixData, style);
    }
  } else {
    content = unicodeToLatex(INPUT_FIELD.value);
  }
  navigator.clipboard.writeText(content || '');
  showCopyFeedback('copy-latex', '✓ 已複製 LaTeX');
};

document.getElementById('clear').onclick = () => {
  let contentToSave = '';
  if (MODE.value === 'latex') {
    contentToSave = currentLatexCode;
  } else if (MODE.value === 'prooftree' || MODE.value === 'matrix') {
    contentToSave = INPUT_FIELD.value; // 證明樹/矩陣模式儲存原始輸入
  } else {
    contentToSave = INPUT_FIELD.value;
  }
  
  if (contentToSave.trim()) {
    addToHistory(contentToSave, { cleared: true });
  }
  INPUT_FIELD.value = '';
  currentLatexCode = '';
  hideError();
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
  } else if (MODE.value === 'prooftree') {
    // 切換到證明樹模式：保持輸入框內容，調整高度，顯示行號
    currentLatexCode = '';
    autoResizeTextarea();
    updateLineNumbers();
  } else if (MODE.value === 'matrix') {
    // 切換到矩陣模式：顯示矩陣樣式選擇器
    currentLatexCode = '';
    if (MATRIX_STYLE_SELECTOR) {
      MATRIX_STYLE_SELECTOR.style.display = 'flex';
    }
  } else {
    // 切換到 Unicode 模式：保持輸入框內容不變
    currentLatexCode = '';
  }
  
  // 隱藏/顯示矩陣樣式選擇器
  if (MATRIX_STYLE_SELECTOR) {
    MATRIX_STYLE_SELECTOR.style.display = MODE.value === 'matrix' ? 'flex' : 'none';
  }
  
  hideError();
  renderFormula();
  
  // 根據模式顯示/隱藏行號
  updateLineNumbers();
  
  // 重新生成鍵盤
  populateKeys();
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

// 監聽矩陣樣式變更
if (MATRIX_STYLE) {
  MATRIX_STYLE.addEventListener('change', () => {
    if (MODE.value === 'matrix') {
      renderFormula();
    }
  });
}

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
  
  // 初始化 OSK 控制（預設禁止系統鍵盤）
  if (ALLOW_OSK) {
    ALLOW_OSK.addEventListener('change', applyOskPolicy);
    applyOskPolicy();
  }
  
  // 初始化：立即轉換任何 LaTeX 代碼
  setTimeout(() => {
    forceCleanInput();
  }, 50);
  
  renderFormula();
  
  // 監聽輸入事件
  INPUT_FIELD.addEventListener('input', (e) => {
    if (MODE.value === 'latex') {
      // LaTeX 模式：立即強制清理
      forceCleanInput();
    } else if (MODE.value === 'prooftree') {
      // 證明樹模式：調整高度和更新行號
      currentLatexCode = '';
      autoResizeTextarea();
      updateLineNumbers();
      
      // 停止呼吸效果（使用者開始輸入）
      INPUT_FIELD.classList.remove('breathing-line');
      if (breathingLineTimeout) {
        clearTimeout(breathingLineTimeout);
      }
    } else {
      // Unicode 模式
      currentLatexCode = '';
    }
    
    renderFormula();
    
    clearTimeout(historySaveTimeout);
    historySaveTimeout = setTimeout(() => {
      const contentToSave = MODE.value === 'latex' ? currentLatexCode : INPUT_FIELD.value;
      addToHistory(contentToSave);
    }, 1500);
  });
  
  // 監聽光標位置變化（更新當前行號）
  INPUT_FIELD.addEventListener('click', () => {
    if (MODE.value === 'prooftree') {
      updateLineNumbers();
    }
  });
  
  INPUT_FIELD.addEventListener('keyup', () => {
    if (MODE.value === 'prooftree') {
      updateLineNumbers();
    }
  });
  
  // 監聽滾動事件（同步行號滾動）
  INPUT_FIELD.addEventListener('scroll', () => {
    if (LINE_NUMBERS && MODE.value === 'prooftree') {
      LINE_NUMBERS.scrollTop = INPUT_FIELD.scrollTop;
    }
  });
  
// 移除重複的模式切換監聽（已在上方定義）

// 監聽粘貼事件
  INPUT_FIELD.addEventListener('paste', (e) => {
    if (MODE.value === 'latex') {
      setTimeout(() => {
        forceCleanInput();
      }, 10);
    } else if (MODE.value === 'prooftree') {
      setTimeout(() => {
        autoResizeTextarea();
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
