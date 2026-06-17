"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function TestPage() {
  const [log, setLog] = useState("");
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase
      .from("organizations")
      .select("*")
      .then(({ data, error }) => {
        if (error) setLog("ERROR: " + error.message);
        else setLog("OK, rows: " + data.length);
      });
  }, []);

  return <pre>{log}</pre>;
}
