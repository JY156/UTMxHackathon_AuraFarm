import { Geometry, Base, Subtraction } from '@react-three/csg'
import { useFarmStore } from '../../../store/useFarmStore'

export function ShippingContainer() {
  const inspectedId = useFarmStore(state => state.inspectedId)
  const hideRightWall = inspectedId?.includes('rack')
  return (
    <group>
      {/* Floor */}
      <mesh position={[-0.9, -0.1, 2.8]} receiveShadow>
        <boxGeometry args={[9.4, 0.2, 12]} />
        {/* Added the missing '#' to the hex code here */}
        <meshStandardMaterial color="#95A5A6" roughness={0.9} />
      </mesh>

      {/* Back Wall (Now with a hole!) */}
      <mesh position={[-1, 2.5, -3.1]} receiveShadow>
        <meshStandardMaterial color="#D2A56d" roughness={0.7} />
        
        <Geometry>
          {/* 1. The original solid wall */}
          <Base>
            <boxGeometry args={[9.2, 5, 0.2]} />
          </Base>

          {/* 2. The hole cutter */}
          <Subtraction 
            // Note: This position is relative to the center of the wall.
            // Y = 1 means it will be 1 unit above the exact center of the wall.
            position={[0, 1, 0]} 
            rotation={[Math.PI / 2, 0, 0]}
          >
            {/* Adjust the 0.65 radius to fit your exact fan size */}
            <cylinderGeometry args={[0.65, 0.65, 1, 32]} />
          </Subtraction>
        </Geometry>
      </mesh>

      {/* Right Wall */}
      <mesh position={[3.7, 2.5, 2.8]} receiveShadow visible={!hideRightWall}>
        {/* args: [thickness, height, depth] */}
        {/* Depth matches the floor (12), height matches the back wall (5) */}
        <boxGeometry args={[0.2, 5, 12]} />
        <meshStandardMaterial color="#D2A56d" roughness={0.7} />
      </mesh>
    </group>
  )
}