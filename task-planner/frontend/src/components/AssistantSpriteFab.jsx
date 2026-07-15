/** Fixed right-center entry for the AI assistant sprite. */
export default function AssistantSpriteFab({ active = false, onClick }) {
  return (
    <button
      type="button"
      className={`assistant-sprite-fab${active ? ' is-active' : ''}`}
      title="小精灵 · AI 智能助手"
      aria-label="小精灵 · AI 智能助手"
      aria-expanded={active}
      aria-haspopup="dialog"
      onClick={onClick}
    >
      <img
        src="/assistant/sprite.png"
        alt=""
        className="assistant-sprite-fab-img"
        width={64}
        height={64}
      />
    </button>
  );
}
