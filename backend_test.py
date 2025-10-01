#!/usr/bin/env python3
"""
Backend API Test Suite for Coloring Game
Tests all backend endpoints with realistic data
"""

import requests
import json
import sys
import os
from datetime import datetime
import base64

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip().strip('"')
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("❌ Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BACKEND_URL}/api"
print(f"🔗 Testing backend at: {API_BASE}")

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(test_name, success, details=""):
    """Log test results"""
    if success:
        print(f"✅ {test_name}")
        test_results["passed"] += 1
    else:
        print(f"❌ {test_name}: {details}")
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {details}")

def test_health_check():
    """Test GET /api/ endpoint"""
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "running" in data["message"].lower():
                log_test("Health Check", True)
                return True
            else:
                log_test("Health Check", False, f"Unexpected response: {data}")
                return False
        else:
            log_test("Health Check", False, f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test("Health Check", False, f"Connection error: {str(e)}")
        return False

def test_initialize_data():
    """Test POST /api/initialize-data endpoint"""
    try:
        response = requests.post(f"{API_BASE}/initialize-data", timeout=15)
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Initialize Data", True, data["message"])
                return True
            else:
                log_test("Initialize Data", False, f"Unexpected response: {data}")
                return False
        else:
            log_test("Initialize Data", False, f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test("Initialize Data", False, f"Error: {str(e)}")
        return False

def test_get_coloring_pages():
    """Test GET /api/coloring-pages endpoint"""
    try:
        response = requests.get(f"{API_BASE}/coloring-pages", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Coloring Pages", True, f"Retrieved {len(data)} pages")
                return data
            else:
                log_test("Get Coloring Pages", False, f"Expected list, got: {type(data)}")
                return []
        else:
            log_test("Get Coloring Pages", False, f"Status {response.status_code}: {response.text}")
            return []
    except Exception as e:
        log_test("Get Coloring Pages", False, f"Error: {str(e)}")
        return []

def test_get_coloring_pages_by_category():
    """Test GET /api/coloring-pages?category=animals endpoint"""
    try:
        response = requests.get(f"{API_BASE}/coloring-pages?category=animals", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Check if all returned pages are animals category
                animals_only = all(page.get("category") == "animals" for page in data)
                if animals_only:
                    log_test("Get Coloring Pages by Category (animals)", True, f"Retrieved {len(data)} animal pages")
                    return True
                else:
                    log_test("Get Coloring Pages by Category (animals)", False, "Some pages are not animals category")
                    return False
            else:
                log_test("Get Coloring Pages by Category (animals)", False, f"Expected list, got: {type(data)}")
                return False
        else:
            log_test("Get Coloring Pages by Category (animals)", False, f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test("Get Coloring Pages by Category (animals)", False, f"Error: {str(e)}")
        return False

def test_get_specific_coloring_page(pages):
    """Test GET /api/coloring-pages/{page_id} endpoint"""
    if not pages:
        log_test("Get Specific Coloring Page", False, "No pages available to test")
        return False
    
    try:
        page_id = pages[0]["id"]
        response = requests.get(f"{API_BASE}/coloring-pages/{page_id}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("id") == page_id:
                log_test("Get Specific Coloring Page", True, f"Retrieved page: {data.get('name')}")
                return True
            else:
                log_test("Get Specific Coloring Page", False, f"ID mismatch: expected {page_id}, got {data.get('id')}")
                return False
        else:
            log_test("Get Specific Coloring Page", False, f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test("Get Specific Coloring Page", False, f"Error: {str(e)}")
        return False

def test_create_coloring_page():
    """Test POST /api/coloring-pages endpoint"""
    try:
        new_page = {
            "name": "Sevimli Köpek",
            "category": "animals",
            "difficulty": "easy",
            "svg_content": "<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><circle cx='100' cy='100' r='50' fill='none' stroke='black' stroke-width='2'/><circle cx='85' cy='90' r='5' fill='black'/><circle cx='115' cy='90' r='5' fill='black'/><path d='M90 110 Q100 120 110 110' stroke='black' stroke-width='2' fill='none'/></svg>",
            "thumbnail": None
        }
        
        response = requests.post(f"{API_BASE}/coloring-pages", 
                               json=new_page, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("name") == new_page["name"] and "id" in data:
                log_test("Create Coloring Page", True, f"Created page: {data.get('name')}")
                return data
            else:
                log_test("Create Coloring Page", False, f"Unexpected response: {data}")
                return None
        else:
            log_test("Create Coloring Page", False, f"Status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        log_test("Create Coloring Page", False, f"Error: {str(e)}")
        return None

def test_get_artworks():
    """Test GET /api/artworks endpoint"""
    try:
        response = requests.get(f"{API_BASE}/artworks", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Artworks", True, f"Retrieved {len(data)} artworks")
                return data
            else:
                log_test("Get Artworks", False, f"Expected list, got: {type(data)}")
                return []
        else:
            log_test("Get Artworks", False, f"Status {response.status_code}: {response.text}")
            return []
    except Exception as e:
        log_test("Get Artworks", False, f"Error: {str(e)}")
        return []

def test_save_artwork(pages):
    """Test POST /api/artworks endpoint"""
    if not pages:
        log_test("Save Artwork", False, "No coloring pages available to create artwork")
        return None
    
    try:
        # Create a sample artwork with base64 encoded image data
        sample_image_data = base64.b64encode(b"sample_colored_image_data").decode('utf-8')
        
        new_artwork = {
            "user_id": "çocuk_123",
            "coloring_page_id": pages[0]["id"],
            "artwork_data": sample_image_data,
            "title": "Benim Güzel Kedim"
        }
        
        response = requests.post(f"{API_BASE}/artworks", 
                               json=new_artwork, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("coloring_page_id") == new_artwork["coloring_page_id"] and "id" in data:
                log_test("Save Artwork", True, f"Saved artwork: {data.get('title')}")
                return data
            else:
                log_test("Save Artwork", False, f"Unexpected response: {data}")
                return None
        else:
            log_test("Save Artwork", False, f"Status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        log_test("Save Artwork", False, f"Error: {str(e)}")
        return None

def test_delete_artwork(artwork):
    """Test DELETE /api/artworks/{artwork_id} endpoint"""
    if not artwork:
        log_test("Delete Artwork", False, "No artwork available to delete")
        return False
    
    try:
        artwork_id = artwork["id"]
        response = requests.delete(f"{API_BASE}/artworks/{artwork_id}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "deleted" in data["message"].lower():
                log_test("Delete Artwork", True, data["message"])
                return True
            else:
                log_test("Delete Artwork", False, f"Unexpected response: {data}")
                return False
        else:
            log_test("Delete Artwork", False, f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test("Delete Artwork", False, f"Error: {str(e)}")
        return False

def test_get_stickers():
    """Test GET /api/stickers endpoint"""
    try:
        response = requests.get(f"{API_BASE}/stickers", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Stickers", True, f"Retrieved {len(data)} stickers")
                return data
            else:
                log_test("Get Stickers", False, f"Expected list, got: {type(data)}")
                return []
        else:
            log_test("Get Stickers", False, f"Status {response.status_code}: {response.text}")
            return []
    except Exception as e:
        log_test("Get Stickers", False, f"Error: {str(e)}")
        return []

def main():
    """Run all backend tests"""
    print("🎨 Starting Coloring Game Backend API Tests")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    health_ok = test_health_check()
    
    if not health_ok:
        print("\n❌ Backend is not responding. Stopping tests.")
        return
    
    # Test 2: Initialize Data
    print("\n2. Testing Data Initialization...")
    test_initialize_data()
    
    # Test 3: Get Coloring Pages
    print("\n3. Testing Get Coloring Pages...")
    pages = test_get_coloring_pages()
    
    # Test 4: Get Coloring Pages by Category
    print("\n4. Testing Get Coloring Pages by Category...")
    test_get_coloring_pages_by_category()
    
    # Test 5: Get Specific Coloring Page
    print("\n5. Testing Get Specific Coloring Page...")
    test_get_specific_coloring_page(pages)
    
    # Test 6: Create New Coloring Page
    print("\n6. Testing Create Coloring Page...")
    new_page = test_create_coloring_page()
    
    # Test 7: Get Artworks
    print("\n7. Testing Get Artworks...")
    artworks = test_get_artworks()
    
    # Test 8: Save Artwork
    print("\n8. Testing Save Artwork...")
    saved_artwork = test_save_artwork(pages)
    
    # Test 9: Delete Artwork
    print("\n9. Testing Delete Artwork...")
    test_delete_artwork(saved_artwork)
    
    # Test 10: Get Stickers
    print("\n10. Testing Get Stickers...")
    test_get_stickers()
    
    # Print Summary
    print("\n" + "=" * 50)
    print("🎨 BACKEND TEST SUMMARY")
    print("=" * 50)
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    print(f"📊 Total: {test_results['passed'] + test_results['failed']}")
    
    if test_results["errors"]:
        print("\n🔍 FAILED TESTS:")
        for error in test_results["errors"]:
            print(f"  • {error}")
    
    if test_results["failed"] == 0:
        print("\n🎉 All backend tests passed!")
        return True
    else:
        print(f"\n⚠️  {test_results['failed']} tests failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)