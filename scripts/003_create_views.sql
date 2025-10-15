-- Create a view for questions with vote counts
CREATE OR REPLACE VIEW public.questions_with_votes AS
SELECT 
  q.*,
  COUNT(v.id) as vote_count,
  EXISTS(SELECT 1 FROM public.answers WHERE answers.question_id = q.id) as has_answer
FROM public.questions q
LEFT JOIN public.votes v ON v.question_id = q.id
GROUP BY q.id;

-- Grant access to the view
GRANT SELECT ON public.questions_with_votes TO authenticated, anon;
