import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    label: '健身器械',
    shortLabel: '器械',
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

const ADMIN_ITEM = {
  to: '/users',
  icon: '👥',
  label: '用户管理',
  shortLabel: '用户',
  match: (path) => path.startsWith('/users') || path.startsWith('/admin'),
};

export default function AppNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, logout } = useAuth();
  const items = isAdmin ? [...ITEMS, ADMIN_ITEM] : ITEMS;

  return (
    <nav className="app-nav" aria-label="主要功能">
      <div className="app-nav-inner">
        <div className="app-nav-tabs">
          {items.map((item) => (
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
        <button
          type="button"
          className="btn btn-ghost app-nav-logout"
          onClick={() => {
            logout();
            navigate('/', { replace: true });
          }}
        >
          <span className="app-nav-logout-full">退出</span>
          <span className="app-nav-logout-short" aria-hidden="true">⎋</span>
        </button>
      </div>
    </nav>
  );
}
