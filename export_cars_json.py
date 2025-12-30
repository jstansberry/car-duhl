import sqlite3
import json
import os

# Ensure the directory exists
os.makedirs('src/data', exist_ok=True)

conn = sqlite3.connect('cars.db')
cursor = conn.cursor()

# Get all makes
cursor.execute('SELECT id, make FROM makes ORDER BY make')
makes = cursor.fetchall()

result = {"makes": []}

for make_id, make_name in makes:
    # Get models for this make
    cursor.execute('SELECT id, model FROM models WHERE make_id = ? ORDER BY model', (make_id,))
    models = cursor.fetchall()
    
    make_obj = {
        "id": make_id,
        "make": make_name,
        "models": [{"id": m_id, "model": m_name} for m_id, m_name in models]
    }
    result["makes"].append(make_obj)

conn.close()

with open('src/data/cars.json', 'w') as f:
    json.dump(result, f, separators=(',', ':')) # Minified

print(f"Successfully exported {len(result['makes'])} makes to src/data/cars.json")
