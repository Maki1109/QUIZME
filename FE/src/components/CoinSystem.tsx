import { motion } from 'motion/react';
import { Gem, Coins, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface CoinSystemProps {
  coins: number;
  gems: number;
  todayEarned?: number;
  compact?: boolean;
}

export function CoinSystem({ coins, gems, todayEarned = 0, compact = false }: CoinSystemProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <motion.div 
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 rounded-full shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Coins className="w-5 h-5 text-white" />
          <span className="text-white">{coins.toLocaleString()}</span>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 rounded-full shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Gem className="w-5 h-5 text-white" />
          <span className="text-white">{gems}</span>
        </motion.div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-200">
      <CardContent className="p-6">
        <h3 className="text-gray-700 mb-4 flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💰
          </motion.div>
          Kho Báu Của Bạn
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Coins */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-4 shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-6 h-6 text-white" />
              <span className="text-white text-sm">Coins</span>
            </div>
            <motion.p 
              className="text-3xl text-white"
              key={coins}
              initial={{ scale: 1.5, color: '#fff' }}
              animate={{ scale: 1, color: '#fff' }}
            >
              {coins.toLocaleString()}
            </motion.p>
          </motion.div>

          {/* Gems */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: -5 }}
            className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-4 shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Gem className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-white text-sm">Gems</span>
            </div>
            <motion.p 
              className="text-3xl text-white"
              key={gems}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
            >
              {gems}
            </motion.p>
          </motion.div>
        </div>

        {todayEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white/60 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Hôm nay kiếm được</p>
              <p className="text-green-600">+{todayEarned} coins 🎉</p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
