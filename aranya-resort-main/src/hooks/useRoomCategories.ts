 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface RoomCategory {
   id: string;
   name: string;
   slug: string;
   description: string | null;
   base_price_per_night: number;
   max_adults: number;
   max_children: number;
   base_occupancy: number;
   amenities: string[] | null;
   images: string[] | null;
   is_active: boolean;
   display_order: number;
   total_rooms: number;
 }
 
 export function useRoomCategories(limit?: number) {
   return useQuery({
     queryKey: ["room-categories", limit],
     queryFn: async () => {
       let query = supabase
         .from("room_categories")
         .select("*")
         .eq("is_active", true)
         .order("display_order", { ascending: true });
 
       if (limit) {
         query = query.limit(limit);
       }
 
       const { data, error } = await query;
 
       if (error) throw error;
 
       return data.map((room) => ({
         ...room,
         amenities: Array.isArray(room.amenities) ? room.amenities : [],
         images: Array.isArray(room.images) ? room.images : [],
       })) as RoomCategory[];
     },
   });
 }