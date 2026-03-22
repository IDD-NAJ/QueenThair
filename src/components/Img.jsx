import React from 'react';
import { Image } from 'lucide-react';

export default function Img({ seed = 1, className = '', style = {} }) {
  const hues = ['#C4B49A', '#B8A882', '#D4C8B4', '#A89070', '#C8B89A', '#E0D4BC'];
  const bg = hues[seed % hues.length];
  const bg2 = hues[(seed + 2) % hues.length];

  return (
    <div 
      style={{
        background: `linear-gradient(135deg, ${bg}, ${bg2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        ...style
      }}
      className={className}
    >
      <Image className="w-8 h-8 text-white/40" strokeWidth={1.5} />
    </div>
  );
}
