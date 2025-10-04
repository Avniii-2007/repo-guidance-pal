-- Create mentorship_feedback table
CREATE TABLE public.mentorship_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_request_id UUID NOT NULL REFERENCES public.mentorship_requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentorship_feedback ENABLE ROW LEVEL SECURITY;

-- Students can create feedback for their mentorships
CREATE POLICY "Students can create mentorship feedback"
ON public.mentorship_feedback
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Users can view feedback they're involved in
CREATE POLICY "Users can view mentorship feedback they're involved in"
ON public.mentorship_feedback
FOR SELECT
USING (auth.uid() = student_id OR auth.uid() = mentor_id);