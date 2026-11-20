import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import { AlertModal } from './components/AlertModal';
import { DashboardHeader } from './components/DashboardHeader';
import { ExistingDataCard } from './components/ExistingDataCard';
import { HouseholdTable } from './components/HouseholdTable';
import { LoginScreen } from './components/LoginScreen';
import { PrefilledDetailsCard } from './components/PrefilledDetailsCard';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import {
  createEmptyHouseholdRow,
  isValidMobile,
  isValidSeId,
  lookupEnumerator,
  lookupSupervisor,
  sanitizeSeId,
  saveOrUpdateData,
  saveOrUpdateSupervisorData,
} from './services/googleSheetsApi';
import {
  HouseholdRow,
  MasterRecord,
  SupervisorEnumeratorSummary,
  SupervisorRecord,
  UserRole,
} from './types/census';

export default function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('enumerator');

  // Enumerator state
  const [master, setMaster] = useState<MasterRecord | null>(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [existingRows, setExistingRows] = useState<HouseholdRow[]>([]);
  const [seIdOfEnumerator, setSeIdOfEnumerator] = useState('');
  const [rows, setRows] = useState<HouseholdRow[]>([createEmptyHouseholdRow(1)]);

  // Supervisor state
  const [supervisor, setSupervisor] = useState<SupervisorRecord | null>(null);
  const [supervisorEnumerators, setSupervisorEnumerators] = useState<
    SupervisorEnumeratorSummary[]
  >([]);
  const [seIdOfSupervisor, setSeIdOfSupervisor] = useState('');
  const [savedSupervisorSeId, setSavedSupervisorSeId] = useState('');
  const [hasExistingSupervisorData, setHasExistingSupervisorData] =
    useState(false);

  // Shared UI state
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<string>('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [successBanner, setSuccessBanner] = useState<{
    mode: 'saved' | 'updated';
    message: string;
    timestamp?: string;
  } | null>(null);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    mode: 'saved' | 'updated';
    message: string;
    timestamp?: string;
    rowCount?: number;
  }>({
    isOpen: false,
    mode: 'saved',
    message: '',
  });

  const isAuthenticated = Boolean(master || supervisor);
  const isSeIdValid = isValidSeId(seIdOfEnumerator);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setLookupError(null);
    setSubmitError(null);
  };

  const handleLookup = async (
    role: UserRole,
    primaryId: string,
    mobile: string
  ) => {
    setLookupLoading(true);
    setLookupError(null);
    setSubmitError(null);
    setSuccessBanner(null);

    try {
      if (role === 'supervisor') {
        const res = await lookupSupervisor(primaryId, mobile);
        if (!res.success || !res.supervisor) {
          setLookupError(
            res.message ||
              'No supervisor found matching this SUPERVISORY CIRCLE NO and Mobile Number of Supervisor.'
          );
          return;
        }

        const supSe = (res.seIdOfSupervisor || '').toUpperCase();
        setSupervisor(res.supervisor);
        setSupervisorEnumerators(res.enumerators || []);
        setSeIdOfSupervisor(supSe);
        setSavedSupervisorSeId(supSe);
        setHasExistingSupervisorData(
          Boolean(res.hasExistingData && supSe.length > 0)
        );
        setLastTimestamp(res.timestamp || '');
        setShowValidationErrors(false);
      } else {
        const res = await lookupEnumerator(primaryId, mobile);
        if (!res.success || !res.master) {
          setLookupError(
            res.message ||
              'No enumerator found matching this EB NO and Mobile Number.'
          );
          return;
        }

        setMaster(res.master);

        const fetchedRows: HouseholdRow[] = (res.existingRows || []).map(
          (item, idx) => ({
            id: `existing-${idx}-${Date.now()}`,
            serialNo: String(idx + 1),
            headName: (item.headName || '').toUpperCase(),
            fatherHusbandName: (item.fatherHusbandName || '').toUpperCase(),
            mobileNumber: item.mobileNumber || '',
            villageSiteName: (item.villageSiteName || '').toUpperCase(),
            seId: (item.seId || '').toUpperCase(),
            seDate: item.seDate || '',
          })
        );

        const hasData = Boolean(res.hasExistingData && fetchedRows.length > 0);
        setHasExistingData(hasData);
        setExistingRows(fetchedRows);
        setLastTimestamp(res.timestamp || '');
        setSeIdOfEnumerator((res.seIdOfEnumerator || '').toUpperCase());
        setRows(hasData ? fetchedRows : [createEmptyHouseholdRow(1)]);
        setShowValidationErrors(false);
      }
    } catch (err) {
      setLookupError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch details from Google Sheets.'
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSwitchUser = () => {
    setMaster(null);
    setHasExistingData(false);
    setExistingRows([]);
    setSeIdOfEnumerator('');
    setRows([createEmptyHouseholdRow(1)]);

    setSupervisor(null);
    setSupervisorEnumerators([]);
    setSeIdOfSupervisor('');
    setSavedSupervisorSeId('');
    setHasExistingSupervisorData(false);

    setLastTimestamp('');
    setShowValidationErrors(false);
    setSubmitError(null);
    setLookupError(null);
    setSuccessBanner(null);
  };

  const handleRowChange = (
    index: number,
    field: keyof HouseholdRow,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
    if (submitError) setSubmitError(null);
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyHouseholdRow(prev.length + 1)]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev
        .filter((_, i) => i !== index)
        .map((row, idx) => ({ ...row, serialNo: String(idx + 1) }));
    });
  };

  const validateEnumeratorAll = (): string | null => {
    if (!isValidSeId(seIdOfEnumerator)) {
      return 'SE ID of Enumerator is mandatory and must start with "P" followed by exact 11 digits (e.g. P12345678945).';
    }

    if (rows.length === 0) {
      return 'Please add at least one household entry row.';
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;
      if (!r.headName.trim()) {
        return `Row ${rowNum}: मुखिया का नाम is required (uppercase English letters).`;
      }
      if (!r.fatherHusbandName.trim()) {
        return `Row ${rowNum}: पिता/पति का नाम is required (uppercase English letters).`;
      }
      if (!isValidMobile(r.mobileNumber)) {
        return `Row ${rowNum}: मोबाइल नंबर must be an exact 10-digit number.`;
      }
      if (!r.villageSiteName.trim()) {
        return `Row ${rowNum}: स्व गणना स्थल/ ग्राम is required (uppercase English letters).`;
      }
      if (!isValidSeId(r.seId)) {
        return `Row ${rowNum}: स्व गणना आइडी(SE ID) must start with "P" followed by exact 11 digits.`;
      }
      if (!r.seDate.trim()) {
        return `Row ${rowNum}: स्व गणना दिनांक is required.`;
      }
    }

    return null;
  };

  const handleEnumeratorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!master) return;

    setShowValidationErrors(true);
    setSubmitError(null);

    const validationMsg = validateEnumeratorAll();
    if (validationMsg) {
      setSubmitError(validationMsg);
      return;
    }

    setSubmitting(true);
    try {
      const normalizedRows = rows.map((r, idx) => ({
        serialNo: String(idx + 1),
        headName: r.headName.trim().toUpperCase(),
        fatherHusbandName: r.fatherHusbandName.trim().toUpperCase(),
        mobileNumber: r.mobileNumber.trim(),
        villageSiteName: r.villageSiteName.trim().toUpperCase(),
        seId: r.seId.trim().toUpperCase(),
        seDate: r.seDate.trim(),
      }));

      const res = await saveOrUpdateData({
        master,
        seIdOfEnumerator: seIdOfEnumerator.trim().toUpperCase(),
        rows: normalizedRows,
      });

      if (!res.success) {
        setSubmitError(res.message || 'Unable to save data to Google Sheet.');
        return;
      }

      const mode: 'saved' | 'updated' =
        res.mode === 'updated' || hasExistingData ? 'updated' : 'saved';
      const syncedRows: HouseholdRow[] = normalizedRows.map((item, idx) => ({
        id: `saved-${idx}-${Date.now()}`,
        ...item,
      }));

      setHasExistingData(true);
      setExistingRows(syncedRows);
      setRows(syncedRows);
      if (res.timestamp) {
        setLastTimestamp(res.timestamp);
      }

      const successText =
        mode === 'updated'
          ? `Your ${normalizedRows.length} household record(s) for EB NO ${master.ebNo} have been updated in the Data sheet.`
          : `Your ${normalizedRows.length} household record(s) for EB NO ${master.ebNo} have been saved in the Data sheet.`;

      setSuccessBanner({
        mode,
        message: successText,
        timestamp: res.timestamp,
      });

      setAlertModal({
        isOpen: true,
        mode,
        message: successText,
        timestamp: res.timestamp,
        rowCount: res.rowCount ?? normalizedRows.length,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'An error occurred while saving to Google Sheets.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupervisorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisor) return;

    setShowValidationErrors(true);
    setSubmitError(null);

    if (!isValidSeId(seIdOfSupervisor)) {
      setSubmitError(
        'SE ID of Supervisor is mandatory and must start with "P" followed by exact 11 digits (e.g. P12345678945).'
      );
      return;
    }

    setSubmitting(true);
    try {
      const cleanSupSeId = seIdOfSupervisor.trim().toUpperCase();
      const res = await saveOrUpdateSupervisorData({
        role: 'supervisor',
        supervisor,
        seIdOfSupervisor: cleanSupSeId,
      });

      if (!res.success) {
        setSubmitError(res.message || 'Unable to save Supervisor SE ID.');
        return;
      }

      const mode: 'saved' | 'updated' =
        res.mode === 'updated' || hasExistingSupervisorData
          ? 'updated'
          : 'saved';

      setHasExistingSupervisorData(true);
      setSavedSupervisorSeId(cleanSupSeId);
      if (res.timestamp) {
        setLastTimestamp(res.timestamp);
      }

      const successText =
        mode === 'updated'
          ? `SE ID of Supervisor (${cleanSupSeId}) for Circle ${supervisor.supervisoryCircleNo} has been updated in the Data sheet.`
          : `SE ID of Supervisor (${cleanSupSeId}) for Circle ${supervisor.supervisoryCircleNo} has been saved in the Data sheet.`;

      setSuccessBanner({
        mode,
        message: successText,
        timestamp: res.timestamp,
      });

      setAlertModal({
        isOpen: true,
        mode,
        message: successText,
        timestamp: res.timestamp,
        rowCount: res.rowCount,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'An error occurred while saving Supervisor SE ID.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const seIdDigitsCount = seIdOfEnumerator.startsWith('P')
    ? seIdOfEnumerator.length - 1
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <DashboardHeader
        isAuthenticated={isAuthenticated}
        activeRole={selectedRole}
        hasExistingData={
          selectedRole === 'supervisor'
            ? hasExistingSupervisorData
            : hasExistingData
        }
        onChangeUser={handleSwitchUser}
      />

      <main className="flex-1">
        {!isAuthenticated ? (
          <LoginScreen
            selectedRole={selectedRole}
            onSelectRole={handleSelectRole}
            onLookup={handleLookup}
            loading={lookupLoading}
            errorMessage={lookupError}
          />
        ) : supervisor ? (
          <SupervisorDashboard
            supervisor={supervisor}
            enumerators={supervisorEnumerators}
            seIdOfSupervisor={seIdOfSupervisor}
            onChangeSeIdOfSupervisor={(val) => {
              setSeIdOfSupervisor(val);
              if (submitError) setSubmitError(null);
            }}
            hasExistingData={hasExistingSupervisorData}
            savedSupervisorSeId={savedSupervisorSeId}
            lastTimestamp={lastTimestamp}
            showValidationErrors={showValidationErrors}
            submitError={submitError}
            submitting={submitting}
            successBanner={successBanner}
            onDismissBanner={() => setSuccessBanner(null)}
            onSubmit={handleSupervisorSubmit}
          />
        ) : master ? (
          <form
            onSubmit={handleEnumeratorSubmit}
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
                  onClick={() => setSuccessBanner(null)}
                  aria-label="Dismiss notification"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* 1. Prefilled Master Data */}
            <PrefilledDetailsCard master={master} />

            {/* 2. Existing Data Card (if already saved in Data sheet) */}
            {hasExistingData && (
              <ExistingDataCard
                rows={existingRows}
                seIdOfEnumerator={seIdOfEnumerator}
                timestamp={lastTimestamp}
              />
            )}

            {/* 3. Mandatory SE ID of Enumerator */}
            <section
              id="se-id-section"
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
            >
              <div className="max-w-xl space-y-2">
                <label
                  htmlFor="enumerator-se-id"
                  className="block text-base font-semibold text-slate-900"
                >
                  SE ID of Enumerator <span className="text-red-600">*</span>
                </label>

                <div className="pt-1">
                  <input
                    id="enumerator-se-id"
                    type="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    maxLength={12}
                    placeholder="P12345678945"
                    value={seIdOfEnumerator}
                    disabled={submitting}
                    onChange={(e) => {
                      setSeIdOfEnumerator(sanitizeSeId(e.target.value));
                      if (submitError) setSubmitError(null);
                    }}
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

            {/* 4. Conditional Table (only displayed after entering valid SE ID of Enumerator) */}
            {isSeIdValid && (
              <>
                <HouseholdTable
                  rows={rows}
                  onChangeRow={handleRowChange}
                  onAddRow={handleAddRow}
                  onRemoveRow={handleRemoveRow}
                  showValidationErrors={showValidationErrors}
                  disabled={submitting}
                />

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

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-slate-500">
                    Saving to sheet{' '}
                    <span className="font-semibold text-slate-700">Data</span>{' '}
                    with automatic Timestamp in the final column.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto min-w-[200px] min-h-[48px] px-6 py-3 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white text-base font-semibold rounded-xl inline-flex items-center justify-center gap-2.5 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          className="w-5 h-5 animate-spin"
                          aria-hidden="true"
                        />
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
              </>
            )}
          </form>
        ) : null}
      </main>

      {/* Submission Loading Overlay */}
      {submitting && (
        <div
          aria-live="assertive"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-lg flex items-center gap-3.5">
            <Loader2
              className="w-6 h-6 text-teal-700 animate-spin shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {(selectedRole === 'supervisor'
                  ? hasExistingSupervisorData
                  : hasExistingData)
                  ? 'Updating Data Sheet...'
                  : 'Submitting to Data Sheet...'}
              </p>
              <p className="text-xs text-slate-500">
                Please wait while records and timestamp are saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save / Update Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        mode={alertModal.mode}
        message={alertModal.message}
        timestamp={alertModal.timestamp}
        rowCount={alertModal.rowCount}
        onClose={() =>
          setAlertModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />
    </div>
  );
}
