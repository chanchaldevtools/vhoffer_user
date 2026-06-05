import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const HelpIcon = ({ color = '#000', size = 24 }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth={2}
      />

      <Path
        d="M9.5 9.5C9.5 8.1 10.6 7 12 7C13.4 7 14.5 8.1 14.5 9.5C14.5 10.5 14 11.1 13.1 11.7C12.2 12.3 12 12.7 12 13.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Circle
        cx="12"
        cy="17"
        r="1"
        fill={color}
      />
    </Svg>
  );
};

export default HelpIcon;