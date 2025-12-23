import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { TrendingUp, Award, Zap } from 'lucide-react';

interface ProgressStatsProps {
  xp: number;
  level: number;
  streak: number;
}

export function ProgressStats({ xp, level, streak }: ProgressStatsProps) {
  const xpToNextLevel = 3000;
  const xpProgress = (xp / xpToNextLevel) * 100;

  return (
    <Card className="bg-white/80 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="text-base">Thống Kê Tiến Độ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-600">Level {level} → {level + 1}</span>
            </div>
            <span className="text-sm text-gray-600">{xp}/{xpToNextLevel}</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span className="text-xs text-teal-600">Tuần này</span>
            </div>
            <p className="text-2xl text-teal-700">+450</p>
            <p className="text-xs text-teal-600">XP</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-600">Huy hiệu</span>
            </div>
            <p className="text-2xl text-orange-700">12</p>
            <p className="text-xs text-orange-600">Thu thập</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
