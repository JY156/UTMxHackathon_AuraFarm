import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function HumidityMist({ active = false, position = [0, 0, 0] }: { active?: boolean, position?: number[] }) {
  const pointsRef = useRef<THREE.Points>(null)

  const particlesCount = 400
  
  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3)
    const phs = new Float32Array(particlesCount)
    for (let i = 0; i < particlesCount; i++) {
      // Spread across the room
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = Math.random() * 4
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
      phs[i] = Math.random() * Math.PI * 2
    }
    return [pos, phs]
  }, [])

  useFrame((state) => {
    if (pointsRef.current && active) {
      const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particlesCount; i++) {
        // Slowly drift down and re-appear at top
        positionsArray[i * 3 + 1] -= 0.005
        if (positionsArray[i * 3 + 1] < 0) {
          positionsArray[i * 3 + 1] = 4
        }
        // Sway sideways
        positionsArray[i * 3] += Math.sin(state.clock.elapsedTime * 0.5 + phases[i]) * 0.002
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (!active) return null

  return (
    <points ref={pointsRef} position={position as any}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#a5f3fc"
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
