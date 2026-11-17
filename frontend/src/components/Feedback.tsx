import type { ReactNode } from "react";

interface FeedbackProps {
  title: string;
  children?: ReactNode;
  error?: boolean;
}

export function Feedback({ title, children, error = false }: FeedbackProps) {
  return (
    <div className="feedback" role={error ? "alert" : "status"}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
