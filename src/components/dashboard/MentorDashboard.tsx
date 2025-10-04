import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, MessageSquare, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
  id: string;
  name: string;
  role: string;
}

interface MentorshipRequest {
  id: string;
  student_id: string;
  repository_id: string;
  status: string;
  message: string | null;
  created_at: string;
  student: {
    name: string;
    email: string;
  };
  repository: {
    name: string;
    description: string | null;
  };
}

const MentorDashboard = ({ profile }: { profile: Profile }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [profile.id]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("mentorship_requests")
        .select(`
          *,
          student:profiles!student_id (name, email),
          repository:repositories (name, description)
        `)
        .eq("mentor_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to load mentorship requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: action === "accepted" ? "Request Accepted" : "Request Rejected",
        description: `You have ${action} the mentorship request`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const acceptedRequests = requests.filter(r => r.status === "accepted");
  const completedRequests = requests.filter(r => r.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Mentor Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your mentorships and help students grow in open source
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedRequests.length}</div>
            <p className="text-xs text-muted-foreground">Students you're mentoring</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(requests.map(r => r.repository_id)).size}</div>
            <p className="text-xs text-muted-foreground">Repositories you mentor</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests.length}</div>
            <p className="text-xs text-muted-foreground">Successful mentorships</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({acceptedRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : pendingRequests.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id} className="shadow-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.repository.name}</CardTitle>
                      <CardDescription>
                        From: {request.student.name} ({request.student.email})
                      </CardDescription>
                    </div>
                    <Badge>Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.message && (
                    <p className="text-sm text-muted-foreground">{request.message}</p>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleRequestAction(request.id, "accepted")}
                      className="flex-1"
                    >
                      Accept
                    </Button>
                    <Button 
                      onClick={() => handleRequestAction(request.id, "rejected")}
                      variant="outline"
                      className="flex-1"
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {acceptedRequests.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No active mentorships</p>
              </CardContent>
            </Card>
          ) : (
            acceptedRequests.map((request) => (
              <Card key={request.id} className="shadow-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.repository.name}</CardTitle>
                      <CardDescription>
                        Student: {request.student.name}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/chat?user=${request.student_id}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Chat
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequests.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No completed mentorships</p>
              </CardContent>
            </Card>
          ) : (
            completedRequests.map((request) => (
              <Card key={request.id} className="shadow-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.repository.name}</CardTitle>
                      <CardDescription>
                        Student: {request.student.name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Set up your mentor profile to start helping students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Next Steps:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Complete your profile with expertise and skills</li>
              <li>Select repositories you want to mentor for</li>
              <li>Set your availability preferences</li>
              <li>Start accepting mentorship requests</li>
            </ul>
          </div>
          <Button onClick={() => window.location.href = '/mentor-setup'} className="w-full">
            Set Up Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MentorDashboard;
