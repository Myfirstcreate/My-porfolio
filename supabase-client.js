// Shared Supabase connection for all AK Garage pages.
// All team members load this same project, so everyone sees the same live data.
//
// Roles: viewers (team password) can only READ. Writes require the admin token,
// which is attached to every request below; the database itself rejects writes
// that do not carry a valid token (see supabase-migrations.sql, section 3).
//
// IMPORTANT: this file loads in <head>, BEFORE auth-gate.js runs in <body>, so
// the token must be read from localStorage directly — reading
// window.akgarageAdminToken here would always be undefined.
const SUPABASE_URL = 'https://wmofflwywrivbkuqyfif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtb2ZmbHd5d3JpdmJrdXF5ZmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDYxNTAsImV4cCI6MjEwNDI4MjE1MH0.KXwtltwwpdKztbZgAkNncG2u9VEzCwoN--tk0nrm51M';

let akgarageAdminToken = window.akgarageAdminToken || '';
try { akgarageAdminToken = localStorage.getItem('akgarage_admin_token') || akgarageAdminToken; } catch (error) {}

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	global: {
		headers: akgarageAdminToken
			? { 'x-ak-admin-token': akgarageAdminToken }
			: {}
	}
});
