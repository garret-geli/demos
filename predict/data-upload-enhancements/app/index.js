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
  const resolutionDisplay = document.getElementById('resolution-display');
  const dataFormatDisplay = document.getElementById('data-format-display');
  const unitDisplay = document.getElementById('unit-display');
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

  function columnCountLabel(count) {
    if (count === 1) return 'Single Column';
    if (count === 2) return 'Two Column';
    return 'Multi Column';
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
      } else {
        // Standard CSV format
        document.getElementById('metadata-section').classList.add('hidden');
        // Sample the first few lines to analyze
        const sampleLines = allLines.slice(0, Math.min(10, allLines.length));

        // Check column count
        validateColumnCount(sampleLines);

        // Check for headers
        csvHasHeaders = validateHeaders(sampleLines);

        // Check if it's time series data and infer timestep
        validateTimeSeries(sampleLines);

        // Create standard data preview
        createDataPreview(allLines, csvHasHeaders);
      }

      // Show options section
      optionsSection.classList.remove('hidden');
      dataPreview.classList.remove('hidden');

      // Parse and store load rows for heatmap (standard 2-col CSV only)
      if (!isPVWattsFormat) {
        window._loadRows = parseLoadRows(allLines, csvHasHeaders);
        validateDataCoverage(window._loadRows);
      } else {
        window._loadRows = [];
        if (isFullYearEl) {
          isFullYearEl.textContent = 'N/A (PVWatts format)';
          isFullYearEl.className = '';
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
            if (resolutionDisplay) resolutionDisplay.textContent = resolutionLabel('1hr');
            return '1hr';
          }
        } catch (e) {
          console.error('Error inferring time step:', e);
        }
      }
    }

    setValidationItem(inferredTimestepEl, 'Inferred resolution: Hourly', false);
    resolutionSelect.value = '1hr';
    if (resolutionDisplay) resolutionDisplay.textContent = resolutionLabel('1hr');
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

    // Detect unit from headers
    if (hasHeaders && unitDisplay) {
      const headerText = lines[0].toLowerCase();
      unitDisplay.textContent = headerText.includes('kwh') ? 'kWh' : 'kW';
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

  function validateColumnCount(lines) {
    // Get columns from first line
    const firstLineColumns = lines[0].split(',').length;
    const label = `${firstLineColumns} column data detected`;
    setValidationItem(hasColumnsEl, label, false);
    if (dataFormatDisplay) dataFormatDisplay.textContent = columnCountLabel(firstLineColumns);
    return firstLineColumns <= 3;
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
      if (resolutionDisplay) resolutionDisplay.textContent = resolutionLabel(inferredStep);

      return inferredStep;
    } catch (e) {
      console.error('Error inferring time step:', e);
      setValidationItem(inferredTimestepEl, 'Error inferring resolution', true);
      return null;
    }
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

  function parseLoadRows(lines, hasHeaders) {
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
    // Convert kWh to kW if needed
    const unit = unitDisplay ? unitDisplay.textContent.trim().toLowerCase() : 'kw';
    const res = resolutionSelect ? resolutionSelect.value : '15min';
    if (unit === 'kwh') {
      const factor = res === '15min' ? 4 : res === '5min' ? 12 : res === '1min' ? 60 : 1;
      rows.forEach((r) => {
        r.kw = r.kw * factor;
      });
    }
    return rows;
  }
});
