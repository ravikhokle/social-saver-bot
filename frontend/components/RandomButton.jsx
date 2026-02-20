'use client';

import { useState } from 'react';

export default function RandomButton({ links = [] }) {
    const [spinning, setSpinning] = useState(false);

    const handleRandom = () => {
        if (!links.length) return;
        setSpinning(true);

        setTimeout(() => {
            const random = links[Math.floor(Math.random() * links.length)];
            window.open(random.url, '_blank', 'noopener,noreferrer');
            setSpinning(false);
        }, 600);
    };

    return (
        <button
            id="random-link-btn"
            className={`random-btn btn btn-ghost ${spinning ? 'spinning' : ''}`}
            onClick={handleRandom}
            disabled={!links.length || spinning}
            title="Open a random saved link"
        >
            <span className={`dice ${spinning ? 'roll' : ''}`}>🎲</span>
            {spinning ? 'Opening…' : 'Random'}

            <style jsx>{`
        .random-btn {
          position: relative;
          overflow: hidden;
          min-width: 110px;
        }

        .random-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .dice {
          display: inline-block;
          font-size: 1rem;
          transition: transform 0.2s;
        }

        .dice.roll {
          animation: roll 0.5s linear infinite;
        }

        @keyframes roll {
          0%   { transform: rotateY(0deg); }
          50%  { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
        </button>
    );
}
