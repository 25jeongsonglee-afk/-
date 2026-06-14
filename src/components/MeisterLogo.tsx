import React from 'react';
import dragonLogo from '../assets/images/dragon_logo_1781416687732.jpg';

interface MeisterLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function MeisterLogo({ className = 'h-full w-full', style }: MeisterLogoProps) {
  return (
    <img 
      src={dragonLogo} 
      alt="용 로고" 
      className={`${className} object-contain rounded-lg`}
      style={style}
      referrerPolicy="no-referrer"
    />
  );
}
