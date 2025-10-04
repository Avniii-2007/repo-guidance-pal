import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import SessionFeedbackDialog from "./SessionFeedbackDialog";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  status: string;
  zoom_join_url: string | null;
  mentor_id: string;
  profiles: {
    name: string;
  };
  repositories: {
    name: string;
  };
}

const StudentSessions = ({ studentId }: { studentId: string }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel("student-sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          profiles!sessions_mentor_id_fkey (name),
          repositories (name)
        `)
        .eq("student_id", studentId)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="neon-border glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          My Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="p-4 rounded-lg neon-border bg-card/50 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  Session with {session.profiles.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.repositories.name}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(session.scheduled_at), "MMM dd, yyyy")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(session.scheduled_at), "HH:mm")} ({session.duration_minutes} min)
                  </div>
                </div>
                {session.notes && (
                  <p className="text-sm mt-2 p-2 rounded bg-muted/50">
                    {session.notes}
                  </p>
                )}
              </div>
              <Badge variant={getStatusColor(session.status)}>
                {session.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              {session.status === "approved" && session.zoom_join_url && (
                <>
                  <Button
                    size="sm"
                    onClick={() => window.open(session.zoom_join_url!, "_blank")}
                    className="shadow-neon hover:shadow-glow transition-smooth"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSession(session);
                      setFeedbackDialogOpen(true);
                    }}
                    className="neon-border"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete & Review
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No sessions scheduled yet</p>
          </div>
        )}
      </CardContent>

      {selectedSession && (
        <SessionFeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          sessionId={selectedSession.id}
          studentId={studentId}
          mentorId={selectedSession.mentor_id}
          mentorName={selectedSession.profiles.name}
          onFeedbackSubmitted={fetchSessions}
        />
      )}
    </Card>
  );
};

export default StudentSessions;