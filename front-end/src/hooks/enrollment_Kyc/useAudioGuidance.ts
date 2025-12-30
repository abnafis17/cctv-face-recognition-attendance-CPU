"use client";

import { useRef, useCallback } from "react";

export function useAudioGuidance() {
  const lastSpokenRef = useRef<string>("");
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq = 900, duration = 0.12) => {
    try {
      if (typeof window === "undefined") return;
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      ctx.resume?.();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.08;

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // no-op; audio may be blocked by browser
    }
  }, []);

  const speak = useCallback((text: string) => {
    try {
      if (!text) return;
      if (lastSpokenRef.current === text) return;
      lastSpokenRef.current = text;

      const synth = window.speechSynthesis;
      if (!synth) return;

      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      synth.speak(u);
    } catch {
      // no-op
    }
  }, []);

  return { playTone, speak, lastSpokenRef };
}
