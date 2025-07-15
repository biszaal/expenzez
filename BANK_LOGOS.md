# Bank Logos System Documentation

## Overview

The Expenzez app includes a comprehensive bank logos system that provides consistent branding and visual identification for all supported UK banks. This system now uses actual bank logo images from the internet with proper fallback handling.

## Supported Banks

### Traditional Banks

- **Barclays** - Blue (#1E40AF)
- **HSBC** - Blue (#1D4ED8)
- **Lloyds Bank** - Green (#059669)
- **NatWest** - Yellow (#D97706)
- **Santander** - Red (#DC2626)
- **TSB** - Green (#059669)
- **Metro Bank** - Red (#DC2626)
- **Halifax** - Blue (#1E40AF)
- **Bank of Scotland** - Blue (#1D4ED8)
- **Virgin Money** - Purple (#7C3AED)

### Digital Banks

- **Revolut** - Purple (#7C3AED)
- **Monzo** - Orange (#F97316)
- **Starling Bank** - Yellow (#F59E0B)
- **Chase** - Blue (#1D4ED8)
- **Wise** - Green (#10B981)
- **First Direct** - Blue (#1E40AF)

### Building Societies

- **Nationwide** - Purple (#7C3AED)
- **Yorkshire Building Society** - Green (#059669)
- **Coventry Building Society** - Purple (#7C3AED)
- **Skipton Building Society** - Blue (#1E40AF)

### Retail Banks

- **Tesco Bank** - Green (#10B981)
- **M&S Bank** - Red (#DC2626)
- **Sainsbury's Bank** - Yellow (#F59E0B)
- **Post Office Money** - Blue (#1E40AF)

### Ethical Banks

- **Co-operative Bank** - Green (#059669)

## BankLogo Component

The `BankLogo` component now displays actual bank logo images with the following features:

### Props

```typescript
interface BankLogoProps {
  bankName: string; // Name of the bank (must match BANK_LOGOS keys)
  size?: "small" | "medium" | "large"; // Size variant
  showName?: boolean; // Whether to show the bank name
  variant?: "default" | "compact" | "detailed"; // Display variant
}
```

### Features

- **Real Logo Images**: Uses actual bank logo URLs from Wikimedia Commons
- **Error Handling**: Falls back to emoji (🏦) if image fails to load
- **Responsive Sizing**: Three size variants (small, medium, large)
- **Multiple Variants**: Default, compact, and detailed display modes
- **Brand Colors**: Each bank has its official brand color
- **Categorization**: Banks are categorized by type (traditional, digital, etc.)

### Usage Examples

```tsx
// Basic usage
<BankLogo bankName="Barclays" />

// With name and large size
<BankLogo
  bankName="Monzo"
  size="large"
  showName={true}
/>

// Detailed variant
<BankLogo
  bankName="Revolut"
  variant="detailed"
  showName={true}
/>
```

### In Bank Selection Grid

```tsx
<TouchableOpacity style={styles.bankCard}>
  <BankLogo
    bankName="Revolut"
    size="large"
    showName={true}
    variant="detailed"
  />
</TouchableOpacity>
```

### In Account Details

```tsx
// Account header
<View style={styles.accountHeader}>
  <BankLogo bankName="Monzo" size="large" showName={true} />
  <Text style={styles.accountNumber}>**** 5678</Text>
</View>
```

## Data Structure

The bank logos are defined in `constants/data.ts`:

```typescript
export const BANK_LOGOS = {
  Barclays: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Barclays_Bank_logo.svg/1200px-Barclays_Bank_logo.svg.png",
    color: "#1E40AF",
    type: "traditional",
    description: "Traditional banking",
  },
  // ... more banks
} as const;
```

Each bank entry contains:

- **logoUrl**: Direct link to the bank's logo image
- **color**: Brand color for styling
- **type**: Category for filtering
- **description**: Brief description of the bank type

## Adding New Banks

To add a new bank:

1. **Find a reliable logo URL** from Wikimedia Commons or official sources
2. **Add to BANK_LOGOS** in `constants/data.ts`:

```typescript
"New Bank": {
  logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/...",
  color: "#1E40AF",
  type: "traditional",
  description: "Traditional banking",
},
```

3. **Choose appropriate color** that matches the bank's branding
4. **Assign correct type** for proper categorization
5. **Add description** for user understanding

## Best Practices

### Image Selection

- Use high-quality SVG or PNG images
- Prefer Wikimedia Commons for reliable URLs
- Ensure images are publicly accessible
- Test image loading on different devices
- Provide fallback for failed image loads

### Color Usage

- Use official brand colors when possible
- Ensure good contrast with background
- Consider accessibility (colorblind users)
- Use consistent color scheme across app

### Performance

- BankLogo component is optimized for re-rendering
- Uses memoization for expensive operations
- Fallback handling for unknown banks
- Consistent sizing across different devices
- Image caching for better performance

## Integration with Nordigen

The bank logos system integrates with the Nordigen/GoCardless API:

- **Supported Banks**: Only includes banks that are commonly supported by Nordigen
- **Real Logos**: Uses actual bank logos for authentic appearance
- **Error Handling**: Graceful fallback if images fail to load
- **Categorization**: Banks are organized by type for better UX

## Error Handling

The component includes robust error handling:

1. **Image Load Failures**: Falls back to emoji (🏦)
2. **Unknown Banks**: Uses default bank styling
3. **Network Issues**: Graceful degradation
4. **Invalid URLs**: Safe fallback behavior

## Future Enhancements

- **Local Image Storage**: Cache images locally for offline use
- **Progressive Loading**: Show placeholder while images load
- **Multiple Logo Formats**: Support different image formats
- **Dynamic Logo Updates**: Fetch latest logos from API
- **Custom Logo Upload**: Allow users to add custom bank logos
