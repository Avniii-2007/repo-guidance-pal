import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Star, ExternalLink, Code, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigate } from "react-router-dom";

interface Mentor {
  id: string;
  name: string;
  profile_pic: string | null;
}

interface Repository {
  id: string;
  name: string;
  description: string | null;
  github_url: string | null;
  stars: number | null;
  language: string | null;
  mentors?: Mentor[];
}

const Repositories = () => {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from("repositories")
        .select(`
          *,
          mentor_repositories (
            mentor_id,
            profiles:mentor_id (
              id,
              name,
              profile_pic
            )
          )
        `)
        .order("stars", { ascending: false });

      if (error) throw error;
      
      // Transform data to include mentors array
      const reposWithMentors = (data || []).map(repo => ({
        ...repo,
        mentors: repo.mentor_repositories?.map((mr: { profiles: unknown }) => mr.profiles).filter(Boolean) || []
      }));
      
      setRepositories(reposWithMentors);
    } catch (error) {
      console.error("Error fetching repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <Code className="h-8 w-8 text-primary group-hover:animate-float" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                OpenFuse
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                onClick={() => navigate("/auth")} 
                className="minimal-button px-6"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-20 max-w-4xl mx-auto fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Discover Amazing Projects
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Explore open source repositories with active mentors ready to guide your journey
            </p>
          </div>

          {/* Repository Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {repositories.map((repo, index) => (
              <div 
                key={repo.id} 
                className="ultra-card p-6 hover-lift scale-in group" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold truncate group-hover:text-primary transition-smooth">
                        {repo.name}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mt-1 leading-relaxed">
                        {repo.description || "No description available"}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-smooth">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm">
                    {repo.language && (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                        <span className="text-muted-foreground">{repo.language}</span>
                      </div>
                    )}
                    {repo.stars !== null && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span>{repo.stars.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Mentors */}
                  {repo.mentors && repo.mentors.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {repo.mentors.length} mentor{repo.mentors.length > 1 ? 's' : ''} available
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {repo.mentors.slice(0, 3).map((mentor) => (
                          <div key={mentor.id} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {mentor.name}
                          </div>
                        ))}
                        {repo.mentors.length > 3 && (
                          <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                            +{repo.mentors.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 hover-lift"
                      onClick={() => navigate("/auth")}
                    >
                      Find Mentor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    {repo.github_url && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="minimal-button"
                        onClick={() => window.open(repo.github_url!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse mx-auto"></div>
                <p className="text-muted-foreground">Loading amazing projects...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Repositories;
