"use client";

import { Download, Share } from "lucide-react";
import type { Locale } from "@/lib/i18n/constants";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type IosInstallGuide = "ios-safari" | "ios-chrome" | null;

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;

  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

function getIosInstallGuide(): IosInstallGuide {
  if (!isIosDevice()) {
    return null;
  }

  const userAgent = window.navigator.userAgent;

  if (/CriOS/.test(userAgent)) {
    return "ios-chrome";
  }

  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);

  return isSafari ? "ios-safari" : null;
}

function getInstallLabels(locale?: Locale) {
  if (locale === "en") {
    return {
      install: "Install App",
      installHelp: "Install Help",
      showInstallHelp: "Show install help",
      iosSafariHelp: ['Use "Share > Add to Home Screen" from the browser menu.'],
      iosChromeHelp: [
        'To use Artexo as an app, tap the Share button and choose "Add to Home Screen".',
        'If you cannot see "Add to Home Screen", open this page in Safari and repeat the same step.',
      ],
    };
  }

  return {
    install: "Uygulamayı Yükle",
    installHelp: "Kurulum Yardımı",
    showInstallHelp: "Kurulum yardımını göster",
    iosSafariHelp: ['Paylaş menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.'],
    iosChromeHelp: [
      "Artexo'yu uygulama olarak kullanmak için Paylaş düğmesine dokunun ve Ana Ekrana Ekle seçeneğini seçin.",
      "Ana Ekrana Ekle seçeneğini göremiyorsanız bu sayfayı Safari'de açarak aynı işlemi yapabilirsiniz.",
    ],
  };
}

function getInstallHelpText(iosGuide: IosInstallGuide, locale?: Locale) {
  const labels = getInstallLabels(locale);

  if (iosGuide === "ios-chrome") {
    return labels.iosChromeHelp;
  }

  return labels.iosSafariHelp;
}

export function InstallAppButton({
  compact = false,
  locale,
}: {
  compact?: boolean;
  locale?: Locale;
}) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [iosGuide, setIosGuide] = useState<IosInstallGuide>(null);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      const standalone = isStandalone();
      setInstalled(standalone);
      setIosGuide(standalone ? null : getIosInstallGuide());
    });

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (isStandalone()) {
        return;
      }

      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstalled(false);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowHelp(false);
      setIosGuide(null);
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

  if (installed || (!installPrompt && !iosGuide)) {
    return null;
  }

  async function handleClick() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);

      return;
    }

    setShowHelp((current) => !current);
  }

  const isManualInstall = Boolean(iosGuide);
  const labels = getInstallLabels(locale);
  const helpText = getInstallHelpText(iosGuide, locale);

  return (
    <div className={compact ? "relative" : "space-y-2"}>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            : "flex min-h-11 w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
        }
        aria-label={isManualInstall ? labels.showInstallHelp : labels.install}
      >
        {isManualInstall ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {!compact && (isManualInstall ? labels.installHelp : labels.install)}
      </button>

      {showHelp && isManualInstall && (
        <div
          role="status"
          className={
            compact
              ? "absolute right-0 top-12 z-20 w-[min(18rem,calc(100vw-2rem))] space-y-2 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg"
              : "space-y-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground"
          }
        >
          {helpText.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      )}
    </div>
  );
}

