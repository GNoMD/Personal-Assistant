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
import { getAssistantPersonality } from '../api/assistantClient';
import AssistantModal from './AssistantModal';
import AssistantSpriteFab from './AssistantSpriteFab';
import PersonalityPickerModal from './PersonalityPickerModal';

const AssistantUiContext = createContext(null);

export function useAssistantUi() {
  const ctx = useContext(AssistantUiContext);
  if (!ctx) throw new Error('useAssistantUi must be used within AssistantHost');
  return ctx;
}

function AssistantHostInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRequired, setPickerRequired] = useState(false);
  const chat = useAssistantChat();

  const refreshPersonalityGate = useCallback(async () => {
    try {
      const state = await getAssistantPersonality();
      if (state.needsPicker || !state.current) {
        setPickerRequired(true);
        setPickerOpen(true);
        return false;
      }
      if (state.current && user && user.assistantPersonality !== state.current) {
        setUser?.({ ...user, assistantPersonality: state.current });
      }
      return true;
    } catch {
      // 网络失败时不阻断主流程；打开助手时再试
      return Boolean(user?.assistantPersonality);
    }
  }, [setUser, user]);

  useEffect(() => {
    refreshPersonalityGate();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAssistant = useCallback(async () => {
    const ok = await refreshPersonalityGate();
    if (!ok) {
      setPickerRequired(true);
      setPickerOpen(true);
      return;
    }
    setOpen(true);
  }, [refreshPersonalityGate]);

  const closeAssistant = useCallback(() => setOpen(false), []);
  const toggleAssistant = useCallback(() => {
    if (open) {
      closeAssistant();
      return;
    }
    openAssistant();
  }, [open, openAssistant, closeAssistant]);

  const openPersonalityPicker = useCallback(() => {
    setPickerRequired(false);
    setPickerOpen(true);
  }, []);

  useEffect(() => {
    if (!location.state?.openAssistant) return;
    openAssistant();
    const { openAssistant: _ignored, ...rest } = location.state;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: Object.keys(rest).length ? rest : null,
    });
  }, [location.pathname, location.search, location.state, navigate, openAssistant]);

  const handlePersonalitySaved = useCallback((data) => {
    if (data?.user) setUser?.(data.user);
    else if (data?.current) {
      setUser?.((prev) => (prev ? { ...prev, assistantPersonality: data.current } : prev));
    }
    setPickerRequired(false);
    setPickerOpen(false);
  }, [setUser]);

  const value = useMemo(
    () => ({
      open,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      openPersonalityPicker,
      chat,
    }),
    [open, openAssistant, closeAssistant, toggleAssistant, openPersonalityPicker, chat]
  );

  return (
    <AssistantUiContext.Provider value={value}>
      <AssistantSpriteFab active={open} onClick={toggleAssistant} />
      <AssistantModal
        open={open}
        onClose={closeAssistant}
        chat={chat}
        onChangePersonality={openPersonalityPicker}
      />
      <PersonalityPickerModal
        open={pickerOpen}
        required={pickerRequired}
        onClose={() => {
          if (pickerRequired) return;
          setPickerOpen(false);
        }}
        onSaved={handlePersonalitySaved}
        title={pickerRequired ? '为你的智能助手选一个人设' : '更换助手人设'}
      />
    </AssistantUiContext.Provider>
  );
}

/** Global assistant fab + modal; keeps chat state across page navigations. */
export default function AssistantHost() {
  const { isAuthenticated, loading } = useAuth();
  if (loading || !isAuthenticated) return null;
  return <AssistantHostInner />;
}
