"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "../store";
import { clearSession } from "../lib/sessionLogout";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "click",
  "visibilitychange",
];

export default function InactivityLogout() {
  const authData = useAppStore((s) => s.authData);
  const userId = useAppStore((s) => s.userId);
  const isLoggedIn = Boolean(authData?.accessToken || userId);

  const timerRef = useRef<number | null>(null);
  const loggedInRef = useRef(isLoggedIn);
  loggedInRef.current = isLoggedIn;

  useEffect(() => {
    if (!isLoggedIn) return;

    const clear = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const triggerLogout = async () => {
      clear();
      if (!loggedInRef.current) return;
      try {
        await clearSession();
      } catch (e) {
        console.error("Inactivity logout failed", e);
      }
    };

    const schedule = () => {
      clear();
      timerRef.current = window.setTimeout(triggerLogout, IDLE_TIMEOUT_MS);
    };

    const onActivity = () => {
      if (document.visibilityState === "hidden") return;
      schedule();
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      document.addEventListener(evt, onActivity, { passive: true })
    );
    schedule();

    return () => {
      clear();
      ACTIVITY_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, onActivity)
      );
    };
  }, [isLoggedIn]);

  return null;
}
