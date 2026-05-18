import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import { useRef } from 'react'
import { useFarmStore } from '../../../store/useFarmStore'

type GLTFResult = GLTF & {
  nodes: {
    ['MOTOR_Paint_Matte_Black_#2_0']: THREE.Mesh
    ['PUMP_Paint_Matte_Orange_#1_0']: THREE.Mesh
  }
  materials: {
    Paint_Matte_Black_2: THREE.MeshStandardMaterial
    Paint_Matte_Orange_1: THREE.MeshStandardMaterial
  }
}

export function Pump(props: any) {
  const { nodes, materials } = useGLTF('models/pump/scene-transformed.glb') as unknown as GLTFResult
  const pumpActive = useFarmStore(state => state.actuators?.pump)
  const innerRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (innerRef.current) {
      if (pumpActive) {
        innerRef.current.position.x = Math.sin(state.clock.elapsedTime * 60) * 0.005
        innerRef.current.position.z = Math.cos(state.clock.elapsedTime * 70) * 0.005
      } else {
        innerRef.current.position.x = 0
        innerRef.current.position.z = 0
      }
    }
  })

  return (
    <group {...props} dispose={null}>
      <group ref={innerRef}>
        <mesh name="MOTOR_Paint_Matte_Black_#2_0" castShadow receiveShadow geometry={nodes['MOTOR_Paint_Matte_Black_#2_0'].geometry} material={materials.Paint_Matte_Black_2} position={[-0.003, 0.034, 0]} scale={0.001} />
        <mesh name="PUMP_Paint_Matte_Orange_#1_0" castShadow receiveShadow geometry={nodes['PUMP_Paint_Matte_Orange_#1_0'].geometry} material={materials.Paint_Matte_Orange_1} position={[-0.003, 0.034, 0]} scale={0.001} />
      </group>
    </group>
  )
}

useGLTF.preload('models/pump/scene-transformed.glb')
