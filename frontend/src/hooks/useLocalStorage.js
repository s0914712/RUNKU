import { useEffect, useState } from 'react';

function readStoredValue(key, fallback) {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => readStoredValue(key, initialValue));

  useEffect(() => {
    setStoredValue(readStoredValue(key, initialValue));
  }, [key]);

  const setValue = (value) => {
    try {
      setStoredValue((currentValue) => {
        const valueToStore = value instanceof Function ? value(currentValue) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

function legacyData(key, profileKey) {
  if (profileKey !== 'mei') return {};
  return readStoredValue(key, {});
}

export function useLearningRecords(profileKey = 'mei') {
  return useLocalStorage(`learning_records_${profileKey}`, legacyData('learning_records', profileKey));
}

export function useDailyStats(profileKey = 'mei') {
  const [stats, setStats] = useLocalStorage(
    `daily_stats_${profileKey}`,
    legacyData('daily_stats', profileKey),
  );

  const updateTodayStats = (type, increment = 1) => {
    const today = new Date().toISOString().split('T')[0];
    setStats((previous) => ({
      ...previous,
      [today]: {
        ...previous[today],
        [type]: (previous[today]?.[type] || 0) + increment,
      },
    }));
  };

  return [stats, updateTodayStats];
}

export function exportLearningData(profileKey = 'mei') {
  const records = readStoredValue(`learning_records_${profileKey}`, {});
  const stats = readStoredValue(`daily_stats_${profileKey}`, {});
  const data = {
    profile: profileKey,
    learning_records: records,
    daily_stats: stats,
    exported_at: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `runku-${profileKey}-backup-${new Date().toISOString().split('T')[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importLearningData(file, profileKey = 'mei', callback = () => {}) {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.learning_records) {
        localStorage.setItem(`learning_records_${profileKey}`, JSON.stringify(data.learning_records));
      }
      if (data.daily_stats) {
        localStorage.setItem(`daily_stats_${profileKey}`, JSON.stringify(data.daily_stats));
      }
      callback(true, '匯入成功！');
    } catch {
      callback(false, '檔案格式錯誤');
    }
  };

  reader.readAsText(file);
}
