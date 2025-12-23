import { motion } from 'motion/react';

interface MascotGreetingProps {
  userName?: string;
}

export function MascotGreeting({ userName = 'Mình' }: MascotGreetingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6"
    >
      {/* Mascot */}
      <div className="w-16 h-16 bg-gradient-to-br from-cyan-300 to-teal-400 rounded-full flex items-center justify-center flex-shrink-0 relative">
        {/* Eyes */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gray-800 rounded-full" />
          </div>
          <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gray-800 rounded-full" />
          </div>
        </div>
        
        {/* Beak */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-orange-400 rounded-full" />
        
        {/* Ears/Horns */}
        <div className="absolute -top-0.5 left-2 w-2.5 h-4 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-t-full transform -rotate-12" />
        <div className="absolute -top-0.5 right-2 w-2.5 h-4 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-t-full transform rotate-12" />
      </div>

      {/* Greeting */}
      <div className="flex-1">
        <h2 className="text-slate-700 mb-1">
          Chào {userName}! <span className="animate-wave">👋</span>
        </h2>
        <p className="text-slate-500 text-sm">
          Hãy bắt đầu học thôi nào!
        </p>
      </div>
    </motion.div>
  );
}
