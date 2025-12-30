import json
import os

FILE_PATH = "src/data/dailyCars.json"

def add_ids():
    if not os.path.exists(FILE_PATH):
        print("File not found.")
        return

    with open(FILE_PATH, 'r') as f:
        cars = json.load(f)

    print(f"Found {len(cars)} cars. Adding sequential IDs...")

    for index, car in enumerate(cars):
        # Assign ID based on 1-based index
        # We want 'id' to be the first key for readability
        new_car = {'id': index + 1}
        # Copy existing keys
        for k, v in car.items():
            if k != 'id': # Prevent duplicate if re-running
                new_car[k] = v
        
        cars[index] = new_car

    with open(FILE_PATH, 'w') as f:
        json.dump(cars, f, indent=4)
        
    print("IDs added successfully.")

if __name__ == "__main__":
    add_ids()
