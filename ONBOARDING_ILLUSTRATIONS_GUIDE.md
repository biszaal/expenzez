# Onboarding Illustrations Guide

The onboarding screen has been redesigned with a minimalist, flat design and now uses illustrations from [Undraw.co](https://undraw.co/illustrations). You need to download the following illustrations and add them to the project.

## Required Illustrations

The onboarding flow expects 5 illustrations to be placed in `assets/images/onboarding/`:

### 1. Welcome Illustration - `welcome.png`
- **Purpose**: Welcome/intro screen
- **Suggested Undraw illustration**: "Welcome" or "Welcome aboard"
- **Used in**: Step 1 - "Welcome to Expenzez"
- **Path**: `assets/images/onboarding/welcome.png`

### 2. Analytics Illustration - `analytics.png`
- **Purpose**: Financial analytics and data insights
- **Suggested Undraw illustration**: "Analytics" or "Chart" or "Data"
- **Used in**: Step 2 - "Smart Analytics"
- **Path**: `assets/images/onboarding/analytics.png`

### 3. Security Illustration - `security.png`
- **Purpose**: Bank-level security and data protection
- **Suggested Undraw illustration**: "Security" or "Shield" or "Authentication"
- **Used in**: Step 3 - "Bank-Level Security"
- **Path**: `assets/images/onboarding/security.png`

### 4. Notifications Illustration - `notifications.png`
- **Purpose**: Smart notifications and alerts
- **Suggested Undraw illustration**: "Notification" or "Bell" or "Alerts"
- **Used in**: Step 4 - "Smart Notifications"
- **Path**: `assets/images/onboarding/notifications.png`

### 5. Journey Illustration - `journey.png`
- **Purpose**: Financial journey and getting started
- **Suggested Undraw illustration**: "Journey" or "Rocket" or "Starting"
- **Used in**: Step 5 - "Ready to Begin?"
- **Path**: `assets/images/onboarding/journey.png`

## How to Download from Undraw

1. Visit [https://undraw.co/illustrations](https://undraw.co/illustrations)
2. Search for each illustration name (e.g., "analytics", "security", etc.)
3. Click on the illustration to open the detail page
4. Click the "Download" button
5. Recommended settings:
   - **Format**: PNG
   - **Color**: Select a color matching your brand (primary color: blue/purple)
   - **Size**: Medium (256x256 or 512x512)

## Installation Steps

1. Create the directory if it doesn't exist:
   ```bash
   mkdir -p assets/images/onboarding
   ```

2. Download each illustration from Undraw.co

3. Move/copy the PNG files to `assets/images/onboarding/` with the exact filenames:
   - `welcome.png`
   - `analytics.png`
   - `security.png`
   - `notifications.png`
   - `journey.png`

4. No code changes needed - the onboarding screen will automatically use these illustrations!

## Design Features

The redesigned onboarding screen now features:
- ✅ **Minimalist flat design** - Clean, simple layout without gradients or shadows
- ✅ **Theme-aware colors** - Uses your app's theme system for consistency
- ✅ **Responsive illustrations** - Images scale properly on all screen sizes
- ✅ **Smooth animations** - Fade and slide transitions when switching steps
- ✅ **Consistent typography** - Uses the same text styles as the rest of the app
- ✅ **Progress indicators** - Visual feedback showing current step

## File References

- **Main component**: `app/onboarding/OnboardingScreen.tsx`
- **Illustrations folder**: `assets/images/onboarding/`
- **Supported formats**: PNG recommended (JPG also works)

## Troubleshooting

If illustrations don't appear:
1. Verify file names match exactly (case-sensitive on some systems)
2. Check that PNG files are in `assets/images/onboarding/` directory
3. Clear app cache: `npm start -- --clear`
4. Rebuild the app if using production build

## Design Considerations

When selecting illustrations from Undraw:
- Choose illustrations with similar art style for consistency
- Select the same color scheme for all illustrations
- Avoid very detailed/busy illustrations (keep it simple for minimalist design)
- Test on mobile devices to ensure illustrations scale well
