// App state shared with heatmap component
window.S = window.S || { hmScheme: 'turbo', heatmapGrid: null, heatmapMaxKw: 0, heatmapMinKw: 0 };

document.addEventListener('DOMContentLoaded', function () {
  // DOM elements
  const fileInput = document.getElementById('csvFile');
  const fileInputBox = document.getElementById('file-input-box');
  const fileNameDisplay = document.getElementById('fileName');
  const fileClearBtn = document.getElementById('file-clear-btn');
  const validationResults = document.getElementById('validation-results');
  const optionsSection = document.getElementById('options-section');
  const resolutionSelect = document.getElementById('resolution');
  const dataFormatSelect = document.getElementById('data-format');
  const unitsSelect = document.getElementById('units');
  const dataPreview = document.getElementById('data-preview');
  const tableHeader = document.getElementById('table-header');
  const tableBody = document.getElementById('table-body');
  const metadataContainer = document.getElementById('metadata-container');
  const viewHeatmapBtn = document.getElementById('view-heatmap-btn');
  let heatmapVisible = false;

  // Validation result elements
  const isCsvEl = document.getElementById('is-csv');
  const hasColumnsEl = document.getElementById('has-columns');
  const hasHeadersEl = document.getElementById('has-headers');
  const isTimeSeriesEl = document.getElementById('is-time-series');
  const inferredTimestepEl = document.getElementById('inferred-timestep');
  const isFullYearEl = document.getElementById('is-full-year');

  // Sample files accordion
  const sampleToggle = document.getElementById('sample-files-toggle');
  const sampleList = document.getElementById('sample-files-list');
  if (sampleToggle && sampleList) {
    sampleToggle.addEventListener('click', function () {
      const expanded = sampleToggle.getAttribute('aria-expanded') === 'true';
      sampleToggle.setAttribute('aria-expanded', String(!expanded));
      sampleList.classList.toggle('hidden', expanded);
    });
  }

  // File input box click opens the file picker (but not when clicking the clear button)
  fileInputBox.addEventListener('click', function (e) {
    if (e.target !== fileClearBtn) {
      fileInput.click();
    }
  });

  // Clear button resets the file selection
  fileClearBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    fileInput.value = '';
    fileNameDisplay.textContent = 'Choose a file...';
    fileNameDisplay.classList.add('placeholder');
    fileClearBtn.classList.add('hidden');
    validationResults.classList.add('hidden');
    optionsSection.classList.add('hidden');
    dataPreview.classList.add('hidden');
    resetValidationResults();
    // Reset heatmap
    window._loadRows = [];
    window._allLines = [];
    window._csvHasHeaders = false;
    heatmapVisible = false;
    const hmSection = document.getElementById('heatmap-section');
    if (hmSection) hmSection.classList.add('hidden');
    if (viewHeatmapBtn) viewHeatmapBtn.textContent = 'View Heatmap';
  });

  // View Heatmap toggle
  if (viewHeatmapBtn) {
    viewHeatmapBtn.addEventListener('click', function () {
      const section = document.getElementById('heatmap-section');
      if (!section) return;
      heatmapVisible = !heatmapVisible;
      if (heatmapVisible) {
        section.classList.remove('hidden');
        viewHeatmapBtn.textContent = 'Hide Heatmap';
        if (window._loadRows && window._loadRows.length && typeof renderHeatmap === 'function') {
          setTimeout(() => renderHeatmap(window._loadRows), 50);
        }
      } else {
        section.classList.add('hidden');
        viewHeatmapBtn.textContent = 'View Heatmap';
      }
    });
  }

  // Re-render heatmap when color scheme changes
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'hm-scheme') {
      window.S.hmScheme = e.target.value;
      if (window._loadRows && window._loadRows.length && typeof renderHeatmap === 'function') {
        renderHeatmap(window._loadRows);
      }
    }
    if (e.target && e.target.id === 'data-format') {
      if (e.target.value === 'utilityapi') unitsSelect.value = 'kwh';
      if (e.target.value === 'helioscope') {
        resolutionSelect.value = '1hr';
        unitsSelect.value = 'w';
      }
      if (window._allLines && window._allLines.length) {
        window._loadRows = parseLoadRows(window._allLines, window._csvHasHeaders || false);
        validateDataCoverage(window._loadRows);
        if (heatmapVisible && typeof renderHeatmap === 'function') {
          renderHeatmap(window._loadRows);
        }
      }
    }
    if (e.target && e.target.id === 'units') {
      if (window._allLines && window._allLines.length) {
        window._loadRows = parseLoadRows(window._allLines, window._csvHasHeaders || false);
        if (heatmapVisible && typeof renderHeatmap === 'function') {
          renderHeatmap(window._loadRows);
        }
      }
    }
  });

  // Listen for file selection
  fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];

    if (file) {
      fileNameDisplay.textContent = file.name;
      fileNameDisplay.classList.remove('placeholder');
      fileClearBtn.classList.remove('hidden');

      // Check if it's a CSV file
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setValidationItem(isCsvEl, 'Valid CSV file', false);
        readAndValidateCSV(file);
      } else {
        setValidationItem(isCsvEl, 'Not a CSV file', true);
        resetValidationResults();
      }

      validationResults.classList.remove('hidden');
    } else {
      fileNameDisplay.textContent = 'Choose a file...';
      fileNameDisplay.classList.add('placeholder');
      fileClearBtn.classList.add('hidden');
      validationResults.classList.add('hidden');
      optionsSection.classList.add('hidden');
    }
  });

  function setValidationItem(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    if (isError) {
      el.classList.add('error');
    } else {
      el.classList.remove('error');
    }
  }

  function resolutionLabel(value) {
    if (value === '1min') return '1-minute';
    if (value === '5min') return '5-minute';
    if (value === '15min') return '15-minute';
    if (value === '1hr') return 'Hourly';
    return value;
  }

  function readAndValidateCSV(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;
      const allLines = content.split('\n').filter((line) => line.trim() !== '');

      // Check if this is a PVWatts file (has metadata at the top)
      const isPVWattsFormat = isPVWattsFile(allLines);

      let dataLines, headerLine, metadataLines;
      let csvHasHeaders = false;

      if (isPVWattsFormat) {
        // PVWatts format: metadata in first ~31 lines, headers on line 32, data after
        metadataLines = allLines.slice(0, 30);
        headerLine = allLines[30];
        dataLines = allLines.slice(31);

        // Display metadata
        displayMetadata(metadataLines);
        document.getElementById('metadata-section').classList.remove('hidden');

        // Use headers from the file
        const headers = parseCSVLine(headerLine);

        // Create data preview with PVWatts data
        createPVWattsDataPreview(headers, dataLines);

        // Validate column count based on actual data
        validateColumnCount([headerLine, ...dataLines.slice(0, 5)]);

        // Check for time series data and infer time step
        validatePVWattsTimeSeries(dataLines);
        unitsSelect.value = 'w';
      } else {
        // Standard CSV format
        document.getElementById('metadata-section').classList.add('hidden');
        const sampleLines = allLines.slice(0, Math.min(10, allLines.length));

        const detectedFormat = validateColumnCount(sampleLines);
        csvHasHeaders = validateHeaders(sampleLines);

        if (detectedFormat === 'utilityapi') {
          setValidationItem(hasHeadersEl, 'Headers detected', false);
          setValidationItem(isTimeSeriesEl, 'Time series data detected', false);
          unitsSelect.value = 'kwh';
          inferUtilityApiTimeStep(allLines);
        } else if (detectedFormat === 'helioscope') {
          setValidationItem(hasHeadersEl, 'Headers detected', false);
          setValidationItem(isTimeSeriesEl, 'Time series data detected', false);
          setValidationItem(inferredTimestepEl, 'Inferred resolution: Hourly', false);
          resolutionSelect.value = '1hr';
          unitsSelect.value = 'w';
        } else if (detectedFormat === 'day-by-row') {
          setValidationItem(isTimeSeriesEl, 'Pivoted day-by-row format detected', false);
          inferDayByRowTimeStep(allLines[0]);
        } else if (detectedFormat === 'three-col') {
          setValidationItem(isTimeSeriesEl, 'Time series data detected', false);
          const dataStart = csvHasHeaders ? 1 : 0;
          const sampleTs = allLines.slice(dataStart, Math.min(dataStart + 5, allLines.length)).map((l) => {
            const c = parseCSVLine(l);
            return `${c[0].trim()} ${c[1].trim()}`;
          });
          inferTimeStep(sampleTs);
        } else {
          validateTimeSeries(sampleLines);
        }

        createDataPreview(allLines, csvHasHeaders);
      }

      // Show options section
      optionsSection.classList.remove('hidden');
      dataPreview.classList.remove('hidden');

      // Parse and store load rows for heatmap
      if (!isPVWattsFormat) {
        window._allLines = allLines;
        window._csvHasHeaders = csvHasHeaders;
        window._loadRows = parseLoadRows(allLines, csvHasHeaders);
        validateDataCoverage(window._loadRows);
        if (heatmapVisible && typeof renderHeatmap === 'function') {
          setTimeout(() => renderHeatmap(window._loadRows), 50);
        }
      } else {
        window._loadRows = [];
        if (isFullYearEl) {
          isFullYearEl.textContent = 'N/A (PVWatts format)';
          isFullYearEl.className = '';
        }
        if (heatmapVisible) {
          const hmSection = document.getElementById('heatmap-section');
          if (hmSection) hmSection.classList.add('hidden');
          heatmapVisible = false;
          if (viewHeatmapBtn) viewHeatmapBtn.textContent = 'View Heatmap';
        }
      }
    };

    reader.onerror = function () {
      console.error('Error reading file');
      resetValidationResults();
    };

    reader.readAsText(file);
  }

  function isPVWattsFile(lines) {
    // Check if the first line contains "PVWatts" or if it follows the expected structure
    if (lines.length < 32) return false;

    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('pvwatts')) return true;

    // Check for the characteristic header line at row 32
    const potentialHeaderLine = lines[31].toLowerCase();
    return potentialHeaderLine.includes('month') && potentialHeaderLine.includes('day') && potentialHeaderLine.includes('hour') && potentialHeaderLine.includes('irradiance');
  }

  function parseCSVLine(line) {
    // Handle quoted values properly
    let result = [];
    let insideQuotes = false;
    let currentValue = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        // Add current value to result, but remove surrounding quotes if they exist
        let cleanValue = currentValue.trim();
        if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
          cleanValue = cleanValue.substring(1, cleanValue.length - 1);
        }
        result.push(cleanValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // Add the last value
    if (currentValue) {
      let cleanValue = currentValue.trim();
      if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
        cleanValue = cleanValue.substring(1, cleanValue.length - 1);
      }
      result.push(cleanValue);
    }

    return result;
  }

  function displayMetadata(metadataLines) {
    // Clear the metadata container
    metadataContainer.innerHTML = '';

    // Process and display the metadata
    metadataLines.forEach((line) => {
      const parts = parseCSVLine(line);

      // Skip empty lines or lines without key-value pairs
      if (parts.length < 2 || !parts[0]) return;

      const label = parts[0];
      const value = parts.slice(1).join(', ');

      // Skip empty values
      if (!value) return;

      const metadataItem = document.createElement('div');
      metadataItem.className = 'metadata-item';

      const labelElement = document.createElement('div');
      labelElement.className = 'metadata-label';
      labelElement.textContent = label + ':';

      const valueElement = document.createElement('div');
      valueElement.className = 'metadata-value';
      valueElement.textContent = value;

      metadataItem.appendChild(labelElement);
      metadataItem.appendChild(valueElement);

      metadataContainer.appendChild(metadataItem);
    });
  }

  function createPVWattsDataPreview(headers, dataLines) {
    // Clear previous preview
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Create table headers
    headers.forEach((header) => {
      const th = document.createElement('th');
      th.textContent = header;
      tableHeader.appendChild(th);
    });

    // Add first 10 rows of data
    const maxRows = Math.min(10, dataLines.length);
    const colCount = headers.length;

    for (let i = 0; i < maxRows; i++) {
      const cells = parseCSVLine(dataLines[i]);
      const row = document.createElement('tr');

      for (let c = 0; c < colCount; c++) {
        const td = document.createElement('td');
        td.textContent = cells[c] ?? '';
        row.appendChild(td);
      }

      tableBody.appendChild(row);
    }
  }

  function validatePVWattsTimeSeries(dataLines) {
    // PVWatts files always have headers
    setValidationItem(hasHeadersEl, 'Headers detected', false);

    // PVWatts files are always time series data
    setValidationItem(isTimeSeriesEl, 'Time series data detected', false);

    // Infer the time step from the hour column (column 2, 0-indexed)
    if (dataLines.length >= 2) {
      const firstRow = parseCSVLine(dataLines[0]);
      const secondRow = parseCSVLine(dataLines[1]);

      if (firstRow.length > 2 && secondRow.length > 2) {
        try {
          const firstHour = Number.parseInt(firstRow[2]);
          const secondHour = Number.parseInt(secondRow[2]);

          // Check if the difference is 1 hour
          if (secondHour - firstHour === 1 || (firstHour === 23 && secondHour === 0)) {
            setValidationItem(inferredTimestepEl, 'Inferred resolution: Hourly', false);
            resolutionSelect.value = '1hr';
            return '1hr';
          }
        } catch (e) {
          console.error('Error inferring time step:', e);
        }
      }
    }

    setValidationItem(inferredTimestepEl, 'Inferred resolution: Hourly', false);
    resolutionSelect.value = '1hr';
    return '1hr';
  }

  function createDataPreview(lines, hasHeaders) {
    // Clear previous preview
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (lines.length === 0) return;

    // Determine how many rows to display (up to 10)
    const maxRows = Math.min(10, lines.length);

    // Process the first line to get headers or first row of data
    const firstLine = parseCSVLine(lines[0]);

    // Detect unit from headers — skip for formats with a known unit
    const knownUnitFormats = ['utilityapi', 'helioscope'];
    if (hasHeaders && unitsSelect && !knownUnitFormats.includes(dataFormatSelect ? dataFormatSelect.value : '')) {
      const headerText = lines[0].toLowerCase();
      if (headerText.includes('kwh')) unitsSelect.value = 'kwh';
      else if (/[,\s(]wh[,\s)]/.test(headerText)) unitsSelect.value = 'wh';
      else if (/[,\s(]kw[,\s)]/.test(headerText)) unitsSelect.value = 'kw';
      else if (/[,\s(]w[,\s)]/.test(headerText)) unitsSelect.value = 'w';
      else unitsSelect.value = headerText.includes('kwh') ? 'kwh' : 'kw';
    }

    // Create table headers
    if (hasHeaders) {
      // Use the first line as headers
      firstLine.forEach((header) => {
        const th = document.createElement('th');
        th.textContent = header;
        tableHeader.appendChild(th);
      });

      // Start data rows from second line
      const startRow = 1;
      const endRow = Math.min(startRow + 10, lines.length);
      const colCount = firstLine.length;

      for (let i = startRow; i < endRow; i++) {
        const cells = parseCSVLine(lines[i]);
        const row = document.createElement('tr');

        for (let c = 0; c < colCount; c++) {
          const td = document.createElement('td');
          td.textContent = cells[c] ?? '';
          row.appendChild(td);
        }

        tableBody.appendChild(row);
      }
    } else {
      // No headers, create generic column names
      for (let i = 0; i < firstLine.length; i++) {
        const th = document.createElement('th');
        th.textContent = `Column ${i + 1}`;
        tableHeader.appendChild(th);
      }

      // Use all rows as data, up to max
      for (let i = 0; i < maxRows; i++) {
        const cells = parseCSVLine(lines[i]);
        const row = document.createElement('tr');

        for (let c = 0; c < firstLine.length; c++) {
          const td = document.createElement('td');
          td.textContent = cells[c] ?? '';
          row.appendChild(td);
        }

        tableBody.appendChild(row);
      }
    }
  }

  function detectDataFormat(lines) {
    if (lines.length === 0) return 'two-col';
    const headerLower = lines[0].toLowerCase();

    // UtilityAPI: header contains interval_start and interval_kwh
    if (headerLower.includes('interval_start') && headerLower.includes('interval_kwh')) {
      return 'utilityapi';
    }

    // Helioscope: header contains timestamp and grid_power
    if (headerLower.includes('timestamp') && headerLower.includes('grid_power')) {
      return 'helioscope';
    }

    const firstLineCols = parseCSVLine(lines[0]).length;

    // Day-by-row: first column header is "Date" and second column header is a time label (e.g. "12:00 AM")
    if (lines.length > 1) {
      const headerCols = parseCSVLine(lines[0]);
      const firstHeader = headerCols[0].trim().toLowerCase();
      const secondHeader = (headerCols[1] || '').trim();
      if (firstHeader === 'date' && /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(secondHeader)) {
        return 'day-by-row';
      }
    }

    // Three-column: col[0] date-like, col[1] time-like in data rows
    if (firstLineCols >= 3 && lines.length > 1) {
      const dataRow = parseCSVLine(lines[1]);
      if (dataRow.length >= 3) {
        const col0 = dataRow[0].trim();
        const col1 = dataRow[1].trim();
        const isDateLike = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(col0) || luxon.DateTime.fromJSDate(new Date(col0)).isValid;
        const isTimeLike = /^\d{1,2}:\d{2}/.test(col1);
        if (isDateLike && isTimeLike) return 'three-col';
      }
    }

    return 'two-col';
  }

  function validateColumnCount(lines) {
    const format = detectDataFormat(lines);
    const firstLineColumns = parseCSVLine(lines[0]).length;
    if (format === 'helioscope') {
      setValidationItem(hasColumnsEl, 'Helioscope format detected', false);
    } else {
      setValidationItem(hasColumnsEl, `${firstLineColumns} column data detected`, false);
    }
    if (dataFormatSelect) dataFormatSelect.value = format;
    return format;
  }

  function validateHeaders(lines) {
    // Use our proper CSV parsing instead of simple split
    const firstRow = parseCSVLine(lines[0]);
    const secondRow = lines.length > 1 ? parseCSVLine(lines[1]) : [];

    let hasHeaders = false;

    if (secondRow.length > 0) {
      // Check if first row contains non-numeric values while second row has numbers
      const firstRowHasNonNumeric = firstRow.some((cell) => isNaN(parseFloat(cell)));
      const secondRowHasNumbers = secondRow.some((cell) => !isNaN(parseFloat(cell)));

      hasHeaders = firstRowHasNonNumeric && secondRowHasNumbers;
    }

    if (hasHeadersEl) {
      setValidationItem(hasHeadersEl, hasHeaders ? 'Headers detected' : 'No headers detected (raw data)', false);
    }

    return hasHeaders;
  }

  function validateTimeSeries(lines) {
    // Simple time series detection - check if first column looks like dates/times
    // This is simplified - real implementation would need more robust detection
    const hasHeaders = validateHeaders(lines);
    const startRow = hasHeaders ? 1 : 0;

    if (lines.length <= startRow) {
      isTimeSeriesEl.innerHTML = '✗ Not enough data to determine';
      return false;
    }

    const rows = lines.slice(startRow, startRow + Math.min(5, lines.length - startRow)).map((line) => line.split(','));

    // Check if first column contains date-like strings
    const firstColValues = rows.map((row) => row[0].trim());
    const hasDatePattern = firstColValues.some((val) => {
      // Check for common date patterns
      return (
        /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(val) || // Date patterns like YYYY-MM-DD
        /^\d{1,2}:\d{1,2}/.test(val) || // Time patterns like HH:MM
        luxon.DateTime.fromJSDate(new Date(val)).isValid
      ); // Parseable as date
    });

    if (hasDatePattern) {
      setValidationItem(isTimeSeriesEl, 'Time series data detected', false);
      inferTimeStep(firstColValues);
      return true;
    } else {
      setValidationItem(isTimeSeriesEl, 'Not time series data', true);
      setValidationItem(inferredTimestepEl, 'Cannot infer resolution', true);
      return false;
    }
  }

  function inferTimeStep(timestamps) {
    if (timestamps.length < 2) {
      setValidationItem(inferredTimestepEl, 'Not enough data points to infer resolution', true);
      return null;
    }

    try {
      // Try to parse dates and calculate difference
      const dates = timestamps.map((ts) => luxon.DateTime.fromJSDate(new Date(ts)));

      // Calculate differences in minutes between consecutive timestamps
      const diffs = [];
      for (let i = 1; i < dates.length; i++) {
        if (dates[i].isValid && dates[i - 1].isValid) {
          const diffMinutes = Math.abs(dates[i].diff(dates[i - 1], 'minutes').minutes);
          diffs.push(diffMinutes);
        }
      }

      if (diffs.length === 0) {
        setValidationItem(inferredTimestepEl, 'Could not parse timestamps', true);
        return null;
      }

      // Calculate average difference
      const avgDiff = diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;

      // Determine the closest standard time step
      let inferredStep;
      if (avgDiff <= 2) {
        inferredStep = '1min';
      } else if (avgDiff <= 7) {
        inferredStep = '5min';
      } else if (avgDiff <= 30) {
        inferredStep = '15min';
      } else {
        inferredStep = '1hr';
      }

      setValidationItem(inferredTimestepEl, `Inferred resolution: ${resolutionLabel(inferredStep)}`, false);
      resolutionSelect.value = inferredStep;

      return inferredStep;
    } catch (e) {
      console.error('Error inferring time step:', e);
      setValidationItem(inferredTimestepEl, 'Error inferring resolution', true);
      return null;
    }
  }

  function inferUtilityApiTimeStep(lines) {
    if (lines.length < 2) return;
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const startIdx = headers.indexOf('interval_start');
    const endIdx = headers.indexOf('interval_end');
    if (startIdx === -1) return;
    const row1 = parseCSVLine(lines[1]);
    let step = null;
    if (endIdx !== -1 && row1[startIdx] && row1[endIdx]) {
      const t1 = luxon.DateTime.fromJSDate(new Date(row1[startIdx].trim()));
      const t2 = luxon.DateTime.fromJSDate(new Date(row1[endIdx].trim()));
      if (t1.isValid && t2.isValid) {
        const diff = Math.abs(t2.diff(t1, 'minutes').minutes);
        step = diff <= 2 ? '1min' : diff <= 7 ? '5min' : diff <= 30 ? '15min' : '1hr';
      }
    } else if (lines.length > 2) {
      const row2 = parseCSVLine(lines[2]);
      if (row1[startIdx] && row2[startIdx]) {
        const t1 = luxon.DateTime.fromJSDate(new Date(row1[startIdx].trim()));
        const t2 = luxon.DateTime.fromJSDate(new Date(row2[startIdx].trim()));
        if (t1.isValid && t2.isValid) {
          const diff = Math.abs(t2.diff(t1, 'minutes').minutes);
          step = diff <= 2 ? '1min' : diff <= 7 ? '5min' : diff <= 30 ? '15min' : '1hr';
        }
      }
    }
    if (step) {
      setValidationItem(inferredTimestepEl, `Inferred resolution: ${resolutionLabel(step)}`, false);
      resolutionSelect.value = step;
    }
  }

  function inferDayByRowTimeStep(headerLine) {
    const cols = parseCSVLine(headerLine)
      .map((c) => c.trim())
      .filter((c) => /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(c));
    if (cols.length < 2) {
      setValidationItem(inferredTimestepEl, 'Could not infer resolution', true);
      return;
    }
    const t1 = luxon.DateTime.fromFormat(cols[0], 'h:mm a');
    const t2 = luxon.DateTime.fromFormat(cols[1], 'h:mm a');
    const diff = Math.abs(t2.diff(t1, 'minutes').minutes);
    const step = diff <= 2 ? '1min' : diff <= 7 ? '5min' : diff <= 30 ? '15min' : '1hr';
    setValidationItem(inferredTimestepEl, `Inferred resolution: ${resolutionLabel(step)}`, false);
    resolutionSelect.value = step;
  }

  function validateDataCoverage(rows) {
    if (!isFullYearEl) return;
    if (!rows || rows.length < 2) {
      isFullYearEl.textContent = 'Not enough data to assess coverage';
      isFullYearEl.className = 'warning';
      return;
    }
    const timestamps = rows.map((r) => r.ts);
    const minTs = timestamps.reduce((a, b) => (a < b ? a : b));
    const maxTs = timestamps.reduce((a, b) => (a > b ? a : b));
    const spanDays = Math.round(Math.abs(maxTs.diff(minTs, 'days').days));
    const expectedDays = 365;
    if (spanDays >= expectedDays - 1) {
      isFullYearEl.textContent = `Full year of data (${spanDays} days)`;
      isFullYearEl.className = '';
    } else {
      isFullYearEl.textContent = `Partial year: ${spanDays} day${spanDays === 1 ? '' : 's'} covered`;
      isFullYearEl.className = 'warning';
    }
  }

  function resetValidationResults() {
    setValidationItem(hasColumnsEl, 'Checking column count...', false);
    setValidationItem(hasHeadersEl, 'Checking for headers...', false);
    setValidationItem(isTimeSeriesEl, 'Checking if time series data...', false);
    setValidationItem(inferredTimestepEl, 'Inferring resolution...', false);
    if (isFullYearEl) {
      isFullYearEl.textContent = 'Checking data coverage...';
      isFullYearEl.className = '';
    }

    if (optionsSection) optionsSection.classList.add('hidden');
    if (dataPreview) dataPreview.classList.add('hidden');

    // Clear table and metadata
    if (tableHeader) tableHeader.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';
    if (metadataContainer) metadataContainer.innerHTML = '';
  }

  function normalizeToKw(rows) {
    const unit = unitsSelect ? unitsSelect.value.toLowerCase() : 'kw';
    if (unit === 'kw') return;
    const res = resolutionSelect ? resolutionSelect.value : '15min';
    const minsPerInterval = res === '1min' ? 1 : res === '5min' ? 5 : res === '15min' ? 15 : 60;
    const intervalsPerHour = 60 / minsPerInterval;
    rows.forEach((r) => {
      if (unit === 'w') r.kw = r.kw / 1000;
      else if (unit === 'kwh') r.kw = r.kw * intervalsPerHour;
      else if (unit === 'wh') r.kw = (r.kw * intervalsPerHour) / 1000;
    });
  }

  function parseTwoColRows(lines, hasHeaders) {
    const rows = [];
    const startRow = hasHeaders ? 1 : 0;
    for (let i = startRow; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (cells.length < 2) continue;
      const ts = luxon.DateTime.fromJSDate(new Date(cells[0].trim()));
      if (!ts.isValid) continue;
      const kw = parseFloat(cells[1]);
      if (isNaN(kw)) continue;
      rows.push({ ts, kw });
    }
    rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    normalizeToKw(rows);
    return rows;
  }

  function parseThreeColRows(lines, hasHeaders) {
    const rows = [];
    const startRow = hasHeaders ? 1 : 0;
    for (let i = startRow; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (cells.length < 3) continue;
      const ts = luxon.DateTime.fromJSDate(new Date(`${cells[0].trim()} ${cells[1].trim()}`));
      if (!ts.isValid) continue;
      const kw = parseFloat(cells[2]);
      if (isNaN(kw)) continue;
      rows.push({ ts, kw });
    }
    rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    normalizeToKw(rows);
    return rows;
  }

  function parseDayByRowRows(lines) {
    if (lines.length < 2) return [];
    // Extract time labels from header row (skip first "Date" column, skip blanks)
    const headerCols = parseCSVLine(lines[0]).map((c) => c.trim());
    const timeLabels = headerCols.slice(1).filter((t) => /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(t));
    const rows = [];
    for (let r = 1; r < lines.length; r++) {
      const cells = parseCSVLine(lines[r]);
      const dateStr = cells[0] ? cells[0].trim() : '';
      if (!dateStr) continue;
      const baseDate = luxon.DateTime.fromJSDate(new Date(dateStr));
      if (!baseDate.isValid) continue;
      const baseDateStr = baseDate.toFormat('M/d/yyyy');
      for (let c = 0; c < timeLabels.length; c++) {
        const cellVal = cells[c + 1];
        if (cellVal === undefined || cellVal.trim() === '') continue;
        const kw = parseFloat(cellVal);
        if (isNaN(kw)) continue;
        const ts = luxon.DateTime.fromFormat(`${baseDateStr} ${timeLabels[c]}`, 'M/d/yyyy h:mm a');
        if (!ts.isValid) continue;
        rows.push({ ts, kw });
      }
    }
    rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    normalizeToKw(rows);
    return rows;
  }

  function parseUtilityApiRows(lines) {
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const startIdx = headers.indexOf('interval_start');
    const kwhIdx = headers.indexOf('interval_kwh');
    if (startIdx === -1 || kwhIdx === -1) return [];
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (!cells[startIdx] || !cells[kwhIdx]) continue;
      const ts = luxon.DateTime.fromJSDate(new Date(cells[startIdx].trim()));
      if (!ts.isValid) continue;
      const kwh = parseFloat(cells[kwhIdx]);
      if (isNaN(kwh)) continue;
      rows.push({ ts, kw: kwh });
    }
    rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    normalizeToKw(rows);
    return rows;
  }

  function parseHelioscopeRows(lines) {
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const tsIdx = headers.indexOf('timestamp');
    const pwIdx = headers.indexOf('grid_power');
    const hiIdx = headers.indexOf('hour_index');
    if (tsIdx === -1 || pwIdx === -1) return [];

    // Helioscope TMY exports use timestamps from multiple historical years
    // (each month drawn from the best-match year). Use hour_index (1-8760) to
    // map every row onto a single canonical year so the heatmap renders cleanly.
    const useHourIndex = hiIdx !== -1;
    const canonicalBase = luxon.DateTime.fromObject({ year: 2004, month: 1, day: 1, hour: 0 });

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (!cells[tsIdx]) continue;

      let ts;
      if (useHourIndex && cells[hiIdx]) {
        const hi = parseInt(cells[hiIdx], 10);
        if (isNaN(hi) || hi < 1) continue;
        ts = canonicalBase.plus({ hours: hi - 1 });
      } else {
        ts = luxon.DateTime.fromFormat(cells[tsIdx].trim(), 'M/d/yyyy H:mm');
      }
      if (!ts || !ts.isValid) continue;

      const watts = cells[pwIdx] !== undefined && cells[pwIdx].trim() !== '' ? parseFloat(cells[pwIdx]) : 0;
      rows.push({ ts, kw: isNaN(watts) ? 0 : watts });
    }

    rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    normalizeToKw(rows);
    return rows;
  }

  function parseLoadRows(lines, hasHeaders) {
    const format = dataFormatSelect ? dataFormatSelect.value : 'two-col';
    if (format === 'three-col') return parseThreeColRows(lines, hasHeaders);
    if (format === 'day-by-row') return parseDayByRowRows(lines);
    if (format === 'utilityapi') return parseUtilityApiRows(lines);
    if (format === 'helioscope') return parseHelioscopeRows(lines);
    return parseTwoColRows(lines, hasHeaders);
  }
});
