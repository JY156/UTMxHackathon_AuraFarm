import * as THREE from 'three'
import React from 'react'
import { useGLTF, Center } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder_Material001_0: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
  }
}

export function Tank(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/tank/scene-transformed.glb') as GLTFResult
  
  return (
    <group {...props} dispose={null}>
      {/* 🌟 Wrapping it in Center automatically fixes the weird 172 offset! 🌟 */}
      <Center top>
        <mesh 
          name="Cylinder_Material001_0" 
          castShadow 
          receiveShadow 
          geometry={nodes.Cylinder_Material001_0.geometry} 
          material={materials['Material.001']} 
          
          // 1. Reset Position to center
          position={[0, 0, 0]} 
          
          // 2. Keep the rotation (it usually fixes the Blender Z/Y axis difference)
          rotation={[-Math.PI / 2, 0, 0]} 
          
          // 3. Reset the massive 661 scale to a normal 1 or 0.01
          // Sketchfab models are often in millimeters. 0.01 or 0.001 usually fixes them.
          scale={0.01} 
        />
      </Center>
    </group>
  )
}

useGLTF.preload('/models/tank/scene-transformed.glb')