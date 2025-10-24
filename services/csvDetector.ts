/**
 * CSV Format Detection and Flexible Parsing
 * Detects various CSV formats and maps them to standard transaction format
 */

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

export class CSVDetector {
  /**
   * Flexible column detection for various CSV formats
   * Supports: Date, Amount, Description (minimum)
   * Optional: Category, Type, Merchant
   */
  static detectColumns(headerRow: string): DetectedColumns {
    const headers = headerRow.split(",").map((h) => h.trim().toLowerCase());
    const result: DetectedColumns = {
      dateIndex: null,
      amountIndex: null,
      descriptionIndex: null,
      categoryIndex: null,
      typeIndex: null,
      merchantIndex: null,
    };

    // Keyword patterns for each column type
    const datePatterns = ["date", "transaction date", "posting date", "posted"];
    const amountPatterns = [
      "amount",
      "value",
      "sum",
      "total",
      "debit",
      "credit",
      "withdrawal",
      "deposit",
    ];
    const descriptionPatterns = [
      "description",
      "detail",
      "details",
      "narrative",
      "reference",
      "memo",
      "transaction",
    ];
    const categoryPatterns = ["category", "type", "class"];
    const typePatterns = ["type", "transaction type", "ttype", "transtype"];
    const merchantPatterns = [
      "merchant",
      "counterparty",
      "party",
      "vendor",
      "supplier",
    ];

    // Match each header to column type
    headers.forEach((header, index) => {
      if (result.dateIndex === null && datePatterns.some((p) => header.includes(p))) {
        result.dateIndex = index;
      } else if (
        result.amountIndex === null &&
        amountPatterns.some((p) => header.includes(p))
      ) {
        result.amountIndex = index;
      } else if (
        result.descriptionIndex === null &&
        descriptionPatterns.some((p) => header.includes(p))
      ) {
        result.descriptionIndex = index;
      } else if (
        result.categoryIndex === null &&
        categoryPatterns.some((p) => header.includes(p))
      ) {
        result.categoryIndex = index;
      } else if (
        result.typeIndex === null &&
        typePatterns.some((p) => header.includes(p))
      ) {
        result.typeIndex = index;
      } else if (
        result.merchantIndex === null &&
        merchantPatterns.some((p) => header.includes(p))
      ) {
        result.merchantIndex = index;
      }
    });

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
   * Main parsing function - detects format and parses CSV
   */
  static parseCSV(csvText: string): {
    rows: ParsedCSVRow[];
    errors: string[];
    detectedColumns: DetectedColumns;
    formatDetected: string;
  } {
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

    // Detect if first row is header
    const firstRowIsHeader = this.isHeaderRow(lines[0]);
    const dataLines = firstRowIsHeader ? lines.slice(1) : lines;
    const headerLine = firstRowIsHeader ? lines[0] : lines[0]; // Use first line for detection even if it's data

    // Detect columns
    const detected = this.detectColumns(headerLine);

    // Check if we have minimum columns
    if (!this.hasMinimumColumns(detected)) {
      return {
        rows: [],
        errors: [
          "CSV must contain at least: Date, Amount, and Description columns",
        ],
        detectedColumns: detected,
        formatDetected: "insufficient_columns",
      };
    }

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
      const rawRow = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));

      // Skip empty rows
      if (rawRow.filter((cell) => cell).length === 0) {
        return;
      }

      const result = this.parseRow(rawRow, detected, rowNumber);

      if (result.success && result.row) {
        rows.push(result.row);
      } else if (result.error) {
        errors.push(result.error);
      }
    });

    return {
      rows,
      errors,
      detectedColumns: detected,
      formatDetected,
    };
  }
}
