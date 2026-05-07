import { memo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Center, Bounds, useBounds } from '@react-three/drei'
import { Selection, Select, EffectComposer, Outline } from '@react-three/postprocessing'
import { useFarmStore } from '../../store/useFarmStore'
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
import { AlertMarker } from './models/AlertMarker'
import { HumidityMist } from './models/HumidityMist'

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

function SelectToFocus({ children, id }: { children: React.ReactNode, id: string }) {
  const bounds = useBounds()
  const setInspectedId = useFarmStore((s) => s.setInspectedId)
  const [hovered, setHovered] = useState(false)

  return (
    <Select enabled={hovered}>
      <group
        onClick={(e) => {
          e.stopPropagation()

          // Force camera to face "front" before calculating bounds
          const target = new THREE.Vector3()
          e.object.getWorldPosition(target)

          if (id.includes('rack')) {
            // Racks are rotated 90 degrees, so their front is along the X axis
            e.camera.position.set(target.x + 8, target.y + 2, target.z)
          } else if (id === 'fan') {
            e.camera.position.set(target.x, target.y, target.z + 5)
          } else {
            // Tank, pump, control-box: view from left at the front
            e.camera.position.set(target.x - 4, target.y + 1, target.z + 4)
          }
          e.camera.lookAt(target)

          bounds.refresh(e.object).clip().fit(1.8)
          setInspectedId(id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {children}
      </group>
    </Select>
  )
}

// This bundles the metal rack AND the plants into one reusable object
function PlantedRack({
  position,
  rotation,
  shelfAlerts, // Pass an array of booleans [shelf0Alert, shelf1Alert]
  ledMode = 'off',
  mistActive = false
}: {
  position: number[],
  rotation: number[],
  shelfAlerts: boolean[],
  ledMode?: string,
  mistActive?: boolean
}) {
  const lightColors: Record<string, string> = {
    full: '#ffb7ff',
    purple: '#7b00ff',
    off: '#000000',
  }

  return (
    <group position={position as any} rotation={rotation as any}>
      <Rack position={[0, 0, 0]} scale={0.0015} />

      {/* Mist Effect Indicator */}
      {mistActive && (
        <group position={[1.95, 0.5, -0.93]}>
           <pointLight color="#00ffff" intensity={2} distance={4} />
        </group>
      )}

      {/* Lights Loop */}
      {[1.25, 2.3].map((yHeight, shelfIdx) => (
        <group key={`light-shelf-${shelfIdx}`} position={[1.95, yHeight, -0.93]}>
          <Center><Led rotation={[0, Math.PI / 2, 0]} scale={0.1} mode={ledMode} /></Center>
          {ledMode !== 'off' && (
            <pointLight
              color={lightColors[ledMode]}
              intensity={ledMode === 'purple' ? 12 : 6}
              distance={5}
              decay={1.5}
            />
          )}
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
          {shelfAlerts[shelfIndex] && (
            <AlertMarker position={[0, height + 0.8, 0]} />
          )}

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
  const inspectedId = useFarmStore((s) => s.inspectedId)
  const isNight = actuators.led === 'off'
  const isInspecting = inspectedId !== null

  const bgColor = isNight ? '#020617' : '#0f172a'
  const ambientIntensity = (isNight ? 0.1 : 0.6) * (isInspecting ? 0.4 : 1)
  const hemiIntensity = (isNight ? 0.1 : 0.5) * (isInspecting ? 0.4 : 1)
  const dirIntensity = (isNight ? 0.2 : 1.2) * (isInspecting ? 0.4 : 1)

  return (
    <Canvas
      shadows
      // 1. WIDER CAMERA: Increased FOV from 45 to 60 and moved position back to 18
      camera={{ position: [0, 8, 18], fov: 60 }}
    >
      {/* 2. BACKGROUND COLOR: A deep tech-blue or clean white/grey works best */}
      <color attach="background" args={[bgColor]} />

      {/* 3. LIGHTING OVERHAUL */}
      {/* Hemisphere light gives a nice natural gradient from sky to ground */}
      <hemisphereLight intensity={hemiIntensity} color="#ffffff" groundColor="#000000" />

      {/* Ambient light for general visibility */}
      <ambientLight intensity={ambientIntensity} />

      {/* Directional light for sharp shadows (Sun-like) */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={dirIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* 4. THE SECRET SAUCE: Environment Map
          This adds realistic reflections to all your metal and plastic parts.
          Presets: 'city', 'apartment', 'studio', or 'warehouse' */}
      <Environment preset="studio" environmentIntensity={0.05} />

      {/* The Room */}
      <ShippingContainer />

      <Selection>
        <EffectComposer autoClear={false}>
          <Outline visibleEdgeColor="#e5e7eb" hiddenEdgeColor="#e5e7eb" blur width={1000} edgeStrength={4} />
        </EffectComposer>

        <Bounds fit margin={1.2}>
          <SelectToFocus id="fan">
            <Fan position={[-1, 3.5, -3]} scale={1} active={actuators.fan} />
          </SelectToFocus>

          {/* STAMP OUT THE ENTIRE FACTORY */}
          {RACK_LAYOUTS.map((layout) => {
            const rackAlerts = [
              alerts.some(a => a.rackId === layout.id && a.shelf === 0),
              alerts.some(a => a.rackId === layout.id && a.shelf === 1)
            ];

            return (
              <SelectToFocus key={`rack-${layout.id}`} id={`rack-${layout.id}`}>
                <PlantedRack
                  position={layout.position}
                  rotation={layout.rotation}
                  shelfAlerts={rackAlerts}
                  ledMode={actuators.led}
                  mistActive={actuators.mist}
                />
              </SelectToFocus>
            )
          })}

          <SelectToFocus id="tank">
            <Tank position={[2.8, 0, 7.5]} scale={70} />
          </SelectToFocus>

          <SelectToFocus id="pump">
            <group position={[2.8, 0, 6]} rotation={[0, Math.PI, 0]}>
              <Pump scale={10} />
              {/* Invisible Hitbox for Pump since it's tiny/complex */}
              <mesh visible={false}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
              </mesh>
            </group>
          </SelectToFocus>

          {actuators.pump && (
            <pointLight position={[2.8, 0.5, 6]} color="#00ccff" intensity={1} distance={2} />
          )}

          {/* Pipe 1: Straight connection */}
          <Cable
            start={[3.15, 0.23, 6]}
            end={[3.15, 0.23, 7.5]}
            color="#cbd5e1"
            radius={0.06}
            flow={actuators.pump}
          />

          {/* Pipe 2: Curved connection */}
          <Cable
            start={[3.15, 0.23, 5.75]}
            mid={[3.15, 0.23, 5.4]}
            end={[3.38, 0.05, 5]}
            color="#cbd5e1"
            radius={0.06}
            flow={actuators.pump}
          />

          {/* Humidity Mist effect */}
          <HumidityMist active={actuators.pump || sensors.humidity > 70} position={[0, 0, 3]} />

          <SelectToFocus id="control-box">
            <ControlBox position={[3.5, 3, 7]} rotation={[0, -Math.PI / 2, 0]} />
          </SelectToFocus>
        </Bounds>
      </Selection>

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
