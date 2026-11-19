import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router";

export function ChatMarkdown({ content, onNavigate }: { content: string; onNavigate: () => void }) {
  return (
    <div className="chat-markdown">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        allowedElements={[
          "p",
          "strong",
          "em",
          "del",
          "ul",
          "ol",
          "li",
          "blockquote",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "hr",
          "br",
          "pre",
          "code",
          "a",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
        ]}
        components={{
          h1: "h3",
          h2: "h3",
          h3: "h3",
          h4: "h3",
          h5: "h3",
          h6: "h3",
          a: ({ href, children }) => {
            if (href && (href === "/mi-lista" || /^\/movies\/[a-f0-9]{24}$/.test(href))) {
              return (
                <Link to={href} onClick={onNavigate}>
                  {children}
                </Link>
              );
            }
            if (href && /^https?:\/\//i.test(href)) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            }
            return <span>{children}</span>;
          },
          table: ({ children }) => (
            <div
              className="chat-table-scroll"
              role="region"
              aria-label="Tabla de la respuesta, desplazamiento horizontal"
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
