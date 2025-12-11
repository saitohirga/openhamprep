-- Create an enum for roles (if not exists)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row-Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles (avoids recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: Users can view their own roles
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_roles'
        AND policyname = 'Users can view their own roles'
    ) THEN
        CREATE POLICY "Users can view their own roles"
        ON public.user_roles
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS policy: Only admins can manage roles (but we'll do this directly in DB)
-- No INSERT/UPDATE/DELETE policies - roles managed directly in database only

-- Add admin policies for glossary_terms table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'glossary_terms' AND policyname = 'Admins can insert glossary terms') THEN
        CREATE POLICY "Admins can insert glossary terms"
        ON public.glossary_terms FOR INSERT
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'glossary_terms' AND policyname = 'Admins can update glossary terms') THEN
        CREATE POLICY "Admins can update glossary terms"
        ON public.glossary_terms FOR UPDATE
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'glossary_terms' AND policyname = 'Admins can delete glossary terms') THEN
        CREATE POLICY "Admins can delete glossary terms"
        ON public.glossary_terms FOR DELETE
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Add admin policies for questions table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'Admins can insert questions') THEN
        CREATE POLICY "Admins can insert questions"
        ON public.questions FOR INSERT
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'Admins can update questions') THEN
        CREATE POLICY "Admins can update questions"
        ON public.questions FOR UPDATE
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'Admins can delete questions') THEN
        CREATE POLICY "Admins can delete questions"
        ON public.questions FOR DELETE
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;