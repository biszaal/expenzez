/**
 * CSV Format Detection and Flexible Parsing
 * Detects various CSV formats and maps them to standard transaction format
 * Includes UK bank-specific format detection
 */

import {
  detectBankFromCSV,
  parseBankDate,
  parseBankAmount,
  BankFormat,
  UK_BANK_FORMATS,
} from './ukBankFormats';

export interface DetectedColumns {
  dateIndex: number | null;
  amountIndex: number | null;
  descriptionIndex: number | null;
  categoryIndex: number | null;
  typeIndex: number | null;
  merchantIndex: number | null;
}

export interface ParsedCSVRow {
  date: string;
  amount: number;
  description: string;
  category?: string;
  type?: "debit" | "credit";
  merchant?: string;
  rawRow: string[];
}

export interface CSVParseResult {
  rows: ParsedCSVRow[];
  errors: string[];
  detectedColumns: DetectedColumns;
  formatDetected: string;
  detectedBank?: BankFormat | null;
}

export class CSVDetector {
  /**
   * Flexible column detection for various CSV formats
   * Supports: Date, Amount, Description (minimum)
   * Optional: Category, Type, Merchant
   *
   * Enhanced: More aggressive pattern matching and fallback detection
   */
  static detectColumns(headerRow: string): DetectedColumns {
    // Handle quoted CSV headers properly
    const headers = this.parseCSVLine(headerRow).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

    console.log('[CSVDetector] Detecting columns from headers:', headers);

    const result: DetectedColumns = {
      dateIndex: null,
      amountIndex: null,
      descriptionIndex: null,
      categoryIndex: null,
      typeIndex: null,
      merchantIndex: null,
    };

    // Expanded keyword patterns for each column type (case-insensitive)
    const datePatterns = [
      "date", "transaction date", "trans date", "trans. date", "posting date",
      "post date", "posted", "value date", "txn date", "created", "completed date",
      "started date", "effective date"
    ];
    const amountPatterns = [
      "amount", "value", "sum", "total", "debit", "credit", "withdrawal", "deposit",
      "money out", "money in", "paid out", "paid in", "transaction amount", "amt",
      "debit/credit", "credit/debit", "debit amount", "credit amount", "gbp", "usd", "eur"
    ];
    const descriptionPatterns = [
      "description", "detail", "details", "narrative", "reference", "memo",
      "transaction", "particulars", "name", "payee", "merchant", "counter party",
      "counterparty", "trans description", "transaction description", "vendor",
      "beneficiary", "remittance", "payment reference", "remarks"
    ];
    const categoryPatterns = ["category", "type", "class", "transaction type", "trans type"];
    const typePatterns = ["type", "transaction type", "ttype", "transtype", "trans type"];
    const merchantPatterns = [
      "merchant", "counterparty", "counter party", "party", "vendor", "supplier",
      "beneficiary", "payee", "name"
    ];

    // Helper function to check if header matches any pattern
    const matchesPattern = (header: string, patterns: string[]): boolean => {
      const cleanHeader = header.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
      return patterns.some((p) => {
        const cleanPattern = p.toLowerCase();
        // Exact match
        if (cleanHeader === cleanPattern) return true;
        // Contains match
        if (cleanHeader.includes(cleanPattern)) return true;
        // Word boundary match
        if (cleanHeader.split(/\s+/).some(word => word === cleanPattern)) return true;
        return false;
      });
    };

    // First pass: exact/contains matches (prioritized order)
    headers.forEach((header, index) => {
      // Skip already assigned or empty headers
      if (!header) return;

      // Date has highest priority
      if (result.dateIndex === null && matchesPattern(header, datePatterns)) {
        result.dateIndex = index;
        console.log(`[CSVDetector] Found date column at index ${index}: "${header}"`);
      }
    });

    // Second pass for amount (after date is found to avoid conflicts with "value date")
    headers.forEach((header, index) => {
      if (!header || index === result.dateIndex) return;

      if (result.amountIndex === null && matchesPattern(header, amountPatterns)) {
        result.amountIndex = index;
        console.log(`[CSVDetector] Found amount column at index ${index}: "${header}"`);
      }
    });

    // Third pass for description
    headers.forEach((header, index) => {
      if (!header || index === result.dateIndex || index === result.amountIndex) return;

      if (result.descriptionIndex === null && matchesPattern(header, descriptionPatterns)) {
        result.descriptionIndex = index;
        console.log(`[CSVDetector] Found description column at index ${index}: "${header}"`);
      }
    });

    // Fourth pass for optional columns
    headers.forEach((header, index) => {
      if (!header || index === result.dateIndex || index === result.amountIndex || index === result.descriptionIndex) return;

      if (result.categoryIndex === null && matchesPattern(header, categoryPatterns)) {
        result.categoryIndex = index;
      }
      if (result.typeIndex === null && matchesPattern(header, typePatterns)) {
        result.typeIndex = index;
      }
      if (result.merchantIndex === null && matchesPattern(header, merchantPatterns)) {
        result.merchantIndex = index;
      }
    });

    // FALLBACK: If still missing required columns, try smart detection
    if (result.dateIndex === null || result.amountIndex === null || result.descriptionIndex === null) {
      console.log('[CSVDetector] Missing required columns, trying smart fallback detection...');
      this.smartFallbackDetection(headers, result);
    }

    console.log('[CSVDetector] Final detected columns:', result);
    return result;
  }

  /**
   * Smart fallback detection when standard patterns fail
   * Analyzes column names and positions to make best guess
   */
  private static smartFallbackDetection(headers: string[], result: DetectedColumns): void {
    // Track which indices are already used
    const usedIndices = new Set([result.dateIndex, result.amountIndex, result.descriptionIndex].filter(i => i !== null));

    // If no date found, look for first column with "date" anywhere or first column that looks like it could be a date
    if (result.dateIndex === null) {
      for (let i = 0; i < headers.length; i++) {
        if (usedIndices.has(i)) continue;
        const h = headers[i].toLowerCase();
        if (h.includes('date') || h.includes('time') || h.includes('when') || h.includes('posted')) {
          result.dateIndex = i;
          usedIndices.add(i);
          console.log(`[CSVDetector] Fallback: Found date at index ${i}: "${headers[i]}"`);
          break;
        }
      }
      // If still no date, assume first column
      if (result.dateIndex === null && headers.length > 0) {
        result.dateIndex = 0;
        usedIndices.add(0);
        console.log('[CSVDetector] Fallback: Assuming first column is date');
      }
    }

    // If no amount found, look for numeric-sounding columns
    if (result.amountIndex === null) {
      const amountKeywords = ['amount', 'value', 'sum', 'total', 'gbp', 'usd', 'eur', 'debit', 'credit', 'money', 'paid', 'price', 'cost'];
      for (let i = 0; i < headers.length; i++) {
        if (usedIndices.has(i)) continue;
        const h = headers[i].toLowerCase();
        if (amountKeywords.some(k => h.includes(k))) {
          result.amountIndex = i;
          usedIndices.add(i);
          console.log(`[CSVDetector] Fallback: Found amount at index ${i}: "${headers[i]}"`);
          break;
        }
      }
      // If still no amount, look for columns after date
      if (result.amountIndex === null) {
        for (let i = 0; i < headers.length; i++) {
          if (usedIndices.has(i)) continue;
          const h = headers[i].toLowerCase();
          // Skip common non-amount columns
          if (h.includes('balance') || h.includes('reference') || h.includes('id')) continue;
          result.amountIndex = i;
          usedIndices.add(i);
          console.log(`[CSVDetector] Fallback: Guessing amount at index ${i}: "${headers[i]}"`);
          break;
        }
      }
    }

    // If no description found, find the most descriptive remaining column
    if (result.descriptionIndex === null) {
      const descKeywords = ['desc', 'detail', 'narrative', 'memo', 'reference', 'name', 'payee', 'merchant', 'vendor', 'transaction', 'particular', 'remark'];
      for (let i = 0; i < headers.length; i++) {
        if (usedIndices.has(i)) continue;
        const h = headers[i].toLowerCase();
        if (descKeywords.some(k => h.includes(k))) {
          result.descriptionIndex = i;
          usedIndices.add(i);
          console.log(`[CSVDetector] Fallback: Found description at index ${i}: "${headers[i]}"`);
          break;
        }
      }
      // If still no description, use any remaining text column
      if (result.descriptionIndex === null) {
        for (let i = 0; i < headers.length; i++) {
          if (usedIndices.has(i)) continue;
          result.descriptionIndex = i;
          usedIndices.add(i);
          console.log(`[CSVDetector] Fallback: Using column ${i} as description: "${headers[i]}"`);
          break;
        }
      }
    }
  }

  /**
   * Parse a CSV line handling quoted fields properly
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  /**
   * Validate if CSV has minimum required columns
   */
  static hasMinimumColumns(detected: DetectedColumns): boolean {
    // Minimum required: date, amount, description
    return (
      detected.dateIndex !== null &&
      detected.amountIndex !== null &&
      detected.descriptionIndex !== null
    );
  }

  /**
   * Parse a CSV row using detected columns
   */
  static parseRow(
    rawRow: string[],
    detected: DetectedColumns,
    rowNumber: number
  ): { success: boolean; row?: ParsedCSVRow; error?: string } {
    try {
      // Extract values
      const dateStr = detected.dateIndex !== null ? rawRow[detected.dateIndex]?.trim() : "";
      const amountStr = detected.amountIndex !== null ? rawRow[detected.amountIndex]?.trim() : "";
      const description = detected.descriptionIndex !== null ? rawRow[detected.descriptionIndex]?.trim() : "";
      const category = detected.categoryIndex !== null ? rawRow[detected.categoryIndex]?.trim() : undefined;
      const typeStr = detected.typeIndex !== null ? rawRow[detected.typeIndex]?.trim() : undefined;
      const merchant = detected.merchantIndex !== null ? rawRow[detected.merchantIndex]?.trim() : undefined;

      // Validate required fields
      if (!dateStr) {
        return { success: false, error: `Row ${rowNumber}: Missing date` };
      }

      if (!amountStr) {
        return { success: false, error: `Row ${rowNumber}: Missing amount` };
      }

      if (!description) {
        return { success: false, error: `Row ${rowNumber}: Missing description` };
      }

      // Validate date format
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return {
          success: false,
          error: `Row ${rowNumber}: Invalid date format "${dateStr}"`,
        };
      }

      // Parse amount - handle various formats
      let amount = 0;
      const cleanAmount = amountStr
        .replace(/[£€$,\s]/g, "")
        .replace(/[()]/g, (match) => (match === "(" ? "-" : ""));

      amount = parseFloat(cleanAmount);
      if (isNaN(amount) || amount === 0) {
        return {
          success: false,
          error: `Row ${rowNumber}: Invalid amount "${amountStr}"`,
        };
      }

      // Detect transaction type if not provided
      let type: "debit" | "credit" = "debit";
      if (typeStr) {
        const lowerType = typeStr.toLowerCase();
        if (
          lowerType.includes("credit") ||
          lowerType.includes("deposit") ||
          lowerType.includes("income") ||
          lowerType.includes("salary")
        ) {
          type = "credit";
        } else {
          type = "debit";
        }
      } else if (amount < 0) {
        type = "debit";
        amount = Math.abs(amount);
      } else {
        // Positive amount - try to infer from description
        const descLower = description.toLowerCase();
        if (
          descLower.includes("salary") ||
          descLower.includes("deposit") ||
          descLower.includes("income") ||
          descLower.includes("refund") ||
          descLower.includes("credit")
        ) {
          type = "credit";
        }
      }

      return {
        success: true,
        row: {
          date: date.toISOString(),
          amount: Math.abs(amount),
          description: description.trim(),
          category: category || undefined,
          type,
          merchant: merchant || description.trim(),
          rawRow,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Row ${rowNumber}: Error parsing row - ${error}`,
      };
    }
  }

  /**
   * Detect if first row is a header based on content
   */
  static isHeaderRow(firstRow: string): boolean {
    const headers = firstRow.split(",").map((h) => h.trim().toLowerCase());

    const headerKeywords = [
      "date",
      "description",
      "amount",
      "category",
      "type",
      "merchant",
      "detail",
      "transaction",
      "reference",
      "posting",
      "value",
      "narrative",
    ];

    // If row has 3+ header-like keywords, treat it as header
    const keywordCount = headers.filter((h) =>
      headerKeywords.some((kw) => h.includes(kw))
    ).length;

    return keywordCount >= 2;
  }

  /**
   * Parse UK date formats (DD/MM/YYYY, DD MMM YYYY, ISO)
   */
  static parseUKDate(dateStr: string): Date | null {
    const trimmed = dateStr.trim();

    // ISO format: 2024-01-15 or 2024-01-15T10:30:00Z
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const date = new Date(trimmed);
      return isNaN(date.getTime()) ? null : date;
    }

    // DD/MM/YYYY format
    const ukDateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (ukDateMatch) {
      const day = parseInt(ukDateMatch[1]);
      const month = parseInt(ukDateMatch[2]) - 1;
      let year = parseInt(ukDateMatch[3]);
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }

    // DD MMM YYYY format (e.g., 01 Jan 2024)
    const textDateMatch = trimmed.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/);
    if (textDateMatch) {
      const date = new Date(trimmed);
      return isNaN(date.getTime()) ? null : date;
    }

    // Fallback to standard parsing
    const date = new Date(trimmed);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Parse row using bank-specific format
   */
  static parseRowWithBankFormat(
    row: Record<string, string>,
    bank: BankFormat,
    rowNumber: number
  ): { success: boolean; row?: ParsedCSVRow; error?: string } {
    try {
      // Find date column value
      let dateStr = '';
      for (const col of bank.columns.date) {
        if (row[col] !== undefined && row[col] !== '') {
          dateStr = row[col];
          break;
        }
      }

      // Find description column value
      let description = '';
      for (const col of bank.columns.description) {
        if (row[col] !== undefined && row[col] !== '') {
          description = row[col];
          break;
        }
      }

      // Parse date
      const parsedDate = parseBankDate(dateStr, bank.dateFormat);
      if (!parsedDate) {
        return { success: false, error: `Row ${rowNumber}: Invalid date "${dateStr}"` };
      }

      // Parse amount
      const amount = parseBankAmount(row, bank);
      if (amount === null) {
        return { success: false, error: `Row ${rowNumber}: Invalid amount` };
      }

      // Skip zero amount rows
      if (amount === 0) {
        return { success: false, error: `Row ${rowNumber}: Zero amount` };
      }

      // Get category if available
      let category: string | undefined;
      if (bank.columns.category) {
        for (const col of bank.columns.category) {
          if (row[col] !== undefined && row[col] !== '') {
            category = row[col];
            break;
          }
        }
      }

      // Determine type from amount sign
      const type: 'debit' | 'credit' = amount < 0 ? 'debit' : 'credit';

      return {
        success: true,
        row: {
          date: parsedDate.toISOString(),
          amount: Math.abs(amount),
          description: description.trim(),
          category,
          type,
          merchant: description.trim(),
          rawRow: Object.values(row),
        },
      };
    } catch (error) {
      return { success: false, error: `Row ${rowNumber}: Parse error - ${error}` };
    }
  }

  /**
   * Main parsing function - detects format and parses CSV
   * Enhanced with UK bank auto-detection and smart fallbacks
   */
  static parseCSV(csvText: string, selectedBank?: BankFormat | null): CSVParseResult {
    const lines = csvText.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return {
        rows: [],
        errors: ["CSV must contain at least a header row and one data row"],
        detectedColumns: {
          dateIndex: null,
          amountIndex: null,
          descriptionIndex: null,
          categoryIndex: null,
          typeIndex: null,
          merchantIndex: null,
        },
        formatDetected: "unknown",
      };
    }

    console.log('[CSVDetector] Starting CSV parse with', lines.length, 'lines');
    console.log('[CSVDetector] First line (header):', lines[0].substring(0, 200));

    // Try to detect bank format
    const detectedBank = selectedBank || detectBankFromCSV(csvText);
    console.log('[CSVDetector] Detected bank:', detectedBank?.name || 'none');

    // If we detected a UK bank, try bank-specific parsing first
    if (detectedBank && detectedBank.id !== 'generic') {
      console.log('[CSVDetector] Attempting bank-specific parsing for:', detectedBank.name);
      const bankResult = this.parseCSVWithBankFormat(csvText, detectedBank);

      // If bank-specific parsing succeeded with rows, return it
      if (bankResult.rows.length > 0) {
        console.log('[CSVDetector] Bank-specific parsing succeeded with', bankResult.rows.length, 'rows');
        return bankResult;
      }

      // If bank-specific parsing failed, fall through to generic
      console.log('[CSVDetector] Bank-specific parsing failed, trying generic...');
    }

    // Try generic parsing with smart column detection
    console.log('[CSVDetector] Using generic parsing with smart detection');
    const genericResult = this.parseCSVGeneric(csvText);

    // If generic parsing worked, return it
    if (genericResult.rows.length > 0) {
      console.log('[CSVDetector] Generic parsing succeeded with', genericResult.rows.length, 'rows');
      return genericResult;
    }

    // Last resort: try with the generic bank format from ukBankFormats
    console.log('[CSVDetector] Trying with generic bank format as last resort');
    const genericBankFormat = UK_BANK_FORMATS.generic;
    if (genericBankFormat) {
      const lastResortResult = this.parseCSVWithBankFormat(csvText, genericBankFormat);
      if (lastResortResult.rows.length > 0) {
        console.log('[CSVDetector] Last resort parsing succeeded with', lastResortResult.rows.length, 'rows');
        return lastResortResult;
      }
    }

    // Return the generic result even if empty (will contain error messages)
    return genericResult;
  }

  /**
   * Parse CSV using bank-specific format
   * Enhanced with flexible column matching
   */
  static parseCSVWithBankFormat(csvText: string, bank: BankFormat): CSVParseResult {
    const lines = csvText.split("\n").filter((line) => line.trim());
    const rows: ParsedCSVRow[] = [];
    const errors: string[] = [];

    // Skip rows if specified
    const skipRows = bank.skipRows || 0;
    const dataStartIndex = bank.hasHeader ? skipRows + 1 : skipRows;

    // Parse header row to get column names using proper CSV parsing
    const headerLine = lines[skipRows] || '';
    const headers = this.parseCSVLine(headerLine).map((h) => h.trim().replace(/^"|"$/g, ''));

    console.log('[CSVDetector] Bank format headers found:', headers);

    // Create case-insensitive header mapping
    const headerMap: Record<string, number> = {};
    headers.forEach((h, idx) => {
      headerMap[h.toLowerCase()] = idx;
    });

    // Find column indices using bank's column definitions (case-insensitive)
    const findColumnIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const lowerName = name.toLowerCase();
        // Exact match
        if (headerMap[lowerName] !== undefined) {
          return headerMap[lowerName];
        }
        // Partial match
        for (const header of Object.keys(headerMap)) {
          if (header.includes(lowerName) || lowerName.includes(header)) {
            return headerMap[header];
          }
        }
      }
      return -1;
    };

    const dateColIdx = findColumnIndex(bank.columns.date);
    const amountColIdx = findColumnIndex(bank.columns.amount);
    const descColIdx = findColumnIndex(bank.columns.description);
    const categoryColIdx = bank.columns.category ? findColumnIndex(bank.columns.category) : -1;
    const debitColIdx = bank.columns.debitColumn ? findColumnIndex(bank.columns.debitColumn) : -1;
    const creditColIdx = bank.columns.creditColumn ? findColumnIndex(bank.columns.creditColumn) : -1;

    console.log('[CSVDetector] Column indices - Date:', dateColIdx, 'Amount:', amountColIdx, 'Desc:', descColIdx);

    // If we couldn't find required columns, return empty to trigger fallback
    if (dateColIdx === -1 || (amountColIdx === -1 && debitColIdx === -1 && creditColIdx === -1) || descColIdx === -1) {
      console.log('[CSVDetector] Could not find required columns for bank format');
      return {
        rows: [],
        errors: ['Could not match bank format columns'],
        detectedColumns: {
          dateIndex: dateColIdx >= 0 ? dateColIdx : null,
          amountIndex: amountColIdx >= 0 ? amountColIdx : null,
          descriptionIndex: descColIdx >= 0 ? descColIdx : null,
          categoryIndex: categoryColIdx >= 0 ? categoryColIdx : null,
          typeIndex: null,
          merchantIndex: null,
        },
        formatDetected: `uk_bank_${bank.id}_failed`,
        detectedBank: bank,
      };
    }

    // Parse data rows
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i];
      const cells = this.parseCSVLine(line).map((c) => c.trim().replace(/^"|"$/g, ''));

      // Skip empty rows
      if (cells.filter((c) => c).length === 0) continue;

      // Create row object mapping headers to values
      const rowObj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        rowObj[header] = cells[idx] || '';
      });

      // Also add by index for fallback
      cells.forEach((cell, idx) => {
        rowObj[`_col${idx}`] = cell;
      });

      // Parse the row using bank format
      const result = this.parseRowWithBankFormatDirect(
        cells, dateColIdx, amountColIdx, descColIdx, debitColIdx, creditColIdx, categoryColIdx,
        bank, i + 1
      );

      if (result.success && result.row) {
        rows.push(result.row);
      } else if (result.error && !result.error.includes('Zero amount')) {
        // Only keep first 5 errors to avoid flooding
        if (errors.length < 5) {
          errors.push(result.error);
        }
      }
    }

    return {
      rows,
      errors,
      detectedColumns: {
        dateIndex: dateColIdx,
        amountIndex: amountColIdx >= 0 ? amountColIdx : (debitColIdx >= 0 ? debitColIdx : creditColIdx),
        descriptionIndex: descColIdx,
        categoryIndex: categoryColIdx >= 0 ? categoryColIdx : null,
        typeIndex: null,
        merchantIndex: null,
      },
      formatDetected: `uk_bank_${bank.id}`,
      detectedBank: bank,
    };
  }

  /**
   * Parse row using direct column indices (more reliable)
   */
  private static parseRowWithBankFormatDirect(
    cells: string[],
    dateIdx: number,
    amountIdx: number,
    descIdx: number,
    debitIdx: number,
    creditIdx: number,
    categoryIdx: number,
    bank: BankFormat,
    rowNumber: number
  ): { success: boolean; row?: ParsedCSVRow; error?: string } {
    try {
      const dateStr = cells[dateIdx] || '';
      const description = cells[descIdx] || '';
      const category = categoryIdx >= 0 ? cells[categoryIdx] : undefined;

      // Parse date
      const parsedDate = parseBankDate(dateStr, bank.dateFormat);
      if (!parsedDate) {
        // Try other common date formats
        const fallbackDate = this.tryParseDateFlexible(dateStr);
        if (!fallbackDate) {
          return { success: false, error: `Row ${rowNumber}: Invalid date "${dateStr}"` };
        }
      }

      // Parse amount based on format
      let amount: number | null = null;

      if (bank.amountFormat === 'split' && (debitIdx >= 0 || creditIdx >= 0)) {
        // Handle split debit/credit columns
        const debitStr = debitIdx >= 0 ? cells[debitIdx] : '';
        const creditStr = creditIdx >= 0 ? cells[creditIdx] : '';

        const debit = this.parseAmountString(debitStr);
        const credit = this.parseAmountString(creditStr);

        if (debit && debit > 0) {
          amount = -debit;
        } else if (credit && credit > 0) {
          amount = credit;
        } else if (debit === 0 && credit === 0) {
          return { success: false, error: `Row ${rowNumber}: Zero amount` };
        }
      } else if (amountIdx >= 0) {
        // Single amount column
        amount = this.parseAmountString(cells[amountIdx]);
      }

      if (amount === null) {
        return { success: false, error: `Row ${rowNumber}: Invalid amount` };
      }

      if (amount === 0) {
        return { success: false, error: `Row ${rowNumber}: Zero amount` };
      }

      // Skip if description is empty
      if (!description.trim()) {
        return { success: false, error: `Row ${rowNumber}: Empty description` };
      }

      const finalDate = parsedDate || this.tryParseDateFlexible(dateStr) || new Date();
      const type: 'debit' | 'credit' = amount < 0 ? 'debit' : 'credit';

      return {
        success: true,
        row: {
          date: finalDate.toISOString(),
          amount: Math.abs(amount),
          description: description.trim(),
          category: category?.trim() || undefined,
          type,
          merchant: description.trim(),
          rawRow: cells,
        },
      };
    } catch (error) {
      return { success: false, error: `Row ${rowNumber}: Parse error - ${error}` };
    }
  }

  /**
   * Parse amount string handling various formats
   */
  private static parseAmountString(amountStr: string): number | null {
    if (!amountStr || amountStr.trim() === '') return null;

    // Clean the amount string
    let cleaned = amountStr
      .replace(/[£€$,\s]/g, '')
      .replace(/\(([^)]+)\)/, '-$1')  // Handle (123.45) as negative
      .trim();

    // Handle CR/DR suffixes
    if (cleaned.endsWith('CR')) {
      cleaned = cleaned.replace('CR', '');
    } else if (cleaned.endsWith('DR')) {
      cleaned = '-' + cleaned.replace('DR', '');
    }

    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : amount;
  }

  /**
   * Try to parse date with multiple formats
   */
  private static tryParseDateFlexible(dateStr: string): Date | null {
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    // Try common formats
    const formats = [
      // ISO
      () => {
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
          const d = new Date(trimmed);
          return isNaN(d.getTime()) ? null : d;
        }
        return null;
      },
      // DD/MM/YYYY
      () => {
        const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (match) {
          let year = parseInt(match[3]);
          if (year < 100) year += 2000;
          return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]));
        }
        return null;
      },
      // MM/DD/YYYY (US format)
      () => {
        const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (match) {
          const month = parseInt(match[1]);
          const day = parseInt(match[2]);
          // If first number > 12, it's likely DD/MM format, skip
          if (month > 12) return null;
          let year = parseInt(match[3]);
          if (year < 100) year += 2000;
          return new Date(year, month - 1, day);
        }
        return null;
      },
      // DD MMM YYYY or DD-MMM-YYYY
      () => {
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? null : d;
      },
    ];

    for (const tryFormat of formats) {
      const result = tryFormat();
      if (result && !isNaN(result.getTime())) {
        return result;
      }
    }

    return null;
  }

  /**
   * Generic CSV parsing (enhanced with better parsing)
   */
  static parseCSVGeneric(csvText: string): CSVParseResult {
    const lines = csvText.split("\n").filter((line) => line.trim());

    // Detect if first row is header
    const firstRowIsHeader = this.isHeaderRow(lines[0]);
    const dataLines = firstRowIsHeader ? lines.slice(1) : lines;
    const headerLine = firstRowIsHeader ? lines[0] : lines[0];

    console.log('[CSVDetector] Generic parsing - Header:', headerLine.substring(0, 150));
    console.log('[CSVDetector] Generic parsing - Is header row:', firstRowIsHeader);

    // Detect columns
    const detected = this.detectColumns(headerLine);

    // Check if we have minimum columns
    if (!this.hasMinimumColumns(detected)) {
      console.log('[CSVDetector] Generic parsing - Missing columns:', detected);
      return {
        rows: [],
        errors: [
          "CSV must contain at least: Date, Amount, and Description columns",
        ],
        detectedColumns: detected,
        formatDetected: "insufficient_columns",
      };
    }

    console.log('[CSVDetector] Generic parsing - Detected columns:', detected);

    // Determine format type
    let formatDetected = "generic";
    if (
      detected.categoryIndex !== null &&
      detected.typeIndex !== null &&
      detected.merchantIndex !== null
    ) {
      formatDetected = "full";
    } else if (detected.categoryIndex !== null && detected.typeIndex !== null) {
      formatDetected = "with_category_and_type";
    } else if (detected.categoryIndex !== null) {
      formatDetected = "with_category";
    }

    // Parse data rows
    const rows: ParsedCSVRow[] = [];
    const errors: string[] = [];

    dataLines.forEach((line, index) => {
      const rowNumber = firstRowIsHeader ? index + 2 : index + 1;
      // Use proper CSV line parsing
      const rawRow = this.parseCSVLine(line).map((cell) => cell.trim().replace(/^"|"$/g, ""));

      // Skip empty rows
      if (rawRow.filter((cell) => cell).length === 0) {
        return;
      }

      const result = this.parseRowEnhanced(rawRow, detected, rowNumber);

      if (result.success && result.row) {
        rows.push(result.row);
      } else if (result.error && !result.error.includes('Zero amount')) {
        // Only keep first 5 errors
        if (errors.length < 5) {
          errors.push(result.error);
        }
      }
    });

    console.log('[CSVDetector] Generic parsing - Parsed', rows.length, 'rows with', errors.length, 'errors');

    return {
      rows,
      errors,
      detectedColumns: detected,
      formatDetected,
      detectedBank: null,
    };
  }

  /**
   * Enhanced row parsing with better date and amount handling
   */
  private static parseRowEnhanced(
    rawRow: string[],
    detected: DetectedColumns,
    rowNumber: number
  ): { success: boolean; row?: ParsedCSVRow; error?: string } {
    try {
      // Extract values
      const dateStr = detected.dateIndex !== null ? rawRow[detected.dateIndex]?.trim() : "";
      const amountStr = detected.amountIndex !== null ? rawRow[detected.amountIndex]?.trim() : "";
      const description = detected.descriptionIndex !== null ? rawRow[detected.descriptionIndex]?.trim() : "";
      const category = detected.categoryIndex !== null ? rawRow[detected.categoryIndex]?.trim() : undefined;
      const typeStr = detected.typeIndex !== null ? rawRow[detected.typeIndex]?.trim() : undefined;
      const merchant = detected.merchantIndex !== null ? rawRow[detected.merchantIndex]?.trim() : undefined;

      // Validate required fields
      if (!dateStr) {
        return { success: false, error: `Row ${rowNumber}: Missing date` };
      }

      if (!amountStr) {
        return { success: false, error: `Row ${rowNumber}: Missing amount` };
      }

      if (!description) {
        return { success: false, error: `Row ${rowNumber}: Missing description` };
      }

      // Parse date using flexible parsing
      const date = this.tryParseDateFlexible(dateStr);
      if (!date) {
        return {
          success: false,
          error: `Row ${rowNumber}: Invalid date format "${dateStr}"`,
        };
      }

      // Parse amount using enhanced parsing
      const amount = this.parseAmountString(amountStr);
      if (amount === null) {
        return {
          success: false,
          error: `Row ${rowNumber}: Invalid amount "${amountStr}"`,
        };
      }

      if (amount === 0) {
        return { success: false, error: `Row ${rowNumber}: Zero amount` };
      }

      // Detect transaction type if not provided
      let type: "debit" | "credit" = "debit";
      if (typeStr) {
        const lowerType = typeStr.toLowerCase();
        if (
          lowerType.includes("credit") ||
          lowerType.includes("deposit") ||
          lowerType.includes("income") ||
          lowerType.includes("salary") ||
          lowerType.includes("refund")
        ) {
          type = "credit";
        } else {
          type = "debit";
        }
      } else if (amount > 0) {
        // Positive amount might be credit - check description
        const descLower = description.toLowerCase();
        if (
          descLower.includes("salary") ||
          descLower.includes("deposit") ||
          descLower.includes("income") ||
          descLower.includes("refund") ||
          descLower.includes("credit") ||
          descLower.includes("transfer in")
        ) {
          type = "credit";
        }
      } else {
        type = "debit";
      }

      return {
        success: true,
        row: {
          date: date.toISOString(),
          amount: Math.abs(amount),
          description: description.trim(),
          category: category || undefined,
          type,
          merchant: merchant || description.trim(),
          rawRow,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Row ${rowNumber}: Error parsing row - ${error}`,
      };
    }
  }
}
