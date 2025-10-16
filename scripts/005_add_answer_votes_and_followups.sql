-- Create answer_votes table for voting on answers
CREATE TABLE IF NOT EXISTS public.answer_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(answer_id, user_id),
  UNIQUE(answer_id, session_id)
);

-- Create follow_up_questions table
CREATE TABLE IF NOT EXISTS public.follow_up_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add banner_url column to amas table
ALTER TABLE public.amas ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_answer_votes_answer_id ON public.answer_votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_questions_question_id ON public.follow_up_questions(question_id);

-- Update answers view to include vote count
CREATE OR REPLACE VIEW public.answers_with_votes AS
SELECT 
  a.*,
  COUNT(av.id) as vote_count
FROM public.answers a
LEFT JOIN public.answer_votes av ON a.id = av.answer_id
GROUP BY a.id;
