export function ControlBox(props: JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      {/* The Main Metal Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1.5, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* The Glowing "Smart Screen" Display */}
      {/* Placed slightly forward on the Z-axis so it doesn't clip into the box */}
      <mesh position={[0, 0.2, 0.16]}>
        <planeGeometry args={[0.8, 0.6]} />
        <meshStandardMaterial 
          color="#0ea5e9" 
          emissive="#0ea5e9" 
          emissiveIntensity={2} 
          toneMapped={false} 
        />
      </mesh>

      {/* A tiny glowing green "Status/Power" LED */}
      <mesh position={[-0.3, -0.5, 0.16]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial 
          color="#22c55e" 
          emissive="#22c55e" 
          emissiveIntensity={4} 
          toneMapped={false} 
        />
      </mesh>
    </group>
  )
}