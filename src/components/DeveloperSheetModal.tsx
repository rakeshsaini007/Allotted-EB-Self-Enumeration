import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Table2,
  X,
} from 'lucide-react';
import { fetchDeveloperSheets } from '../services/googleSheetsApi';
import { SheetTabData } from '../types/census';

interface DeveloperSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEVELOPER_PASS = 'Admin@2026';

export const DeveloperSheetModal: React.FC<DeveloperSheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dataSheet, setDataSheet] = useState<SheetTabData | null>(null);
  const [masterSheet, setMasterSheet] = useState<SheetTabData | null>(null);

  const [activeTab, setActiveTab] = useState<'data' | 'master'>('data');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSheets = async (pass: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetchDeveloperSheets(pass);
      if (!res.success || !res.sheets) {
        setFetchError(
          res.message ||
            'Unable to fetch Google Sheets. Please redeploy google-apps-script/Code.gs.'
        );
        return;
      }
      setDataSheet(res.sheets.data);
      setMasterSheet(res.sheets.master);
    } catch (err) {
      setFetchError(
        err instanceof Error
          ? err.message
          : 'Failed to load Data and Master sheets.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (password !== DEVELOPER_PASS) {
      setAuthError('Invalid developer password. Access denied.');
      return;
    }

    setUnlocked(true);
    await loadSheets(password);
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    setAuthError(null);
    setFetchError(null);
    setUnlocked(false);
    setDataSheet(null);
    setMasterSheet(null);
    setSearchQuery('');
    onClose();
  };

  const activeSheet = activeTab === 'data' ? dataSheet : masterSheet;

  const filteredRows = useMemo(() => {
    if (!activeSheet) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeSheet.rows;
    return activeSheet.rows.filter((row) =>
      row.some((cell) => String(cell || '').toLowerCase().includes(q))
    );
  }, [activeSheet, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/55 backdrop-blur-xs"
    >
      <div
        className={`w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col ${
          unlocked ? 'max-w-6xl max-h-[90vh]' : 'max-w-md'
        }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              {unlocked ? (
                <Table2 className="w-5 h-5 text-teal-700" aria-hidden="true" />
              ) : (
                <Lock className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="developer-modal-title"
                className="text-base sm:text-lg font-semibold text-slate-900 truncate"
              >
                {unlocked
                  ? 'Developer Google Sheet Navigator'
                  : 'Developer Access Required'}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {unlocked
                  ? 'Navigate and inspect Data & Master Google Sheets'
                  : 'Restricted to App Developer only'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close developer dialog"
            className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        {!unlocked ? (
          <form onSubmit={handleUnlock} className="p-5 sm:p-6 space-y-5">
            <div>
              <label
                htmlFor="dev-password-input"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Developer Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="dev-password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Enter developer password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="w-full min-h-[48px] pl-4 pr-12 py-2.5 text-base bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {authError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
              >
                <AlertCircle
                  className="w-4 h-4 mt-0.5 shrink-0 text-red-600"
                  aria-hidden="true"
                />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Unlock Sheets
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Sheet Navigation Links & Controls */}
            <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* In-app sheet tab switcher */}
                <div
                  role="tablist"
                  aria-label="Google Sheet tabs"
                  className="inline-flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl self-start"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'data'}
                    onClick={() => setActiveTab('data')}
                    className={`min-h-[40px] px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'data'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Data Sheet
                    {dataSheet ? ` (${dataSheet.rows.length})` : ''}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'master'}
                    onClick={() => setActiveTab('master')}
                    className={`min-h-[40px] px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'master'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Master Sheet
                    {masterSheet ? ` (${masterSheet.rows.length})` : ''}
                  </button>
                </div>

                {/* Direct external Google Sheet tab navigation buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {dataSheet?.url && (
                    <a
                      href={dataSheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>Open "Data" Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  )}
                  {masterSheet?.url && (
                    <a
                      href={masterSheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>Open "Master" Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => loadSheets(password)}
                    disabled={loading}
                    aria-label="Refresh sheets"
                    className="min-h-[40px] px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Search bar */}
              {activeSheet && (
                <div className="relative">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder={`Search inside ${activeSheet.name} sheet...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-h-[42px] pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700"
                  />
                </div>
              )}
            </div>

            {/* Live Sheet Table Area */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-600">
                  <Loader2
                    className="w-7 h-7 text-teal-700 animate-spin"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">
                    Loading Data and Master sheets...
                  </p>
                </div>
              ) : fetchError ? (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-2"
                >
                  <p className="font-semibold">Unable to Load Live Sheet View</p>
                  <p className="text-xs leading-relaxed text-amber-800">
                    {fetchError}
                  </p>
                  <p className="text-xs text-amber-800">
                    Make sure you redeployed the updated{' '}
                    <code className="font-mono-tabular font-semibold">
                      google-apps-script/Code.gs
                    </code>{' '}
                    as a new Web App version in Google Apps Script.
                  </p>
                </div>
              ) : !activeSheet || activeSheet.headers.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No data available in this sheet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-auto max-h-[54vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap font-mono-tabular">
                          #
                        </th>
                        {activeSheet.headers.map((header, hIdx) => (
                          <th
                            key={`${header}-${hIdx}`}
                            className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap"
                          >
                            {header || `Col ${hIdx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={activeSheet.headers.length + 1}
                            className="py-8 text-center text-slate-500"
                          >
                            No matching rows found.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 border-r border-slate-200 font-mono-tabular text-slate-500">
                              {rIdx + 1}
                            </td>
                            {activeSheet.headers.map((_, cIdx) => (
                              <td
                                key={cIdx}
                                className="py-2 px-3 border-r border-slate-200 whitespace-nowrap font-mono-tabular"
                              >
                                {row[cIdx] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
