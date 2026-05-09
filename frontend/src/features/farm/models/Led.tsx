import React, { useMemo, useLayoutEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useFarmStore } from '../../../store/useFarmStore'

export function Led({ mode = 'off', ...props }: any) {
  const { scene } = useGLTF('/models/led/scene.gltf')

  // 🌟 THE FIX: Clone the scene so we can spawn infinite copies! 🌟
  const clonedScene = useMemo(() => scene.clone(), [scene])
  const { lightLevel, led } = useFarmStore(state => state.actuators)
  const isOff = led === 'off'
  const activeLightLevel = lightLevel ?? (isOff ? 0 : 100)

  const colorMap: Record<string, string> = {
    full: '#ffb7ff',
    purple: '#7b00ff', // Blueish-Violet Purple
    off: '#222222',
  }

  useLayoutEffect(() => {
    // Make sure we are painting the CLONE, not the original
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#222222'),
<<<<<<< HEAD
          emissive: new THREE.Color(colorMap[mode] || colorMap.off), 
          emissiveIntensity: mode === 'off' ? 0 : 2, 
=======
          emissive: new THREE.Color('#ffb7ff'), // Soft pink
          emissiveIntensity: isOff ? 0 : (activeLightLevel / 100) * 1.5, 
>>>>>>> e8fc9a56255f8e2fb7f193435e98979803bd0294
          toneMapped: false
        })
      }
    })
<<<<<<< HEAD
  }, [clonedScene, mode])
=======
  }, [clonedScene, activeLightLevel, isOff])
>>>>>>> e8fc9a56255f8e2fb7f193435e98979803bd0294

  // 🌟 Render the CLONE here! 🌟
  return <primitive object={clonedScene} {...props} />
}

useGLTF.preload('/models/led/scene.gltf')