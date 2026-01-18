# Finance Tracker

A comprehensive Personal Finance Tracker mobile app built with Expo, Firebase, and Gemini AI for automatic transaction parsing from Gmail.

## 🎯 Features

- **Account Management**: Add and manage bank accounts and credit cards with balance tracking
- **Transaction Logging**: Manual entry and automatic import from Gmail bank alerts
- **Budget Tracking**: Set spending limits per account/category with progress indicators
- **Investment Tracking**: Monitor SIPs and stocks with auto price updates
- **Reports & Analytics**: View net worth, spending trends, and export data to CSV
- **Push Notifications**: Alerts for budget limits, low balances, and SIP maturity
- **Offline Support**: Works offline with automatic sync when online
- **Gmail Auto-Import**: Automatically parse and import transactions from bank emails using AI

## 🛠️ Tech Stack

- **Frontend**: Expo SDK 54, React Native 0.81.5, TypeScript, React Native StyleSheet
- **Backend**: Firebase (Auth, Firestore, Cloud Functions v2)
- **State Management**: Zustand
- **Charts**: Custom React Native components
- **AI**: Gemini 2.5 Flash Lite for email parsing
- **APIs**: Gmail API, Yahoo Finance API

## 📋 Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Firebase account
- Google Cloud Console account (for Gmail API)
- Expo account (for OAuth redirects)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd fintracker
npm install
```

### 2. Firebase Setup

#### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `fintracker`
4. **Disable Google Analytics** (optional, to stay in free tier)
5. Click **"Create project"** and wait for completion

#### 2.2 Add Web App

1. In Firebase Console, click the **Web icon** (`</>`)
2. Register app:
   - App nickname: `Finance Tracker Web`
   - **Do NOT** check "Also set up Firebase Hosting"
   - Click **"Register app"**
3. **Copy the Firebase configuration** values

#### 2.3 Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gmail OAuth (get from Google Cloud Console - see Gmail Setup section)
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret

# Gemini API (get from https://aistudio.google.com/app/apikey)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

#### 2.4 Enable Authentication

1. In Firebase Console, go to **"Authentication"**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on "Email/Password"
   - Toggle **"Enable"** to ON
   - Click **"Save"**

#### 2.5 Create Firestore Database

1. In Firebase Console, go to **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll add security rules next)
4. Choose a **location** (e.g., `asia-south1` for India)
5. Click **"Enable"**

#### 2.6 Deploy Firestore Security Rules

1. In Firebase Console, go to **"Firestore Database"** → **"Rules"** tab
2. Replace the default rules with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
3. Click **"Publish"**

**OR** deploy from command line:
```bash
firebase deploy --only firestore:rules
```

### 3. Setup Cloud Functions

#### 3.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 3.2 Login to Firebase

```bash
firebase login
```

#### 3.3 Initialize Firebase in Project

```bash
firebase init functions
```

When prompted:
- **Select existing project** → Choose your Firebase project
- **Language**: TypeScript
- **ESLint**: Yes
- **Install dependencies**: Yes

#### 3.4 Install Function Dependencies

```bash
cd functions
npm install
```

#### 3.5 Configure Firebase Secrets

Set up API keys for Cloud Functions using Firebase's modern secret management:

```bash
# Set Gmail OAuth Client ID
firebase functions:secrets:set GMAIL_CLIENT_ID
# Paste your Client ID when prompted

# Set Gmail OAuth Client Secret
firebase functions:secrets:set GMAIL_CLIENT_SECRET
# Paste your Client Secret when prompted

# Set Gemini API Key
firebase functions:secrets:set GEMINI_API_KEY
# Paste your Gemini API Key when prompted
```

**To get Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key

#### 3.6 Deploy Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 4. Gmail Integration Setup

#### 4.1 Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **"APIs & Services"** → **"Library"**
4. Enable these APIs:
   - **Gmail API**
   - **Generative Language API** (for Gemini)

#### 4.2 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - App name: `Finance Tracker`
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Add test users (your email) during development
4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Finance Tracker Web Client`
   - Authorized redirect URIs - add:
     ```
     http://localhost:8080
     ```
     ⚠️ **IMPORTANT**: Google does NOT accept `exp://` URIs. Use `http://localhost:8080` for development.
5. **Save the Client ID and Client Secret** - add to `.env` file

#### 4.3 Grant Secret Manager Permissions

1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam?project=fintracker-616ce)
2. Find the service account: `fintracker-616ce@appspot.gserviceaccount.com`
3. Click **"Edit"** (pencil icon)
4. Click **"Add Another Role"**
5. Add role: **"Secret Manager Secret Accessor"**
6. Click **"Save"**

### 5. Running the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📁 Project Structure

```
fintracker/
├── app/                    # Expo Router app structure
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Dashboard
│   │   ├── accounts.tsx
│   │   ├── transactions.tsx
│   │   ├── investments.tsx
│   │   ├── reports.tsx
│   │   └── settings.tsx
│   ├── index.tsx          # Root redirect
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── cards/            # Card components
│   ├── charts/           # Chart components
│   └── forms/            # Form components
├── lib/                   # Utilities & configs
│   ├── api/              # API functions
│   ├── hooks/            # Custom React hooks
│   │   └── useGmailAuth.ts
│   ├── store/            # Zustand stores
│   ├── theme.ts          # Theme colors
│   └── firebase.ts       # Firebase config
├── functions/            # Firebase Cloud Functions
│   ├── src/
│   │   ├── parseTransactions.ts
│   │   └── updateSIPs.ts
│   └── package.json
├── assets/               # App assets (icons, images)
├── .env                  # Environment variables (not in git)
├── .gitignore
├── app.json              # Expo configuration
├── firebase.json         # Firebase configuration
└── package.json
```

## 🔐 Security

### Environment Variables

- ✅ `.env` is in `.gitignore` - never commit secrets
- ✅ Use `EXPO_PUBLIC_` prefix for client-side variables
- ✅ Use Firebase Secrets for server-side (Cloud Functions)

### Firestore Rules

All data is protected by security rules:
- Users can only read/write their own data
- Authentication required for all operations

### OAuth Security

- ✅ OAuth 2.0 with client secret
- ✅ Tokens stored securely in Firestore
- ✅ Automatic token refresh
- ✅ Read-only Gmail access

## 🧪 Testing

### Test Authentication
1. Run the app: `npm start`
2. Try signing up with a test email
3. Check Firebase Console → Authentication → Users (should see your user)

### Test Firestore
1. Add an account in the app
2. Check Firebase Console → Firestore Database → Data
3. Should see: `users/{userId}/accounts/{accountId}`

### Test Cloud Functions
1. Check Firebase Console → Functions
2. Should see: `parseTransactions` and `updateSIPs`
3. Test Gmail sync from Dashboard

### Test Gmail Integration
1. Connect Gmail in the app (Dashboard → Connect Gmail)
2. Grant permissions
3. Tap "Sync Gmail"
4. Check transactions appear in Transactions tab

## 🐛 Troubleshooting

### "Permission denied" errors
- Check Firestore security rules are deployed
- Verify user is authenticated

### Cloud Functions not deploying
- Check `functions/package.json` has all dependencies
- Verify Firebase CLI is logged in: `firebase login`
- Check function logs: `firebase functions:log`

### Gmail API errors
- Verify Gmail API is enabled in Google Cloud Console
- Check OAuth credentials are correct
- Ensure redirect URI matches: `http://localhost:8080`

### Gemini API errors
- Verify Generative Language API is enabled
- Check API key is set: `firebase functions:secrets:access GEMINI_API_KEY`
- Ensure using correct model: `gemini-2.5-flash-lite`

### OAuth Redirect Issues
- Verify redirect URI in Google Console matches: `http://localhost:8080`
- Check `app.json` has `"scheme": "fintracker"`

### "No transactions imported"
- Check you have unread bank emails from last 24 hours
- View Cloud Function logs: `firebase functions:log`
- Ensure Firebase is on Blaze plan (required for external API calls)

## 📊 Free Tier Limits

- **Firestore**: 1GB storage, 50K reads/day
- **Functions**: 125K invocations/month
- **Authentication**: 10K users
- **Storage**: 5GB

These limits are sufficient for development and small-scale production.

## 🏗️ Building for Production

### EAS Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure your app:
```bash
eas build:configure
```

4. Build for iOS/Android:
```bash
eas build --platform all
```

## 📱 App Assets

Place these files in `assets/` directory:

- `icon.png` - App icon (1024x1024)
- `splash.png` - Splash screen (1284x2778)
- `adaptive-icon.png` - Android adaptive icon (1024x1024)
- `favicon.png` - Web favicon (48x48)
- `notification-icon.png` - Notification icon (96x96)

See `assets/README.md` for more details.

## 🔄 How Gmail Auto-Import Works

```
User taps "Connect Gmail"
    ↓
Opens Google OAuth in browser
    ↓
User grants Gmail permissions
    ↓
App receives access token
    ↓
Token saved to Firestore
    ↓
User taps "Sync Gmail"
    ↓
Creates trigger document in Firestore
    ↓
Cloud Function triggered
    ↓
Function reads unread bank emails (last 24 hours)
    ↓
Gemini AI parses transaction details
    ↓
Transactions saved to Firestore
    ↓
Appears in app with 📧 badge
```

## 🏦 Supported Banks

The AI automatically detects transactions from:
- ✅ HDFC Bank
- ✅ SBI (State Bank of India)
- ✅ ICICI Bank
- ✅ Axis Bank
- ✅ Kotak Mahindra Bank
- ✅ Most other Indian banks

## 📧 Email Patterns Detected

- Subject contains: "debited", "credited", "transaction"
- From: "alerts@", "noreply@", "creditcardalerts@"
- Automatically categorizes: food, transport, shopping, bills, entertainment, healthcare, education, other

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Gemini API Documentation](https://ai.google.dev/docs)

## 📄 License

ISC

## 🎉 You're Ready!

Your Finance Tracker app is now set up and ready to use! 

**Next Steps:**
1. ✅ Run `npm start` to launch the app
2. ✅ Sign up with your email
3. ✅ Add your bank accounts
4. ✅ Connect Gmail for auto-import
5. ✅ Start tracking your finances!

---

**Need Help?** Check the troubleshooting section above or review the Firebase/Gmail setup steps.
