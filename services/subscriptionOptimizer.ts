// Basic subscription optimizer - all users have free access
export default {
  analyzeBillsWithPreferences: async (bills: any[]) => {
    // Return empty array - no subscription analysis for free users
    return [];
  },

  generateAISummary: (bills: any[]) => {
    return "Subscription analysis available in premium version";
  },

  generateCancellationGuide: (serviceName: string) => {
    return `To cancel ${serviceName}, visit their website or contact their support team.`;
  },

  saveUserPreference: async (preference: any) => {
    // No-op for free users
    return { success: true };
  }
};
