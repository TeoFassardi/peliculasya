import { useEffect, useRef, useState } from "react";
import { Chat } from "../pages/Chat";

export function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" />
      <path d="M7 10h8M7 14h5" />
    </svg>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    // Keep the software keyboard closed on touch screens until the user taps the input.
    panel.current?.focus({ preventScroll: true });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        launcher.current?.focus();
      }
    }
    function onFocus(event: FocusEvent) {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !launcher.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  return (
    <div className="chat-widget">
      <section
        ref={panel}
        id="assistant-panel"
        className="assistant-panel"
        role="dialog"
        aria-labelledby="assistant-title"
        tabIndex={-1}
        hidden={!open}
      >
        <Chat open={open} onClose={close} />
      </section>
      <button
        ref={launcher}
        type="button"
        className="assistant-launcher"
        aria-expanded={open}
        aria-controls="assistant-panel"
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <ChatIcon />
        <span>Asistente</span>
      </button>
    </div>
  );
}
