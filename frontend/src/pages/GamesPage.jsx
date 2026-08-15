import { useState, useEffect } from 'react';
import Whackamole from '../components/Games/Whackamole';
import MemoryMatch from '../components/Games/MemoryMatch';
import SpellingChallenge from '../components/Games/SpellingChallenge';
import BodyAdventure from '../components/Games/BodyAdventure';
import SisterAdventure from '../components/Games/SisterAdventure';
import { useProfile } from '../context/ProfileContext';

export default function GamesPage() {
  const { profile } = useProfile();
  const words = profile.words;
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    setSelectedGame(null);
  }, [profile.key]);

  const games = [
    profile.key === 'jie' ? {
      id: 'sister-adventure',
      name: '姊姊勇者傳說',
      englishName: 'THE AZURE WORD CHRONICLE',
      icon: '⚔️',
      description: '化身蒼藍勇者，以單字斬、聽音術和拼字魔法闖過四座城鎮，討伐三首闇語龍。',
      component: SisterAdventure,
      color: 'from-slate-700 to-teal-800',
      featured: true,
    } : {
      id: 'body-adventure',
      name: '妹妹勇者傳說',
      englishName: 'THE SUNBEAM WORD CHRONICLE',
      icon: '🛡️',
      description: '成為曙光勇者，認出動物、物品、數字與身體單字，在彩虹王國展開回合制冒險。',
      component: BodyAdventure,
      color: 'from-emerald-600 to-teal-800',
      featured: true,
    },
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

  // 遊戲選單
  if (!selectedGame) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{profile.emoji} {profile.name}的趣味小遊戲</h1>
          <p className="text-xl text-gray-600">
            目前使用 {profile.words.length} 個專屬單字・透過遊戲輕鬆學習 🎯
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className={`group block text-left ${game.featured ? 'md:col-span-3' : ''}`}
            >
              <div className={`h-full bg-gradient-to-br ${game.color} rounded-2xl p-8 text-white transform transition-all hover:-translate-y-1 hover:shadow-2xl ${game.featured ? 'md:flex md:items-center md:gap-8 overflow-hidden relative' : 'text-center'}`}>
                {game.featured && <div className="absolute -right-8 -top-16 text-[170px] opacity-10 rotate-12">✦</div>}
                <div className={`${game.featured ? 'text-8xl md:mb-0' : 'text-7xl mb-4'}`}>{game.icon}</div>
                <div className={game.featured ? 'flex-1' : ''}>
                  {game.englishName && <div className="text-xs font-black tracking-[0.22em] text-yellow-200 mb-2">{game.englishName}</div>}
                  <h3 className={`${game.featured ? 'text-3xl' : 'text-2xl'} font-bold mb-3`}>{game.name}</h3>
                  <p className="text-white text-opacity-90 mb-4">{game.description}</p>
                </div>
                <div className={`flex items-center gap-2 text-white font-semibold ${game.featured ? 'justify-start md:justify-center md:px-6 md:py-3 md:border-2 md:border-white md:rounded-full md:flex-none' : 'justify-center'}`}>
                  {game.featured ? '展開地圖' : '開始遊戲'}
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

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-2">找不到單字庫</h2>
          <button onClick={() => setSelectedGame(null)} className="mt-5 text-primary font-semibold">返回遊戲選單</button>
        </div>
      </div>
    );
  }

  if (selectedGame.id === 'body-adventure' || selectedGame.id === 'sister-adventure') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedGame(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-semibold"
        >
          <span>←</span><span>離開冒險，返回遊戲選單</span>
        </button>
        <GameComponent words={words} />
      </div>
    );
  }

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
