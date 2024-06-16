import React, { useEffect, useState } from 'react';
import DottedMap from 'dotted-map';
import Hexagon from './Hexagon';

const Map = () => {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const map = new DottedMap({
      width: 60,
      grid: 'vertical'
    });

    // Add some example pins (you can replace this with real data)
    
    let pin1 = map.addPin({ lat: 52.520008, lng: 13.404954, data: { value: 20 } }); // Berlin

    console.log(map.getPin(pin1))

    setPoints(map.getPoints());
    

}, []);

  return (
    <>
        <Hexagon
      position={[32,7,0]}
      value={10}
      />
      {points.map((point, index) => {
        // Ensure the point has data and a value
        const value = 2.1 // Default to 1 if value is not defined

        return (
          <Hexagon
            key={index}
            position={[point.x, point.y   , 0]}
            value={value}
          />
        );
      })}
    </>
  );
};

export default Map;
