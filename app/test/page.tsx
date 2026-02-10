"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function TestPage() {
  const [log, setLog] = useState("");

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
