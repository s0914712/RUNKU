import { useState, useEffect } from 'react';

export default function MemoryMatch({ words, onComplete }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const PAIRS_COUNT = 6;

  // 初始化遊戲
  const initGame = () => {
    const selectedWords = words
      .sort(() => Math.random() - 0.5)
      .slice(0, PAIRS_COUNT);

    const gameCards = [];
    selectedWords.forEach((word, index) => {
      gameCards.push({
        id: `chinese-${index}`,
        content: word.chinese,
        type: 'chinese',
        pairId: index,
      });
      gameCards.push({
        id: `english-${index}`,
        content: word.english,
        type: 'english',
        pairId: index,
      });
    });

    setCards(gameCards.sort(() => Math.random() - 0.5));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTimeElapsed(0);
    setGameStarted(true);
  };

  // 計時器
  useEffect(() => {
    if (!gameStarted) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted]);

  // 檢查配對
  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      const firstCard = cards.find(c => c.id === first);
      const secondCard = cards.find(c => c.id === second);

      if (firstCard.pairId === secondCard.pairId) {
        // 配對成功
        setMatched(prev => [...prev, first, second]);
        setFlipped([]);
      } else {
        // 配對失敗，1秒後翻回
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flipped, cards]);

  // 遊戲結束
  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setTimeout(() => {
        if (onComplete) {
          onComplete({ moves, time: timeElapsed });
        }
      }, 1000);
    }
  }, [matched, cards, moves, timeElapsed, onComplete]);

  // 翻牌
  const handleCardClick = (cardId) => {
    if (flipped.length >= 2 || flipped.includes(cardId) || matched.includes(cardId)) {
      return;
    }
    setFlipped(prev => [...prev, cardId]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-6xl mb-4">🎴</div>
        <h2 className="text-3xl font-bold mb-4">記憶翻牌</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          翻開卡片，找出中英文配對！<br/>
          考驗你的記憶力和單字量
        </p>
        <button
          onClick={initGame}
          className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          開始遊戲
        </button>
      </div>
    );
  }

  const isGameComplete = matched.length === cards.length;

  if (isGameComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-4">恭喜過關！</h2>
        <div className="space-y-2 mb-8 text-center">
          <div className="text-2xl">
            用了 <span className="font-bold text-primary">{moves}</span> 步
          </div>
          <div className="text-2xl">
            花費 <span className="font-bold text-primary">{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={initGame}
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
        <div className="text-xl font-semibold">
          步數: <span className="text-primary">{moves}</span>
        </div>
        <div className="text-xl font-semibold">
          時間: <span className="text-primary">{formatTime(timeElapsed)}</span>
        </div>
        <div className="text-xl font-semibold">
          配對: <span className="text-primary">{matched.length / 2}/{PAIRS_COUNT}</span>
        </div>
      </div>

      {/* 卡片網格 */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id);
          const isMatched = matched.includes(card.id);
          const isClickable = !isFlipped && !isMatched;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={!isClickable}
              className={`aspect-square rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                isFlipped || isMatched
                  ? card.type === 'chinese'
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                    : 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                  : 'bg-gradient-to-br from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800'
              } ${isMatched ? 'opacity-50' : ''} ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              {isFlipped || isMatched ? (
                <span className="px-2 text-center break-words">{card.content}</span>
              ) : (
                <span className="text-4xl">❓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
