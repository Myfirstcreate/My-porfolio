// AK Garage login gate — two roles.
//   Viewer password (12345): opens every page, read-only — no add/edit/erase.
//   Admin password:          unlocks adding, editing, and erasing records.
//
// How it is enforced:
//   - The viewer password is checked here in the browser.
//   - Supabase verifies the admin password and issues a random expiring
//     session token (see supabase-migrations.sql, section 3).
//   - The database stores only a hash of that token and checks it on writes.
(function () {
	var AUTH_KEY = 'akgarage_auth'; // 'viewer' | 'admin' (legacy value: '1')
	var TOKEN_KEY = 'akgarage_admin_token';

	window.akgarageViewerPassword = '12345';
	window.akgarageAdminToken = '';
	try { window.akgarageAdminToken = localStorage.getItem(TOKEN_KEY) || ''; } catch (error) {}

	window.akgarageIsAdmin = function () {
		var role = '';
		try { role = localStorage.getItem(AUTH_KEY) || ''; } catch (error) {}
		return role === 'admin' && !!window.akgarageAdminToken;
	};
	window.akgarageIsViewer = function () {
		var role = '';
		try { role = localStorage.getItem(AUTH_KEY) || ''; } catch (error) {}
		return role === 'viewer' || role === '1' || window.akgarageIsAdmin();
	};
	// Pages call this before every write. If the gate script failed to load the
	// fallback is permissive — the database policies are the real guard.
	window.akgarageCanEdit = window.akgarageIsAdmin;

	// Role styling: viewers get write controls hidden and inputs read-only.
	var style = document.createElement('style');
	style.textContent =
		'.ak-viewer .form-card,.ak-viewer .edit,.ak-viewer .erase,.ak-viewer .save-detail,.ak-viewer .save-details{display:none!important}' +
		// The hidden form is easy to miss, so the viewer note becomes an action:
		// it names the reason and offers the login that unlocks the form.
		'.ak-viewer .viewer-note[hidden]{display:none!important}' +
		'.ak-viewer .viewer-note{display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:space-between;border-color:#4a3b1f;color:#ffcf9a;background:rgba(36,26,0,.5)}' +
		'.ak-viewer .viewer-note .ak-login-button{padding:6px 10px;border:1px solid #c4f04e;border-radius:3px;color:#c4f04e;background:transparent;font:9px \'DM Mono\',monospace;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}' +
		'.ak-viewer .viewer-note .ak-login-button:hover{color:#070807;background:#c4f04e}' +
		'.ak-viewer select.status-select{pointer-events:none;border-color:transparent;background:transparent;appearance:none;-webkit-appearance:none}' +
		'.ak-viewer .service-date,.ak-viewer .service-mileage,.ak-viewer .service-mileage-ask,.ak-viewer .maintenance-input{pointer-events:none;background:#0c0f0c;color:#8b9388}' +
		'.ak-role-badge{position:fixed;left:14px;bottom:14px;z-index:99998;display:flex;align-items:center;gap:9px;padding:7px 10px;border:1px solid #292d29;border-radius:4px;background:rgba(7,8,7,.92);color:#8b9388;font:10px \'DM Mono\',monospace;letter-spacing:.06em;text-transform:uppercase}' +
		'.ak-role-badge button{padding:4px 8px;border:1px solid #c4f04e;border-radius:3px;color:#c4f04e;background:transparent;font:9px \'DM Mono\',monospace;cursor:pointer;text-transform:uppercase}' +
		'.ak-role-badge button:hover{color:#070807;background:#c4f04e}';
	document.head.appendChild(style);

	window.akgarageApplyRole = function () {
		var admin = window.akgarageIsAdmin();
		document.documentElement.classList.toggle('ak-admin', admin);
		document.documentElement.classList.toggle('ak-viewer', !admin);
	};

	window.akgarageGateHTML = function () {
		return '' +
			'<div id="auth-gate" style="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#070807;font-family:\'Space Grotesk\',sans-serif;">' +
				'<form id="auth-gate-form" onsubmit="return akgarageHandleSubmit(event)" style="width:min(340px,90%);padding:32px 28px;border:1px solid #292d29;border-radius:8px;background:#101210;text-align:center;">' +
					'<div style="width:44px;height:44px;margin:0 auto 18px;border-radius:50%;background:#c4f04e;display:flex;align-items:center;justify-content:center;color:#070807;font-weight:700;font-size:14px;">AK</div>' +
					'<h2 style="margin:0 0 6px;color:#f0f3ec;font-size:18px;">AK GARAGE</h2>' +
					'<p style="margin:0 0 20px;color:#8b9388;font-size:11px;letter-spacing:.08em;text-transform:uppercase;">Enter password to continue</p>' +
					'<input id="auth-gate-pass" type="password" placeholder="Password" autocomplete="off" style="width:100%;box-sizing:border-box;padding:11px 12px;margin-bottom:12px;border:1px solid #292d29;border-radius:4px;background:#080a08;color:#f0f3ec;font-size:13px;outline:0;">' +
					'<div id="auth-gate-error" style="display:none;margin-bottom:12px;color:#ff7670;font-size:11px;"></div>' +
					'<button type="submit" style="width:100%;padding:11px;border:1px solid #c4f04e;border-radius:4px;background:#c4f04e;color:#070807;font-weight:600;font-size:12px;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;">Enter</button>' +
					'<p style="margin:14px 0 0;color:#697268;font-size:10px;letter-spacing:.05em;text-transform:uppercase;">Team password: view only · Admin password: full access</p>' +
				'</form>' +
			'</div>';
	};

	function openGate() {
		var existing = document.getElementById('auth-gate');
		if (existing) existing.remove();
		var gateWrap = document.createElement('div');
		gateWrap.innerHTML = window.akgarageGateHTML();
		var gate = gateWrap.firstElementChild;
		gate.style.visibility = 'visible';
		document.body.appendChild(gate);
		var input = document.getElementById('auth-gate-pass');
		if (input) input.focus();
	}
	window.akgarageReopenGate = openGate;

	function addRoleBadge() {
		if (document.getElementById('ak-role-badge')) return;
		var badge = document.createElement('div');
		badge.id = 'ak-role-badge';
		badge.className = 'ak-role-badge';
		badge.innerHTML = '<span>View only</span><button type="button">Admin login</button>';
		badge.querySelector('button').addEventListener('click', openGate);
		document.body.appendChild(badge);
	}

	// Viewers see "ask the admin to add…" with no way to act on it. Reword the
	// note and give it the login button so the add form is one click away.
	function decorateViewerNotes() {
		if (window.akgarageIsAdmin()) return;
		var notes = document.querySelectorAll('.viewer-note');
		for (var i = 0; i < notes.length; i++) {
			var note = notes[i];
			if (note.querySelector('.ak-login-button')) continue;
			note.textContent = note.textContent.replace(/ask the admin to/i, 'log in as admin to');
			var button = document.createElement('button');
			button.type = 'button';
			button.className = 'ak-login-button';
			button.textContent = 'Admin login';
			button.addEventListener('click', openGate);
			note.appendChild(button);
		}
	}

	window.akgarageRemoveGate = function () {
		var gate = document.getElementById('auth-gate');
		if (gate) gate.remove();
		document.body.style.visibility = '';
		document.body.style.background = '';
	};

	// Page scripts run before DOMContentLoaded, so their viewer-mode tweaks are
	// already applied by the time this decorates the notes.
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', decorateViewerNotes);
	} else {
		decorateViewerNotes();
	}

	// A stored admin role can outlive its token (it expires on the server). The
	// page would then show the add form while every write is rejected by RLS, so
	// "Add" did nothing at all. Ask the database once per load and step down to
	// viewer when it no longer recognises the token.
	function demoteExpiredAdmin() {
		var role = '';
		try { role = localStorage.getItem(AUTH_KEY) || ''; } catch (error) {}
		if (role !== 'admin' || !window.akgarageAdminToken) return;
		if (!window.sb || typeof window.sb.rpc !== 'function') return;
		window.sb.rpc('is_ak_admin').then(function (result) {
			if (result.error || result.data !== false) return; // offline or still valid: leave it alone
			try { localStorage.removeItem(TOKEN_KEY); localStorage.setItem(AUTH_KEY, 'viewer'); } catch (error) {}
			window.akgarageAdminToken = '';
			window.akgarageApplyRole();
			var note = document.querySelector('.viewer-note');
			if (note) note.hidden = false;
			decorateViewerNotes();
			addRoleBadge();
		}).catch(function () {});
	}

	window.akgarageInitGate = function () {
		// Devices that logged in before the two-role system existed ('1') become
		// viewers; they can switch to admin through the badge button.
		var role = '';
		try { role = localStorage.getItem(AUTH_KEY) || ''; } catch (error) {}
		if (role === '1') {
			try { localStorage.setItem(AUTH_KEY, 'viewer'); } catch (error) {}
			role = 'viewer';
		}
		window.akgarageApplyRole();
		demoteExpiredAdmin();
		if (window.akgarageIsAdmin()) return;
		if (role !== 'viewer') {
			// Hide the page content (but keep the DOM alive) while the gate is open.
			// Previous versions used document.write here, which wiped the page.
			document.body.style.visibility = 'hidden';
			openGate();
		} else {
			addRoleBadge();
		}
	};

	window.akgarageVerifyAdmin = function (password) {
		if (!window.sb || typeof window.sb.rpc !== 'function') {
			return Promise.reject(new Error('Supabase client not loaded'));
		}
		return window.sb.rpc('login_admin', { candidate: String(password || '') }).then(function (result) {
			if (result.error) throw result.error;
			return typeof result.data === 'string' ? result.data : '';
		});
	};

	function showError(element, message) {
		element.textContent = message;
		element.style.display = 'block';
	}

	window.akgarageHandleSubmit = function (event) {
		event.preventDefault();
		var input = document.getElementById('auth-gate-pass');
		var errorEl = document.getElementById('auth-gate-error');
		var value = (input && input.value ? input.value : '').trim();
		if (!errorEl) return false;
		errorEl.style.display = 'none';

		function finish(role, token) {
			try {
				localStorage.setItem(AUTH_KEY, role);
				if (role === 'admin') localStorage.setItem(TOKEN_KEY, token || '');
				else localStorage.removeItem(TOKEN_KEY);
			} catch (error) {}
			window.akgarageAdminToken = role === 'admin' ? (token || '') : '';
			if (role === 'admin') {
				// Reload so the Supabase client is rebuilt with the admin token
				// attached to every request (supabase-client.js reads it at load).
				location.reload();
				return;
			}
			window.akgarageRemoveGate();
			window.akgarageApplyRole();
			addRoleBadge();
		}

		if (value === window.akgarageViewerPassword) {
			finish('viewer', '');
			return false;
		}
		if (!value) {
			showError(errorEl, 'Enter a password to continue.');
			return false;
		}
		window.akgarageVerifyAdmin(value).then(function (token) {
			if (token) finish('admin', token);
			else showError(errorEl, 'Wrong password. Try again.');
		}).catch(function (error) {
			if (error && (error.code === 'PGRST202' || /not found/i.test(error.message || ''))) {
				showError(errorEl, 'Admin login is not set up yet. Run supabase-migrations.sql (section 3) in the Supabase SQL Editor first.');
			} else {
				showError(errorEl, 'Cannot reach the server to verify the admin password. Check your connection and try again.');
			}
		});
		return false;
	};

	// A write failed because the stored session is no longer valid (for example
	// after the admin password was changed). Clear the stale role/token and open
	// the login gate so the user can sign in again.
	window.akgarageForceRelogin = function () {
		try {
			localStorage.removeItem(TOKEN_KEY);
			localStorage.setItem(AUTH_KEY, 'viewer');
		} catch (error) {}
		window.akgarageAdminToken = '';
		window.akgarageApplyRole();
		addRoleBadge();
		openGate();
	};
})();
