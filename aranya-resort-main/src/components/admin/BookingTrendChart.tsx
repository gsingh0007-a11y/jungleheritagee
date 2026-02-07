import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import type { BookingTrend } from "@/hooks/admin/useDashboardStats";

interface BookingTrendChartProps {
  data: BookingTrend[];
  loading: boolean;
}

export function BookingTrendChart({ data, loading }: BookingTrendChartProps) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif">Booking Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[hsl(var(--gold))]" />
          Booking Trends (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 35%, 18%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160, 35%, 18%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(35, 25%, 90%)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'hsl(30, 15%, 40%)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(30, 15%, 40%)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(40, 33%, 98%)',
                  border: '1px solid hsl(35, 25%, 85%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Area
                type="monotone"
                dataKey="bookings"
                stroke="hsl(160, 35%, 18%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBookings)"
                name="Bookings"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
