import { memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Center, QuadraticBezierLine } from '@react-three/drei'
import type { Alert, FarmActuators, FarmProfile, FarmSensors } from '../../store/useFarmStore'
import { ShippingContainer } from './models/ShippingContainer'
import { Lettuce } from './models/Lettuce'
import { Rack } from './models/Rack'
import { Led } from './models/Led'
import { Fan } from './models/Fan'
import { Tank } from './models/Tank'
import { Pump } from './models/Pump'
import { ControlBox } from './models/ControlBox'
import { SensorNode } from './models/SensorNode'
import { Cable } from './models/Cable'

export interface FarmSceneProps {
  sensors: FarmSensors
  actuators: FarmActuators
  alerts: Alert[]
  profile: FarmProfile | null
}

const RACK_LAYOUTS = [
  // First Row (Z = 1)
  { id: 1, position: [-3.5, 0, 1], rotation: [0, Math.PI / 2, 0] },
  { id: 2, position: [0, 0, 1], rotation: [0, Math.PI / 2, 0] },
  { id: 3, position: [3.5, 0, 1], rotation: [0, Math.PI / 2, 0] },
  
  // Second Row (Z = 5.005)
  { id: 4, position: [-3.5, 0, 5.005], rotation: [0, Math.PI / 2, 0] },
  { id: 5, position: [0, 0, 5.005], rotation: [0, Math.PI / 2, 0] },
  { id: 6, position: [3.5, 0, 5.005], rotation: [0, Math.PI / 2, 0] }
]

const TRAY_HEIGHTS = [0.65, 1.7]

// 2. The [X-axis, Z-axis] layout for each tray
const PLACEMENT_GRID = [
  [0.38, -1.5], [0.83, -1.5], [1.28, -1.5], [1.73, -1.5], [2.18, -1.5], [2.63, -1.5], [3.08, -1.5], [3.53, -1.5],
  [0.38, -1.12], [0.83, -1.12], [1.28, -1.12], [1.73, -1.12], [2.18, -1.12], [2.63, -1.12], [3.08, -1.12], [3.53, -1.12],
  [0.38, -0.74], [0.83, -0.74], [1.28, -0.74], [1.73, -0.74], [2.18, -0.74], [2.63, -0.74], [3.08, -0.74], [3.53, -0.74],
  [0.38, -0.36], [0.83, -0.36], [1.28, -0.36], [1.73, -0.36], [2.18, -0.36], [2.63, -0.36], [3.08, -0.36], [3.53, -0.36],
]

// This bundles the metal rack AND the plants into one reusable object
function PlantedRack({ 
  position, 
  rotation, 
  shelfAlerts // Pass an array of booleans [shelf0Alert, shelf1Alert]
}: { 
  position: number[], 
  rotation: number[],
  shelfAlerts: boolean[]
}) {
  return (
    <group position={position as any} rotation={rotation as any}>
      <Rack position={[0, 0, 0]} scale={0.0015} />

      {/* Lights Loop */}
      {[1.25, 2.3].map((yHeight, shelfIdx) => (
        <group key={`light-shelf-${shelfIdx}`} position={[1.95, yHeight, -0.93]}>
          <Center><Led rotation={[0, Math.PI / 2, 0]} scale={0.1} /></Center>
          <pointLight color="#ffb7ff" intensity={6} distance={5} decay={1.5} />
        </group>
      ))}

      {/* 🌟 SENSORS PER TRAY 🌟 */}
      {TRAY_HEIGHTS.map((height, shelfIndex) => (
        <group key={`sensor-shelf-${shelfIndex}`}>
          <SensorNode 
            // Positioned on the side leg of the rack
            position={[0.2, height + 0.3, -0.1]} 
            rotation={[0, -Math.PI / 2, 0]}
            // This makes it changeable! 
            isAlert={shelfAlerts[shelfIndex]} 
          />
          
          {/* Plants Loop */}
          <group position={[0, height, 0]}>
            {PLACEMENT_GRID.map((coords, plantIndex) => {
              const stableRotation = (plantIndex * 45.67) % (Math.PI * 2);
              return (
                <Lettuce 
                  key={`plant-${shelfIndex}-${plantIndex}`} 
                  position={[coords[0], 0, coords[1]]} 
                  rotation={[0, stableRotation, 0]} 
                  scale={1.7} 
                />
              )
            })}
          </group>
        </group>
      ))}
    </group>
  )
}

function FarmScene({ sensors, actuators, alerts, profile }: FarmSceneProps) {
  return (
    <Canvas 
      shadows 
      // 1. WIDER CAMERA: Increased FOV from 45 to 60 and moved position back to 18
      camera={{ position: [0, 8, 18], fov: 60 }} 
    >
      {/* 2. BACKGROUND COLOR: A deep tech-blue or clean white/grey works best */}
      <color attach="background" args={['#0f172a']} /> 

      {/* 3. LIGHTING OVERHAUL */}
      {/* Hemisphere light gives a nice natural gradient from sky to ground */}
      <hemisphereLight intensity={0.5} color="#ffffff" groundColor="#000000" />
      
      {/* Ambient light for general visibility */}
      <ambientLight intensity={0.6} />

      {/* Directional light for sharp shadows (Sun-like) */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
      />

      {/* 4. THE SECRET SAUCE: Environment Map
          This adds realistic reflections to all your metal and plastic parts.
          Presets: 'city', 'apartment', 'studio', or 'warehouse' */}
      <Environment preset="studio" environmentIntensity={0.05} />

      {/* The Room */}
      <ShippingContainer />

      <Fan speed={5} position={[-1, 3.5, -3]} scale={1}/>

      {/* STAMP OUT THE ENTIRE FACTORY */}
      {RACK_LAYOUTS.map((layout) => {
        const rackAlerts = [
          alerts.some(a => a.rackId === layout.id && a.shelf === 0),
          alerts.some(a => a.rackId === layout.id && a.shelf === 1)
        ];

        return (
          <PlantedRack 
            key={`rack-${layout.id}`} 
            position={layout.position} 
            rotation={layout.rotation}
            shelfAlerts={rackAlerts} 
          />
        )
      })}

      <Tank position={[2.8, 0, 7.5]} scale={70}/>

      <Pump position={[2.8, 0, 6]} scale={10} rotation={[0, Math.PI, 0]} />

      {/* Pipe 1: Straight connection */}
      <Cable 
        start={[3.15, 0.23, 6]} 
        end={[3.15, 0.23, 7.5]} 
        color="#cbd5e1" 
        radius={0.06} 
      />

      {/* Pipe 2: Curved connection */}
      <Cable 
        start={[3.15, 0.23, 5.75]}
        mid={[3.15, 0.23, 5.4]}
        end={[3.38, 0.05, 5]} 
        color="#cbd5e1" 
        radius={0.06} 
      />

      <ControlBox position={[3.5, 3, 7]} rotation={[0, -Math.PI / 2, 0]}/>

      {/* 5. WIDER CONTROLS: Increased maxDistance so you can zoom out further */}
      <OrbitControls 
        makeDefault 
        minDistance={2} 
        maxDistance={40} // Increased from 25 to 40
        maxPolarAngle={Math.PI / 2.1} // Prevent looking under the floor
      />
    </Canvas>
  )
}

export default memo(FarmScene)
