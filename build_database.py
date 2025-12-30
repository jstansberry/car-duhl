import sqlite3
import json
import urllib.request
import urllib.parse
import time

# Load makes
try:
    with open('makes.json', 'r') as f:
        makes_data = json.load(f)
except FileNotFoundError:
    print("makes.json not found. Run fetch_makes.py first.")
    exit(1)

# Initialize Database
conn = sqlite3.connect('cars.db')
cursor = conn.cursor()

# Create Tables
cursor.execute('''
CREATE TABLE IF NOT EXISTS makes (
    id INTEGER PRIMARY KEY,
    make TEXT UNIQUE
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY,
    make_id INTEGER,
    model TEXT,
    FOREIGN KEY(make_id) REFERENCES makes(id)
)
''')
conn.commit()

base_models_url = "https://cardle-strapi-api-0030dbf64eee.herokuapp.com/api/models"

print(f"resyncing {len(makes_data['data'])} makes...")

for make_item in makes_data['data']:
    make_id_strapi = make_item['id']
    make_name = make_item['attributes']['make']
    
    # Insert Make into DB
    try:
        cursor.execute('INSERT OR IGNORE INTO makes (id, make) VALUES (?, ?)', (make_id_strapi, make_name))
        make_db_id = make_id_strapi # Using strapi ID helps consistency, though we could use rowid
    except sqlite3.Error as e:
        print(f"Error inserting make {make_name}: {e}")
        continue

    # Fetch Models for this Make
    print(f"Fetching models for {make_name}...")
    
    # Encode the make name for URL (handle spaces, etc)
    # filters[make][make][$eqi]={MAKE_NAME}
    params = {
        "fields[0]": "model",
        "filters[make][make][$eqi]": make_name,
        "sort[0]": "model",
        "pagination[limit]": "200"
    }
    
    query_string = urllib.parse.urlencode(params)
    url = f"{base_models_url}?{query_string}"
    
    try:
        with urllib.request.urlopen(url) as response:
            models_data = json.loads(response.read().decode())
            
            for model_item in models_data['data']:
                model_id_strapi = model_item['id']
                model_name = model_item['attributes']['model']
                
                cursor.execute('INSERT OR IGNORE INTO models (id, make_id, model) VALUES (?, ?, ?)', 
                               (model_id_strapi, make_db_id, model_name))
            
            conn.commit()
            
    except Exception as e:
        print(f"Error fetching models for {make_name}: {e}")
    
    # Be polite
    time.sleep(0.2)

conn.close()
print("Database build complete: cars.db")
