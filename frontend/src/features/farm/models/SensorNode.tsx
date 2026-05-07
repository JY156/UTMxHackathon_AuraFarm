import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function SensorNode({ isAlert, ...props }: any) {
  const ledRef = useRef<THREE.Mesh>(null)

  // Pulse faster if there is an alert
  useFrame((state) => {
    if (ledRef.current) {
      const speed = isAlert ? 8 : 2; 
      const pulse = (Math.sin(state.clock.elapsedTime * speed) + 1) / 2
      ledRef.current.material.opacity = 0.2 + pulse * 0.8
    }
  })

  const statusColor = isAlert ? "#ff0000" : "#38bdf8"; // Red for alert, Blue for OK

  return (
    <group {...props}>
      {/* ... Housing Mesh ... */}
      
      <mesh position={[-0.08, 0.1, 0.08]} ref={ledRef}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial 
          color={statusColor} 
          emissive={statusColor} 
          emissiveIntensity={isAlert ? 10 : 2} 
          transparent 
          toneMapped={false} 
        />
      </mesh>
    </group>
  )
}