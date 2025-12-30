#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class ProphecyNewsStudyBibleAPITester:
    def __init__(self, base_url="https://prophecy-news.preview.emergentagent.com/api"):
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
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
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
        
        # Test API root returns correct branding
        success, root_data = self.run_test("API Root", "GET", "", 200)
        if success and root_data.get('message'):
            message = root_data['message']
            if 'Prophecy News Study Bible API' in message:
                self.log_result("API Branding Check", True)
                print(f"   ✓ API returns correct branding: {message}")
            else:
                self.log_result("API Branding Check", False, f"Expected 'Prophecy News Study Bible API', got: {message}")
        
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
            verses = john_data.get('verses', [])
            
            # Check if verse 16 exists and contains "For God so loved the world"
            verse_16 = next((v for v in verses if v.get('verse') == 16), None)
            if verse_16:
                verse_text = verse_16.get('text', '')
                if 'For God so loved the world' in verse_text:
                    self.log_result("John 3:16 Correct Text", True)
                    print(f"   ✓ John 3:16: {verse_text[:80]}...")
                else:
                    self.log_result("John 3:16 Correct Text", False, f"Expected 'For God so loved the world', got: {verse_text}")
            else:
                self.log_result("John 3:16 Exists", False, "Verse 16 not found in John chapter 3")
        
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

    def test_reading_plan_endpoints(self):
        """Test Bible in a Year reading plan endpoints"""
        print("\n📅 Testing Reading Plan Endpoints...")
        
        # Test today's reading
        success, today_data = self.run_test("Get Today's Reading", "GET", "reading-plan/today", 200)
        if success and today_data:
            day = today_data.get('day', 0)
            theme = today_data.get('theme', '')
            readings = today_data.get('readings', [])
            date = today_data.get('date', '')
            day_of_year = today_data.get('day_of_year', 0)
            
            print(f"   Today's reading: Day {day} - {theme}")
            print(f"   Date: {date}, Day of year: {day_of_year}")
            
            # Check structure
            required_fields = ['day', 'theme', 'readings']
            missing_fields = [field for field in required_fields if field not in today_data]
            if missing_fields:
                self.log_result("Today's Reading Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Today's Reading Structure", True)
            
            # Check readings array
            if readings and len(readings) > 0:
                self.log_result("Today's Reading Has Content", True)
                # Format readings for display
                reading_strs = []
                for reading in readings:
                    if isinstance(reading, dict):
                        book = reading.get('book', '')
                        chapters = reading.get('chapters', '')
                        reading_strs.append(f"{book} {chapters}")
                    else:
                        reading_strs.append(str(reading))
                print(f"   Readings: {', '.join(reading_strs)}")
            else:
                self.log_result("Today's Reading Has Content", False, "No readings found")
        
        # Test reading plan with pagination
        success, plan_data = self.run_test("Get Reading Plan (Page 1)", "GET", "reading-plan?page=1&limit=30", 200)
        if success and plan_data:
            readings = plan_data.get('readings', [])
            total = plan_data.get('total', 0)
            page = plan_data.get('page', 0)
            pages = plan_data.get('pages', 0)
            description = plan_data.get('description', '')
            
            print(f"   Reading plan: {len(readings)} readings on page {page} of {pages}")
            print(f"   Total readings: {total}")
            
            # Check if we have 365 readings for full year
            if total == 365:
                self.log_result("Full Year Reading Plan (365 days)", True)
                print(f"   ✓ Complete year with {total} readings")
            else:
                self.log_result("Full Year Reading Plan (365 days)", False, f"Expected 365 readings, got {total}")
            
            # Check description mentions Bible in a Year
            if 'Bible in' in description and 'year' in description.lower():
                self.log_result("Reading Plan Description", True)
                print(f"   Description: {description}")
            else:
                self.log_result("Reading Plan Description", False, f"Description doesn't mention Bible in a year: {description}")
        
        # Test specific day reading
        success, day_data = self.run_test("Get Day 1 Reading", "GET", "reading-plan/day/1", 200)
        if success and day_data:
            day = day_data.get('day', 0)
            theme = day_data.get('theme', '')
            readings = day_data.get('readings', [])
            
            if day == 1:
                self.log_result("Specific Day Reading", True)
                # Format readings for display
                reading_strs = []
                for reading in readings:
                    if isinstance(reading, dict):
                        book = reading.get('book', '')
                        chapters = reading.get('chapters', '')
                        reading_strs.append(f"{book} {chapters}")
                    else:
                        reading_strs.append(str(reading))
                print(f"   Day 1: {theme} - {', '.join(reading_strs) if reading_strs else 'No readings'}")
            else:
                self.log_result("Specific Day Reading", False, f"Expected day 1, got day {day}")
        
        # Test another specific day
        success, day_data = self.run_test("Get Day 100 Reading", "GET", "reading-plan/day/100", 200)
        if success and day_data:
            readings = day_data.get('readings', [])
            reading_strs = []
            for reading in readings:
                if isinstance(reading, dict):
                    book = reading.get('book', '')
                    chapters = reading.get('chapters', '')
                    reading_strs.append(f"{book} {chapters}")
                else:
                    reading_strs.append(str(reading))
            print(f"   Day 100: {day_data.get('theme', 'No theme')} - {', '.join(reading_strs)}")
        
        # Test invalid day
        self.run_test("Invalid Day Reading (400)", "GET", "reading-plan/day/400", 404)

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
        
    def test_reading_plan_progress(self):
        """Test reading plan progress tracking (requires auth)"""
        print("\n📊 Testing Reading Plan Progress...")
        
        if not self.token:
            self.log_result("Reading Plan Progress Test", False, "No authentication token")
            return
        
        # Test getting initial progress
        success, progress_data = self.run_test("Get Reading Plan Progress", "GET", "reading-plan/progress", 200)
        if success and progress_data:
            completed_days = progress_data.get('completed_days', 0)
            total_days = progress_data.get('total_days', 0)
            progress_percentage = progress_data.get('progress_percentage', 0)
            current_streak = progress_data.get('current_streak', 0)
            completed_list = progress_data.get('completed_list', [])
            
            print(f"   Initial progress: {completed_days}/{total_days} days ({progress_percentage}%)")
            print(f"   Current streak: {current_streak} days")
            
            # Check structure
            required_fields = ['completed_days', 'total_days', 'progress_percentage', 'current_streak', 'completed_list']
            missing_fields = [field for field in required_fields if field not in progress_data]
            if missing_fields:
                self.log_result("Progress Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Progress Structure", True)
            
            # Check if total days is 365
            if total_days == 365:
                self.log_result("Total Days Check (365)", True)
            else:
                self.log_result("Total Days Check (365)", False, f"Expected 365 days, got {total_days}")
        
        # Test marking a day as complete
        test_day = 50  # Use day 50 for testing
        success, complete_data = self.run_test("Mark Day Complete", "POST", f"reading-plan/complete/{test_day}", 200)
        if success and complete_data:
            message = complete_data.get('message', '')
            day = complete_data.get('day', 0)
            
            if day == test_day and 'complete' in message.lower():
                self.log_result("Mark Reading Complete", True)
                print(f"   ✓ Marked day {test_day} as complete")
            else:
                self.log_result("Mark Reading Complete", False, f"Unexpected response: {complete_data}")
        
        # Test getting progress after marking complete
        success, updated_progress = self.run_test("Get Updated Progress", "GET", "reading-plan/progress", 200)
        if success and updated_progress:
            new_completed = updated_progress.get('completed_days', 0)
            new_percentage = updated_progress.get('progress_percentage', 0)
            completed_list = updated_progress.get('completed_list', [])
            
            # Check if the day was added to completed list
            if test_day in completed_list:
                self.log_result("Progress Updated After Complete", True)
                print(f"   ✓ Progress updated: {new_completed} days ({new_percentage}%)")
            else:
                self.log_result("Progress Updated After Complete", False, f"Day {test_day} not in completed list: {completed_list}")
        
        # Test unmarking a day
        success, unmark_data = self.run_test("Unmark Day Complete", "DELETE", f"reading-plan/complete/{test_day}", 200)
        if success and unmark_data:
            message = unmark_data.get('message', '')
            day = unmark_data.get('day', 0)
            
            if day == test_day and 'unmarked' in message.lower():
                self.log_result("Unmark Reading Complete", True)
                print(f"   ✓ Unmarked day {test_day}")
            else:
                self.log_result("Unmark Reading Complete", False, f"Unexpected response: {unmark_data}")
        
        # Test getting progress after unmarking
        success, final_progress = self.run_test("Get Final Progress", "GET", "reading-plan/progress", 200)
        if success and final_progress:
            final_completed = final_progress.get('completed_days', 0)
            completed_list = final_progress.get('completed_list', [])
            
            # Check if the day was removed from completed list
            if test_day not in completed_list:
                self.log_result("Progress Updated After Unmark", True)
                print(f"   ✓ Progress reverted: {final_completed} days")
            else:
                self.log_result("Progress Updated After Unmark", False, f"Day {test_day} still in completed list: {completed_list}")
        
        # Test invalid day numbers
        self.run_test("Mark Invalid Day (0)", "POST", "reading-plan/complete/0", 400)
        self.run_test("Mark Invalid Day (400)", "POST", "reading-plan/complete/400", 400)
        
        # Test unmarking non-existent completion
        self.run_test("Unmark Non-existent", "DELETE", "reading-plan/complete/999", 404)

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
                "origin_url": "https://prophecy-news.preview.emergentagent.com"
            }
        )
        
        if success and checkout_data.get('session_id'):
            session_id = checkout_data['session_id']
            print(f"   Created checkout session: {session_id}")
            
            # Test getting subscription status
            self.run_test("Get Subscription Status", "GET", f"subscription/status/{session_id}", 200)

    def create_premium_user(self):
        """Create a premium user for testing premium features"""
        print("\n👑 Creating Premium User...")
        
        # Generate unique premium test user
        timestamp = datetime.now().strftime("%H%M%S")
        premium_email = f"premium_user_{timestamp}@example.com"
        premium_password = "PremiumPass123!"
        premium_name = f"Premium User {timestamp}"
        
        # Register user first
        success, response = self.run_test(
            "Premium User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": premium_email,
                "password": premium_password,
                "name": premium_name
            }
        )
        
        if success and response.get('token'):
            premium_token = response['token']
            premium_user_id = response.get('user_id')
            print(f"   Registered premium user: {premium_email}")
            
            # Now we need to manually set is_premium=True in MongoDB
            # Since we can't directly access MongoDB from here, we'll use the existing premium user
            # or create a workaround
            return premium_email, premium_password, premium_token, premium_user_id
        
        return None, None, None, None

    def test_media_tracking_api(self):
        """Test Media Tracking API (Premium feature)"""
        print("\n🎬 Testing Media Tracking API (Premium Feature)...")
        
        # Try to use existing premium user credentials
        premium_email = "premium@test.com"
        premium_password = "test123"
        
        # Login as premium user
        success, response = self.run_test(
            "Premium User Login for Media Tracking",
            "POST",
            "auth/login",
            200,
            data={
                "email": premium_email,
                "password": premium_password
            }
        )
        
        if not success or not response.get('token'):
            self.log_result("Media Tracking Test Setup", False, "Failed to login as premium user")
            return
        
        # Store original token and set premium token
        original_token = self.token
        self.token = response['token']
        
        # Verify premium status
        success, user_data = self.run_test("Verify Premium for Media Tracking", "GET", "auth/me", 200)
        if not success or not user_data.get('is_premium'):
            self.log_result("Premium Status for Media Tracking", False, "User is not premium")
            self.token = original_token
            return
        
        print(f"   Testing with premium user: {user_data.get('email')}")
        
        # Test 1: Mark video as watched
        success, track_response = self.run_test(
            "Track Video as Watched",
            "POST",
            "media/track/video_1",
            200
        )
        if success:
            message = track_response.get('message', '')
            media_id = track_response.get('media_id', '')
            if 'tracked' in message.lower() and media_id == 'video_1':
                self.log_result("Video Tracking", True)
                print(f"   ✓ Video tracked: {message}")
            else:
                self.log_result("Video Tracking", False, f"Unexpected response: {track_response}")
        
        # Test 2: Mark audio as listened
        success, track_response = self.run_test(
            "Track Audio as Listened",
            "POST",
            "media/track/audio_1",
            200
        )
        if success:
            message = track_response.get('message', '')
            media_id = track_response.get('media_id', '')
            if 'tracked' in message.lower() and media_id == 'audio_1':
                self.log_result("Audio Tracking", True)
                print(f"   ✓ Audio tracked: {message}")
            else:
                self.log_result("Audio Tracking", False, f"Unexpected response: {track_response}")
        
        # Test 3: Get all media with watched/listened status
        success, all_media = self.run_test("Get All Media with Status", "GET", "media/all", 200)
        if success:
            videos = all_media.get('videos', [])
            audio = all_media.get('audio', [])
            stats = all_media.get('stats', {})
            
            # Check if videos have watched status
            video_1 = next((v for v in videos if v.get('id') == 'video_1'), None)
            if video_1 and video_1.get('watched'):
                self.log_result("Video Watched Status", True)
                print(f"   ✓ Video 1 marked as watched")
            else:
                self.log_result("Video Watched Status", False, "Video 1 not marked as watched")
            
            # Check if audio have listened status
            audio_1 = next((a for a in audio if a.get('id') == 'audio_1'), None)
            if audio_1 and audio_1.get('listened'):
                self.log_result("Audio Listened Status", True)
                print(f"   ✓ Audio 1 marked as listened")
            else:
                self.log_result("Audio Listened Status", False, "Audio 1 not marked as listened")
            
            # Check stats
            watched_count = stats.get('watched_count', 0)
            listened_count = stats.get('listened_count', 0)
            
            if watched_count >= 1:
                self.log_result("Watched Count Stats", True)
                print(f"   ✓ Watched count: {watched_count}")
            else:
                self.log_result("Watched Count Stats", False, f"Expected watched_count >= 1, got {watched_count}")
            
            if listened_count >= 1:
                self.log_result("Listened Count Stats", True)
                print(f"   ✓ Listened count: {listened_count}")
            else:
                self.log_result("Listened Count Stats", False, f"Expected listened_count >= 1, got {listened_count}")
        
        # Test 4: Get media history
        success, history_data = self.run_test("Get Media History", "GET", "media/history", 200)
        if success:
            history = history_data.get('history', [])
            if len(history) >= 2:  # Should have video_1 and audio_1
                self.log_result("Media History", True)
                print(f"   ✓ Found {len(history)} items in history")
                
                # Check if our tracked items are in history
                tracked_ids = [item.get('media_id') for item in history]
                if 'video_1' in tracked_ids and 'audio_1' in tracked_ids:
                    self.log_result("History Contains Tracked Items", True)
                else:
                    self.log_result("History Contains Tracked Items", False, f"Missing tracked items in history: {tracked_ids}")
            else:
                self.log_result("Media History", False, f"Expected at least 2 history items, got {len(history)}")
        
        # Test 5: Unmark video as watched
        success, untrack_response = self.run_test(
            "Untrack Video",
            "DELETE",
            "media/track/video_1",
            200
        )
        if success:
            message = untrack_response.get('message', '')
            media_id = untrack_response.get('media_id', '')
            if 'untracked' in message.lower() and media_id == 'video_1':
                self.log_result("Video Untracking", True)
                print(f"   ✓ Video untracked: {message}")
            else:
                self.log_result("Video Untracking", False, f"Unexpected response: {untrack_response}")
        
        # Test 6: Verify video is no longer marked as watched
        success, updated_media = self.run_test("Verify Video Untracked", "GET", "media/all", 200)
        if success:
            videos = updated_media.get('videos', [])
            video_1 = next((v for v in videos if v.get('id') == 'video_1'), None)
            if video_1 and not video_1.get('watched', True):  # Should be False or missing
                self.log_result("Video Untrack Verification", True)
                print(f"   ✓ Video 1 no longer marked as watched")
            else:
                self.log_result("Video Untrack Verification", False, "Video 1 still marked as watched")
        
        # Restore original token
        self.token = original_token

    def test_notification_preferences_api(self):
        """Test Notification Preferences API"""
        print("\n🔔 Testing Notification Preferences API...")
        
        if not self.token:
            self.log_result("Notification Preferences Test Setup", False, "No authentication token")
            return
        
        # Test 1: Get default notification preferences
        success, prefs_data = self.run_test("Get Default Notification Preferences", "GET", "notifications/preferences", 200)
        if success:
            daily_devotional = prefs_data.get('daily_devotional')
            reading_plan_reminder = prefs_data.get('reading_plan_reminder')
            weekly_sermon_updates = prefs_data.get('weekly_sermon_updates')
            reminder_time = prefs_data.get('reminder_time')
            
            print(f"   Default preferences:")
            print(f"     Daily Devotional: {daily_devotional}")
            print(f"     Reading Plan Reminder: {reading_plan_reminder}")
            print(f"     Weekly Sermon Updates: {weekly_sermon_updates}")
            print(f"     Reminder Time: {reminder_time}")
            
            # Check if all required fields are present
            required_fields = ['daily_devotional', 'reading_plan_reminder', 'weekly_sermon_updates', 'reminder_time']
            missing_fields = [field for field in required_fields if field not in prefs_data]
            if missing_fields:
                self.log_result("Notification Preferences Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Notification Preferences Structure", True)
            
            # Check default values (should be reasonable defaults)
            if isinstance(daily_devotional, bool) and isinstance(reading_plan_reminder, bool) and isinstance(weekly_sermon_updates, bool):
                self.log_result("Notification Preferences Types", True)
            else:
                self.log_result("Notification Preferences Types", False, "Boolean fields are not boolean type")
            
            if reminder_time and ':' in str(reminder_time):
                self.log_result("Reminder Time Format", True)
            else:
                self.log_result("Reminder Time Format", False, f"Invalid time format: {reminder_time}")
        
        # Test 2: Update notification preferences
        new_preferences = {
            "daily_devotional": False,
            "reading_plan_reminder": True,
            "weekly_sermon_updates": False,
            "reminder_time": "07:00"
        }
        
        success, update_response = self.run_test(
            "Update Notification Preferences",
            "PUT",
            "notifications/preferences",
            200,
            data=new_preferences
        )
        if success:
            message = update_response.get('message', '')
            if 'updated' in message.lower() or 'success' in message.lower():
                self.log_result("Notification Preferences Update", True)
                print(f"   ✓ Preferences updated: {message}")
            else:
                self.log_result("Notification Preferences Update", False, f"Unexpected response: {update_response}")
        
        # Test 3: Verify changes were saved
        success, updated_prefs = self.run_test("Verify Updated Preferences", "GET", "notifications/preferences", 200)
        if success:
            daily_devotional = updated_prefs.get('daily_devotional')
            reading_plan_reminder = updated_prefs.get('reading_plan_reminder')
            weekly_sermon_updates = updated_prefs.get('weekly_sermon_updates')
            reminder_time = updated_prefs.get('reminder_time')
            
            print(f"   Updated preferences:")
            print(f"     Daily Devotional: {daily_devotional}")
            print(f"     Reading Plan Reminder: {reading_plan_reminder}")
            print(f"     Weekly Sermon Updates: {weekly_sermon_updates}")
            print(f"     Reminder Time: {reminder_time}")
            
            # Verify each field matches what we set
            verification_passed = True
            if daily_devotional != new_preferences['daily_devotional']:
                self.log_result("Daily Devotional Update", False, f"Expected {new_preferences['daily_devotional']}, got {daily_devotional}")
                verification_passed = False
            
            if reading_plan_reminder != new_preferences['reading_plan_reminder']:
                self.log_result("Reading Plan Reminder Update", False, f"Expected {new_preferences['reading_plan_reminder']}, got {reading_plan_reminder}")
                verification_passed = False
            
            if weekly_sermon_updates != new_preferences['weekly_sermon_updates']:
                self.log_result("Weekly Sermon Updates Update", False, f"Expected {new_preferences['weekly_sermon_updates']}, got {weekly_sermon_updates}")
                verification_passed = False
            
            if reminder_time != new_preferences['reminder_time']:
                self.log_result("Reminder Time Update", False, f"Expected {new_preferences['reminder_time']}, got {reminder_time}")
                verification_passed = False
            
            if verification_passed:
                self.log_result("Notification Preferences Verification", True)
                print("   ✓ All preferences updated correctly")

    def test_news_scripture_analysis_api(self):
        """Test News-Scripture Analysis API (Premium feature)"""
        print("\n📰 Testing News-Scripture Analysis API (Premium Feature)...")
        
        # Try to use existing premium user credentials
        premium_email = "premium@test.com"
        premium_password = "test123"
        
        # Login as premium user
        success, response = self.run_test(
            "Premium User Login for News Analysis",
            "POST",
            "auth/login",
            200,
            data={
                "email": premium_email,
                "password": premium_password
            }
        )
        
        if not success or not response.get('token'):
            self.log_result("News Analysis Test Setup", False, "Failed to login as premium user")
            return
        
        # Store original token and set premium token
        original_token = self.token
        self.token = response['token']
        
        # Verify premium status
        success, user_data = self.run_test("Verify Premium for News Analysis", "GET", "auth/me", 200)
        if not success or not user_data.get('is_premium'):
            self.log_result("Premium Status for News Analysis", False, "User is not premium")
            self.token = original_token
            return
        
        print(f"   Testing with premium user: {user_data.get('email')}")
        
        # Test 1: Analyze news with scripture
        news_data = {
            "news_headline": "Global Climate Summit Reaches New Agreement",
            "news_content": "World leaders gathered to discuss environmental policies and signed a historic agreement to reduce carbon emissions."
        }
        
        success, analysis_response = self.run_test(
            "Analyze News with Scripture",
            "POST",
            "analyze/news",
            200,
            data=news_data
        )
        
        analysis_id = None
        if success:
            analysis_id = analysis_response.get('analysis_id')
            news_headline = analysis_response.get('news_headline')
            scripture_references = analysis_response.get('scripture_references', [])
            analysis = analysis_response.get('analysis', '')
            spiritual_application = analysis_response.get('spiritual_application', '')
            created_at = analysis_response.get('created_at')
            
            print(f"   Analysis ID: {analysis_id}")
            print(f"   Headline: {news_headline}")
            
            # Check required fields
            required_fields = ['analysis_id', 'news_headline', 'scripture_references', 'analysis']
            missing_fields = [field for field in required_fields if field not in analysis_response]
            if missing_fields:
                self.log_result("News Analysis Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("News Analysis Response Structure", True)
            
            # Check scripture references
            if scripture_references and len(scripture_references) > 0:
                self.log_result("Scripture References Provided", True)
                print(f"   ✓ Found {len(scripture_references)} scripture references")
                
                # Check structure of first scripture reference
                if scripture_references:
                    ref = scripture_references[0]
                    ref_fields = ['reference', 'text', 'connection']
                    missing_ref_fields = [field for field in ref_fields if field not in ref]
                    if missing_ref_fields:
                        self.log_result("Scripture Reference Structure", False, f"Missing fields in reference: {missing_ref_fields}")
                    else:
                        self.log_result("Scripture Reference Structure", True)
                        print(f"   Sample reference: {ref.get('reference')} - {ref.get('text', '')[:50]}...")
            else:
                self.log_result("Scripture References Provided", False, "No scripture references in response")
            
            # Check analysis content
            if analysis and len(analysis) > 50:  # Should have substantial analysis
                self.log_result("Analysis Content Quality", True)
                print(f"   ✓ Analysis provided ({len(analysis)} characters)")
            else:
                self.log_result("Analysis Content Quality", False, f"Analysis too short or missing: {len(analysis) if analysis else 0} characters")
            
            # Check spiritual application
            if spiritual_application:
                self.log_result("Spiritual Application Provided", True)
                print(f"   ✓ Spiritual application provided")
            else:
                self.log_result("Spiritual Application Provided", False, "No spiritual application provided")
        
        # Test 2: Get analysis history
        success, history_data = self.run_test("Get Analysis History", "GET", "analyze/history", 200)
        if success:
            analyses = history_data.get('analyses', [])
            if len(analyses) >= 1:  # Should have at least our recent analysis
                self.log_result("Analysis History", True)
                print(f"   ✓ Found {len(analyses)} analyses in history")
                
                # Check if our analysis is in the history
                if analysis_id:
                    found_analysis = next((a for a in analyses if a.get('analysis_id') == analysis_id), None)
                    if found_analysis:
                        self.log_result("Recent Analysis in History", True)
                        print(f"   ✓ Recent analysis found in history")
                    else:
                        self.log_result("Recent Analysis in History", False, "Recent analysis not found in history")
            else:
                self.log_result("Analysis History", False, f"Expected at least 1 analysis in history, got {len(analyses)}")
        
        # Restore original token
        self.token = original_token

    def test_audio_urls_verification(self):
        """Test Audio URLs are valid Internet Archive URLs (Premium feature)"""
        print("\n🎵 Testing Audio URLs Verification (Premium Feature)...")
        
        # Try to use existing premium user credentials
        premium_email = "premium@test.com"
        premium_password = "test123"
        
        # Login as premium user
        success, response = self.run_test(
            "Premium User Login for Audio URLs",
            "POST",
            "auth/login",
            200,
            data={
                "email": premium_email,
                "password": premium_password
            }
        )
        
        if not success or not response.get('token'):
            self.log_result("Audio URLs Test Setup", False, "Failed to login as premium user")
            return
        
        # Store original token and set premium token
        original_token = self.token
        self.token = response['token']
        
        # Verify premium status
        success, user_data = self.run_test("Verify Premium for Audio URLs", "GET", "auth/me", 200)
        if not success or not user_data.get('is_premium'):
            self.log_result("Premium Status for Audio URLs", False, "User is not premium")
            self.token = original_token
            return
        
        print(f"   Testing with premium user: {user_data.get('email')}")
        
        # Test: Get audio sermons and verify URLs
        success, audio_data = self.run_test("Get Audio Sermons for URL Verification", "GET", "media/audio", 200)
        if success:
            audio_sermons = audio_data.get('audio', [])
            if audio_sermons:
                print(f"   Found {len(audio_sermons)} audio sermons")
                
                valid_urls = 0
                invalid_urls = []
                
                for sermon in audio_sermons:
                    audio_url = sermon.get('audio_url', '')
                    sermon_title = sermon.get('title', 'Unknown')
                    
                    # Check if URL is from Internet Archive
                    if 'archive.org' in audio_url and audio_url.startswith('https://'):
                        valid_urls += 1
                        print(f"   ✓ Valid Internet Archive URL: {sermon_title}")
                    else:
                        invalid_urls.append(f"{sermon_title}: {audio_url}")
                
                if valid_urls == len(audio_sermons):
                    self.log_result("All Audio URLs are Internet Archive", True)
                    print(f"   ✓ All {valid_urls} audio URLs are valid Internet Archive URLs")
                else:
                    self.log_result("All Audio URLs are Internet Archive", False, f"Invalid URLs found: {invalid_urls}")
                
                # Check URL format more specifically
                ia_pattern_found = 0
                for sermon in audio_sermons:
                    audio_url = sermon.get('audio_url', '')
                    # Internet Archive URLs typically follow pattern: https://ia[numbers].us.archive.org/...
                    if 'ia' in audio_url and 'us.archive.org' in audio_url:
                        ia_pattern_found += 1
                
                if ia_pattern_found == len(audio_sermons):
                    self.log_result("Internet Archive URL Pattern", True)
                    print(f"   ✓ All URLs follow Internet Archive pattern")
                else:
                    self.log_result("Internet Archive URL Pattern", False, f"Only {ia_pattern_found}/{len(audio_sermons)} URLs follow IA pattern")
            else:
                self.log_result("Audio Sermons Available", False, "No audio sermons found")
        
        # Restore original token
        self.token = original_token

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Prophecy News Study Bible API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic health tests
        self.test_health_endpoints()
        
        # Public endpoints
        self.test_bible_endpoints()
        self.test_dictionary_endpoints()
        self.test_devotional_endpoints()
        self.test_reading_plan_endpoints()
        
        # Authentication flow
        email, password = self.test_auth_registration()
        self.test_auth_login(email, password)
        self.test_auth_me()
        
        # Protected endpoints
        self.test_bookmarks_protected()
        self.test_reading_plan_progress()
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
    tester = ProphecyNewsStudyBibleAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())