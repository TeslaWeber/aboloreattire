import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { z } from "zod";
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isAdminRoute = searchParams.get("type") === "admin";
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { user, signIn, signUp, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSupported: biometricSupported, isAuthenticating, authenticate } = useBiometricAuth();

  const handleBiometricSignIn = async () => {
    if (!formData.email) {
      setErrors({ email: "Please enter your email first" });
      return;
    }
    const { success, error } = await authenticate(formData.email);
    if (success) {
      toast({ title: "Welcome back!", description: "Signed in with biometrics." });
      navigate(isAdminRoute ? "/admin" : "/");
    } else {
      const isNotRegistered = error?.toLowerCase().includes("no biometric credentials");
      toast({
        title: isNotRegistered ? "No biometric credentials found" : "Biometric sign-in failed",
        description: isNotRegistered
          ? "You need to register biometrics first. Sign in with your password, then go to Account > Profile to set up biometric sign-in."
          : error,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      if (isAdminRoute) {
        if (isAdmin) {
          navigate("/admin");
        }
      } else {
        navigate("/");
      }
    }
  }, [user, isAdmin, isAdminRoute, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setErrors({ email: "Please enter your email address" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResetEmailSent(true);
      toast({ title: "Check your email", description: "We've sent you a password reset link." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isSignUp) {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message?.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message || "An error occurred during sign up.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome to Abolore Couture!",
            description: "Your account has been successfully created. Enjoy your shopping experience.",
          });
          navigate("/");
        }
      } else {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        if (isAdminRoute && formData.email !== "abolorecouture@gmail.com") {
          toast({
            title: "Access denied",
            description: "Only the administrator can access this area.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message || "Invalid email or password.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome to Abolore Couture!",
            description: "You have successfully signed in. Enjoy your shopping experience.",
          });
          if (isAdminRoute) {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold luxury-text-gradient mb-2">
              {isAdminRoute ? "Admin Login" : "ABOLORE COUTURE"}
            </h1>
            <p className="text-muted-foreground">
              {isAdminRoute 
                ? "Sign in to access the admin dashboard" 
                : isForgotPassword
                  ? "Enter your email to receive a reset link"
                  : isSignUp 
                    ? "Create your account to start shopping" 
                    : "Welcome back! Sign in to continue"}
            </p>
          </div>

          {isForgotPassword ? (
            resetEmailSent ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">We've sent a password reset link to <strong>{formData.email}</strong>. Check your inbox and follow the link to set a new password.</p>
                <Button onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); }} variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <Button type="submit" disabled={loading} className="w-full luxury-gradient text-primary-foreground font-semibold">
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setIsForgotPassword(false); setErrors({}); }} className="w-full">
                  Back to Sign In
                </Button>
              </form>
            )
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && !isAdminRoute && (
                <motion.div
                  key="fullName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="pl-10"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && !isAdminRoute && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setErrors({}); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isSignUp && !isAdminRoute && (
                <motion.div
                  key="confirmPassword"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="pl-10"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={loading}
              className="w-full luxury-gradient text-primary-foreground font-semibold"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>

            {biometricSupported && !isSignUp && (
              <Button
                type="button"
                variant="outline"
                disabled={isAuthenticating}
                onClick={handleBiometricSignIn}
                className="w-full flex items-center gap-2"
              >
                <Fingerprint className="h-5 w-5" />
                {isAuthenticating ? "Verifying..." : "Sign in with Fingerprint / Face ID"}
              </Button>
            )}
          </form>
          )}

          {!isAdminRoute && (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                  }}
                  className="text-primary hover:underline ml-1 font-medium"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
