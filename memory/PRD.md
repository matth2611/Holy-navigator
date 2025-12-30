# Holy Navigator - Product Requirements Document

## Original Problem Statement
Build an app that takes current news events and relates them to biblical scripture and analyzes how they connect. Features include: complete Bible reading with bookmarking, Bible dictionary access, community forum for scripture discussions with comments and upvotes, daily devotional section, journaling section. Premium features ($9.99/month): News-Scripture Analysis, Journaling, Ad-free experience, Community Forum, End Times Sermon Library.

## User Choices
- **AI Provider**: Emergent LLM Key (OpenAI GPT-5.2)
- **Payment**: Stripe (test key configured)
- **Authentication**: Both JWT email/password and Google OAuth
- **Theme**: Dark/Light mode with Blue (#0A2463) and Gold (#C5A059) colors
- **Premium Features**: News-Scripture Analysis, Journaling, Ad-free, Community Forum, Media Library

## User Personas
1. **Daily Devotional Reader** - Wants quick daily scripture and reflection
2. **Bible Student** - Studies scripture in-depth with dictionary and bookmarks
3. **Prophecy Enthusiast** - Interested in end times teachings and news-scripture connections
4. **Community Member** - Engages in forum discussions and shares insights
5. **Journal Writer** - Documents spiritual journey with scripture references

## Core Requirements (Static)
- Complete Bible with all 66 books
- Chapter/verse navigation
- Bookmarking system
- Bible dictionary with Hebrew/Greek
- Daily devotionals
- User authentication (JWT + Google OAuth)
- Dark/Light theme toggle
- Responsive design

## What's Been Implemented

### December 30, 2025 - MVP Launch
- ✅ Full-stack application (React + FastAPI + MongoDB)
- ✅ Complete Bible reader with 66 books, chapter navigation
- ✅ Bookmark system for saving reading progress
- ✅ Bible dictionary with 8 key terms (Hebrew/Greek origins)
- ✅ 7 daily devotionals with scripture, reflection, prayer
- ✅ News-Scripture Analysis with AI (GPT-5.2) - PREMIUM
- ✅ Community Forum with posts, comments, upvotes - PREMIUM
- ✅ Personal Journal with mood tracking - PREMIUM
- ✅ Stripe subscription ($9.99/month) integration
- ✅ JWT + Google OAuth authentication
- ✅ Dark/Light theme with Blue/Gold colors

### December 30, 2025 - Media Library Feature
- ✅ Video sermon library (5 videos) - PREMIUM
- ✅ Audio sermon library (5 sermons) - PREMIUM
- ✅ End times & prophecy focused content
- ✅ Weekly update notice displayed
- ✅ YouTube embed video player
- ✅ Audio player for sermons
- ✅ Categories: Revelation, Daniel, Prophecy, Eschatology, End Times, Second Coming, Tribulation, Israel

### December 30, 2025 - Major Enhancements
- ✅ **Bible API Integration** - Real verse text from World English Bible (bible-api.com)
- ✅ **Bible Search Functionality** - Search across scripture with keyword highlighting
- ✅ **User Profile Page** - Stats, settings, reading progress tracking
- ✅ **365 Daily Devotionals** - Full year of devotional content
- ✅ **Expanded Dictionary** - 30 biblical terms with Hebrew/Greek origins
- ✅ **Prophecy Terms** - rapture, tribulation, millennium, antichrist, prophecy

## Premium Features ($9.99/month)
1. News-Scripture AI Analysis
2. Community Forum Access
3. Personal Journal
4. End Times Sermon Library (Video + Audio)
5. Ad-free Experience

## Free Features
1. Complete Bible (66 books) with real verse text
2. Daily Devotionals (365 days)
3. Bible Dictionary (30 terms)
4. Bible Search
5. Bookmarking
6. User Profile with reading progress

## Technology Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Emergent LLM Key (OpenAI GPT-5.2)
- **Payments**: Stripe
- **Auth**: JWT + Emergent Google OAuth
- **Bible API**: bible-api.com (World English Bible)

## Prioritized Backlog

### P0 - Critical (Completed)
- [x] Bible reader with navigation
- [x] User authentication
- [x] Stripe subscription
- [x] News-Scripture Analysis
- [x] Media Library
- [x] Bible API integration
- [x] Bible search
- [x] Profile page
- [x] 365 devotionals
- [x] Expanded dictionary

### P1 - High Priority
- [ ] Email notifications for daily devotionals
- [ ] Bible verse highlighting and notes
- [ ] More Bible translations (KJV, ASV)
- [ ] Sermon favorites/playlist feature

### P2 - Medium Priority
- [ ] Bible reading plans
- [ ] Scripture sharing to social media
- [ ] More video/audio sermons
- [ ] Offline Bible reading

### P3 - Nice to Have
- [ ] Bible comparison (multiple translations)
- [ ] Mobile app (React Native)
- [ ] Study groups feature
- [ ] Push notifications
- [ ] Sermon watch history

## Next Action Items
1. Add email notification system for daily devotionals
2. Implement Bible verse highlighting and personal notes
3. Add more Bible translations
4. Create sermon favorites/playlist feature
5. Build reading plans system

## API Endpoints

### Public
- GET /api/bible/books
- GET /api/bible/chapter/{book}/{chapter}
- GET /api/bible/verse/{book}/{chapter}/{verse}
- GET /api/bible/search/verses?q={query}
- GET /api/bible/dictionary
- GET /api/bible/dictionary/{word}
- GET /api/bible/search?q={query}
- GET /api/devotional/today
- GET /api/devotional/all
- GET /api/devotional/{day}

### Protected (Auth Required)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/bookmarks
- GET /api/bookmarks
- DELETE /api/bookmarks/{id}
- GET /api/profile
- PUT /api/profile
- GET /api/profile/reading-progress

### Premium (Subscription Required)
- POST /api/analyze/news
- GET /api/analyze/history
- POST /api/forum/posts
- GET /api/forum/posts
- POST /api/journal
- GET /api/journal
- GET /api/media/videos
- GET /api/media/audio
- GET /api/media/all
