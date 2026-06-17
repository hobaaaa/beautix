"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function TestAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [log, setLog] = useState("");
  const supabase = createSupabaseBrowserClient();

  const signIn = async () => {
    setLog("Signing in...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return setLog("SIGN IN ERROR: " + error.message);
    setLog("SIGNED IN ✅ user.id: " + data.user?.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setLog("SIGNED OUT ✅");
  };

  const testOrganizations = async () => {
    setLog("Querying organizations...");
    const { data, error } = await supabase.from("organizations").select("*");
    if (error) return setLog("SELECT ERROR: " + error.message);
    setLog("OK, rows: " + data.length + "\n" + JSON.stringify(data, null, 2));
  };
  const testAppointmentTypes = async () => {
    setLog("Querying appointment types...");
    const { data, error } = await supabase
      .from("appointment_types")
      .select("*");
    if (error) return setLog("SELECT ERROR: " + error.message);
    setLog("OK, rows: " + data.length + "\n" + JSON.stringify(data, null, 2));
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
      <h1>AUTH + RLS Test</h1>

      <div className="flex flex-col gap-2">
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

        <button onClick={signIn}>Sign in</button>
        <button onClick={signOut}>Sign out</button>
        <button onClick={testOrganizations}>Test organizations select</button>
        <button onClick={testAppointmentTypes}>
          Test appointment types select
        </button>
      </div>
      <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{log}</pre>
    </div>
  );
}
