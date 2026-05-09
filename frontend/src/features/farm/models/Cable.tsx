import * as THREE from 'three'
import { useMemo } from 'react'

export function Cable({ start, end, mid, color = "#dddddd", radius = 0.05, flow = false }: any) {
  // 1. Create the curve math
  const curve = useMemo(() => {
    // If no mid point, make a straight line
    const midPoint = mid ? new THREE.Vector3(...mid) : new THREE.Vector3().addVectors(new THREE.Vector3(...start), new THREE.Vector3(...end)).multiplyScalar(0.5)
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      midPoint,
      new THREE.Vector3(...end)
    )
  }, [start, mid, end])

  return (
    <mesh castShadow receiveShadow>
      {/* 2. Create real 3D volume [curve, segments, radius, radialSegments, closed] */}
      <tubeGeometry args={[curve, 20, radius, 8, false]} />
      
      {/* 3. Use a real material for lighting and "not solid" (opacity) look */}
      <meshStandardMaterial 
        color={flow ? "#38bdf8" : color} 
        transparent 
        opacity={0.8} // Makes it "not solid"
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  )
}