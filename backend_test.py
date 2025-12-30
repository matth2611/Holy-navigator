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
        self.run_test("Get John Chapter 3", "GET", "bible/chapter/John/3", 200)
        self.run_test("Get Psalms Chapter 23", "GET", "bible/chapter/Psalms/23", 200)
        
        # Test invalid chapter
        self.run_test("Invalid Chapter", "GET", "bible/chapter/InvalidBook/999", 200)  # Should return placeholder

    def test_dictionary_endpoints(self):
        """Test Bible dictionary endpoints"""
        print("\n📚 Testing Dictionary Endpoints...")
        
        success, dict_data = self.run_test("Get Dictionary", "GET", "bible/dictionary", 200)
        if success and dict_data.get('words'):
            print(f"   Found {len(dict_data['words'])} dictionary entries")
        
        # Test specific word lookup
        self.run_test("Get Word 'grace'", "GET", "bible/dictionary/grace", 200)
        self.run_test("Get Word 'faith'", "GET", "bible/dictionary/faith", 200)
        self.run_test("Invalid Word", "GET", "bible/dictionary/nonexistentword", 404)
        
        # Test search
        self.run_test("Search Dictionary", "GET", "bible/search?q=grace", 200)

    def test_devotional_endpoints(self):
        """Test devotional endpoints"""
        print("\n🙏 Testing Devotional Endpoints...")
        
        success, today_data = self.run_test("Get Today's Devotional", "GET", "devotional/today", 200)
        if success and today_data:
            print(f"   Today's devotional: '{today_data.get('title', 'N/A')}'")
        
        success, all_data = self.run_test("Get All Devotionals", "GET", "devotional/all", 200)
        if success and all_data.get('devotionals'):
            print(f"   Found {len(all_data['devotionals'])} devotionals")

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
        self.test_premium_endpoints_without_subscription()
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