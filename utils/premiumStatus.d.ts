export declare const PREMIUM_ENTITLEMENT_IDS: string[];

/** Returns the active premium entitlement object, or null if none. */
export declare function getPremiumEntitlement(customerInfo: any): any | null;

/** True when CustomerInfo grants an active, non-expired premium entitlement. */
export declare function hasActivePremiumEntitlement(
  customerInfo: any,
  now?: Date
): boolean;

/** isPro = SDK_premium OR backend_premium. Either being true grants Pro. */
export declare function resolveIsPro(
  sdkPremium: boolean,
  backendPremium: boolean
): boolean;
