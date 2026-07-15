import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAssistantChat } from '../hooks/useAssistantChat';
import AssistantModal from './AssistantModal';
import AssistantSpriteFab from './AssistantSpriteFab';

const AssistantUiContext = createContext(null);

export function useAssistantUi() {
  const ctx = useContext(AssistantUiContext);
  if (!ctx) throw new Error('useAssistantUi must be used within AssistantHost');
  return ctx;
}

function AssistantHostInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const chat = useAssistantChat();

  const openAssistant = useCallback(() => setOpen(true), []);
  const closeAssistant = useCallback(() => setOpen(false), []);
  const toggleAssistant = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    if (!location.state?.openAssistant) return;
    setOpen(true);
    const { openAssistant: _ignored, ...rest } = location.state;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: Object.keys(rest).length ? rest : null,
    });
  }, [location.pathname, location.search, location.state, navigate]);

  const value = useMemo(
    () => ({
      open,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      chat,
    }),
    [open, openAssistant, closeAssistant, toggleAssistant, chat]
  );

  return (
    <AssistantUiContext.Provider value={value}>
      <AssistantSpriteFab active={open} onClick={toggleAssistant} />
      <AssistantModal open={open} onClose={closeAssistant} chat={chat} />
    </AssistantUiContext.Provider>
  );
}

/** Global assistant fab + modal; keeps chat state across page navigations. */
export default function AssistantHost() {
  const { isAuthenticated, loading } = useAuth();
  if (loading || !isAuthenticated) return null;
  return <AssistantHostInner />;
}
