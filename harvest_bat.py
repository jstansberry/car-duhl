import urllib.request
import urllib.error
from html.parser import HTMLParser
import random
import json
import time
import re

# Simple HTML Parser to find links
class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.listing_links = set()
        
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            for attr in attrs:
                if attr[0] == 'href':
                    href = attr[1]
                    if 'bringatrailer.com/listing/' in href:
                        # Clean URL (remove query params)
                        clean_href = href.split('?')[0]
                        self.listing_links.add(clean_href)

def fetch_url(url):
    print(f"Fetching {url}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def extract_meta_property(html, property_name):
    # Quick regex search for meta tags to avoid complex parsing
    # <meta property="og:image" content="..." />
    pattern = r'<meta\s+property=["\']' + re.escape(property_name) + r'["\']\s+content=["\']([^"\']+)["\']'
    match = re.search(pattern, html, re.IGNORECASE)
    if match:
        return match.group(1)
    return None

def probe_bat():
    # Attempt 1: WP API
    api_url = "https://bringatrailer.com/wp-json/wp/v2/listing?per_page=5"
    print(f"Probing API: {api_url}")
    json_data = fetch_url(api_url)
    if json_data:
        try:
            listings = json.loads(json_data)
            print(f"API Success! Found {len(listings)} listings.")
            if len(listings) > 0:
                l = listings[0]
                print(f"Sample Title: {l.get('title', {}).get('rendered')}")
                print(f"Sample Link: {l.get('link')}")
                # We can likely get the image from 'jetpack_featured_media_url' or similar fields
                print(f"Sample Image: {l.get('jetpack_featured_media_url')}")
                return # Success, no need to try others
        except Exception as e:
            print(f"API Parse Error: {e}")
    else:
        print("API request failed.")

    # Attempt 2: Category Page
    cat_url = "https://bringatrailer.com/category/american/"
    print(f"\nProbing Category: {cat_url}")
    html = fetch_url(cat_url)
    if html:
        parser = LinkParser()
        parser.feed(html)
        print(f"Found {len(parser.listing_links)} unique listing URLs on category page.")
        if len(parser.listing_links) > 0:
            print(list(parser.listing_links)[:3])
    else:
        print("Category request failed.")

if __name__ == "__main__":
    probe_bat()
