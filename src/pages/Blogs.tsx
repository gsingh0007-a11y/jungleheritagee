import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, User, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Blogs() {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: blogs, isLoading } = useQuery({
        queryKey: ["public-blogs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("blogs")
                .select("*")
                .eq("is_published", true)
                .order("published_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const filteredBlogs = blogs?.filter((blog) =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 bg-forest-deep">
                    <div className="container px-4 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center md:text-left"
                        >
                            <Badge className="mb-4 bg-gold-light text-forest-deep hover:bg-gold-light/90 border-0">Our Journal</Badge>
                            <h1 className="luxury-heading text-ivory mb-6">
                                Stories & <span className="text-gold-light">Journal</span>
                            </h1>
                            <p className="text-lg text-ivory/70 mb-8 max-w-2xl leading-relaxed">
                                Discover the latest news from Jungle Heritage Resort, travel tips for your wilderness adventure, and stories from our guests.
                            </p>

                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/50" />
                                <Input
                                    placeholder="Search stories..."
                                    className="pl-10 h-12 bg-white/10 backdrop-blur-md border-white/20 text-ivory placeholder:text-ivory/40 focus:border-gold-light focus:ring-gold-light"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="luxury-section">
                    <div className="luxury-container">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--gold))]" />
                                <p className="mt-4 text-muted-foreground">Fetching stories...</p>
                            </div>
                        ) : filteredBlogs && filteredBlogs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredBlogs.map((blog, index) => (
                                    <motion.div
                                        key={blog.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        <Card className="h-full flex flex-col overflow-hidden group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="relative h-56 overflow-hidden">
                                                <img
                                                    src={blog.featured_image || "https://images.unsplash.com/photo-1433086566608-bcfa2963c17a?q=80&w=800&auto=format&fit=crop"}
                                                    alt={blog.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <Badge className="absolute top-4 right-4 bg-white/90 text-foreground backdrop-blur-md shadow-sm border-0">
                                                    {blog.category || "Lifestyle"}
                                                </Badge>
                                            </div>

                                            <CardHeader className="pt-6">
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {blog.published_at ? format(new Date(blog.published_at), "MMM dd, yyyy") : format(new Date(blog.created_at), "MMM dd, yyyy")}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        Admin
                                                    </span>
                                                </div>
                                                <CardTitle className="text-xl font-serif leading-tight group-hover:text-[hsl(var(--gold))] transition-colors line-clamp-2">
                                                    {blog.title}
                                                </CardTitle>
                                            </CardHeader>

                                            <CardContent className="flex-grow">
                                                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                                                    {blog.excerpt || "Dive into the heart of the jungle with our latest update. Explore the wilderness and find your sanctuary..."}
                                                </p>
                                            </CardContent>

                                            <CardFooter className="pt-0 pb-6 mt-auto">
                                                <Button variant="ghost" className="p-0 text-[hsl(var(--gold))] hover:text-[hsl(var(--gold)/0.8)] hover:bg-transparent" asChild>
                                                    <Link to={`/blog/${blog.slug}`} className="flex items-center gap-2 group/btn">
                                                        Read Full Story
                                                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                                    </Link>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
                                <p className="text-lg text-muted-foreground">No stories found matching your search.</p>
                                <Button
                                    variant="link"
                                    className="mt-2 text-[hsl(var(--gold))]"
                                    onClick={() => setSearchQuery("")}
                                >
                                    Clear search
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
);
