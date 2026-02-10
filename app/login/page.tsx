"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const onLogin = async () => {
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return setErr(error.message);

    router.refresh();
    router.replace("/admin");
  };

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>

      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button onClick={onLogin} disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>
      </div>

      {err && <p style={{ color: "red", marginTop: 12 }}>{err}</p>}
    </div>
  );
}
