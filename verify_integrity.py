import json
import os

DAILY_CARS_FILE = "src/data/dailyCars.json"
CARS_DB_FILE = "src/data/cars.json"

def verify_integrity():
    if not os.path.exists(DAILY_CARS_FILE) or not os.path.exists(CARS_DB_FILE):
        print("One or both data files missing.")
        return

    with open(DAILY_CARS_FILE, 'r') as f:
        daily_cars = json.load(f)

    with open(CARS_DB_FILE, 'r') as f:
        cars_db = json.load(f)

    # Build a lookup set for O(1) checking
    # Structure: available_cars[make_lower] = set(model_lower1, model_lower2, ...)
    available_cars = {}
    for entry in cars_db['makes']:
        make_lower = entry['make'].lower()
        available_cars[make_lower] = set()
        for model in entry['models']:
            available_cars[make_lower].add(model['model'].lower())

    missing_entries = []

    print(f"Verifying {len(daily_cars)} daily cars against database...")

    for car in daily_cars:
        car_id = car.get('id', 'Unknown ID')
        make = car['make']
        model = car['model']
        
        make_lower = make.lower()
        model_lower = model.lower()

        if make_lower not in available_cars:
            missing_entries.append(f"ID {car_id}: Make '{make}' not found in database.")
            continue

        if model_lower not in available_cars[make_lower]:
            missing_entries.append(f"ID {car_id}: Model '{model}' not found in Make '{make}'.")

    if missing_entries:
        print("\n❌ INTEGRITY ISSUES FOUND:")
        for issue in missing_entries:
            print(issue)
        print(f"\nTotal issues: {len(missing_entries)}")
    else:
        print("\n✅ All daily cars are valid and exist in the database.")

if __name__ == "__main__":
    verify_integrity()
