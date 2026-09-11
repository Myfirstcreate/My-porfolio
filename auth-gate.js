// Simple shared login gate for AK Garage.
// Not real server-side security — just keeps casual visitors out.
// Once a device enters the correct password, it stays logged in on that device/browser.
(function () {
	var AUTH_KEY = 'akgarage_auth';
	var PASSWORD = '12345';

	window.akgarageGateHTML = function () {
		return '' +
			'<div id="auth-gate" style="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#070807;font-family:\'Space Grotesk\',sans-serif;">' +
				'<form id="auth-gate-form" onsubmit="return akgarageHandleSubmit(event)" style="width:min(340px,90%);padding:32px 28px;border:1px solid #292d29;border-radius:8px;background:#101210;text-align:center;">' +
					'<div style="width:44px;height:44px;margin:0 auto 18px;border-radius:50%;background:#c4f04e;display:flex;align-items:center;justify-content:center;color:#070807;font-weight:700;font-size:14px;">AK</div>' +
					'<h2 style="margin:0 0 6px;color:#f0f3ec;font-size:18px;">AK GARAGE</h2>' +
					'<p style="margin:0 0 20px;color:#8b9388;font-size:11px;letter-spacing:.08em;text-transform:uppercase;">Enter password to continue</p>' +
					'<input id="auth-gate-pass" type="password" placeholder="Password" autofocus autocomplete="off" style="width:100%;box-sizing:border-box;padding:11px 12px;margin-bottom:12px;border:1px solid #292d29;border-radius:4px;background:#080a08;color:#f0f3ec;font-size:13px;outline:0;">' +
					'<div id="auth-gate-error" style="display:none;margin-bottom:12px;color:#ff7670;font-size:11px;">Maling password. Subukan ulit.</div>' +
					'<button type="submit" style="width:100%;padding:11px;border:1px solid #c4f04e;border-radius:4px;background:#c4f04e;color:#070807;font-weight:600;font-size:12px;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;">Enter</button>' +
				'</form>' +
			'</div>';
	};

	window.akgarageInitGate = function () {
		if (localStorage.getItem(AUTH_KEY) === '1') return;
		document.write(window.akgarageGateHTML());
	};

	window.akgarageHandleSubmit = function (event) {
		event.preventDefault();
		var value = document.getElementById('auth-gate-pass').value;
		if (value === PASSWORD) {
			localStorage.setItem(AUTH_KEY, '1');
			var gate = document.getElementById('auth-gate');
			if (gate) gate.remove();
		} else {
			document.getElementById('auth-gate-error').style.display = 'block';
		}
		return false;
	};
})();
