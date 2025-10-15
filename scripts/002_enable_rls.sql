-- Enable Row Level Security on all tables
ALTER TABLE public.amas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- AMAs policies
-- Anyone can view active AMAs
CREATE POLICY "amas_select_all" ON public.amas
  FOR SELECT USING (true);

-- Only authenticated users can create AMAs
CREATE POLICY "amas_insert_own" ON public.amas
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their AMAs
CREATE POLICY "amas_update_own" ON public.amas
  FOR UPDATE USING (auth.uid() = owner_id);

-- Only owners can delete their AMAs
CREATE POLICY "amas_delete_own" ON public.amas
  FOR DELETE USING (auth.uid() = owner_id);

-- Questions policies
-- Anyone can view questions
CREATE POLICY "questions_select_all" ON public.questions
  FOR SELECT USING (true);

-- Anyone can insert questions (anonymous or authenticated)
CREATE POLICY "questions_insert_all" ON public.questions
  FOR INSERT WITH CHECK (true);

-- Only AMA owners can update questions (to mark as answered)
CREATE POLICY "questions_update_owner" ON public.questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.amas
      WHERE amas.id = questions.ama_id
      AND amas.owner_id = auth.uid()
    )
  );

-- Only AMA owners can delete questions
CREATE POLICY "questions_delete_owner" ON public.questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.amas
      WHERE amas.id = questions.ama_id
      AND amas.owner_id = auth.uid()
    )
  );

-- Answers policies
-- Anyone can view answers
CREATE POLICY "answers_select_all" ON public.answers
  FOR SELECT USING (true);

-- Only AMA owners can insert answers
CREATE POLICY "answers_insert_owner" ON public.answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions
      JOIN public.amas ON amas.id = questions.ama_id
      WHERE questions.id = answers.question_id
      AND amas.owner_id = auth.uid()
    )
  );

-- Only AMA owners can update answers
CREATE POLICY "answers_update_owner" ON public.answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.questions
      JOIN public.amas ON amas.id = questions.ama_id
      WHERE questions.id = answers.question_id
      AND amas.owner_id = auth.uid()
    )
  );

-- Only AMA owners can delete answers
CREATE POLICY "answers_delete_owner" ON public.answers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.questions
      JOIN public.amas ON amas.id = questions.ama_id
      WHERE questions.id = answers.question_id
      AND amas.owner_id = auth.uid()
    )
  );

-- Votes policies
-- Anyone can view votes
CREATE POLICY "votes_select_all" ON public.votes
  FOR SELECT USING (true);

-- Anyone can insert votes (anonymous or authenticated)
CREATE POLICY "votes_insert_all" ON public.votes
  FOR INSERT WITH CHECK (true);

-- Users can delete their own votes (for unvoting)
CREATE POLICY "votes_delete_own" ON public.votes
  FOR DELETE USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  );
