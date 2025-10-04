import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, Code, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MentorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
}

interface MentorDetails {
  id: string;
  name: string;
  profile_pic: string | null;
  bio: string | null;
  skills: string[] | null;
  years_experience: number | null;
  past_contributions: string[] | null;
  created_at: string;
}

const MentorDetailsDialog = ({
  open,
  onOpenChange,
  mentorId,
}: MentorDetailsDialogProps) => {
  const [mentor, setMentor] = useState<MentorDetails | null>(null);
  const [badge, setBadge] = useState<string>("");
  const [studentCount, setStudentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && mentorId) {
      fetchMentorDetails();
    }
  }, [open, mentorId]);

  const fetchMentorDetails = async () => {
    try {
      // Fetch mentor profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", mentorId)
        .single();

      if (profileError) throw profileError;
      setMentor(profileData);

      // Fetch mentor badge
      const { data: badgeData, error: badgeError } = await supabase
        .rpc("get_mentor_badge", { mentor_id: mentorId });

      if (badgeError) throw badgeError;
      setBadge(badgeData);

      // Fetch student count
      const { data: countData, error: countError } = await supabase
        .rpc("get_mentor_student_count", { mentor_id: mentorId });

      if (countError) throw countError;
      setStudentCount(countData);
    } catch (error) {
      console.error("Error fetching mentor details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Advanced King":
        return "bg-gradient-primary text-white border-primary";
      case "Intermediate":
        return "bg-blue-500/20 text-blue-400 border-blue-400/50";
      case "Starter":
        return "bg-green-500/20 text-green-400 border-green-400/50";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "Advanced King":
        return "👑";
      case "Intermediate":
        return "⭐";
      case "Starter":
        return "🌱";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading mentor details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!mentor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mentor Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={mentor.profile_pic || undefined} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {mentor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-bold">{mentor.name}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge className={`${getBadgeColor(badge)} border`}>
                  {getBadgeIcon(badge)} {badge}
                </Badge>
                {mentor.years_experience && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {mentor.years_experience} years experience
                  </Badge>
                )}
              </div>
              {mentor.bio && (
                <p className="text-muted-foreground">{mentor.bio}</p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="neon-border bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Students Mentored</p>
                    <p className="text-2xl font-bold">{studentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="neon-border bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Achievement Level</p>
                    <p className="text-lg font-bold">{badge}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills */}
          {mentor.skills && mentor.skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Skills & Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {mentor.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Past Contributions */}
          {mentor.past_contributions && mentor.past_contributions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Past Contributions
              </h3>
              <div className="space-y-1">
                {mentor.past_contributions.map((contribution, idx) => (
                  <div key={idx} className="p-2 rounded bg-muted/50 text-sm">
                    {contribution}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MentorDetailsDialog;
