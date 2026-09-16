import * as THREE from "three";

export interface BottleProfilePoint {
  /** height along the bottle's vertical axis */
  y: number;
  /** base radius at this height, before ribbing is applied */
  radius: number;
  /** 0 = smooth glass, 1 = full flute depth — lets ribs fade in/out */
  ribAmount?: number;
}

interface FlutedBottleOptions {
  profile: BottleProfilePoint[];
  radialSegments?: number;
  ribCount?: number;
  ribDepth?: number;
  capBottom?: boolean;
}

/**
 * Builds a rotationally-swept bottle body with optional vertical fluting
 * (ribs), by perturbing the radius at each ring with a cosine wave whose
 * amplitude is controlled per-ring via `ribAmount`. This is a genuine 3D
 * mesh (not a flat CSS illusion) — the flutes catch light and parallax
 * correctly as the bottle rotates.
 */
export function createFlutedBottleGeometry({
  profile,
  radialSegments = 72,
  ribCount = 16,
  ribDepth = 0.03,
  capBottom = true,
}: FlutedBottleOptions): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const ringCount = profile.length;

  for (let ring = 0; ring < ringCount; ring++) {
    const { y, radius, ribAmount = 0 } = profile[ring];
    for (let seg = 0; seg <= radialSegments; seg++) {
      const theta = (seg / radialSegments) * Math.PI * 2;
      const rib = Math.cos(theta * ribCount) * ribDepth * ribAmount;
      const r = radius + rib;
      positions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
      uvs.push(seg / radialSegments, ring / (ringCount - 1));
    }
  }

  for (let ring = 0; ring < ringCount - 1; ring++) {
    for (let seg = 0; seg < radialSegments; seg++) {
      const a = ring * (radialSegments + 1) + seg;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c, c, b, d);
    }
  }

  if (capBottom) {
    const base = profile[0];
    const centerIndex = positions.length / 3;
    positions.push(0, base.y, 0);
    uvs.push(0.5, 0);
    for (let seg = 0; seg < radialSegments; seg++) {
      const a = seg;
      const b = seg + 1;
      indices.push(centerIndex, b, a);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

interface CurvedLabelOptions {
  /** distance from the bottle's vertical axis — should clear the ribs */
  radius: number;
  /** total angular width of the label, in radians */
  arcAngle: number;
  height: number;
  segments?: number;
}

/**
 * A label plaque as a genuine curved strip wrapped around the bottle's
 * vertical axis (centered on the front, theta = PI/2, matching the same
 * cos/sin convention as createFlutedBottleGeometry) instead of a flat
 * plane — a flat plane held close enough to touch the glass at its center
 * pulls away from the surface at its left/right edges since the bottle
 * curves out from under it.
 */
export function createCurvedLabelGeometry({
  radius,
  arcAngle,
  height,
  segments = 20,
}: CurvedLabelOptions): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const thetaStart = Math.PI / 2 - arcAngle / 2;
  const rows = [-height / 2, height / 2];

  rows.forEach((y, rowIndex) => {
    for (let seg = 0; seg <= segments; seg++) {
      const t = seg / segments;
      const theta = thetaStart + t * arcAngle;
      positions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      // theta increasing sweeps screen-right to screen-left (camera looks
      // down -z), so u is flipped to keep the label right-reading.
      uvs.push(1 - t, rowIndex);
    }
  });

  for (let seg = 0; seg < segments; seg++) {
    const a = seg;
    const b = a + (segments + 1);
    const c = a + 1;
    const d = b + 1;
    indices.push(a, b, c, c, b, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
