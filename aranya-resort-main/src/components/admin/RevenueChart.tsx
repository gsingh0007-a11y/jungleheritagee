import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IndianRupee } from "lucide-react";
import type { BookingTrend } from "@/hooks/admin/useDashboardStats";

interface RevenueChartProps {
  data: BookingTrend[];
  loading: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
};

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Aggregate by week for cleaner visualization
  const weeklyData: { week: string; revenue: number }[] = [];
  for (let i = 0; i < data.length; i += 7) {
    const weekSlice = data.slice(i, Math.min(i + 7, data.length));
    const weekRevenue = weekSlice.reduce((sum, day) => sum + day.revenue, 0);
    const weekLabel = weekSlice[0]?.date || `Week ${Math.floor(i / 7) + 1}`;
    weeklyData.push({ week: weekLabel, revenue: weekRevenue });
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-[hsl(var(--gold))]" />
          Revenue Overview (Weekly)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(35, 25%, 90%)" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11, fill: 'hsl(30, 15%, 40%)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(30, 15%, 40%)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'hsl(40, 33%, 98%)',
                  border: '1px solid hsl(35, 25%, 85%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Bar 
                dataKey="revenue" 
                fill="hsl(40, 70%, 45%)" 
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
