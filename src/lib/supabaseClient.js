import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bsvbxevkmqltxhicrjem.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdmJ4ZXZrbXFsdHhoaWNyamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzk0OTUsImV4cCI6MjA4Mjk1NTQ5NX0.pHO_Difnub7KD5VmTIqNxTvLIf15xFLZm1rxsAk_Os4';

export const supabase = createClient(supabaseUrl, supabaseKey);
