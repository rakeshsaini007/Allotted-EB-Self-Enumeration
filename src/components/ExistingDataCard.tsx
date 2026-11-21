import React from 'react';
import { Check, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  isValidMobile,
  isValidSeId,
  sanitizeMobile,
  sanitizeSeId,
  sanitizeUppercaseEnglish,
} from '../services/googleSheetsApi';
import { HouseholdRow } from '../types/census';

interface ExistingDataCardProps {
  rows: HouseholdRow[];
  hasExistingData: boolean;
  seIdOfEnumerator: string;
  timestamp: string;
  editingRowIds: Record<string, boolean>;
  onToggleEditRow: (rowId: string) => void;
  onChangeRow: (index: number, field: keyof HouseholdRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  showValidationErrors: boolean;
  disabled: boolean;
}

export const ExistingDataCard: React.FC<ExistingDataCardProps> = ({
  rows,
  hasExistingData,
  seIdOfEnumerator,
  timestamp,
  editingRowIds,
  onToggleEditRow,
  onChangeRow,
  onAddRow,
  onRemoveRow,
  showValidationErrors,
  disabled,
}) => {
  const indexedRows = rows.map((row, idx) => ({ row, idx }));
  const isSavedRow = (row: HouseholdRow) =>
    row.id.startsWith('existing-') || row.id.startsWith('saved-');

  const newUnsavedRows = hasExistingData
    ? indexedRows.filter(({ row }) => !isSavedRow(row))
    : [];
  const mobileExistingRows = hasExistingData
    ? indexedRows.filter(({ row }) => isSavedRow(row))
    : indexedRows;

  const renderMobileRowCard = (row: HouseholdRow, idx: number) => {
    const isEditing = !hasExistingData || Boolean(editingRowIds[row.id]);
    const isNewUnsavedRow = !isSavedRow(row);

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
      <div key={row.id || idx} className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-800">
            क्रम संख्या:{' '}
            <span className="font-mono-tabular text-teal-700">
              #{idx + 1}
            </span>
          </span>

          <div className="flex items-center gap-1.5">
            {hasExistingData && (
              <button
                type="button"
                onClick={() => onToggleEditRow(row.id)}
                disabled={disabled}
                aria-label={
                  isEditing
                    ? `Finish editing row ${idx + 1}`
                    : `Edit row ${idx + 1}`
                }
                className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                  isEditing
                    ? 'bg-teal-700 text-white hover:bg-teal-800'
                    : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
                }`}
              >
                {isEditing ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Done</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Edit</span>
                  </>
                )}
              </button>
            )}

            {isNewUnsavedRow && rows.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveRow(idx)}
                disabled={disabled}
                aria-label={`Remove row ${idx + 1}`}
                className="min-h-[38px] px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                मुखिया का नाम (प्रगनक को आवंटित EB के मुखिया){' '}
                <span className="text-red-600">*</span>
              </label>
              <input
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
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
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
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
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
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
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
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
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
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                स्व गणना दिनांक <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={row.seDate}
                disabled={disabled}
                onChange={(e) =>
                  onChangeRow(idx, 'seDate', e.target.value)
                }
                className={`w-full min-h-[44px] px-3.5 py-2 text-base font-mono-tabular bg-white border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                  dateInvalid ? 'border-red-500' : 'border-slate-300'
                }`}
              />
            </div>
          </div>
        ) : (
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
              <span>
                दिनांक:{' '}
                <strong className="font-mono-tabular text-slate-900">
                  {row.seDate || '—'}
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
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Add New Row button just above Existing Saved Data */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onAddRow}
          disabled={disabled}
          className="min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add New Row</span>
        </button>
      </div>

      {/* Mobile: New Row Form(s) displayed above Existing Saved Data */}
      {hasExistingData && newUnsavedRows.length > 0 && (
        <section
          aria-label="New Household Entry Form"
          className="md:hidden bg-white border border-teal-300 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-teal-200 bg-teal-50/60 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                New Row Entry
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {newUnsavedRows.length}{' '}
                {newUnsavedRows.length === 1 ? 'new row' : 'new rows'} added
                above saved data
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-200">
            {[...newUnsavedRows]
              .reverse()
              .map(({ row, idx }) => renderMobileRowCard(row, idx))}
          </div>
        </section>
      )}

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
                {hasExistingData
                  ? 'Existing Saved Data in Sheet'
                  : 'Household Self Enumeration Details'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {rows.length} {rows.length === 1 ? 'record' : 'records'}
                {seIdOfEnumerator ? ` · Enumerator SE ID: ${seIdOfEnumerator}` : ''}
                {timestamp ? ` · Last Submitted: ${timestamp}` : ''}
              </p>
            </div>
          </div>
          {hasExistingData && (
            <span className="text-xs font-semibold text-teal-800 whitespace-nowrap shrink-0">
              Update Mode Active
            </span>
          )}
        </div>

        {/* Mobile list / card view (< md) */}
        <div className="md:hidden divide-y divide-slate-200">
          {mobileExistingRows.map(({ row, idx }) =>
            renderMobileRowCard(row, idx)
          )}
        </div>

        {/* Desktop table view (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 align-top">
                <th className="py-3 px-3 whitespace-nowrap text-center">
                  क्रम संख्या
                </th>
                <th className="py-3 px-3 min-w-[180px]">
                  मुखिया का नाम (प्रगनक को आवंटित EB के मुखिया)
                </th>
                <th className="py-3 px-3 min-w-[150px]">पिता/पति का नाम</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">
                  मोबाइल नंबर
                </th>
                <th className="py-3 px-3 min-w-[180px]">
                  स्व गणना स्थल/ ग्राम (प्रगनक को आवंटित EB ग्राम का नाम)
                </th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[155px]">
                  स्व गणना आइडी(SE ID)
                </th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[140px]">
                  स्व गणना दिनांक
                </th>
                <th className="py-3 px-3 whitespace-nowrap text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-800">
              {rows.map((row, idx) => {
                const isEditing =
                  !hasExistingData || Boolean(editingRowIds[row.id]);
                const isNewUnsavedRow =
                  !row.id.startsWith('existing-') && !row.id.startsWith('saved-');

                const headInvalid =
                  showValidationErrors && !row.headName.trim();
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
                  <tr key={row.id || idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono-tabular font-medium text-center">
                      {idx + 1}
                    </td>

                    {isEditing ? (
                      <>
                        <td className="py-2.5 px-2.5">
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
                            className={`w-full min-h-[38px] px-2.5 py-1.5 text-sm uppercase bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                              headInvalid
                                ? 'border-red-500'
                                : 'border-slate-300'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-2.5">
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
                            className={`w-full min-h-[38px] px-2.5 py-1.5 text-sm uppercase bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                              fatherInvalid
                                ? 'border-red-500'
                                : 'border-slate-300'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-2.5">
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
                            className={`w-full min-h-[38px] px-2.5 py-1.5 text-sm font-mono-tabular bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                              mobileInvalid
                                ? 'border-red-500'
                                : 'border-slate-300'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-2.5">
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
                            className={`w-full min-h-[38px] px-2.5 py-1.5 text-sm uppercase bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                              villageInvalid
                                ? 'border-red-500'
                                : 'border-slate-300'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-2.5">
                          <input
                            type="text"
                            autoCapitalize="characters"
                            maxLength={12}
                            placeholder="P12345678945"
                            value={row.seId}
                            disabled={disabled}
                            onChange={(e) =>
                              onChangeRow(
                                idx,
                                'seId',
                                sanitizeSeId(e.target.value)
                              )
                            }
                            className={`w-full min-h-[38px] px-2.5 py-1.5 text-sm font-mono-tabular uppercase bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                              seIdInvalid
                                ? 'border-red-500'
                                : 'border-slate-300'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-2.5">
                          <input
                            type="date"
                            value={row.seDate}
                            disabled={disabled}
                            onChange={(e) =>
                              onChangeRow(idx, 'seDate', e.target.value)
                            }
                            className={`w-full min-h-[38px] px-2.5 py-1.5 text-sm font-mono-tabular bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 ${
                              dateInvalid
                                ? 'border-red-500'
                                : 'border-slate-300'
                            }`}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-3 font-medium">
                          {row.headName || '—'}
                        </td>
                        <td className="py-3 px-3">
                          {row.fatherHusbandName || '—'}
                        </td>
                        <td className="py-3 px-3 font-mono-tabular">
                          {row.mobileNumber || '—'}
                        </td>
                        <td className="py-3 px-3">
                          {row.villageSiteName || '—'}
                        </td>
                        <td className="py-3 px-3 font-mono-tabular font-medium">
                          {row.seId || '—'}
                        </td>
                        <td className="py-3 px-3 font-mono-tabular whitespace-nowrap">
                          {row.seDate || '—'}
                        </td>
                      </>
                    )}

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {hasExistingData && (
                          <button
                            type="button"
                            onClick={() => onToggleEditRow(row.id)}
                            disabled={disabled}
                            aria-label={
                              isEditing
                                ? `Finish editing row ${idx + 1}`
                                : `Edit row ${idx + 1}`
                            }
                            className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                              isEditing
                                ? 'bg-teal-700 text-white hover:bg-teal-800'
                                : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
                            }`}
                          >
                            {isEditing ? (
                              <>
                                <Check
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                                <span>Done</span>
                              </>
                            ) : (
                              <>
                                <Pencil
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                                <span>Edit</span>
                              </>
                            )}
                          </button>
                        )}

                        {isNewUnsavedRow && rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveRow(idx)}
                            disabled={disabled}
                            aria-label={`Remove row ${idx + 1}`}
                            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
