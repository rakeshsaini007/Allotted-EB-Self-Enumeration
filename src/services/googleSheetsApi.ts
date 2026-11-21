import {
  GOOGLE_SCRIPT_URL,
  isGoogleScriptConfigured,
} from '../config/googleSheetConfig';
import {
  DeveloperSheetsResponse,
  HouseholdRow,
  LookupResponse,
  SaveDataPayload,
  SaveResponse,
  SaveSupervisorPayload,
  SupervisorLookupResponse,
} from '../types/census';

export const SE_ID_REGEX = /^P\d{11}$/;
export const MOBILE_REGEX = /^\d{10}$/;

/**
 * Sanitizes text input to strictly uppercase English alphabet and single spaces.
 */
export function sanitizeUppercaseEnglish(value: string): string {
  return value.toUpperCase().replace(/[^A-Z\s]/g, '');
}

/**
 * Sanitizes EB NO or Supervisory Circle No to uppercase alphanumeric characters.
 */
export function sanitizeEbNo(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Sanitizes Mobile Number to digits only, maximum 10 digits.
 */
export function sanitizeMobile(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

/**
 * Sanitizes SE ID so it starts with 'P' followed by up to 11 digits (total max 12 chars).
 */
export function sanitizeSeId(value: string): string {
  const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!upper) return '';

  if (upper[0] === 'P') {
    const digits = upper.slice(1).replace(/\D/g, '').slice(0, 11);
    return 'P' + digits;
  }

  const digitsOnly = upper.replace(/\D/g, '').slice(0, 11);
  return digitsOnly ? 'P' + digitsOnly : '';
}

export function isValidSeId(value: string): boolean {
  return SE_ID_REGEX.test(value.trim().toUpperCase());
}

export function isValidMobile(value: string): boolean {
  return MOBILE_REGEX.test(value.trim());
}

export function createEmptyHouseholdRow(serialIndex: number): HouseholdRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serialNo: String(serialIndex),
    headName: '',
    fatherHusbandName: '',
    mobileNumber: '',
    villageSiteName: '',
    seId: '',
    seDate: '',
  };
}

export async function lookupEnumerator(
  ebNo: string,
  mobile: string
): Promise<LookupResponse> {
  if (!isGoogleScriptConfigured()) {
    throw new Error(
      'Google Apps Script URL is not configured. Add your Web App URL in src/config/googleSheetConfig.ts.'
    );
  }

  const url = new URL(GOOGLE_SCRIPT_URL.trim());
  url.searchParams.set('action', 'lookup');
  url.searchParams.set('ebNo', ebNo.trim().toUpperCase());
  url.searchParams.set('mobile', mobile.trim());

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as LookupResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        'Request timed out. Please check your internet connection and try again.'
      );
    }
    throw err instanceof Error
      ? err
      : new Error('Unable to connect to Google Sheets service.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function lookupSupervisor(
  circleNo: string,
  mobile: string
): Promise<SupervisorLookupResponse> {
  if (!isGoogleScriptConfigured()) {
    throw new Error(
      'Google Apps Script URL is not configured. Add your Web App URL in src/config/googleSheetConfig.ts.'
    );
  }

  const url = new URL(GOOGLE_SCRIPT_URL.trim());
  url.searchParams.set('action', 'supervisorLookup');
  url.searchParams.set('circleNo', circleNo.trim().toUpperCase());
  url.searchParams.set('mobile', mobile.trim());

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as SupervisorLookupResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        'Request timed out. Please check your internet connection and try again.'
      );
    }
    throw err instanceof Error
      ? err
      : new Error('Unable to connect to Google Sheets service.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function saveOrUpdateData(
  payload: SaveDataPayload
): Promise<SaveResponse> {
  return postToScript({ ...payload, role: 'enumerator' });
}

export async function saveOrUpdateSupervisorData(
  payload: SaveSupervisorPayload
): Promise<SaveResponse> {
  return postToScript(payload);
}

async function postToScript(
  payload: SaveDataPayload | SaveSupervisorPayload
): Promise<SaveResponse> {
  if (!isGoogleScriptConfigured()) {
    throw new Error(
      'Google Apps Script URL is not configured. Add your Web App URL in src/config/googleSheetConfig.ts.'
    );
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL.trim(), {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Submission failed with status ${response.status}`);
    }

    return (await response.json()) as SaveResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        'Submission timed out. Please verify your connection and check the sheet.'
      );
    }
    throw err instanceof Error
      ? err
      : new Error('Unable to save data to Google Sheets.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchDeveloperSheets(
  password: string
): Promise<DeveloperSheetsResponse> {
  if (!isGoogleScriptConfigured()) {
    throw new Error(
      'Google Apps Script URL is not configured. Add your Web App URL in src/config/googleSheetConfig.ts.'
    );
  }

  const url = new URL(GOOGLE_SCRIPT_URL.trim());
  url.searchParams.set('action', 'developerSheets');
  url.searchParams.set('password', password);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as DeveloperSheetsResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        'Request timed out. Please check your internet connection and try again.'
      );
    }
    throw err instanceof Error
      ? err
      : new Error('Unable to connect to Google Sheets service.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}
