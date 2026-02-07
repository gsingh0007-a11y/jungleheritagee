import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MessageCircle, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import logoImage from "@/assets/logo.png";
const PHONE_NUMBER = "9250225752";
const navLinks = [{
  name: "Home",
  path: "/"
}, {
  name: "Rooms & Villas",
  path: "/rooms"
}, {
  name: "Experiences",
  path: "/experiences"
}, {
  name: "Amenities",
  path: "/amenities"
}, {
  name: "Packages",
  path: "/packages"
}, {
  name: "Gallery",
  path: "/gallery"
}, {
  name: "About Us",
  path: "/about"
}, {
  name: "Contact",
  path: "/contact"
}];
export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    signOut,
    isAdmin
  } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    navigate("/", {
      replace: true
    });
  };
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  return <>
      <motion.header initial={{
      y: -100
    }} animate={{
      y: 0
    }} transition={{
      duration: 0.6,
      ease: "easeOut"
    }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? "bg-ivory/98 backdrop-blur-lg shadow-medium py-0" : "bg-gradient-to-b from-forest-deep/30 to-transparent py-2"}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <nav className="items-center justify-between h-20 md:h-24 flex flex-row mx-0 mr-[30px] gap-[15px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <img src={logoImage} alt="Jungle Heritage Resort" className="h-14 md:h-16 w-auto" />
              <div className="flex flex-col">
                
                <span className={`font-serif text-[9px] md:text-[10px] uppercase tracking-[0.15em] transition-colors duration-500 ${isScrolled ? "text-gold" : "text-gold-light"}`}>
                  Jagdevpur (Bhira)
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              {navLinks.map(link => <Link key={link.path} to={link.path} className={`relative px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-medium tracking-wide transition-all duration-300 rounded-full whitespace-nowrap ${isScrolled ? "text-foreground hover:text-forest hover:bg-forest/5" : "text-ivory/90 hover:text-ivory hover:bg-ivory/10"} ${location.pathname === link.path ? isScrolled ? "text-gold bg-gold/5" : "text-gold-light bg-gold/10" : ""}`}>
                  {link.name}
                </Link>)}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <a href={`https://wa.me/91${PHONE_NUMBER}`} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isScrolled ? "text-forest hover:text-gold hover:bg-gold/5" : "text-ivory/90 hover:text-gold-light hover:bg-ivory/10"}`}>
                <MessageCircle className="w-5 h-5" />
              </a>
              
              {/* User Menu / Login */}
              {user ? <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={`w-10 h-10 rounded-full ${isScrolled ? "text-forest hover:text-gold hover:bg-gold/5" : "text-ivory/90 hover:text-gold-light hover:bg-ivory/10"}`}>
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isAdmin ? <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem> : <DropdownMenuItem asChild>
                        <Link to="/account" className="flex items-center">
                          My Bookings
                        </Link>
                      </DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> : <Link to="/login" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isScrolled ? "text-forest hover:text-gold hover:bg-gold/5" : "text-ivory/90 hover:text-gold-light hover:bg-ivory/10"}`}>
                  <User className="w-5 h-5" />
                </Link>}
              
              <Button variant={isScrolled ? "luxuryDark" : "luxury"} size="sm" asChild className="shadow-lg">
                <Link to="/booking">Book Now</Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isScrolled ? "text-foreground hover:bg-forest/5" : "text-ivory hover:bg-ivory/10"}`} aria-label="Toggle menu">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-forest-deep/95 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.nav initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.1
        }} className="relative pt-24 pb-8 px-6 flex flex-col gap-6">
              {navLinks.map((link, index) => <motion.div key={link.path} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.1 + index * 0.05
          }}>
                  <Link to={link.path} className={`text-xl font-serif text-ivory hover:text-gold transition-colors ${location.pathname === link.path ? "text-gold" : ""}`}>
                    {link.name}
                  </Link>
                </motion.div>)}
              <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.4
          }} className="mt-6 flex flex-col gap-4">
                {user ? <>
                    <Link to={isAdmin ? "/admin" : "/account"} className="flex items-center gap-3 text-ivory hover:text-gold transition-colors">
                      <User className="w-5 h-5" />
                      <span>{isAdmin ? "Admin Dashboard" : "My Account"}</span>
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-3 text-ivory/70 hover:text-ivory transition-colors">
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </> : <Link to="/login" className="flex items-center gap-3 text-ivory hover:text-gold transition-colors">
                    <User className="w-5 h-5" />
                    <span>Login / Sign Up</span>
                  </Link>}
                <a href={`tel:+91${PHONE_NUMBER}`} className="flex items-center gap-3 text-ivory">
                  <Phone className="w-5 h-5" />
                  <span>+91 {PHONE_NUMBER}</span>
                </a>
                <Button variant="luxury" size="lg" asChild className="w-full">
                  <Link to="/booking">Book Your Stay</Link>
                </Button>
              </motion.div>
            </motion.nav>
          </motion.div>}
      </AnimatePresence>
    </>;
}