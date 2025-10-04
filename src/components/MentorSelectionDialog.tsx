import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
                    <h3 className="font-semibold">{mentor.name}</h3>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MentorSelectionDialog;
