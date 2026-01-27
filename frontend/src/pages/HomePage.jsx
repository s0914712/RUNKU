import { Link } from 'react-router-dom';
import { useLearningRecords } from '../hooks/useLocalStorage';
import { getStudyStats } from '../utils/spacedRepetition';

export default function HomePage() {
  const [learningRecords] = useLearningRecords();
  const stats = getStudyStats(learningRecords);

  const features = [
    {
      icon: '📝',
      title: '複習單字',
      description: '使用間隔重複系統，高效記憶單字',
      link: '/study',
      color: 'from-blue-400 to-blue-600',
    },
    {
      icon: '🎤',
      title: '語音練習',
      description: '聽、說、練，全方位提升口說能力',
      link: '/speaking',
      color: 'from-green-400 to-green-600',
    },
    {
      icon: '🎮',
      title: '趣味小遊戲',
      description: '透過遊戲輕鬆學習，寓教於樂',
      link: '/games',
      color: 'from-purple-400 to-purple-600',
    },
    {
      icon: '📊',
      title: '學習統計',
      description: '追蹤學習進度，看見自己的成長',
      link: '/stats',
      color: 'from-orange-400 to-orange-600',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
          歡迎來到 <span className="text-primary">RUNKU</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          你的智慧語言學習夥伴 🚀
        </p>
        
        {/* 快速統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
          <StatCard label="總單字" value={stats.total} />
          <StatCard label="學習中" value={stats.learning} />
          <StatCard label="複習中" value={stats.review} />
          <StatCard label="已精通" value={stats.mastered} />
        </div>

        {stats.dueToday > 0 && (
          <div className="bg-primary text-white px-6 py-3 rounded-full inline-block mb-8 animate-pulse">
            📅 今天有 {stats.dueToday} 個單字待複習！
          </div>
        )}

        <Link
          to="/study"
          className="inline-block px-8 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors shadow-lg"
        >
          開始學習 →
        </Link>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">學習功能</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group block"
            >
              <div className={`h-full bg-gradient-to-br ${feature.color} rounded-2xl p-8 text-white transform transition-all hover:scale-105 hover:shadow-2xl`}>
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white text-opacity-90">{feature.description}</p>
                <div className="mt-4 flex items-center gap-2 text-white font-semibold">
                  開始使用
                  <span className="transform transition-transform group-hover:translate-x-2">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8">如何使用</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Step
            number="1"
            title="說出來"
            description="使用語音辨識，練習正確發音"
          />
          <Step
            number="2"
            title="使用他"
            description="透過例句和情境，學會實際應用"
          />
          <Step
            number="3"
            title="複習"
            description="間隔重複系統，確保長期記憶"
          />
        </div>
      </section>

      {/* Tips */}
      <section className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">💡 學習小提示</h3>
        <ul className="space-y-2">
          <li>• 每天至少練習 15 分鐘，持之以恆最重要</li>
          <li>• 使用語音功能，訓練聽力和口說能力</li>
          <li>• 定期玩小遊戲，讓學習更有趣</li>
          <li>• 匯出學習記錄，防止資料遺失</li>
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="text-3xl font-bold text-primary mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
