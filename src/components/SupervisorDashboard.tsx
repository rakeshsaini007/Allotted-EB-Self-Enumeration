import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  Loader2,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import { isValidSeId, sanitizeSeId } from '../services/googleSheetsApi';
import {
  SupervisorEnumeratorSummary,
  SupervisorRecord,
} from '../types/census';
import { generateSupervisorPdf } from '../utils/supervisorPdf';

interface SupervisorDashboardProps {
  supervisor: SupervisorRecord;
  enumerators: SupervisorEnumeratorSummary[];
  seIdOfSupervisor: string;
  onChangeSeIdOfSupervisor: (val: string) => void;
  hasExistingData: boolean;
  savedSupervisorSeId: string;
  lastTimestamp: string;
  showValidationErrors: boolean;
  submitError: string | null;
  submitting: boolean;
  successBanner: {
    mode: 'saved' | 'updated';
    message: string;
    timestamp?: string;
  } | null;
  onDismissBanner: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  supervisor,
  enumerators,
  seIdOfSupervisor,
  onChangeSeIdOfSupervisor,
  hasExistingData,
  savedSupervisorSeId,
  lastTimestamp,
  showValidationErrors,
  submitError,
  submitting,
  successBanner,
  onDismissBanner,
  onSubmit,
}) => {
  const isSeIdValid = isValidSeId(seIdOfSupervisor);
  const seIdDigitsCount = seIdOfSupervisor.startsWith('P')
    ? seIdOfSupervisor.length - 1
    : 0;

  const supervisorFields = [
    {
      label: 'SUPERVISORY CIRCLE NO',
      value: supervisor.supervisoryCircleNo,
      mono: true,
    },
    { label: 'Name of Supervisor', value: supervisor.nameOfSupervisor },
    {
      label: 'Mobile Number of Supervisor',
      value: supervisor.mobileNumberOfSupervisor,
      mono: true,
    },
    { label: 'DESIGNATION', value: supervisor.supervisorDesignation },
    { label: 'OFFICE NAME', value: supervisor.officeName },
    { label: 'Supervisor User ID', value: supervisor.supervisorUserId, mono: true },
  ];

  const totalGeneratedSeIds = enumerators.reduce(
    (sum, item) => sum + item.generatedCount,
    0
  );

  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);
    try {
      await generateSupervisorPdf({
        supervisor,
        enumerators,
        seIdOfSupervisor: seIdOfSupervisor.trim().toUpperCase(),
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-16"
    >
      {/* Success Notification Banner */}
      {successBanner && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="text-sm">
              <p className="font-semibold">
                {successBanner.mode === 'updated'
                  ? 'Data Updated Successfully'
                  : 'Data Saved Successfully'}
              </p>
              <p className="text-emerald-800 mt-0.5">
                {successBanner.message}
                {successBanner.timestamp
                  ? ` (Timestamp: ${successBanner.timestamp})`
                  : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissBanner}
            aria-label="Dismiss notification"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 1. Prefilled Supervisor & Circle Details (Read-Only) */}
      <section
        id="supervisor-details"
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Prefilled Supervisor & Circle Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auto-fetched from Master sheet · Circle{' '}
              {supervisor.supervisoryCircleNo} · {enumerators.length}{' '}
              {enumerators.length === 1 ? 'Enumerator' : 'Enumerators'} ·{' '}
              {totalGeneratedSeIds} Generated SE IDs
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
            Read-Only View
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {supervisorFields.map((item) => (
              <div
                key={item.label}
                className="pb-3 border-b border-slate-100 sm:border-b-0 sm:pb-0"
              >
                <dt className="text-xs text-slate-500">{item.label}</dt>
                <dd
                  className={`mt-1 text-sm font-semibold text-slate-900 break-words ${
                    item.mono ? 'font-mono-tabular' : ''
                  }`}
                >
                  {item.value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. Existing Supervisor SE ID Card (if already saved in Data sheet) */}
      {hasExistingData && savedSupervisorSeId && (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-teal-50/40">
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                className="w-5 h-5 text-teal-700 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Existing Saved SE ID of Supervisor
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  SE ID:{' '}
                  <strong className="font-mono-tabular text-slate-900">
                    {savedSupervisorSeId}
                  </strong>
                  {lastTimestamp ? ` · Last Updated: ${lastTimestamp}` : ''}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-teal-800 whitespace-nowrap shrink-0">
              Update Mode Active
            </span>
          </div>
        </section>
      )}

      {/* 3. Mandatory SE ID of Supervisor Input (Only editable field) */}
      <section
        id="supervisor-se-id"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
      >
        <div className="max-w-xl space-y-2">
          <label
            htmlFor="supervisor-se-id-input"
            className="block text-base font-semibold text-slate-900"
          >
            SE ID of Supervisor <span className="text-red-600">*</span>
          </label>

          <div className="pt-1">
            <input
              id="supervisor-se-id-input"
              type="text"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={12}
              placeholder="P12345678945"
              value={seIdOfSupervisor}
              disabled={submitting}
              onChange={(e) =>
                onChangeSeIdOfSupervisor(sanitizeSeId(e.target.value))
              }
              className={`w-full min-h-[48px] px-4 py-2.5 text-base font-mono-tabular uppercase bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 transition-colors ${
                showValidationErrors && !isSeIdValid
                  ? 'border-red-500'
                  : isSeIdValid
                  ? 'border-teal-600'
                  : 'border-slate-300'
              }`}
            />
          </div>

          <div className="flex items-center justify-end text-xs pt-0.5">
            <span className="font-mono-tabular text-slate-500">
              {seIdDigitsCount} / 11 digits
            </span>
          </div>
        </div>
      </section>

      {/* 4. Read-Only Enumerators Table (Matching Uploaded Image Layout) */}
      <section
        id="supervisor-enumerators-table"
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Enumerators Under Supervisory Circle{' '}
              <span className="font-mono-tabular">
                {supervisor.supervisoryCircleNo}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only summary · Total Enumerators:{' '}
              <span className="font-mono-tabular font-medium text-slate-700">
                {enumerators.length}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfGenerating || enumerators.length === 0}
            className="min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {pdfGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" aria-hidden="true" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>

        {enumerators.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No enumerators found for this Supervisory Circle.
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-200">
              {enumerators.map((item, idx) => (
                <div
                  key={`${item.ebNo}-${item.mobileNumber}-${idx}`}
                  className="p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        पर्यवेक्षण क्षेत्र में शामिल प्रगणकों के नाम
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {item.nameOfEnumerator || '—'}
                      </p>
                      <p className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                        EB NO: {item.ebNo || '—'} · Mob: {item.mobileNumber || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-[11px] text-slate-500">
                        प्रगणक की SE ID No.
                      </p>
                      <p className="mt-0.5 text-xs font-semibold font-mono-tabular text-slate-900 break-all">
                        {item.enumeratorSeId || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">
                        दैनिक रूप से जनरेट SE IDs संख्या
                      </p>
                      <p className="mt-0.5 text-sm font-bold font-mono-tabular text-teal-700">
                        {item.generatedCount}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-1.5">
                      जनरेट करायी गई SE IDs नम्बर
                    </p>
                    {item.generatedSeIds.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        No SE IDs generated yet
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-slate-50/50">
                        {item.generatedSeIds.map((seId, sIdx) => (
                          <div
                            key={`${seId}-${sIdx}`}
                            className="px-3 py-2 text-xs font-mono-tabular font-medium text-slate-900"
                          >
                            {seId}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop 4-Column Table View (md+) matching uploaded image */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300 text-xs font-semibold text-slate-800 align-top">
                    <th className="py-3.5 px-4 border-r border-slate-300 w-[26%]">
                      पर्यवेक्षण क्षेत्र में शामिल प्रगणकों के नाम
                    </th>
                    <th className="py-3.5 px-4 border-r border-slate-300 w-[22%]">
                      प्रगणक की SE ID No.
                    </th>
                    <th className="py-3.5 px-4 border-r border-slate-300 w-[24%]">
                      प्रगणक द्वारा दैनिक रूप से कितने व्यक्तियों की SE IDs जैनरेट करायी गई
                    </th>
                    <th className="py-3.5 px-4 w-[28%]">
                      जनरेट करायी गई SE IDs नम्बर
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-sm text-slate-900">
                  {enumerators.map((item, idx) => (
                    <tr
                      key={`${item.ebNo}-${item.mobileNumber}-${idx}`}
                      className="align-top hover:bg-slate-50/40"
                    >
                      <td className="py-3.5 px-4 border-r border-slate-300">
                        <div className="font-semibold text-slate-900">
                          {item.nameOfEnumerator || '—'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                          EB NO: {item.ebNo || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-300 font-mono-tabular font-medium">
                        {item.enumeratorSeId || '—'}
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-300 font-mono-tabular font-semibold">
                        {item.generatedCount}
                      </td>
                      <td className="p-0">
                        {item.generatedSeIds.length === 0 ? (
                          <div className="py-3.5 px-4 text-xs text-slate-400">
                            —
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-200">
                            {item.generatedSeIds.map((seId, sIdx) => (
                              <div
                                key={`${seId}-${sIdx}`}
                                className="py-2 px-4 font-mono-tabular text-xs font-medium text-slate-900"
                              >
                                {seId}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
        >
          <AlertCircle
            className="w-5 h-5 mt-0.5 shrink-0 text-red-600"
            aria-hidden="true"
          />
          <span>{submitError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 pt-2">

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto min-w-[200px] min-h-[48px] px-6 py-3 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white text-base font-semibold rounded-xl inline-flex items-center justify-center gap-2.5 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>
                {hasExistingData ? 'Updating Data...' : 'Saving Data...'}
              </span>
            </>
          ) : hasExistingData ? (
            <>
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Update</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>Submit</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
