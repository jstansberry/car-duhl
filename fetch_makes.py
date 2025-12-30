import urllib.request
import json
import urllib.parse

base_url = "https://cardle-strapi-api-0030dbf64eee.herokuapp.com/api/makes/"
params = {
    "fields[0]": "id",
    "fields[1]": "make",
    "sort[1]": "make",
    "pagination[limit]": "200"
}

query_string = urllib.parse.urlencode(params)
url = f"{base_url}?{query_string}"

try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        with open('makes.json', 'w') as f:
            json.dump(data, f, indent=2)
    print("Successfully fetched makes.json")
except Exception as e:
    print(f"Error fetching data: {e}")
