import json
import datetime
import os

FILE_PATH = "src/data/dailyCars.json"
IDS_TO_REMOVE = {2, 5, 10, 11, 12, 18, 22, 30}
START_DATE = datetime.date(2025, 12, 30)

def prune_and_resequence():
    if not os.path.exists(FILE_PATH):
        print("File not found.")
        return

    with open(FILE_PATH, 'r') as f:
        cars = json.load(f)

    original_count = len(cars)
    # Filter out cars by ID
    cars = [c for c in cars if c.get('id') not in IDS_TO_REMOVE]
    new_count = len(cars)
    
    print(f"Removed {original_count - new_count} cars. Remaining: {new_count}")

    # Resequence dates
    current_date = START_DATE
    for car in cars:
        car['date'] = current_date.strftime("%Y-%m-%d")
        current_date += datetime.timedelta(days=1)

    with open(FILE_PATH, 'w') as f:
        json.dump(cars, f, indent=4)
    
    print("Dates resequenced starting from 2025-12-30.")

if __name__ == "__main__":
    prune_and_resequence()
