-- RLS for answer_votes
ALTER TABLE public.answer_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answer votes"
  ON public.answer_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can vote on answers"
  ON public.answer_votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own answer votes"
  ON public.answer_votes FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- RLS for follow_up_questions
ALTER TABLE public.follow_up_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follow-up questions"
  ON public.follow_up_questions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create follow-up questions"
  ON public.follow_up_questions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own follow-up questions"
  ON public.follow_up_questions FOR DELETE
  USING (auth.uid() = author_id OR session_id IS NOT NULL);
