const request = require('supertest');

const createMockDb = () => {
  const store = {
    call_logs: {},
    leads: {},
    employees: {},
  };

  const docRef = (collectionName, id) => {
    return {
      id,
      get: async () => {
        const data = store[collectionName][id];
        return { id, exists: !!data, data: () => (data ? data.data : undefined) };
      },
      set: async (data) => {
        store[collectionName][id] = { id, data };
      },
      update: async (data) => {
        const existing = store[collectionName][id];
        if (!existing || !existing.data) throw new Error('Document not found');
        const updated = { ...existing.data };
        for (const [key, value] of Object.entries(data)) {
          if (value && value._op === 'increment') {
            updated[key] = (updated[key] || 0) + value.value;
          } else {
            updated[key] = value;
          }
        }
        store[collectionName][id].data = updated;
      },
      delete: async () => {
        delete store[collectionName][id];
      }
    };
  };

  const createQuery = (collectionName, conditions = []) => {
    return {
      where(field, op, value) {
        return createQuery(collectionName, [...conditions, { field, op, value }]);
      },
      orderBy() {
        return this;
      },
      async get() {
        const docs = Object.values(store[collectionName])
          .filter(({ data }) => {
            return conditions.every(({ field, op, value }) => {
              const actual = data[field];
              if (op === '==') return actual === value;
              if (op === 'in') return Array.isArray(value) && value.includes(actual);
              return false;
            });
          })
          .map(({ id, data }) => ({ id, exists: true, data: () => data }));
        return { docs, empty: docs.length === 0 };
      },
      doc: (id) => docRef(collectionName, id),
      add: async (data) => {
        const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
        store[collectionName][id] = { id, data };
        return { id };
      }
    };
  };

  return {
    store,
    collection: (name) => createQuery(name),
    batch: () => ({
      commits: [],
      set: function (ref, data) {
        this.commits.push({ ref, data });
      },
      async commit() {
        for (const op of this.commits) {
          await op.ref.set(op.data);
        }
      }
    })
  };
};

let mockDb;
const mockCrmAutomation = {
  createLeadActivity: jest.fn(),
  createNotification: jest.fn(),
};

mockDb = createMockDb();

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'employee-1', role: 'employee', name: 'Test User' };
    next();
  },
  authorize: () => (req, res, next) => next(),
}));

jest.mock('../src/services/crm-automation', () => mockCrmAutomation);

jest.mock('../src/db', () => ({
  db: mockDb,
  admin: {
    firestore: {
      FieldValue: {
        increment: (value) => ({ _op: 'increment', value })
      }
    }
  }
}));

const { createLeadActivity, createNotification } = require('../src/services/crm-automation');
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const app = require('../src/app');

afterAll(() => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});

describe('call log routes', () => {
  test('POST /api/call-logs creates a call log and updates lead metrics', async () => {
    mockDb.store.leads['lead-123'] = {
      id: 'lead-123',
      data: {
        whatsappNumber: '1234567890',
        mobileNumber: '1234567890',
        phone: '1234567890',
      }
    };

    const response = await request(app)
      .post('/api/call-logs')
      .send({
        leadId: 'lead-123',
        leadName: 'Test Lead',
        callStatus: 'Completed',
        notes: 'Left a voice message',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.callLog).toMatchObject({
      leadId: 'lead-123',
      employeeId: 'employee-1',
      employeeName: 'Test User',
      callStatus: 'Completed',
      notes: 'Left a voice message',
    });

    const storedLead = mockDb.store.leads['lead-123'].data;
    expect(storedLead.callStatus).toBe('Completed');
    expect(storedLead.callCount).toBe(1);
    expect(createLeadActivity).toHaveBeenCalled();
  });

  test('GET /api/call-logs returns employee call logs', async () => {
    const response = await request(app).get('/api/call-logs');
    expect(response.status).toBe(200);
    expect(response.body.callLogs).toHaveLength(1);
    expect(response.body.callLogs[0]).toMatchObject({
      leadId: 'lead-123',
      employeeId: 'employee-1',
      callStatus: 'Completed',
    });
  });
});

