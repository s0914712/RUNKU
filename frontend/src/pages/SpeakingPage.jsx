import { useState, useEffect } from 'react';
import SpeakingPractice from '../components/SpeakingPractice';
import { useLearningRecords, useDailyStats } from '../hooks/useLocalStorage';

export default function SpeakingPage() {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [learningRecords] = useLearningRecords();
  const [, updateTodayStats] = useDailyStats();

  // 載入單字
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/s0914712/RUNKU/main/data/vocabulary.json')
      .then(res => res.json())
      .then(data => {
        // 隨機排序
        const shuffled = (data.words || []).sort(() => Math.random() - 0.5);
        setWords(shuffled);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load vocabulary:', err);
        setIsLoading(false);
      });
  }, []);

  const currentWord = words[currentIndex];

  const handleComplete = (success) => {
    if (success) {
      setScore(prev => prev + 1);
    }
    
    updateTodayStats('speaking_practice');

    // 下一個單字
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 重新開始
      setCurrentIndex(0);
      setWords(prev => [...prev].sort(() => Math.random() - 0.5));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎤</div>
          <div className="text-xl text-gray-600">載入中...</div>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-2">找不到單字庫</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 標題和統計 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">語音練習</h1>
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{currentIndex + 1}</div>
            <div className="text-sm text-gray-600">當前進度</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">{score}</div>
            <div className="text-sm text-gray-600">正確次數</div>
          </div>
        </div>
      </div>

      {/* 語音練習元件 */}
      {currentWord && (
        <SpeakingPractice
          word={currentWord}
          onComplete={handleComplete}
        />
      )}

      {/* 注意事項 */}
      <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 使用提示</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 首次使用請允許瀏覽器存取麥克風權限</li>
          <li>• 在安靜的環境中練習效果更好</li>
          <li>• 說話時盡量清晰、不要太快</li>
          <li>• Chrome、Edge 瀏覽器支援最佳</li>
        </ul>
      </div>
    </div>
  );
}
