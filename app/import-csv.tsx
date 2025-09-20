import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../contexts/ThemeContext';
import { transactionAPI } from '../services/api';
import { autoBillDetection } from '../services/automaticBillDetection';
import { ExpenseCategory, ImportPreview } from '../types/expense';

interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  type?: 'debit' | 'credit';
}

const CSV_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food', name: 'Food & Dining', emoji: '🍔' },
  { id: 'transport', name: 'Transport', emoji: '🚗' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬' },
  { id: 'bills', name: 'Bills & Utilities', emoji: '💡' },
  { id: 'healthcare', name: 'Healthcare', emoji: '💊' },
  { id: 'education', name: 'Education', emoji: '📚' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'groceries', name: 'Groceries', emoji: '🛒' },
  { id: 'fuel', name: 'Fuel', emoji: '⛽' },
  { id: 'subscriptions', name: 'Subscriptions', emoji: '💳' },
  { id: 'income', name: 'Income', emoji: '💰' },
  { id: 'other', name: 'Other', emoji: '📦' },
];


export default function CSVImportScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [allTransactions, setAllTransactions] = useState<CSVTransaction[]>([]);

  const validateCSVFormat = (csvText: string): { isValid: boolean; error?: string } => {
    // Check if file is empty or too small
    if (!csvText || csvText.trim().length < 10) {
      return { isValid: false, error: 'File appears to be empty or too small.' };
    }

    // Check for basic CSV structure
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { isValid: false, error: 'File must contain at least a header row and one data row.' };
    }

    // Check if it looks like a CSV (contains commas)
    const hasCommas = lines.some(line => line.includes(','));
    if (!hasCommas) {
      return { isValid: false, error: 'File does not appear to be in CSV format (no commas found).' };
    }

    // Check header row for expected columns
    const header = lines[0].toLowerCase();
    const hasDate = header.includes('date') || header.includes('transaction date') || header.includes('posted date');
    const hasDescription = header.includes('description') || header.includes('memo') || header.includes('reference') || header.includes('details');
    const hasAmount = header.includes('amount') || header.includes('debit') || header.includes('credit') || header.includes('value');

    if (!hasDate && !hasDescription && !hasAmount) {
      // Maybe no header row, check if first data row looks valid
      const firstDataRow = lines[0].split(',');
      if (firstDataRow.length < 3) {
        return { isValid: false, error: 'CSV must have at least 3 columns: Date, Description, Amount (or Debit/Credit).' };
      }

      // Try to validate first row as data
      const dateStr = firstDataRow[0].trim().replace(/"/g, '');
      if (!isValidDate(dateStr)) {
        return { isValid: false, error: 'First column does not appear to contain valid dates.' };
      }
    }

    return { isValid: true };
  };

  const parseCSV = (csvText: string): CSVTransaction[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const transactions: CSVTransaction[] = [];
    const errors: string[] = [];
    let validRows = 0;
    let invalidRows = 0;

    // Determine if first row is header
    const firstRow = lines[0].toLowerCase();
    const isHeader = firstRow.includes('date') || firstRow.includes('description') || firstRow.includes('amount');
    const dataLines = isHeader ? lines.slice(1) : lines;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      const rowNumber = i + (isHeader ? 2 : 1);

      // Validate minimum columns
      if (columns.length < 3) {
        errors.push(`Row ${rowNumber}: Must have at least 3 columns`);
        invalidRows++;
        continue;
      }

      const dateStr = columns[0];
      const description = columns[1];
      let amount = 0;
      let type: 'debit' | 'credit' = 'debit';

      // Validate date
      if (!dateStr || !isValidDate(dateStr)) {
        errors.push(`Row ${rowNumber}: Invalid or missing date "${dateStr}"`);
        invalidRows++;
        continue;
      }

      // Validate description
      if (!description || description.length < 2) {
        errors.push(`Row ${rowNumber}: Description too short or missing`);
        invalidRows++;
        continue;
      }

      // Parse amount based on format
      let amountParsed = false;

      if (columns.length === 3) {
        // Format 1: Date, Description, Amount
        const amountStr = columns[2];
        if (!amountStr) {
          errors.push(`Row ${rowNumber}: Amount is missing`);
          invalidRows++;
          continue;
        }

        const rawAmount = parseFloat(amountStr.replace(/[£$,\s]/g, ''));
        if (isNaN(rawAmount)) {
          errors.push(`Row ${rowNumber}: Invalid amount "${amountStr}"`);
          invalidRows++;
          continue;
        }

        if (rawAmount < 0) {
          amount = Math.abs(rawAmount);
          type = 'debit';
        } else if (rawAmount > 0) {
          amount = rawAmount;
          type = 'credit';
        } else {
          errors.push(`Row ${rowNumber}: Amount cannot be zero`);
          invalidRows++;
          continue;
        }
        amountParsed = true;

      } else if (columns.length >= 4) {
        // Format 2: Date, Description, Debit, Credit
        const debitStr = columns[2];
        const creditStr = columns[3];

        const debit = parseFloat(debitStr.replace(/[£$,\s]/g, '')) || 0;
        const credit = parseFloat(creditStr.replace(/[£$,\s]/g, '')) || 0;

        if (debit > 0 && credit > 0) {
          errors.push(`Row ${rowNumber}: Cannot have both debit and credit amounts`);
          invalidRows++;
          continue;
        }

        if (debit > 0) {
          amount = debit;
          type = 'debit';
          amountParsed = true;
        } else if (credit > 0) {
          amount = credit;
          type = 'credit';
          amountParsed = true;
        } else {
          errors.push(`Row ${rowNumber}: No valid amount found in debit or credit columns`);
          invalidRows++;
          continue;
        }
      }

      // Validate amount limits
      if (amount > 50000) {
        errors.push(`Row ${rowNumber}: Amount £${amount.toFixed(2)} seems unusually large`);
        invalidRows++;
        continue;
      }

      if (amountParsed) {
        const category = categorizeTransaction(description);

        transactions.push({
          id: `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: formatDate(dateStr),
          description: description.trim(),
          amount: type === 'debit' ? -amount : amount,
          currency: 'GBP',
          type,
          category,
        });
        validRows++;
      }
    }

    // Show validation summary if there are errors
    if (invalidRows > 0) {
      const maxErrors = 5;
      const errorSummary = errors.slice(0, maxErrors).join('\n');
      const moreErrors = errors.length > maxErrors ? `\n... and ${errors.length - maxErrors} more errors` : '';

      Alert.alert(
        'Import Validation',
        `Found ${validRows} valid transactions and ${invalidRows} invalid rows.\n\nFirst few errors:\n${errorSummary}${moreErrors}\n\nDo you want to continue importing the valid transactions?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import Valid Only',
            onPress: () => {
              // Continue with valid transactions
            }
          }
        ]
      );
    }

    return transactions;
  };

  const isValidDate = (dateStr: string): boolean => {
    // Support various date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toISOString();
  };

  const categorizeTransaction = (description: string): string => {
    // Advanced keyword matching for transaction categorization
    const desc = description.toLowerCase();

    // Check for income keywords first
    if (desc.includes('salary') || desc.includes('wage') || desc.includes('pay') || desc.includes('income') ||
        desc.includes('deposit') || desc.includes('refund') || desc.includes('bonus') ||
        desc.includes('interest') || desc.includes('freelance') || desc.includes('dividend')) {
      return 'income';
    }

    // Bills detection - comprehensive patterns
    if (isBillTransaction(desc)) {
      return 'bills';
    }

    // Check for other expense categories
    if (desc.includes('supermarket') || desc.includes('grocery') || desc.includes('tesco') ||
        desc.includes('sainsbury') || desc.includes('asda') || desc.includes('morrisons') ||
        desc.includes('co-op') || desc.includes('waitrose') || desc.includes('lidl') ||
        desc.includes('aldi') || desc.includes('iceland')) {
      return 'groceries';
    } else if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('pub') ||
               desc.includes('takeaway') || desc.includes('mcdonald') || desc.includes('kfc') ||
               desc.includes('pizza') || desc.includes('burger') || desc.includes('subway') ||
               desc.includes('starbucks') || desc.includes('costa') || desc.includes('nando')) {
      return 'food';
    } else if (desc.includes('transport') || desc.includes('uber') || desc.includes('taxi') ||
               desc.includes('bus') || desc.includes('train') || desc.includes('petrol') ||
               desc.includes('fuel') || desc.includes('tfl') || desc.includes('oyster') ||
               desc.includes('parking') || desc.includes('toll')) {
      return 'transport';
    } else if (desc.includes('shopping') || desc.includes('amazon') || desc.includes('ebay') ||
               desc.includes('clothing') || desc.includes('fashion') || desc.includes('argos') ||
               desc.includes('currys') || desc.includes('john lewis') || desc.includes('marks') ||
               desc.includes('next') || desc.includes('h&m') || desc.includes('zara')) {
      return 'shopping';
    } else if (desc.includes('entertainment') || desc.includes('cinema') || desc.includes('netflix') ||
               desc.includes('spotify') || desc.includes('gym') || desc.includes('sport') ||
               desc.includes('amazon prime') || desc.includes('disney') || desc.includes('subscription') ||
               desc.includes('youtube') || desc.includes('apple music') || desc.includes('fitness')) {
      return 'entertainment';
    } else if (desc.includes('hospital') || desc.includes('doctor') || desc.includes('medical') ||
               desc.includes('pharmacy') || desc.includes('dentist') || desc.includes('optician') ||
               desc.includes('boots') || desc.includes('nhs') || desc.includes('prescription')) {
      return 'healthcare';
    } else if (desc.includes('education') || desc.includes('school') || desc.includes('university') ||
               desc.includes('college') || desc.includes('course') || desc.includes('tuition') ||
               desc.includes('books') || desc.includes('student')) {
      return 'education';
    } else if (desc.includes('travel') || desc.includes('hotel') || desc.includes('flight') ||
               desc.includes('airline') || desc.includes('booking') || desc.includes('expedia') ||
               desc.includes('airbnb') || desc.includes('holiday')) {
      return 'travel';
    } else {
      return 'other';
    }
  };

  const isBillTransaction = (description: string): boolean => {
    const desc = description.toLowerCase();

    // Utility bills patterns
    const utilityPatterns = [
      // Energy companies
      'british gas', 'bg', 'eon', 'e.on', 'edf', 'scottish power', 'npower',
      'sse', 'bulb', 'octopus', 'green supplier', 'utility warehouse',

      // Water companies
      'thames water', 'anglian water', 'severn trent', 'united utilities',
      'yorkshire water', 'south west water', 'water bill',

      // Telecoms
      'bt', 'ee', 'o2', 'vodafone', 'three', '3 mobile', 'virgin media',
      'sky', 'talktalk', 'plusnet', 'giffgaff', 'tesco mobile',

      // Internet/TV
      'broadband', 'wifi', 'internet', 'tv licence', 'netflix', 'spotify',
      'amazon prime', 'disney plus', 'apple music', 'youtube premium',

      // Insurance
      'insurance', 'policy', 'premium', 'aviva', 'axa', 'direct line',
      'churchill', 'admiral', 'compare the market', 'go compare',

      // Housing
      'rent', 'mortgage', 'council tax', 'service charge', 'ground rent',
      'letting', 'property', 'estate agent',

      // General bill keywords
      'bill', 'payment', 'direct debit', 'dd', 'standing order', 'so',
      'monthly payment', 'subscription', 'membership'
    ];

    // Bill-specific terms
    const billTerms = [
      'electric', 'electricity', 'gas', 'water', 'heating', 'energy',
      'phone', 'mobile', 'landline', 'broadband', 'internet', 'wifi',
      'council tax', 'rates', 'service charge', 'maintenance',
      'insurance', 'policy', 'premium', 'cover',
      'mortgage', 'rent', 'letting', 'property',
      'subscription', 'membership', 'annual fee', 'monthly fee'
    ];

    // Payment method indicators (often used for bills)
    const paymentIndicators = [
      'direct debit', 'dd ', ' dd', 'standing order', 'so ', ' so',
      'auto payment', 'recurring', 'monthly payment', 'quarterly payment',
      'annual payment', 'autopay'
    ];

    // Amount patterns that suggest bills (regular, round numbers)
    const isRegularAmount = (desc: string): boolean => {
      const amounts = desc.match(/[\d.,]+/g);
      if (amounts) {
        return amounts.some(amount => {
          const num = parseFloat(amount.replace(',', ''));
          // Bills often end in .00, .50, .99 or are round numbers
          return (num % 1 === 0) || (num % 0.5 === 0) ||
                 amount.endsWith('.99') || amount.endsWith('.00');
        });
      }
      return false;
    };

    // Check for utility company names
    if (utilityPatterns.some(pattern => desc.includes(pattern))) {
      return true;
    }

    // Check for bill-specific terms
    if (billTerms.some(term => desc.includes(term))) {
      return true;
    }

    // Check for payment method indicators
    if (paymentIndicators.some(indicator => desc.includes(indicator))) {
      return true;
    }

    // Check for regular amount patterns combined with neutral descriptions
    if (isRegularAmount(desc) && (
        desc.includes('payment') || desc.includes('monthly') ||
        desc.includes('annual') || desc.includes('quarterly')
    )) {
      return true;
    }

    // Date-based patterns (bills often have dates in description)
    const hasDatePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(desc);
    const hasMonthYear = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{2,4}\b/i.test(desc);

    if ((hasDatePattern || hasMonthYear) && (
        desc.includes('payment') || desc.includes('bill') || desc.includes('charge')
    )) {
      return true;
    }

    return false;
  };

  const handleFileSelect = async () => {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({});
      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      // Validate file extension
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
        Alert.alert(
          'Invalid File Type',
          'Please select a CSV file (.csv) or text file (.txt) with comma-separated values.'
        );
        setLoading(false);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert(
          'File Too Large',
          'File size exceeds 5MB limit. Please select a smaller file.'
        );
        setLoading(false);
        return;
      }

      setSelectedFile(file.name);

      // Read file content
      const response = await fetch(file.uri);
      const csvText = await response.text();

      // Validate CSV format first
      const validation = validateCSVFormat(csvText);
      if (!validation.isValid) {
        Alert.alert('Invalid CSV File', validation.error || 'The selected file is not a valid CSV format.');
        setLoading(false);
        return;
      }

      // Parse CSV
      const transactions = parseCSV(csvText);

      if (transactions.length === 0) {
        Alert.alert('No Data', 'No valid transactions found in the CSV file. Please check the format.');
        setLoading(false);
        return;
      }

      // Store all transactions for later import
      setAllTransactions(transactions);

      // Create preview
      const sortedTransactions = transactions.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const dates = transactions.map(t => new Date(t.date));
      const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const endDate = new Date(Math.max(...dates.map(d => d.getTime())));

      setImportPreview({
        transactions: sortedTransactions.slice(0, 10), // Show first 10 for preview
        totalTransactions: transactions.length,
        totalAmount,
        dateRange: {
          start: startDate.toLocaleDateString(),
          end: endDate.toLocaleDateString(),
        },
      });
    } catch (error) {
      console.error('Error reading CSV file:', error);
      Alert.alert('Error', 'Failed to read the CSV file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importPreview) return;

    try {
      setImporting(true);

      // Import all transactions to database only
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const transaction of allTransactions) {
        try {
          const transactionData = {
            amount: transaction.amount, // Keep original positive/negative amount
            originalAmount: Math.abs(transaction.amount),
            category: transaction.category,
            description: transaction.description,
            date: transaction.date,
            type: transaction.type,
            tags: transaction.type === 'debit' ? ['expense', 'csv-import'] : ['income', 'csv-import'],
            merchant: transaction.description,
            accountId: 'csv-import',
            bankName: 'CSV Import',
            accountType: 'Imported Account',
            isPending: false
          };

          await transactionAPI.createTransaction(transactionData);
          successCount++;

        } catch (error: any) {
          failedCount++;
          const errorMsg = `Failed to import "${transaction.description}": ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      const expenseCount = allTransactions.filter(t => t.amount < 0).length;
      const incomeCount = allTransactions.filter(t => t.amount > 0).length;
      const billCount = allTransactions.filter(t => t.category === 'bills').length;

      let summaryMessage = `Import completed:\n• ${successCount} transactions saved to database\n• ${expenseCount} expenses\n• ${incomeCount} income entries`;

      if (billCount > 0) {
        summaryMessage += `\n• ${billCount} bills detected automatically`;
      }

      if (failedCount > 0) {
        summaryMessage += `\n• ${failedCount} failed to import`;

        // Show first few errors
        if (errors.length > 0) {
          const maxErrors = 3;
          const errorSummary = errors.slice(0, maxErrors).join('\n');
          const moreErrors = errors.length > maxErrors ? `\n... and ${errors.length - maxErrors} more errors` : '';
          console.warn(`Import errors:\n${errorSummary}${moreErrors}`);
        }
      }

      // Trigger automatic bill detection for recurring patterns
      if (successCount > 0) {
        // Run bill detection in background (don't block the success alert)
        autoBillDetection.triggerBillDetection()
          .then(detectedBills => {
            if (detectedBills.length > 0) {
            }
          })
          .catch(error => {
            console.warn('[CSV Import] Background bill detection failed:', error);
          });

        summaryMessage += `\n\n💡 Check the Bills tab to see any recurring payments detected from your data.`;
      }

      Alert.alert(
        successCount > 0 ? 'Import Successful' : 'Import Failed',
        summaryMessage,
        [
          {
            text: 'View Dashboard',
            onPress: () => {
              router.replace('/');
            },
          },
          ...(successCount > 0 ? [{
            text: 'View Bills',
            onPress: () => {
              router.replace('/(tabs)/bills');
            },
          }] : []),
        ]
      );

    } catch (error) {
      console.error('Error importing CSV:', error);
      Alert.alert('Error', 'Failed to import transactions. Please check your connection and try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Import CSV
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Instructions */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Import Bank Statement
          </Text>
          <Text style={[styles.instructions, { color: colors.text.secondary }]}>
            Upload a CSV file from your bank statement to automatically import both expenses and income transactions. Files are validated for accuracy and security.
          </Text>

          <View style={styles.formatInfo}>
            <Text style={[styles.formatTitle, { color: colors.text.primary }]}>
              Supported CSV formats:
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Date, Description, Amount (negative = expense, positive = income)
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Date, Description, Debit, Credit (separate columns)
            </Text>
            <Text style={[styles.formatTitle, { color: colors.text.primary, marginTop: 12 }]}>
              Requirements:
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • File size: Maximum 5MB
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Valid dates (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Non-empty descriptions
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Amounts under £50,000
            </Text>
          </View>
        </View>

        {/* File Selection */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: colors.primary[100],
                borderColor: colors.primary[300],
              },
            ]}
            onPress={handleFileSelect}
            disabled={loading}
          >
            <Ionicons name="document-text" size={24} color={colors.primary[600]} />
            <Text style={[styles.selectButtonText, { color: colors.primary[600] }]}>
              {loading ? 'Reading file...' : 'Select CSV File'}
            </Text>
            {loading && <ActivityIndicator size="small" color={colors.primary[600]} />}
          </TouchableOpacity>

          {selectedFile && (
            <Text style={[styles.selectedFile, { color: colors.text.secondary }]}>
              Selected: {selectedFile}
            </Text>
          )}
        </View>

        {/* Import Preview */}
        {importPreview && (
          <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Import Preview
            </Text>

            <View style={styles.previewStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {importPreview.totalTransactions}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  Transactions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  £{importPreview.totalAmount.toFixed(2)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  Total Amount
                </Text>
              </View>
            </View>

            <Text style={[styles.dateRange, { color: colors.text.secondary }]}>
              Date range: {importPreview.dateRange.start} - {importPreview.dateRange.end}
            </Text>

            <View style={styles.previewList}>
              <Text style={[styles.previewTitle, { color: colors.text.primary }]}>
                Sample Transactions:
              </Text>
              {importPreview.transactions.map((transaction, index) => (
                <View key={index} style={styles.previewItem}>
                  <View style={styles.previewItemHeader}>
                    <Text style={[styles.previewDescription, { color: colors.text.primary }]}>
                      {transaction.description}
                    </Text>
                    <Text style={[styles.previewAmount, { color: transaction.amount > 0 ? '#059669' : '#DC2626' }]}>
                      {transaction.amount > 0 ? '+' : ''}£{Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.previewItemFooter}>
                    <Text style={[styles.previewDate, { color: colors.text.secondary }]}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                    <View style={[
                      styles.categoryTag,
                      {
                        backgroundColor: transaction.category === 'bills' ? '#FEF3C7' :
                                       transaction.amount > 0 ? '#E8F5E8' : '#FEF2F2'
                      }
                    ]}>
                      <Text style={[
                        styles.categoryText,
                        {
                          color: transaction.category === 'bills' ? '#D97706' :
                                 transaction.amount > 0 ? '#059669' : '#DC2626'
                        }
                      ]}>
                        {CSV_EXPENSE_CATEGORIES.find(c => c.id === transaction.category)?.name || 'Other'}
                        {transaction.category === 'bills' && ' 💡'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.importButton,
                {
                  backgroundColor: colors.primary[500],
                  opacity: importing ? 0.6 : 1,
                },
              ]}
              onPress={handleImport}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="cloud-upload" size={20} color="#fff" />
              )}
              <Text style={styles.importButtonText}>
                {importing ? 'Importing...' : 'Import All Transactions'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  formatInfo: {
    marginTop: 8,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formatItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedFile: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  dateRange: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  previewList: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  previewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  previewAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDate: {
    fontSize: 12,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

});