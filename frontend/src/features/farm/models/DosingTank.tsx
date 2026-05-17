import * as THREE from 'three'

export function DosingTank({ color, ...props }: { color: string } & JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      {/* Tank Body */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1, 32]} />
        <meshPhysicalMaterial 
          color={color} 
          transmission={0.2} 
          roughness={0.1} 
          metalness={0.1} 
          clearcoat={1} 
          transparent={true} 
          opacity={0.9} 
        />
      </mesh>
      {/* Cap */}
      <mesh castShadow receiveShadow position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.31, 0.31, 0.05, 32]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
    </group>
  )
}
