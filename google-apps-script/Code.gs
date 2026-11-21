/**
 * Google Apps Script Backend for Self Enumeration Data Portal
 * Sheet names required: "Master" and "Data"
 *
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 */

var MASTER_SHEET_NAME = 'Master';
var DATA_SHEET_NAME = 'Data';

function normalizeKey(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().toUpperCase();
}

function normalizeEb(val) {
  return normalizeKey(val);
}

function normalizeEbLoose(val) {
  var s = normalizeKey(val);
  if (/^\d+$/.test(s)) {
    return s.replace(/^0+/, '') || '0';
  }
  return s;
}

function normalizeMobile(val) {
  var s = String(val === null || val === undefined ? '' : val).trim();
  s = s.replace(/\D/g, '');
  if (s.length > 10) {
    s = s.slice(-10);
  }
  return s;
}

function formatCellAsText(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function formatDateValue(val) {
  if (val === null || val === undefined || val === '') return '';
  if (
    Object.prototype.toString.call(val) === '[object Date]' &&
    !isNaN(val.getTime())
  ) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val).trim();
}

function formatTimestampValue(val) {
  if (val === null || val === undefined || val === '') return '';
  if (
    Object.prototype.toString.call(val) === '[object Date]' &&
    !isNaN(val.getTime())
  ) {
    return Utilities.formatDate(
      val,
      Session.getScriptTimeZone(),
      'dd-MM-yyyy HH:mm:ss'
    );
  }
  return String(val).trim();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Ensures "SE ID of Enumerator", "SE ID of Supervisor", and "Timestamp" columns exist
 * at the end of "Data" sheet, keeping "Timestamp" as the very last column.
 */
function ensureDataExtraColumns(dataSheet) {
  var lastCol = Math.max(dataSheet.getLastColumn(), 20);
  var headers = dataSheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var seIdEnumColIndex = -1;
  var seIdSupColIndex = -1;
  var timestampColIndex = -1;

  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').trim().toLowerCase();
    if (h === 'se id of enumerator' || h === 'enumerator se id') {
      seIdEnumColIndex = i;
    } else if (h === 'se id of supervisor' || h === 'supervisor se id') {
      seIdSupColIndex = i;
    } else if (
      h === 'timestamp' ||
      h === 'submitted timestamp' ||
      h === 'date and time'
    ) {
      timestampColIndex = i;
    }
  }

  // Ensure SE ID of Enumerator exists
  if (seIdEnumColIndex === -1) {
    if (timestampColIndex !== -1) {
      dataSheet.insertColumnBefore(timestampColIndex + 1);
      seIdEnumColIndex = timestampColIndex;
      timestampColIndex++;
    } else {
      seIdEnumColIndex = Math.max(20, dataSheet.getLastColumn());
    }
    dataSheet.getRange(1, seIdEnumColIndex + 1).setValue('SE ID of Enumerator');
  }

  // Ensure SE ID of Supervisor exists before Timestamp
  if (seIdSupColIndex === -1) {
    if (timestampColIndex !== -1) {
      dataSheet.insertColumnBefore(timestampColIndex + 1);
      seIdSupColIndex = timestampColIndex;
      timestampColIndex++;
    } else {
      seIdSupColIndex = Math.max(21, dataSheet.getLastColumn());
    }
    dataSheet.getRange(1, seIdSupColIndex + 1).setValue('SE ID of Supervisor');
  }

  // Ensure Timestamp exists as the last column
  if (timestampColIndex === -1) {
    timestampColIndex = Math.max(22, dataSheet.getLastColumn());
    dataSheet.getRange(1, timestampColIndex + 1).setValue('Timestamp');
  }

  return {
    seIdColIndex: seIdEnumColIndex,
    seIdSupColIndex: seIdSupColIndex,
    timestampColIndex: timestampColIndex,
    totalCols: Math.max(dataSheet.getLastColumn(), timestampColIndex + 1)
  };
}

/**
 * GET Handler:
 * - ?action=lookup&ebNo=...&mobile=...
 * - ?action=supervisorLookup&circleNo=...&mobile=...
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'lookup';

    if (action === 'lookup') {
      return handleEnumeratorLookup(params);
    }
    if (action === 'supervisorLookup') {
      return handleSupervisorLookup(params);
    }
    if (action === 'developerSheets') {
      return handleDeveloperSheets(params);
    }

    return jsonResponse({ success: false, message: 'Unknown action.' });
  } catch (err) {
    return jsonResponse({
      success: false,
      message: 'Server error: ' + err.message
    });
  }
}

function handleEnumeratorLookup(params) {
  var inputEb = normalizeEb(params.ebNo);
  var inputEbLoose = normalizeEbLoose(params.ebNo);
  var inputMobile = normalizeMobile(params.mobile);

  if (!inputEb || !inputMobile) {
    return jsonResponse({
      success: false,
      message: 'EB NO and Mobile Number are required.'
    });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);
  var dataSheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!masterSheet) {
    return jsonResponse({
      success: false,
      message: 'Sheet "' + MASTER_SHEET_NAME + '" not found.'
    });
  }

  var masterLastRow = masterSheet.getLastRow();
  var masterRecord = null;

  if (masterLastRow >= 2) {
    var masterValues = masterSheet
      .getRange(2, 1, masterLastRow - 1, Math.max(13, masterSheet.getLastColumn()))
      .getDisplayValues();

    for (var i = 0; i < masterValues.length; i++) {
      var row = masterValues[i];
      var rowEb = normalizeEb(row[0]);
      var rowEbLoose = normalizeEbLoose(row[0]);
      var rowMobile = normalizeMobile(row[1]);

      if ((rowEb === inputEb || rowEbLoose === inputEbLoose) && rowMobile === inputMobile) {
        masterRecord = {
          ebNo: formatCellAsText(row[0]),
          mobileNumber: normalizeMobile(row[1]) || formatCellAsText(row[1]),
          nameOfEnumerator: formatCellAsText(row[2]).toUpperCase(),
          supervisoryCircleNo: formatCellAsText(row[3]),
          sex: formatCellAsText(row[4]).toUpperCase(),
          post: formatCellAsText(row[5]).toUpperCase(),
          enumeratorDesignation: formatCellAsText(row[6]).toUpperCase(),
          enumeratorUserId: formatCellAsText(row[7]),
          nameOfSupervisor: formatCellAsText(row[8]).toUpperCase(),
          mobileNumberOfSupervisor:
            normalizeMobile(row[9]) || formatCellAsText(row[9]),
          supervisorDesignation: formatCellAsText(row[10]).toUpperCase(),
          officeName: formatCellAsText(row[11]).toUpperCase(),
          supervisorUserId: formatCellAsText(row[12])
        };
        break;
      }
    }
  }

  var existingRows = [];
  var seIdOfEnumerator = '';
  var lastTimestamp = '';

  if (dataSheet && dataSheet.getLastRow() >= 2) {
    var colInfo = ensureDataExtraColumns(dataSheet);
    var dataLastRow = dataSheet.getLastRow();
    var dataDisplay = dataSheet
      .getRange(2, 1, dataLastRow - 1, colInfo.totalCols)
      .getDisplayValues();
    var dataRaw = dataSheet
      .getRange(2, 1, dataLastRow - 1, colInfo.totalCols)
      .getValues();

    for (var r = 0; r < dataDisplay.length; r++) {
      var dRow = dataDisplay[r];
      var dRaw = dataRaw[r];
      var dEb = normalizeEb(dRow[8]);
      var dEbLoose = normalizeEbLoose(dRow[8]);
      var dMobile = normalizeMobile(dRow[10]);

      if ((dEb === inputEb || dEbLoose === inputEbLoose) && dMobile === inputMobile) {
        if (!masterRecord) {
          masterRecord = {
            supervisoryCircleNo: formatCellAsText(dRow[7]),
            ebNo: formatCellAsText(dRow[8]),
            nameOfEnumerator: formatCellAsText(dRow[9]).toUpperCase(),
            mobileNumber: normalizeMobile(dRow[10]) || formatCellAsText(dRow[10]),
            sex: formatCellAsText(dRow[11]).toUpperCase(),
            post: formatCellAsText(dRow[12]).toUpperCase(),
            enumeratorDesignation: formatCellAsText(dRow[13]).toUpperCase(),
            enumeratorUserId: formatCellAsText(dRow[14]),
            nameOfSupervisor: formatCellAsText(dRow[15]).toUpperCase(),
            mobileNumberOfSupervisor:
              normalizeMobile(dRow[16]) || formatCellAsText(dRow[16]),
            supervisorDesignation: formatCellAsText(dRow[17]).toUpperCase(),
            officeName: formatCellAsText(dRow[18]).toUpperCase(),
            supervisorUserId: formatCellAsText(dRow[19])
          };
        }

        var hasUserFilledData =
          formatCellAsText(dRow[1]) !== '' ||
          formatCellAsText(dRow[2]) !== '' ||
          formatCellAsText(dRow[3]) !== '' ||
          formatCellAsText(dRow[4]) !== '' ||
          formatCellAsText(dRow[5]) !== '' ||
          formatCellAsText(dRow[6]) !== '';

        var rowSeId = formatCellAsText(dRow[colInfo.seIdColIndex]).toUpperCase();
        if (rowSeId && !seIdOfEnumerator) {
          seIdOfEnumerator = rowSeId;
        }

        var rowTs =
          formatTimestampValue(dRaw[colInfo.timestampColIndex]) ||
          formatCellAsText(dRow[colInfo.timestampColIndex]);
        if (rowTs) {
          lastTimestamp = rowTs;
        }

        if (hasUserFilledData) {
          existingRows.push({
            serialNo: formatCellAsText(dRow[0]) || String(existingRows.length + 1),
            headName: formatCellAsText(dRow[1]).toUpperCase(),
            fatherHusbandName: formatCellAsText(dRow[2]).toUpperCase(),
            mobileNumber: normalizeMobile(dRow[3]) || formatCellAsText(dRow[3]),
            villageSiteName: formatCellAsText(dRow[4]).toUpperCase(),
            seId: formatCellAsText(dRow[5]).toUpperCase(),
            seDate: formatDateValue(dRaw[6]) || formatCellAsText(dRow[6])
          });
        }
      }
    }
  }

  if (!masterRecord) {
    return jsonResponse({
      success: false,
      message: 'No enumerator found matching this EB NO and Mobile Number.'
    });
  }

  return jsonResponse({
    success: true,
    master: masterRecord,
    hasExistingData: existingRows.length > 0,
    seIdOfEnumerator: seIdOfEnumerator,
    timestamp: lastTimestamp,
    existingRows: existingRows
  });
}

function handleSupervisorLookup(params) {
  var inputCircle = normalizeEb(params.circleNo);
  var inputCircleLoose = normalizeEbLoose(params.circleNo);
  var inputMobile = normalizeMobile(params.mobile);

  if (!inputCircle || !inputMobile) {
    return jsonResponse({
      success: false,
      message: 'SUPERVISORY CIRCLE NO and Mobile Number of Supervisor are required.'
    });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);
  var dataSheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!masterSheet) {
    return jsonResponse({
      success: false,
      message: 'Sheet "' + MASTER_SHEET_NAME + '" not found.'
    });
  }

  var supervisorInfo = null;
  var enumeratorMap = {};
  var enumeratorOrder = [];

  function ensureEnumeratorEntry(ebNo, mobile, name, userId) {
    var key = normalizeEbLoose(ebNo) + '|' + normalizeMobile(mobile);
    if (!enumeratorMap[key]) {
      enumeratorMap[key] = {
        ebNo: ebNo,
        mobileNumber: mobile,
        nameOfEnumerator: name,
        enumeratorUserId: userId,
        enumeratorSeId: '',
        generatedCount: 0,
        generatedSeIds: [],
        generatedSeIdEntries: []
      };
      enumeratorOrder.push(key);
    }
    return enumeratorMap[key];
  }

  // 1. Fetch Supervisor details & all Enumerators under this Supervisor from Master
  var masterLastRow = masterSheet.getLastRow();
  if (masterLastRow >= 2) {
    var masterValues = masterSheet
      .getRange(2, 1, masterLastRow - 1, Math.max(13, masterSheet.getLastColumn()))
      .getDisplayValues();

    for (var i = 0; i < masterValues.length; i++) {
      var row = masterValues[i];
      var rowCircle = normalizeEb(row[3]);
      var rowCircleLoose = normalizeEbLoose(row[3]);
      var rowSupMobile = normalizeMobile(row[9]);

      if (
        (rowCircle === inputCircle || rowCircleLoose === inputCircleLoose) &&
        rowSupMobile === inputMobile
      ) {
        if (!supervisorInfo) {
          supervisorInfo = {
            supervisoryCircleNo: formatCellAsText(row[3]),
            nameOfSupervisor: formatCellAsText(row[8]).toUpperCase(),
            mobileNumberOfSupervisor:
              normalizeMobile(row[9]) || formatCellAsText(row[9]),
            supervisorDesignation: formatCellAsText(row[10]).toUpperCase(),
            officeName: formatCellAsText(row[11]).toUpperCase(),
            supervisorUserId: formatCellAsText(row[12])
          };
        }

        ensureEnumeratorEntry(
          formatCellAsText(row[0]),
          normalizeMobile(row[1]) || formatCellAsText(row[1]),
          formatCellAsText(row[2]).toUpperCase(),
          formatCellAsText(row[7])
        );
      }
    }
  }

  // 2. Fetch submitted SE IDs & Supervisor SE ID from Data sheet
  var seIdOfSupervisor = '';
  var lastTimestamp = '';

  if (dataSheet && dataSheet.getLastRow() >= 2) {
    var colInfo = ensureDataExtraColumns(dataSheet);
    var dataLastRow = dataSheet.getLastRow();
    var dataDisplay = dataSheet
      .getRange(2, 1, dataLastRow - 1, colInfo.totalCols)
      .getDisplayValues();
    var dataRaw = dataSheet
      .getRange(2, 1, dataLastRow - 1, colInfo.totalCols)
      .getValues();

    for (var r = 0; r < dataDisplay.length; r++) {
      var dRow = dataDisplay[r];
      var dRaw = dataRaw[r];
      var dCircle = normalizeEb(dRow[7]);
      var dCircleLoose = normalizeEbLoose(dRow[7]);
      var dSupMobile = normalizeMobile(dRow[16]);

      if (
        (dCircle === inputCircle || dCircleLoose === inputCircleLoose) &&
        dSupMobile === inputMobile
      ) {
        if (!supervisorInfo) {
          supervisorInfo = {
            supervisoryCircleNo: formatCellAsText(dRow[7]),
            nameOfSupervisor: formatCellAsText(dRow[15]).toUpperCase(),
            mobileNumberOfSupervisor:
              normalizeMobile(dRow[16]) || formatCellAsText(dRow[16]),
            supervisorDesignation: formatCellAsText(dRow[17]).toUpperCase(),
            officeName: formatCellAsText(dRow[18]).toUpperCase(),
            supervisorUserId: formatCellAsText(dRow[19])
          };
        }

        var rowSupSeId = formatCellAsText(dRow[colInfo.seIdSupColIndex]).toUpperCase();
        if (rowSupSeId && !seIdOfSupervisor) {
          seIdOfSupervisor = rowSupSeId;
        }

        var rowTs =
          formatTimestampValue(dRaw[colInfo.timestampColIndex]) ||
          formatCellAsText(dRow[colInfo.timestampColIndex]);
        if (rowTs) {
          lastTimestamp = rowTs;
        }

        var entry = ensureEnumeratorEntry(
          formatCellAsText(dRow[8]),
          normalizeMobile(dRow[10]) || formatCellAsText(dRow[10]),
          formatCellAsText(dRow[9]).toUpperCase(),
          formatCellAsText(dRow[14])
        );

        var enumSeId = formatCellAsText(dRow[colInfo.seIdColIndex]).toUpperCase();
        if (enumSeId && !entry.enumeratorSeId) {
          entry.enumeratorSeId = enumSeId;
        }

        var generatedSeId = formatCellAsText(dRow[5]).toUpperCase();
        var generatedSeDate =
          formatDateValue(dRaw[6]) || formatCellAsText(dRow[6]);
        if (generatedSeId) {
          entry.generatedSeIds.push(generatedSeId);
          entry.generatedSeIdEntries.push({
            seId: generatedSeId,
            seDate: generatedSeDate
          });
          entry.generatedCount = entry.generatedSeIds.length;
        }
      }
    }
  }

  if (!supervisorInfo) {
    return jsonResponse({
      success: false,
      message:
        'No supervisor found matching this SUPERVISORY CIRCLE NO and Mobile Number of Supervisor.'
    });
  }

  var enumerators = [];
  for (var k = 0; k < enumeratorOrder.length; k++) {
    enumerators.push(enumeratorMap[enumeratorOrder[k]]);
  }

  return jsonResponse({
    success: true,
    supervisor: supervisorInfo,
    hasExistingData: seIdOfSupervisor !== '',
    seIdOfSupervisor: seIdOfSupervisor,
    timestamp: lastTimestamp,
    enumerators: enumerators
  });
}

function handleDeveloperSheets(params) {
  var password = String(params.password || '');
  if (password !== 'Admin@2026') {
    return jsonResponse({
      success: false,
      message: 'Unauthorized: Invalid developer password.'
    });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var baseUrl = ss.getUrl();
  var dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
  var masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);

  function readSheet(sheet, fallbackName) {
    if (!sheet) {
      return {
        name: fallbackName,
        gid: null,
        url: baseUrl,
        headers: [],
        rows: []
      };
    }

    var gid = sheet.getSheetId();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = [];
    var rows = [];

    if (lastRow >= 1 && lastCol >= 1) {
      headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
      if (lastRow >= 2) {
        rows = sheet
          .getRange(2, 1, lastRow - 1, lastCol)
          .getDisplayValues();
      }
    }

    return {
      name: sheet.getName(),
      gid: gid,
      url: baseUrl + '#gid=' + gid,
      headers: headers,
      rows: rows
    };
  }

  return jsonResponse({
    success: true,
    spreadsheetUrl: baseUrl,
    sheets: {
      data: readSheet(dataSheet, DATA_SHEET_NAME),
      master: readSheet(masterSheet, MASTER_SHEET_NAME)
    }
  });
}

/**
 * POST Handler:
 * - role === 'supervisor': saves/updates SE ID of Supervisor & Timestamp on matching Data rows
 * - role === 'enumerator' (default): saves/updates household rows & SE ID of Enumerator in Data sheet
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var rawBody = e && e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);

    if (payload.role === 'supervisor') {
      return handleSupervisorSave(payload);
    }
    return handleEnumeratorSave(payload);
  } catch (err) {
    return jsonResponse({
      success: false,
      message: 'Failed to save data: ' + err.message
    });
  } finally {
    lock.releaseLock();
  }
}

function handleEnumeratorSave(payload) {
  var master = payload.master;
  var seIdOfEnumerator = formatCellAsText(payload.seIdOfEnumerator).toUpperCase();
  var rows = payload.rows || [];

  if (!master || !master.ebNo || !master.mobileNumber) {
    return jsonResponse({
      success: false,
      message: 'Missing enumerator EB NO or Mobile Number.'
    });
  }

  if (!/^P\d{11}$/.test(seIdOfEnumerator)) {
    return jsonResponse({
      success: false,
      message: 'SE ID of Enumerator must start with P followed by 11 digits.'
    });
  }

  if (!rows.length) {
    return jsonResponse({
      success: false,
      message: 'At least one household row is required.'
    });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
  if (!dataSheet) {
    return jsonResponse({
      success: false,
      message: 'Sheet "' + DATA_SHEET_NAME + '" not found.'
    });
  }

  var colInfo = ensureDataExtraColumns(dataSheet);
  var nowStr = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'dd-MM-yyyy HH:mm:ss'
  );

  var targetEb = normalizeEb(master.ebNo);
  var targetEbLoose = normalizeEbLoose(master.ebNo);
  var targetMobile = normalizeMobile(master.mobileNumber);
  var targetCircleLoose = normalizeEbLoose(master.supervisoryCircleNo);
  var targetSupMobile = normalizeMobile(master.mobileNumberOfSupervisor);

  var dataLastRow = dataSheet.getLastRow();
  var matchingSheetRows = [];
  var hadPreviousSubmission = false;
  var preservedSupervisorSeId = '';

  if (dataLastRow >= 2) {
    var existingDisplay = dataSheet
      .getRange(2, 1, dataLastRow - 1, colInfo.totalCols)
      .getDisplayValues();

    for (var r = 0; r < existingDisplay.length; r++) {
      var dRow = existingDisplay[r];
      var dEb = normalizeEb(dRow[8]);
      var dEbLoose = normalizeEbLoose(dRow[8]);
      var dMobile = normalizeMobile(dRow[10]);

      // Preserve Supervisor SE ID if already set anywhere in this supervisory circle
      var dCircleLoose = normalizeEbLoose(dRow[7]);
      var dSupMobile = normalizeMobile(dRow[16]);
      var supSe = formatCellAsText(dRow[colInfo.seIdSupColIndex]).toUpperCase();
      if (
        supSe &&
        !preservedSupervisorSeId &&
        dCircleLoose === targetCircleLoose &&
        dSupMobile === targetSupMobile
      ) {
        preservedSupervisorSeId = supSe;
      }

      if ((dEb === targetEb || dEbLoose === targetEbLoose) && dMobile === targetMobile) {
        matchingSheetRows.push(r + 2);
        if (formatCellAsText(dRow[1]) !== '' || formatCellAsText(dRow[5]) !== '') {
          hadPreviousSubmission = true;
        }
        if (supSe) {
          preservedSupervisorSeId = supSe;
        }
      }
    }
  }

  var formattedRows = [];
  for (var i = 0; i < rows.length; i++) {
    var item = rows[i];
    var fullRow = new Array(colInfo.totalCols);
    for (var c = 0; c < colInfo.totalCols; c++) {
      fullRow[c] = '';
    }

    fullRow[0] = String(i + 1);
    fullRow[1] = formatCellAsText(item.headName).toUpperCase();
    fullRow[2] = formatCellAsText(item.fatherHusbandName).toUpperCase();
    fullRow[3] = normalizeMobile(item.mobileNumber);
    fullRow[4] = formatCellAsText(item.villageSiteName).toUpperCase();
    fullRow[5] = formatCellAsText(item.seId).toUpperCase();
    fullRow[6] = formatCellAsText(item.seDate);

    fullRow[7] = formatCellAsText(master.supervisoryCircleNo);
    fullRow[8] = formatCellAsText(master.ebNo);
    fullRow[9] = formatCellAsText(master.nameOfEnumerator).toUpperCase();
    fullRow[10] = normalizeMobile(master.mobileNumber);
    fullRow[11] = formatCellAsText(master.sex).toUpperCase();
    fullRow[12] = formatCellAsText(master.post).toUpperCase();
    fullRow[13] = formatCellAsText(master.enumeratorDesignation).toUpperCase();
    fullRow[14] = formatCellAsText(master.enumeratorUserId);
    fullRow[15] = formatCellAsText(master.nameOfSupervisor).toUpperCase();
    fullRow[16] = normalizeMobile(master.mobileNumberOfSupervisor);
    fullRow[17] = formatCellAsText(master.supervisorDesignation).toUpperCase();
    fullRow[18] = formatCellAsText(master.officeName).toUpperCase();
    fullRow[19] = formatCellAsText(master.supervisorUserId);

    fullRow[colInfo.seIdColIndex] = seIdOfEnumerator;
    fullRow[colInfo.seIdSupColIndex] = preservedSupervisorSeId;
    fullRow[colInfo.timestampColIndex] = nowStr;

    formattedRows.push(fullRow);
  }

  if (matchingSheetRows.length > 0) {
    var insertStartRow = matchingSheetRows[0];
    for (var m = matchingSheetRows.length - 1; m >= 0; m--) {
      dataSheet.deleteRow(matchingSheetRows[m]);
    }
    var currentLastRow = dataSheet.getLastRow();
    if (insertStartRow <= currentLastRow) {
      dataSheet.insertRowsBefore(insertStartRow, formattedRows.length);
    } else {
      insertStartRow = Math.max(currentLastRow + 1, 2);
    }
    var updateRange = dataSheet.getRange(
      insertStartRow,
      1,
      formattedRows.length,
      colInfo.totalCols
    );
    updateRange.setNumberFormat('@');
    updateRange.setValues(formattedRows);
  } else {
    var appendStartRow = Math.max(dataSheet.getLastRow() + 1, 2);
    var appendRange = dataSheet.getRange(
      appendStartRow,
      1,
      formattedRows.length,
      colInfo.totalCols
    );
    appendRange.setNumberFormat('@');
    appendRange.setValues(formattedRows);
  }

  return jsonResponse({
    success: true,
    mode: hadPreviousSubmission ? 'updated' : 'saved',
    message: hadPreviousSubmission
      ? 'Data updated successfully in Google Sheet.'
      : 'Data saved successfully in Google Sheet.',
    timestamp: nowStr,
    rowCount: formattedRows.length
  });
}

function handleSupervisorSave(payload) {
  var supervisor = payload.supervisor;
  var seIdOfSupervisor = formatCellAsText(payload.seIdOfSupervisor).toUpperCase();

  if (
    !supervisor ||
    !supervisor.supervisoryCircleNo ||
    !supervisor.mobileNumberOfSupervisor
  ) {
    return jsonResponse({
      success: false,
      message: 'Missing Supervisory Circle No or Mobile Number of Supervisor.'
    });
  }

  if (!/^P\d{11}$/.test(seIdOfSupervisor)) {
    return jsonResponse({
      success: false,
      message: 'SE ID of Supervisor must start with P followed by 11 digits.'
    });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
  var masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);

  if (!dataSheet) {
    return jsonResponse({
      success: false,
      message: 'Sheet "' + DATA_SHEET_NAME + '" not found.'
    });
  }

  var colInfo = ensureDataExtraColumns(dataSheet);
  var nowStr = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'dd-MM-yyyy HH:mm:ss'
  );

  var targetCircle = normalizeEb(supervisor.supervisoryCircleNo);
  var targetCircleLoose = normalizeEbLoose(supervisor.supervisoryCircleNo);
  var targetSupMobile = normalizeMobile(supervisor.mobileNumberOfSupervisor);

  var dataLastRow = dataSheet.getLastRow();
  var matchingRowNumbers = [];
  var hadPreviousSupervisorSeId = false;

  if (dataLastRow >= 2) {
    var existingDisplay = dataSheet
      .getRange(2, 1, dataLastRow - 1, colInfo.totalCols)
      .getDisplayValues();

    for (var r = 0; r < existingDisplay.length; r++) {
      var dRow = existingDisplay[r];
      var dCircle = normalizeEb(dRow[7]);
      var dCircleLoose = normalizeEbLoose(dRow[7]);
      var dSupMobile = normalizeMobile(dRow[16]);

      if (
        (dCircle === targetCircle || dCircleLoose === targetCircleLoose) &&
        dSupMobile === targetSupMobile
      ) {
        matchingRowNumbers.push(r + 2);
        if (formatCellAsText(dRow[colInfo.seIdSupColIndex]) !== '') {
          hadPreviousSupervisorSeId = true;
        }
      }
    }
  }

  if (matchingRowNumbers.length > 0) {
    for (var m = 0; m < matchingRowNumbers.length; m++) {
      var rowNum = matchingRowNumbers[m];
      var supCell = dataSheet.getRange(rowNum, colInfo.seIdSupColIndex + 1);
      supCell.setNumberFormat('@');
      supCell.setValue(seIdOfSupervisor);

      var tsCell = dataSheet.getRange(rowNum, colInfo.timestampColIndex + 1);
      tsCell.setNumberFormat('@');
      tsCell.setValue(nowStr);
    }
  } else if (masterSheet && masterSheet.getLastRow() >= 2) {
    // Fallback if Data sheet had no prefilled rows for this supervisory circle yet
    var masterValues = masterSheet
      .getRange(2, 1, masterSheet.getLastRow() - 1, Math.max(13, masterSheet.getLastColumn()))
      .getDisplayValues();
    var newRows = [];

    for (var i = 0; i < masterValues.length; i++) {
      var mRow = masterValues[i];
      var mCircle = normalizeEb(mRow[3]);
      var mCircleLoose = normalizeEbLoose(mRow[3]);
      var mSupMobile = normalizeMobile(mRow[9]);

      if (
        (mCircle === targetCircle || mCircleLoose === targetCircleLoose) &&
        mSupMobile === targetSupMobile
      ) {
        var newFullRow = new Array(colInfo.totalCols);
        for (var c = 0; c < colInfo.totalCols; c++) {
          newFullRow[c] = '';
        }
        newFullRow[7] = formatCellAsText(mRow[3]);
        newFullRow[8] = formatCellAsText(mRow[0]);
        newFullRow[9] = formatCellAsText(mRow[2]).toUpperCase();
        newFullRow[10] = normalizeMobile(mRow[1]);
        newFullRow[11] = formatCellAsText(mRow[4]).toUpperCase();
        newFullRow[12] = formatCellAsText(mRow[5]).toUpperCase();
        newFullRow[13] = formatCellAsText(mRow[6]).toUpperCase();
        newFullRow[14] = formatCellAsText(mRow[7]);
        newFullRow[15] = formatCellAsText(mRow[8]).toUpperCase();
        newFullRow[16] = normalizeMobile(mRow[9]);
        newFullRow[17] = formatCellAsText(mRow[10]).toUpperCase();
        newFullRow[18] = formatCellAsText(mRow[11]).toUpperCase();
        newFullRow[19] = formatCellAsText(mRow[12]);
        newFullRow[colInfo.seIdSupColIndex] = seIdOfSupervisor;
        newFullRow[colInfo.timestampColIndex] = nowStr;
        newRows.push(newFullRow);
      }
    }

    if (newRows.length > 0) {
      var appendStartRow = Math.max(dataSheet.getLastRow() + 1, 2);
      var appendRange = dataSheet.getRange(
        appendStartRow,
        1,
        newRows.length,
        colInfo.totalCols
      );
      appendRange.setNumberFormat('@');
      appendRange.setValues(newRows);
      matchingRowNumbers = new Array(newRows.length);
    }
  }

  return jsonResponse({
    success: true,
    mode: hadPreviousSupervisorSeId ? 'updated' : 'saved',
    message: hadPreviousSupervisorSeId
      ? 'Supervisor SE ID updated successfully in Data sheet.'
      : 'Supervisor SE ID saved successfully in Data sheet.',
    timestamp: nowStr,
    rowCount: matchingRowNumbers.length || 1
  });
}
