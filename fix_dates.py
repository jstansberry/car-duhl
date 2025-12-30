import json
import datetime
import os

FILE_PATH = "src/data/dailyCars.json"
START_DATE = datetime.date(2025, 12, 30)

def fix_dates():
    if not os.path.exists(FILE_PATH):
        print("File not found.")
        return

    with open(FILE_PATH, 'r') as f:
        cars = json.load(f)

    print(f"Found {len(cars)} cars. Reordering dates starting from {START_DATE}...")

    current_date = START_DATE
    for car in cars:
        car['date'] = current_date.strftime("%Y-%m-%d")
        current_date += datetime.timedelta(days=1)

    with open(FILE_PATH, 'w') as f:
        json.dump(cars, f, indent=4)
    
    print("Dates updated successfully.")

if __name__ == "__main__":
    fix_dates()
