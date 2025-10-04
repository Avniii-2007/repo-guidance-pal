import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Star, BookOpen, User } from "lucide-react";
import SessionScheduler from "@/components/sessions/SessionScheduler";

interface Mentor {
  id: string;
  name: string;
  profile_pic: string | null;
  bio?: string | null;
  skills?: string[] | null;
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

const AIRepoDiscovery = () => {
  const { toast } = useToast();
  const [level, setLevel] = useState("");
  const [interests, setInterests] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [preferences, setPreferences] = useState("");
  const [recommendations, setRecommendations] = useState<Repository[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<{
    id: string;
    name: string;
    mentor: Mentor;
  } | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  const handleDiscovery = async () => {
    if (!level || !interests || !careerGoals) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setRecommendations([]);
      setReasoning("");

      const { data, error } = await supabase.functions.invoke("ai-repo-discovery", {
        body: { level, interests, careerGoals, preferences },
      });

      if (error) {
        if (error.message.includes("Rate limit")) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive",
          });
          return;
        }
        if (error.message.includes("credits")) {
          toast({
            title: "Credits Exhausted",
            description: "Please add credits to your workspace to continue.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      setRecommendations(data.repositories);
      setReasoning(data.reasoning);

      toast({
        title: "Recommendations Ready!",
        description: `Found ${data.repositories.length} repositories matching your profile`,
      });
    } catch (error: any) {
      console.error("Error discovering repos:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMentor = (repo: Repository, mentor: Mentor) => {
    setSelectedRepo({
      id: repo.id,
      name: repo.name,
      mentor,
    });
    setShowScheduler(true);
  };

  return (
    <div className="space-y-6">
      <Card className="neon-border glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Repository Discovery
          </CardTitle>
          <CardDescription>
            Let AI help you find the perfect open source projects based on your skills and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="level">Skill Level *</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level" className="neon-border">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Interests *</Label>
              <Input
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g., Web Development, AI, Data Science"
                className="neon-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="career">Career Goals *</Label>
            <Textarea
              id="career"
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              placeholder="Describe your career goals and what you want to achieve..."
              className="neon-border min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferences">Additional Preferences (Optional)</Label>
            <Textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Any specific technologies, languages, or project types you prefer..."
              className="neon-border"
            />
          </div>

          <Button
            onClick={handleDiscovery}
            disabled={loading}
            className="w-full shadow-neon hover:shadow-glow transition-smooth"
            size="lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {loading ? "Finding Perfect Matches..." : "Discover Repositories"}
          </Button>
        </CardContent>
      </Card>

      {reasoning && (
        <Card className="neon-border glass-effect bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{reasoning}</p>
          </CardContent>
        </Card>
      )}

      {recommendations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((repo, index) => (
            <Card
              key={repo.id}
              className="neon-border glass-effect hover:shadow-glow transition-smooth group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-smooth">
                      {repo.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {repo.description}
                    </CardDescription>
                  </div>
                  <BookOpen className="h-5 w-5 text-primary flex-shrink-0 group-hover:animate-float" />
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
                    <p className="text-sm font-medium flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Available Mentors:
                    </p>
                    <div className="space-y-2">
                      {repo.mentors.map((mentor) => (
                        <div
                          key={mentor.id}
                          className="flex items-center justify-between p-2 rounded bg-card/50 neon-border"
                        >
                          <span className="text-sm">{mentor.name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnectMentor(repo, mentor)}
                            className="hover:shadow-neon transition-smooth"
                          >
                            Connect
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {repo.github_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(repo.github_url!, "_blank")}
                    className="w-full neon-border"
                  >
                    View on GitHub
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedRepo && (
        <SessionScheduler
          open={showScheduler}
          onOpenChange={setShowScheduler}
          mentorId={selectedRepo.mentor.id}
          mentorName={selectedRepo.mentor.name}
          repositoryId={selectedRepo.id}
          repositoryName={selectedRepo.name}
          onScheduled={() => {
            setShowScheduler(false);
            toast({
              title: "Session Scheduled!",
              description: "Check your sessions tab for details",
            });
          }}
        />
      )}
    </div>
  );
};

export default AIRepoDiscovery;