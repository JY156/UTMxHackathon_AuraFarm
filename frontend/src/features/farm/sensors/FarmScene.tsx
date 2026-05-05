import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'

export default function FarmScene() {
  return (
    <Canvas camera={{ position: [8, 5, 8], fov: 40 }}>
      {/* Global Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* Industrial/Cartoon Lighting preset */}
      <Environment preset="city" />

      {/* Ground shadows for a "premium" feel */}
      <ContactShadows opacity={0.4} scale={20} blur={2} far={4.5} />

      {/* Placeholder for your Vertical Rack */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[3, 1, 1.5]} />
        <meshStandardMaterial color="#2dd4bf" flatShading roughness={0.3} />
      </mesh>

      <OrbitControls makeDefault minDistance={5} maxDistance={20} />
    </Canvas>
  )
}