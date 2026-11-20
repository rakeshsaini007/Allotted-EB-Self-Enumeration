import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  mode: 'saved' | 'updated';
  message: string;
  timestamp?: string;
  rowCount?: number;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  mode,
  message,
  timestamp,
  rowCount,
  onClose,
}) => {
  if (!isOpen) return null;

  const title =
    mode === 'updated'
      ? 'Data Updated Successfully'
      : 'Data Saved Successfully';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="alert-modal-title"
                className="text-lg font-semibold text-slate-900"
              >
                {title}
              </h3>
              <p className="text-xs text-slate-500">
                Google Sheet · Data Tab
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close alert"
            className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-700 leading-relaxed">{message}</p>

        {(timestamp || rowCount !== undefined) && (
          <dl className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            {rowCount !== undefined && (
              <div>
                <dt className="text-slate-500">Rows Synced</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 font-mono-tabular">
                  {rowCount}
                </dd>
              </div>
            )}
            {timestamp && (
              <div>
                <dt className="text-slate-500">Timestamp</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 font-mono-tabular">
                  {timestamp}
                </dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
