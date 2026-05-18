import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center } from '@react-three/drei'
import { useFarmStore } from '../../../store/useFarmStore'

export function Fan({ active = true, ...props }: any) {
  // 1. The Reference just for the parts that need to spin
  const propellerRef = useRef<THREE.Group>(null)
  const fan = useFarmStore(state => state.actuators?.fan)

  // 2. The Animation Loop (Control the speed here)
  useFrame((_, delta) => {
    if (propellerRef.current && fan) {
      // Multiply by a higher number (e.g., 20) for faster speed factor
      propellerRef.current.rotation.z += delta * 15
    }
  })

  // 3. Defining materials once for performance
  const casingMaterial = <meshStandardMaterial color="#cbd5e1" roughness={0.7} metalness={0.2} />
  const bladeMaterial = <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.8} />

  return (
    <group {...props} dispose={null}>
      <Center>
        {/* --- STATIC PART: The Fan Housing --- */}
        <group name="fan_casing">
          {/* Inner Circular Shroud */}
          <mesh position={[0, 0, 0]}>
            {/* args: [radius, tubeThickness, radialSegments, tubularSegments] 
            radius: 0.6
            tubeThickness: 0.08 (increase this to make the wall "chunkier")
          */}
            <torusGeometry args={[0.6, 0.08, 16, 32]} />
            {casingMaterial}
          </mesh>
        </group>

        {/* --- ROTATING PART: The Blades & Hub (Attach the ref!) --- */}
        <group ref={propellerRef} name="fan_propeller" position={[0, 0, 0]}>
          {/* Central Hub/Motor Cover */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
            {bladeMaterial}
          </mesh>

          {/* 4 Programmatic Blades */}
          {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, index) => (
            <group key={index} rotation={[0, 0, angle]}>
              <mesh position={[0.3, 0, 0]} rotation={[0.4, 0, 0]}> {/* The 0.4 slant makes it look like a blade */}
                <boxGeometry args={[0.5, 0.2, 0.01]} />
                {bladeMaterial}
              </mesh>
            </group>
          ))}
        </group>
      </Center>
    </group>
  )
}