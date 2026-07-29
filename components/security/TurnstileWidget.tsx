"use client";

import { useEffect, useId, useRef, useState } from "react";

type TurnstileWidgetProps = {
  action: string;
  token: string;
  onTokenChange: (token: string) => void;
  resetKey?: number;
};

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "dark";
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cloudflare-turnstile-script";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function loadTurnstileScript() {
  if (document.getElementById(SCRIPT_ID)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile_script_failed"));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({
  action,
  token,
  onTokenChange,
  resetKey = 0,
}: TurnstileWidgetProps) {
  const generatedId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!SITE_KEY || !containerRef.current) {
      return;
    }

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) {
          return;
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          theme: "dark",
          callback: onTokenChange,
          "expired-callback": () => onTokenChange(""),
          "error-callback": () => onTokenChange(""),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setScriptFailed(true);
          onTokenChange("");
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, generatedId, onTokenChange]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChange("");
    }
  }, [resetKey, onTokenChange]);

  if (!SITE_KEY && process.env.NODE_ENV !== "production") {
    return null;
  }

  if (!SITE_KEY || scriptFailed) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
        Güvenlik doğrulaması yüklenemedi.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="min-h-[65px]" />
      {!token ? (
        <p className="text-xs text-muted-foreground">
          Devam etmek için güvenlik doğrulamasının tamamlanmasını bekleyin.
        </p>
      ) : null}
    </div>
  );
}
