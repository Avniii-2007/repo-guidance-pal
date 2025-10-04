import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MentorDetailsDialog from "./MentorDetailsDialog";

interface Mentor {
  id: string;
  name: string;
  profile_pic: string | null;
  bio?: string | null;
  skills?: string[] | null;
}

interface MentorSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentors: Mentor[];
  repositoryName: string;
  onSelectMentor: (mentorId: string) => void;
}

const MentorSelectionDialog = ({
  open,
  onOpenChange,
  mentors,
  repositoryName,
  onSelectMentor,
}: MentorSelectionDialogProps) => {
  const [mentorBadges, setMentorBadges] = useState<Record<string, string>>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  useEffect(() => {
    if (open && mentors.length > 0) {
      fetchMentorBadges();
    }
  }, [open, mentors]);

  const fetchMentorBadges = async () => {
    const badges: Record<string, string> = {};
    for (const mentor of mentors) {
      try {
        const { data } = await supabase
          .rpc("get_mentor_badge", { mentor_id: mentor.id });
        if (data) badges[mentor.id] = data;
      } catch (error) {
        console.error("Error fetching badge:", error);
      }
    }
    setMentorBadges(badges);
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select a Mentor</DialogTitle>
          <DialogDescription>
            Choose a mentor for {repositoryName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="shadow-card hover:shadow-elegant transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mentor.profile_pic || undefined} />
                    <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{mentor.name}</h3>
                      {mentorBadges[mentor.id] && (
                        <Badge className={`${getBadgeColor(mentorBadges[mentor.id])} border text-xs`}>
                          {getBadgeIcon(mentorBadges[mentor.id])} {mentorBadges[mentor.id]}
                        </Badge>
                      )}
                    </div>
                    {mentor.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio}</p>
                    )}
                    {mentor.skills && mentor.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {mentor.skills.slice(0, 5).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMentorId(mentor.id);
                          setDetailsOpen(true);
                        }}
                        className="neon-border"
                      >
                        <Info className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelectMentor(mentor.id);
                          onOpenChange(false);
                        }}
                      >
                        Request Mentorship
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>

      {selectedMentorId && (
        <MentorDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          mentorId={selectedMentorId}
        />
      )}
    </Dialog>
  );
};

export default MentorSelectionDialog;
