import React, { useMemo, useLayoutEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function Led(props: any) {
  const { scene } = useGLTF('/models/led/scene.gltf')

  // 🌟 THE FIX: Clone the scene so we can spawn infinite copies! 🌟
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useLayoutEffect(() => {
    // Make sure we are painting the CLONE, not the original
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#222222'),
          emissive: new THREE.Color('#ffb7ff'), // Soft pink
          emissiveIntensity: 1, 
          toneMapped: false
        })
      }
    })
  }, [clonedScene])

  // 🌟 Render the CLONE here! 🌟
  return <primitive object={clonedScene} {...props} />
}

useGLTF.preload('/models/led/scene.gltf')