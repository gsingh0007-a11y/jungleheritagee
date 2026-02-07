import { 
  CalendarCheck, 
  CalendarX, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  IndianRupee
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DashboardStats as StatsType } from "@/hooks/admin/useDashboardStats";

interface DashboardStatsProps {
  stats: StatsType | undefined;
  loading: boolean;
}

const statCards = [
  {
    key: "totalBookingsToday",
    label: "Bookings Today",
    icon: CalendarCheck,
    color: "text-[hsl(var(--gold))]",
    bgColor: "bg-[hsl(var(--gold))]/10",
  },
  {
    key: "checkInsToday",
    label: "Check-ins Today",
    icon: Users,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    key: "checkOutsToday",
    label: "Check-outs Today",
    icon: CalendarX,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    key: "pendingEnquiries",
    label: "Pending Enquiries",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    key: "confirmedBookings",
    label: "Confirmed",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    key: "cancelledRecent",
    label: "Cancelled (30d)",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
] as const;

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.key} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {statCards.map((card) => {
        const value = stats?.[card.key] ?? 0;
        const Icon = card.icon;

        return (
          <Card 
            key={card.key} 
            className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
                  {card.label}
                </span>
                <div className={cn("p-1.5 md:p-2 rounded-lg flex-shrink-0", card.bgColor)}>
                  <Icon className={cn("h-4 w-4", card.color)} />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold font-serif">{value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface RevenueCardProps {
  title: string;
  amount: number;
  loading: boolean;
}

export function RevenueCard({ title, amount, loading }: RevenueCardProps) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-[hsl(var(--forest-deep))] to-[hsl(var(--forest))] text-white">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 mb-3 bg-white/20" />
          <Skeleton className="h-10 w-40 bg-white/20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-[hsl(var(--forest-deep))] to-[hsl(var(--forest))] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2MmgxMnptMC00di0ySDE0djJoMjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-2 mb-2">
          <IndianRupee className="h-4 w-4 text-[hsl(var(--gold))]" />
          <span className="text-sm font-medium text-white/80 uppercase tracking-wide">
            {title}
          </span>
        </div>
        <p className="text-3xl font-bold font-serif text-[hsl(var(--gold))]">
          ₹{amount.toLocaleString("en-IN")}
        </p>
      </CardContent>
    </Card>
  );
}
