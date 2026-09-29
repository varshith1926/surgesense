import requests

API_KEY = "2624926073eec6274f7f2d8138c548a525cf21e4b6afd3318bacf7d8165106e1"

def get_route_info(start, end):
    url = "https://serpapi.com/search.json"

    params = {
        "engine": "google_maps_directions",
        "start_addr": start,
        "end_addr": end,
        "hl": "en",
        "api_key": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "directions" in data:
        route = data["directions"][0]

        print("\n--- ROUTE INFO ---")
        print("Distance:", route.get("formatted_distance"))
        print("Duration:", route.get("formatted_duration"))
        print("Typical Duration Range:", route.get("typical_duration_range"))
        print("Via:", route.get("via"))

        print("\nExtensions:")
        for ext in route.get("extensions", []):
            print("-", ext)

    else:
        print("Error / No route found")
        print(data)

pickup = input("Enter pickup: ")
drop = input("Enter drop: ")

get_route_info(pickup, drop)