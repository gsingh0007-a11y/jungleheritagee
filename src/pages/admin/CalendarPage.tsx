import { motion } from "framer-motion";
import { BookingCalendarView } from "@/components/admin/calendar/BookingCalendarView";
import { BlockDatesDialog } from "@/components/admin/calendar/BlockDatesDialog";

export default function CalendarPage() {
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
        <BlockDatesDialog />
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
