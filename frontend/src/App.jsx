import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { ProfileGate, ProfileMenu } from './components/ProfileSwitcher';

// Pages
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import SpeakingPage from './pages/SpeakingPage';
import GamesPage from './pages/GamesPage';
import StatsPage from './pages/StatsPage';
import WordLearningPage from './pages/WordLearningPage';

// 導航列
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl">📚</span>
            <span className="text-xl font-bold text-primary">RUNKU</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6">
            <NavLink to="/">首頁</NavLink>
            <NavLink to="/study">複習</NavLink>
            <NavLink to="/speaking">語音練習</NavLink>
            <NavLink to="/games">小遊戲</NavLink>
            <NavLink to="/stats">統計</NavLink>
            <NavLink to="/word-learning">單字學習</NavLink>
          </div>

          <div className="flex items-center gap-3">
            <ProfileMenu />
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2"
              aria-label="開啟導覽選單"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 w-full bg-gray-600 transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-gray-600 transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-gray-600 transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-2">
              <MobileNavLink to="/" onClick={() => setIsOpen(false)}>首頁</MobileNavLink>
              <MobileNavLink to="/study" onClick={() => setIsOpen(false)}>複習</MobileNavLink>
              <MobileNavLink to="/speaking" onClick={() => setIsOpen(false)}>語音練習</MobileNavLink>
              <MobileNavLink to="/games" onClick={() => setIsOpen(false)}>小遊戲</MobileNavLink>
              <MobileNavLink to="/stats" onClick={() => setIsOpen(false)}>統計</MobileNavLink>
              <MobileNavLink to="/word-learning" onClick={() => setIsOpen(false)}>單字學習</MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-gray-700 hover:text-primary transition-colors font-medium"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}

function AppShell() {
  const { profile } = useProfile();

  if (!profile) return <ProfileGate />;

  return (
    <div className="min-h-screen bg-gray-50" style={{ '--profile-color': profile.accent }}>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/speaking" element={<SpeakingPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/word-learning" element={<WordLearningPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ProfileProvider>
        <AppShell />
      </ProfileProvider>
    </Router>
  );
}

export default App;
