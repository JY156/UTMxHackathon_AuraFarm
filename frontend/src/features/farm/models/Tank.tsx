import * as THREE from 'three'
import { useGLTF, Center } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder_Material001_0: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
  }
}

export function Tank(props: any) {
  const { nodes, materials } = useGLTF('/models/tank/scene-transformed.glb') as unknown as GLTFResult

  useFrame(() => {
    // Water level animation removed as water mesh is removed.
  })

  return (
    <group {...props} dispose={null}>
      <Center top>
        {/* Outer Tank Model */}
        <mesh 
          name="Cylinder_Material001_0" 
          castShadow 
          receiveShadow 
          geometry={nodes.Cylinder_Material001_0.geometry} 
          material={materials['Material.001']} 
          position={[0, 0, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          scale={0.01}
        />
      </Center>
    </group>
  )
}

useGLTF.preload('/models/tank/scene-transformed.glb')