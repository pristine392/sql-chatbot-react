import React, { useEffect, useMemo, useRef, useState } from "react";

// --- Emoji icons (no extra libs) ---
const Loader = (p) => <span {...p}>⏳</span>;
const Send = (p) => <span {...p}>➤</span>;
const CopyI = (p) => <span {...p}>📋</span>;
const Check = (p) => <span {...p}>✔</span>;
const DB = (p) => <span {...p}>🗄️</span>;
const User = (p) => <span {...p}>🧑‍💻</span>;
const Menu = (p) => <span {...p}>☰</span>;
const Plus = (p) => <span {...p}>＋</span>;
const Trash = (p) => <span {...p}>🗑️</span>;

// ---- API endpoints (map by model) ----
const ENDPOINTS = {
  // Basic
  // keyword: "http://localhost:9000/generate_sql",
  keyword: "https://generate-sql.local/generate_sql",
  // Premium
  cluster: "https://generate-sql.local/generate_sql_premium",
};

const MODELS = [
  { id: "keyword", label: "Basic" },
  { id: "cluster", label: "Premium" },
];

async function callGenerateSqlAPI(question, modelId) {
  const apiUrl = ENDPOINTS[modelId] || ENDPOINTS.keyword;

  const payload = {
    question,
    schema_path: "schema_tree.json",
    keywords_path: "keyword_to_tables.json",
    dialect: "mysql",
    model: modelId || "gpt-5",
  };

  const res = await fetch(apiUrl, {
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

// ---------------- UI PRIMITIVES ----------------
const Button = ({ className = "", children, ...rest }) => (
  <button className={`gp-btn ${className}`} {...rest}>
    {children}
  </button>
);

const IconButton = ({ children, ...rest }) => (
  <button className="gp-icon-btn" {...rest}>
    {children}
  </button>
);

const CopyButton = ({ value = "" }) => {
  const [ok, setOk] = useState(false);
  return (
    <Button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setOk(true);
          setTimeout(() => setOk(false), 1100);
        } catch {}
      }}
    >
      {ok ? <Check /> : <CopyI />} {ok ? "Copied" : "Copy"}
    </Button>
  );
};

function CodeBlock({ title, children, onCopy }) {
  return (
    <div className="gp-card gp-code">
      <div className="gp-card-h">
        <span>{title}</span>
        {onCopy}
      </div>
      <pre className="gp-pre"><code>{children}</code></pre>
    </div>
  );
}

function TextCard({ title, children }) {
  return (
    <div className="gp-card">
      <div className="gp-card-h"><span>{title}</span></div>
      <div className="gp-card-b">{children}</div>
    </div>
  );
}

function AssistantAnswer({ sql, explanation, error }) {
  if (error) return <div className="gp-error">{explanation || "Something went wrong."}</div>;
  if (!sql && !explanation) return null;

  const indentSql = (s) =>
    s
      .split("\n")
      .map((ln) => (ln.trim() ? "  " + ln : ln))
      .join("\n");

  return (
    <div className="gp-assistant-details">
      {sql && (
        <CodeBlock title="Proposed SQL" onCopy={<CopyButton value={sql} />}>
          {indentSql(sql)}
        </CodeBlock>
      )}

      {explanation && (
        <TextCard title="Explanation">
          <div className="gp-expl">{explanation}</div>
        </TextCard>
      )}
    </div>
  );
}

// ---------------- MAIN COMPONENT ----------------
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
  const [model, setModel] = useState(MODELS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const viewportRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages (if user near bottom)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Show "scroll to bottom" button
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setShowScrollBtn(!nearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = () => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  };

  // Submit on Enter (Shift+Enter for newline)
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  async function handleAsk(e) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: question, createdAt: Date.now() }]);
    setInput("");
    setLoading(true);

    try {
      const { sql, explanation } = await callGenerateSqlAPI(question, model);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Here is a suggested SQL query using ${model}.`,
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
      inputRef.current?.focus();
    }
  }

  function handleNewChat() {
    setMessages([
      {
        id: "seed",
        role: "assistant",
        text: "Hi! Ask me a data question. I'll propose a MySQL query and explain it.",
        explanation:
          "Example: 'Total production by provider for September 2025' or 'New patients scheduled on 2025-10-13'.",
        createdAt: Date.now(),
      },
    ]);
    setInput("");
    scrollToBottom();
  }

  return (
    <div className={`gp-shell ${sidebarOpen ? "with-side" : ""}`}>
      {/* Sidebar */}
      <aside className={`gp-side ${sidebarOpen ? "open" : ""}`}>
        <div className="gp-side-inner">
          <div className="gp-side-top">
            <Button className="gp-new" onClick={handleNewChat}><Plus /> New chat</Button>
          </div>

          <div className="gp-side-sec">
            <div className="gp-sec-title">Model</div>
            <div className="gp-field">
              <label htmlFor="model" className="gp-label">LLM</label>
              <select id="model" value={model} onChange={(e)=>setModel(e.target.value)} className="gp-select">
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <div className="gp-help">This only changes the *generation* model for SQL/explanations.</div>
            </div>
          </div>

          <div className="gp-side-sec">
            <div className="gp-sec-title">Session</div>
            <Button className="gp-danger" onClick={handleNewChat}><Trash /> Clear messages</Button>
          </div>

          <div className="gp-side-ft">v1 • SQL Chatbot</div>
        </div>
      </aside>

      {/* Content */}
      <div className="gp-content">
        {/* Top Bar */}
        <header className="gp-topbar">
          <div className="gp-topbar-inner">
            <IconButton className="gp-menu" onClick={()=>setSidebarOpen(s=>!s)}><Menu /></IconButton>
            <div className="gp-logo"><DB /></div>
            <div className="gp-title">
              <div className="gp-title-main">SQL Chatbot</div>
              <div className="gp-title-sub">{`Ask anything • ${model}`}</div>
            </div>
          </div>
        </header>

        {/* Chat Body */}
        <main className="gp-main">
          <div className="gp-chat" ref={viewportRef}>
            {messages.map((m) => (
              <div key={m.id} className={`gp-msg ${m.role}`}>
                <div className="gp-bubble">
                  <div className="gp-role">{m.role === "user" ? "You" : "Assistant"}</div>
                  <div className="gp-text">{m.text}</div>
                  {m.role === "assistant" && (
                    <AssistantAnswer sql={m.sql} explanation={m.explanation} error={m.error} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="gp-loading"><Loader /> Generating…</div>
            )}
          </div>

          {showScrollBtn && (
            <div className="gp-scroll" onClick={scrollToBottom}>
              Jump to bottom
            </div>
          )}
        </main>

        {/* Composer fixed at bottom */}
        <footer className="gp-footer">
          <form onSubmit={handleAsk} className="gp-composer">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a data question… (e.g., Production by provider for September 2025)"
              rows={1}
              className="gp-input"
            />
            <Button disabled={loading || !input.trim()} onClick={handleAsk} className="gp-send">
              {loading ? (<><Loader /> Sending</>) : (<><Send /> Ask</>)}
            </Button>
          </form>
          <div className="gp-fineprint">
            Your data never changes until you run the SQL yourself. Always review queries before executing.
          </div>
        </footer>
      </div>

      {/* Inline CSS (scoped) */}
      <style>{`
        :root{
          --bg:#f6f7f9;           /* page background */
          --panel:#fff;            /* cards & composer */
          --muted:#64748b;         /* secondary text */
          --line:#e5e7eb;          /* borders */
          --ink:#0f172a;           /* primary text */
          --ink-inv:#fff;          /* on dark */
          --bubble-user:#0f172a;   /* user bubble */
          --bubble-assist:#f1f5f9; /* assistant bubble */
        }
        *{box-sizing:border-box}
        html,body,#root{height:100%}
        body{margin:0; background:var(--bg); color:var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";}

        /* Shell with sidebar */
        .gp-shell{min-height:100vh; display:grid; grid-template-columns: 280px 1fr;}
        .gp-shell:not(.with-side){grid-template-columns:1fr}
        .gp-content{display:flex; flex-direction:column; min-height:100vh}

        .gp-side{background:#0b1220; color:#cbd5e1; border-right:1px solid #0f172a; display:none}
        .gp-side.open{display:block}
        .gp-side-inner{height:100vh; position:sticky; top:0; display:flex; flex-direction:column; padding:14px}
        .gp-side-top{display:flex; gap:8px;}
        .gp-new{width:100%; background:#111827; color:#e5e7eb; border-color:#1f2937}
        .gp-side-sec{margin-top:16px; padding-top:12px; border-top:1px solid #1f2937}
        .gp-sec-title{font-size:12px; color:#94a3b8; margin-bottom:10px; text-transform:uppercase; letter-spacing:.06em}
        .gp-field{display:flex; flex-direction:column; gap:6px}
        .gp-label{font-size:12px; color:#94a3b8}
        .gp-select{border:1px solid #334155; background:#0f172a; color:#e5e7eb; border-radius:10px; padding:8px 10px}
        .gp-help{font-size:12px; color:#94a3b8}
        .gp-danger{background:#111827; color:#fecaca; border-color:#334155}
        .gp-side-ft{margin-top:auto; font-size:12px; color:#94a3b8}

        /* Top Bar */
        .gp-topbar{position:sticky; top:0; z-index:10; background:rgba(255,255,255,0.86); backdrop-filter: blur(6px); border-bottom:1px solid var(--line)}
        .gp-topbar-inner{max-width:900px; margin:0 auto; padding:12px 16px; display:flex; align-items:center; gap:10px}
        .gp-menu{display:none}
        .gp-logo{display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:9999px; background:var(--ink); color:var(--ink-inv)}
        .gp-title-main{font-weight:600}
        .gp-title-sub{font-size:12px; color:var(--muted)}

        /* Chat Area */
        .gp-main{flex:1;}
        .gp-chat{max-width:900px; margin:0 auto; padding:16px; height:calc(100vh - 180px); overflow:auto}

        .gp-msg{display:flex; gap:12px; margin:16px 0}
        .gp-msg.user .gp-bubble{background:var(--bubble-user); color:var(--ink-inv)}
        .gp-msg.assistant .gp-bubble{background:var(--bubble-assist); color:var(--ink)}
        .gp-avatar{flex:0 0 28px; height:28px; display:flex; align-items:center; justify-content:center}
        .gp-bubble{max-width:780px; padding:12px 14px; border-radius:16px; border:1px solid var(--line)}
        .gp-role{font-size:12px; opacity:.7; margin-bottom:4px}
        .gp-text{white-space:pre-wrap; line-height:1.5; font-size:14px}

        .gp-assistant-details{margin-top:10px; display:flex; flex-direction:column; gap:10px}
        .gp-card{border:1px solid var(--line); border-radius:12px; overflow:hidden; background:#fff}
        .gp-card-h{display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 10px; font-size:12px; background:#f8fafc; border-bottom:1px solid var(--line)}
        .gp-card-b{padding:12px}
        .gp-code .gp-pre{margin:0; padding:12px; font-size:12px; overflow:auto}
        .gp-expl{white-space:pre-wrap; line-height:1.55; font-size:14px}

        .gp-error{color:#dc2626}
        .gp-loading{color:var(--muted); font-size:14px; display:flex; align-items:center; gap:6px}

        .gp-scroll{position:fixed; right:18px; bottom:110px; background:var(--ink); color:var(--ink-inv); padding:8px 12px; border-radius:999px; cursor:pointer; box-shadow:0 8px 24px rgba(0,0,0,.12); font-size:12px}

        .gp-footer{position:sticky; bottom:0; backdrop-filter: blur(6px); background:rgba(246,247,249,0.7); border-top:1px solid var(--line)}
        .gp-composer{max-width:900px; margin:10px auto 0; padding:0 16px 10px; display:flex; gap:8px}
        .gp-input{flex:1; resize:none; min-height:52px; max-height:160px; padding:12px 12px; border:1px solid var(--line); border-radius:12px; outline:none; background:var(--panel); font-size:14px; line-height:1.45}
        .gp-btn{display:inline-flex; align-items:center; gap:6px; padding:10px 14px; border-radius:12px; border:1px solid var(--line); background:#fff; cursor:pointer; font-size:14px}
        .gp-btn[disabled]{opacity:.6; cursor:not-allowed}
        .gp-icon-btn{display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:12px; border:1px solid var(--line); background:#fff}
        .gp-send{background:var(--ink); color:var(--ink-inv); border-color:var(--ink)}
        .gp-fineprint{text-align:center; font-size:12px; color:var(--muted); padding:0 16px 14px}

        @media (max-width: 1024px){
          .gp-shell{grid-template-columns: 0 1fr}
          .gp-side{position:fixed; left:0; top:0; width:280px; height:100vh; display:block; transform:translateX(-100%); transition:transform .2s ease;}
          .gp-side.open{transform:translateX(0)}
          .gp-menu{display:inline-flex}
        }

        @media (max-width: 640px){
          .gp-chat{height:calc(100vh - 190px)}
          .gp-bubble{max-width:100%}
        }
      `}</style>
    </div>
  );
}
