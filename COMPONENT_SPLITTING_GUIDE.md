# Component Splitting Guide

**Date**: 2025-11-04
**Status**: Implementation Plan
**Priority**: HIGH

This guide provides step-by-step instructions for splitting large monolithic components into smaller, maintainable modules.

---

## Files Requiring Splitting

| File | Current Lines | Target Lines | Priority | Complexity |
|------|--------------|--------------|----------|------------|
| `app/(tabs)/account.tsx` | 1,682 | ~200 | 🔴 HIGH | Medium |
| `app/(tabs)/spending.tsx` | 1,613 | ~250 | 🔴 HIGH | High |
| `app/transactions/index.tsx` | 1,400 | ~200 | 🔴 HIGH | Medium |
| `app/auth/AuthContext.tsx` | 1,346 | ~400 | 🟡 MEDIUM | High |
| `app/ai-assistant/index.tsx` | 1,326 | ~300 | 🟡 MEDIUM | Medium |

---

## Part 1: Splitting account.tsx (1,682 → ~200 lines)

### Current Structure Analysis

The file contains 7 major sections:
1. **Header** (lines 340-373) - Page title & settings button
2. **Profile Section** (lines 374-435) - User avatar, name, email, member since
3. **Savings Goals Stats** (lines 436-474) - Quick stats display
4. **Menu Options** (lines 475-725) - **251 lines!** Various menu items
5. **Logout Error Display** (lines 725-733) - Error messages
6. **Logout Button** (lines 734-771) - Logout functionality
7. **App Info** (lines 772-end) - Version & build info

### Splitting Strategy

#### Step 1: Create Component Directory Structure
```bash
mkdir -p components/account/{header,profile,menu,sections}
```

#### Step 2: Extract Components

##### A. `components/account/header/AccountHeader.tsx`
**Purpose**: Page header with title and settings button
**Size**: ~50 lines

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export const AccountHeader: React.FC = () => {
  const router = useRouter();
  const { colors, shadows } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Profile
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            Manage your account
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: colors.background.primary, ...shadows.sm },
          ]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={colors.primary.main}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Copy relevant styles from account.tsx
});
```

##### B. `components/account/profile/ProfileCard.tsx`
**Purpose**: User profile display with avatar, name, email
**Size**: ~100 lines

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/app/auth/AuthContext';

interface ProfileCardProps {
  onEditPress?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ onEditPress }) => {
  const { colors, shadows } = useTheme();
  const { user } = useAuth();

  const getUserInitials = () => {
    // Copy from account.tsx
  };

  const getUserDisplayName = () => {
    // Copy from account.tsx
  };

  const getUserEmail = () => {
    // Copy from account.tsx
  };

  const getMemberSince = () => {
    // Copy from account.tsx
  };

  return (
    <View style={[
      styles.profileCard,
      { backgroundColor: colors.background.primary, ...shadows.lg },
    ]}>
      <View style={styles.profileContent}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary.main }]}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
        </View>
        <View style={styles.profileDetails}>
          <Text style={[styles.profileName, { color: colors.text.primary }]}>
            {getUserDisplayName()}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
            {getUserEmail()}
          </Text>
          <Text style={[styles.memberText, { color: colors.text.secondary }]}>
            Member since {getMemberSince()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Copy relevant styles
});
```

##### C. `components/account/menu/MenuSection.tsx`
**Purpose**: Reusable section wrapper for menu items
**Size**: ~80 lines

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ title, children }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
        {title}
      </Text>
      <View style={[
        styles.sectionContent,
        { backgroundColor: colors.background.primary },
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles
});
```

##### D. `components/account/menu/MenuItem.tsx`
**Purpose**: Individual menu item component
**Size**: ~100 lines

```typescript
import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  iconColor?: string;
  rightElement?: React.ReactNode;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onPress,
  isLast,
  iconColor,
  rightElement,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: iconColor || colors.primary.light }]}>
          <Ionicons
            name={icon}
            size={20}
            color={iconColor || colors.primary.main}
          />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemTitle, { color: colors.text.primary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.menuItemSubtitle, { color: colors.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {value && (
          <Text style={[styles.menuItemValue, { color: colors.text.secondary }]}>
            {value}
          </Text>
        )}
        {rightElement || (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.tertiary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Styles
});
```

##### E. `components/account/sections/AccountMenuSection.tsx`
**Purpose**: Account-related menu items (profile, security, etc.)
**Size**: ~60 lines

```typescript
import React from 'react';
import { MenuSection } from '../menu/MenuSection';
import { MenuItem } from '../menu/MenuItem';
import { useRouter } from 'expo-router';

export const AccountMenuSection: React.FC = () => {
  const router = useRouter();

  return (
    <MenuSection title="ACCOUNT">
      <MenuItem
        icon="person-outline"
        title="Personal Information"
        subtitle="Update your details"
        onPress={() => router.push('/profile/personal')}
      />
      <MenuItem
        icon="shield-checkmark-outline"
        title="Security"
        subtitle="PIN, biometrics, app lock"
        onPress={() => router.push('/security')}
        isLast
      />
    </MenuSection>
  );
};
```

##### F. `components/account/sections/PreferencesMenuSection.tsx`
**Purpose**: App preferences menu items
**Size**: ~80 lines

```typescript
import React from 'react';
import { Switch } from 'react-native';
import { MenuSection } from '../menu/MenuSection';
import { MenuItem } from '../menu/MenuItem';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export const PreferencesMenuSection: React.FC = () => {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <MenuSection title="PREFERENCES">
      <MenuItem
        icon="moon-outline"
        title="Dark Mode"
        onPress={toggleTheme}
        rightElement={
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary.main }}
          />
        }
      />
      <MenuItem
        icon="notifications-outline"
        title="Notifications"
        subtitle="Manage your alerts"
        onPress={() => router.push('/notifications')}
      />
      <MenuItem
        icon="language-outline"
        title="Language"
        value="English"
        onPress={() => {}}
        isLast
      />
    </MenuSection>
  );
};
```

##### G. `components/account/sections/DataMenuSection.tsx`
**Purpose**: Data management menu items (export, backup, etc.)
**Size**: ~60 lines

```typescript
import React from 'react';
import { MenuSection } from '../menu/MenuSection';
import { MenuItem } from '../menu/MenuItem';

interface DataMenuSectionProps {
  onExportPress: () => void;
}

export const DataMenuSection: React.FC<DataMenuSectionProps> = ({ onExportPress }) => {
  return (
    <MenuSection title="DATA & STORAGE">
      <MenuItem
        icon="download-outline"
        title="Export Data"
        subtitle="Download your financial data"
        onPress={onExportPress}
      />
      <MenuItem
        icon="cloud-upload-outline"
        title="Backup & Sync"
        subtitle="Auto-backup enabled"
        onPress={() => {}}
        isLast
      />
    </MenuSection>
  );
};
```

##### H. `components/account/sections/SupportMenuSection.tsx`
**Purpose**: Help & support menu items
**Size**: ~80 lines

```typescript
import React from 'react';
import { MenuSection } from '../menu/MenuSection';
import { MenuItem } from '../menu/MenuItem';

interface SupportMenuSectionProps {
  onHelpPress: () => void;
}

export const SupportMenuSection: React.FC<SupportMenuSectionProps> = ({ onHelpPress }) => {
  return (
    <MenuSection title="SUPPORT">
      <MenuItem
        icon="help-circle-outline"
        title="Help & Support"
        subtitle="Get help with Expenzez"
        onPress={onHelpPress}
      />
      <MenuItem
        icon="document-text-outline"
        title="Terms & Privacy"
        onPress={() => {}}
      />
      <MenuItem
        icon="star-outline"
        title="Rate App"
        subtitle="Enjoying Expenzez? Rate us!"
        onPress={() => {}}
        isLast
      />
    </MenuSection>
  );
};
```

##### I. `components/account/LogoutButton.tsx`
**Purpose**: Logout button with loading state
**Size**: ~60 lines

```typescript
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoutButtonProps {
  onPress: () => void;
  loading?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onPress, loading }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.logoutButton,
        { backgroundColor: colors.background.primary, borderColor: colors.error.main },
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.error.main} />
      ) : (
        <>
          <Ionicons name="log-out-outline" size={20} color={colors.error.main} />
          <Text style={[styles.logoutText, { color: colors.error.main }]}>
            Logout
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Styles
});
```

##### J. `components/account/AppInfo.tsx`
**Purpose**: App version and build info
**Size**: ~40 lines

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '@/contexts/ThemeContext';

export const AppInfo: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.appInfo}>
      <Text style={[styles.appInfoText, { color: colors.text.tertiary }]}>
        Expenzez v{Constants.expoConfig?.version || '1.0.0'}
      </Text>
      <Text style={[styles.appInfoText, { color: colors.text.tertiary }]}>
        Build {Constants.expoConfig?.ios?.buildNumber || '1'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles
});
```

#### Step 3: Refactor Main Component

**New `app/(tabs)/account.tsx`** (~200 lines):

```typescript
import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfileSkeleton } from '@/components/ui/SkeletonLoader';

// Import new components
import { AccountHeader } from '@/components/account/header/AccountHeader';
import { ProfileCard } from '@/components/account/profile/ProfileCard';
import { AccountMenuSection } from '@/components/account/sections/AccountMenuSection';
import { PreferencesMenuSection } from '@/components/account/sections/PreferencesMenuSection';
import { DataMenuSection } from '@/components/account/sections/DataMenuSection';
import { SupportMenuSection } from '@/components/account/sections/SupportMenuSection';
import { LogoutButton } from '@/components/account/LogoutButton';
import { AppInfo } from '@/components/account/AppInfo';
import ExportSystem from '@/components/ExportSystem';
import SupportSystem from '@/components/SupportSystem';

export default function AccountScreen() {
  const { isLoggedIn, logout, loading: authLoading } = useAuth();
  const { colors } = useTheme();

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLogoutLoading(true);
              setLogoutError(null);
              await logout();
            } catch (error: any) {
              setLogoutError(error.message || 'Failed to logout');
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ]
    );
  };

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AccountHeader />
        <ProfileCard />

        <View style={styles.menuContainer}>
          <AccountMenuSection />
          <PreferencesMenuSection />
          <DataMenuSection onExportPress={() => setShowExport(true)} />
          <SupportMenuSection onHelpPress={() => setShowSupport(true)} />
        </View>

        {logoutError && (
          <Text style={[styles.errorText, { color: colors.error.main }]}>
            {logoutError}
          </Text>
        )}

        <LogoutButton onPress={handleLogout} loading={logoutLoading} />
        <AppInfo />
      </ScrollView>

      {/* Modals */}
      <ExportSystem visible={showExport} onClose={() => setShowExport(false)} />
      <SupportSystem visible={showSupport} onClose={() => setShowSupport(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  menuContainer: {
    marginTop: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
```

---

## Part 2: Splitting spending.tsx (1,613 → ~250 lines)

### Current Structure Analysis

The spending screen has 3 main tabs:
1. **Overview Tab** - Spending breakdown by category/merchant
2. **Budget Tab** - Budget tracking and alerts
3. **Trends Tab** - Historical spending analysis

### Splitting Strategy

#### Step 1: Create Directory Structure
```bash
mkdir -p components/spending/{overview,budget,trends,shared}
```

#### Step 2: Extract Tab Components

##### A. `components/spending/overview/SpendingOverview.tsx`
Extract the overview tab content (~300 lines)

##### B. `components/spending/budget/BudgetTab.tsx`
Extract budget tracking UI (~300 lines)

##### C. `components/spending/trends/TrendsTab.tsx`
Extract trends/charts (~300 lines)

#### Step 3: Refactor Main Component
```typescript
// app/(tabs)/spending.tsx (~250 lines)
import { SpendingOverview } from '@/components/spending/overview/SpendingOverview';
import { BudgetTab } from '@/components/spending/budget/BudgetTab';
import { TrendsTab } from '@/components/spending/trends/TrendsTab';

export default function SpendingScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'trends'>('overview');

  return (
    <SafeAreaView>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && <SpendingOverview />}
      {activeTab === 'budget' && <BudgetTab />}
      {activeTab === 'trends' && <TrendsTab />}
    </SafeAreaView>
  );
}
```

---

## Part 3: Splitting transactions/index.tsx (1,400 → ~200 lines)

### Splitting Strategy

#### Components to Extract:
1. `components/transactions/TransactionList.tsx` (~250 lines)
2. `components/transactions/TransactionFilters.tsx` (~200 lines)
3. `components/transactions/TransactionItem.tsx` (~150 lines)
4. `hooks/useTransactions.ts` (~200 lines) - Data fetching logic

---

## Part 4: Splitting AuthContext.tsx (1,346 → ~400 lines)

### Splitting Strategy

#### Extract to Services:
1. `services/auth/authService.ts` - API calls (~200 lines)
2. `services/auth/tokenService.ts` - Token management (~150 lines)
3. `services/auth/deviceTrustService.ts` - Device trust (~100 lines)

#### Keep in Context:
- Provider wrapper (~100 lines)
- Hook definitions (~50 lines)
- State management (~100 lines)

---

## Best Practices

### 1. Component Size Guidelines
- **Ideal**: 100-200 lines
- **Maximum**: 300 lines
- **Split if**: Exceeds 400 lines

### 2. Separation of Concerns
```
✅ DO:
- One component = One responsibility
- Extract repeated JSX into components
- Move business logic to services
- Create custom hooks for complex state

❌ DON'T:
- Mix business logic with UI
- Repeat the same JSX patterns
- Have deeply nested components
- Store all state in one component
```

### 3. File Organization
```
components/
├── [feature]/
│   ├── index.ts              (Re-exports)
│   ├── [Feature]Main.tsx     (Main component)
│   ├── [Feature]Item.tsx     (List items)
│   ├── [Feature]Modal.tsx    (Modals)
│   └── sections/             (Sub-sections)
│       ├── [Feature]Header.tsx
│       ├── [Feature]Content.tsx
│       └── [Feature]Footer.tsx
```

### 4. Props Interface Pattern
```typescript
// Define props clearly
interface ComponentProps {
  required: string;
  optional?: number;
  callback: () => void;
  children?: React.ReactNode;
}

// Use FC type
export const Component: React.FC<ComponentProps> = ({
  required,
  optional = 10,
  callback,
  children,
}) => {
  // Implementation
};
```

### 5. Style Organization
```typescript
// Option 1: Inline with component
const styles = StyleSheet.create({
  container: { ... },
});

// Option 2: Separate file for large components
// Component.styles.ts
export const styles = StyleSheet.create({
  // Many styles
});
```

---

## Implementation Checklist

For each component being split:

- [ ] Identify sections/responsibilities
- [ ] Create component directory structure
- [ ] Extract shared types/interfaces
- [ ] Create child components
- [ ] Update imports in parent
- [ ] Test component in isolation
- [ ] Verify functionality unchanged
- [ ] Update tests if they exist
- [ ] Create tests for new components
- [ ] Document props interfaces
- [ ] Commit changes

---

## Example Pull Request Template

```markdown
## Component Refactoring: account.tsx

### Summary
Split account.tsx from 1,682 lines into 10 smaller, focused components

### Changes
- ✅ Created `components/account/` directory structure
- ✅ Extracted 10 components:
  - AccountHeader (50 lines)
  - ProfileCard (100 lines)
  - MenuSection (80 lines)
  - MenuItem (100 lines)
  - AccountMenuSection (60 lines)
  - PreferencesMenuSection (80 lines)
  - DataMenuSection (60 lines)
  - SupportMenuSection (80 lines)
  - LogoutButton (60 lines)
  - AppInfo (40 lines)
- ✅ Refactored main component to 200 lines
- ✅ No functionality changes
- ✅ All existing tests pass

### Testing
- [x] Manual testing on iOS
- [x] Manual testing on Android
- [x] All user flows work correctly
- [x] No visual regressions

### Metrics
- **Lines of Code**: 1,682 → 200 (main) + 710 (components) = 910 total
- **Reduction**: 45% fewer lines overall
- **Reusability**: MenuItem now used in 4 sections
- **Maintainability**: ⬆️ Significantly improved
```

---

## Timeline Estimate

| Component | Estimated Time | Complexity |
|-----------|---------------|------------|
| account.tsx | 4-6 hours | Medium |
| spending.tsx | 6-8 hours | High |
| transactions/index.tsx | 3-4 hours | Medium |
| AuthContext.tsx | 5-6 hours | High |
| ai-assistant/index.tsx | 3-4 hours | Medium |
| **Total** | **21-28 hours** | - |

---

## Next Steps

1. **Start with account.tsx** (easiest, most modular)
2. **Test thoroughly** before moving to next
3. **Create reusable components** (MenuItem, MenuSection)
4. **Document patterns** for team consistency
5. **Iterate on feedback**

---

**Document Version**: 1.0
**Author**: Claude Code
**Last Updated**: 2025-11-04
