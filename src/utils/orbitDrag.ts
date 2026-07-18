import * as THREE from 'three'
import type { Camera } from 'three'

export const ORBIT_DRAG_THRESHOLD = 8
export const ORBIT_ROTATE_SPEED = 0.004

export function applyOrbitDelta(
  camera: Camera,
  target: THREE.Vector3,
  deltaX: number,
  deltaY: number,
  rotateSpeed = ORBIT_ROTATE_SPEED,
): void {
  const offset = new THREE.Vector3().subVectors(camera.position, target)
  const spherical = new THREE.Spherical().setFromVector3(offset)

  spherical.theta -= deltaX * rotateSpeed
  spherical.phi -= deltaY * rotateSpeed
  const epsilon = 0.01
  spherical.phi = Math.max(epsilon, Math.min(Math.PI - epsilon, spherical.phi))

  offset.setFromSpherical(spherical)
  camera.position.copy(target).add(offset)
  camera.lookAt(target)
}
