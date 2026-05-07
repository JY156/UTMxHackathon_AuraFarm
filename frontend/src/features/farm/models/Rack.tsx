import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Object_2: THREE.Mesh
  }
  materials: {
    ['Scene_-_Root']: THREE.MeshStandardMaterial
  }
}

// 1. Changed function name from 'Model' to 'Rack'
export function Rack(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/rack/rack.glb') as GLTFResult
  
  // 🌟 Add this line here! 
  // 0.4 is a good starting point to stop the "white glow"
  materials['Scene_-_Root'].envMapIntensity = 0.4 

  return (
    <group {...props} dispose={null}>
      <mesh 
        geometry={nodes.Object_2.geometry} 
        material={materials['Scene_-_Root']} 
        rotation={[-Math.PI / 2, 0, 0]} 
        castShadow // Optional: make sure it casts shadows for more realism!
        receiveShadow
      />
    </group>
  )
}

// 3. Updated the preload path
useGLTF.preload('/models/rack/rack.glb')