import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import sisterVocabulary from '../../../data/vocabulary-jie.json';
import youngerVocabulary from '../../../data/vocabulary.json';

const ACTIVE_PROFILE_KEY = 'runku_active_profile_v2';

function normalizeWords(words) {
  return words.map((word) => ({
    ...word,
    english: word.english || word.en,
    chinese: word.chinese || word.zh,
    en: word.en || word.english,
    zh: word.zh || word.chinese,
    usage_tips: word.usage_tips || word.note || '',
  }));
}

export const PROFILES = {
  jie: {
    key: 'jie',
    name: '姊姊',
    emoji: '👩',
    accent: '#3478c8',
    pale: '#eaf4ff',
    title: '進階單字遠征隊',
    description: '動作、食物、學校與生活單字',
    categories: sisterVocabulary.categories,
    words: normalizeWords(sisterVocabulary.words),
  },
  mei: {
    key: 'mei',
    name: '妹妹',
    emoji: '👧',
    accent: '#e7665a',
    pale: '#fff0e8',
    title: '基礎單字魔法村',
    description: '動物、物品、數字與身體部位',
    categories: youngerVocabulary.categories,
    words: normalizeWords(youngerVocabulary.words),
  },
};

const ProfileContext = createContext(null);

function readInitialProfile() {
  try {
    const saved = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
    return PROFILES[saved] ? saved : null;
  } catch {
    return null;
  }
}

export function ProfileProvider({ children }) {
  const [profileKey, setProfileKey] = useState(readInitialProfile);

  const selectProfile = useCallback((nextKey) => {
    if (!PROFILES[nextKey]) return;
    setProfileKey(nextKey);
    try {
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, nextKey);
    } catch {
      // Private browsing may disable storage; selection still works for this visit.
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfileKey(null);
    try {
      window.localStorage.removeItem(ACTIVE_PROFILE_KEY);
    } catch {
      // Keep the in-memory state even when storage is unavailable.
    }
  }, []);

  const value = useMemo(() => ({
    profileKey,
    profile: profileKey ? PROFILES[profileKey] : null,
    selectProfile,
    clearProfile,
  }), [profileKey, selectProfile, clearProfile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile must be used inside ProfileProvider');
  return value;
}
