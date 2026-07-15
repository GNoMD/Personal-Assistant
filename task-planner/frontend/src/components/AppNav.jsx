import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const ITEMS = [
  { to: '/my-tasks', icon: '✓', label: '任务清单', shortLabel: '任务', match: (path) => path.startsWith('/my-tasks') },
  {
    to: '/recipes',
    icon: '🥗',
    label: '食谱库',
    shortLabel: '食谱',
    match: (path) => (
      path === '/recipes'
      || path.startsWith('/recipes/')
      || path === '/other-recipes'
      || path.startsWith('/other-recipes/')
    ),
  },
  {
    to: '/equipment',
    icon: '🏋️',
    label: '健身运动',
    shortLabel: '运动',
    match: (path) => path === '/equipment' || path.startsWith('/equipment/'),
  },
  {
    to: '/travel',
    icon: '🧳',
    label: '旅行计划',
    shortLabel: '旅行',
    match: (path) => path === '/travel' || path.startsWith('/travel/'),
  },
];

function avatarInitials(user) {
  const raw = String(user?.displayName || user?.username || '?').trim();
  if (!raw) return '?';
  const chars = Array.from(raw);
  if (/^[a-zA-Z0-9]/.test(chars[0])) {
    return chars.slice(0, 2).join('').toUpperCase();
  }
  // Chinese / CJK: show up to 2 characters so the name is readable
  return chars.slice(0, 2).join('');
}

export default function AppNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAdmin, logout, avatarSrc } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="app-nav" aria-label="主要功能">
        <div className="app-nav-inner">
          <div className="app-nav-tabs">
            {ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to !== '/my-tasks'}
                className={() => `app-nav-link${item.match(pathname) ? ' active' : ''}`}
              >
                <span className="app-nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="app-nav-label app-nav-label--full">{item.label}</span>
                <span className="app-nav-label app-nav-label--short">{item.shortLabel}</span>
              </NavLink>
            ))}
          </div>

          <div className="app-nav-right" ref={menuRef}>
            <div className={`app-nav-account${menuOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="app-nav-avatar-btn"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="个人信息菜单"
                title={user?.displayName || user?.username || '我的'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="app-nav-avatar" aria-hidden="true">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="app-nav-avatar-img" />
                  ) : (
                    avatarInitials(user)
                  )}
                </span>
              </button>

              {menuOpen && (
                <div className="app-nav-account-menu" role="menu">
                  <div className="app-nav-account-meta">
                    <strong title={user?.displayName || user?.username || ''}>
                      {user?.displayName || user?.username || '用户'}
                    </strong>
                    <span title={user?.username ? `@${user.username}` : ''}>
                      @{user?.username || '—'}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="app-nav-account-item"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    个人画像
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="app-nav-account-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setPasswordOpen(true);
                    }}
                  >
                    修改密码
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      role="menuitem"
                      className="app-nav-account-item"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/users');
                      }}
                    >
                      用户管理
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="app-nav-account-item is-danger"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate('/', { replace: true });
                    }}
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}
