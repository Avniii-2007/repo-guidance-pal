-- Update RLS policies for repositories table to allow admins to manage repositories
CREATE POLICY "Admins can insert repositories"
ON public.repositories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'mentor'
  )
);

CREATE POLICY "Admins can update repositories"
ON public.repositories
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'mentor'
  )
);

CREATE POLICY "Admins can delete repositories"
ON public.repositories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'mentor'
  )
);