import React from 'react';
import { MasterRecord } from '../types/census';

interface PrefilledDetailsCardProps {
  master: MasterRecord;
}

export const PrefilledDetailsCard: React.FC<PrefilledDetailsCardProps> = ({
  master,
}) => {
  const enumeratorFields = [
    { label: 'EB NO', value: master.ebNo, mono: true },
    {
      label: 'SUPERVISORY CIRCLE NO',
      value: master.supervisoryCircleNo,
      mono: true,
    },
    { label: 'Name of Enumerator', value: master.nameOfEnumerator },
    { label: 'Mobile Number', value: master.mobileNumber, mono: true },
    { label: 'SEX', value: master.sex },
    { label: 'POST', value: master.post },
    { label: 'DESIGNATION', value: master.enumeratorDesignation },
    { label: 'Enumerator User ID', value: master.enumeratorUserId, mono: true },
  ];

  const supervisorFields = [
    { label: 'Name of Supervisor', value: master.nameOfSupervisor },
    {
      label: 'Mobile Number of Supervisor',
      value: master.mobileNumberOfSupervisor,
      mono: true,
    },
    { label: 'Supervisor DESIGNATION', value: master.supervisorDesignation },
    { label: 'OFFICE NAME', value: master.officeName },
    { label: 'Supervisor User ID', value: master.supervisorUserId, mono: true },
  ];

  return (
    <section
      id="prefilled-details"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            Prefilled Enumerator & Supervisor Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-fetched from Master sheet · EB NO {master.ebNo} · Circle{' '}
            {master.supervisoryCircleNo}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Enumerator Section */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 tracking-wide mb-3">
            Enumerator Information
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
            {enumeratorFields.map((item) => (
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

        {/* Hairline Divider */}
        <div className="border-t border-slate-200" />

        {/* Supervisor Section */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 tracking-wide mb-3">
            Supervisor & Office Information
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-4">
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
      </div>
    </section>
  );
};
