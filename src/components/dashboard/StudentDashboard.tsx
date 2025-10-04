import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Repository {
  id: string;
  name: string;
  description: string | null;
  github_url: string | null;
  stars: number | null;
  language: string | null;
}

interface Profile {
  id: string;
  name: string;
  role: string;
}

const StudentDashboard = ({ profile }: { profile: Profile }) => {
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from("repositories")
        .select("*")
        .order("stars", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRepositories(data || []);
    } catch (error: any) {
      console.error("Error fetching repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load repositories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (repoId: string, repoName: string) => {
    toast({
      title: "Connection Request",
      description: `Request to connect for ${repoName} will be implemented soon!`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Explore Open Source Projects</h2>
        <p className="text-muted-foreground">
          Find projects you're interested in and connect with experienced mentors
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
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleConnect(repo.id, repo.name)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Find Mentor
                </Button>
                {repo.github_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(repo.github_url!, "_blank")}
                  >
                    View
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

      {!loading && repositories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No repositories found</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
