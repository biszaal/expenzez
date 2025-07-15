# Expenzez Frontend Components Documentation

## Overview

This document outlines the reusable components, hooks, and utilities created to improve code maintainability and consistency across the Expenzez frontend application.

## Component Structure

### UI Components (`/components/ui/`)

#### Core Components

- **Header** - Consistent navigation header with back button and optional actions
- **Section** - Content organization wrapper with optional titles
- **ListItem** - Standardized list items with icons, titles, and actions
- **EmptyState** - Consistent empty state displays with icons and action buttons
- **Badge** - Status indicators and labels with multiple variants

#### Existing Components

- **Button** - Reusable button with multiple variants and states
- **Card** - Content container with elevation and border styling
- **TextField** - Form input field with validation and styling
- **Typography** - Text components with consistent styling

### Custom Hooks (`/hooks/`)

- **useAuthGuard** - Authentication guard for protected routes
- **useAlert** - Standardized alert handling across the app

### Utilities (`/utils/`)

- **formatters.ts** - Data formatting utilities (currency, dates, phone numbers, etc.)

### Constants (`/constants/`)

- **data.ts** - Shared data constants (notifications, FAQs, bank logos, etc.)

## Usage Examples

### Header Component

```tsx
import { Header } from "../../components/ui";

// Basic header with back button
<Header title="Profile" subtitle="Manage your account" />

// Header with custom action button
<Header
  title="Banks"
  subtitle="Manage connected accounts"
  showBackButton={false}
  rightButton={{
    icon: "add-circle-outline",
    onPress: () => router.push("/banks/connect"),
  }}
/>
```

### Section Component

```tsx
import { Section } from "../../components/ui";

// Section with title
<Section title="Account Information">
  {/* Content */}
</Section>

// Section without title
<Section marginTop={0}>
  {/* Content */}
</Section>
```

### ListItem Component

```tsx
import { ListItem } from "../../components/ui";

// Basic list item
<ListItem
  icon={{ name: "person-outline", backgroundColor: "#DBEAFE" }}
  title="Personal Information"
  subtitle="Update your profile details"
  onPress={() => router.push("/profile/personal")}
/>

// List item with custom right element
<ListItem
  icon={{ name: "shield-outline", backgroundColor: "#D1FAE5" }}
  title="Security Settings"
  subtitle="Manage your account security"
  rightElement={<Switch value={enabled} onValueChange={setEnabled} />}
/>

// Danger variant
<ListItem
  icon={{ name: "trash-outline", backgroundColor: "#FEE2E2" }}
  title="Delete Account"
  subtitle="Permanently delete your account"
  onPress={handleDeleteAccount}
  variant="danger"
/>
```

### EmptyState Component

```tsx
import { EmptyState } from "../../components/ui";

// Basic empty state
<EmptyState
  icon="card-outline"
  title="No banks connected yet"
  subtitle="Connect your first bank account to get started"
/>

// Empty state with action button
<EmptyState
  icon="card-outline"
  title="No banks connected yet"
  subtitle="Connect your first bank account to get started"
  actionButton={{
    title: "Add Bank Account",
    onPress: () => router.push("/banks/connect"),
  }}
/>
```

### Badge Component

```tsx
import { Badge } from "../../components/ui";

// Success badge
<Badge text="Connected" variant="success" size="small" />

// Warning badge
<Badge text="Pending" variant="warning" />

// Danger badge
<Badge text="Failed" variant="danger" size="large" />
```

### Custom Hooks

```tsx
import { useAuthGuard, useAlert } from "../../hooks";

// Auth guard hook
const { isLoggedIn, loading } = useAuthGuard();

// Alert hook
const { showConfirmation, showError, showSuccess } = useAlert();

// Usage
showConfirmation(
  "Delete Account",
  "This action cannot be undone.",
  () => handleDelete(),
  undefined,
  "Delete",
  "Cancel"
);
```

### Formatters

```tsx
import {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
} from "../../utils/formatters";

// Currency formatting
formatCurrency(1234.56); // "£1,234.56"

// Date formatting
formatDate(new Date()); // "Jan 15, 2024"

// Phone number formatting
formatPhoneNumber("+441234567890"); // "+44 1234 567890"
```

## Best Practices

### 1. Component Organization

- Use the new UI components for consistency
- Group related functionality in sections
- Use proper TypeScript interfaces for props

### 2. State Management

- Use custom hooks for reusable logic
- Keep component state minimal
- Use proper error handling with the alert hook

### 3. Styling

- Use theme constants for colors, spacing, and typography
- Prefer reusable components over custom styling
- Use consistent spacing and border radius

### 4. Navigation

- Use the Header component for consistent navigation
- Implement proper back button handling
- Use the auth guard for protected routes

### 5. Error Handling

- Use the useAlert hook for consistent error messages
- Implement proper loading states
- Handle edge cases gracefully

### 6. Performance

- Use React.memo for expensive components
- Implement proper loading states
- Avoid unnecessary re-renders

## Migration Guide

### From Old Components

1. **Replace custom headers** with the Header component
2. **Replace custom list items** with the ListItem component
3. **Replace custom empty states** with the EmptyState component
4. **Use the Section component** for content organization
5. **Replace Alert.alert calls** with the useAlert hook

### Example Migration

**Before:**

```tsx
<View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()}>
    <Ionicons name="chevron-back" size={24} />
  </TouchableOpacity>
  <Text style={styles.title}>Profile</Text>
</View>
```

**After:**

```tsx
<Header title="Profile" subtitle="Manage your account" />
```

## Contributing

When adding new components:

1. Follow the existing naming conventions
2. Add proper TypeScript interfaces
3. Include comprehensive JSDoc comments
4. Use the theme constants for styling
5. Add examples to this documentation
6. Test across different screen sizes

## Theme Integration

All components use the centralized theme system:

- **Colors**: `colors.primary[500]`, `colors.text.primary`, etc.
- **Spacing**: `spacing.lg`, `spacing.xl`, etc.
- **Typography**: `typography.fontSizes.base`, etc.
- **Border Radius**: `borderRadius.xl`, etc.
- **Shadows**: `shadows.md`, etc.

This ensures consistent styling across the entire application.
