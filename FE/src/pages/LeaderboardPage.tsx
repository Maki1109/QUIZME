/**
 * Leaderboard Page
 * Route: /leaderboard
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { leaderboardService } from '../services/leaderboardService';
import { Trophy, Medal, Award } from 'lucide-react';

export function LeaderboardPage() {
  const [mode, setMode] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // TODO: Fetch leaderboard data when component mounts
  // useEffect(() => {
  //   const fetchLeaderboard = async () => {
  //     setLoading(true);
  //     try {
  //       const data = await leaderboardService.getLeaderboard(mode);
  //       setLeaderboard(data);
  //     } catch (error) {
  //       console.error('Failed to fetch leaderboard:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchLeaderboard();
  // }, [mode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Bảng Xếp Hạng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs vvalue={mode} onValueChange={(v: string) => setMode(v as typeof mode)}>
              <TabsList>
                <TabsTrigger value="weekly">Tuần</TabsTrigger>
                <TabsTrigger value="monthly">Tháng</TabsTrigger>
                <TabsTrigger value="alltime">Tất Cả</TabsTrigger>
              </TabsList>
              <TabsContent value={mode}>
                {loading ? (
                  <div>Đang tải...</div>
                ) : (
                  <div>
                    {/* TODO: Render leaderboard data */}
                    <p>Leaderboard content sẽ được implement</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

