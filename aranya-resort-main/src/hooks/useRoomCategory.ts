 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { RoomCategory } from "./useRoomCategories";
 
 export function useRoomCategory(slug: string | undefined) {
   return useQuery({
     queryKey: ["room-category", slug],
     queryFn: async () => {
       if (!slug) throw new Error("Slug is required");
 
       const { data, error } = await supabase
         .from("room_categories")
         .select("*")
         .eq("slug", slug)
         .eq("is_active", true)
         .single();
 
       if (error) throw error;
 
       return {
         ...data,
         amenities: Array.isArray(data.amenities) ? data.amenities : [],
         images: Array.isArray(data.images) ? data.images : [],
       } as RoomCategory;
     },
     enabled: !!slug,
   });
 }