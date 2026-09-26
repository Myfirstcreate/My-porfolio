// Shared one-click Excel (CSV) export for AK Garage registration pages.
// Exports only EXPIRED and EXPIRING-WITHIN-30-DAYS records, so the boss gets
// a focused action report instead of the whole table.
// The CSV uses a UTF-8 BOM + CRLF so it opens cleanly in Excel (double-click),
// and can be printed straight from there.
(function () {
	var styleEl = document.createElement('style');
	styleEl.textContent = '.export-report-btn { padding:7px 10px; border:1px solid #3c4439; border-radius:3px; color:var(--lime,#c4f04e); background:transparent; font:10px \'DM Mono\',monospace; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; white-space:nowrap; } .export-report-btn:hover { border-color:var(--lime,#c4f04e); }';
	document.head.appendChild(styleEl);

	function csvCell(value) {
		var text = String(value == null ? '' : value);
		return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
	}

	function daysUntil(expiry, today) {
		if (!expiry) return null;
		var time = new Date(expiry + 'T00:00:00').getTime();
		if (!Number.isFinite(time)) return null;
		return Math.round((time - today.getTime()) / 86400000);
	}

	// Returns [{ record, days, expired }] for expired + expiring-within-30-days rows.
	window.buildExpiryReportRows = function (records) {
		var today = new Date(); today.setHours(0, 0, 0, 0);
		var rows = [];
		(records || []).forEach(function (record) {
			var days = daysUntil(record.expiry, today);
			if (days === null) return;
			if (days < 0 || days <= 30) rows.push({ record: record, days: days, expired: days < 0 });
		});
		rows.sort(function (a, b) { return a.days - b.days; });
		return rows;
	};

	window.exportExpiryReport = function (options) {
		var rows = window.buildExpiryReportRows(typeof options.getRecords === 'function' ? options.getRecords() : (options.records || []));
		if (!rows.length) { alert('No expired or soon-expiring records to export right now.'); return; }
		var columns = options.columns;
		var lines = [];
		lines.push(csvCell(options.title || 'Expiring registrations report'));
		lines.push(csvCell('Generated: ' + new Date().toLocaleString()));
		lines.push(csvCell('Scope: expired + expiring within 30 days — ' + rows.length + ' record(s)'));
		lines.push('');
		lines.push(columns.map(function (column) { return csvCell(column.label); }).join(','));
		rows.forEach(function (row) {
			lines.push(columns.map(function (column) { return csvCell(column.value(row.record, row.days, row.expired)); }).join(','));
		});
		var stamp = new Date().toISOString().slice(0, 10);
		var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
		var link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = (options.filename || 'AK-Garage-expiring-report') + '-' + stamp + '.csv';
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(function () { URL.revokeObjectURL(link.href); }, 2000);
	};

	window.addExpiryReportButton = function (options) {
		var head = document.querySelector(options.headSelector);
		if (!head || !head.querySelector('.export-report-btn')) {
			if (!head) return;
		}
		var button = document.createElement('button');
		button.type = 'button';
		button.className = 'export-report-btn';
		button.textContent = '\u2B07 Export report';
		button.addEventListener('click', function () { window.exportExpiryReport(options); });
		head.appendChild(button);
	};
})();
