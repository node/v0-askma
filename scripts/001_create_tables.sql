-- Create AMAs table
CREATE TABLE IF NOT EXISTS public.amas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  allow_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ama_id UUID NOT NULL REFERENCES public.amas(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, user_id),
  UNIQUE(question_id, session_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_ama_id ON public.questions(ama_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_question_id ON public.votes(question_id);
CREATE INDEX IF NOT EXISTS idx_amas_owner_id ON public.amas(owner_id);
CREATE INDEX IF NOT EXISTS idx_amas_slug ON public.amas(slug);

-- Add updated_at trigger for amas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_amas_updated_at
  BEFORE UPDATE ON public.amas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
