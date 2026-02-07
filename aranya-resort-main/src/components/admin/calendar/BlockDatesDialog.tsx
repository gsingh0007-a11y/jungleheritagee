import { useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarDays, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRooms, useBlockDates } from "@/hooks/useRoomAvailability";
import type { BlockReason } from "@/types/rooms";

interface BlockDatesDialogProps {
  roomCategoryId?: string;
  children?: React.ReactNode;
}

const BLOCK_REASONS: { value: BlockReason; label: string }[] = [
  { value: "maintenance", label: "Maintenance" },
  { value: "private", label: "Private / Owner Use" },
  { value: "other", label: "Other" },
];

export function BlockDatesDialog({ roomCategoryId, children }: BlockDatesDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState<BlockReason>("maintenance");
  const [notes, setNotes] = useState("");

  const { data: rooms, isLoading: roomsLoading } = useRooms(roomCategoryId);
  const blockMutation = useBlockDates();

  const handleSubmit = async () => {
    if (!selectedRoom || !startDate || !endDate) return;

    await blockMutation.mutateAsync({
      roomId: selectedRoom,
      startDate,
      endDate,
      reason,
      notes: notes.trim() || undefined,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedRoom("");
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("maintenance");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Lock className="h-4 w-4 mr-2" />
            Block Dates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Block Room Dates
          </DialogTitle>
          <DialogDescription>
            Block dates for maintenance, private use, or other reasons. Blocked dates cannot be booked by guests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Room Selection */}
          <div className="space-y-2">
            <Label>Select Room</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a room..." />
              </SelectTrigger>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number} - {room.room_category?.name || "Unknown Category"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date && (!endDate || endDate <= date)) {
                        setEndDate(addDays(date, 1));
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date <= (startDate || new Date())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as BlockReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this block..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedRoom || !startDate || !endDate || blockMutation.isPending}
          >
            {blockMutation.isPending ? "Blocking..." : "Block Dates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
