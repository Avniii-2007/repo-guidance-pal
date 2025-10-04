import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Feedback {
  id: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
  student: {
    name: string;
    profile_pic: string | null;
  };
}

interface MentorFeedbackProps {
  mentorId: string;
}

const MentorFeedback = ({ mentorId }: MentorFeedbackProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchFeedback();
  }, [mentorId]);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("mentorship_feedback")
        .select(`
          id,
          rating,
          feedback_text,
          created_at,
          student:student_id (
            name,
            profile_pic
          )
        `)
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
        id: item.id,
        rating: item.rating,
        feedback_text: item.feedback_text,
        created_at: item.created_at,
        student: {
          name: item.student?.name || "Unknown Student",
          profile_pic: item.student?.profile_pic || null,
        },
      }));

      setFeedback(formattedData);

      // Calculate average rating
      if (formattedData.length > 0) {
        const avg = formattedData.reduce((sum, f) => sum + f.rating, 0) / formattedData.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error: any) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Feedback</CardTitle>
          <CardDescription>Loading feedback...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Feedback</CardTitle>
        <CardDescription>
          {feedback.length > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= averageRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{averageRating}</span>
              <span className="text-sm text-muted-foreground">({feedback.length} reviews)</span>
            </div>
          ) : (
            "No feedback yet"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven't received any feedback from students yet.
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={item.student.profile_pic || ""} />
                    <AvatarFallback>
                      {item.student.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.student.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1">
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
  );
};

export default MentorFeedback;
