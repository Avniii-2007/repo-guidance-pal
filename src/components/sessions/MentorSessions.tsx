import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  status: string;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  profiles: {
    name: string;
  };
  repositories: {
    name: string;
  };
}

const MentorSessions = ({ mentorId }: { mentorId: string }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel("mentor-sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `mentor_id=eq.${mentorId}`,
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mentorId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          profiles!sessions_student_id_fkey (name),
          repositories (name)
        `)
        .eq("mentor_id", mentorId)
        .order("scheduled_at", { ascending: true });

      if (error) {
        console.error("Error fetching sessions:", error);
        throw error;
      }
      
      console.log("Fetched sessions for mentor:", data);
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

  const handleApprove = async (sessionId: string, scheduledAt: string, durationMinutes: number) => {
    try {
      const { error } = await supabase.functions.invoke("create-google-meet", {
        body: {
          sessionId,
          topic: "Mentorship Session",
          duration: durationMinutes,
          startTime: scheduledAt,
        },
      });

      if (error) throw error;

      toast({
        title: "Session Approved!",
        description: "Google Meet created successfully",
      });

      fetchSessions();
    } catch (error: any) {
      console.error("Error approving session:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "rejected" })
        .eq("id", sessionId);

      if (error) throw error;

      toast({
        title: "Session Rejected",
        description: "The session request has been rejected",
      });

      fetchSessions();
    } catch (error: any) {
      console.error("Error rejecting session:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const pendingSessions = sessions.filter((s) => s.status === "pending");
  const upcomingSessions = sessions.filter((s) => s.status === "approved");

  return (
    <div className="space-y-6">
      {pendingSessions.length > 0 && (
        <Card className="neon-border glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pending Session Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg neon-border bg-card/50 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{session.profiles.name}</p>
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
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(session.id, session.scheduled_at, session.duration_minutes)}
                    className="shadow-neon hover:shadow-glow transition-smooth"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Create Meeting
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(session.id)}
                    className="neon-border"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {upcomingSessions.length > 0 && (
        <Card className="neon-border glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg neon-border bg-card/50 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{session.profiles.name}</p>
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
                  </div>
                  <Badge>Approved</Badge>
                </div>
                {session.zoom_start_url && (
                  <Button
                    size="sm"
                    onClick={() => window.open(session.zoom_start_url!, "_blank")}
                    className="shadow-neon hover:shadow-glow transition-smooth"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Meeting
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No sessions yet</p>
        </div>
      )}
    </div>
  );
};

export default MentorSessions;