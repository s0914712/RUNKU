import { useState, useEffect, useCallback } from 'react';

export default function Whackamole({ words, onComplete }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [activeHoles, setActiveHoles] = useState(new Set());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const HOLES_COUNT = 9;
  const WORD_DURATION = 2000; // 每個單字顯示2秒

  // 生成新題目
  const generateQuestion = useCallback(() => {
    if (words.length === 0) return;

    const word = words[Math.floor(Math.random() * words.length)];
    const wrongOptions = words
      .filter(w => w.english !== word.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map(w => w.english);

    const allOptions = [word.english, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    setCurrentWord(word);
    setOptions(allOptions);

    // 隨機選擇洞
    const holes = new Set();
    while (holes.size < Math.min(3, allOptions.length)) {
      holes.add(Math.floor(Math.random() * HOLES_COUNT));
    }
    setActiveHoles(holes);

    // 2秒後清除
    setTimeout(() => {
      setActiveHoles(new Set());
      setTimeout(generateQuestion, 500);
    }, WORD_DURATION);
  }, [words]);

  // 開始遊戲
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(60);
    generateQuestion();
  };

  // 計時器
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // 點擊處理
  const handleWhack = (holeIndex, option) => {
    if (!activeHoles.has(holeIndex)) return;

    if (option === currentWord.english) {
      setScore(prev => prev + 10);
      // 移除這個洞
      setActiveHoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(holeIndex);
        return newSet;
      });
    } else {
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  // 遊戲結束
  useEffect(() => {
    if (gameOver && onComplete) {
      onComplete(score);
    }
  }, [gameOver, score, onComplete]);

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-6xl mb-4">🦫</div>
        <h2 className="text-3xl font-bold mb-4">單字打地鼠</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          看到中文，快速點擊對應的英文單字！<br/>
          答對 +10 分，答錯 -5 分
        </p>
        <button
          onClick={startGame}
          className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          開始遊戲
        </button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-4">遊戲結束！</h2>
        <div className="text-5xl font-bold text-primary mb-8">{score} 分</div>
        <div className="flex gap-4">
          <button
            onClick={startGame}
            className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            再玩一次
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 遊戲資訊 */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-2xl font-bold">
          分數: <span className="text-primary">{score}</span>
        </div>
        <div className="text-2xl font-bold">
          時間: <span className="text-red-500">{timeLeft}s</span>
        </div>
      </div>

      {/* 題目 */}
      {currentWord && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-center">
          <div className="text-sm text-gray-600 mb-2">找出這個單字的英文</div>
          <div className="text-5xl font-bold text-gray-800">{currentWord.chinese}</div>
        </div>
      )}

      {/* 地鼠洞 */}
      <div className="grid grid-cols-3 gap-6">
        {[...Array(HOLES_COUNT)].map((_, index) => {
          const isActive = activeHoles.has(index);
          const optionIndex = Array.from(activeHoles).indexOf(index);
          const option = isActive && optionIndex >= 0 ? options[optionIndex] : null;

          return (
            <div
              key={index}
              className="aspect-square relative"
            >
              {/* 洞 */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full shadow-inner" />
              
              {/* 地鼠 */}
              {isActive && option && (
                <button
                  onClick={() => handleWhack(index, option)}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-amber-600 to-amber-800 rounded-full shadow-2xl transform hover:scale-105 transition-transform animate-bounce"
                >
                  <div className="text-4xl mb-2">🦫</div>
                  <div className="text-white font-bold text-lg px-4 py-1 bg-black bg-opacity-50 rounded-lg">
                    {option}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
