import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BookingCalendarView } from "@/components/admin/calendar/BookingCalendarView";
import { BlockDatesDialog } from "@/components/admin/calendar/BlockDatesDialog";

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["admin", "channelSettings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("channel_manager_settings").select("id").eq("provider", "ezee").single();
      if (error) return null;
      return data;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("Channel manager not configured");
      const { data, error } = await supabase.functions.invoke('sync-channel-manager', {
        body: { settings_id: settings.id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-availability"] });
      toast({
        title: "Availability Synced",
        description: "Latest data from eZee Centrix has been applied.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message || "Could not sync with partner.",
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-medium">Booking Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual overview of all bookings and room availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          {settings && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Sync Availability
            </Button>
          )}
          <BlockDatesDialog />
        </div>
      </div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BookingCalendarView />
      </motion.div>
    </div>
  );
}
