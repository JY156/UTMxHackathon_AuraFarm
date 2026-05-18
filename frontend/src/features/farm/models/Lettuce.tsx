import type { ComponentProps } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'

export function Lettuce(
  props: ComponentProps<'group'> & {
    isDiseased?: boolean
    growthStage?: 'seedling' | 'vegetative' | 'harvest'
    nutrientDeficiency?: 'nitrogen' | 'phosphorus' | 'potassium' | null
    plantIndex?: number
  }
) {
  const { isDiseased, growthStage, nutrientDeficiency, plantIndex, ...groupProps } = props
  
  // 1. Load the raw shape
  const { nodes } = useGLTF('/models/lettuce/scene.gltf') as any
  
  // 2. Load your image file with a one-time configuration callback
  const colorMap = useTexture('/models/lettuce/textures/Material_diffuse.png', (texture) => {
    if (Array.isArray(texture)) {
      texture.forEach((t) => {
        t.flipY = false
      })
    } else {
      texture.flipY = false
    }
  })

  // Determine scale multiplier based on growth stage
  let stageScale = 1.0
  if (growthStage === 'seedling') stageScale = 0.35
  else if (growthStage === 'vegetative') stageScale = 0.75
  else if (growthStage === 'harvest') stageScale = 1.4

  const index = plantIndex !== undefined ? plantIndex : 0
  
  // Stable deterministic pseudo-random uniform variation (width) between 0.88 and 1.12
  const randomScaleVal = 0.88 + Math.abs(Math.sin(index * 1.9)) * 0.24
  
  // Stable deterministic pseudo-random height-specific variation between 0.82 and 1.18
  const randomHeightVal = 0.82 + Math.abs(Math.cos(index * 3.1)) * 0.36

  // Selective disease/deficiency coloring: only color some lettuce cups, others stay healthy/green!
  // index % 3 === 0: Highly affected
  // index % 3 === 1: Moderately affected
  // index % 3 === 2: Completely healthy (green & lush)
  const isPlantDiseased = isDiseased && (index % 3 !== 2)
  const plantDeficiency = nutrientDeficiency && (index % 3 !== 2)
  const isHealthy = !isPlantDiseased && !plantDeficiency

  // Determine color tint and sickness-based scale shrinkage
  let tintColor = '#ffffff' // Healthy standard green base
  let sicknessScale = 1.0

  if (isPlantDiseased) {
    if (index % 3 === 0) {
      tintColor = '#8c673b' // Deep rusty brown for Leaf Rust
      sicknessScale = 0.75 // Withered
    } else {
      tintColor = '#b59265' // Mild rusty spots
      sicknessScale = 0.9 // Mildly affected
    }
  } else if (plantDeficiency) {
    const severity = index % 3 === 0 ? 'severe' : 'mild'
    sicknessScale = severity === 'severe' ? 0.8 : 0.95

    if (nutrientDeficiency === 'nitrogen') {
      tintColor = severity === 'severe' ? '#ffd53d' : '#ffe682' // Golden-yellow chlorosis
    } else if (nutrientDeficiency === 'phosphorus') {
      tintColor = severity === 'severe' ? '#d2b5d8' : '#e8daf0' // Purplish anthocyanin glaze
    } else if (nutrientDeficiency === 'potassium') {
      tintColor = severity === 'severe' ? '#e2c482' : '#f0dfbe' // Bronze-yellow margin necrosis
    }
  }

  // Base scale is 1.7 in FarmScene.tsx
  const baseScale = typeof props.scale === 'number' ? props.scale : 1.7
  const finalX = baseScale * stageScale * randomScaleVal * sicknessScale
  const finalY = baseScale * stageScale * randomScaleVal * randomHeightVal * sicknessScale
  const finalZ = baseScale * stageScale * randomScaleVal * sicknessScale

  return (
    <group 
      {...groupProps} 
      scale={[finalX, finalY, finalZ]} 
      dispose={null}
    >
      <mesh 
        geometry={nodes.Marul_Material_0.geometry} 
        rotation={[-1.202, 0.914, 1.374]} 
        scale={0.072} // Kept base geometry scale inside mesh, parent handles scaling
      >
        <meshStandardMaterial 
          map={colorMap} 
          color={tintColor}
          roughness={isHealthy ? 0.75 : 0.9} // Sick plants look rough/dry, healthy look fresh/dew-covered
          transparent={true}
          alphaTest={0.5}
        />
      </mesh>
    </group>
  )
}

useGLTF.preload('/models/lettuce/scene.gltf')