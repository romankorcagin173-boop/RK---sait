"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createFlutedBottleGeometry, type BottleProfilePoint } from "@/lib/flutedBottleGeometry";

const BODY_PROFILE: BottleProfilePoint[] = [
  { y: 0.0, radius: 0.6, ribAmount: 1 },
  { y: 0.05, radius: 0.62, ribAmount: 1 },
  { y: 1.3, radius: 0.62, ribAmount: 1 },
  { y: 1.5, radius: 0.5, ribAmount: 0.55 },
  { y: 1.68, radius: 0.3, ribAmount: 0.12 },
  { y: 1.82, radius: 0.17, ribAmount: 0 },
  { y: 2.05, radius: 0.17, ribAmount: 0 },
];

const MIST_COUNT = 12;

function Nozzle() {
  return (
    <mesh position={[0, 2.1, 0.05]}>
      <boxGeometry args={[0.22, 0.06, 0.16]} />
      <meshStandardMaterial color="#a3272a" roughness={0.5} metalness={0.2} />
    </mesh>
  );
}

function Bottle({ triggerEl }: { triggerEl: HTMLDivElement }) {
  const groupRef = useRef<THREE.Group>(null);
  const capLiftRef = useRef<THREE.Group>(null);
  const capTiltRef = useRef<THREE.Group>(null);
  const mistRefs = useRef<(THREE.Mesh | null)[]>([]);
  const liquidRef = useRef<THREE.Mesh>(null);

  const bodyGeometry = useMemo(() => createFlutedBottleGeometry({ profile: BODY_PROFILE }), []);
  const liquidGeometry = useMemo(
    () =>
      createFlutedBottleGeometry({
        profile: BODY_PROFILE.filter((p) => p.y <= 1.2).map((p) => ({ ...p, radius: p.radius - 0.04 })),
        ribCount: 16,
        ribDepth: 0,
      }),
    []
  );

  const labelTexture = useMemo(() => {
    const texture = new THREE.TextureLoader().load("/brand/rk-card-front.svg");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, []);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mistMeshes = mistRefs.current.filter((m): m is THREE.Mesh => Boolean(m));
    const mistSeeds = mistMeshes.map((_, i) => {
      const angle = (i / MIST_COUNT) * Math.PI * 2;
      return { x: Math.cos(angle) * 0.28, z: Math.sin(angle) * 0.28 };
    });

    gsap.set(groupRef.current!.scale, { x: 0.92, y: 0.92, z: 0.92 });
    gsap.set(groupRef.current!.position, { y: -1.4 });
    // capLiftRef/capTiltRef keep their JSX rest positions/rotations — do
    // NOT gsap.set those here, that would stomp the values React set.
    mistMeshes.forEach((m) => {
      m.position.set(0, 2.15, 0.1);
      m.scale.setScalar(0.001);
      (m.material as THREE.MeshBasicMaterial).opacity = 0;
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top top",
          end: () => "+=" + window.innerHeight * 2.4,
          scrub: 1,
        },
      });

      // Whole bottle: fades/settles in, then does a slow showcase turn so
      // the fluted glass catches light differently across the scroll —
      // the kind of depth a flat illustration can't fake.
      tl.to(groupRef.current!.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "power2.out" }, 0)
        .to(groupRef.current!.position, { y: -1.3, duration: 0.2, ease: "power2.out" }, 0)
        .to(groupRef.current!.rotation, { y: -0.32, duration: 1, ease: "none" }, 0)
        .to(groupRef.current!.rotation, { y: 0.4, duration: 1, ease: "power1.inOut" }, 1)
        // Cap: lifts up while actually spinning around its own axis, like a
        // real cap being unscrewed — only possible because this is real 3D.
        // capLiftRef handles the straight-up translation; capTiltRef spins
        // and tilts around the cap's own base so it pivots in place instead
        // of swinging around the bottle's origin.
        .to(
          capLiftRef.current!.position,
          { y: "+=0.9", duration: 0.32, ease: "power3.inOut" },
          0.16
        )
        .to(
          capTiltRef.current!.rotation,
          { y: Math.PI * 3.2, duration: 0.32, ease: "power2.in" },
          0.16
        )
        .to(capTiltRef.current!.rotation, { z: 0.18, duration: 0.3, ease: "power2.out" }, 0.3)
        // Mist: a believable scatter of small droplets bursting from the
        // nozzle in true 3D space (some drift toward/away from the camera).
        .to(
          mistMeshes.map((m) => m.scale),
          { x: 1, y: 1, z: 1, duration: 0.22, ease: "power1.out", stagger: 0.02 },
          0.4
        )
        .to(
          mistMeshes.map((m) => (m.material as THREE.MeshBasicMaterial)),
          { opacity: 0.85, duration: 0.18, stagger: 0.02 },
          0.4
        )
        .to(
          mistMeshes.map((m) => m.position),
          {
            y: "+=0.55",
            x: (i) => mistSeeds[i].x,
            z: (i) => mistSeeds[i].z + (i % 2 === 0 ? 0.15 : -0.15),
            duration: 0.5,
            ease: "power1.out",
            stagger: 0.02,
          },
          0.42
        )
        .to(
          mistMeshes.map((m) => (m.material as THREE.MeshBasicMaterial)),
          { opacity: 0, duration: 0.3, stagger: 0.02 },
          0.68
        );
    });

    return () => ctx.revert();
  }, [triggerEl]);

  return (
    <group ref={groupRef} position={[0, -1.3, 0]}>
      {/* glass body */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#241a19"
          transmission={0.88}
          roughness={0.1}
          thickness={0.5}
          ior={1.4}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
          attenuationColor="#8a1414"
          attenuationDistance={0.9}
        />
      </mesh>

      {/* liquid glow inside */}
      <mesh ref={liquidRef} geometry={liquidGeometry}>
        <meshStandardMaterial color="#7c1616" roughness={0.35} metalness={0.05} />
      </mesh>

      {/* label plaque */}
      <mesh position={[0, 0.75, 0.66]}>
        <planeGeometry args={[0.78, 0.49]} />
        <meshBasicMaterial map={labelTexture} toneMapped={false} />
      </mesh>

      <Nozzle />

      {/* cap — capLiftRef sits at the bottle's neck height and only ever
          translates; capTiltRef is nested inside it at the cap's own base
          so spin/tilt rotate the cap around itself, not around the whole
          bottle's origin. */}
      <group ref={capLiftRef} position={[0, 2.05, 0]}>
        <group ref={capTiltRef}>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.23, 0.23, 0.5, 32]} />
            <meshStandardMaterial color="#5a5852" roughness={0.35} metalness={0.75} />
          </mesh>
          <mesh position={[0, 0.53, 0]}>
            <sphereGeometry args={[0.23, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#5a5852" roughness={0.35} metalness={0.75} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <torusGeometry args={[0.232, 0.018, 12, 32]} />
            <meshStandardMaterial color="#a3272a" roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      </group>

      {/* mist droplets */}
      {Array.from({ length: MIST_COUNT }).map((_, i) => (
        <mesh key={i} ref={(el) => { mistRefs.current[i] = el; }}>
          <sphereGeometry args={[0.045 + (i % 3) * 0.015, 8, 6]} />
          <meshBasicMaterial color="#f3f1ec" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

export function BottleScene3D({ triggerEl }: { triggerEl: HTMLDivElement | null }) {
  if (!triggerEl) return null;

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 6.4], fov: 30 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.65} color="#fff3e6" />
      <directionalLight position={[2, 3, 3]} intensity={1.6} color="#ffe8cf" />
      <pointLight position={[-2, 0.5, 1.5]} intensity={0.5} color="#c8383b" />
      <pointLight position={[0, -1, -2]} intensity={0.4} color="#8892ff" />
      <pointLight position={[0.6, 2.6, 2.2]} intensity={0.8} color="#fff6e8" />
      <Bottle triggerEl={triggerEl} />
    </Canvas>
  );
}
