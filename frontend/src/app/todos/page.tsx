"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function TodosPage() {
  const [todos, setTodos] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");
  const [newTodoName, setNewTodoName] = useState("");
  const [insertStatus, setInsertStatus] = useState<string | null>(null);

  const supabase = createClient();

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from("todos").select();
      if (error) {
        setError(error.message);
        setConnectionStatus("error");
      } else {
        setTodos(data);
        setConnectionStatus("connected");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to query Supabase");
      setConnectionStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoName.trim()) return;

    setInsertStatus("Adding...");
    const { error } = await supabase.from("todos").insert([{ name: newTodoName.trim() }]);
    if (error) {
      setInsertStatus(`Insert failed: ${error.message}`);
    } else {
      setInsertStatus("Added successfully!");
      setNewTodoName("");
      fetchTodos();
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "40px auto", padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      {/* Top Header with SocioTrack Home Link */}
      <div style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
        <Link
          href="/"
          aria-label="SocioTrack home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            color: "inherit",
            padding: "4px 8px",
            borderRadius: "14px",
            outline: "none",
          }}
          className="hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "18px",
              boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.2)",
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                SocioTrack
              </span>
              <span style={{ fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "6px", background: "#eef2ff", color: "#4f46e5" }}>
                v2.4
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Autonomous Social Intelligence &amp; Reinforcement Growth
            </div>
          </div>
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>Supabase Connection Test</h1>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "12px",
            backgroundColor: connectionStatus === "connected" ? "#dcfce7" : connectionStatus === "error" ? "#fee2e2" : "#fef3c7",
            color: connectionStatus === "connected" ? "#166534" : connectionStatus === "error" ? "#991b1b" : "#854d0e",
          }}
        >
          {connectionStatus === "connected" ? "Connected" : connectionStatus === "error" ? "Table Missing (PGRST205)" : "Connecting..."}
        </span>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "24px" }}>
        <div style={{ fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
          <strong>Project URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tgxfgjampyoskialuwcq.supabase.co"}
        </div>
        <div style={{ fontSize: "13px", color: "#475569" }}>
          <strong>Key Type:</strong> Publishable API Key (starts with <code>sb_publishable_...</code>)
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "16px", marginBottom: "24px", color: "#991b1b" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "bold" }}>⚠️ Database Table Setup Needed</h3>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", lineHeight: "1.5" }}>
            The Supabase client successfully authenticated with your project, but the <code>todos</code> table does not exist in the database yet:
          </p>
          <pre style={{ background: "#fee2e2", padding: "10px", borderRadius: "6px", fontSize: "12px", overflowX: "auto", margin: "0 0 12px 0" }}>
            {error}
          </pre>
          <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "bold" }}>To fix this in your Supabase dashboard:</p>
          <ol style={{ margin: "0 0 12px 0", paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6" }}>
            <li>Go to <a href="https://supabase.com/dashboard/project/tgxfgjampyoskialuwcq/sql" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>Supabase SQL Editor</a></li>
            <li>Run the following SQL snippet:</li>
          </ol>
          <pre style={{ background: "#1e293b", color: "#f8fafc", padding: "12px", borderRadius: "6px", fontSize: "12px", overflowX: "auto" }}>
{`create table if not exists public.todos (
  id bigint generated by default as identity primary key,
  name text not null,
  inserted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.todos enable row level security;

-- Allow public read access
create policy "Allow public read" on public.todos for select using (true);

-- Allow public insert access
create policy "Allow public insert" on public.todos for insert with check (true);

-- Insert sample rows
insert into public.todos (name) values ('First todo from SocioTrack'), ('Deploy with Supabase');`}
          </pre>
          <button
            onClick={fetchTodos}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {connectionStatus === "connected" && (
        <div>
          <form onSubmit={handleAddTodo} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Add a new todo..."
              value={newTodoName}
              onChange={(e) => setNewTodoName(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
            <button
              type="submit"
              style={{ padding: "8px 16px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
            >
              Add
            </button>
          </form>

          {insertStatus && <p style={{ fontSize: "12px", color: "#475569", marginBottom: "12px" }}>{insertStatus}</p>}

          <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Items in Supabase:</h2>
          {loading ? (
            <p style={{ color: "#64748b" }}>Loading...</p>
          ) : todos && todos.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              {todos.map((todo) => (
                <li key={todo.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                  <span>{todo.name}</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>ID: {todo.id}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#64748b" }}>No todos found. Add one above!</p>
          )}
        </div>
      )}
    </div>
  );
}
