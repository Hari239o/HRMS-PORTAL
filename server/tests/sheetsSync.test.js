const { parseSheetRows } = require('../src/utils/sheetsSync');

describe('sheetsSync utilities', () => {
  test('parseSheetRows flags duplicates by whatsapp or email', () => {
    const values = [
      ['Name', 'Mobile Number', 'Email ID'],
      ['Joe Doe', '+1 (555) 123-4567', 'joe@example.com'],
      ['Jane Roe', '5559998888', 'jane@example.com'],
      ['Duplicate Joe', '5551234567', 'joe@example.com']
    ];

    const existing = [
      { whatsappNumber: '5551234567', emailId: 'joe@example.com' }
    ];

    const { rows } = parseSheetRows(values, existing);
    expect(rows).toHaveLength(3);
    expect(rows[0]._status).toBe('duplicate');
    expect(rows[1]._status).toBe('new');
    expect(rows[2]._status).toBe('duplicate');
  });
});
