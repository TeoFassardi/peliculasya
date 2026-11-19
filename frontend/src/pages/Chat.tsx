import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { useSession } from "../lib/auth-client";
type Source = { title: string; url: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };
function readMessages(key: string): Message[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (m): m is Message =>
          m && ["user", "assistant"].includes(m.role) && typeof m.content === "string",
      )
      .slice(-40)
      .map((m) => ({
        ...m,
        sources: Array.isArray(m.sources)
          ? m.sources.filter(
              (s) =>
                typeof s.title === "string" &&
                typeof s.url === "string" &&
                (s.url === "/mi-lista" || /^\/movies\/[a-f0-9]{24}$/.test(s.url)),
            )
          : [],
      }));
  } catch {
    return [];
  }
}
export function Chat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const key = "peliculasya-chat:" + session!.user.id;
  const [messages, setMessages] = useState<Message[]>(() => readMessages(key));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!messages.length && conversation.current) {
      conversation.current.scrollTop = 0;
    } else if (open && followLatest.current && conversation.current) {
      conversation.current.scrollTop = conversation.current.scrollHeight;
    }
  }, [messages, status, open]);
  useEffect(() => {
    return () => abort.current?.abort();
  }, [key]);
  function save(next: Message[]) {
    setMessages(next);
    try {
      sessionStorage.setItem(key, JSON.stringify(next.slice(-40)));
    } catch {
      /* Storage unavailable */
    }
  }
  async function submit(e?: React.FormEvent, suggestion?: string) {
    e?.preventDefault();
    const message = (suggestion ?? input).trim();
    if (busy || !message) return;
    followLatest.current = true;
    const history = messages
      .filter((m) => m.content.trim())
      .slice(-20)
      .map(({ role, content }) => ({ role, content: content.slice(0, 12000) }));
    const next: Message[] = [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ];
    save(next);
    setInput("");
    setBusy(true);
    setError("");
    setStatus("Conectando con el asistente…");
    const controller = new AbortController();
    abort.current = controller;
    let completed = false;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ??
            "El servidor no pudo responder. Volvé a intentar en unos instantes.",
        );
      }
      if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream"))
        throw new Error("Respuesta inesperada del servidor.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let end;
        while ((end = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const event = frame.match(/event: (.*)/)?.[1];
          const raw = frame.match(/data: (.*)/)?.[1];
          if (!raw) continue;
          const data = JSON.parse(raw);
          if (event === "status") setStatus(data.text);
          if (event === "sources" && Array.isArray(data)) {
            next[next.length - 1] = { ...next[next.length - 1], sources: data };
            save([...next]);
          }
          if (event === "token" && typeof data.text === "string") {
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: next[next.length - 1].content + data.text,
            };
            save([...next]);
            setStatus("Respondiendo…");
          }
          if (event === "done") completed = true;
          if (event === "error") throw new Error(data.message);
        }
      }
      if (!completed) throw new Error("La respuesta se interrumpió. Podés volver a consultar.");
    } catch (e) {
      if (controller.signal.aborted) setStatus("Respuesta cancelada.");
      else setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }
  return (
    <div className="chat">
      <header className="assistant-header">
        <div>
          <h2 id="assistant-title">Tu asistente de cine</h2>
          <p>El catálogo y tu lista, a mano.</p>
        </div>
        <button
          type="button"
          className="assistant-icon-button"
          aria-label="Minimizar chat"
          onClick={onClose}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M6 18 18 6" />
          </svg>
        </button>
      </header>
      <div className="assistant-toolbar">
        <span>Conversación en esta pestaña</span>
        <button
          type="button"
          disabled={busy || !messages.length}
          onClick={() => {
            save([]);
            setError("");
            setStatus("");
            textarea.current?.focus();
          }}
        >
          Nueva conversación
        </button>
      </div>
      <div
        ref={conversation}
        className="assistant-conversation"
        aria-label="Conversación"
        onScroll={() => {
          const el = conversation.current;
          if (el) followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {!messages.length && (
          <div className="assistant-welcome">
            <svg
              className="assistant-film"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="8" y="10" width="32" height="28" rx="4" />
              <path d="M16 10v28M32 10v28M8 19h8M8 29h8M32 19h8M32 29h8" />
            </svg>
            <h3>¿Qué vemos hoy?</h3>
            <p>Buscá una película, consultá tus pendientes o recuperá alguna de tus notas.</p>
            <div className="assistant-suggestions">
              {["¿Qué películas hay en el catálogo?", "¿Cuántas películas tengo pendientes?"].map(
                (suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => void submit(undefined, suggestion)}
                  >
                    {suggestion}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14m-5-5 5 5-5 5" />
                    </svg>
                  </button>
                ),
              )}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <article className={`chat-message chat-message-${m.role}`} key={i}>
            <strong>{m.role === "user" ? "Vos" : "Asistente"}</strong>
            <p>
              {m.content ||
                (busy && i === messages.length - 1 ? "Consultando…" : "Respuesta interrumpida")}
            </p>
            {!!m.sources?.length && (
              <nav aria-label="Fuentes de la respuesta">
                {m.sources.map((s) => (
                  <Link key={s.url} to={s.url} onClick={onClose}>
                    {s.title}
                  </Link>
                ))}
              </nav>
            )}
          </article>
        ))}
      </div>
      <div className="assistant-compose">
        <p className="assistant-status" role="status">
          {busy ? status : error ? "" : status === "Respuesta cancelada." ? status : ""}
        </p>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <form onSubmit={submit}>
          <label htmlFor="chat-message">Tu pregunta</label>
          <div className="assistant-input-row">
            <textarea
              ref={textarea}
              id="chat-message"
              placeholder="Preguntá sobre películas o tu lista…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              rows={2}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing &&
                  !window.matchMedia("(pointer: coarse)").matches
                ) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            {busy ? (
              <button
                type="button"
                className="assistant-send"
                aria-label="Cancelar respuesta"
                onClick={() => abort.current?.abort()}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="7" y="7" width="10" height="10" rx="1" />
                </svg>
              </button>
            ) : (
              <button className="assistant-send" aria-label="Enviar" disabled={!input.trim()}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 19V5m-6 6 6-6 6 6" />
                </svg>
              </button>
            )}
          </div>
        </form>
        <details className="assistant-privacy">
          <summary>Sobre tus datos y las respuestas</summary>
          <p>
            El chat se conserva en esta pestaña. Los textos relevantes se procesan con Groq y
            Gemini. El nivel gratuito de Google puede usar contenido para mejorar sus productos. Las
            respuestas pueden contener errores.
          </p>
        </details>
      </div>
    </div>
  );
}
