import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MentorshipFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorshipRequestId: string;
  studentId: string;
  mentorId: string;
  mentorName: string;
  onFeedbackSubmitted: () => void;
}

const MentorshipFeedbackDialog = ({
  open,
  onOpenChange,
  mentorshipRequestId,
  studentId,
  mentorId,
  mentorName,
  onFeedbackSubmitted,
}: MentorshipFeedbackDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log("Submit feedback clicked", { mentorshipRequestId, studentId, mentorId, rating });
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      console.log("Inserting feedback...");
      // Insert feedback
      const { error: feedbackError } = await supabase
        .from("mentorship_feedback")
        .insert({
          mentorship_request_id: mentorshipRequestId,
          student_id: studentId,
          mentor_id: mentorId,
          rating,
          feedback_text: feedback || null,
        });

      if (feedbackError) {
        console.error("Feedback insert error:", feedbackError);
        throw feedbackError;
      }
      
      console.log("Feedback inserted successfully");

      console.log("Updating mentorship status to completed...");
      // Update mentorship request status to completed
      const { error: statusError } = await supabase
        .from("mentorship_requests")
        .update({ status: "completed" })
        .eq("id", mentorshipRequestId);

      if (statusError) {
        console.error("Status update error:", statusError);
        throw statusError;
      }
      
      console.log("Mentorship status updated successfully");

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. You have been disconnected from this mentor.",
      });

      onFeedbackSubmitted();
      onOpenChange(false);
      setRating(0);
      setFeedback("");
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mentorship Feedback</DialogTitle>
          <DialogDescription>
            How was your experience with {mentorName}?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-smooth hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Feedback (Optional)
            </label>
            <Textarea
              placeholder="Share your experience with this mentor..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full shadow-neon hover:shadow-glow transition-smooth"
          >
            {submitting ? "Submitting..." : "Submit & Disconnect"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MentorshipFeedbackDialog;
