const { permitRoles, ownerOrAdmin } = require('../src/middleware/rbac');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('RBAC middleware', () => {
  describe('permitRoles', () => {
    test('allows admin role when admin required', () => {
      const mw = permitRoles(['admin']);
      const req = { user: { role: 'admin' } };
      const res = makeRes();
      const next = jest.fn();
      mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('blocks non-admin for admin only', () => {
      const mw = permitRoles(['admin']);
      const req = { user: { role: 'employee' } };
      const res = makeRes();
      const next = jest.fn();
      mw(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('allows any non-admin when employee is permitted', () => {
      const mw = permitRoles(['employee']);
      const req = { user: { role: 'manager' } };
      const res = makeRes();
      const next = jest.fn();
      mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('ownerOrAdmin', () => {
    test('allows admin regardless of owner', async () => {
      const mwFactory = ownerOrAdmin('ownerId');
      const req = { user: { id: 'u1', role: 'admin' }, params: { ownerId: 'other' } };
      const res = makeRes();
      const next = jest.fn();
      await mwFactory(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('allows owner when owner matches param', async () => {
      const mwFactory = ownerOrAdmin('ownerId');
      const req = { user: { id: 'u1', role: 'employee' }, params: { ownerId: 'u1' } };
      const res = makeRes();
      const next = jest.fn();
      await mwFactory(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('blocks when not owner nor admin', async () => {
      const mwFactory = ownerOrAdmin('ownerId');
      const req = { user: { id: 'u1', role: 'employee' }, params: { ownerId: 'u2' } };
      const res = makeRes();
      const next = jest.fn();
      await mwFactory(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
