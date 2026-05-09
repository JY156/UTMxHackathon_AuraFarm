import { memo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Center } from '@react-three/drei'
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
  // left Row (Z = 1)
  { id: 1, position: [-2, 0, 1], rotation: [0, Math.PI / 2, 0] },
  { id: 2, position: [2, 0, 1], rotation: [0, Math.PI / 2, 0] },
  // Right Row (Z = 5.005)
  { id: 3, position: [-2, 0, 5.005], rotation: [0, Math.PI / 2, 0] },
  { id: 4, position: [2, 0, 5.005], rotation: [0, Math.PI / 2, 0] }
]

const TRAY_HEIGHTS = [0.65, 1.7]

// 2. The [X-axis, Z-axis] layout for each tray
const PLACEMENT_GRID = [
  [0.38, -1.5], [0.83, -1.5], [1.28, -1.5], [1.73, -1.5], [2.18, -1.5], [2.63, -1.5], [3.08, -1.5], [3.53, -1.5],
  [0.38, -1.12], [0.83, -1.12], [1.28, -1.12], [1.73, -1.12], [2.18, -1.12], [2.63, -1.12], [3.08, -1.12], [3.53, -1.12],
  [0.38, -0.74], [0.83, -0.74], [1.28, -0.74], [1.73, -0.74], [2.18, -0.74], [2.63, -0.74], [3.08, -0.74], [3.53, -0.74],
  [0.38, -0.36], [0.83, -0.36], [1.28, -0.36], [1.73, -0.36], [2.18, -0.36], [2.63, -0.36], [3.08, -0.36], [3.53, -0.36],
]

let targetPos: THREE.Vector3 | null = null
let targetLookAt: THREE.Vector3 | null = null

function CameraRig() {
  const { camera, controls } = useThree()
  const inspectedId = useFarmStore((s) => s.inspectedId)

  useEffect(() => {
    if (inspectedId === null) {
      targetPos = new THREE.Vector3(0, 8, 18)
      targetLookAt = new THREE.Vector3(0, 0, 0)
    }
  }, [inspectedId])

  useFrame((state, delta) => {
    if (controls && targetPos && targetLookAt) {
      const c = controls as any
      camera.position.lerp(targetPos, 4 * delta)
      c.target.lerp(targetLookAt, 4 * delta)
      c.update()

      if (camera.position.distanceTo(targetPos) < 0.05) {
        targetPos = null
        targetLookAt = null
      }
    }
  })

  return null
}

function SelectToFocus({ children, id }: { children: React.ReactNode, id: string }) {
  const setInspectedId = useFarmStore((s) => s.setInspectedId)
  const [hovered, setHovered] = useState(false)

  return (
    <Select enabled={hovered}>
      <group
        onClick={(e) => {
          e.stopPropagation()

          const target = new THREE.Vector3()
          e.object.getWorldPosition(target)

          targetLookAt = target.clone()
          if (id.includes('rack')) {
            targetLookAt.y += 0.5
            // Shift the look-at point by the same amount as the camera to stay perpendicular
            targetLookAt.z -= 2
          } else if (id === 'tank') {
            targetLookAt.y += 1
          }

          if (id === 'fan') {
            targetPos = new THREE.Vector3(target.x, target.y, target.z + 5)
          } else if (id.includes('rack-2') || id.includes('rack-4')) {
            // View from right, shifted but perpendicular
            targetPos = new THREE.Vector3(target.x + 6, target.y + 2, target.z - 2)
          } else if (id.includes('rack-1') || id.includes('rack-3')) {
            // View from left, shifted but perpendicular
            targetPos = new THREE.Vector3(target.x - 6, target.y + 2, target.z - 2)
          } else {
            // Default (Tank, etc)
            targetPos = new THREE.Vector3(target.x - 6, target.y + 1.2, target.z)
          }

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
          {
            ledMode !== 'off' && (
              <pointLight
                color={lightColors[ledMode]}
                intensity={ledMode === 'purple' ? 12 : 6}
                distance={5}
                decay={1.5}
              />
            )
          }
        </group>
      ))}

      {/* 🌟 SENSORS PER TRAY 🌟 */}
      {
        TRAY_HEIGHTS.map((height, shelfIndex) => (
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
        ))
      }
    </group>
  )
}

function FarmScene({ sensors, actuators, alerts, profile }: FarmSceneProps) {
  const inspectedId = useFarmStore((s) => s.inspectedId)
  if (!actuators) return null
  const isNight = actuators.led === 'off'
  const isInspecting = inspectedId !== null

  const fanAlert = alerts.some((a) => a.target === 'fan')
  const tankAlert = alerts.some((a) => a.target === 'tank')

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
      <CameraRig />
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

        <group>
          <SelectToFocus id="fan">
            <group position={[-0.9, 3.5, -3]}>
              <Fan scale={1} />
              {fanAlert && <AlertMarker position={[0, 1.5, 0]} />}
            </group>
          </SelectToFocus>

          {/* STAMP OUT THE ENTIRE FACTORY */}
          {
            RACK_LAYOUTS.map((layout) => {
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
            })
          }

          <SelectToFocus id="tank">
            <group position={[1.25, 0, 7.5]}>
              <Tank scale={70} />
              {tankAlert && <AlertMarker position={[0, 2.5, 0]} />}
            </group>
          </SelectToFocus>

          <SelectToFocus id="pump">
            <group position={[1.25, 0, 6]} rotation={[0, Math.PI, 0]}>
              <Pump scale={10} />
              {/* Invisible Hitbox for Pump since it's tiny/complex */}
              <mesh visible={false}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
              </mesh>
            </group>
          </SelectToFocus>

          {
            actuators.pump && (
              <pointLight position={[2.8, 0.5, 6]} color="#00ccff" intensity={1} distance={2} />
            )
          }

          {/* Pipe 1: Straight connection */}
          <Cable
            start={[1.6, 0.23, 6]}
            end={[1.6, 0.23, 7.5]}
            color="#cbd5e1"
            radius={0.06}
            flow={actuators.pump}
          />

          {/* Pipe 2: Curved connection */}
          <Cable
            start={[1.6, 0.23, 5.75]}
            mid={[1.6, 0.23, 5.4]}
            end={[1.88, 0.05, 5]}
            color="#cbd5e1"
            radius={0.06}
            flow={actuators.pump}
          />

          {/* Humidity Mist effect */}
          <HumidityMist active={actuators.mist || sensors.humidity > 70} position={[0, 0, 3]} />

          <SelectToFocus id="control-box">
            <ControlBox position={[1.9, 3, 7]} rotation={[0, -Math.PI / 2, 0]} />
          </SelectToFocus>
        </group>
      </Selection>

      {/* 5. WIDER CONTROLS: Increased maxDistance so you can zoom out further */}
      <OrbitControls
        makeDefault
        minDistance={2}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  )
}

export default memo(FarmScene)
