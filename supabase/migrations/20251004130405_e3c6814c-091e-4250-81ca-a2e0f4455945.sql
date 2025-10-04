-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'mentor');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL,
  bio TEXT,
  profile_pic TEXT,
  skills TEXT[], -- For mentors
  interests TEXT[], -- For students
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create repositories table
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  github_url TEXT,
  stars INTEGER DEFAULT 0,
  language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create mentor_repositories junction table
CREATE TABLE mentor_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mentor_id, repository_id)
);

-- Create mentorship_requests table
CREATE TABLE mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table for chat
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for repositories
CREATE POLICY "Anyone can view repositories"
  ON repositories FOR SELECT
  USING (true);

-- RLS Policies for mentor_repositories
CREATE POLICY "Anyone can view mentor-repository assignments"
  ON mentor_repositories FOR SELECT
  USING (true);

CREATE POLICY "Mentors can manage their repositories"
  ON mentor_repositories FOR ALL
  USING (auth.uid() = mentor_id);

-- RLS Policies for mentorship_requests
CREATE POLICY "Users can view their own requests"
  ON mentorship_requests FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = mentor_id);

CREATE POLICY "Students can create requests"
  ON mentorship_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Mentors can update requests"
  ON mentorship_requests FOR UPDATE
  USING (auth.uid() = mentor_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create trigger for profile updates
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_mentorship_requests_updated_at
  BEFORE UPDATE ON mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert sample repositories
INSERT INTO repositories (name, description, github_url, stars, language) VALUES
  ('React', 'A JavaScript library for building user interfaces', 'https://github.com/facebook/react', 220000, 'JavaScript'),
  ('Vue.js', 'Progressive JavaScript Framework', 'https://github.com/vuejs/vue', 207000, 'JavaScript'),
  ('Angular', 'One framework. Mobile & desktop.', 'https://github.com/angular/angular', 95000, 'TypeScript'),
  ('Next.js', 'The React Framework for Production', 'https://github.com/vercel/next.js', 120000, 'JavaScript'),
  ('Django', 'The Web framework for perfectionists with deadlines', 'https://github.com/django/django', 76000, 'Python'),
  ('Flask', 'A micro web framework written in Python', 'https://github.com/pallets/flask', 66000, 'Python'),
  ('TensorFlow', 'An Open Source Machine Learning Framework', 'https://github.com/tensorflow/tensorflow', 183000, 'Python'),
  ('PyTorch', 'Tensors and Dynamic neural networks in Python', 'https://github.com/pytorch/pytorch', 78000, 'Python'),
  ('Kubernetes', 'Production-Grade Container Orchestration', 'https://github.com/kubernetes/kubernetes', 107000, 'Go'),
  ('Docker', 'Build, Ship, and Run Any App, Anywhere', 'https://github.com/docker/docker-ce', 68000, 'Go');