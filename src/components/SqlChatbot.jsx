import React, { useEffect, useRef, useState } from "react";

const ENDPOINTS = {
  keyword: "https://sql-chatbot-pythonapi.vercel.app/api/generate_sql",
  cluster: "https://sql-chatbot-pythonapi.vercel.app/api/generate_sql_premium",
};
const PIPELINES = [
  { id: "keyword", label: "Basic" },
  { id: "cluster", label: "Premium" },
];

async function callGenerateSqlAPI(question, pipelineId) {
  const apiUrl = ENDPOINTS[pipelineId] || ENDPOINTS.keyword;
  const payload = { question, mode: pipelineId, schema_path: "schema_tree.json", keywords_path: "keyword_to_tables.json", dialect: "mysql" };
  const res = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  let bodyText = "";
  try { bodyText = await res.text(); } catch {}
  if (!res.ok) {
    try { const j = JSON.parse(bodyText); throw new Error(j.detail || j.message || bodyText || `HTTP ${res.status}`); }
    catch { throw new Error(bodyText || `HTTP ${res.status}`); }
  }
  let data = {};
  try { data = JSON.parse(bodyText); } catch { data = {}; }
  return { sql: data.sql ?? "", explanation: data.explanation ?? "" };
}

/* ── Icons ── */
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const DBIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const CodeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);
const ChevronIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const SpinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ animation: "spin .8s linear infinite", display: "block" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

/* ── Copy Button ── */
function CopyButton({ value = "" }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontFamily: "inherit", fontSize: 11, fontWeight: 600,
        padding: "4px 11px", borderRadius: 7,
        border: ok ? "1px solid #059669" : "1px solid #d1d5db",
        background: ok ? "#ecfdf5" : "#f9fafb",
        color: ok ? "#059669" : "#6b7280",
        cursor: "pointer", transition: "all .15s",
      }}
      onMouseEnter={e => { if (!ok) { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#374151"; } }}
      onMouseLeave={e => { if (!ok) { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#6b7280"; } }}
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1400); } catch {}
      }}
    >
      {ok ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy SQL</>}
    </button>
  );
}

/* ── Assistant Answer ── */
function AssistantAnswer({ sql, explanation, error }) {
  if (error) return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 10, padding: "10px 14px", borderRadius: 10, border: "1px solid #fecaca", background: "#fff1f2", color: "#dc2626", fontSize: 13 }}>
      <AlertIcon /><span>{explanation || "Something went wrong."}</span>
    </div>
  );
  if (!sql && !explanation) return null;
  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      {sql && (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", background: "#0f172a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "#1e293b", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#34d399" }}>
              <CodeIcon /> SQL Query
            </span>
            <CopyButton value={sql} />
          </div>
          <pre style={{ margin: 0, padding: "16px 18px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13, lineHeight: 1.8, color: "#86efac", overflowX: "auto", whiteSpace: "pre" }}>
            <code>{sql}</code>
          </pre>
        </div>
      )}
      {explanation && (
        <div style={{ background: "#f8faff", border: "1px solid #dbeafe", borderRadius: 12, padding: "13px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 8 }}>
            <InfoIcon /> Explanation
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.72, color: "#374151", whiteSpace: "pre-wrap", margin: 0 }}>{explanation}</p>
        </div>
      )}
    </div>
  );
}

/* ── Typing Dots ── */
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe", color: "#3b82f6", flexShrink: 0 }}>
        <DBIcon />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#94a3b8", display: "inline-block", animation: `bop 1.1s ${i * 0.16}s infinite ease-in-out` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function SqlChatbot() {
  const [messages, setMessages] = useState([{
    id: "seed", role: "assistant",
    text: "Hello! I'm your SQL assistant. Describe what data you need in plain English and I'll write the MySQL query for you.",
    createdAt: Date.now(),
  }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [pipeline, setPipeline] = useState(PIPELINES[0].id);
  const [open, setOpen]         = useState(true);
  const chatRef = useRef(null);
  const taRef   = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  }, [input]);

  async function handleAsk() {
    const q = input.trim(); if (!q || loading) return;
    setMessages(m => [...m, { id: crypto.randomUUID(), role: "user", text: q, createdAt: Date.now() }]);
    setInput(""); setLoading(true);
    try {
      const { sql, explanation } = await callGenerateSqlAPI(q, pipeline);
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", text: `Query generated with the ${pipeline === "cluster" ? "Premium" : "Basic"} pipeline.`, sql, explanation, createdAt: Date.now() }]);
    } catch (err) {
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", text: "Could not generate a query.", explanation: String(err?.message || err), error: true, createdAt: Date.now() }]);
    } finally { setLoading(false); taRef.current?.focus(); }
  }

  function resetChat() {
    setMessages([{ id: "seed", role: "assistant", text: "Hello! I'm your SQL assistant. Describe what data you need in plain English and I'll write the MySQL query for you.", createdAt: Date.now() }]);
    setInput("");
  }

  const examples = [
    "Total production by provider for Sep 2025",
    "New patients scheduled on 2025-10-13",
    "Top 10 procedures by revenue this year",
  ];

  const canSend = !loading && input.trim().length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{height:100%;}
        body{font-family:'Inter',system-ui,sans-serif;background:#f0f4ff;color:#1e293b;}
        textarea{font-family:'Inter',system-ui,sans-serif;}
        button{font-family:'Inter',system-ui,sans-serif;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes bop{0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-5px);opacity:1;}}
        @keyframes up{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .msg-in{animation:up .22s ease both;}
        .sb-label-fade{transition:opacity .2s ease,max-width .28s cubic-bezier(.4,0,.2,1);}
        .sb-label-fade.hide{max-width:0!important;opacity:0;overflow:hidden;}
        .grp-lbl-fade{transition:opacity .18s ease,max-height .28s ease,padding .28s ease;}
        .grp-lbl-fade.hide{max-height:0!important;opacity:0!important;padding-top:0!important;padding-bottom:0!important;overflow:hidden;pointer-events:none;}
        .tick-fade{transition:opacity .15s;}
        .tick-fade.hide{opacity:0;width:0;overflow:hidden;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;}
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f0f4ff" }}>

        {/* ══════════════ SIDEBAR ══════════════ */}
        <aside style={{
          width: open ? 260 : 60,
          transition: "width .28s cubic-bezier(.4,0,.2,1)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          padding: "12px 10px",
          gap: 3,
          overflow: "hidden",
          boxShadow: "2px 0 12px rgba(99,102,241,0.07)",
        }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px 14px", borderBottom: "1px solid #f1f5f9", marginBottom: 6, flexShrink: 0 }}>
            {/* Toggle button — full contrast, always visible */}
            <button
              onClick={() => setOpen(v => !v)}
              title={open ? "Collapse sidebar" : "Expand sidebar"}
              style={{
                width: 38, height: 38, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#6366f1",
                border: "none",
                borderRadius: 10,
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
                transition: "background .15s, box-shadow .15s, transform .1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#4f46e5"; e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <MenuIcon />
            </button>
            <span className="sb-label-fade" style={{ maxWidth: 160, fontWeight: 700, fontSize: 15, color: "#1e293b", whiteSpace: "nowrap", letterSpacing: "-.02em" }}
              {...(!open ? { className: "sb-label-fade hide" } : {})}>
              QueryAI
            </span>
          </div>

          {/* New chat */}
          <button
            onClick={resetChat}
            title="New chat"
            style={{
              display: "flex", alignItems: "center", gap: 9,
              width: "100%", height: 40, padding: "0 10px",
              borderRadius: 10,
              border: "1.5px solid #6366f1",
              background: "#eef2ff",
              color: "#6366f1",
              fontSize: 13, fontWeight: 600,
              cursor: "pointer", flexShrink: 0, overflow: "hidden",
              transition: "background .14s, border-color .14s",
              marginBottom: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#e0e7ff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#eef2ff"; }}
          >
            <span style={{ display: "flex", flexShrink: 0 }}><PlusIcon /></span>
            <span className={`sb-label-fade${!open ? " hide" : ""}`} style={{ maxWidth: 160, whiteSpace: "nowrap" }}>New chat</span>
          </button>

          {/* Sep */}
          <div style={{ height: 1, background: "#f1f5f9", margin: "6px 2px", flexShrink: 0 }} />

          {/* Pipeline */}
          <div className={`grp-lbl-fade${!open ? " hide" : ""}`} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#94a3b8", padding: "6px 11px 4px", maxHeight: 34, flexShrink: 0 }}>
            Pipeline
          </div>
          {PIPELINES.map(p => {
            const isActive = pipeline === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPipeline(p.id)}
                title={p.label}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", height: 38, padding: "0 10px",
                  borderRadius: 9,
                  border: isActive ? "1.5px solid #c7d2fe" : "1.5px solid transparent",
                  background: isActive ? "#eef2ff" : "transparent",
                  color: isActive ? "#4f46e5" : "#64748b",
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  cursor: "pointer", flexShrink: 0, overflow: "hidden",
                  transition: "all .13s",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
              >
                <span style={{
                  width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                  background: isActive ? "#6366f1" : "#cbd5e1",
                  boxShadow: isActive ? "0 0 7px rgba(99,102,241,0.65)" : "none",
                  transition: "background .2s, box-shadow .2s",
                }} />
                <span className={`sb-label-fade${!open ? " hide" : ""}`} style={{ flex: 1, maxWidth: 140, whiteSpace: "nowrap", textAlign: "left" }}>{p.label}</span>
                <span className={`tick-fade${!open ? " hide" : ""}`} style={{ color: "#6366f1", display: "flex", flexShrink: 0, opacity: isActive ? 1 : 0, width: isActive ? "auto" : 0, overflow: "hidden" }}>
                  {isActive && <CheckIcon />}
                </span>
              </button>
            );
          })}

          {/* Sep */}
          <div style={{ height: 1, background: "#f1f5f9", margin: "6px 2px", flexShrink: 0 }} />

          {/* Examples */}
          <div className={`grp-lbl-fade${!open ? " hide" : ""}`} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#94a3b8", padding: "6px 11px 4px", maxHeight: 34, flexShrink: 0 }}>
            Examples
          </div>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setInput(ex); taRef.current?.focus(); }}
              title={ex}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                width: "100%", height: 36, padding: "0 10px",
                borderRadius: 8, border: "none",
                background: "transparent",
                color: "#64748b",
                fontSize: 12, fontWeight: 500,
                cursor: "pointer", flexShrink: 0, overflow: "hidden",
                textAlign: "left", transition: "background .13s, color .13s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
            >
              <span style={{ color: "#cbd5e1", display: "flex", flexShrink: 0 }}><ChevronIcon /></span>
              <span className={`sb-label-fade${!open ? " hide" : ""}`} style={{ maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex}</span>
            </button>
          ))}

          {/* Footer */}
          <div style={{ marginTop: "auto", flexShrink: 0 }}>
            <div style={{ height: 1, background: "#f1f5f9", margin: "8px 2px 8px" }} />
            <button
              onClick={resetChat}
              title="Clear session"
              style={{
                display: "flex", alignItems: "center", gap: 9,
                width: "100%", height: 36, padding: "0 10px",
                borderRadius: 8, border: "none",
                background: "transparent", color: "#94a3b8",
                fontSize: 13, cursor: "pointer", flexShrink: 0,
                overflow: "hidden", transition: "background .13s, color .13s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <span style={{ display: "flex", flexShrink: 0 }}><TrashIcon /></span>
              <span className={`sb-label-fade${!open ? " hide" : ""}`} style={{ maxWidth: 160, whiteSpace: "nowrap" }}>Clear session</span>
            </button>
          </div>
        </aside>

        {/* ══════════════ MAIN ══════════════ */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, height: "100vh", overflow: "hidden" }}>

          {/* Topbar */}
          <header style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 24px", height: 58, flexShrink: 0,
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(99,102,241,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", letterSpacing: "-.025em" }}>SQL Assistant</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                padding: "3px 11px", borderRadius: 999,
                background: "#eef2ff", color: "#6366f1",
                border: "1.5px solid #c7d2fe",
              }}>
                {pipeline === "cluster" ? "Premium" : "Basic"}
              </span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: "#94a3b8",
              background: "#f8fafc", border: "1px solid #e2e8f0",
              padding: "4px 13px", borderRadius: 999,
            }}>MySQL</span>
          </header>

          {/* Chat */}
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "32px 24px", background: "#f0f4ff" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
              {messages.map((m, i) => (
                <div key={m.id} className="msg-in" style={{ display: "flex", alignItems: "flex-start", gap: 13, flexDirection: m.role === "user" ? "row-reverse" : "row", animationDelay: `${i * 0.02}s` }}>
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0, marginTop: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: m.role === "assistant" ? "linear-gradient(135deg,#eff6ff,#dbeafe)" : "linear-gradient(135deg,#f5f3ff,#ede9fe)",
                    border: m.role === "assistant" ? "1.5px solid #bfdbfe" : "1.5px solid #ddd6fe",
                    color: m.role === "assistant" ? "#3b82f6" : "#7c3aed",
                    boxShadow: m.role === "assistant" ? "0 2px 8px rgba(59,130,246,0.15)" : "0 2px 8px rgba(124,58,237,0.15)",
                  }}>
                    {m.role === "assistant" ? <DBIcon /> : <UserIcon />}
                  </div>

                  {/* Bubble */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: m.role === "assistant" ? "#3b82f6" : "#7c3aed" }}>
                        {m.role === "user" ? "You" : "QueryAI"}
                      </span>
                      <span style={{ fontSize: 11, color: "#cbd5e1" }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{
                      display: "inline-block",
                      fontSize: 14, lineHeight: 1.7,
                      padding: "13px 17px",
                      borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      whiteSpace: "pre-wrap", maxWidth: "100%",
                      ...(m.role === "assistant" ? {
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                        boxShadow: "0 2px 8px rgba(99,102,241,0.06)",
                      } : {
                        background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                        border: "none",
                        color: "#fff",
                        boxShadow: "0 4px 16px rgba(99,102,241,0.38)",
                      }),
                    }}>
                      {m.text}
                    </div>
                    {m.role === "assistant" && <AssistantAnswer sql={m.sql} explanation={m.explanation} error={m.error} />}
                  </div>
                </div>
              ))}
              {loading && <TypingDots />}
            </div>
          </div>

          {/* Composer */}
          <div style={{
            flexShrink: 0, padding: "14px 24px 12px",
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            boxShadow: "0 -2px 12px rgba(99,102,241,0.05)",
          }}>
            <div style={{
              maxWidth: 800, margin: "0 auto",
              display: "flex", alignItems: "flex-end", gap: 10,
              background: "#f8faff",
              border: "1.5px solid #c7d2fe",
              borderRadius: 18,
              padding: "11px 11px 11px 18px",
              boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
              transition: "border-color .2s, box-shadow .2s",
            }}
              onFocus={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.12)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(99,102,241,0.08)"; }}
            >
              <textarea
                ref={taRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                placeholder="Ask in plain English… e.g. 'Revenue by department last quarter'"
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  resize: "none", fontSize: 14, lineHeight: 1.55, color: "#1e293b",
                  minHeight: 26, maxHeight: 150, overflowY: "auto", padding: 0,
                  fontFamily: "inherit",
                }}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                }}
              />
              {/* Send button — always maximum visibility */}
              <button
                onClick={handleAsk}
                disabled={!canSend}
                title="Send"
                style={{
                  width: 44, height: 44, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 13, border: "none", cursor: canSend ? "pointer" : "not-allowed",
                  background: canSend ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#e2e8f0",
                  color: canSend ? "#ffffff" : "#94a3b8",
                  boxShadow: canSend ? "0 4px 14px rgba(99,102,241,0.5)" : "none",
                  transition: "all .15s",
                  transform: "scale(1)",
                }}
                onMouseEnter={e => { if (canSend) { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.65)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = canSend ? "0 4px 14px rgba(99,102,241,0.5)" : "none"; }}
              >
                {loading ? <SpinIcon /> : <SendIcon />}
              </button>
            </div>
            <p style={{ maxWidth: 800, margin: "9px auto 0", textAlign: "center", fontSize: 11, color: "#cbd5e1" }}>
              Always review generated queries before running them on production data.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


