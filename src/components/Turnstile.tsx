"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      size: "compact";
      language: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileProps = {
  onToken: (token: string) => void;
  onError: () => void;
  generation: number;
  locale: string;
};

export function Turnstile({ onToken, onError, generation, locale }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleError = useCallback(() => {
    onToken("");
    onError();
  }, [onToken, onError]);

  useEffect(() => {
    const element = container.current;
    const api = window.turnstile;

    if (!ready || !siteKey || !element || !api) {
      return;
    }

    const widgetId = api.render(element, {
      sitekey: siteKey,
      action: "contact",
      size: "compact",
      language: locale,

      callback: onToken,

      "expired-callback": () => {
        onToken("");
      },

      "error-callback": handleError,
    });

    return () => {
      api.remove(widgetId);
    };
  }, [ready, siteKey, locale, generation, onToken, handleError]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
        onError={handleError}
      />

      <div ref={container} />
    </>
  );
}
