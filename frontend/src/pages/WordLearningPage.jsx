import { useState, useEffect, useCallback } from 'react';

const WORDS_URL = 'https://raw.githubusercontent.com/s0914712/RUNKU/main/words';

function parseWords(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('-'))
    .map(line => {
      const idx = line.indexOf('-');
      return {
        chinese: line.substring(0, idx).trim(),
        english: line.substring(idx + 1).trim(),
      };
    })
    .filter(w => w.chinese && w.english);
}

function speak(text, lang = 'en-US') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export default function WordLearningPage() {
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('cards'); // 'cards' | 'quiz'

  useEffect(() => {
    fetch(WORDS_URL)
      .then(res => {
        if (!res.ok) throw new Error('無法載入單字檔案');
        return res.text();
      })
      .then(text => {
        const parsed = parseWords(text);
        if (parsed.length === 0) throw new Error('單字檔案內容為空');
        setWords(parsed);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐾</div>
          <div className="text-xl text-gray-600">載入單字中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-2">載入失敗</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">單字學習</h1>
        <p className="text-gray-600 mb-6">共 {words.length} 個單字</p>

        {/* Mode Tabs */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setMode('cards')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'cards'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            單字卡
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'quiz'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            小測驗
          </button>
        </div>
      </div>

      {mode === 'cards' ? (
        <CardMode words={words} />
      ) : (
        <QuizMode words={words} />
      )}
    </div>
  );
}

/* ── Card Mode ── */
function CardMode({ words }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const word = words[currentIndex];

  const goNext = useCallback(() => {
    setFlipped(false);
    setCurrentIndex(prev => (prev + 1) % words.length);
  }, [words.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setCurrentIndex(prev => (prev - 1 + words.length) % words.length);
  }, [words.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped(f => !f);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="w-full max-w-lg">
        <div className="text-center text-gray-600 mb-2">
          第 {currentIndex + 1} / {words.length} 個
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setFlipped(f => !f)}
        className="w-full max-w-lg h-72 cursor-pointer perspective-1000"
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
            flipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.5s',
          }}
        >
          {/* Front - Chinese */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-sm font-medium mb-4 opacity-80">中文</div>
            <div className="text-5xl font-bold mb-6">{word.chinese}</div>
            <div className="text-sm opacity-70">點擊翻面查看英文</div>
          </div>

          {/* Back - English */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-sm font-medium mb-4 opacity-80">English</div>
            <div className="text-5xl font-bold mb-6">{word.english}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(word.english);
              }}
              className="px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-colors"
            >
              🔊 播放發音
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-6">
        <button
          onClick={goPrev}
          className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors text-xl"
        >
          ←
        </button>
        <button
          onClick={() => speak(word.english)}
          className="w-14 h-14 flex items-center justify-center bg-primary text-white rounded-full hover:bg-blue-600 transition-colors text-2xl shadow-lg"
        >
          🔊
        </button>
        <button
          onClick={goNext}
          className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors text-xl"
        >
          →
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="text-center text-gray-500 text-sm">
        提示: 按 ← → 切換單字，空白鍵翻面
      </div>

      {/* Word List Overview */}
      <div className="w-full max-w-2xl mt-4">
        <h3 className="text-lg font-bold text-gray-700 mb-3">所有單字</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {words.map((w, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setFlipped(false);
              }}
              className={`px-4 py-3 rounded-lg text-left transition-all ${
                idx === currentIndex
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
              }`}
            >
              <div className="font-bold">{w.chinese}</div>
              <div className={`text-sm ${idx === currentIndex ? 'text-blue-100' : 'text-gray-500'}`}>
                {w.english}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Quiz Mode ── */
function QuizMode({ words }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [direction, setDirection] = useState('zh2en'); // 'zh2en' | 'en2zh'
  const [questions, setQuestions] = useState([]);
  const [finished, setFinished] = useState(false);

  const generateQuestions = useCallback(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.map(correctWord => {
      const otherWords = words.filter(w => w.english !== correctWord.english);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, otherWords.length));

      const options = [...wrongAnswers, correctWord].sort(() => Math.random() - 0.5);
      return { correct: correctWord, options };
    });
  }, [words]);

  useEffect(() => {
    setQuestions(generateQuestions());
  }, [generateQuestions]);

  const currentQ = questions[questionIndex];

  const handleAnswer = (option) => {
    if (selectedAnswer !== null) return;

    const correct =
      direction === 'zh2en'
        ? option.english === currentQ.correct.english
        : option.chinese === currentQ.correct.chinese;

    setSelectedAnswer(option);
    setIsCorrect(correct);
    setAnswered(prev => prev + 1);
    if (correct) {
      setScore(prev => prev + 1);
      speak(currentQ.correct.english);
    }
  };

  const handleNext = () => {
    if (questionIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  const restart = () => {
    setQuestions(generateQuestions());
    setQuestionIndex(0);
    setScore(0);
    setAnswered(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setFinished(false);
  };

  if (questions.length === 0) return null;

  if (finished) {
    const percentage = Math.round((score / answered) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="text-6xl">{percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}</div>
        <h2 className="text-3xl font-bold">測驗完成!</h2>
        <div className="text-center">
          <div className="text-5xl font-bold text-primary mb-2">{score} / {answered}</div>
          <div className="text-gray-600">正確率 {percentage}%</div>
        </div>
        <button
          onClick={restart}
          className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          再試一次
        </button>
      </div>
    );
  }

  const questionText =
    direction === 'zh2en'
      ? currentQ.correct.chinese
      : currentQ.correct.english;

  const prompt = direction === 'zh2en' ? '這個中文的英文是？' : '這個英文的中文是？';

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
      {/* Direction Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => { setDirection('zh2en'); restart(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            direction === 'zh2en'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          中文 → 英文
        </button>
        <button
          onClick={() => { setDirection('en2zh'); restart(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            direction === 'en2zh'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          英文 → 中文
        </button>
      </div>

      {/* Score Bar */}
      <div className="w-full flex justify-between items-center text-sm text-gray-600">
        <span>第 {questionIndex + 1} / {questions.length} 題</span>
        <span>得分: {score} / {answered}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full text-center">
        <div className="text-sm text-gray-500 mb-3">{prompt}</div>
        <div className="text-4xl font-bold text-gray-800 mb-2">{questionText}</div>
        {direction === 'en2zh' && (
          <button
            onClick={() => speak(currentQ.correct.english)}
            className="text-primary hover:text-blue-700 text-sm"
          >
            🔊 播放發音
          </button>
        )}
      </div>

      {/* Options */}
      <div className="w-full grid grid-cols-1 gap-3">
        {currentQ.options.map((option, idx) => {
          const isSelected =
            selectedAnswer &&
            (direction === 'zh2en'
              ? selectedAnswer.english === option.english
              : selectedAnswer.chinese === option.chinese);
          const isCorrectOption =
            direction === 'zh2en'
              ? option.english === currentQ.correct.english
              : option.chinese === currentQ.correct.chinese;

          let bgColor = 'bg-white hover:bg-gray-50';
          if (selectedAnswer) {
            if (isCorrectOption) bgColor = 'bg-green-100 border-green-500';
            else if (isSelected && !isCorrect) bgColor = 'bg-red-100 border-red-500';
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={selectedAnswer !== null}
              className={`w-full px-6 py-4 rounded-xl border-2 text-left transition-all font-medium text-lg ${bgColor} ${
                selectedAnswer ? '' : 'border-gray-200 hover:border-primary'
              }`}
            >
              {direction === 'zh2en' ? option.english : option.chinese}
              {selectedAnswer && isCorrectOption && ' ✓'}
              {selectedAnswer && isSelected && !isCorrect && ' ✗'}
            </button>
          );
        })}
      </div>

      {/* Feedback & Next */}
      {selectedAnswer && (
        <div className="w-full text-center space-y-4">
          <div className={`text-lg font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? '正確!' : `答錯了! 正確答案是: ${direction === 'zh2en' ? currentQ.correct.english : currentQ.correct.chinese}`}
          </div>
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            {questionIndex + 1 >= questions.length ? '查看結果' : '下一題 →'}
          </button>
        </div>
      )}
    </div>
  );
}
