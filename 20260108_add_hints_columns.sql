-- Add columns for Hints Feature
ALTER TABLE daily_games 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS fun_facts text;

-- Add checking for country code length (optional best practice)
ALTER TABLE daily_games 
ADD CONSTRAINT country_code_length CHECK (char_length(country) = 2);
