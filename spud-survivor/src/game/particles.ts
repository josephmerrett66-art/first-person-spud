import * as THREE from "three";
import type { Particle } from "./types";

let particleId = 0;

export function createExplosion(
  position: THREE.Vector3,
  color: string,
  count = 16
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8;
    const speed = 3 + Math.random() * 6;
    const vx = Math.cos(angle) * speed;
    const vy = 4 + Math.random() * 6;
    const vz = Math.sin(angle) * speed;
    particles.push({
      id: `particle_${++particleId}`,
      position: position.clone(),
      velocity: new THREE.Vector3(vx, vy, vz),
      color,
      size: 0.08 + Math.random() * 0.14,
      ttl: 0.4 + Math.random() * 0.5,
      maxTtl: 0.9,
    });
  }
  return particles;
}

export function createHitSpark(
  position: THREE.Vector3,
  color = "#fde68a"
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    particles.push({
      id: `particle_${++particleId}`,
      position: position.clone(),
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 3,
        Math.sin(angle) * speed
      ),
      color,
      size: 0.05 + Math.random() * 0.07,
      ttl: 0.2 + Math.random() * 0.2,
      maxTtl: 0.4,
    });
  }
  return particles;
}

export function createMuzzleFlash(
  position: THREE.Vector3,
  color: string
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 4; i++) {
    const spread = 0.3;
    particles.push({
      id: `particle_${++particleId}`,
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        -(2 + Math.random() * 3)
      ),
      color,
      size: 0.06 + Math.random() * 0.1,
      ttl: 0.08 + Math.random() * 0.08,
      maxTtl: 0.16,
    });
  }
  return particles;
}
