import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { useSession } from "../lib/auth-client";
type Source = { title: string; url: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };
function readMessages(key: string): Message[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((m): m is Message => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string").slice(-40)
      .map(m => ({ ...m, sources: Array.isArray(m.sources) ? m.sources.filter(s => typeof s.title === "string" && typeof s.url === "string" && (s.url === "/mi-lista" || /^\/movies\/[a-f0-9]{24}$/.test(s.url))) : [] }));
  } catch { return []; }
}
export function Chat() {
  const { data: session } = useSession();
  const key = "peliculasya-chat:" + session!.user.id;
  const [messages, setMessages] = useState<Message[]>(() => readMessages(key));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => abort.current?.abort();
  }, [key]);
  function save(next: Message[]) {
    setMessages(next);
    try { sessionStorage.setItem(key, JSON.stringify(next.slice(-40))); } catch { /* Storage unavailable */ }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !input.trim()) return;
    const message = input.trim();
    const history = messages.filter(m => m.content.trim()).slice(-20).map(({ role, content }) => ({ role, content: content.slice(0, 12000) }));
    const next: Message[] = [...messages, { role: "user", content: message }, { role: "assistant", content: "" }];
    save(next); setInput(""); setBusy(true); setError(""); setStatus("Conectando con el asistente…");
    const controller = new AbortController(); abort.current = controller;
    let completed = false;
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, history }), signal: controller.signal });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "El servidor no pudo responder. Volvé a intentar en unos instantes.");
      }
      if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("Respuesta inesperada del servidor.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let end;
        while ((end = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, end); buffer = buffer.slice(end + 2);
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
            next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + data.text };
            save([...next]); setStatus("Respondiendo…");
          }
          if (event === "done") completed = true;
          if (event === "error") throw new Error(data.message);
        }
      }
      if (!completed) throw new Error("La respuesta se interrumpió. Podés volver a consultar.");
    } catch (e) {
      if (controller.signal.aborted) setStatus("Respuesta cancelada.");
      else setError(e instanceof Error ? e.message : "Error de conexión");
    } finally { setBusy(false); abort.current = null; }
  }
  return <section className="chat">
    <div className="page-heading"><h1>Asistente</h1><button className="button secondary" disabled={busy} onClick={() => { save([]); setError(""); setStatus(""); }}>Nueva conversación</button></div>
    <p className="muted">Consultá el catálogo, tus pendientes y tus notas. Los textos relevantes se procesan con Groq y Gemini. El nivel gratuito de Google puede usar contenido para mejorar sus productos.</p>
    <p className="muted">El chat se conserva al refrescar en esta pestaña. Probá: “¿Cuántas películas tengo pendientes?”</p>
    <div aria-label="Conversación">{messages.map((m, i) => <article className="chat-message" key={i}><strong>{m.role === "user" ? "Vos" : "Asistente"}</strong><p>{m.content || (busy && i === messages.length - 1 ? "Consultando…" : "Respuesta interrumpida")}</p>
      {!!m.sources?.length && <nav aria-label="Fuentes de la respuesta">{m.sources.map(s => <Link key={s.url} to={s.url}>{s.title}</Link>)}</nav>}
    </article>)}</div>
    <p role="status">{busy ? status : error ? "" : status === "Respuesta cancelada." ? status : ""}</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    <form onSubmit={submit}><label htmlFor="chat-message">Tu pregunta</label><textarea id="chat-message" value={input} onChange={e => setInput(e.target.value)} maxLength={2000} rows={3} />
    {busy ? <button type="button" className="button secondary" onClick={() => abort.current?.abort()}>Cancelar</button> : <button className="button" disabled={!input.trim()}>Enviar</button>}</form>
  </section>;
}
