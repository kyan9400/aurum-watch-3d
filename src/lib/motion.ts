"use client";

/* Motion preference.
   The OS "reduce motion" setting is respected by default, but many people turn animations off for speed,
   not comfort, so the visitor can switch full motion back on. The choice is remembered in localStorage;
   ?motion=full / ?motion=reduced in the URL overrides it. */

import { useSyncExternalStore } from "react";

export const MOTION_KEY = "aurum-motion";
type Choice = "full" | "reduced" | null;

export type MotionState = { reduced: boolean; systemReduced: boolean; choice: Choice };

const SERVER_STATE: MotionState = { reduced: true, systemReduced: false, choice: null };
let state: MotionState | null = null;
const listeners = new Set<() => void>();

function readChoice(): Choice {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("motion");
    if (fromUrl === "full" || fromUrl === "reduced") return fromUrl;
    const stored = window.localStorage.getItem(MOTION_KEY);
    return stored === "full" || stored === "reduced" ? stored : null;
  } catch {
    return null;
  }
}

function getState(): MotionState {
  if (!state) {
    const systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const choice = readChoice();
    const reduced = choice === "full" ? false : choice === "reduced" ? true : systemReduced;
    state = { reduced, systemReduced, choice };
    document.documentElement.classList.toggle("reduce-motion", reduced);
  }
  return state;
}

export function setMotionChoice(choice: "full" | "reduced") {
  try {
    window.localStorage.setItem(MOTION_KEY, choice);
  } catch {
    /* storage blocked: the choice lasts for this page view */
  }
  const systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  state = { reduced: choice === "reduced", systemReduced, choice };
  document.documentElement.classList.toggle("reduce-motion", state.reduced);
  listeners.forEach((l) => l());
}

export function subscribeMotion(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMotion(): MotionState {
  return typeof window === "undefined" ? SERVER_STATE : getState();
}

export function useMotion() {
  return useSyncExternalStore(subscribeMotion, getState, () => SERVER_STATE);
}
