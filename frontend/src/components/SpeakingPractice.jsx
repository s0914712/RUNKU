import { useState, useEffect } from 'react';
import { useSpeechRecognition, useSpeechSynthesis } from '../hooks/useSpeechRecognition';

export default function SpeakingPractice({ word, onComplete }) {
  const [mode, setMode] = useState('chinese-to-english'); // 或 'english-to-chinese'
  const [attempts, setAttempts] = useState([]);
  const [showHint, setShowHint] = useState(false);
  
  const { isListening, transcript, startListening, stopListening, resetTranscript } = 
    useSpeechRecognition(mode === 'chinese-to-english' ? 'en-US' : 'zh-TW');
  const { speak } = useSpeechSynthesis();

  useEffect(() => {
    if (transcript) {
      checkAnswer(transcript);
    }
  }, [transcript]);

  const checkAnswer = (spokenText) => {
    const target = mode === 'chinese-to-english' ? word.english : word.chinese;
    const normalized = spokenText.toLowerCase().trim();
    const targetNormalized = target.toLowerCase().trim();
    
    const isCorrect = normalized === targetNormalized || 
                     normalized.includes(targetNormalized) ||
                     targetNormalized.includes(normalized);
    
    const attempt = {
      spoken: spokenText,
      correct: isCorrect,
      timestamp: new Date().toISOString(),
    };
    
    setAttempts(prev => [...prev, attempt]);
    
    if (isCorrect) {
      setTimeout(() => {
        onComplete(true);
      }, 1500);
    }
  };

  const handleStartRecording = () => {
    resetTranscript();
    startListening();
  };

  const handlePlayTarget = () => {
    const target = mode === 'chinese-to-english' ? word.english : word.chinese;
    const lang = mode === 'chinese-to-english' ? 'en-US' : 'zh-TW';
    speak(target, lang);
  };

  const displayText = mode === 'chinese-to-english' ? word.chinese : word.english;
  const targetText = mode === 'chinese-to-english' ? word.english : word.chinese;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* 模式切換 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setMode('chinese-to-english')}
            className={`px-6 py-2 rounded-lg transition-colors ${
              mode === 'chinese-to-english'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            中文 → 英文
          </button>
          <button
            onClick={() => setMode('english-to-chinese')}
            className={`px-6 py-2 rounded-lg transition-colors ${
              mode === 'english-to-chinese'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            英文 → 中文
          </button>
        </div>

        {/* 顯示題目 */}
        <div className="text-center mb-8">
          <div className="text-sm text-gray-600 mb-2">請用語音說出這個單字</div>
          <div className="text-6xl font-bold text-gray-800 mb-4">
            {displayText}
          </div>
          <button
            onClick={handlePlayTarget}
            className="text-primary hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            🔊 聽正確發音
          </button>
        </div>

        {/* 錄音按鈕 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={isListening ? stopListening : handleStartRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-primary text-white hover:bg-blue-600'
            }`}
          >
            {isListening ? '🎤' : '🎙️'}
          </button>
        </div>

        {/* 辨識結果 */}
        {transcript && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">你說了：</div>
            <div className="text-2xl font-semibold">{transcript}</div>
          </div>
        )}

        {/* 提示 */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-primary hover:underline"
          >
            {showHint ? '隱藏提示' : '需要提示？'}
          </button>
          {showHint && (
            <div className="mt-2 p-4 bg-yellow-50 rounded-lg fade-in">
              <div className="text-lg font-semibold text-gray-700">
                答案: {targetText}
              </div>
              {word.usage_tips && (
                <div className="text-sm text-gray-600 mt-2">{word.usage_tips}</div>
              )}
            </div>
          )}
        </div>

        {/* 練習歷史 */}
        {attempts.length > 0 && (
          <div className="border-t pt-6">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              練習記錄 ({attempts.length} 次嘗試)
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {attempts.map((attempt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    attempt.correct ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{attempt.correct ? '✅' : '❌'}</span>
                    <span className="text-gray-700">{attempt.spoken}</span>
                  </span>
                  {attempt.correct && (
                    <span className="text-green-600 font-semibold">正確！</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 跳過按鈕 */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => onComplete(false)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:underline"
          >
            跳過這個單字 →
          </button>
        </div>
      </div>
    </div>
  );
}
