import React from 'react';
import { Lock, LogOut } from 'lucide-react';
import { UserRole } from '../types/census';

interface DashboardHeaderProps {
  isAuthenticated: boolean;
  activeRole: UserRole;
  hasExistingData: boolean;
  onChangeUser: () => void;
  onOpenDeveloperModal: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isAuthenticated,
  activeRole,
  hasExistingData,
  onChangeUser,
  onOpenDeveloperModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Self Enumeration Portal
        </span>

        {/* Zone 2: Clean single-line navigation links */}
        {isAuthenticated ? (
          activeRole === 'supervisor' ? (
            <nav
              aria-label="Supervisor dashboard sections"
              className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
            >
              <a
                href="#supervisor-details"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Supervisor Info
              </a>
              <a
                href="#supervisor-se-id"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Supervisor SE ID
              </a>
              <a
                href="#supervisor-enumerators-table"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Enumerators Table
              </a>
            </nav>
          ) : (
            <nav
              aria-label="Enumerator dashboard sections"
              className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
            >
              <a
                href="#prefilled-details"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Details
              </a>
              {hasExistingData && (
                <a
                  href="#existing-record"
                  className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Saved Card
                </a>
              )}
              <a
                href="#se-id-section"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Enumerator SE ID
              </a>
              <a
                href="#household-table"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Household Table
              </a>
            </nav>
          )
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenDeveloperModal}
            aria-label="Developer Google Sheet Access"
            className="min-h-[40px] px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span className={isAuthenticated ? 'hidden sm:inline' : ''}>
              Sheets
            </span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={onChangeUser}
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>
                {activeRole === 'supervisor' ? 'Switch Circle' : 'Switch EB'}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
