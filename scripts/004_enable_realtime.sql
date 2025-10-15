-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.amas;
