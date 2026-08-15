import { useState, useEffect } from 'react';
import Flashcard from '../components/Flashcard';
import { useLearningRecords, useDailyStats } from '../hooks/useLocalStorage';
import { calculateNextReview, getDueWords, FAMILIARITY_LEVELS } from '../utils/spacedRepetition';
import { useProfile } from '../context/ProfileContext';

export default function StudyPage() {
  const { profile } = useProfile();
  const words = profile.words;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learningRecords, setLearningRecords] = useLearningRecords(profile.key);
  const [, updateTodayStats] = useDailyStats(profile.key);
  const [studyMode, setStudyMode] = useState('due'); // 'due', 'new', 'all'

  useEffect(() => {
    setCurrentIndex(0);
    setStudyMode('due');
  }, [profile.key]);

  // 根據模式篩選單字
  const getFilteredWords = () => {
    if (words.length === 0) return [];

    switch (studyMode) {
      case 'due':
        // 待複習的單字
        const dueWords = getDueWords(learningRecords);
        return words.filter(w => 
          dueWords.some(d => d.word === w.english)
        );
      
      case 'new':
        // 新單字（未學習過的）
        return words.filter(w => !learningRecords[w.english]);
      
      case 'all':
        // 所有單字
        return words;
      
      default:
        return words;
    }
  };

  const filteredWords = getFilteredWords();
  const currentWord = filteredWords[currentIndex];

  // 評分處理
  const handleRate = (familiarity) => {
    if (!currentWord) return;

    const wordKey = currentWord.english;
    const currentRecord = learningRecords[wordKey] || {
      familiarity: 0,
      review_count: 0,
      last_interval: 1,
    };

    const { interval, nextReviewDate } = calculateNextReview(
      familiarity,
      currentRecord.review_count,
      currentRecord.last_interval
    );

    // 更新學習記錄
    setLearningRecords(prev => ({
      ...prev,
      [wordKey]: {
        familiarity,
        review_count: currentRecord.review_count + 1,
        last_interval: interval,
        next_review: nextReviewDate,
        last_reviewed: new Date().toISOString(),
      },
    }));

    // 更新今日統計
    updateTodayStats('reviewed');

    // 下一個單字
    if (currentIndex < filteredWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 已完成所有單字
      setCurrentIndex(0);
    }
  };

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-2">找不到單字庫</h2>
          <p className="text-gray-600">
            {profile.name}的單字庫目前沒有內容
          </p>
        </div>
      </div>
    );
  }

  if (filteredWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-4">
          {studyMode === 'due' ? '太棒了！沒有待複習的單字' : '沒有符合條件的單字'}
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setStudyMode('new')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            學習新單字
          </button>
          <button
            onClick={() => setStudyMode('all')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            複習所有單字
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 標題和模式選擇 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">{profile.emoji} {profile.name}的複習單字</h1>
        <p className="text-gray-500 mb-6">目前使用：{profile.description}</p>
        
        {/* 模式切換 */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => {
              setStudyMode('due');
              setCurrentIndex(0);
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              studyMode === 'due'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            待複習 ({getDueWords(learningRecords).length})
          </button>
          <button
            onClick={() => {
              setStudyMode('new');
              setCurrentIndex(0);
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              studyMode === 'new'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            新單字 ({words.filter(w => !learningRecords[w.english]).length})
          </button>
          <button
            onClick={() => {
              setStudyMode('all');
              setCurrentIndex(0);
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              studyMode === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            全部 ({words.length})
          </button>
        </div>

        {/* 進度 */}
        <div className="text-gray-600 mb-2">
          第 {currentIndex + 1} / {filteredWords.length} 個
        </div>
        <div className="w-full max-w-2xl mx-auto bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / filteredWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 單字卡 */}
      {currentWord && (
        <Flashcard
          word={currentWord}
          onRate={handleRate}
        />
      )}

      {/* 鍵盤提示 */}
      <div className="text-center text-gray-500 text-sm">
        提示: 使用數字鍵 1-4 快速評分
      </div>
    </div>
  );
}
