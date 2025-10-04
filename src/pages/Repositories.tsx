import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Star, ExternalLink } from "lucide-react";
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
        mentors: repo.mentor_repositories?.map((mr: any) => mr.profiles).filter(Boolean) || []
      }));
      
      setRepositories(reposWithMentors);
    } catch (error) {
      console.error("Error fetching repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 
            className="text-2xl font-bold gradient-primary bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate("/")}
          >
            MentorMatch
          </h1>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4">Explore Open Source Projects</h2>
          <p className="text-xl text-muted-foreground">
            Browse popular repositories and find experienced mentors ready to guide you
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <Card key={repo.id} className="shadow-card hover:shadow-elegant transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{repo.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {repo.description}
                    </CardDescription>
                  </div>
                  <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {repo.language && (
                    <Badge variant="secondary">{repo.language}</Badge>
                  )}
                  {repo.stars !== null && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{repo.stars.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                {repo.mentors && repo.mentors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Available Mentors:</p>
                    <div className="flex flex-wrap gap-2">
                      {repo.mentors.map((mentor) => (
                        <Badge key={mentor.id} variant="outline" className="text-xs">
                          {mentor.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate("/auth")}
                  >
                    Find Mentor
                  </Button>
                  {repo.github_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(repo.github_url!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading repositories...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Repositories;
