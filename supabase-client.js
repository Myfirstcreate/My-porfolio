// Shared Supabase connection for all AK Garage pages.
// All 5 team members load this same project, so everyone sees the same live data.
const SUPABASE_URL = 'https://wmofflwywrivbkuqyfif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtb2ZmbHd5d3JpdmJrdXF5ZmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDYxNTAsImV4cCI6MjEwNDI4MjE1MH0.KXwtltwwpdKztbZgAkNncG2u9VEzCwoN--tk0nrm51M';
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
