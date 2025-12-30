import json
import os

CARS_DB_FILE = "src/data/cars.json"

def sort_db():
    if not os.path.exists(CARS_DB_FILE):
        print("No DB file found.")
        return

    with open(CARS_DB_FILE, 'r') as f:
        data = json.load(f)

    # Sort Models within each Make
    for make in data['makes']:
        make['models'].sort(key=lambda x: x['model'].lower())

    # Sort Makes
    data['makes'].sort(key=lambda x: x['make'].lower())

    with open(CARS_DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    
    print("Database sorted successfully.")

if __name__ == "__main__":
    sort_db()
