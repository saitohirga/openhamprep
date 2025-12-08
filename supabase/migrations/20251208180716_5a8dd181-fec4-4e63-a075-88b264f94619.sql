-- Add explanation column to questions table
ALTER TABLE public.questions 
ADD COLUMN explanation text;