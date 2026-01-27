import { useState } from 'react';
import { useLearningRecords, useDailyStats, exportLearningData, importLearningData } from '../hooks/useLocalStorage';
import { getStudyStats } from '../utils/spacedRepetition';

export default function StatsPage() {
  const [learningRecords, setLearningRecords] = useLearningRecords();
  const [dailyStats] = useDailyStats();
  const [showImport, setShowImport] = useState(false);
  const stats = getStudyStats(learningRecords);

  // 獲取最近7天的統計
  const getRecentStats = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = dailyStats[dateStr] || {};
      days.push({
        date: dateStr,
        reviewed: dayStats.reviewed || 0,
        speaking_practice: dayStats.speaking_practice || 0,
        new_words: dayStats.new_words || 0,
      });
    }
    return days;
  };

  const recentStats = getRecentStats();
  const totalReviewed = recentStats.reduce((sum, day) => sum + day.reviewed, 0);
  const maxReviewed = Math.max(...recentStats.map(d => d.reviewed), 1);

  // 清除所有資料
  const handleClearData = () => {
    if (window.confirm('確定要清除所有學習記錄嗎？此操作無法復原！')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // 匯入資料
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      importLearningData(file, (success, message) => {
        alert(message);
        if (success) {
          window.location.reload();
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">學習統計</h1>
        <p className="text-xl text-gray-600">追蹤你的學習進度 📊</p>
      </div>

      {/* 總覽統計 */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title="總單字數"
          value={stats.total}
          icon="📚"
          color="bg-blue-500"
        />
        <StatCard
          title="學習中"
          value={stats.learning}
          icon="🔄"
          color="bg-orange-500"
        />
        <StatCard
          title="複習中"
          value={stats.review}
          icon="📝"
          color="bg-yellow-500"
        />
        <StatCard
          title="已精通"
          value={stats.mastered}
          icon="⭐"
          color="bg-green-500"
        />
      </div>

      {/* 最近7天活動 */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">最近 7 天活動</h2>
        
        {totalReviewed === 0 ? (
          <div className="text-center py-12 text-gray-400">
            還沒有學習記錄，開始學習吧！
          </div>
        ) : (
          <div className="space-y-4">
            {recentStats.map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('zh-TW', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-8 bg-primary rounded"
                      style={{ width: `${(day.reviewed / maxReviewed) * 100}%` }}
                    />
                    <span className="text-sm text-gray-600">{day.reviewed} 次複習</span>
                  </div>
                  {day.speaking_practice > 0 && (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 bg-green-400 rounded"
                        style={{ width: `${(day.speaking_practice / maxReviewed) * 80}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {day.speaking_practice} 次語音練習
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 學習進度分佈 */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">學習進度分佈</h2>
        <div className="space-y-4">
          <ProgressBar
            label="已精通"
            value={stats.mastered}
            total={stats.total}
            color="bg-green-500"
          />
          <ProgressBar
            label="複習中"
            value={stats.review}
            total={stats.total}
            color="bg-yellow-500"
          />
          <ProgressBar
            label="學習中"
            value={stats.learning}
            total={stats.total}
            color="bg-orange-500"
          />
          <ProgressBar
            label="未學習"
            value={stats.total - stats.learning - stats.review - stats.mastered}
            total={stats.total}
            color="bg-gray-300"
          />
        </div>
      </div>

      {/* 資料管理 */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">資料管理</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold mb-1">匯出學習記錄</h3>
              <p className="text-sm text-gray-600">備份你的學習進度</p>
            </div>
            <button
              onClick={exportLearningData}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              匯出 JSON
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold mb-1">匯入學習記錄</h3>
              <p className="text-sm text-gray-600">從備份檔案恢復進度</p>
            </div>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer inline-block"
              >
                選擇檔案
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-red-700 mb-1">清除所有資料</h3>
              <p className="text-sm text-red-600">刪除所有學習記錄（無法復原）</p>
            </div>
            <button
              onClick={handleClearData}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              清除
            </button>
          </div>
        </div>
      </div>

      {/* 學習建議 */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">📈 學習建議</h3>
        <div className="space-y-2">
          {stats.dueToday > 0 && (
            <p>• 你今天還有 {stats.dueToday} 個單字待複習！</p>
          )}
          {stats.learning > 10 && (
            <p>• 建議先專注複習學習中的單字，鞏固記憶</p>
          )}
          {totalReviewed < 20 && (
            <p>• 這週的學習量較少，建議增加複習頻率</p>
          )}
          {stats.mastered > stats.total * 0.5 && (
            <p>• 太棒了！你已經精通超過一半的單字 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-600">
          {value} / {total} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
