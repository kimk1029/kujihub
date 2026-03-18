import React from 'react';
import './Arcade.css';

interface ArcadeTickerProps {
  text: string;
  speed?: number; // duration in seconds
  variant?: 'primary' | 'secondary' | 'accent' | 'default';
}

export const ArcadeTicker: React.FC<ArcadeTickerProps> = ({ 
  text, 
  speed = 20,
  variant = 'accent' 
}) => {
  return (
    <div className={`arcade-ticker-container arcade-ticker-${variant}`}>
      <div className="arcade-ticker-text" style={{ animationDuration: `${speed}s` }}>
        {text} --- {text} --- {text} ---
      </div>
    </div>
  );
};
