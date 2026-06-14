import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { getActiveCurrency, setActiveCurrency } from "../utils/currencyStore";
import { formatCurrency } from "../utils/formatters";
import {
  DEFAULT_CURRENCY,
  isSupportedCurrency,
  localeForCurrency,
  symbolForCurrency,
} from "../constants/currencies";
import { profileAPI } from "../services/api/profileAPI";

const CURRENCY_STORAGE_KEY = "@expenzez_currency";

interface CurrencyContextType {
  /** Active display-currency ISO 4217 code (e.g. "GBP"). */
  currencyCode: string;
  /** Symbol for the active currency (e.g. "£"). */
  symbol: string;
  /** Change the display currency (persists locally + best-effort to profile). */
  setCurrency: (code: string) => void;
  /** Format an amount in the active display currency. */
  formatAmount: (
    amount: number,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
  ) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

/** Pick a supported currency from the device locale, else the default. */
function detectDeviceCurrency(): string {
  try {
    const locales = Localization.getLocales?.() ?? [];
    for (const locale of locales) {
      const code = (locale as { currencyCode?: string }).currencyCode;
      if (isSupportedCurrency(code)) {
        return (code as string).toUpperCase();
      }
    }
  } catch {
    // Localization may be unavailable in some environments — fall through.
  }
  return DEFAULT_CURRENCY;
}

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currencyCode, setCurrencyCodeState] = useState<string>(
    getActiveCurrency()
  );
  const [, setIsLoaded] = useState(false);

  // Normalize, push to the shared store, and update React state in one place.
  const applyCurrency = useCallback((code: string): string => {
    const normalized = (code || "").toUpperCase();
    const finalCode = isSupportedCurrency(normalized)
      ? normalized
      : DEFAULT_CURRENCY;
    setActiveCurrency(finalCode);
    setCurrencyCodeState(finalCode);
    return finalCode;
  }, []);

  // Resolve the initial currency: saved pref -> profile -> device -> default.
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
        if (isSupportedCurrency(saved)) {
          applyCurrency(saved as string);
          return;
        }

        let resolved: string | null = null;
        try {
          const profileResp = await profileAPI.getProfile();
          const pref = profileResp?.profile?.preferredCurrency;
          if (isSupportedCurrency(pref)) {
            resolved = pref;
          }
        } catch {
          // Not signed in yet / offline — fall back to device locale.
        }

        if (!resolved) {
          resolved = detectDeviceCurrency();
        }

        const finalCode = applyCurrency(resolved);
        await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, finalCode);
      } catch (error) {
        console.error("Error loading currency preference:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    load();
  }, [applyCurrency]);

  const setCurrency = useCallback(
    async (code: string) => {
      const finalCode = applyCurrency(code);
      try {
        await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, finalCode);
      } catch (error) {
        console.error("Error saving currency preference:", error);
      }
      // Best-effort sync to the backend profile (offline-first).
      try {
        await profileAPI.updatePreferredCurrency(finalCode);
      } catch (error: any) {
        console.warn(
          "Failed to sync currency to profile:",
          error?.message ?? error
        );
      }
    },
    [applyCurrency]
  );

  const value: CurrencyContextType = {
    currencyCode,
    symbol: symbolForCurrency(currencyCode),
    setCurrency,
    formatAmount: (amount, options) =>
      formatCurrency(
        amount,
        currencyCode,
        localeForCurrency(currencyCode),
        options
      ),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    const code = getActiveCurrency();
    return {
      currencyCode: code,
      symbol: symbolForCurrency(code),
      setCurrency: () => {},
      formatAmount: (amount, options) =>
        formatCurrency(amount, code, localeForCurrency(code), options),
    };
  }
  return context;
};
