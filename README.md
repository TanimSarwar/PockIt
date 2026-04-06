# PockIt

A production-ready cross-platform super app for Android, iOS, and Web built with React Native + Expo.

**40+ features** organized into 5 tabs: Daily, Tools, Finance, Wellness, and Utilities.

## Tech Stack

- **Framework:** React Native + Expo (SDK 54, managed workflow)
- **Web:** React Native Web
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand with AsyncStorage persistence
- **Animations:** React Native Animated API
- **Icons:** MaterialCommunityIcons (@expo/vector-icons)
- **Fonts:** Inter (Google Fonts via expo-google-fonts)
- **Ads:** react-native-google-mobile-ads (AdMob)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`

### Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env

# Start development server
npx expo start
```

### Running on devices

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web browser
npx expo start --web
```

## Project Structure

```
app/
  _layout.tsx              # Root layout (fonts, splash, onboarding check)
  onboarding.tsx           # 3-page swipeable intro
  settings.tsx             # Theme, accent color, notifications
  (tabs)/
    _layout.tsx            # Bottom tab navigator (5 tabs)
    index.tsx              # Daily tab (weather, quote, horoscope)
    tools.tsx              # Tools tab grid
    finance.tsx            # Finance tab with budget summary
    wellness.tsx           # Wellness tab with today's stats
    utilities.tsx          # Utilities tab organized by section
    tools/                 # 10 tool screens
    finance/               # 3 finance screens
    wellness/              # 7 wellness screens
    utilities/             # 15 utility screens
components/ui/             # Design system (Button, Card, Input, Modal, etc.)
constants/                 # Theme, features registry, ad config
lib/                       # API helpers, haptics, storage, notifications
store/                     # Zustand stores (theme, favorites, tasks, etc.)
```

## Features (40+)

### Daily
- Weather widget (Open-Meteo API)
- Daily quote (quotable.io)
- Horoscope

### Tools
- Unit converter, Number base converter, Currency converter
- Color picker (HEX/RGB/HSL), QR code generator, Barcode scanner
- Password generator, Tip calculator, Loan/EMI calculator, Tax estimator

### Finance
- Stock prices (Alpha Vantage), Budget tracker, Calculator (standard + scientific)

### Wellness
- Soothing sounds player, Breathing exercises, Meditation timer
- Sleep tracker, Water intake tracker, Step counter, BMI calculator

### Utilities
- Stopwatch, Countdown timer, Pomodoro timer, World clock
- To-do list, Habit tracker, Quick notes, Dictionary & thesaurus
- Translator, Country info, Timezone converter
- Random number & dice roller, Coin flip, Flashcards, Drawing pad

## AdMob Integration

The app uses test ad unit IDs during development. To use real ads:

1. Create an AdMob account at https://admob.google.com
2. Create ad units for banner, interstitial, and rewarded ads
3. Replace the test IDs in:
   - `app.config.ts` — App-level AdMob IDs
   - `constants/ads.ts` — Ad unit IDs
   - `.env` — Environment variables

**Test Ad Unit IDs (current):**
- Banner: `ca-app-pub-3940256099942544/6300978111`
- Interstitial: `ca-app-pub-3940256099942544/1033173712`
- Rewarded: `ca-app-pub-3940256099942544/5224354917`

## API Keys

| API | Key Required | Free Tier |
|-----|-------------|-----------|
| Open-Meteo (weather) | No | Unlimited |
| quotable.io (quotes) | No | Unlimited |
| open.er-api.com (exchange rates) | No | 1500/month |
| Alpha Vantage (stocks) | Yes (free) | 25 req/day |
| Free Dictionary API | No | Unlimited |
| MyMemory (translation) | No | 5000 words/day |

Set your Alpha Vantage API key in `.env`:
```
ALPHA_VANTAGE_API_KEY=your_key_here
```

## Building for Production

```bash
# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Build for Web
npx expo export --platform web
```

## Design System

- **Theme:** Light/Dark mode + System preference
- **Accent Colors:** Indigo, Emerald, Rose, Amber, Sky
- **Typography:** Inter font family (Regular, Medium, SemiBold, Bold)
- **Spacing:** 4px base scale
- **Border Radius:** 8/12/16/24px
- **Shadows:** Platform-adaptive elevation

## License

Private project.
