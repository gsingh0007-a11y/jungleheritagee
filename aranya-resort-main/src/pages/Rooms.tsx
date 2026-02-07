import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoomCategories } from "@/hooks/useRoomCategories";
import placeholderImage from "/placeholder.svg";

const Rooms = () => {
  const { data: rooms = [], isLoading } = useRoomCategories();

  const formatOccupancy = (adults: number, children: number) => {
    let text = `${adults} Adult${adults > 1 ? "s" : ""}`;
    if (children > 0) {
      text += ` + ${children} Child${children > 1 ? "ren" : ""}`;
    }
    return text;
  };

  const getRoomImage = (images: string[] | null) => {
    if (!images || images.length === 0) return placeholderImage;
    return images[0];
  };

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
              <span className="luxury-label text-gold-light">Accommodations</span>
              <h1 className="luxury-heading text-ivory mt-4">
                Rooms & Villas
              </h1>
              <p className="text-ivory/70 mt-4 max-w-2xl mx-auto">
                Each accommodation is a sanctuary of luxury, thoughtfully designed to 
                immerse you in the beauty of the forest while providing every modern comfort.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Rooms Grid */}
        <section className="luxury-section">
          <div className="luxury-container">
            {isLoading ? (
              <div className="space-y-24">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <Skeleton className="aspect-[4/3] rounded-2xl" />
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-48" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No rooms available at the moment.</p>
                <p className="text-sm text-muted-foreground mt-2">Please check back later or contact us for inquiries.</p>
              </div>
            ) : (
              <div className="space-y-24">
                {rooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Image */}
                  <div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className="relative overflow-hidden rounded-2xl image-zoom shadow-luxury">
                      <div className="aspect-[4/3]">
                        <img
                          src={getRoomImage(room.images)}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-6 right-6 bg-ivory/95 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                        <span className="block font-serif text-xl font-semibold text-forest-deep">
                          ₹{room.base_price_per_night.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          per night
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
                    {room.description && (
                      <span className="text-gold text-sm italic font-serif">
                        Luxury {room.name} Experience
                      </span>
                    )}
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mt-2 mb-4">
                      {room.name}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {room.description || `Experience the ultimate luxury in our ${room.name}. Perfect for guests seeking comfort and elegance.`}
                    </p>

                    {/* Room Details */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gold" />
                        <span className="text-sm">{formatOccupancy(room.max_adults, room.max_children)}</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-8">
                        {room.amenities.slice(0, 6).map((amenity, i) => (
                          <span
                          key={i}
                          className="px-3 py-1 bg-secondary rounded-full text-xs text-foreground"
                          >
                          {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Button variant="luxuryDark" size="lg" asChild>
                        <Link to="/booking">Book Now</Link>
                      </Button>
                       <Link
                         to={`/rooms/${room.slug}`}
                         className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                       >
                         View Details
                         <ArrowRight className="w-4 h-4" />
                       </Link>
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Rooms;
