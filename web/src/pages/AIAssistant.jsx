import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-2 text-base font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 text-sm font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 font-semibold">{children}</h3>,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-slate-300 pl-3 text-slate-500">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-teal-700 underline">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-2 py-1 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-slate-200 px-2 py-1">{children}</td>,
  pre: ({ children }) => (
    <pre className="my-2 max-w-full overflow-x-auto rounded-lg bg-slate-900 p-3 text-slate-100">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.split(/\s+/).some((name) => name === "hljs" || name.startsWith("language-"));
    return (
      <code
        className={`${className || ""} font-mono ${isBlock ? "text-xs" : "rounded bg-slate-100 px-1 py-0.5 text-[0.9em]"}`}
        {...props}
      >
        {children}
      </code>
    );
  },
};

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const res = await api.get("/ai/chat");
        if (active) setMessages(res.messages || []);
      } catch (err) {
        if (active) setHistoryError(err.message);
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const chat = chatRef.current;
    if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading || historyLoading || historyError) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { message: userMsg });
      setMessages((current) => [
        ...current,
        { id: `${res.chatId}-user`, role: "user", text: userMsg },
        { id: `${res.chatId}-assistant`, role: "ai", text: res.answer },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { id: `error-${Date.now()}`, role: "user", text: userMsg },
        { id: `error-response-${Date.now()}`, role: "ai", text: "Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions =
    user?.role === "Employee"
      ? ["How many sick leaves do I have left?", "What is my leave balance?", "I need next Monday off for personal work"]
      : ["How many employees are present today?", "Who came late today?", "How many pending leave approvals?", "What is the headcount?"];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">AI Assistant</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ask questions about real HR data</p>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div ref={chatRef} className="h-[420px] overflow-y-auto p-5 space-y-3 bg-slate-50/50">
          {historyLoading && (
            <div className="space-y-4" aria-label="Loading chat history">
              <div className="flex justify-end">
                <div className="w-2/3 rounded-2xl rounded-br-md border border-slate-200 bg-white p-4">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                </div>
              </div>
              <div className="flex justify-start">
                <div className="w-3/4 rounded-2xl rounded-bl-md border border-slate-200 bg-white p-4">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-5/6" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              </div>
              <div className="flex justify-end">
                <div className="w-1/2 rounded-2xl rounded-br-md border border-slate-200 bg-white p-4">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-3/5" />
                </div>
              </div>
            </div>
          )}
          {historyError && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              Could not load your chat history: {historyError}
              <button
                type="button"
                className="ml-2 font-medium underline"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}
          {!historyLoading && !historyError && messages.length === 0 && (
            <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-700 shadow-sm">
              Hi {user?.name}! I'm your HCM AI assistant. Ask about attendance, leaves, headcount or payroll — I only use real system data.
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={m.id || i}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-teal-600 text-white rounded-br-md"
                  : "bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm"
              }`}
            >
              {m.role === "ai" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {m.text}
                </ReactMarkdown>
              ) : (
                m.text
              )}
            </div>
          ))}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 w-fit shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask anything about HR data..."
            disabled={loading || historyLoading || !!historyError}
            className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
          <Button onClick={send} loading={loading} disabled={historyLoading || !!historyError}>Send</Button>
        </div>
      </Card>
    </div>
  );
}
