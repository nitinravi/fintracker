# Assets Directory

Place your app assets here. Required files:

## Required Assets

### 1. `icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Purpose**: App icon for iOS and Android
- **Design**: Square icon with rounded corners (handled by Expo)

### 2. `splash.png`
- **Size**: 1284x2778 pixels (or use Expo's splash screen generator)
- **Format**: PNG
- **Purpose**: Splash screen shown when app launches
- **Design**: Full-screen image with your app branding

### 3. `adaptive-icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Purpose**: Android adaptive icon
- **Design**: Square icon (Android will apply mask)

### 4. `favicon.png`
- **Size**: 48x48 pixels (or 16x16, 32x32)
- **Format**: PNG
- **Purpose**: Web favicon
- **Design**: Simple icon representing your app

### 5. `notification-icon.png`
- **Size**: 96x96 pixels
- **Format**: PNG
- **Purpose**: Notification icon
- **Design**: Monochrome icon (Android requirement)

## Quick Setup

### Option 1: Use Expo's Asset Generator

```bash
npx expo install @expo/image-utils
```

Then create a simple script or use online tools to generate these assets.

### Option 2: Use Online Tools

1. **App Icon Generator**: [AppIcon.co](https://www.appicon.co/)
2. **Splash Screen Generator**: [Figma](https://www.figma.com/) or [Canva](https://www.canva.com/)
3. **Favicon Generator**: [Favicon.io](https://favicon.io/)

### Option 3: Create Simple Placeholders

For development, you can create simple colored squares:
- Use any image editor (Paint, GIMP, Photoshop)
- Create square images with your brand colors
- Add text like "FT" for Finance Tracker

## Recommended Design

- **Colors**: Use your brand colors (e.g., blue #2563eb for Finance Tracker)
- **Style**: Modern, clean, professional
- **Text**: Minimal or no text (icons should be recognizable)
- **Background**: Solid color or subtle gradient

## Example Asset Creation

1. Create a 1024x1024 canvas
2. Add background color (#2563eb)
3. Add a simple icon (wallet, money, chart)
4. Export as PNG
5. Use for `icon.png` and `adaptive-icon.png`

For splash screen, extend to 1284x2778 and add your app name/logo.
