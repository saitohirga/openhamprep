-- Create exam_sessions table
CREATE TABLE public.exam_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  exam_date DATE NOT NULL,
  sponsor TEXT,
  exam_time TEXT,
  walk_ins_allowed BOOLEAN DEFAULT false,
  public_contact TEXT,
  phone TEXT,
  email TEXT,
  vec TEXT,
  location_name TEXT,
  address TEXT,
  address_2 TEXT,
  address_3 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_target_exam table for storing user's target test date
CREATE TABLE public.user_target_exam (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  study_intensity TEXT NOT NULL DEFAULT 'moderate' CHECK (study_intensity IN ('light', 'moderate', 'intensive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_target_exam ENABLE ROW LEVEL SECURITY;

-- Exam sessions are publicly readable (anyone can search for test locations)
CREATE POLICY "Exam sessions are publicly readable"
ON public.exam_sessions
FOR SELECT
USING (true);

-- Only admins can insert/update/delete exam sessions
CREATE POLICY "Admins can manage exam sessions"
ON public.exam_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can view their own target exam
CREATE POLICY "Users can view their own target exam"
ON public.user_target_exam
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own target exam
CREATE POLICY "Users can insert their own target exam"
ON public.user_target_exam
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own target exam
CREATE POLICY "Users can update their own target exam"
ON public.user_target_exam
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own target exam
CREATE POLICY "Users can delete their own target exam"
ON public.user_target_exam
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX idx_exam_sessions_date ON public.exam_sessions(exam_date);
CREATE INDEX idx_exam_sessions_zip ON public.exam_sessions(zip);
CREATE INDEX idx_exam_sessions_state ON public.exam_sessions(state);
CREATE INDEX idx_user_target_exam_user_id ON public.user_target_exam(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_exam_sessions_updated_at
BEFORE UPDATE ON public.exam_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_target_exam_updated_at
BEFORE UPDATE ON public.user_target_exam
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();