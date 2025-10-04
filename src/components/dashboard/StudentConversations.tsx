import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Sparkles, UserX, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MentorDetailsDialog from "@/components/MentorDetailsDialog";
import MentorshipFeedbackDialog from "@/components/mentorship/MentorshipFeedbackDialog";

interface MentorshipRequest {
  id: string;
  mentor_id: string;
  repository_id: string;
  status: string;
  created_at: string;
  mentor: {
    id: string;
    name: string;
    profile_pic: string | null;
    role: string;
  };
  repository: {
    name: string;
  };
}

interface StudentConversationsProps {
  studentId: string;
}

const StudentConversations = ({ studentId }: StudentConversationsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState<MentorshipRequest | null>(null);
  const [mentorDetailsOpen, setMentorDetailsOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [studentId]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("mentorship_requests")
        .select(`
          *,
          mentor:profiles!mentor_id (
            id,
            name,
            profile_pic,
            role
          ),
          repository:repositories (
            name
          )
        `)
        .eq("student_id", studentId)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = (mentorship: MentorshipRequest) => {
    console.log("Disconnect clicked for mentorship:", mentorship);
    setSelectedMentorship(mentorship);
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmitted = () => {
    fetchConversations();
    setSelectedMentorship(null);
  };

  if (loading) {
    return (
      <Card className="neon-border glass-effect">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading conversations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neon-border glass-effect animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-glow-pulse" />
          <CardTitle>Your Mentors</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No active mentorships yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start by finding a mentor for a project you're interested in
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-center gap-4 p-4 rounded-lg glass-effect hover:bg-primary/10 transition-smooth group"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/50 group-hover:border-primary transition-smooth">
                <AvatarImage src={conversation.mentor.profile_pic || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {conversation.mentor.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-smooth">
                  {conversation.mentor.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {conversation.repository.name}
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                Active
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedMentorId(conversation.mentor_id);
                    setMentorDetailsOpen(true);
                  }}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate(`/chat?user=${conversation.mentor_id}`)}
                  className="shadow-neon hover:shadow-glow transition-smooth"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDisconnect(conversation)}
                  className="neon-border text-destructive hover:bg-destructive/10"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {selectedMentorship && (
        <MentorshipFeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          mentorshipRequestId={selectedMentorship.id}
          studentId={studentId}
          mentorId={selectedMentorship.mentor_id}
          mentorName={selectedMentorship.mentor.name}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}

      {selectedMentorId && (
        <MentorDetailsDialog
          open={mentorDetailsOpen}
          onOpenChange={setMentorDetailsOpen}
          mentorId={selectedMentorId}
        />
      )}
    </Card>
  );
};

export default StudentConversations;
