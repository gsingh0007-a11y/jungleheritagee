// Booking system types

export type BookingStatus =
  | 'new_enquiry'
  | 'enquiry_responded'
  | 'quote_sent'
  | 'booking_confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type BookingSource = 'website' | 'channel_manager' | 'admin';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type MealPlan = 'EP' | 'CP' | 'MAP' | 'AP';

export type RoomStatus = 'active' | 'inactive' | 'maintenance';

export type PackageType =
  | 'honeymoon'
  | 'safari'
  | 'family'
  | 'corporate'
  | 'weekend'
  | 'wedding'
  | 'seasonal';

export type SeasonType = 'peak' | 'regular' | 'off_peak';

export type AppRole = 'super_admin' | 'staff';

export interface RoomCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  max_adults: number;
  max_children: number;
  base_occupancy: number;
  base_price_per_night: number;
  extra_adult_price: number;
  extra_child_price: number;
  total_rooms: number;
  amenities: string[];
  images: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MealPlanPrice {
  id: string;
  meal_plan: MealPlan;
  name: string;
  description: string | null;
  adult_price: number;
  child_price: number;
  is_active: boolean;
}

export interface Season {
  id: string;
  name: string;
  season_type: SeasonType;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  is_active: boolean;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  package_type: PackageType;
  description: string | null;
  short_description: string | null;
  duration_nights: number;
  inclusions: string[];
  exclusions: string[];
  is_fixed_price: boolean;
  fixed_price: number | null;
  per_night_price: number | null;
  applicable_room_ids: string[];
  valid_from: string | null;
  valid_until: string | null;
  min_guests: number;
  max_guests: number | null;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

export interface TaxConfig {
  id: string;
  name: string;
  percentage: number;
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_reference: string;
  user_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_country: string | null;
  special_requests: string | null;
  room_category_id: string | null;
  package_id: string | null;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  num_rooms: number;
  base_price: number | null;
  taxes: number | null;
  extras: number | null;
  discount: number | null;
  grand_total: number | null;
  status: BookingStatus;
  is_enquiry_only: boolean;
  internal_notes: string | null;
  assigned_room_numbers: string[] | null;
  source: BookingSource;
  channel_manager_id: string | null;
  payment_status: PaymentStatus;
  payment_id: string | null;
  payment_provider: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  room_category?: RoomCategory;
  package?: Package;
}

export interface BookingFormData {
  checkInDate: Date | undefined;
  checkOutDate: Date | undefined;
  numAdults: number;
  numChildren: number;
  roomCategoryId: string;
  packageId: string | null;
  mealPlan: MealPlan;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCity: string;
  specialRequests: string;
  isEnquiryOnly: boolean;
}

export interface PriceBreakdown {
  numNights: number;
  baseRoomPrice: number;
  seasonMultiplier: number;
  roomTotal: number;
  extraAdults: number;
  extraChildren: number;
  extraAdultTotal: number;
  extraChildTotal: number;
  extraGuestTotal: number;
  mealPlanAdultTotal: number;
  mealPlanChildTotal: number;
  mealPlanTotal: number;
  packageTotal: number;
  subtotal: number;
  taxRate: number;
  taxes: number;
  grandTotal: number;
}

export interface BookingStep {
  id: number;
  title: string;
  description: string;
}

export const BOOKING_STEPS: BookingStep[] = [
  { id: 1, title: 'Dates', description: 'Select your stay dates' },
  { id: 2, title: 'Guests & Room', description: 'Choose room and guests' },
  { id: 3, title: 'Add-ons', description: 'Meal plan & packages' },
  { id: 4, title: 'Details', description: 'Your information' },
  { id: 5, title: 'Confirm', description: 'Review & book' },
];
