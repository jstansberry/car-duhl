import urllib.request
import urllib.error
import re
import json
import random
import time
from html.parser import HTMLParser
import os
import datetime

# --- Configuration ---
CATEGORIES = [
    "american", "japanese", "european", "trucks-4x4"
]
TARGET_COUNT = 30 # Harvest 30 cars
OUTPUT_FILE = "src/data/dailyCars.json"

# --- Database Sync Logic ---
CARS_DB_FILE = "src/data/cars.json"

def load_cars_db():
    if os.path.exists(CARS_DB_FILE):
        with open(CARS_DB_FILE, 'r') as f:
            return json.load(f)
    return {"makes": []}

def save_cars_db(data):
    # Sort before saving
    for make in data['makes']:
        make['models'].sort(key=lambda x: x['model'].lower())
    data['makes'].sort(key=lambda x: x['make'].lower())

    with open(CARS_DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    print("Updated and sorted cars.json with new makes/models.")

def get_next_id(items):
    # Helper to find max ID + 1
    if not items: return 1
    return max(item.get('id', 0) for item in items) + 1

def sync_car_to_db(make_name, model_name, db):
    # 1. Normalize Names
    # DB uses uppercase for Makes usually, but let's check strict or case-insensitive?
    # Based on file, Makes are "ACURA", "ALFA ROMEO".
    make_upper = make_name.upper()
    
    # Check Make
    make_entry = None
    for m in db['makes']:
        if m['make'].upper() == make_upper:
            make_entry = m
            break
            
    if not make_entry:
        print(f"New Make detected: {make_upper}")
        new_id = get_next_id(db['makes'])
        make_entry = {
            "id": new_id,
            "make": make_upper,
            "models": []
        }
        db['makes'].append(make_entry)
        # Sort makes alphabetically just to be nice? (Optional)
        
    # Check Model
    # Models in JSON are mixed case "NSX", "Civic", "Type R".
    # We will match case-insensitive to avoid duplicates like "NSX" vs "nsx".
    model_entry = None
    existing_models = make_entry['models']
    
    for mod in existing_models:
        if mod['model'].upper() == model_name.upper():
            model_entry = mod
            break
            
    if not model_entry:
        print(f"New Model detected for {make_upper}: {model_name}")
        new_mod_id = get_next_id(existing_models)
        # Use original casing for model name display
        new_model = {
            "id": new_mod_id,
            "model": model_name
        }
        existing_models.append(new_model)
        return True # Indicates specific DB update needed
        
    return False

# --- Helpers ---
class ListingParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            for attr in attrs:
                if attr[0] == 'href' and 'bringatrailer.com/listing/' in attr[1]:
                    self.links.add(attr[1].split('?')[0])

def fetch_html(url):
    print(f"Fetching {url}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_meta(html, property_name):
    pattern = r'<meta\s+property=["\']' + re.escape(property_name) + r'["\']\s+content=["\']([^"\']+)["\']'
    match = re.search(pattern, html, re.IGNORECASE)
    return match.group(1) if match else None

import html as html_lib

def parse_title(title):
    # Decode HTML entities (e.g. &#038; -> &)
    clean_title = html_lib.unescape(title)
    
    # Remove "No Reserve:" prefix explicitly if present
    clean_title = re.sub(r'^No Reserve:\s*', '', clean_title, flags=re.IGNORECASE)

    # Find the first occurrence of a year (1900-2029)
    # \b ensures we don't match loop numbers or prices easily
    year_match = re.search(r'\b(19[0-9]{2}|20[0-2][0-9])\b', clean_title)
    
    if not year_match:
        return None
        
    year = int(year_match.group(1))
    
    # Everything after the year is candidate for Make/Model
    # "3,100-Mile 1978 Chevrolet Corvette Pace Car" -> Year=1978, Rest=" Chevrolet Corvette Pace Car"
    # split(year, 1) might be risky if year appears twice (rare). 
    # Let's use the match index.
    
    start_idx = year_match.end()
    remainder = clean_title[start_idx:].strip()
    
    # Heuristic: Make is the first word, Model is the rest
    parts = remainder.split(' ', 1)
    if not parts or parts[0] == '':
        return None
        
    make = parts[0]
    model = parts[1] if len(parts) > 1 else "Unknown"
    
    # Clean model: Remove common BaT suffixes or excessive details
    # E.g. "Corvette Pace Car Edition Project" -> "Corvette"
    # This is hard to get perfect automatically. 
    # A simple approach: Take first 2 words of model if it's long? 
    # Or just strip comma items.
    model = model.split(',')[0].strip()
    
    # Common Cleanup: Remove "Coupe", "Convertible", "Project" if they are at the end? 
    # For a game, "Corvette Stingray" is better than "Corvette Stingray Coupe".
    # But "911 Carrera" is better than "911".
    # Let's keep it simple for now: simple comma truncation.
    
    return {
        "year": year,
        "make": make,
        "model": model
    }

def load_existing_data():
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r') as f:
            try:
                return json.load(f)
            except:
                return []
    return []

def save_data(data):
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Saved {len(data)} entries to {OUTPUT_FILE}")

def main():
    all_links = set()
    
    # 1. Harvest Links
    cats = CATEGORIES[:]
    random.shuffle(cats)
    
    for cat in cats:
        if len(all_links) > 20: break 
        url = f"https://bringatrailer.com/category/{cat}/"
        html = fetch_html(url)
        if html:
            parser = ListingParser()
            parser.feed(html)
            print(f"Found {len(parser.links)} links in {cat}")
            all_links.update(parser.links)
        time.sleep(1) 
            
    unique_links = list(all_links)
    random.shuffle(unique_links)
    
    # 2. Process Cars
    existing_data = load_existing_data()
    cars_db = load_cars_db()
    db_modified = False
    
    last_date = datetime.date.today()
    if existing_data:
        try:
            dates = [datetime.datetime.strptime(d['date'], "%Y-%m-%d").date() for d in existing_data]
            dates.sort()
            last_date = dates[-1]
        except:
            pass
            
    print(f"Starting harvest. Target: {TARGET_COUNT} cars.")
    
    count = 0
    for link in unique_links:
        if count >= TARGET_COUNT:
            break
            
        print(f"Processing {link} ...")
        details_html = fetch_html(link)
        if not details_html:
            continue
            
        # Get Image
        image_url = extract_meta(details_html, "og:image")
        if not image_url:
            print("No image found, skipping.")
            continue
            
        # Get Title
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', details_html, re.DOTALL)
        if not title_match:
            print("No title found, skipping.")
            continue
            
        title_text = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() 
        parsed = parse_title(title_text)
        
        if not parsed:
            print(f"Could not parse title '{title_text}', skipping.")
            continue
            
        # Uniqueness check 
        is_dup = False
        for entry in existing_data:
            if entry['imageUrl'] == image_url:
                is_dup = True
                break
        if is_dup:
            print("Duplicate car, skipping.")
            continue

        # Increment Date
        last_date += datetime.timedelta(days=1)
        next_date_str = last_date.strftime("%Y-%m-%d")
        
        # Calculate next ID
        next_id = 1
        if existing_data:
            next_id = max(item.get('id', 0) for item in existing_data) + 1
            
        entry = {
            "id": next_id,
            "date": next_date_str,
            "make": parsed['make'],
            "model": parsed['model'],
            "year": parsed['year'],
            "imageUrl": image_url,
            "transformOrigin": "center center", 
            "maxZoom": 5
        }
        
        print(f"Added: {parsed['year']} {parsed['make']} {parsed['model']}")
        existing_data.append(entry)
        count += 1
        
        # Sync to DB
        if sync_car_to_db(parsed['make'], parsed['model'], cars_db):
            db_modified = True
        
        time.sleep(1)
        
    # 3. Save
    save_data(existing_data)
    
    # 4. Backfill Validation
    # Ensure all entries in dailyCars are in cars.json (useful for first run or manual edits)
    print("Verifying database integrity...")
    for entry in existing_data:
        if sync_car_to_db(entry['make'], entry['model'], cars_db):
            db_modified = True
            
    if db_modified:
        save_cars_db(cars_db)
        
    print("Harvest complete!")

if __name__ == "__main__":
    main()
