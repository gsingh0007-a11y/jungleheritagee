// Room and availability types

export interface Room {
  id: string;
  room_category_id: string;
  room_number: string;
  floor: number;
  status: 'available' | 'maintenance' | 'blocked';
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  room_category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface BlockedDate {
  id: string;
  room_id: string;
  blocked_date: string;
  reason: 'booking' | 'maintenance' | 'private' | 'other';
  booking_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined data
  room?: Room;
  booking?: {
    id: string;
    booking_reference: string;
    guest_name: string;
    status: string;
  };
}

export interface CalendarBooking {
  id: string;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  status: string;
  room_id: string | null;
  room_category_id: string | null;
  num_adults: number;
  num_children: number;
  grand_total: number | null;
  room?: {
    id: string;
    room_number: string;
    room_category_id: string;
  } | null;
  room_category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AvailabilityResult {
  available: boolean;
  availableRooms: { room_id: string; room_number: string }[];
  totalRooms: number;
}

export type BlockReason = 'booking' | 'maintenance' | 'private' | 'other';
