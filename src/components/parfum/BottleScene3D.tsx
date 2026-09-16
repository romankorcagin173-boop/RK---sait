"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createCurvedLabelGeometry,
  createFlutedBottleGeometry,
  type BottleProfilePoint,
} from "@/lib/flutedBottleGeometry";

const BODY_PROFILE: BottleProfilePoint[] = [
  { y: 0.0, radius: 0.6, ribAmount: 1 },
  { y: 0.05, radius: 0.62, ribAmount: 1 },
  { y: 1.3, radius: 0.62, ribAmount: 1 },
  { y: 1.5, radius: 0.5, ribAmount: 0.55 },
  { y: 1.68, radius: 0.3, ribAmount: 0.12 },
  { y: 1.82, radius: 0.17, ribAmount: 0 },
  { y: 2.05, radius: 0.17, ribAmount: 0 },
];

const MIST_COUNT = 24;
// Every 5th particle is a larger, softer "haze" puff instead of a crisp
// droplet — mixing the two sizes is what reads as a real atomizer mist
// rather than a ring of identical dots.
const isHazeParticle = (i: number) => i % 5 === 0;

let cachedSprayTexture: THREE.Texture | null = null;
function getSprayTexture(): THREE.Texture {
  if (cachedSprayTexture) return cachedSprayTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cachedSprayTexture = texture;
  return texture;
}

// The pump actuator revealed once the cap lifts off — a collar seated on
// the neck, a tapered stem, and a flattened press-button top with its own
// spray outlet, instead of a single floating box. Sits entirely inside the
// cap's footprint (y 2.05–2.6) so it's hidden until the cap actually lifts.
function SprayActuator() {
  return (
    <group>
      <mesh position={[0, 2.085, 0]}>
        <cylinderGeometry args={[0.15, 0.16, 0.05, 24]} />
        <meshStandardMaterial color="#2b2a28" roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[0, 2.16, 0]}>
        <cylinderGeometry args={[0.07, 0.085, 0.1, 24]} />
        <meshStandardMaterial color="#242322" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 2.255, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.115, 24, 16]} />
        <meshStandardMaterial color="#ece3d5" roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, 2.245, 0.1]}>
        <boxGeometry args={[0.035, 0.03, 0.06]} />
        <meshStandardMaterial color="#141312" roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Bottle({ triggerEl }: { triggerEl: HTMLDivElement }) {
  const groupRef = useRef<THREE.Group>(null);
  const capLiftRef = useRef<THREE.Group>(null);
  const capTiltRef = useRef<THREE.Group>(null);
  const mistRefs = useRef<(THREE.Sprite | null)[]>([]);
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
  // Radius clears the rib peaks (0.62 body radius + 0.03 rib depth) so the
  // curved plaque sits just proud of the glass like a real applied label,
  // instead of a flat plane that only touches the surface at its center
  // and floats away from it at the left/right edges.
  const labelGeometry = useMemo(
    () => createCurvedLabelGeometry({ radius: 0.665, arcAngle: 1.25, height: 0.49, segments: 20 }),
    []
  );

  const labelTexture = useMemo(() => {
    const texture = new THREE.TextureLoader().load("/brand/rk-card-front.svg");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, []);

  const sprayTexture = useMemo(() => getSprayTexture(), []);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mistSprites = mistRefs.current.filter((m): m is THREE.Sprite => Boolean(m));
    // A cone fanning out from the nozzle (mostly +z, the direction it
    // faces) instead of a full ring around the bottle — a real atomizer
    // sprays forward, it doesn't puff out in every direction at once.
    const mistSeeds = mistSprites.map(() => {
      const spread = (Math.random() - 0.5) * 0.85;
      const drop = 2.245 + (Math.random() - 0.5) * 0.3 - 0.1;
      const forward = 0.45 + Math.random() * 0.6;
      return { x: spread, y: drop, z: 0.13 + forward };
    });
    const mistSizes = mistSprites.map((_, i) =>
      isHazeParticle(i) ? 0.15 + Math.random() * 0.06 : 0.045 + Math.random() * 0.05
    );
    const mistOpacities = mistSprites.map((_, i) =>
      isHazeParticle(i) ? 0.22 + Math.random() * 0.1 : 0.55 + Math.random() * 0.25
    );

    gsap.set(groupRef.current!.scale, { x: 0.92, y: 0.92, z: 0.92 });
    gsap.set(groupRef.current!.position, { y: -1.45 });
    // capLiftRef/capTiltRef keep their JSX rest positions/rotations — do
    // NOT gsap.set those here, that would stomp the values React set.
    mistSprites.forEach((m) => {
      m.position.set(0, 2.245, 0.13);
      m.scale.set(0.001, 0.001, 1);
      (m.material as THREE.SpriteMaterial).opacity = 0;
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
        .to(groupRef.current!.position, { y: -1.4, duration: 0.2, ease: "power2.out" }, 0)
        .to(groupRef.current!.rotation, { y: -0.32, duration: 1, ease: "none" }, 0)
        .to(groupRef.current!.rotation, { y: 0.4, duration: 1, ease: "power1.inOut" }, 1)
        // Cap: lifts up while actually spinning around its own axis, like a
        // real cap being unscrewed — only possible because this is real 3D.
        // capLiftRef handles the straight-up translation; capTiltRef spins
        // and tilts around the cap's own base so it pivots in place instead
        // of swinging around the bottle's origin. The lift distance is
        // tuned to stay inside the camera frustum at every scroll position
        // — see the camera comment in BottleScene3D for the full budget.
        .to(
          capLiftRef.current!.position,
          { y: "+=0.72", duration: 0.32, ease: "power3.inOut" },
          0.16
        )
        .to(
          capTiltRef.current!.rotation,
          { y: Math.PI * 3.2, duration: 0.32, ease: "power2.in" },
          0.16
        )
        .to(capTiltRef.current!.rotation, { z: 0.18, duration: 0.3, ease: "power2.out" }, 0.3)
        // Mist: a soft, forward-facing spray burst — small crisp droplets
        // mixed with larger translucent haze puffs, using additive-blended
        // radial-gradient sprites instead of flat white spheres, so it
        // reads as vapor rather than a ring of dots.
        .to(
          mistSprites.map((m) => m.scale),
          {
            x: (i) => mistSizes[i],
            y: (i) => mistSizes[i],
            duration: 0.26,
            ease: "power2.out",
            stagger: { each: 0.014, from: "random" },
          },
          0.38
        )
        .to(
          mistSprites.map((m) => (m.material as THREE.SpriteMaterial)),
          {
            opacity: (i) => mistOpacities[i],
            duration: 0.2,
            stagger: { each: 0.014, from: "random" },
          },
          0.38
        )
        .to(
          mistSprites.map((m) => m.position),
          {
            x: (i) => mistSeeds[i].x,
            y: (i) => mistSeeds[i].y,
            z: (i) => mistSeeds[i].z,
            duration: 0.6,
            ease: "power1.out",
            stagger: { each: 0.014, from: "random" },
          },
          0.4
        )
        // Dissipating: still growing as it fades, like real mist thinning
        // out rather than just vanishing in place.
        .to(
          mistSprites.map((m) => m.scale),
          {
            x: (i) => mistSizes[i] * 1.7,
            y: (i) => mistSizes[i] * 1.7,
            duration: 0.45,
            ease: "power1.out",
            stagger: { each: 0.014, from: "random" },
          },
          0.55
        )
        .to(
          mistSprites.map((m) => (m.material as THREE.SpriteMaterial)),
          { opacity: 0, duration: 0.35, stagger: { each: 0.014, from: "random" } },
          0.62
        );
    });

    return () => ctx.revert();
  }, [triggerEl]);

  return (
    <group ref={groupRef} position={[0, -1.4, 0]}>
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

      {/* label plaque — a curved strip that follows the bottle's own
          curvature (see createCurvedLabelGeometry) instead of a flat
          plane, so it reads as a wrapped label rather than a sticker
          floating in front of the glass. */}
      <mesh position={[0, 0.75, 0]} geometry={labelGeometry}>
        <meshBasicMaterial map={labelTexture} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      <SprayActuator />

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
          {/* A slim trim band at the cap's own base, sized to sit flush
              against the cylinder instead of floating mid-cap as a thick,
              faceted ring. */}
          <mesh position={[0, 0.04, 0]}>
            <torusGeometry args={[0.233, 0.011, 16, 48]} />
            <meshStandardMaterial color="#a3272a" roughness={0.5} metalness={0.25} />
          </mesh>
        </group>
      </group>

      {/* mist — soft additive-blended sprites instead of hard-edged
          spheres, so the spray reads as vapor rather than white balls */}
      {Array.from({ length: MIST_COUNT }).map((_, i) => (
        <sprite key={i} ref={(el) => { mistRefs.current[i] = el; }} scale={[0.001, 0.001, 1]}>
          <spriteMaterial
            map={sprayTexture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0}
            color={isHazeParticle(i) ? "#f7ece2" : "#ffffff"}
          />
        </sprite>
      ))}
    </group>
  );
}

export function BottleScene3D({ triggerEl }: { triggerEl: HTMLDivElement | null }) {
  if (!triggerEl) return null;

  return (
    // Camera is framed with headroom for the cap's full travel: at rest
    // the cap top sits at world y ≈ -1.4 + 2.05 + 0.76 ≈ 1.4, and the
    // 0.72-unit lift takes it to ≈ 2.12 — the frustum's visible half-height
    // here (tan(19°) * 7.4 ≈ 2.55) clears that with margin, so the cap no
    // longer gets sliced off by the top of frame mid-animation.
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 7.4], fov: 38 }}
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
