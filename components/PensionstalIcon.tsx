import React from 'react';
import pensionstalIcon from '../Pensionstal icon.svg';

const PensionstalIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return (
    <img 
      src={pensionstalIcon} 
      alt="Pensionstal" 
      className={className}
    />
  );
};

export default PensionstalIcon;
