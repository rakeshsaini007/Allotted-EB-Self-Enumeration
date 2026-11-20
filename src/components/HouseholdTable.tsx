import React, { useRef } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { HouseholdRow } from '../types/census';
import {
  isValidMobile,
  isValidSeId,
  sanitizeMobile,
  sanitizeSeId,
  sanitizeUppercaseEnglish,
} from '../services/googleSheetsApi';

interface HouseholdTableProps {
  rows: HouseholdRow[];
  onChangeRow: (index: number, field: keyof HouseholdRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  showValidationErrors: boolean;
  disabled: boolean;
}

export const HouseholdTable: React.FC<HouseholdTableProps> = ({
  rows,
  onChangeRow,
  onAddRow,
  onRemoveRow,
  showValidationErrors,
  disabled,
}) => {
  const headInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleEditRow = (rowId: string) => {
    const input = headInputRefs.current[rowId];
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section
      id="household-table"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 sm:px-6 border-b border-slate-200">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            Household Self Enumeration Details
          </h2>
        </div>
      </div>

      {/* Mobile Card Entry Layout (< lg) */}
      <div className="lg:hidden divide-y divide-slate-200">
        {rows.map((row, idx) => {
          const headInvalid = showValidationErrors && !row.headName.trim();
          const fatherInvalid =
            showValidationErrors && !row.fatherHusbandName.trim();
          const mobileInvalid =
            showValidationErrors && !isValidMobile(row.mobileNumber);
          const villageInvalid =
            showValidationErrors && !row.villageSiteName.trim();
          const seIdInvalid = showValidationErrors && !isValidSeId(row.seId);
          const dateInvalid = showValidationErrors && !row.seDate.trim();

          return (
            <div key={row.id} className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-sm font-semibold text-slate-900">
                  क्रम संख्या{' '}
                  <span className="font-mono-tabular text-teal-700">
                    #{idx + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleEditRow(row.id)}
                  disabled={disabled}
                  aria-label={`Edit row ${idx + 1}`}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    मुखिया का नाम (प्रगनक को आवंटित EB के मुखिया){' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    ref={(el) => {
                      headInputRefs.current[row.id] = el;
                    }}
                    type="text"
                    autoCapitalize="characters"
                    placeholder="HEAD NAME IN UPPERCASE"
                    value={row.headName}
                    disabled={disabled}
                    onChange={(e) =>
                      onChangeRow(
                        idx,
                        'headName',
                        sanitizeUppercaseEnglish(e.target.value)
                      )
                    }
                    className={`w-full min-h-[44px] px-3.5 py-2 text-base uppercase bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                      headInvalid ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {headInvalid && (
                    <p className="mt-1 text-xs text-red-600">
                      Required in uppercase English letters.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    पिता/पति का नाम <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    autoCapitalize="characters"
                    placeholder="FATHER / HUSBAND NAME"
                    value={row.fatherHusbandName}
                    disabled={disabled}
                    onChange={(e) =>
                      onChangeRow(
                        idx,
                        'fatherHusbandName',
                        sanitizeUppercaseEnglish(e.target.value)
                      )
                    }
                    className={`w-full min-h-[44px] px-3.5 py-2 text-base uppercase bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                      fatherInvalid ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {fatherInvalid && (
                    <p className="mt-1 text-xs text-red-600">
                      Required in uppercase English letters.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    मोबाइल नंबर <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10 DIGIT MOBILE"
                    value={row.mobileNumber}
                    disabled={disabled}
                    onChange={(e) =>
                      onChangeRow(
                        idx,
                        'mobileNumber',
                        sanitizeMobile(e.target.value)
                      )
                    }
                    className={`w-full min-h-[44px] px-3.5 py-2 text-base font-mono-tabular bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                      mobileInvalid ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {mobileInvalid && (
                    <p className="mt-1 text-xs text-red-600">
                      Enter valid 10-digit mobile number.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    स्व गणना स्थल/ ग्राम (प्रगनक को आवंटित EB ग्राम का नाम){' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    autoCapitalize="characters"
                    placeholder="VILLAGE / SITE NAME"
                    value={row.villageSiteName}
                    disabled={disabled}
                    onChange={(e) =>
                      onChangeRow(
                        idx,
                        'villageSiteName',
                        sanitizeUppercaseEnglish(e.target.value)
                      )
                    }
                    className={`w-full min-h-[44px] px-3.5 py-2 text-base uppercase bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                      villageInvalid ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {villageInvalid && (
                    <p className="mt-1 text-xs text-red-600">
                      Required in uppercase English letters.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    स्व गणना आइडी(SE ID){' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    autoCapitalize="characters"
                    maxLength={12}
                    placeholder="P12345678945"
                    value={row.seId}
                    disabled={disabled}
                    onChange={(e) =>
                      onChangeRow(idx, 'seId', sanitizeSeId(e.target.value))
                    }
                    className={`w-full min-h-[44px] px-3.5 py-2 text-base font-mono-tabular uppercase bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                      seIdInvalid ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  <p
                    className={`mt-1 text-xs font-mono-tabular ${
                      seIdInvalid
                        ? 'text-red-600'
                        : isValidSeId(row.seId)
                        ? 'text-teal-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {isValidSeId(row.seId)
                      ? 'Valid SE ID (P + 11 digits)'
                      : 'Must start with P + 11 digits'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    स्व गणना दिनांक <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={row.seDate}
                    disabled={disabled}
                    onChange={(e) => onChangeRow(idx, 'seDate', e.target.value)}
                    className={`w-full min-h-[44px] px-3.5 py-2 text-base font-mono-tabular bg-white border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                      dateInvalid ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {dateInvalid && (
                    <p className="mt-1 text-xs text-red-600">
                      Select self-enumeration date.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Data Table Layout (lg+) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 align-top">
              <th className="py-3.5 px-3 w-16 text-center">क्रम संख्या</th>
              <th className="py-3.5 px-3 min-w-[200px]">
                मुखिया का नाम (प्रगनक को आवंटित EB के मुखिया)
              </th>
              <th className="py-3.5 px-3 min-w-[170px]">पिता/पति का नाम</th>
              <th className="py-3.5 px-3 min-w-[140px]">मोबाइल नंबर</th>
              <th className="py-3.5 px-3 min-w-[200px]">
                स्व गणना स्थल/ ग्राम (प्रगनक को आवंटित EB ग्राम का नाम)
              </th>
              <th className="py-3.5 px-3 min-w-[170px]">स्व गणना आइडी(SE ID)</th>
              <th className="py-3.5 px-3 min-w-[150px]">स्व गणना दिनांक</th>
              <th className="py-3.5 px-3 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, idx) => {
              const headInvalid = showValidationErrors && !row.headName.trim();
              const fatherInvalid =
                showValidationErrors && !row.fatherHusbandName.trim();
              const mobileInvalid =
                showValidationErrors && !isValidMobile(row.mobileNumber);
              const villageInvalid =
                showValidationErrors && !row.villageSiteName.trim();
              const seIdInvalid =
                showValidationErrors && !isValidSeId(row.seId);
              const dateInvalid = showValidationErrors && !row.seDate.trim();

              return (
                <tr key={row.id} className="align-top hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-center font-mono-tabular text-sm font-semibold text-slate-700 pt-5">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      autoCapitalize="characters"
                      placeholder="UPPERCASE ENGLISH"
                      value={row.headName}
                      disabled={disabled}
                      onChange={(e) =>
                        onChangeRow(
                          idx,
                          'headName',
                          sanitizeUppercaseEnglish(e.target.value)
                        )
                      }
                      className={`w-full min-h-[40px] px-3 py-1.5 text-sm uppercase bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                        headInvalid ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      autoCapitalize="characters"
                      placeholder="UPPERCASE ENGLISH"
                      value={row.fatherHusbandName}
                      disabled={disabled}
                      onChange={(e) =>
                        onChangeRow(
                          idx,
                          'fatherHusbandName',
                          sanitizeUppercaseEnglish(e.target.value)
                        )
                      }
                      className={`w-full min-h-[40px] px-3 py-1.5 text-sm uppercase bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                        fatherInvalid ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10 DIGITS"
                      value={row.mobileNumber}
                      disabled={disabled}
                      onChange={(e) =>
                        onChangeRow(
                          idx,
                          'mobileNumber',
                          sanitizeMobile(e.target.value)
                        )
                      }
                      className={`w-full min-h-[40px] px-3 py-1.5 text-sm font-mono-tabular bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                        mobileInvalid ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      autoCapitalize="characters"
                      placeholder="UPPERCASE ENGLISH"
                      value={row.villageSiteName}
                      disabled={disabled}
                      onChange={(e) =>
                        onChangeRow(
                          idx,
                          'villageSiteName',
                          sanitizeUppercaseEnglish(e.target.value)
                        )
                      }
                      className={`w-full min-h-[40px] px-3 py-1.5 text-sm uppercase bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                        villageInvalid ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      autoCapitalize="characters"
                      maxLength={12}
                      placeholder="P12345678945"
                      value={row.seId}
                      disabled={disabled}
                      onChange={(e) =>
                        onChangeRow(idx, 'seId', sanitizeSeId(e.target.value))
                      }
                      className={`w-full min-h-[40px] px-3 py-1.5 text-sm font-mono-tabular uppercase bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                        seIdInvalid ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="date"
                      value={row.seDate}
                      disabled={disabled}
                      onChange={(e) =>
                        onChangeRow(idx, 'seDate', e.target.value)
                      }
                      className={`w-full min-h-[40px] px-3 py-1.5 text-sm font-mono-tabular bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                        dateInvalid ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(idx)}
                      disabled={disabled || rows.length <= 1}
                      aria-label={`Remove row ${idx + 1}`}
                      className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Add New Row bar for quick mobile/desktop thumb access */}
      <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
        <span className="text-xs text-slate-600 font-mono-tabular">
          Total Rows: {rows.length}
        </span>
        <button
          type="button"
          onClick={onAddRow}
          disabled={disabled}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add New Row</span>
        </button>
      </div>
    </section>
  );
};
