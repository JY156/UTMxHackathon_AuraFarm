import { useGLTF, useTexture } from '@react-three/drei'

export function Lettuce(props: any & { isDiseased?: boolean }) {
  const { isDiseased, ...groupProps } = props
  // 1. Load the raw shape
  const { nodes } = useGLTF('/models/lettuce/scene.gltf') as any
  
  // 2. Load your image file
  const colorMap = useTexture('/models/lettuce/textures/Material_diffuse.png')
  
  // 3. CRITICAL: GLTF models map textures upside down by default
  colorMap.flipY = false

  return (
    <group {...groupProps} dispose={null}>
      <mesh 
        geometry={nodes.Marul_Material_0.geometry} 
        rotation={[-1.202, 0.914, 1.374]} 
        scale={0.072}
      >
        {/* 4. We drop the new texture right onto a brand new material */}
        <meshStandardMaterial 
          map={colorMap} 
          color={isDiseased ? '#a0855b' : '#ffffff'} // Tint brown for rust/rot
          roughness={0.8}
          transparent={true}
          alphaTest={0.5}/>
      </mesh>
    </group>
  )
}

useGLTF.preload('/models/lettuce/scene.gltf')