import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const RidesIcon = ({ color = '#000', size = 24 }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Car Body */}
      <Path
        d="M5 11L6.5 7.5C6.8 6.8 7.5 6.3 8.3 6.3H15.7C16.5 6.3 17.2 6.8 17.5 7.5L19 11"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M4 11H20C20.55 11 21 11.45 21 12V16C21 16.55 20.55 17 20 17H19V18C19 18.55 18.55 19 18 19C17.45 19 17 18.55 17 18V17H7V18C7 18.55 6.55 19 6 19C5.45 19 5 18.55 5 18V17H4C3.45 17 3 16.55 3 16V12C3 11.45 3.45 11 4 11Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Windows */}
      <Path
        d="M8 8H16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Wheels */}
      <Circle
        cx="7"
        cy="14"
        r="1.5"
        fill={color}
      />

      <Circle
        cx="17"
        cy="14"
        r="1.5"
        fill={color}
      />
    </Svg>
  );
};

export default RidesIcon;