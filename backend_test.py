#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class HolyNavigatorAPITester:
    def __init__(self, base_url="https://holy-navigator-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            self.failed_tests.append({"test": test_name, "details": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success and response.text:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', response.text[:100])}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_result(name, success, details if not success else "")
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_bible_endpoints(self):
        """Test Bible-related endpoints"""
        print("\n📖 Testing Bible Endpoints...")
        
        # Test books endpoint
        success, books_data = self.run_test("Get Bible Books", "GET", "bible/books", 200)
        if success and books_data.get('books'):
            print(f"   Found {len(books_data['books'])} books")
        
        # Test chapter endpoint with sample data
        self.run_test("Get Genesis Chapter 1", "GET", "bible/chapter/Genesis/1", 200)
        
        # Test John 3:16 specifically (mentioned in requirements)
        success, john_data = self.run_test("Get John Chapter 3", "GET", "bible/chapter/John/3", 200)
        if success:
            translation = john_data.get('translation', '')
            verses = john_data.get('verses', [])
            
            # Check if translation is World English Bible
            if 'World English Bible' in translation or 'WEB' in translation:
                self.log_result("John 3 Translation Check", True)
                print(f"   Translation: {translation}")
            else:
                self.log_result("John 3 Translation Check", False, f"Expected World English Bible, got: {translation}")
            
            # Check if verse 16 exists and has real content
            verse_16 = next((v for v in verses if v.get('verse') == 16), None)
            if verse_16 and len(verse_16.get('text', '')) > 50:  # Real verse should be substantial
                self.log_result("John 3:16 Real Content", True)
                print(f"   John 3:16: {verse_16['text'][:80]}...")
            else:
                self.log_result("John 3:16 Real Content", False, "Verse 16 missing or placeholder content")
        
        # Test single verse endpoint
        success, verse_data = self.run_test("Get John 3:16", "GET", "bible/verse/John/3/16", 200)
        if success:
            verse_text = verse_data.get('text', '')
            translation = verse_data.get('translation', '')
            
            # Check for real verse content (should contain "God so loved")
            if 'God so loved' in verse_text or 'loved the world' in verse_text:
                self.log_result("John 3:16 API Content", True)
                print(f"   Single verse API working: {verse_text[:50]}...")
            else:
                self.log_result("John 3:16 API Content", False, f"Unexpected verse content: {verse_text}")
            
            # Check translation
            if 'World English Bible' in translation:
                self.log_result("Single Verse Translation", True)
            else:
                self.log_result("Single Verse Translation", False, f"Expected WEB, got: {translation}")
        
        # Test Bible search functionality
        success, search_data = self.run_test("Bible Search - 'love'", "GET", "bible/search/verses?q=love", 200)
        if success:
            results = search_data.get('results', [])
            query = search_data.get('query', '')
            
            if len(results) > 0:
                self.log_result("Bible Search Functionality", True)
                print(f"   Search for '{query}' returned {len(results)} results")
                
                # Check result structure
                if results:
                    result = results[0]
                    required_fields = ['reference', 'text', 'book', 'chapter', 'verse']
                    missing_fields = [field for field in required_fields if field not in result]
                    if missing_fields:
                        self.log_result("Search Result Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_result("Search Result Structure", True)
                        print(f"   Sample result: {result.get('reference')} - {result.get('text', '')[:50]}...")
            else:
                self.log_result("Bible Search Functionality", False, "No search results returned")
        
        self.run_test("Get Psalms Chapter 23", "GET", "bible/chapter/Psalms/23", 200)
        
        # Test invalid chapter
        self.run_test("Invalid Chapter", "GET", "bible/chapter/InvalidBook/999", 200)  # Should return placeholder

    def test_dictionary_endpoints(self):
        """Test Bible dictionary endpoints"""
        print("\n📚 Testing Dictionary Endpoints...")
        
        success, dict_data = self.run_test("Get Dictionary", "GET", "bible/dictionary", 200)
        if success and dict_data.get('words'):
            words = dict_data['words']
            print(f"   Found {len(words)} dictionary entries")
            
            # Check if we have at least 30 terms as required
            if len(words) >= 30:
                self.log_result("Dictionary Size (30+ terms)", True)
                print(f"   ✓ Dictionary has {len(words)} terms (requirement: 30+)")
            else:
                self.log_result("Dictionary Size (30+ terms)", False, f"Only {len(words)} terms, need 30+")
            
            # Check for specific new terms mentioned in requirements
            word_names = [w.get('word', '').lower() for w in words]
            required_terms = ['rapture', 'tribulation', 'millennium']
            found_terms = [term for term in required_terms if term in word_names]
            
            if len(found_terms) == len(required_terms):
                self.log_result("New Prophecy Terms", True)
                print(f"   ✓ Found required terms: {', '.join(found_terms)}")
            else:
                missing_terms = [term for term in required_terms if term not in found_terms]
                self.log_result("New Prophecy Terms", False, f"Missing terms: {missing_terms}")
            
            # Check for Hebrew/Greek origins
            sample_word = words[0] if words else {}
            if 'hebrew' in sample_word and 'greek' in sample_word:
                self.log_result("Hebrew/Greek Origins", True)
                print(f"   ✓ Dictionary includes Hebrew/Greek origins")
            else:
                self.log_result("Hebrew/Greek Origins", False, "Missing Hebrew/Greek origin information")
        
        # Test specific word lookup
        self.run_test("Get Word 'grace'", "GET", "bible/dictionary/grace", 200)
        self.run_test("Get Word 'faith'", "GET", "bible/dictionary/faith", 200)
        
        # Test new prophecy terms
        self.run_test("Get Word 'rapture'", "GET", "bible/dictionary/rapture", 200)
        self.run_test("Get Word 'tribulation'", "GET", "bible/dictionary/tribulation", 200)
        self.run_test("Get Word 'millennium'", "GET", "bible/dictionary/millennium", 200)
        
        self.run_test("Invalid Word", "GET", "bible/dictionary/nonexistentword", 404)
        
        # Test search
        self.run_test("Search Dictionary", "GET", "bible/search?q=grace", 200)

    def test_devotional_endpoints(self):
        """Test devotional endpoints"""
        print("\n🙏 Testing Devotional Endpoints...")
        
        success, today_data = self.run_test("Get Today's Devotional", "GET", "devotional/today", 200)
        if success and today_data:
            print(f"   Today's devotional: '{today_data.get('title', 'N/A')}'")
            day_of_year = today_data.get('day_of_year', 0)
            print(f"   Day of year: {day_of_year}")
        
        success, all_data = self.run_test("Get All Devotionals", "GET", "devotional/all", 200)
        if success and all_data.get('devotionals'):
            devotionals = all_data['devotionals']
            total = all_data.get('total', 0)
            print(f"   Found {len(devotionals)} devotionals (total: {total})")
            
            # Check if we have 365 devotionals for full year
            if total >= 365:
                self.log_result("Full Year Devotionals (365)", True)
                print(f"   ✓ Full year coverage with {total} devotionals")
            else:
                self.log_result("Full Year Devotionals (365)", False, f"Only {total} devotionals, need 365")
        
        # Test specific day devotional
        self.run_test("Get Day 1 Devotional", "GET", "devotional/1", 200)
        self.run_test("Get Day 100 Devotional", "GET", "devotional/100", 200)
        self.run_test("Get Day 365 Devotional", "GET", "devotional/365", 200)
        
        # Test invalid day
        self.run_test("Invalid Day (400)", "GET", "devotional/400", 404)

    def test_auth_registration(self):
        """Test user registration"""
        print("\n👤 Testing User Registration...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        test_name = f"Test User {timestamp}"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": test_password,
                "name": test_name
            }
        )
        
        if success and response.get('token'):
            self.token = response['token']
            self.user_id = response.get('user_id')
            print(f"   Registered user: {test_email}")
            return test_email, test_password
        
        return None, None

    def test_auth_login(self, email, password):
        """Test user login"""
        print("\n🔐 Testing User Login...")
        
        if not email or not password:
            self.log_result("Login Test", False, "No credentials from registration")
            return
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": email,
                "password": password
            }
        )
        
        if success and response.get('token'):
            self.token = response['token']
            self.user_id = response.get('user_id')
            print(f"   Logged in successfully")

    def test_auth_me(self):
        """Test get current user"""
        print("\n👤 Testing Get Current User...")
        
        if not self.token:
            self.log_result("Get Current User", False, "No authentication token")
            return
        
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        if success:
            print(f"   User: {response.get('name', 'N/A')} ({response.get('email', 'N/A')})")
            print(f"   Premium: {response.get('is_premium', False)}")

    def test_profile_endpoints(self):
        """Test profile and reading progress endpoints"""
        print("\n👤 Testing Profile Endpoints...")
        
        if not self.token:
            self.log_result("Profile Test Setup", False, "No authentication token")
            return
        
        # Test get profile
        success, profile_data = self.run_test("Get Profile", "GET", "profile", 200)
        if success:
            stats = profile_data.get('stats', {})
            settings = profile_data.get('settings', {})
            
            print(f"   User: {profile_data.get('name')} ({profile_data.get('email')})")
            print(f"   Stats: {stats.get('bookmarks', 0)} bookmarks, {stats.get('journals', 0)} journals")
            
            # Check if stats structure is correct
            expected_stats = ['bookmarks', 'journals', 'forum_posts']
            missing_stats = [stat for stat in expected_stats if stat not in stats]
            if missing_stats:
                self.log_result("Profile Stats Structure", False, f"Missing stats: {missing_stats}")
            else:
                self.log_result("Profile Stats Structure", True)
            
            # Check settings structure
            expected_settings = ['notification_email', 'notification_forum', 'preferred_translation', 'theme_preference']
            missing_settings = [setting for setting in expected_settings if setting not in settings]
            if missing_settings:
                self.log_result("Profile Settings Structure", False, f"Missing settings: {missing_settings}")
            else:
                self.log_result("Profile Settings Structure", True)
                print(f"   Settings: Translation={settings.get('preferred_translation')}, Theme={settings.get('theme_preference')}")
        
        # Test update profile
        success, update_response = self.run_test(
            "Update Profile",
            "PUT",
            "profile",
            200,
            data={
                "name": "Updated Test User",
                "notification_email": False,
                "preferred_translation": "KJV",
                "theme_preference": "dark"
            }
        )
        if success:
            print("   ✓ Profile update successful")
        
        # Test reading progress
        success, progress_data = self.run_test("Get Reading Progress", "GET", "profile/reading-progress", 200)
        if success:
            books_started = progress_data.get('books_started', 0)
            total_books = progress_data.get('total_books', 0)
            chapters_bookmarked = progress_data.get('chapters_bookmarked', 0)
            total_chapters = progress_data.get('total_chapters', 0)
            progress_percentage = progress_data.get('progress_percentage', 0)
            
            print(f"   Reading Progress: {books_started}/{total_books} books, {chapters_bookmarked} chapters")
            print(f"   Progress: {progress_percentage}% complete")
            
            # Check structure
            expected_fields = ['books_started', 'total_books', 'chapters_bookmarked', 'total_chapters', 'progress_percentage']
            missing_fields = [field for field in expected_fields if field not in progress_data]
            if missing_fields:
                self.log_result("Reading Progress Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Reading Progress Structure", True)
            
            # Check if total books is 66 (standard Bible)
            if total_books == 66:
                self.log_result("Bible Books Count", True)
            else:
                self.log_result("Bible Books Count", False, f"Expected 66 books, got {total_books}")
            
            # Check if total chapters is reasonable (should be around 1189)
            if 1100 <= total_chapters <= 1200:
                self.log_result("Bible Chapters Count", True)
            else:
                self.log_result("Bible Chapters Count", False, f"Unexpected chapter count: {total_chapters}")

    def test_bookmarks_protected(self):
        """Test bookmark endpoints (requires auth)"""
        print("\n🔖 Testing Bookmark Endpoints...")
        
        if not self.token:
            self.log_result("Bookmark Test", False, "No authentication token")
            return
        
        # Test creating bookmark
        success, bookmark_data = self.run_test(
            "Create Bookmark",
            "POST",
            "bookmarks",
            200,
            data={
                "book": "Genesis",
                "chapter": 1,
                "verse": 1,
                "note": "In the beginning..."
            }
        )
        
        bookmark_id = None
        if success and bookmark_data.get('bookmark_id'):
            bookmark_id = bookmark_data['bookmark_id']
            print(f"   Created bookmark: {bookmark_id}")
        
        # Test getting bookmarks
        success, bookmarks_data = self.run_test("Get Bookmarks", "GET", "bookmarks", 200)
        if success and bookmarks_data.get('bookmarks'):
            print(f"   Found {len(bookmarks_data['bookmarks'])} bookmarks")
        
        # Test deleting bookmark
        if bookmark_id:
            self.run_test("Delete Bookmark", "DELETE", f"bookmarks/{bookmark_id}", 200)

    def test_premium_endpoints_without_subscription(self):
        """Test premium endpoints without subscription (should fail)"""
        print("\n👑 Testing Premium Endpoints (Without Subscription)...")
        
        if not self.token:
            self.log_result("Premium Test Setup", False, "No authentication token")
            return
        
        # These should all return 403 Forbidden
        self.run_test("Journal Access (No Premium)", "GET", "journal", 403)
        self.run_test("Forum Access (No Premium)", "GET", "forum/posts", 403)
        self.run_test("News Analysis (No Premium)", "POST", "analyze/news", 403, data={
            "news_headline": "Test headline",
            "news_content": "Test content"
        })
        
        # Test media library endpoints without premium
        self.run_test("Media Videos (No Premium)", "GET", "media/videos", 403)
        self.run_test("Media Audio (No Premium)", "GET", "media/audio", 403)
        self.run_test("Media All (No Premium)", "GET", "media/all", 403)

    def test_unauthenticated_access(self):
        """Test endpoints that require authentication without token"""
        print("\n🚫 Testing Unauthenticated Access...")
        
        # Use fresh session without cookies for these tests
        fresh_session = requests.Session()
        
        # Test bookmarks without auth
        try:
            url = f"{self.base_url}/bookmarks"
            response = fresh_session.get(url, headers={'Content-Type': 'application/json'})
            success = response.status_code == 401
            details = f"Expected 401, got {response.status_code}"
            if not success and response.text:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', response.text[:100])}"
                except:
                    details += f" - {response.text[:100]}"
            self.log_result("Bookmarks (No Auth)", success, details if not success else "")
        except Exception as e:
            self.log_result("Bookmarks (No Auth)", False, f"Exception: {str(e)}")
        
        # Test auth/me without auth
        try:
            url = f"{self.base_url}/auth/me"
            response = fresh_session.get(url, headers={'Content-Type': 'application/json'})
            success = response.status_code == 401
            details = f"Expected 401, got {response.status_code}"
            if not success and response.text:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', response.text[:100])}"
                except:
                    details += f" - {response.text[:100]}"
            self.log_result("Get Me (No Auth)", success, details if not success else "")
        except Exception as e:
            self.log_result("Get Me (No Auth)", False, f"Exception: {str(e)}")

    def test_premium_media_library(self):
        """Test media library endpoints with premium user"""
        print("\n🎥 Testing Media Library (Premium User)...")
        
        # Login as premium user
        premium_email = "premium@test.com"
        premium_password = "test123"
        
        success, response = self.run_test(
            "Premium User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": premium_email,
                "password": premium_password
            }
        )
        
        if not success or not response.get('token'):
            self.log_result("Premium Media Test Setup", False, "Failed to login as premium user")
            return
        
        # Store original token and set premium token
        original_token = self.token
        self.token = response['token']
        
        # Test if user is premium
        success, user_data = self.run_test("Verify Premium Status", "GET", "auth/me", 200)
        if success and user_data.get('is_premium'):
            print(f"   Premium user verified: {user_data.get('email')}")
        else:
            self.log_result("Premium Status Check", False, "User is not premium")
            self.token = original_token
            return
        
        # Test media endpoints
        success, videos_data = self.run_test("Get Video Sermons", "GET", "media/videos", 200)
        if success and videos_data.get('videos'):
            videos = videos_data['videos']
            print(f"   Found {len(videos)} video sermons")
            
            # Verify video structure
            if videos:
                video = videos[0]
                required_fields = ['id', 'title', 'preacher', 'description', 'duration', 'video_url']
                missing_fields = [field for field in required_fields if field not in video]
                if missing_fields:
                    self.log_result("Video Structure Check", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("Video Structure Check", True)
                    print(f"   Sample video: '{video.get('title')}' by {video.get('preacher')}")
        
        success, audio_data = self.run_test("Get Audio Sermons", "GET", "media/audio", 200)
        if success and audio_data.get('audio'):
            audio = audio_data['audio']
            print(f"   Found {len(audio)} audio sermons")
            
            # Verify audio structure
            if audio:
                sermon = audio[0]
                required_fields = ['id', 'title', 'preacher', 'description', 'duration', 'audio_url']
                missing_fields = [field for field in required_fields if field not in sermon]
                if missing_fields:
                    self.log_result("Audio Structure Check", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("Audio Structure Check", True)
                    print(f"   Sample audio: '{sermon.get('title')}' by {sermon.get('preacher')}")
        
        success, all_data = self.run_test("Get All Media", "GET", "media/all", 200)
        if success:
            videos = all_data.get('videos', [])
            audio = all_data.get('audio', [])
            notice = all_data.get('notice', '')
            categories = all_data.get('categories', [])
            
            print(f"   All media: {len(videos)} videos, {len(audio)} audio")
            
            # Check for weekly update notice
            if 'weekly' in notice.lower() or 'week' in notice.lower():
                self.log_result("Weekly Update Notice", True)
                print(f"   Notice: {notice}")
            else:
                self.log_result("Weekly Update Notice", False, f"Notice doesn't mention weekly updates: {notice}")
            
            # Check categories
            expected_categories = ['Revelation', 'Daniel', 'Prophecy', 'Eschatology', 'End Times']
            found_categories = [cat for cat in expected_categories if cat in categories]
            if len(found_categories) >= 3:
                self.log_result("End Times Categories", True)
                print(f"   Categories: {', '.join(categories)}")
            else:
                self.log_result("End Times Categories", False, f"Missing end times categories. Found: {categories}")
            
            # Verify counts match individual endpoints
            if len(videos) == 5 and len(audio) == 5:
                self.log_result("Media Count Verification", True)
                print("   ✓ 5 videos and 5 audio sermons as expected")
            else:
                self.log_result("Media Count Verification", False, f"Expected 5 videos and 5 audio, got {len(videos)} videos and {len(audio)} audio")
        
        # Restore original token
        self.token = original_token

    def test_subscription_endpoints(self):
        """Test subscription-related endpoints"""
        print("\n💳 Testing Subscription Endpoints...")
        
        if not self.token:
            self.log_result("Subscription Test Setup", False, "No authentication token")
            return
        
        # Test creating checkout session
        success, checkout_data = self.run_test(
            "Create Checkout Session",
            "POST",
            "subscription/create-checkout",
            200,
            data={
                "origin_url": "https://holy-navigator-1.preview.emergentagent.com"
            }
        )
        
        if success and checkout_data.get('session_id'):
            session_id = checkout_data['session_id']
            print(f"   Created checkout session: {session_id}")
            
            # Test getting subscription status
            self.run_test("Get Subscription Status", "GET", f"subscription/status/{session_id}", 200)

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Holy Navigator API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic health tests
        self.test_health_endpoints()
        
        # Public endpoints
        self.test_bible_endpoints()
        self.test_dictionary_endpoints()
        self.test_devotional_endpoints()
        
        # Authentication flow
        email, password = self.test_auth_registration()
        self.test_auth_login(email, password)
        self.test_auth_me()
        
        # Protected endpoints
        self.test_bookmarks_protected()
        self.test_profile_endpoints()
        self.test_premium_endpoints_without_subscription()
        self.test_premium_media_library()
        self.test_unauthenticated_access()
        self.test_subscription_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {len(self.failed_tests)}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   - {failure['test']}: {failure['details']}")
        
        return len(self.failed_tests) == 0

def main():
    tester = HolyNavigatorAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())