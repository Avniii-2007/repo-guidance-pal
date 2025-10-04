import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
  mentor: {
    name: string;
    profile_pic: string | null;
  };
  repository: {
    name: string;
  };
}

const StudentFeedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndFetchFeedback();
  }, []);

  const checkUserAndFetchFeedback = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setStudentId(session.user.id);
      await fetchFeedback(session.user.id);
    } catch (error: unknown) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    }
  };

  const fetchFeedback = async (userId: string) => {
    try {
      // Fetch mentorship feedback
      const { data: mentorshipData, error: mentorshipError } = await supabase
        .from("mentorship_feedback")
        .select(`
          id,
          rating,
          feedback_text,
          created_at,
          mentor:mentor_id (
            name,
            profile_pic
          ),
          mentorship_request:mentorship_request_id (
            repository:repository_id (
              name
            )
          )
        `)
        .eq("student_id", userId)
        .order("created_at", { ascending: false });

      if (mentorshipError) throw mentorshipError;

      // Fetch session feedback
      const { data: sessionData, error: sessionError } = await supabase
        .from("session_feedback")
        .select(`
          id,
          rating,
          feedback_text,
          created_at,
          mentor:mentor_id (
            name,
            profile_pic
          ),
          session:session_id (
            repository:repository_id (
              name
            )
          )
        `)
        .eq("student_id", userId)
        .order("created_at", { ascending: false });

      if (sessionError) throw sessionError;

      // Combine and format both types of feedback
      const formattedMentorshipFeedback = mentorshipData.map((item: { id: string; rating: number; feedback_text: string | null; created_at: string; mentorship_requests: { repositories: { name: string } } }) => ({
        id: item.id,
        rating: item.rating,
        feedback_text: item.feedback_text,
        created_at: item.created_at,
        mentor: {
          name: item.mentor?.name || "Unknown Mentor",
          profile_pic: item.mentor?.profile_pic || null,
        },
        repository: {
          name: item.mentorship_request?.repository?.name || "Unknown Project",
        },
      }));

      const formattedSessionFeedback = sessionData.map((item: { id: string; rating: number; feedback_text: string | null; created_at: string; sessions: { repositories: { name: string } } }) => ({
        id: item.id,
        rating: item.rating,
        feedback_text: item.feedback_text,
        created_at: item.created_at,
        mentor: {
          name: item.mentor?.name || "Unknown Mentor",
          profile_pic: item.mentor?.profile_pic || null,
        },
        repository: {
          name: item.session?.repository?.name || "Unknown Project",
        },
      }));

      // Combine and sort all feedback by date
      const allFeedback = [...formattedMentorshipFeedback, ...formattedSessionFeedback]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFeedback(allFeedback);
    } catch (error: unknown) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load your feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <header className="neon-border glass-effect backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-glow-pulse">
            MentorMatch
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="neon-border">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-0 gradient-glow opacity-50 blur-3xl"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-glow-pulse">
                Your Feedback
              </h2>
              <p className="text-muted-foreground">
                View all the feedback you've given to your mentors
              </p>
            </div>
          </div>

          <Card className="neon-border glass-effect">
            <CardHeader>
              <CardTitle>Feedback History</CardTitle>
              <CardDescription>
                {feedback.length > 0
                  ? `You've provided ${feedback.length} feedback ${feedback.length === 1 ? 'review' : 'reviews'}`
                  : "You haven't given any feedback yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Complete mentorship sessions to leave feedback for your mentors.
                </p>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="border rounded-lg p-4 space-y-3 neon-border glass-effect animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={item.mentor.profile_pic || ""} />
                          <AvatarFallback>
                            {item.mentor.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.mentor.name}</p>
                              <p className="text-xs text-muted-foreground">{item.repository.name}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= item.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {item.feedback_text && (
                        <p className="text-sm text-muted-foreground pl-[52px]">
                          {item.feedback_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentFeedback;
