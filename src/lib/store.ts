"use client";

import { useSyncExternalStore } from "react";
import type { CaseId, DialId, StrapId } from "./options";

export type WatchConfig = { case: CaseId; dial: DialId; strap: StrapId };

export const DEFAULT_CONFIG: WatchConfig = { case: "yellow", dial: "midnight", strap: "cognac" };

let config: WatchConfig = DEFAULT_CONFIG;
const listeners = new Set<() => void>();

export function getConfig() {
  return config;
}

export function setConfig(patch: Partial<WatchConfig>) {
  config = { ...config, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeConfig(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useConfig() {
  return useSyncExternalStore(subscribeConfig, getConfig, () => DEFAULT_CONFIG);
}

/* Button rotation for the configurator (dragging the canvas does the same). */
type YawListener = (delta: number) => void;
const yawListeners = new Set<YawListener>();

export function nudgeYaw(delta: number) {
  yawListeners.forEach((l) => l(delta));
}

export function onYawNudge(listener: YawListener) {
  yawListeners.add(listener);
  return () => {
    yawListeners.delete(listener);
  };
}
