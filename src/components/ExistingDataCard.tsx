import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { HouseholdRow } from '../types/census';

interface ExistingDataCardProps {
  rows: HouseholdRow[];
  seIdOfEnumerator: string;
  timestamp: string;
}

export const ExistingDataCard: React.FC<ExistingDataCardProps> = ({
  rows,
  seIdOfEnumerator,
  timestamp,
}) => {
  if (rows.length === 0) return null;

  return (
    <section
      id="existing-record"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-teal-50/40">
        <div className="flex items-start gap-2.5">
          <CheckCircle2
            className="w-5 h-5 text-teal-700 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Existing Saved Data in Sheet
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {rows.length} {rows.length === 1 ? 'record' : 'records'} found
              {seIdOfEnumerator ? ` · Enumerator SE ID: ${seIdOfEnumerator}` : ''}
              {timestamp ? ` · Last Submitted: ${timestamp}` : ''}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-teal-800 whitespace-nowrap shrink-0">
          Update Mode Active
        </span>
      </div>

      {/* Mobile list view (< md) */}
      <div className="md:hidden divide-y divide-slate-200">
        {rows.map((row, idx) => (
          <div key={row.id || idx} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800">
                क्रम संख्या: <span className="font-mono-tabular">{row.serialNo || idx + 1}</span>
              </span>
              <span className="font-mono-tabular">{row.seDate || '—'}</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-sm">
              <div>
                <span className="text-xs text-slate-500">
                  मुखिया का नाम:{' '}
                </span>
                <span className="font-semibold text-slate-900">
                  {row.headName || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500">
                  पिता/पति का नाम:{' '}
                </span>
                <span className="font-medium text-slate-800">
                  {row.fatherHusbandName || '—'}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>
                  मोबाइल:{' '}
                  <strong className="font-mono-tabular text-slate-900">
                    {row.mobileNumber || '—'}
                  </strong>
                </span>
                <span>
                  SE ID:{' '}
                  <strong className="font-mono-tabular text-slate-900">
                    {row.seId || '—'}
                  </strong>
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500">
                  स्व गणना स्थल/ ग्राम:{' '}
                </span>
                <span className="text-xs font-medium text-slate-800">
                  {row.villageSiteName || '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="py-3 px-4 whitespace-nowrap">क्रम संख्या</th>
              <th className="py-3 px-4">
                मुखिया का नाम (प्रगनक को आवंटित EB के मुखिया)
              </th>
              <th className="py-3 px-4">पिता/पति का नाम</th>
              <th className="py-3 px-4 whitespace-nowrap">मोबाइल नंबर</th>
              <th className="py-3 px-4">
                स्व गणना स्थल/ ग्राम (प्रगनक को आवंटित EB ग्राम का नाम)
              </th>
              <th className="py-3 px-4 whitespace-nowrap">स्व गणना आइडी(SE ID)</th>
              <th className="py-3 px-4 whitespace-nowrap">स्व गणना दिनांक</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-800">
            {rows.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-mono-tabular font-medium">
                  {row.serialNo || idx + 1}
                </td>
                <td className="py-3 px-4 font-medium">{row.headName || '—'}</td>
                <td className="py-3 px-4">{row.fatherHusbandName || '—'}</td>
                <td className="py-3 px-4 font-mono-tabular">
                  {row.mobileNumber || '—'}
                </td>
                <td className="py-3 px-4">{row.villageSiteName || '—'}</td>
                <td className="py-3 px-4 font-mono-tabular font-medium">
                  {row.seId || '—'}
                </td>
                <td className="py-3 px-4 font-mono-tabular whitespace-nowrap">
                  {row.seDate || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
