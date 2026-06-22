/**
 * Google Sheets sync utilities for CRM lead import.
 *
 * fetchSheetValues uses:
 *   1. Google Sheets API v4 (if GOOGLE_SHEETS_API_KEY is set in .env) — recommended, 
 *      works on any sheet shared with "Anyone with the link can view".
 *   2. CSV export fallback (if no API key) — requires sheet published to web.
 *
 * Add to server/.env:
 *   GOOGLE_SHEETS_API_KEY=your_key_here
 */

const LEAD_FIELDS = [
  'timestamp', 'fullName', 'mobileNumber', 'whatsappNumber', 'collegeName',
  'educationalQualification', 'year', 'branch', 'interestedDomain',
  'emailId', 'collegeMailId', 'opportunityType', 'crNumber',
];

/**
 * FIELD_MAP: Maps Google Sheet column headers to Firestore lead field names
 * Handles all required sheet headers and common variants
 */
const FIELD_MAP = {
  // Timestamp
  'timestamp':               'timestamp',
  'date':                    'timestamp',
  'time':                    'timestamp',

  // Full Name
  'lead display name':       'fullName',
  'full name':               'fullName',
  'name':                    'fullName',
  'student name':            'fullName',

  // Mobile Number
  'mobile number':           'mobileNumber',
  'mobile':                  'mobileNumber',
  'mobile no':               'mobileNumber',
  'mobile no.':              'mobileNumber',
  'phone':                   'mobileNumber',
  'phone no':                'mobileNumber',
  'phone number':            'mobileNumber',
  'contact':                 'mobileNumber',

  // WhatsApp Number
  'whatsapp number':         'whatsappNumber',
  'whatsapp':                'whatsappNumber',
  'whatsapp no':             'whatsappNumber',
  'whatsapp no.':            'whatsappNumber',
  'wa number':               'whatsappNumber',
  'wa':                      'whatsappNumber',

  // College Name
  'college name':            'collegeName',
  'college':                 'collegeName',
  'institution':             'collegeName',
  'university':              'collegeName',

  // Educational Qualification
  'educational qualification': 'educationalQualification',
  'qualification':            'educationalQualification',
  'education':                'educationalQualification',
  'degree':                   'educationalQualification',

  // Year
  'year':                    'year',
  'current year':            'year',
  'study year':              'year',

  // Branch
  'branch':                  'branch',
  'stream':                  'branch',
  'department':              'branch',

  // Interested Domain
  'interested domain':       'interestedDomain',
  'interested course':       'interestedDomain',
  'interested domain':       'interestedDomain',
  'course':                  'interestedDomain',
  'program':                 'interestedDomain',
  'domain':                  'interestedDomain',

  // Email ID
  'email id':                'emailId',
  'email':                   'emailId',
  'mail id':                 'emailId',
  'email address':           'emailId',
  'mail':                    'emailId',

  // College Mail ID
  'college mail id':         'collegeMailId',
  'college mail':            'collegeMailId',
  'college email':           'collegeMailId',
  'institutional email':     'collegeMailId',

  // Opportunity Type
  'what type of opportunities are you looking for': 'opportunityType',
  'what type of opportunities are you looking for?': 'opportunityType',
  'opportunity type':        'opportunityType',
  'lead type':               'opportunityType',
  'type':                    'opportunityType',
  'opportunities':           'opportunityType',

  // CR Number
  'cr number':               'crNumber',
  'cr':                      'crNumber',
  'contact number':          'crNumber',
};

/** Normalize a string for header matching: trim, lowercase, remove punctuation, collapse whitespace */
function norm(s) {
  return (s || '').toString().trim().toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Extract the Sheet ID from a full Google Sheets URL or a raw ID.
 * Handles: full URLs, /d/{id}/edit, or plain IDs.
 */
function extractSheetId(raw) {
  const s = (raw || '').trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  // Handle plain ID or URL with no /d/ path
  return s.split('/').pop().split('?')[0];
}

function extractSheetGid(raw) {
  const s = (raw || '').trim();
  const query = s.split('?')[1] || '';
  const hash = s.split('#')[1] || '';

  const params = new URLSearchParams(query);
  if (params.has('gid')) return params.get('gid');

  const hashParams = new URLSearchParams(hash);
  if (hashParams.has('gid')) return hashParams.get('gid');

  // fallback for plain gid in fragment string
  const match = s.match(/gid=(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch the sheet as a 2D array via Google Sheets API v4.
 * Falls back to CSV export if no API key configured.
 * @param {string} sheetIdRaw - Full URL or plain Sheet ID
 */
async function fetchSheetValues(sheetIdRaw) {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = extractSheetId(sheetIdRaw);
  const gid = extractSheetGid(sheetIdRaw);

  if (apiKey) {
    // ── Primary path: Google Sheets API v4 ──────────────────────────────
    // Step 1: Get first tab name from sheet metadata
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}&fields=sheets(properties(title))`;
    const metaRes = await fetch(metaUrl);
    if (!metaRes.ok) {
      const body = await metaRes.text();
      throw new Error(`Sheet metadata failed [${metaRes.status}]: ${body.slice(0, 200)}`);
    }
    const meta = await metaRes.json();
    const tabName = meta?.sheets?.[0]?.properties?.title || 'Sheet1';

    // Step 2: Fetch values from A1:Z10000
    const range = `${encodeURIComponent(tabName)}!A1:Z10000`;
    const valUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    const valRes = await fetch(valUrl);
    if (!valRes.ok) {
      const body = await valRes.text();
      throw new Error(`Sheet read failed [${valRes.status}]: ${body.slice(0, 200)}`);
    }
    const json = await valRes.json();
    return json.values || [];
  }

  // ── Fallback path: CSV export (works when sheet is shared as Anyone with the link can view) ──────
  const exportParams = gid ? `?format=csv&gid=${encodeURIComponent(gid)}` : '?format=csv';
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export${exportParams}`;
  let res = await fetch(exportUrl, { redirect: 'follow' });
  if (res.ok) {
    return parseCSV(await res.text());
  }

  // Second fallback: gviz CSV endpoint works for view-only shared sheets without publishing to web.
  const gvizParams = gid ? `?gid=${encodeURIComponent(gid)}&tqx=out:csv` : '?tqx=out:csv';
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq${gvizParams}`;
  res = await fetch(gvizUrl, { redirect: 'follow' });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `Sheet is not accessible. Ensure the sheet is shared with "Anyone with the link can view" ` +
      `or add GOOGLE_SHEETS_API_KEY to .env file in server folder.`
    );
  }
  if (!res.ok) {
    throw new Error(
      `Sheet fetch failed (HTTP ${res.status}). Sheet may not exist or is not shared properly. ` +
      `Add GOOGLE_SHEETS_API_KEY to .env, or share the sheet with anyone who has the link.`
    );
  }

  return parseCSV(await res.text());
}

/** Robust CSV parser handling quoted fields and embedded commas/newlines */
function parseCSV(csv) {
  const lines = csv.split('\n');
  return lines.map(line => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  }).filter(row => row.some(c => c !== ''));
}

/**
 * Parse raw 2D sheet values into enriched lead rows.
 * Exactly matches original logic: norm() headers, FIELD_MAP lookup, overrideMap support,
 * dual-field dedup (whatsapp + email).
 *
 * @param {string[][]} values          - raw 2D array from fetchSheetValues
 * @param {Array<{whatsapp,email}>} existing - existing leads for dedup
 * @param {Record<string,string>|null} overrideMap - custom normalized-header → field mapping
 * @param {'both'|'whatsapp'|'email'} dedupeStrategy
 */
function parseSheetRows(values, existing, overrideMap = null, dedupeStrategy = 'both') {
  if (!values || values.length < 2) return { rows: [], headers: [] };

  // Map each header: apply overrideMap first, then FIELD_MAP, else null
  const rawHeaders = values[0];
  const headers = rawHeaders.map((h, i) => {
    const n = norm(h);
    const key = overrideMap && overrideMap[n] ? overrideMap[n] : FIELD_MAP[n] || null;
    if (!key && n) {
      console.warn(`[SHEETS SYNC] Unmapped header #${i + 1}: "${h}" -> "${n}"`);
    }
    return key;
  });

  // Build dedup sets — exactly as original
  const seenWa = new Set(
    existing
      .map(r => (r.whatsappNumber || r.whatsapp || r.mobileNumber || '').toString().replace(/\D/g, ''))
      .filter(Boolean)
  );
  const seenEm = new Set(
    existing
      .map(r => ((r.emailId || r.email || '')).toString().toLowerCase())
      .filter(Boolean)
  );

  const rows = values.slice(1).map((row, idx) => {
    const obj = {};
    headers.forEach((key, i) => {
      if (key) obj[key] = (row[i] || '').toString().trim();
    });

    const waDigits = (obj.whatsappNumber || obj.whatsapp || obj.mobileNumber || '').replace(/\D/g, '');
    const emLc = (obj.emailId || obj.email || '').toLowerCase();

    let status = 'new';
    const hasPayload =
      obj.fullName || obj.full_name || obj.whatsappNumber || obj.whatsapp || obj.mobileNumber || obj.emailId || obj.email || obj.phone;

    if (!hasPayload) {
      status = 'empty';
    } else {
      const dupWa = dedupeStrategy !== 'email' && waDigits && seenWa.has(waDigits);
      const dupEm = dedupeStrategy !== 'whatsapp' && emLc && seenEm.has(emLc);
      if (dupWa || dupEm) status = 'duplicate';
    }

    return { rowIndex: idx + 2, _status: status, ...obj };
  });

  return { rows, headers: rawHeaders };
}

/**
 * Import all "new" rows into Firestore using batch writes.
 * Tracks imported row IDs to prevent re-importing same rows.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} employeeId
 * @param {Array} rows - from parseSheetRows
 */
async function importNewRows(db, employeeId, rows, assignedUser = null) {
  let imported = 0, skipped = 0, errors = 0;
  const failed = [];

  // Get existing imported row tracking
  const trackingRef = db.collection('employee_integration_keys').doc(employeeId);
  const trackingDoc = await trackingRef.get();
  const importedRowIds = new Set(trackingDoc.exists ? (trackingDoc.data().imported_row_ids || []) : []);

  // Batch all writes together (limit 500 per batch)
  const batch = db.batch();
  let batchCount = 0;
  const batches = [];

  for (let i = 0; i < rows.length; i++) {
    const obj = rows[i];
    if (obj._status !== 'new') {
      skipped++;
      continue;
    }

    // Skip rows that have already been imported
    const rowId = `${obj.rowIndex}_${obj.whatsappNumber || obj.emailId || ''}`.replace(/\s+/g, '_');
    if (importedRowIds.has(rowId)) {
      skipped++;
      continue;
    }

    const payload = {
      timestamp:                obj.timestamp || null,
      fullName:                 obj.fullName || obj.full_name || obj.whatsappNumber || obj.emailId || obj.email || 'Unknown',
      mobileNumber:             obj.mobileNumber || obj.whatsappNumber || null,
      whatsappNumber:           obj.whatsappNumber || obj.mobileNumber || null,
      collegeName:              obj.collegeName || null,
      educationalQualification: obj.educationalQualification || obj.qualification || null,
      year:                     obj.year || null,
      branch:                   obj.branch || null,
      interestedDomain:         obj.interestedDomain || obj.interestedCourse || null,
      emailId:                  obj.emailId || obj.email || null,
      collegeMailId:            obj.collegeMailId || obj.collegeEmail || null,
      opportunityType:          obj.opportunityType || obj.leadType || null,
      crNumber:                 obj.crNumber || null,

      // System fields
      leadStatus:               'Pending',
      callStatus:               'Not Called',
      remarks:                  '',
      source:                   'google_sheet',
      ownerEmployeeId:          employeeId,
      ownerEmployeeName:        assignedUser || employeeId,
      importedBy:               employeeId,
      importedAt:               new Date().toISOString(),
      assignedTo:               employeeId,
      assignedUser:             assignedUser || employeeId,
      createdBy:                employeeId,
    };

    try {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      
      // Add to batch instead of immediate write
      batch.set(db.collection('leads').doc(id), {
        id,
        ...payload,
        status:    'new',
        createdAt: new Date().toISOString(),
      });

      batch.set(db.collection('lead_activities').doc(), {
        leadId: id,
        activityType: 'Imported',
        activityTitle: 'Lead Imported',
        notes: 'Imported from Google Sheets',
        userId: employeeId,
        userName: assignedUser || employeeId,
        createdAt: new Date().toISOString(),
        action: 'Lead Imported',
      });

      importedRowIds.add(rowId);
      imported++;
      batchCount += 2;

      // Commit batch every 500 operations
      if (batchCount >= 500) {
        batches.push(batch);
        batches.push(db.batch());
        batchCount = 0;
      }
    } catch (err) {
      errors++;
      failed.push({ rowIndex: obj.rowIndex, error: err.message, payload });
    }
  }

  // Commit any remaining batch operations
  if (batchCount > 0) {
    batches.push(batch);
  }

  for (const b of batches) {
    await b.commit();
  }

  // Update tracking with newly imported rows
  if (imported > 0) {
    await trackingRef.set({
      imported_row_ids: Array.from(importedRowIds),
      last_sync_at: new Date().toISOString(),
    }, { merge: true });
  }

  return { imported, skipped, errors, failed };
}


const EXPECTED_SHEET_HEADERS = [
  'lead id',
  'name',
  'phone number',
  'email',
  'college',
  'course',
  'city',
  'state',
  'source',
  'created date',
];

function normalizePhone(phone) {
  return (phone || '').toString().replace(/\D/g, '');
}

function parseExactLeadSheet(values) {
  if (!values || values.length < 2) {
    return { rows: [], headers: [] };
  }

  const rawHeaders = values[0].map((value) => (value || '').toString().trim());
  const normalizedHeaders = rawHeaders.map(norm);
  const requiredHeaders = EXPECTED_SHEET_HEADERS.map(norm);

  const missing = requiredHeaders.filter((header) => !normalizedHeaders.includes(header));
  if (missing.length) {
    const columnNames = missing.map((header) => {
      const index = requiredHeaders.indexOf(header);
      return EXPECTED_SHEET_HEADERS[index] || header;
    });
    throw new Error(`Missing required columns: ${columnNames.join(', ')}`);
  }

  const headerIndex = requiredHeaders.reduce((map, header, idx) => {
    map[header] = normalizedHeaders.indexOf(header);
    return map;
  }, {});

  const rows = values.slice(1).map((row, rowIndex) => {
    return {
      rowIndex: rowIndex + 2,
      leadId:      (row[headerIndex['lead id']] || '').toString().trim(),
      name:        (row[headerIndex['name']] || '').toString().trim(),
      phone:       (row[headerIndex['phone number']] || '').toString().trim(),
      email:       (row[headerIndex['email']] || '').toString().trim(),
      college:     (row[headerIndex['college']] || '').toString().trim(),
      course:      (row[headerIndex['course']] || '').toString().trim(),
      city:        (row[headerIndex['city']] || '').toString().trim(),
      state:       (row[headerIndex['state']] || '').toString().trim(),
      source:      (row[headerIndex['source']] || '').toString().trim(),
      createdDate: (row[headerIndex['created date']] || '').toString().trim(),
    };
  }).filter((row) => {
    return Object.values(row).some((value) => value && value.toString().trim() !== '');
  });

  return { rows, headers: rawHeaders };
}

async function importLeadRows(db, userId, rows) {
  const existingSnap = await db.collection('leads').get();
  const seenPhones = new Set(
    existingSnap.docs
      .map((doc) => normalizePhone(doc.data().phone))
      .filter(Boolean)
  );

  let imported = 0;
  let duplicates = 0;
  let failed = 0;
  const failures = [];
  const duplicateRows = [];

  for (const row of rows) {
    const normalizedPhone = normalizePhone(row.phone);
    if (!normalizedPhone) {
      failed += 1;
      failures.push({ rowIndex: row.rowIndex, error: 'Missing phone number' });
      continue;
    }

    if (seenPhones.has(normalizedPhone)) {
      duplicates += 1;
      duplicateRows.push({ rowIndex: row.rowIndex, phone: row.phone });
      continue;
    }

    try {
      const id = row.leadId || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      await db.collection('leads').doc(id).set({
        id,
        name: row.name || 'Unknown',
        phone: row.phone,
        email: row.email || '',
        college: row.college || '',
        course: row.course || '',
        city: row.city || '',
        state: row.state || '',
        source: row.source || '',
        status: 'Pending',
        callStatus: 'Not Called',
        remarks: '',
        assignedTo: userId || '',
        createdAt: now,
        updatedAt: now,
      });
      imported += 1;
      seenPhones.add(normalizedPhone);
    } catch (err) {
      failed += 1;
      failures.push({ rowIndex: row.rowIndex, error: err.message });
    }
  }

  return { imported, duplicates, failed, failures, duplicateRows, total: rows.length };
}

module.exports = {
  fetchSheetValues,
  parseSheetRows,
  importNewRows,
  extractSheetId,
  norm,
  FIELD_MAP,
  LEAD_FIELDS,
  EXPECTED_SHEET_HEADERS,
  normalizePhone,
  parseExactLeadSheet,
  importLeadRows,
};
