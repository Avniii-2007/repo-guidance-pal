import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

interface SessionSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  mentorName: string;
  repositoryId: string;
  repositoryName: string;
  onScheduled?: () => void;
}

const SessionScheduler = ({
  open,
  onOpenChange,
  mentorId,
  mentorName,
  repositoryId,
  repositoryName,
  onScheduled,
}: SessionSchedulerProps) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!date) {
      toast({
        title: "Date Required",
        description: "Please select a date for the session",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Combine date and time
      const [hours, minutes] = time.split(":");
      const scheduledDate = new Date(date);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase
        .from("sessions")
        .insert({
          student_id: session.user.id,
          mentor_id: mentorId,
          repository_id: repositoryId,
          scheduled_at: scheduledDate.toISOString(),
          duration_minutes: parseInt(duration),
          notes,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Session Requested!",
        description: `Your session request with ${mentorName} for ${repositoryName} has been sent.`,
      });

      onOpenChange(false);
      onScheduled?.();
      
      // Reset form
      setDate(undefined);
      setTime("10:00");
      setDuration("60");
      setNotes("");
    } catch (error: any) {
      console.error("Error scheduling session:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neon-border glass-effect max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Schedule Session
          </DialogTitle>
          <DialogDescription>
            Request a mentorship session with {mentorName} for {repositoryName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select Date
            </Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border neon-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="neon-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                      {`${hour.toString().padStart(2, "0")}:00`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="neon-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any specific topics you'd like to discuss..."
              className="neon-border min-h-[100px]"
            />
          </div>

          {date && (
            <div className="p-4 rounded-lg bg-primary/10 neon-border">
              <p className="text-sm font-medium">
                Proposed Session: {format(date, "MMMM dd, yyyy")} at {time} ({duration} minutes)
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="neon-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading || !date}
            className="shadow-neon hover:shadow-glow transition-smooth"
          >
            {loading ? "Requesting..." : "Request Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionScheduler;