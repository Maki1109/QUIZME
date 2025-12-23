import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { Sparkles, Heart, Zap } from 'lucide-react';
import { useEffect } from 'react';

interface MascotProps {
  emotion?: 'happy' | 'excited' | 'thinking' | 'celebrating';
  message?: string;
  position?: 'floating' | 'static' | 'follow-mouse';
  size?: 'small' | 'medium' | 'large';
}

export function Mascot({ 
  emotion = 'happy', 
  message, 
  position = 'floating',
  size = 'medium' 
}: MascotProps) {
  
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  // Mouse follow animation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const smoothX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const smoothY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  useEffect(() => {
    if (position === 'follow-mouse') {
      const handleMouseMove = (e: MouseEvent) => {
        mouseX.set(e.clientX - 50); // offset to center
        mouseY.set(e.clientY - 50);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [position, mouseX, mouseY]);

  const owlVariants = {
    floating: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    },
    static: {},
    'follow-mouse': {}
  };

  const emotions = {
    happy: {
      eyes: '^^',
      color: 'from-cyan-300 to-teal-400',
      particles: <Sparkles className="w-4 h-4 text-yellow-300" />
    },
    excited: {
      eyes: '✨✨',
      color: 'from-purple-300 to-pink-400',
      particles: <Zap className="w-4 h-4 text-yellow-300" />
    },
    thinking: {
      eyes: '🤔',
      color: 'from-blue-300 to-indigo-400',
      particles: <Sparkles className="w-4 h-4 text-blue-200" />
    },
    celebrating: {
      eyes: '🎉',
      color: 'from-orange-300 to-pink-400',
      particles: <Heart className="w-4 h-4 text-pink-300" />
    }
  };

  const currentEmotion = emotions[emotion];

  const containerProps = position === 'follow-mouse' 
    ? {
        style: { x: smoothX, y: smoothY },
        className: "fixed z-50 pointer-events-none"
      }
    : {
        animate: position,
        variants: owlVariants,
        className: "relative"
      };

  return (
    <div className="relative">
      <motion.div {...containerProps}>
        {/* Owl Body - SVG-style using divs */}
        <div className={`${sizeClasses[size]} relative`}>
          {/* Main Body */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentEmotion.color} rounded-full shadow-lg`}>
            {/* Belly */}
            <div className="absolute inset-x-4 bottom-2 top-6 bg-white/30 rounded-full" />
            
            {/* Eyes */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 bg-gray-800 rounded-full" />
              </div>
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 bg-gray-800 rounded-full" />
              </div>
            </div>

            {/* Beak */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3 h-2 bg-orange-400 rounded-full" />

            {/* Ears/Horns */}
            <div className="absolute -top-1 left-2 w-4 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-t-full transform -rotate-12" />
            <div className="absolute -top-1 right-2 w-4 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-t-full transform rotate-12" />
          </div>

          {/* Floating particles */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{
              y: [-5, -15, -5],
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut' 
            }}
          >
            {currentEmotion.particles}
          </motion.div>

          {/* Wings */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-gradient-to-br from-cyan-200/50 to-teal-300/50 rounded-full"
            animate={{
              rotate: [0, -15, 0],
              x: [0, -5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-gradient-to-br from-cyan-200/50 to-teal-300/50 rounded-full"
            animate={{
              rotate: [0, 15, 0],
              x: [0, 5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>
      </motion.div>

      {/* Message Bubble */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -right-4 top-0 z-10"
          >
            <div className="relative bg-white rounded-2xl px-4 py-2 shadow-sm border border-cyan-200 max-w-xs">
              <p className="text-sm text-slate-700">{message}</p>
              {/* Speech bubble tail */}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-cyan-200 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Preset mascot messages
export const MascotMessage = {
  encouragement: [
    "Tuyệt vời! Bạn đang làm rất tốt! 💪",
    "Cố lên! Bạn gần đến mục tiêu rồi! 🎯",
    "QuizMe tin bạn làm được! ⭐"
  ],
  celebration: [
    "Chúc mừng! Bạn thật xuất sắc! 🎉",
    "Wow! Streak mới! Tuyệt quá! 🔥",
    "Level up! Bạn đã lên cấp! ⬆️"
  ],
  suggestion: [
    "Hôm qua bạn sai Logarit, thử ôn lại nhé! 🧠",
    "Đã 3 ngày rồi, ôn lại công thức này nhé! 📝",
    "Sẵn sàng thử thách khó hơn chưa? 🚀"
  ]
};
