import React from 'react';
import Svg, { Path } from 'react-native-svg';

const AccountIcon = ({ color, size }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.12104 17.804C5.12104 16.529 6.15504 15.5 7.42104 15.5H16.579C17.846 15.5 18.879 16.529 18.879 17.804C18.879 20.261 16.782 21.5 14.579 21.5H9.42104C7.21804 21.5 5.12104 20.261 5.12104 17.804Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M12 12C10.346 12 9 10.654 9 9C9 7.346 10.346 6 12 6C13.654 6 15 7.346 15 9C15 10.654 13.654 12 12 12Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

export default AccountIcon;