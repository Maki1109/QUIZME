import React from 'react';
import { motion } from 'motion/react';

interface PathSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  completed: boolean;
  active: boolean;
}

interface RoadmapPathProps {
  segments: PathSegment[];
}

export const RoadmapPath: React.FC<RoadmapPathProps> = ({ segments }) => {
  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        {/* Gradient for completed path */}
        <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>

        {/* Gradient for active path */}
        <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>

        {/* Gradient for locked path */}
        <linearGradient id="lockedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>

        {/* Animated dashed pattern */}
        <pattern
          id="dashedPattern"
          patternUnits="userSpaceOnUse"
          width="20"
          height="20"
        >
          <rect width="10" height="20" fill="white" opacity="0.3" />
        </pattern>
      </defs>

      {segments.map((segment, index) => {
        const pathData = `M ${segment.startX} ${segment.startY} Q ${
          (segment.startX + segment.endX) / 2
        } ${(segment.startY + segment.endY) / 2 + 50} ${segment.endX} ${
          segment.endY
        }`;

        const strokeColor = segment.completed
          ? 'url(#completedGradient)'
          : segment.active
          ? 'url(#activeGradient)'
          : 'url(#lockedGradient)';

        return (
          <g key={index}>
            {/* Background path (wider, lighter) */}
            <motion.path
              d={pathData}
              fill="none"
              stroke={segment.completed ? '#d1fae5' : segment.active ? '#fed7aa' : '#e5e7eb'}
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: index * 0.2 }}
            />

            {/* Main path */}
            <motion.path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: index * 0.2, ease: 'easeInOut' }}
            />

            {/* Animated dots for active path */}
            {segment.active && (
              <motion.circle
                cx={(segment.startX + segment.endX) / 2}
                cy={(segment.startY + segment.endY) / 2}
                r="4"
                fill="#f97316"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}

            {/* Sparkles for completed path */}
            {segment.completed && (
              <>
                {[0, 1, 2].map((sparkleIndex) => {
                  const progress = sparkleIndex / 2;
                  const sparkleX = segment.startX + (segment.endX - segment.startX) * progress;
                  const sparkleY = segment.startY + (segment.endY - segment.startY) * progress;
                  
                  return (
                    <motion.circle
                      key={sparkleIndex}
                      cx={sparkleX}
                      cy={sparkleY}
                      r="3"
                      fill="#10b981"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: sparkleIndex * 0.4,
                        ease: 'easeInOut'
                      }}
                    />
                  );
                })}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
