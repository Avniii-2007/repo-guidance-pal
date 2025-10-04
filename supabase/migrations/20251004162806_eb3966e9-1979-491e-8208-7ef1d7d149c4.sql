-- Create session_feedback table
CREATE TABLE public.session_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_feedback
CREATE POLICY "Students can create feedback for their sessions"
ON public.session_feedback
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can view feedback they're involved in"
ON public.session_feedback
FOR SELECT
USING (auth.uid() = student_id OR auth.uid() = mentor_id);

-- Add experience and contributions to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS past_contributions TEXT[];

-- Create function to get mentor badge
CREATE OR REPLACE FUNCTION public.get_mentor_badge(mentor_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT student_id)
  INTO student_count
  FROM sessions
  WHERE sessions.mentor_id = get_mentor_badge.mentor_id
    AND status = 'completed';
  
  IF student_count >= 20 THEN
    RETURN 'Advanced King';
  ELSIF student_count >= 5 THEN
    RETURN 'Intermediate';
  ELSE
    RETURN 'Starter';
  END IF;
END;
$$;

-- Create function to get mentor student count
CREATE OR REPLACE FUNCTION public.get_mentor_student_count(mentor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT student_id)
  INTO student_count
  FROM sessions
  WHERE sessions.mentor_id = get_mentor_student_count.mentor_id
    AND status = 'completed';
  
  RETURN COALESCE(student_count, 0);
END;
$$;

-- Update session trigger for updated_at
CREATE TRIGGER update_session_feedback_updated_at
BEFORE UPDATE ON public.session_feedback
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();