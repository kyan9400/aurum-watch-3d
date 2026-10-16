"use client";

/* The atelier's first piece (Meridian No. 1, 1911): a real photogrammetry-grade pocket watch scan (Poly Haven, CC0),
   lit by a real studio HDRI (Poly Haven, CC0, 1K), both served from /public. This chunk is imported only when the
   atelier section nears the viewport, so it never competes with the hero. Gentle turntable in full motion; a still
   three-quarter view with reduced motion. Renders only while on screen. */

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ACESFilmicToneMapping, Box3, Group, Vector3, type Mesh, type MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { getMotion, subscribeMotion } from "@/lib/motion";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const MODEL_URL = `${BASE}/models/pocket-watch-1911.glb`;
export const HDRI_URL = `${BASE}/hdri/studio_small_08_1k.hdr`;

type Props = { dprCap: number; onReady: () => void; onLost: () => void };

export default function HeritageCanvas({ dprCap, onReady, onLost }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [reduced, setReduced] = useState(() => getMotion().reduced);

  useEffect(() => subscribeMotion(() => setReduced(getMotion().reduced)), []);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        // turntable: continuous while visible in full motion; otherwise one frame on demand
        frameloop={inView && !reduced ? "always" : "demand"}
        dpr={[1, dprCap]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: 26, position: [0, 0, 6.2], near: 0.1, far: 30 }}
        aria-hidden="true"
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onLost();
          });
        }}
      >
        {/* warm key from the upper left and a soft rim from behind: the engraving reads in relief */}
        <directionalLight position={[-3, 4, 4]} intensity={1.2} color="#fff1dc" />
        <directionalLight position={[3, 1.5, -4]} intensity={1.6} color="#ffc27a" />
        <Suspense fallback={null}>
          <Environment files={HDRI_URL} environmentIntensity={1.1} />
          <PocketWatch reduced={reduced} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function PocketWatch({ reduced, onReady }: { reduced: boolean; onReady: () => void }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const spin = useRef<Group>(null);

  // the scan stands dial-forward (+Z); centre it and fit it to a 2.6-unit frame
  const model = useMemo(() => {
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const s = 2.6 / Math.max(size.x, size.y, size.z);
    const holder = new Group();
    root.position.sub(centre);
    holder.add(root);
    holder.scale.setScalar(s);
    root.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as MeshStandardMaterial;
      if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 1.15;
    });
    return holder;
  }, [gltf]);

  // compile the shaders before revealing, so the first turn is smooth
  useLayoutEffect(() => {
    let alive = true;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!alive) return;
        invalidate();
        requestAnimationFrame(() => requestAnimationFrame(() => alive && onReady()));
      });
    return () => {
      alive = false;
    };
  }, [gl, scene, camera, invalidate, onReady]);

  useFrame((state, delta) => {
    const g = spin.current;
    if (!g) return;
    if (reduced) {
      g.rotation.set(0.08, -0.5, 0);
      return;
    }
    // slow turntable with a gentle nod; never faster than ~13 s per turn
    g.rotation.y += Math.min(delta, 0.05) * 0.48;
    g.rotation.x = 0.08 + Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
  });

  return (
    <group ref={spin} rotation={[0.08, -0.5, 0]}>
      <primitive object={model} />
    </group>
  );
}
