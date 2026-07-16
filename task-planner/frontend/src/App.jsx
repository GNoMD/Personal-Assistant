import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import EntryPage from './pages/EntryPage';
import MyTasksPage from './pages/MyTasksPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import MenuDetailPage from './pages/MenuDetailPage';
import EquipmentPage, { EquipmentDetailPage } from './pages/EquipmentPage';
import TravelPage, { TravelDetailPage } from './pages/TravelPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import AssistantHost from './components/AssistantHost';

function AuthLoading() {
  return (
    <div className="entry-page">
      <p className="entry-loading">验证身份中…</p>
    </div>
  );
}

/** Logged-in users only. Everyone else is sent to the login page. */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return children;
}

/** System admin only. */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) {
    return <Navigate to="/my-tasks" replace />;
  }
  return children;
}

/** Login/register entry only. Logged-in users cannot stay here. */
function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (isAuthenticated) return <Navigate to="/my-tasks" replace />;
  return children;
}

function OpenAssistantRedirect() {
  return <Navigate to="/my-tasks" replace state={{ openAssistant: true }} />;
}

function FallbackRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthLoading />;
  return <Navigate to={isAuthenticated ? '/my-tasks' : '/'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicOnly><EntryPage /></PublicOnly>} />
          <Route path="/my-tasks" element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route
            path="/assistant"
            element={<ProtectedRoute><OpenAssistantRedirect /></ProtectedRoute>}
          />
          <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetailPage /></ProtectedRoute>} />
          <Route path="/menus/:id" element={<ProtectedRoute><MenuDetailPage /></ProtectedRoute>} />
          <Route path="/other-recipes/*" element={<Navigate to="/recipes" replace />} />
          <Route path="/equipment" element={<ProtectedRoute><EquipmentPage /></ProtectedRoute>} />
          <Route path="/equipment/:id" element={<ProtectedRoute><EquipmentDetailPage /></ProtectedRoute>} />
          <Route path="/travel" element={<ProtectedRoute><TravelPage /></ProtectedRoute>} />
          <Route path="/travel/:id" element={<ProtectedRoute><TravelDetailPage /></ProtectedRoute>} />
          <Route path="/users" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin" element={<Navigate to="/users" replace />} />
          <Route path="*" element={<FallbackRoute />} />
        </Routes>
        <AssistantHost />
      </BrowserRouter>
    </AuthProvider>
  );
}
