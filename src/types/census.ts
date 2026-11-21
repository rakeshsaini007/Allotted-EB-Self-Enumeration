export type UserRole = 'enumerator' | 'supervisor';

export interface MasterRecord {
  ebNo: string;
  mobileNumber: string;
  nameOfEnumerator: string;
  supervisoryCircleNo: string;
  sex: string;
  post: string;
  enumeratorDesignation: string;
  enumeratorUserId: string;
  nameOfSupervisor: string;
  mobileNumberOfSupervisor: string;
  supervisorDesignation: string;
  officeName: string;
  supervisorUserId: string;
}

export interface HouseholdRow {
  id: string;
  serialNo: string;
  headName: string;
  fatherHusbandName: string;
  mobileNumber: string;
  villageSiteName: string;
  seId: string;
  seDate: string;
}

export interface LookupResponse {
  success: boolean;
  message?: string;
  master?: MasterRecord;
  hasExistingData?: boolean;
  seIdOfEnumerator?: string;
  timestamp?: string;
  existingRows?: Array<{
    serialNo: string;
    headName: string;
    fatherHusbandName: string;
    mobileNumber: string;
    villageSiteName: string;
    seId: string;
    seDate: string;
  }>;
}

export interface SaveDataPayload {
  role?: 'enumerator';
  master: MasterRecord;
  seIdOfEnumerator: string;
  rows: Array<{
    serialNo: string;
    headName: string;
    fatherHusbandName: string;
    mobileNumber: string;
    villageSiteName: string;
    seId: string;
    seDate: string;
  }>;
}

export interface SupervisorRecord {
  supervisoryCircleNo: string;
  nameOfSupervisor: string;
  mobileNumberOfSupervisor: string;
  supervisorDesignation: string;
  officeName: string;
  supervisorUserId: string;
}

export interface GeneratedSeIdEntry {
  seId: string;
  seDate: string;
}

export interface SupervisorEnumeratorSummary {
  ebNo: string;
  mobileNumber: string;
  nameOfEnumerator: string;
  enumeratorUserId: string;
  enumeratorSeId: string;
  generatedCount: number;
  generatedSeIds: string[];
  generatedSeIdEntries?: GeneratedSeIdEntry[];
}

export interface SupervisorLookupResponse {
  success: boolean;
  message?: string;
  supervisor?: SupervisorRecord;
  hasExistingData?: boolean;
  seIdOfSupervisor?: string;
  timestamp?: string;
  enumerators?: SupervisorEnumeratorSummary[];
}

export interface SaveSupervisorPayload {
  role: 'supervisor';
  supervisor: SupervisorRecord;
  seIdOfSupervisor: string;
}

export interface SaveResponse {
  success: boolean;
  mode?: 'saved' | 'updated';
  message: string;
  timestamp?: string;
  rowCount?: number;
}

export interface SheetTabData {
  name: string;
  gid: number | null;
  url: string;
  headers: string[];
  rows: string[][];
}

export interface DeveloperSheetsResponse {
  success: boolean;
  message?: string;
  spreadsheetUrl?: string;
  sheets?: {
    data: SheetTabData;
    master: SheetTabData;
  };
}
