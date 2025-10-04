import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Users, Code } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "mentor">("student");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      
      navigate("/dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          name,
          email,
          role,
          skills: [],
          interests: [],
        });

      if (profileError) throw profileError;

      toast({
        title: "Welcome aboard!",
        description: "Your account has been created successfully.",
      });

      navigate("/dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 aesthetic-grid opacity-20"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full gradient-glow opacity-50"></div>
      
      {/* Theme Toggle in top right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-lg relative z-10">
        <div className="ultra-card p-10 hover-lift fade-in">
          <div className="text-center space-y-6 mb-8">
            <div className="flex items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                OpenFuse
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-muted-foreground">
                Connect with mentors and accelerate your open source journey
              </p>
            </div>
          </div>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 ultra-card">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary/20 data-[state=active]:border-primary/30">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary/20 data-[state=active]:border-primary/30">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-8">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 ultra-card border-0 focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 ultra-card border-0 focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 hover-lift" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-8">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 ultra-card border-0 focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 ultra-card border-0 focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min. 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 ultra-card border-0 focus:ring-2 focus:ring-primary/50"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Choose your role</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`p-6 rounded-2xl border-2 transition-smooth ultra-card ${
                        role === "student"
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border/50 hover:border-primary/50"
                      }`}
                    >
                      <GraduationCap className="h-10 w-10 mx-auto mb-3 text-primary" />
                      <div className="font-medium">Student</div>
                      <div className="text-xs text-muted-foreground mt-1">Learn from mentors</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("mentor")}
                      className={`p-6 rounded-2xl border-2 transition-smooth ultra-card ${
                        role === "mentor"
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border/50 hover:border-primary/50"
                      }`}
                    >
                      <Users className="h-10 w-10 mx-auto mb-3 text-primary" />
                      <div className="font-medium">Mentor</div>
                      <div className="text-xs text-muted-foreground mt-1">Guide others</div>
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 hover-lift" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
