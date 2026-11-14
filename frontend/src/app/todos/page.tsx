"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TodosPage() {
  const [todos, setTodos] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("todos")
      .select()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setTodos(data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Supabase Todos Integration</h1>
      {loading && <p>Loading todos...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {todos && todos.length > 0 ? (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>{todo.name}</li>
          ))}
        </ul>
      ) : (
        !loading && (
          <p style={{ color: "#666" }}>
            No todos found or table empty. Supabase client initialized and connected.
          </p>
        )
      )}
    </div>
  );
}
