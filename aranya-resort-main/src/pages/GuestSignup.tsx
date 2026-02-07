import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Loader2, Check } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLinkBookings } from "@/hooks/useLinkBookings";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function GuestSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, user } = useAuth();
  const { linkBookings } = useLinkBookings();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get booking reference from location state (post-booking signup flow)
  const bookingRef = location.state?.bookingRef;
  const bookingEmail = location.state?.email;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: bookingEmail || "",
    },
  });

  useEffect(() => {
    if (bookingEmail) {
      setValue("email", bookingEmail);
    }
  }, [bookingEmail, setValue]);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const authData = await signUp(data.email, data.password, data.fullName);
      
      // Link any existing bookings with this email (including the one just created)
      if (authData.user) {
        linkBookings.mutate({ 
          userId: authData.user.id, 
          email: data.email 
        });
      }

      setIsSuccess(true);
      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      });

      // Redirect after a brief delay
      setTimeout(() => {
        navigate("/account", { replace: true });
      }, 1500);
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes("already registered")) {
        toast({
          variant: "destructive",
          title: "Email already registered",
          description: "This email is already in use. Try signing in instead.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md text-center shadow-luxury border-border/50">
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-serif mb-2">Account Created!</h2>
                <p className="text-muted-foreground mb-4">
                  {bookingRef 
                    ? `Your booking (${bookingRef}) has been linked to your new account.`
                    : "You can now view and manage all your bookings."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to your account...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-luxury border-border/50">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <img src={logoImage} alt="Jungle Heritage" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl font-serif">Create Account</CardTitle>
              <CardDescription>
                {bookingRef 
                  ? "Create an account to track your booking and manage future stays"
                  : "Sign up to view your bookings and enjoy exclusive benefits"}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {bookingRef && (
                <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/20">
                  <p className="text-sm text-center">
                    Booking <span className="font-medium">{bookingRef}</span> will be linked to your account
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      {...register("fullName")}
                      className="pl-10"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register("email")}
                      className="pl-10"
                      disabled={!!bookingEmail}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("confirmPassword")}
                      className="pl-10"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-[hsl(var(--gold))] hover:underline">
                  Sign in
                </Link>
              </p>
              <p className="text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link to="/terms" className="text-[hsl(var(--gold))] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-[hsl(var(--gold))] hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
