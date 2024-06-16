import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Map from './Map';



function DottedMapThree() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
     
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Map />
      <OrbitControls />
      
    </Canvas>
  );
}

export default DottedMapThree;
