import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeechSynthesis } from '../../hooks/useSpeechRecognition';

export default function SpellingChallenge({ words, onComplete }) {
  const navigate = useNavigate();
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const { speak } = useSpeechSynthesis();
  const TOTAL_WORDS = 10;

  // 開始遊戲
  const startGame = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, TOTAL_WORDS);
    setCurrentWord(shuffled[0]);
    setGameStarted(true);
    setScore(0);
    setWordIndex(0);
    setUserInput('');
    setShowHint(false);
    setHintsUsed(0);
  };

  // 播放發音
  const playPronunciation = () => {
    if (currentWord) {
      speak(currentWord.english, 'en-US');
    }
  };

  // 檢查答案
  const checkAnswer = () => {
    const correct = userInput.toLowerCase().trim() === currentWord.english.toLowerCase();
    
    if (correct) {
      setFeedback('correct');
      const points = showHint ? 5 : 10; // 使用提示減半分數
      setScore(prev => prev + points);
      
      setTimeout(() => {
        nextWord();
      }, 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  // 下一題
  const nextWord = () => {
    const nextIndex = wordIndex + 1;
    if (nextIndex >= TOTAL_WORDS) {
      // 遊戲結束
      if (onComplete) {
        onComplete({ score, hintsUsed });
      }
      return;
    }

    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setCurrentWord(shuffled[nextIndex]);
    setWordIndex(nextIndex);
    setUserInput('');
    setShowHint(false);
    setFeedback(null);
  };

  // 使用提示
  const useHint = () => {
    if (!showHint) {
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
    }
  };

  // 跳過
  const skipWord = () => {
    nextWord();
  };

  // Enter 鍵送出
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userInput.trim()) {
      checkAnswer();
    }
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-6xl mb-4">✏️</div>
        <h2 className="text-3xl font-bold mb-4">拼字挑戰</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          聽發音或看中文，正確拼出英文單字！<br/>
          共 {TOTAL_WORDS} 題，答對 10 分，使用提示 5 分
        </p>
        <button
          onClick={startGame}
          className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          開始挑戰
        </button>
      </div>
    );
  }

  if (wordIndex >= TOTAL_WORDS) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-4">挑戰完成！</h2>
        <div className="space-y-2 mb-8 text-center">
          <div className="text-4xl font-bold text-primary mb-4">{score} 分</div>
          <div className="text-lg text-gray-600">
            使用了 {hintsUsed} 次提示
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={startGame}
            className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            再玩一次
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 進度和分數 */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-lg">
          題目 <span className="font-bold text-primary">{wordIndex + 1}</span> / {TOTAL_WORDS}
        </div>
        <div className="text-lg">
          分數: <span className="font-bold text-primary">{score}</span>
        </div>
      </div>

      {currentWord && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 題目區 */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-gray-800 mb-6">
              {currentWord.chinese}
            </div>
            <button
              onClick={playPronunciation}
              className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              🔊 聽發音
            </button>
          </div>

          {/* 輸入區 */}
          <div className="mb-6">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="輸入英文單字..."
              className={`w-full px-6 py-4 text-2xl text-center border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                feedback === 'correct'
                  ? 'border-green-500 bg-green-50'
                  : feedback === 'wrong'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-primary focus:ring-primary'
              }`}
              autoFocus
            />
            {feedback === 'correct' && (
              <div className="text-center text-green-600 font-semibold mt-2 fade-in">
                ✅ 正確！{showHint ? '+5 分' : '+10 分'}
              </div>
            )}
            {feedback === 'wrong' && (
              <div className="text-center text-red-600 font-semibold mt-2 fade-in">
                ❌ 再試試看
              </div>
            )}
          </div>

          {/* 提示區 */}
          {showHint ? (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg fade-in">
              <div className="text-sm text-gray-600 mb-2">💡 提示</div>
              <div className="space-y-2">
                <div className="font-mono text-2xl tracking-widest">
                  {currentWord.english.split('').map((char, idx) => (
                    <span key={idx}>
                      {idx === 0 || idx === currentWord.english.length - 1 ? char : '_'}
                    </span>
                  ))}
                </div>
                {currentWord.usage_tips && (
                  <div className="text-sm text-gray-600">{currentWord.usage_tips}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center mb-6">
              <button
                onClick={useHint}
                className="text-primary hover:underline"
              >
                需要提示？（-5分）
              </button>
            </div>
          )}

          {/* 按鈕區 */}
          <div className="flex gap-4">
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              送出答案
            </button>
            <button
              onClick={skipWord}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              跳過
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
