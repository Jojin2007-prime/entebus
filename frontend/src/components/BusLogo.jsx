import React from 'react';

const BusLogo = () => {
  return (
    // This SVG uses the specific dimensions you asked for: 31.87px x 28.4px
    <svg 
      width="31.87" 
      height="28.4" 
      viewBox="0 0 100 80" 
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      <defs>
        {/* Gradient Definition for the Bus */}
        <linearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#1e3a8a', stopOpacity: 1 }} /> {/* Dark Blue */}
          <stop offset="100%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} /> {/* Purple */}
        </linearGradient>
      </defs>

      {/* The Road (Yellow & Black) */}
      <path 
        d="M -10 75 Q 50 55 110 80" 
        fill="none" 
        stroke="#1f2937" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
      <path 
        d="M -10 75 Q 50 55 110 80" 
        fill="none" 
        stroke="#fbbf24" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeDasharray="10,5"
      />

      {/* The Bus Body */}
      <path 
        d="M 10 30 L 80 20 Q 95 18 95 40 L 95 55 Q 95 65 85 65 L 15 65 Q 5 65 5 55 L 5 40 Q 5 30 10 30 Z" 
        fill="url(#busGradient)" 
        stroke="white" 
        strokeWidth="1"
      />

      {/* Windows */}
      <path d="M 15 35 L 50 30 L 50 45 L 15 48 Z" fill="#e0f2fe" opacity="0.8" />
      <path d="M 55 29 L 85 26 Q 90 26 90 40 L 90 45 L 55 45 Z" fill="#e0f2fe" opacity="0.8" />

      {/* Wheels */}
      <circle cx="25" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
      <circle cx="75" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
    </svg>
  );
};

export default BusLogo;