import api from './api';

export interface BillPreference {
  userId: string;
  billId: string;
  category?: string;
  status: 'active' | 'inactive';
  customName?: string;
  isIgnored?: boolean;
  userModified: boolean;
  createdAt: number;
  updatedAt: number;
}

// Get all bill preferences for the current user
export const getBillPreferences = async (): Promise<BillPreference[]> => {
  try {
    console.log('[billPreferencesAPI] Fetching user bill preferences');
    
    const response = await api.get('/bills/preferences');
    
    console.log('[billPreferencesAPI] Bill preferences response:', response.data);
    
    return response.data.preferences || [];
  } catch (error: any) {
    // Don't log as error if it's just a 404 (no preferences found) - this is expected
    if (error.response?.status === 404) {
      console.log('[billPreferencesAPI] No bill preferences found (404) - using defaults');
    } else {
      console.error('[billPreferencesAPI] Error fetching bill preferences:', error);
    }
    // Return empty array if there's an error (e.g., user has no preferences yet)
    return [];
  }
};

// Update bill category
export const updateBillCategory = async (billId: string, category: string): Promise<void> => {
  try {
    console.log(`[billPreferencesAPI] Updating bill category - Bill: ${billId}, Category: ${category}`);
    
    const response = await api.put('/bills/preferences', {
      action: 'category',
      billId,
      category
    });
    
    console.log('[billPreferencesAPI] Category update response:', response.data);
  } catch (error) {
    console.error('[billPreferencesAPI] Error updating bill category:', error);
    throw error;
  }
};

// Update bill status (active/inactive)
export const updateBillStatus = async (billId: string, status: 'active' | 'inactive'): Promise<void> => {
  try {
    console.log(`[billPreferencesAPI] Updating bill status - Bill: ${billId}, Status: ${status}`);
    
    const response = await api.put('/bills/preferences', {
      action: 'status',
      billId,
      status
    });
    
    console.log('[billPreferencesAPI] Status update response:', response.data);
  } catch (error) {
    console.error('[billPreferencesAPI] Error updating bill status:', error);
    throw error;
  }
};

// Update bill custom name
export const updateBillName = async (billId: string, customName: string): Promise<void> => {
  try {
    console.log(`[billPreferencesAPI] Updating bill name - Bill: ${billId}, Name: ${customName}`);
    
    const response = await api.put('/bills/preferences', {
      action: 'name',
      billId,
      customName
    });
    
    console.log('[billPreferencesAPI] Name update response:', response.data);
  } catch (error) {
    console.error('[billPreferencesAPI] Error updating bill name:', error);
    throw error;
  }
};

// Create or save bill preference
export const saveBillPreference = async (preference: Partial<BillPreference>): Promise<void> => {
  try {
    console.log('[billPreferencesAPI] Saving bill preference:', preference);
    
    const response = await api.put('/bills/preferences', {
      action: 'create',
      ...preference
    });
    
    console.log('[billPreferencesAPI] Save response:', response.data);
  } catch (error) {
    console.error('[billPreferencesAPI] Error saving bill preference:', error);
    throw error;
  }
};

// Delete bill preference
export const deleteBillPreference = async (billId: string): Promise<void> => {
  try {
    console.log(`[billPreferencesAPI] Deleting bill preference - Bill: ${billId}`);
    
    const response = await api.delete(`/bills/preferences/${billId}`);
    
    console.log('[billPreferencesAPI] Delete response:', response.data);
  } catch (error) {
    console.error('[billPreferencesAPI] Error deleting bill preference:', error);
    throw error;
  }
};

// Helper function to merge bill preferences with detected bills
export const mergeBillsWithPreferences = (detectedBills: any[], preferences: BillPreference[]): any[] => {
  console.log(`[billPreferencesAPI] Merging ${detectedBills.length} detected bills with ${preferences.length} preferences`);
  
  return detectedBills.map(bill => {
    const preference = preferences.find(p => p.billId === bill.id);
    
    if (preference) {
      return {
        ...bill,
        category: preference.category || bill.category,
        status: preference.status,
        name: preference.customName || bill.name,
        isIgnored: preference.isIgnored || false,
        userModified: preference.userModified
      };
    }
    
    return bill;
  }).filter(bill => !bill.isIgnored); // Filter out ignored bills
};

// Helper to create bill preference from detected bill
export const createPreferenceFromBill = (bill: any, overrides: Partial<BillPreference> = {}): Partial<BillPreference> => {
  return {
    billId: bill.id,
    category: overrides.category || bill.category,
    status: overrides.status || bill.status || 'active',
    customName: overrides.customName,
    isIgnored: overrides.isIgnored || false,
    userModified: true,
    ...overrides
  };
};