import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, MessageSquare, Star, Sparkles, Calendar, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MentorSelectionDialog from "@/components/MentorSelectionDialog";
import StudentConversations from "./StudentConversations";
import StudentSessions from "@/components/sessions/StudentSessions";
import SessionScheduler from "@/components/sessions/SessionScheduler";
import AIRepoDiscovery from "@/components/ai/AIRepoDiscovery";

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

interface Profile {
  id: string;
  name: string;
  role: string;
}

const StudentDashboard = ({ profile }: { profile: Profile }) => {
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<{ id: string; name: string; mentors: Mentor[] } | null>(null);
  const [showMentorDialog, setShowMentorDialog] = useState(false);
  const [schedulerData, setSchedulerData] = useState<{
    mentorId: string;
    mentorName: string;
    repoId: string;
    repoName: string;
  } | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [mentorshipRequests, setMentorshipRequests] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRepositories();
    fetchMentorshipRequests();
  }, []);

  const fetchMentorshipRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("mentorship_requests")
        .select("mentor_id, status")
        .eq("student_id", profile.id)
        .in("status", ["pending", "accepted"]); // Only fetch active requests

      if (error) throw error;
      
      const requestsMap: Record<string, string> = {};
      data?.forEach((req) => {
        requestsMap[req.mentor_id] = req.status;
      });
      setMentorshipRequests(requestsMap);
    } catch (error: any) {
      console.error("Error fetching mentorship requests:", error);
    }
  };

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
              profile_pic,
              bio,
              skills
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

  const handleConnect = async (repo: Repository, mentor: Mentor) => {
    await createMentorshipRequest(repo.id, repo.name, mentor.id);
    await fetchMentorshipRequests();
  };

  const handleSchedule = (repo: Repository, mentor: Mentor) => {
    setSchedulerData({
      mentorId: mentor.id,
      mentorName: mentor.name,
      repoId: repo.id,
      repoName: repo.name,
    });
    setShowScheduler(true);
  };

  const createMentorshipRequest = async (repoId: string, repoName: string, mentorId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: requestError } = await supabase
        .from("mentorship_requests")
        .insert({
          student_id: session.user.id,
          mentor_id: mentorId,
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
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 gradient-glow opacity-50 blur-3xl"></div>
        <div className="relative">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-glow-pulse">
            Your Mentorship Journey
          </h2>
          <p className="text-muted-foreground">
            Discover projects, connect with mentors, and grow your skills
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/feedback'}
          className="neon-border"
        >
          <Star className="h-4 w-4 mr-2" />
          View My Feedback
        </Button>
      </div>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-4 neon-border glass-effect">
          <TabsTrigger value="discover">
            <Brain className="h-4 w-4 mr-2" />
            AI Discovery
          </TabsTrigger>
          <TabsTrigger value="repositories">
            <BookOpen className="h-4 w-4 mr-2" />
            All Repos
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Calendar className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="conversations">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <AIRepoDiscovery />
        </TabsContent>

        <TabsContent value="repositories" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {repositories.map((repo, index) => (
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
                  <p className="text-sm font-medium">Available Mentors:</p>
                  <div className="space-y-2">
                    {repo.mentors.map((mentor) => {
                      const requestStatus = mentorshipRequests[mentor.id];
                      const isConnected = requestStatus === "accepted";
                      const isPending = requestStatus === "pending";
                      
                      return (
                        <div key={mentor.id} className="flex items-center justify-between p-2 rounded bg-card/50 neon-border">
                          <div className="flex-1">
                            <span className="text-xs block">{mentor.name}</span>
                            {isPending && (
                              <Badge variant="secondary" className="text-xs mt-1">Pending</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!requestStatus && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConnect(repo, mentor)}
                                className="hover:shadow-neon transition-smooth"
                              >
                                Connect
                              </Button>
                            )}
                            {isConnected && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSchedule(repo, mentor)}
                                  className="hover:shadow-neon transition-smooth"
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Schedule
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => window.location.href = `/chat?user=${mentor.id}`}
                                  className="shadow-neon hover:shadow-glow transition-smooth"
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Chat
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
        </TabsContent>

        <TabsContent value="sessions">
          <StudentSessions studentId={profile.id} />
        </TabsContent>

        <TabsContent value="conversations">
          <StudentConversations studentId={profile.id} />
        </TabsContent>
      </Tabs>

      {schedulerData && (
        <SessionScheduler
          open={showScheduler}
          onOpenChange={setShowScheduler}
          mentorId={schedulerData.mentorId}
          mentorName={schedulerData.mentorName}
          repositoryId={schedulerData.repoId}
          repositoryName={schedulerData.repoName}
          onScheduled={() => {
            setShowScheduler(false);
            toast({
              title: "Session Requested!",
              description: "Your mentor will review and approve your session",
            });
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
