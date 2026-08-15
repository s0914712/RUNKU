import { useEffect, useRef, useState } from 'react';
import { PROFILES, useProfile } from '../context/ProfileContext';
import foxStand from '../../../sprite/FOX_CHAR/stand.png';
import dinosaurSit from '../../../sprite/DINOSOUR/sit.png';
import './ProfileSwitcher.css';

const PROFILE_ART = { jie: foxStand, mei: dinosaurSit };

export function ProfileGate() {
  const { selectProfile } = useProfile();

  return (
    <main className="profile-gate">
      <div className="profile-gate-stars" aria-hidden="true">✦　·　✧　·　✦</div>
      <header>
        <span className="profile-gate-logo">R</span>
        <p>RUNKU FAMILY LIBRARY</p>
        <h1>今天是誰來<br /><em>展開冒險？</em></h1>
        <span>選擇自己的單字書，兩個人的學習進度會分開保存。</span>
      </header>

      <section className="profile-gate-grid" aria-label="選擇學習者">
        {Object.values(PROFILES).map((item, index) => (
          <button
            key={item.key}
            className={`profile-gate-card profile-gate-card--${item.key}`}
            onClick={() => selectProfile(item.key)}
            style={{ '--profile-accent': item.accent, '--profile-pale': item.pale }}
          >
            <span className="profile-card-number">0{index + 1}</span>
            <div className="profile-card-art"><img src={PROFILE_ART[item.key]} alt="" /></div>
            <small>{item.key === 'jie' ? 'SISTER’S BOOK' : 'YOUNGER’S BOOK'}</small>
            <h2>{item.emoji} {item.name}</h2>
            <p>{item.description}</p>
            <div className="profile-card-meta">
              <b>{item.words.length}<span> WORDS</span></b>
              <i>選擇這本書 →</i>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}

export function ProfileMenu() {
  const { profile, selectProfile, clearProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  return (
    <div className="profile-menu" ref={menuRef}>
      <button className="profile-menu-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span>{profile.emoji}</span><b>{profile.name}</b><i>⌄</i>
      </button>
      {open && (
        <div className="profile-menu-popover">
          <small>切換單字書</small>
          {Object.values(PROFILES).map((item) => (
            <button
              key={item.key}
              className={profile.key === item.key ? 'is-active' : ''}
              onClick={() => { selectProfile(item.key); setOpen(false); }}
            >
              <span>{item.emoji}</span>
              <div><b>{item.name}</b><small>{item.words.length} 個單字</small></div>
              <i>{profile.key === item.key ? '✓' : '→'}</i>
            </button>
          ))}
          <button className="profile-menu-exit" onClick={clearProfile}>回到選擇畫面</button>
        </div>
      )}
    </div>
  );
}
