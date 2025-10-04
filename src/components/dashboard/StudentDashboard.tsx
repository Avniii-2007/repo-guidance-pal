import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        .order("stars", { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Transform data to include mentors array
      const reposWithMentors = (data || []).map(repo => ({
        ...repo,
        mentors: repo.mentor_repositories?.map((mr: any) => mr.profiles).filter(Boolean) || []
      }));
      
      setRepositories(reposWithMentors);
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Find mentors for this repository
      const { data: mentorRepos, error: mentorError } = await supabase
        .from("mentor_repositories")
        .select("mentor_id")
        .eq("repository_id", repoId);

      if (mentorError) throw mentorError;

      if (!mentorRepos || mentorRepos.length === 0) {
        toast({
          title: "No Mentors Available",
          description: `No mentors are currently available for ${repoName}`,
          variant: "destructive",
        });
        return;
      }

      // Create mentorship request with first available mentor
      const { error: requestError } = await supabase
        .from("mentorship_requests")
        .insert({
          student_id: session.user.id,
          mentor_id: mentorRepos[0].mentor_id,
          repository_id: repoId,
          status: "pending",
          message: `I'm interested in learning more about ${repoName}`,
        });

      if (requestError) throw requestError;

      toast({
        title: "Request Sent!",
        description: `Your mentorship request for ${repoName} has been sent`,
      });
    } catch (error: any) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
