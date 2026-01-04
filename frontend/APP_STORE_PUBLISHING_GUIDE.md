# Prophecy News Study Bible - App Store Publishing Guide

## Overview
Your React web app has been converted to native mobile apps using Capacitor. This guide provides step-by-step instructions for publishing to Google Play Store and Apple App Store.

---

## Part 1: Pre-requisites

### For Android (Google Play Store)
- [ ] Google Play Developer Account ($25 one-time fee)
  - Sign up at: https://play.google.com/console/signup
- [ ] Java Development Kit (JDK) 11 or higher
- [ ] Android Studio (for building APK/AAB)
  - Download: https://developer.android.com/studio

### For iOS (Apple App Store)
- [ ] Apple Developer Account ($99/year)
  - Sign up at: https://developer.apple.com/programs/enroll/
- [ ] Mac computer with macOS
- [ ] Xcode (from Mac App Store)
- [ ] CocoaPods installed (`sudo gem install cocoapods`)

---

## Part 2: Prepare App Assets

### App Icon (Required for both stores)
You need app icons in various sizes. Create a 1024x1024 PNG icon and use these tools:
- Android: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- iOS: https://appicon.co/

**Recommended Icon Design:**
- Blue background (#0A2463)
- Gold cross or book symbol (#C5A059)
- Simple, recognizable at small sizes

### Screenshots (Required for both stores)
Take screenshots of your app for:
- **Android:** Phone (1080x1920) and Tablet (1200x1920)
- **iOS:** iPhone 6.5" (1284x2778), iPad 12.9" (2048x2732)

**Recommended Screenshots:**
1. Home/Landing page
2. Bible reader
3. Daily News with scripture analysis
4. Daily devotional
5. Media library (sermons)

### App Description
```
Prophecy News Study Bible - Connect Current Events to Biblical Prophecy

Discover how today's headlines connect to eternal biblical truths. Our AI-powered scripture analysis helps you understand current events through the lens of biblical prophecy.

FEATURES:
📖 Complete Bible - Full text with book and chapter navigation
🗞️ Daily News Analysis - Current events connected to scripture
📅 Bible in a Year - 365-day reading plan with progress tracking
💭 Daily Devotionals - 365 days of spiritual guidance
📚 Bible Dictionary - 30+ key biblical terms explained
🎬 Sermon Library - Video and audio teachings on prophecy
✍️ Personal Journal - Document your spiritual journey
👥 Community Forum - Discuss scripture with other believers

PREMIUM FEATURES ($9.99/month):
- AI-powered News-Scripture analysis
- Full sermon library access
- Community forum participation
- Personal journaling
- Ad-free experience

Download now and deepen your understanding of God's Word!
```

---

## Part 3: Building for Android

### Step 1: Download the Android folder
Download the `/app/frontend/android` folder to your computer.

### Step 2: Open in Android Studio
1. Open Android Studio
2. Click "Open" and select the `android` folder
3. Wait for Gradle sync to complete

### Step 3: Update Version
Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1  // Increment for each release
        versionName "1.0.0"
    }
}
```

### Step 4: Generate Signing Key
In terminal, run:
```bash
keytool -genkey -v -keystore prophecy-news-release.keystore -alias prophecy-news -keyalg RSA -keysize 2048 -validity 10000
```
⚠️ **IMPORTANT:** Save this keystore file and password securely. You'll need it for all future updates.

### Step 5: Configure Signing
Create `android/key.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=prophecy-news
storeFile=../prophecy-news-release.keystore
```

Update `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 6: Build Release AAB
In Android Studio:
1. Build → Generate Signed Bundle/APK
2. Select "Android App Bundle"
3. Choose your keystore
4. Select "release" build variant
5. Click "Create"

The AAB file will be in: `android/app/release/app-release.aab`

### Step 7: Upload to Google Play Console
1. Go to https://play.google.com/console
2. Create new app → Enter app details
3. Go to "Production" → "Create new release"
4. Upload your AAB file
5. Fill in release notes
6. Complete all sections:
   - Store listing (description, screenshots, icon)
   - Content rating questionnaire
   - Pricing & distribution
   - App content (privacy policy, ads declaration)
7. Submit for review

---

## Part 4: Building for iOS

### Step 1: Download the iOS folder
Download the `/app/frontend/ios` folder to your Mac.

### Step 2: Install Dependencies
In terminal:
```bash
cd ios/App
pod install
```

### Step 3: Open in Xcode
Open `ios/App/App.xcworkspace` (NOT .xcodeproj)

### Step 4: Configure Signing
1. Select "App" in the project navigator
2. Go to "Signing & Capabilities"
3. Select your Team (Apple Developer account)
4. Xcode will automatically create provisioning profiles

### Step 5: Update Version
1. Select "App" target
2. Go to "General" tab
3. Update:
   - Version: 1.0.0
   - Build: 1

### Step 6: Update App Icons
1. Open `Assets.xcassets`
2. Click on "AppIcon"
3. Drag your icons into the appropriate slots

### Step 7: Archive for App Store
1. Select "Any iOS Device (arm64)" as destination
2. Product → Archive
3. When complete, Organizer window opens
4. Click "Distribute App"
5. Select "App Store Connect"
6. Follow the prompts to upload

### Step 8: Complete App Store Connect
1. Go to https://appstoreconnect.apple.com
2. My Apps → Your App
3. Complete all required information:
   - App Information (name, category, privacy policy)
   - Pricing and Availability
   - App Privacy
   - Screenshots and Preview
   - Description and Keywords
4. Submit for Review

---

## Part 5: Privacy Policy (Required)

Create a privacy policy page. You can host it at:
`https://prophecy-news.preview.emergentagent.com/privacy`

Required content:
- What data you collect
- How you use the data
- Third-party services (Stripe, Google OAuth)
- Contact information

Sample privacy policy template: https://www.freeprivacypolicy.com/

---

## Part 6: Update Checklist

When releasing updates:

### Code Changes
```bash
cd /app/frontend
yarn build
npx cap sync
```

### Android
1. Increment `versionCode` in `build.gradle`
2. Build new AAB
3. Upload to Play Console

### iOS
1. Increment Build number in Xcode
2. Archive and upload
3. Submit in App Store Connect

---

## Part 7: Troubleshooting

### Android Issues
- **Gradle sync failed:** Update Gradle and Android Gradle Plugin versions
- **Build failed:** Check `android/app/build.gradle` for errors
- **App crashes:** Check `adb logcat` for errors

### iOS Issues
- **Pod install failed:** Run `pod repo update` then `pod install`
- **Signing errors:** Ensure correct Apple Developer Team is selected
- **Upload failed:** Check for icon/screenshot size requirements

---

## Quick Reference

### App Details
- **App Name:** Prophecy News Study Bible
- **Package ID:** com.prophecynews.studybible
- **Category:** Books & Reference / Lifestyle
- **Content Rating:** Everyone

### Colors
- Primary Blue: #0A2463
- Accent Gold: #C5A059

### Contact
- Support Email: support@prophecynewsstudybible.com

---

## Timeline Estimate

| Task | Time |
|------|------|
| Developer account setup | 1-2 days |
| Create app assets | 1-2 days |
| Build Android | 1-2 hours |
| Build iOS | 1-2 hours |
| Google Play review | 1-3 days |
| Apple review | 1-7 days |

**Total:** Approximately 1-2 weeks from start to live on both stores.

---

Good luck with your app launch! 🚀
