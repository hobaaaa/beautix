"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);

  return isIos && isSafari;
}

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      const standalone = isStandalone();
      setInstalled(standalone);
      setIsIos(!standalone && isIosSafari());
    });

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstalled(false);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowIosHelp(false);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed || (!installPrompt && !isIos)) {
    return null;
  }

  async function handleClick() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);

      return;
    }

    setShowIosHelp((current) => !current);
  }

  return (
    <div className={compact ? "relative" : "space-y-2"}>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? "rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            : "flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
        }
        aria-label={isIos ? "Kurulum yardımını göster" : "Uygulamayı yükle"}
      >
        {isIos ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {!compact && (isIos ? "Kurulum Yardımı" : "Uygulamayı Yükle")}
      </button>

      {showIosHelp && (
        <div
          role="status"
          className={
            compact
              ? "absolute right-0 top-11 z-20 w-64 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg"
              : "rounded-lg bg-muted p-3 text-xs text-muted-foreground"
          }
        >
          Safari paylaş menüsünden “Ana Ekrana Ekle” seçeneğini kullanın.
        </div>
      )}
    </div>
  );
}
