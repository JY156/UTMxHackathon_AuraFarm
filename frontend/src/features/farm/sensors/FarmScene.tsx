import { memo, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import type { Group } from 'three'
import type { Alert, FarmActuators, FarmProfile, FarmSensors } from '../../../store/useFarmStore'

interface FarmSceneProps {
  sensors: FarmSensors
  actuators: FarmActuators
  alerts: Alert[]
  profile: FarmProfile | null
}

function FarmRack({ sensors, actuators, alerts, profile }: FarmSceneProps) {
  const rackRef = useRef<Group>(null)
  const criticalCount = alerts.length
  const humidityLift = useMemo(() => Math.max(0.2, sensors.humidity / 100), [sensors.humidity])

  useFrame(() => {
    if (!rackRef.current) {
      return
    }

    rackRef.current.rotation.y += actuators.fan ? 0.0025 : 0.0008
    rackRef.current.position.y = Math.sin(performance.now() * 0.0012) * 0.03
  })

  return (
    <group ref={rackRef} scale={[2.5, 2.5, 2.5]}>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[4.2, 0.18, 2.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.35} />
      </mesh>

      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[3.15, 2.1, 1.25]} />
        <meshStandardMaterial color={profile ? '#134e4a' : '#1f2937'} roughness={0.35} metalness={0.45} />
      </mesh>

      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[2.85, 0.25, 1]} />
        <meshStandardMaterial
          color={actuators.led === 'red' ? '#7f1d1d' : '#14532d'}
          emissive={actuators.led === 'red' ? '#ef4444' : '#22c55e'}
          emissiveIntensity={0.3}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[-1.1, 1.25, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.8, 20]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={actuators.fan ? 0.8 : 0.15} />
      </mesh>

      <mesh position={[1.1, 1.25, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#f97316" emissive="#fb923c" emissiveIntensity={criticalCount ? 0.85 : 0.12} />
      </mesh>

      <mesh position={[0, 0.8, 0.75]} scale={[1.2, humidityLift, 0.15]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#34d399" transparent opacity={0.55} />
      </mesh>

      <pointLight position={[0, 3, 0]} intensity={criticalCount ? 4 : 1.2} color={criticalCount ? '#fb7185' : '#6ee7b7'} />
    </group>
  )
}

function FarmScene({ sensors, actuators, alerts, profile }: FarmSceneProps) {
  return (
    <Canvas camera={{ position: [8, 5, 8], fov: 40 }} shadows>
      <color attach="background" args={[profile ? '#06101c' : '#050816']} />
      <fog attach="fog" args={[profile ? '#06101c' : '#050816', 10, 28]} />

      {/* Global Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* Industrial/Cartoon Lighting preset */}
      <Environment preset="city" />

      {/* Ground shadows for a "premium" feel */}
      <ContactShadows opacity={0.4} scale={20} blur={2} far={4.5} />

      <FarmRack sensors={sensors} actuators={actuators} alerts={alerts} profile={profile} />

      <OrbitControls makeDefault minDistance={5} maxDistance={20} />
    </Canvas>
  )
}

export default memo(FarmScene)
