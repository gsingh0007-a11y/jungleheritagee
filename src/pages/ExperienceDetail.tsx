 import { useParams, Link } from "react-router-dom";
 import { Header } from "@/components/layout/Header";
 import { Footer } from "@/components/layout/Footer";
 import { motion } from "framer-motion";
 import { ArrowLeft, Clock, Calendar, Check, ChevronLeft, ChevronRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Skeleton } from "@/components/ui/skeleton";
 import { useExperience } from "@/hooks/useExperiences";
 import { useState } from "react";
 
 const ExperienceDetail = () => {
   const { slug } = useParams<{ slug: string }>();
   const { data: experience, isLoading, error } = useExperience(slug || "");
   const [currentImageIndex, setCurrentImageIndex] = useState(0);
 
   if (isLoading) {
     return (
       <div className="min-h-screen bg-background">
         <Header />
         <main className="pt-24 pb-20">
           <div className="luxury-container">
             <Skeleton className="h-[60vh] w-full rounded-3xl mb-8" />
             <Skeleton className="h-10 w-1/2 mb-4" />
             <Skeleton className="h-6 w-full mb-2" />
             <Skeleton className="h-6 w-3/4" />
           </div>
         </main>
         <Footer />
       </div>
     );
   }
 
   if (error || !experience) {
     return (
       <div className="min-h-screen bg-background">
         <Header />
         <main className="pt-24 pb-20">
           <div className="luxury-container text-center py-20">
             <h1 className="font-serif text-4xl text-foreground mb-4">Experience Not Found</h1>
             <p className="text-muted-foreground mb-8">The experience you're looking for doesn't exist.</p>
             <Button asChild>
               <Link to="/experiences">Back to Experiences</Link>
             </Button>
           </div>
         </main>
         <Footer />
       </div>
     );
   }
 
   const allImages = [
     experience.image_url,
     ...(experience.gallery_images || []),
   ].filter(Boolean) as string[];
 
   const highlights = experience.highlights || [];
 
   const nextImage = () => {
     if (allImages.length > 1) {
       setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
     }
   };
 
   const prevImage = () => {
     if (allImages.length > 1) {
       setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
     }
   };
 
   return (
     <div className="min-h-screen bg-background">
       <Header />
       <main>
         {/* Hero Image Section */}
         <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
           {allImages.length > 0 ? (
             <>
               <motion.img
                 key={currentImageIndex}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ duration: 0.5 }}
                 src={allImages[currentImageIndex]}
                 alt={experience.name}
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-transparent to-forest-deep/30" />
               
               {/* Image Navigation */}
               {allImages.length > 1 && (
                 <>
                   <button
                     onClick={prevImage}
                     className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-ivory/90 flex items-center justify-center text-forest hover:bg-gold hover:text-ivory transition-all"
                   >
                     <ChevronLeft className="w-6 h-6" />
                   </button>
                   <button
                     onClick={nextImage}
                     className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-ivory/90 flex items-center justify-center text-forest hover:bg-gold hover:text-ivory transition-all"
                   >
                     <ChevronRight className="w-6 h-6" />
                   </button>
                   
                   {/* Image Indicators */}
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                     {allImages.map((_, index) => (
                       <button
                         key={index}
                         onClick={() => setCurrentImageIndex(index)}
                         className={`w-2 h-2 rounded-full transition-all ${
                           index === currentImageIndex ? "bg-gold w-6" : "bg-ivory/60 hover:bg-ivory"
                         }`}
                       />
                     ))}
                   </div>
                 </>
               )}
             </>
           ) : (
             <div className="w-full h-full bg-muted flex items-center justify-center">
               <span className="text-muted-foreground">No image available</span>
             </div>
           )}
           
           {/* Back Button */}
           <Link
             to="/experiences"
             className="absolute top-24 left-6 md:left-10 flex items-center gap-2 text-ivory hover:text-gold transition-colors"
           >
             <ArrowLeft className="w-5 h-5" />
             <span className="text-sm font-medium">Back to Experiences</span>
           </Link>
           
           {/* Title Overlay */}
           <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
             <div className="luxury-container">
               <span className="inline-block px-4 py-1.5 bg-gold/20 backdrop-blur-sm rounded-full text-gold-light text-xs uppercase tracking-widest mb-4">
                 {experience.subtitle || "Experience"}
               </span>
               <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-ivory">
                 {experience.name}
               </h1>
             </div>
           </div>
         </section>
 
         {/* Content Section */}
         <section className="py-16 md:py-24">
           <div className="luxury-container">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Main Content */}
               <div className="lg:col-span-2">
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6 }}
                 >
                   {/* Quick Info */}
                   <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-border">
                     {experience.duration && (
                       <div className="flex items-center gap-2 text-foreground">
                         <Clock className="w-5 h-5 text-gold" />
                         <span>{experience.duration}</span>
                       </div>
                     )}
                     {experience.best_time && (
                       <div className="flex items-center gap-2 text-foreground">
                         <Calendar className="w-5 h-5 text-gold" />
                         <span>{experience.best_time}</span>
                       </div>
                     )}
                   </div>
 
                   {/* Description */}
                   <div className="prose prose-lg max-w-none">
                     <p className="text-muted-foreground leading-relaxed text-lg">
                       {experience.description}
                     </p>
                     
                     {experience.long_description && (
                       <div className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-line">
                         {experience.long_description}
                       </div>
                     )}
                   </div>
 
                   {/* Highlights */}
                   {highlights.length > 0 && (
                     <div className="mt-12">
                       <h2 className="font-serif text-2xl text-foreground mb-6">Highlights</h2>
                       <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {highlights.map((highlight, index) => (
                           <li key={index} className="flex items-start gap-3">
                             <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                               <Check className="w-4 h-4 text-gold" />
                             </div>
                             <span className="text-muted-foreground">{highlight}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </motion.div>
               </div>
 
               {/* Sidebar */}
               <div className="lg:col-span-1">
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.2 }}
                   className="sticky top-24 bg-cream rounded-3xl p-8"
                 >
                   <h3 className="font-serif text-xl text-foreground mb-4">Interested in this experience?</h3>
                   <p className="text-muted-foreground text-sm mb-6">
                     Contact our team to learn more about this experience and add it to your stay.
                   </p>
                   <Button asChild className="w-full mb-3">
                     <Link to="/contact">Contact Us</Link>
                   </Button>
                   <Button asChild variant="outline" className="w-full">
                     <Link to="/booking">Book Your Stay</Link>
                   </Button>
                 </motion.div>
               </div>
             </div>
           </div>
         </section>
 
         {/* Gallery Grid */}
         {allImages.length > 1 && (
           <section className="pb-20">
             <div className="luxury-container">
               <h2 className="font-serif text-3xl text-foreground mb-8">Gallery</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {allImages.map((image, index) => (
                   <motion.button
                     key={index}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ duration: 0.5, delay: index * 0.05 }}
                     onClick={() => setCurrentImageIndex(index)}
                     className={`relative aspect-square rounded-xl overflow-hidden ${
                       index === currentImageIndex ? "ring-2 ring-gold" : ""
                     }`}
                   >
                     <img
                       src={image}
                       alt={`${experience.name} ${index + 1}`}
                       className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                     />
                   </motion.button>
                 ))}
               </div>
             </div>
           </section>
         )}
       </main>
       <Footer />
     </div>
   );
 };
 
 export default ExperienceDetail;