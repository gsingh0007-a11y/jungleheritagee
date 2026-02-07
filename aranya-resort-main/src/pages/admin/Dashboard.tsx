import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardStats, RevenueCard } from "@/components/admin/DashboardStats";
import { UpcomingBookings } from "@/components/admin/UpcomingBookings";
import { BookingTrendChart } from "@/components/admin/BookingTrendChart";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { useDashboardStats } from "@/hooks/admin/useDashboardStats";

export default function Dashboard() {
  const { 
    stats, 
    statsLoading, 
    trends, 
    trendsLoading, 
    refetch 
  } = useDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-medium">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your resort's performance
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          className="w-fit"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <DashboardStats stats={stats} loading={statsLoading} />
      </motion.div>

      {/* Revenue Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2"
      >
        <RevenueCard 
          title="Total Revenue" 
          amount={stats?.totalRevenue || 0} 
          loading={statsLoading} 
        />
        <RevenueCard 
          title="This Month" 
          amount={stats?.monthlyRevenue || 0} 
          loading={statsLoading} 
        />
      </motion.div>

      {/* Charts & Widgets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 space-y-6">
          <BookingTrendChart data={trends} loading={trendsLoading} />
          <RevenueChart data={trends} loading={trendsLoading} />
        </div>
        <div>
          <UpcomingBookings />
        </div>
      </motion.div>
    </div>
  );
}
