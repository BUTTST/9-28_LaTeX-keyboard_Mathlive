# 重構說明 - v8 更新

## 重構日期
2025-10-02

## 重構原因
1. Mathlive 虛擬鍵盤不斷彈出，影響使用體驗
2. 不需要數學公式渲染功能
3. 需要直接顯示原始 LaTeX 代碼而非渲染結果

## 主要變更

### 1. 移除依賴項
- ❌ 移除 Mathlive 函式庫
- ❌ 移除 KaTeX 渲染函式庫
- ✅ 改用純 HTML/CSS/JS 實現

### 2. 輸入框變更
**之前：** `<math-field>` (Mathlive 組件)
**現在：** `<textarea>` (標準 HTML 元素)

**優點：**
- 不會觸發虛擬鍵盤
- 更輕量級
- 更好的文字編輯體驗
- 支援多行輸入

### 3. 顯示區域變更
**之前：** 使用 KaTeX 渲染 LaTeX 為數學公式
**現在：** 直接顯示原始 LaTeX 文字

位置：「其他符號」下方的「當前輸入內容」區域

### 4. 複製按鈕增強
新增視覺反饋效果：
- 點擊後按鈕顯示「✓ 已複製」
- 按鈕背景變為藍色
- 1 秒後自動恢復原狀

### 5. 代碼結構改進

#### JavaScript 變更
- `MF` (MathField) → `INPUT_FIELD` (textarea)
- `MF.getValue()` → `INPUT_FIELD.value`
- `MF.setValue()` → `INPUT_FIELD.value = ...`
- 移除 KaTeX 渲染邏輯
- 新增 `showCopyFeedback()` 函數

#### CSS 變更
- 新增 `#input-field` 樣式（monospace 字體、focus 效果）
- 新增 `.current-content-section` 區域樣式
- 新增 `.current-content-display` 顯示原始文字
- 移除 `math-field` 相關樣式

#### HTML 變更
- 標題更新為「離散數學鍵盤 LaTeX 輸入工具 [v8]」
- 移除 Mathlive 官方鍵盤指南連結
- 更新版本號為 v8

## 功能保持不變
✅ 符號按鈕點擊輸入
✅ LaTeX/符號模式切換
✅ 歷史紀錄功能
✅ 複製 LaTeX/符號功能
✅ 清空功能
✅ 其他符號折疊/展開
✅ PWA 離線支援
✅ 響應式設計（手機適配）

## 測試建議
1. 開啟 `index.html` 確認無虛擬鍵盤彈出
2. 測試符號按鈕是否正確插入
3. 測試複製功能是否正常
4. 確認「當前輸入內容」顯示原始 LaTeX
5. 測試歷史紀錄功能
6. 測試響應式布局（手機/平板）

## 文件大小對比
- **之前：** 需載入 Mathlive (~500KB) + KaTeX (~200KB)
- **現在：** 僅載入自定義代碼 (~10KB)
- **載入速度提升：** 約 98%

## 版本歷史
- v7: 使用 Mathlive + KaTeX
- v8: 純 HTML/CSS/JS 實現（當前版本）


