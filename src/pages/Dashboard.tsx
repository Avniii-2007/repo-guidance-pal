import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Code } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import MentorDashboard from "@/components/dashboard/MentorDashboard";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  bio: string | null;
  profile_pic: string | null;
  skills: string[] | null;
  interests: string[] | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error: unknown) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 animate-pulse mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                OpenFuse
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                Welcome, <span className="text-primary font-medium">{profile.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="minimal-button px-4"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-6">
          {profile.role === "student" ? (
            <StudentDashboard profile={profile} />
          ) : (
            <MentorDashboard profile={profile} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
