import type { GroupProps } from '@react-three/fiber';
import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import { useFarmStore } from '../../../store/useFarmStore'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder_Material001_0: THREE.Mesh
  }
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial
  }
}

export function Tank(props: GroupProps) {
  const { nodes, materials } = useGLTF('/models/tank/scene-transformed.glb') as GLTFResult
  
  // Read tank level (0-100) from Zustand store
  const tankLevel = useFarmStore((state) => state.sensors?.tankLevel ?? 85)
  
  // Ref for animating the water smoothly
  const waterRef = useRef<THREE.Mesh>(null)
  
  // Dimensions in the local coordinate space AFTER 0.01 scale applied to the tank
  // (FarmScene scales the entire Tank component by 70)
  const MAX_WATER_HEIGHT = 0.024
  const WATER_RADIUS = 0.0135
  
  // The local Y coordinate of the bottom of the tank
  const TANK_BOTTOM_Y = -MAX_WATER_HEIGHT / 2

  useFrame((state, delta) => {
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