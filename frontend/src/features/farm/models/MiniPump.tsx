import type { GroupProps } from '@react-three/fiber';
import * as THREE from 'three'
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

type MiniPumpProps = GroupProps & {
  active?: boolean
  color?: string
}

export function MiniPump({ active = false, color = '#10b981', ...props }: MiniPumpProps) {
  const rollerRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (active && rollerRef.current) {
      rollerRef.current.rotation.z -= delta * 15 // Fast spinning
    }
  })

  return (
    <group {...props}>
      {/* Motor Housing (Black Box) */}
      <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.15, 0.2]} />
        <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Pump Head Housing (Clear Plastic) */}
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          transmission={0.9} 
          opacity={1} 
          roughness={0.1} 
          thickness={0.05} 
          transparent={true}
        />
      </mesh>
      
      {/* Spinning Rollers inside */}
      <group ref={rollerRef} position={[0, 0, 0.05]}>
        <mesh position={[0.035, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.05, 8]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[-0.035, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.05, 8]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Intake Tube (Going straight down into the tank) */}
      <mesh position={[0, -0.45, 0.05]}>
        <cylinderGeometry args={[0.01, 0.01, 0.9, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}
