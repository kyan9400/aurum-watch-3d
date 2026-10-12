"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ACESFilmicToneMapping } from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { TIERS, type Tier } from "@/lib/quality";
import { getStage, subscribeStage, type StagePhases } from "@/lib/stage";
import { getConfig, onYawNudge, subscribeConfig } from "@/lib/store";
import { getMotion, subscribeMotion } from "@/lib/motion";
import { WatchModel } from "./watchModel";

type Props = { tier: Tier; onReady: () => void; onLost: () => void };

function WatchCanvas({ tier, onReady, onLost }: Props) {
  const settings = TIERS[tier];
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, settings.dprCap]}
      gl={{ antialias: settings.antialias, alpha: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 30, position: [0, 0, 7.6], near: 0.1, far: 40 }}
      style={{ touchAction: "pan-y" }}
      aria-hidden="true"
      onCreated={({ gl }) => {
        // ACES keeps the gold warm (AgX greys it out)
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <ambientLight intensity={0.08} />
      <directionalLight position={[3, 4, 5]} intensity={1.7} color="#fff3e2" />
      <directionalLight position={[-4, -1, 2]} intensity={0.35} color="#ffd9a8" />
      {/* warm rim from behind-left: outlines the lugs, crown and strap edges against the dark */}
      <directionalLight position={[-4, 3, -4]} intensity={2.4} color="#ffb766" />
      <Environment resolution={settings.envResolution} frames={1}>
        {/* a small photo studio, made of light panels (no HDRI download) */}
        <Lightformer form="rect" intensity={3.2} position={[0, 4, 2]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.8} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 1.2, 1]} color="#fff1dc" />
        <Lightformer form="rect" intensity={1.4} position={[5, 0, 0]} rotation-y={-Math.PI / 2} scale={[6, 0.8, 1]} />
        <Lightformer form="ring" intensity={1.2} position={[2, 2, 5]} scale={2.5} color="#ffe7c2" />
        <Lightformer form="rect" intensity={0.6} position={[0, -4, 1]} rotation-x={-Math.PI / 2} scale={[8, 4, 1]} color="#5a4630" />
        {/* two long thin strips about 35° up: crisp highlight lines along the polished bevels */}
        <Lightformer form="rect" intensity={4} position={[-3.2, 3.4, 3.2]} scale={[12, 0.25, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={4} position={[3.2, 3.4, 3.2]} scale={[12, 0.25, 1]} target={[0, 0, 0]} />
        {/* the studio's warm amber softbox (left) and a cool steel kicker (right): gold reads warm and cool at once */}
        <Lightformer form="rect" intensity={5} position={[-6, 0.5, -1]} scale={[1.6, 9, 1]} target={[0, 0, 0]} color="#ffae52" />
        <Lightformer form="rect" intensity={2.2} position={[6, 1.5, -2]} scale={[1.2, 7, 1]} target={[0, 0, 0]} color="#a9c2ff" />
      </Environment>
      <WatchRig tier={tier} onReady={onReady} onLost={onLost} />
    </Canvas>
  );
}

// memo: the stage re-renders on every phase change; the scene (and the env "lights on" ramp) should not
export default memo(WatchCanvas);

/* Builds the watch in slices (yielding between them), then hands it to the live rig. */
function WatchRig({ tier, onReady, onLost }: Props) {
  const gl = useThree((s) => s.gl);
  const [model, setModel] = useState<WatchModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    let built: WatchModel | null = null;
    WatchModel.create(TIERS[tier], getConfig(), Math.min(8, gl.capabilities.getMaxAnisotropy()), () => cancelled).then((m) => {
      if (cancelled) {
        m?.dispose();
        return;
      }
      built = m;
      setModel(m);
    });
    return () => {
      cancelled = true;
      built?.dispose();
    };
  }, [tier, gl]);

  return model ? <LiveWatch model={model} tier={tier} onReady={onReady} onLost={onLost} /> : null;
}

function LiveWatch({ model, tier, onReady, onLost }: Props & { model: WatchModel }) {
  const settings = TIERS[tier];
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);

  // mutable per-frame state lives in one ref (never React state)
  const live = useRef({
    target: { toConfig: 0, toExplode: 0, explode: 0 } as StagePhases,
    inView: true,
    reduced: true,
    // "lights on" intro: environment ramps up as the poster leaves
    rampStart: -1,
    ramping: false,
    // adaptive resolution
    avg: 16.7,
    dpr: 1,
    settleUntil: 0,
    calmSince: 0,
    lastRaise: -1e9,
    bounces: 0,
  });

  // scroll -> phase targets, config -> materials, motion preference, visibility, tick timer, drag
  useEffect(() => {
    const st = live.current;
    st.reduced = getMotion().reduced;
    st.dpr = Math.min(window.devicePixelRatio || 1, settings.dprCap);
    const copy = (s: StagePhases) => {
      st.target.toConfig = s.toConfig;
      st.target.toExplode = s.toExplode;
      st.target.explode = s.explode;
    };
    copy(getStage());

    // one shared scroll reader for the whole page
    const unStage = subscribeStage((s) => {
      copy(s);
      if (st.inView) invalidate();
    });

    const unConfig = subscribeConfig(() => {
      model.applyConfig(getConfig(), st.reduced);
      invalidate();
    });
    const unMotion = subscribeMotion(() => {
      st.reduced = getMotion().reduced;
      invalidate();
    });
    const unYaw = onYawNudge((d) => {
      model.addYaw(d);
      invalidate();
    });

    // pause when the stage is off-screen
    const io = new IntersectionObserver(([entry]) => {
      st.inView = entry.isIntersecting;
      if (st.inView) invalidate();
    });
    io.observe(gl.domElement);

    // one frame per second for the seconds hand, aligned to the clock
    let interval = 0;
    const startTick = () => {
      window.clearInterval(interval);
      const align = window.setTimeout(() => {
        if (st.inView && !document.hidden) invalidate();
        interval = window.setInterval(() => {
          if (st.inView && !document.hidden) invalidate();
        }, 1000);
      }, 1000 - (Date.now() % 1000));
      return align;
    };
    let align = startTick();
    const onVisibility = () => {
      window.clearTimeout(align);
      window.clearInterval(interval);
      if (!document.hidden) {
        align = startTick();
        invalidate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // horizontal drag turns the watch (vertical stays native scroll via touch-action: pan-y)
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    const down = (e: PointerEvent) => {
      if (st.target.toConfig < 0.5 || st.target.toExplode > 0.5) return;
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      model.addYaw((e.clientX - lastX) * 0.012);
      lastX = e.clientX;
      invalidate();
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "";
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    const lost = (e: Event) => {
      e.preventDefault();
      onLost();
    };
    el.addEventListener("webglcontextlost", lost);

    return () => {
      unStage();
      unConfig();
      unMotion();
      unYaw();
      io.disconnect();
      window.clearTimeout(align);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("webglcontextlost", lost);
    };
  }, [gl, invalidate, model, onLost, settings]);

  // warm-up behind the poster: fonts -> dial text -> compile shaders -> first frame -> reveal
  useEffect(() => {
    let cancelled = false;
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    fonts
      .then(() => {
        if (cancelled) return;
        model.redrawText();
        // let the browser breathe before the shader compile
        return new Promise<void>((resolve) => setTimeout(resolve, 0)).then(() => {
          if (!cancelled) return gl.compileAsync(scene, camera);
        });
      })
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        const st = live.current;
        if (st.reduced) scene.environmentIntensity = 1;
        else {
          scene.environmentIntensity = 0.15;
          st.ramping = true;
          st.rampStart = -1;
        }
        invalidate();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (cancelled) return;
            onReady();
            model.startSweep(live.current.reduced);
            invalidate();
          }),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, model, invalidate, onReady]);

  useFrame((state, delta) => {
    const st = live.current;
    let more = model.update({
      delta,
      elapsed: state.clock.elapsedTime,
      target: st.target,
      reduced: st.reduced,
      inView: st.inView,
      vw: state.viewport.width,
      vh: state.viewport.height,
      aspect: state.size.width / Math.max(1, state.size.height),
    });

    // adaptive resolution: only consecutive frames count (render on demand leaves gaps)
    const ms = delta * 1000;
    const now = state.clock.elapsedTime * 1000;
    if (ms > 4 && ms < 100) {
      st.avg += (ms - st.avg) * 0.1;
      if (now > st.settleUntil) {
        const cap = Math.min(window.devicePixelRatio || 1, settings.dprCap);
        if (st.avg > 24 && st.dpr > 0.75) {
          if (now - st.lastRaise < 3000) st.bounces++;
          st.dpr = Math.max(0.75, st.dpr - 0.25);
          setDpr(st.dpr);
          st.settleUntil = now + 700;
          st.avg = 16.7;
          st.calmSince = 0;
        } else if (st.avg < 17.5 && st.dpr < cap && st.bounces < 2) {
          if (!st.calmSince) st.calmSince = now;
          if (now - st.calmSince > 2500) {
            st.dpr = Math.min(cap, st.dpr + 0.25);
            setDpr(st.dpr);
            st.lastRaise = now;
            st.settleUntil = now + 700;
            st.calmSince = 0;
          }
        } else st.calmSince = 0;
      }
    }

    // lights on: 0.15 -> 1 over 1.4 s, ease-out
    if (st.ramping) {
      if (st.reduced) {
        state.scene.environmentIntensity = 1;
        st.ramping = false;
      } else {
        if (st.rampStart < 0) st.rampStart = state.clock.elapsedTime;
        const k = Math.min(1, (state.clock.elapsedTime - st.rampStart) / 1.4);
        state.scene.environmentIntensity = 0.15 + 0.85 * (1 - Math.pow(1 - k, 3));
        if (k < 1) more = true;
        else st.ramping = false;
      }
    }

    if (more && st.inView && !document.hidden) invalidate();
  });

  return <primitive object={model.root} />;
}
