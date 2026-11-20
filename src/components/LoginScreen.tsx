import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { isGoogleScriptConfigured } from '../config/googleSheetConfig';
import {
  isValidMobile,
  sanitizeEbNo,
  sanitizeMobile,
} from '../services/googleSheetsApi';
import { UserRole } from '../types/census';

interface LoginScreenProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onLookup: (
    role: UserRole,
    primaryId: string,
    mobile: string
  ) => Promise<void>;
  loading: boolean;
  errorMessage: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  selectedRole,
  onSelectRole,
  onLookup,
  loading,
  errorMessage,
}) => {
  const [ebNo, setEbNo] = useState('');
  const [circleNo, setCircleNo] = useState('');
  const [mobile, setMobile] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isConfigured = isGoogleScriptConfigured();
  const isSupervisor = selectedRole === 'supervisor';

  const handleRoleSwitch = (role: UserRole) => {
    if (loading || role === selectedRole) return;
    setValidationError(null);
    onSelectRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const primaryId = (isSupervisor ? circleNo : ebNo).trim().toUpperCase();
    const cleanMobile = mobile.trim();

    if (!primaryId) {
      setValidationError(
        isSupervisor
          ? 'Please enter your SUPERVISORY CIRCLE NO.'
          : 'Please enter your assigned EB NO.'
      );
      return;
    }

    if (!isValidMobile(cleanMobile)) {
      setValidationError(
        isSupervisor
          ? 'Please enter a valid 10-digit Mobile Number of Supervisor.'
          : 'Please enter a valid 10-digit Mobile Number.'
      );
      return;
    }

    await onLookup(selectedRole, primaryId, cleanMobile);
  };

  const displayError = validationError || errorMessage;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Context Column */}
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-medium tracking-wide text-teal-700">
            Self Enumeration Portal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
            Self Enumeration SE ID Entry Form
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-xl">
            {isSupervisor
              ? 'Select Supervisor to view all assigned enumerators and their generated SE IDs for your Supervisory Circle, and submit your Supervisor SE ID.'
              : 'Select Enumerator and enter your assigned EB NO and registered mobile number to fetch your Master details and submit household records.'}
          </p>
        </div>

        {/* Right Verification Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Role Selection Buttons: Supervisor & Enumerator */}
            <div className="mb-6">
              <p className="text-xs font-medium text-slate-600 mb-2">
                Select Role
              </p>
              <div
                role="group"
                aria-label="Select portal role"
                className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('supervisor')}
                  disabled={loading}
                  aria-pressed={isSupervisor}
                  className={`min-h-[44px] px-3 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                    isSupervisor
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Supervisor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('enumerator')}
                  disabled={loading}
                  aria-pressed={!isSupervisor}
                  className={`min-h-[44px] px-3 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                    !isSupervisor
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Enumerator</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-5 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {isSupervisor
                    ? 'Open Supervisor Dashboard'
                    : 'Open Enumerator Form'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isSupervisor
                    ? 'Verify using SUPERVISORY CIRCLE NO and Mobile Number of Supervisor'
                    : 'Verify using EB NO and registered Mobile Number'}
                </p>
              </div>
            </div>

            {!isConfigured && (
              <div
                role="alert"
                className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-1.5"
              >
                <p className="font-semibold">
                  Google Apps Script URL Required
                </p>
                <p className="text-xs leading-relaxed text-amber-800">
                  Open{' '}
                  <code className="font-mono-tabular font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                    src/config/googleSheetConfig.ts
                  </code>{' '}
                  and paste your deployed Google Apps Script Web App URL.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              {isSupervisor ? (
                <div>
                  <label
                    htmlFor="login-circle-no"
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    SUPERVISORY CIRCLE NO{' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="login-circle-no"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    placeholder="E.G. 001"
                    value={circleNo}
                    onChange={(e) => {
                      setCircleNo(sanitizeEbNo(e.target.value));
                      if (validationError) setValidationError(null);
                    }}
                    disabled={loading}
                    className="w-full min-h-[48px] px-4 py-2.5 text-base font-mono-tabular uppercase bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 disabled:bg-slate-100 transition-colors"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Enter exact SUPERVISORY CIRCLE NO (e.g. 001)
                  </p>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="login-eb-no"
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    EB NO <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="login-eb-no"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    placeholder="E.G. 000101"
                    value={ebNo}
                    onChange={(e) => {
                      setEbNo(sanitizeEbNo(e.target.value));
                      if (validationError) setValidationError(null);
                    }}
                    disabled={loading}
                    className="w-full min-h-[48px] px-4 py-2.5 text-base font-mono-tabular uppercase bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 disabled:bg-slate-100 transition-colors"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Enter exact EB NO including leading zeros (e.g. 000101)
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="login-mobile"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  {isSupervisor
                    ? 'Mobile Number of Supervisor'
                    : 'Mobile Number'}{' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="login-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="10 DIGIT MOBILE NUMBER"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(sanitizeMobile(e.target.value));
                    if (validationError) setValidationError(null);
                  }}
                  disabled={loading}
                  className="w-full min-h-[48px] px-4 py-2.5 text-base font-mono-tabular bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 disabled:bg-slate-100 transition-colors"
                />
              </div>

              {displayError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
                >
                  <AlertCircle
                    className="w-4 h-4 mt-0.5 shrink-0 text-red-600"
                    aria-hidden="true"
                  />
                  <span>{displayError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] px-5 py-3 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>Fetching Details...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isSupervisor ? 'Open Supervisor Form' : 'Open Form'}
                    </span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
