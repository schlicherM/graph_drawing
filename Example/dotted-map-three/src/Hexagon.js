import React, { useMemo } from 'react';
import * as THREE from 'three';

const Cylinder = ({ position, value }) => {
  const geometry = useMemo(() => {
    // Create a cylinder with radius 0.3, height based on value, and 32 radial segments
    return new THREE.CylinderGeometry(0.3, 0.3, value, 32);
  }, [value]);

  return (
    <mesh geometry={geometry} position={[position[1] + value / 2, position[2], position[0] ]}>
      <meshPhongMaterial attach="material" color={0x0077ff} />
    </mesh>
  );
};

export default Cylinder;
