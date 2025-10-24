import React, { useEffect, useRef, useState } from "react";

// --- Use emojis so we don't need any icon libraries ---
const Loader = (p) => <span {...p}>⏳</span>;
const Send = (p) => <span {...p}>➤</span>;
const Copy = (p) => <span {...p}>📋</span>;
const Check = (p) => <span {...p}>✔</span>;
const DB = (p) => <span {...p}>🗄️</span>;

// ---- API: change this to match your IIS host/route ----
const API_URL = "https://generate-sql.local/generate_sql"; // or http:// if you didn't set HTTPS

async function callGenerateSqlAPI(question) {
  const payload = {
    question,
    schema_path: "schema_tree.json",
    keywords_path: "keyword_to_tables.json",
    dialect: "mysql",
    model: "gpt-5",
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    sql: data.sql ?? "",
    explanation: data.explanation ?? "",
  };
}

const Btn = ({ className = "", children, ...rest }) => (
  <button
    className={`px-3 py-2 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-sm ${className}`}
    {...rest}
  >
    {children}
  </button>
);

const Box = ({ children }) => (
  <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff" }}>
    {children}
  </div>
);

const CopyButton = ({ value = "" }) => {
  const [ok, setOk] = useState(false);
  return (
    <Btn
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {}
      }}
    >
      {ok ? <Check /> : <Copy />} {ok ? "Copied" : "Copy"}
    </Btn>
  );
};

function AssistantAnswer({ sql, explanation, error }) {
  if (error) return <div style={{ color: "#dc2626" }}>{explanation || "Something went wrong."}</div>;
  if (!sql && !explanation) return null;

  const indentSql = (s) =>
    s
      .split("\n")
      .map((ln) => (ln.trim() ? "  " + ln : ln))
      .join("\n");

  return (
    <div style={{ marginTop: 12 }}>
      {sql && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
          <div
            style={{
              padding: "6px 10px",
              fontSize: 12,
              background: "#f8fafc",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Proposed SQL</span>
            <CopyButton value={sql} />
          </div>
          <pre style={{ margin: 0, padding: 12, fontSize: 12, overflowX: "auto" }}>
            <code>{indentSql(sql)}</code>
          </pre>
        </div>
      )}

      {explanation && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12 }}>
          <div style={{ padding: "6px 10px", fontSize: 12, background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
            Explanation
          </div>
          <div style={{ padding: 12, fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{explanation}</div>
        </div>
      )}
    </div>
  );
}

export default function SqlChatbot() {
  const [messages, setMessages] = useState([
    {
      id: "seed",
      role: "assistant",
      text: "Hi! Ask me a data question. I'll propose a MySQL query and explain it.",
      explanation:
        "Example: 'Total production by provider for September 2025' or 'New patients scheduled on 2025-10-13'.",
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef(null);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleAsk(e) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: question, createdAt: Date.now() }]);
    setInput("");
    setLoading(true);

    try {
      const { sql, explanation } = await callGenerateSqlAPI(question);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Here is a suggested SQL query and an explanation.",
          sql,
          explanation,
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Sorry, I couldn't generate a query.",
          explanation: String(err?.message || err),
          createdAt: Date.now(),
          error: "true",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#ffffffb3",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 16px", display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "9999px",
              background: "#0f172a",
              color: "white",
            }}
          >
            <DB />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>SQL Chatbot</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Ask anything • Generates SQL + explanation</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <Box>
          <div ref={viewportRef} style={{ maxHeight: "62vh", overflowY: "auto" }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div
                  style={{
                    maxWidth: "80%",
                    background: m.role === "user" ? "#0f172a" : "#f1f5f9",
                    color: m.role === "user" ? "#fff" : "#0f172a",
                    borderRadius: 16,
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{m.role === "user" ? "You" : "Assistant"}</div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 14 }}>{m.text}</div>
                  {m.role === "assistant" && (
                    <AssistantAnswer sql={m.sql} explanation={m.explanation} error={m.error} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: "#64748b", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Loader /> Generating…
              </div>
            )}
          </div>
        </Box>

        {/* Composer */}
        <form onSubmit={handleAsk} style={{ marginTop: 12 }}>
          <Box>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a data question… (e.g., Production by provider for September 2025)"
                rows={2}
                style={{
                  flex: 1,
                  resize: "none",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 10,
                  outline: "none",
                }}
              />
              <Btn disabled={loading || !input.trim()} onClick={handleAsk}>
                {loading ? (
                  <>
                    <Loader /> Sending
                  </>
                ) : (
                  <>
                    <Send /> Ask
                  </>
                )}
              </Btn>
            </div>
          </Box>
          <div style={{ textAlign: "center", fontSize: 12, color: "#64748b", marginTop: 8 }}>
            Your data never changes until you run the SQL yourself. Always review queries before executing.
          </div>
        </form>
      </div>
    </div>
  );
}
