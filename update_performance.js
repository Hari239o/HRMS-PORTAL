const fs = require('fs');
let c = fs.readFileSync('client/src/app/(protected)/performance/page.jsx', 'utf8');

c = c.replace(
  "import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';",
  "import { hasAdminAccess, isSuperAdmin, hasApproverAccess } from '@/utils/rbac';"
);

const targetBlock = `<td className="px-6 py-5">
                          <div className="space-y-1">
                            {sub.remainingAmount > 0 ? (
                              <>
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                                  <span className="text-[10px] font-bold text-slate-500">Total:</span>
                                  <span className="font-black text-slate-800">₹{sub.totalAmount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-emerald-50 px-2 py-1 rounded border border-emerald-100/50">
                                  <span className="text-[10px] font-bold text-emerald-600">Paid:</span>
                                  <span className="font-black text-emerald-700">₹{sub.amountPaid || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-rose-50 px-2 py-1 rounded border border-rose-100/50">
                                  <span className="text-[10px] font-bold text-rose-500">Due {sub.remainingAmountDate ? \`(\${new Date(sub.remainingAmountDate).toLocaleDateString()})\` : ''}:</span>
                                  <span className="font-black text-rose-600">₹{sub.remainingAmount}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between items-center bg-emerald-50 px-2 py-2 rounded border border-emerald-200 shadow-sm">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Total Amount Paid:</span>
                                <span className="font-black text-emerald-700">₹{sub.amountPaid || sub.totalAmount}</span>
                              </div>
                            )}
                          </div>
                        </td>`;

const replacementBlock = `<td className="px-6 py-5">
                          <div className="space-y-1">
                            {hasApproverAccess(user) ? (
                              <>
                                {sub.remainingAmount > 0 ? (
                                  <>
                                    <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                                      <span className="text-[10px] font-bold text-slate-500">Total:</span>
                                      <span className="font-black text-slate-800">₹{sub.totalAmount || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-emerald-50 px-2 py-1 rounded border border-emerald-100/50">
                                      <span className="text-[10px] font-bold text-emerald-600">Paid:</span>
                                      <span className="font-black text-emerald-700">₹{sub.amountPaid || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-rose-50 px-2 py-1 rounded border border-rose-100/50">
                                      <span className="text-[10px] font-bold text-rose-500">Due {sub.remainingAmountDate ? \`(\${new Date(sub.remainingAmountDate).toLocaleDateString()})\` : ''}:</span>
                                      <span className="font-black text-rose-600">₹{sub.remainingAmount}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex justify-between items-center bg-emerald-50 px-2 py-2 rounded border border-emerald-200 shadow-sm">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Total Amount Paid:</span>
                                    <span className="font-black text-emerald-700">₹{sub.amountPaid || sub.totalAmount}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex justify-center items-center bg-blue-50 p-2 rounded-lg border border-blue-100">
                                <span className="text-xs font-bold text-blue-700 text-center">
                                  {targetData ? \`\${Math.round((targetData.achievedCount / (targetData.targetCount || 1)) * 100)}% of Quota\` : 'Tracking'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>`;

c = c.replace(targetBlock, replacementBlock);
fs.writeFileSync('client/src/app/(protected)/performance/page.jsx', c);
