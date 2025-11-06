import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './reduxStoreAndSlices/store';
import LocalApp from './components/LocalApp/LocalApp';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n/config';
import '@silevis/reactgrid/styles.css';
import 'quill/dist/quill.snow.css';
import './index.css';

// ルーターは使用しない
// このアプリはTauri専用のため、常にtrue
const isTauri = true;

// 初期化ログを画面に表示（Tauri環境用）
const showInitLog = (message: string) => {
  const rootElement = document.getElementById('root');
  if (rootElement && isTauri) {
    const logDiv = document.createElement('div');
    logDiv.id = 'init-log';
    logDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 99999;
      border-radius: 4px;
      max-width: 500px;
      word-break: break-word;
    `;
    logDiv.textContent = `[INIT] ${message}`;
    rootElement.appendChild(logDiv);
    // 5秒後に削除
    setTimeout(() => {
      if (logDiv.parentNode) {
        logDiv.parentNode.removeChild(logDiv);
      }
    }, 5000);
  }
  console.log(`[INIT] ${message}`);
};

const AppContent = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <LocalApp />
    </Provider>
  </ErrorBoundary>
);

// エラーハンドリングを追加
try {
  showInitLog('Starting application initialization...');
  showInitLog(`Tauri detected: ${isTauri}`);
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  showInitLog('Root element found, creating React root...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppContent />
    </React.StrictMode>
  );
  
  showInitLog('React root created and rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #d32f2f;">
        <h1>アプリケーション読み込みエラー</h1>
        <p><strong>エラー:</strong> ${error instanceof Error ? error.message : String(error)}</p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto; max-height: 400px; font-size: 12px;">${error instanceof Error ? (error.stack || error.message) : String(error)}</pre>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 10px 20px; font-size: 16px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer;">再読み込み</button>
      </div>
    `;
  } else {
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #d32f2f;">
        <h1>重大なエラー</h1>
        <p>Root要素が見つからず、エラーが発生しました: ${error instanceof Error ? error.message : String(error)}</p>
      </div>
    `;
  }
}