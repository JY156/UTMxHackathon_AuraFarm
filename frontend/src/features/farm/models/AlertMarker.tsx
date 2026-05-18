import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function AlertMarker(props: any) {
  const sphereRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (sphereRef.current) {
      // Float up and down
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1
      // Pulse scale
      const scale = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.1
      sphereRef.current.scale.set(scale, scale, scale)
    }
    if (lightRef.current) {
      // Pulse light intensity
      lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 6) * 1
    }
  })

  return (
    <group {...props}>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444" 
          emissiveIntensity={2} 
          toneMapped={false} 
        />
      </mesh>
      <pointLight ref={lightRef} color="#ef4444" distance={2} decay={2} />
    </group>
  )
}
