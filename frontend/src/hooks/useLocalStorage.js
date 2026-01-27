import { useState, useEffect } from 'react';

/**
 * 使用 LocalStorage 持久化儲存資料的 Hook
 */
export function useLocalStorage(key, initialValue) {
  // 從 localStorage 讀取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 更新 localStorage 和 state
  const setValue = (value) => {
    try {
      // 允許 value 是函數（類似 useState）
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * 學習記錄 Hook
 */
export function useLearningRecords() {
  return useLocalStorage('learning_records', {});
}

/**
 * 每日統計 Hook
 */
export function useDailyStats() {
  const [stats, setStats] = useLocalStorage('daily_stats', {});
  
  const updateTodayStats = (type, increment = 1) => {
    const today = new Date().toISOString().split('T')[0];
    setStats(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [type]: (prev[today]?.[type] || 0) + increment,
      }
    }));
  };
  
  return [stats, updateTodayStats];
}

/**
 * 匯出學習資料
 */
export function exportLearningData() {
  const records = JSON.parse(localStorage.getItem('learning_records') || '{}');
  const stats = JSON.parse(localStorage.getItem('daily_stats') || '{}');
  
  const data = {
    learning_records: records,
    daily_stats: stats,
    exported_at: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `runku-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 匯入學習資料
 */
export function importLearningData(file, callback) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.learning_records) {
        localStorage.setItem('learning_records', JSON.stringify(data.learning_records));
      }
      if (data.daily_stats) {
        localStorage.setItem('daily_stats', JSON.stringify(data.daily_stats));
      }
      
      callback(true, '匯入成功！');
    } catch (error) {
      callback(false, '檔案格式錯誤');
    }
  };
  
  reader.readAsText(file);
}
