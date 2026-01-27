import { useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechRecognition';

export default function Flashcard({ word, onRate, showAnswer = false }) {
  const [isFlipped, setIsFlipped] = useState(showAnswer);
  const { speak, isSpeaking } = useSpeechSynthesis();

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (text, lang) => {
    speak(text, lang);
  };

  const handleRate = (familiarity) => {
    onRate(familiarity);
    setIsFlipped(false);
  };

  if (!word) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 卡片 */}
      <div 
        className={`relative bg-white rounded-2xl shadow-xl p-8 min-h-[400px] cursor-pointer transition-all duration-500 transform ${
          isFlipped ? 'flip-enter' : ''
        }`}
        onClick={handleFlip}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {!isFlipped ? (
          // 正面 - 中文
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl font-bold text-gray-800 mb-8">
              {word.chinese}
            </div>
            <div className="text-gray-400 text-sm">點擊翻轉</div>
          </div>
        ) : (
          // 背面 - 英文 + 詳細資訊
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-5xl font-bold text-primary">{word.english}</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(word.english, 'en-US');
                  }}
                  className={`p-3 rounded-full transition-colors ${
                    isSpeaking ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title="發音"
                >
                  🔊
                </button>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {word.category}
              </span>
            </div>

            <div className="flex-1 space-y-6">
              {/* 用法提示 */}
              {word.usage_tips && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">💡 用法提示</div>
                  <div className="text-gray-800">{word.usage_tips}</div>
                </div>
              )}

              {/* 例句 */}
              {word.examples && word.examples.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 font-semibold">📝 例句</div>
                  {word.examples.map((example, idx) => (
                    <div key={idx} className="flex items-start gap-2 pl-4 border-l-2 border-gray-200">
                      <span className="text-gray-400">{idx + 1}.</span>
                      <div className="flex-1">
                        <div className="text-gray-800">{example}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(example, 'en-US');
                          }}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          🔊 聽發音
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 難度指示 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">難度:</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-2 rounded ${
                        i < (word.difficulty || 0) ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 評分按鈕 */}
            <div className="grid grid-cols-4 gap-2 mt-6" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleRate(0)}
                className="py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                😰 不認識
              </button>
              <button
                onClick={() => handleRate(1)}
                className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
              >
                😕 困難
              </button>
              <button
                onClick={() => handleRate(2)}
                className="py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
              >
                🙂 還好
              </button>
              <button
                onClick={() => handleRate(3)}
                className="py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
              >
                😊 輕鬆
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 提示文字 */}
      {!isFlipped && (
        <div className="text-center mt-4 text-gray-500 text-sm">
          按空白鍵或點擊卡片查看答案
        </div>
      )}
    </div>
  );
}
