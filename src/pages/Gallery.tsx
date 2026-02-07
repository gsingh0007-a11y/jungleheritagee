import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Fallback static images for when database is empty
import villaImage from "@/assets/villa-interior.jpg";
import treehouseImage from "@/assets/treehouse-suite.jpg";
import poolImage from "@/assets/pool.jpg";
import safariImage from "@/assets/safari.jpg";
import diningImage from "@/assets/dining.jpg";
import heroImage from "@/assets/hero-resort.jpg";

const categories = [
  "All",
  "Property",
  "Rooms",
  "Experiences",
  "Dining",
  "Weddings",
  "Events",
];

const fallbackImages = [
  { src: heroImage, category: "Property", alt: "Aerial view of Resort" },
  { src: villaImage, category: "Rooms", alt: "Forest Villa Interior" },
  { src: treehouseImage, category: "Rooms", alt: "Treehouse Suite" },
  { src: poolImage, category: "Property", alt: "Infinity Pool" },
  { src: safariImage, category: "Experiences", alt: "Jungle Safari" },
  { src: diningImage, category: "Dining", alt: "Candlelight Dinner" },
];

interface GalleryImage {
  id: string;
  title: string;
  alt_text: string;
  category: string;
  image_url: string;
  display_order: number;
}

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: dbImages, isLoading } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  // Use database images if available, otherwise fallback to static
  const galleryImages = dbImages && dbImages.length > 0
    ? dbImages.map((img) => ({
        src: img.image_url,
        category: img.category,
        alt: img.alt_text,
      }))
    : fallbackImages;

  const filteredImages =
    activeCategory === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-forest-deep">
          <div className="luxury-container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="luxury-label text-gold-light">Visual Journey</span>
              <h1 className="luxury-heading text-ivory mt-4">Gallery</h1>
              <p className="text-ivory/70 mt-4 max-w-2xl mx-auto">
                Explore the beauty of Jungle Heritage through our curated collection of 
                photographs capturing the essence of luxury wilderness living.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Gallery */}
        <section className="luxury-section">
          <div className="luxury-container">
            {/* Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? "bg-forest-deep text-ivory"
                      : "bg-secondary text-foreground hover:bg-forest/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </motion.div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Masonry Grid */}
            {!isLoading && (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredImages.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="break-inside-avoid"
                  >
                    <div className="relative overflow-hidden rounded-2xl group cursor-pointer">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-forest-deep/0 group-hover:bg-forest-deep/40 transition-colors duration-300 flex items-end">
                        <div className="p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <span className="text-gold-light text-xs uppercase tracking-widest">
                            {image.category}
                          </span>
                          <p className="text-ivory font-serif text-lg mt-1">
                            {image.alt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredImages.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No images in this category</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
