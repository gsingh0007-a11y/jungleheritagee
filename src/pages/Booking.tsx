import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import { CalendarDays, Users, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import villaImage from "@/assets/villa-interior.jpg";
import treehouseImage from "@/assets/treehouse-suite.jpg";
import poolImage from "@/assets/pool.jpg";

const roomTypes = [
  {
    id: "forest-villa",
    name: "Forest Villa",
    image: villaImage,
    price: 18000,
    maxAdults: 3,
    maxChildren: 1,
  },
  {
    id: "treehouse-suite",
    name: "Treehouse Suite",
    image: treehouseImage,
    price: 25000,
    maxAdults: 2,
    maxChildren: 0,
  },
  {
    id: "pool-villa",
    name: "Pool Villa",
    image: poolImage,
    price: 45000,
    maxAdults: 4,
    maxChildren: 2,
  },
];

const Booking = () => {
  const { toast } = useToast();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const nights = checkIn && checkOut
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const selectedRoomData = roomTypes.find((r) => r.id === selectedRoom);
  const totalPrice = selectedRoomData ? selectedRoomData.price * nights : 0;

  const handleBooking = () => {
    if (!checkIn || !checkOut || !selectedRoom) {
      toast({
        title: "Please complete all fields",
        description: "Select dates and room type to proceed.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Booking Request Sent!",
      description: "Our team will contact you shortly to confirm your reservation.",
    });
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
              <span className="luxury-label text-gold-light">Reservations</span>
              <h1 className="luxury-heading text-ivory mt-4">Book Your Stay</h1>
              <p className="text-ivory/70 mt-4 max-w-2xl mx-auto">
                Begin your forest escape. Select your dates, choose your sanctuary, 
                and let us take care of the rest.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Booking Form */}
        <section className="luxury-section">
          <div className="luxury-container">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-3xl p-8 md:p-12 shadow-luxury"
              >
                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Check-in Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-14",
                            !checkIn && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-3 h-5 w-5 text-gold" />
                          {checkIn ? format(checkIn, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={(date) => {
                            setCheckIn(date);
                            if (date && (!checkOut || checkOut <= date)) {
                              setCheckOut(addDays(date, 1));
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Check-out Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-14",
                            !checkOut && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-3 h-5 w-5 text-gold" />
                          {checkOut ? format(checkOut, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) =>
                            date < (checkIn ? addDays(checkIn, 1) : new Date())
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Guest Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Adults
                    </label>
                    <div className="flex items-center justify-between h-14 px-4 border rounded-lg bg-background">
                      <span className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gold" />
                        {adults} Adult{adults > 1 ? "s" : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAdults(Math.min(4, adults + 1))}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Children
                    </label>
                    <div className="flex items-center justify-between h-14 px-4 border rounded-lg bg-background">
                      <span className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gold" />
                        {children} Child{children !== 1 ? "ren" : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setChildren(Math.min(2, children + 1))}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Room Selection */}
                <div className="mb-8">
                  <label className="text-sm font-medium text-foreground mb-4 block">
                    Select Your Accommodation
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roomTypes.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className={cn(
                          "relative overflow-hidden rounded-xl border-2 transition-all",
                          selectedRoom === room.id
                            ? "border-gold shadow-gold"
                            : "border-transparent hover:border-muted"
                        )}
                      >
                        <div className="aspect-[4/3]">
                          <img
                            src={room.image}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 bg-background">
                          <h4 className="font-serif font-medium text-foreground">
                            {room.name}
                          </h4>
                          <p className="text-gold font-semibold">
                            ₹{room.price.toLocaleString()}
                            <span className="text-xs text-muted-foreground font-normal">
                              {" "}
                              / night
                            </span>
                          </p>
                        </div>
                        {selectedRoom === room.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-forest-deep"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                {selectedRoom && nights > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-8 p-6 bg-cream rounded-xl"
                  >
                    <h4 className="font-serif text-lg font-medium text-foreground mb-4">
                      Price Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {selectedRoomData?.name} × {nights} night
                          {nights > 1 ? "s" : ""}
                        </span>
                        <span>₹{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes & Fees</span>
                        <span>₹{Math.round(totalPrice * 0.18).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span className="text-gold">
                            ₹{Math.round(totalPrice * 1.18).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  variant="luxuryDark"
                  size="xl"
                  className="w-full"
                  onClick={handleBooking}
                >
                  Request Booking
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Our team will contact you to confirm availability and complete 
                  your reservation.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;
