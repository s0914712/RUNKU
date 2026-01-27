import { useState, useEffect } from 'react';
import Whackamole from '../components/Games/Whackamole';
import MemoryMatch from '../components/Games/MemoryMatch';
import SpellingChallenge from '../components/Games/SpellingChallenge';

export default function GamesPage() {
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  // 載入單字
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/s0914712/RUNKU/main/data/vocabulary.json')
      .then(res => res.json())
      .then(data => {
        setWords(data.words || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load vocabulary:', err);
        setIsLoading(false);
      });
  }, []);

  const games = [
    {
      id: 'whackamole',
      name: '單字打地鼠',
      icon: '🦫',
      description: '快速點擊正確的單字！考驗反應力',
      component: Whackamole,
      color: 'from-yellow-400 to-orange-500',
    },
    {
      id: 'memory',
      name: '記憶翻牌',
      icon: '🎴',
      description: '配對中英文卡片，訓練記憶力',
      component: MemoryMatch,
      color: 'from-purple-400 to-pink-500',
    },
    {
      id: 'spelling',
      name: '拼字挑戰',
      icon: '✏️',
      description: '聽發音拼出單字，練習拼寫',
      component: SpellingChallenge,
      color: 'from-blue-400 to-cyan-500',
    },
  ];

  const handleGameComplete = (result) => {
    console.log('Game completed:', result);
    // 可以在這裡記錄遊戲成績
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
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

  // 遊戲選單
  if (!selectedGame) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">趣味小遊戲</h1>
          <p className="text-xl text-gray-600">
            透過遊戲輕鬆學習，寓教於樂 🎯
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="group block"
            >
              <div className={`h-full bg-gradient-to-br ${game.color} rounded-2xl p-8 text-white transform transition-all hover:scale-105 hover:shadow-2xl`}>
                <div className="text-7xl mb-4">{game.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{game.name}</h3>
                <p className="text-white text-opacity-90 mb-4">
                  {game.description}
                </p>
                <div className="flex items-center justify-center gap-2 text-white font-semibold">
                  開始遊戲
                  <span className="transform transition-transform group-hover:translate-x-2">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 遊戲小提示 */}
        <div className="max-w-3xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-3">🎮 遊戲小提示</h3>
          <ul className="text-blue-700 space-y-2">
            <li>• 每個遊戲都有不同的玩法和學習重點</li>
            <li>• 建議先複習單字再玩遊戲，效果更好</li>
            <li>• 定期挑戰遊戲可以鞏固記憶</li>
            <li>• 邀請朋友一起玩，互相競爭更有趣</li>
          </ul>
        </div>
      </div>
    );
  }

  // 遊戲畫面
  const GameComponent = selectedGame.component;

  return (
    <div className="space-y-8">
      {/* 返回按鈕 */}
      <button
        onClick={() => setSelectedGame(null)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span>←</span>
        <span>返回遊戲選單</span>
      </button>

      {/* 遊戲標題 */}
      <div className="text-center">
        <div className="text-6xl mb-4">{selectedGame.icon}</div>
        <h1 className="text-4xl font-bold">{selectedGame.name}</h1>
      </div>

      {/* 遊戲元件 */}
      <GameComponent
        words={words}
        onComplete={handleGameComplete}
      />
    </div>
  );
}
