import React from 'react'

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Esquerda */}
      <g transform="translate(4, 4) rotate(-15)">
        <path d="M2 0C0.89543 0 0 0.89543 0 2V3C0 4.10457 0.89543 5 2 5H6C7.10457 5 8 4.10457 8 3V2C8 0.89543 7.10457 0 6 0H2Z" />
        <path d="M1 6L-2 16C-2.5 17.5 0 18 1.5 18H8.5C10 18 12.5 17.5 12 16L9 6H1Z" opacity="0.6" />
      </g>
      {/* Direita */}
      <g transform="translate(12, 4) rotate(15)">
        <path d="M2 0C0.89543 0 0 0.89543 0 2V3C0 4.10457 0.89543 5 2 5H6C7.10457 5 8 4.10457 8 3V2C8 0.89543 7.10457 0 6 0H2Z" />
        <path d="M1 6L-2 16C-2.5 17.5 0 18 1.5 18H8.5C10 18 12.5 17.5 12 16L9 6H1Z" opacity="0.6" />
      </g>
    </svg>
  )
}
