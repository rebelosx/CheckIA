// js/supabaseClient.js

const SUPABASE_URL = 'https://tbrasnqvnghpyqpaktul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicmFzbnF2bmdocHlxcGFrdHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzAzODYsImV4cCI6MjEwNTg0NjM4Nn0.bx-q6DLickm3Fsnl3qwjkmSoogukY_FHXtBfGFIheVk';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);