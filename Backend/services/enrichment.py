from datetime import datetime
import requests
from geopy.geocoders import Nominatim


TOMTOM_API_KEY = "qJ2Y5ZRagTCqP0A7OSxOaEGOBfwQ6p7b"
ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFjNzRhNzIxY2IxNTQzZmRiMWI2OGI1NmUxZTQ1ZjZlIiwiaCI6Im11cm11cjY0In0="
def geocode_location(location):
    geolocator = Nominatim(user_agent="surge_app")
    loc = geolocator.geocode(f"{location}, India")

    print("Searching:", location)
    print("Found:", loc)

    if loc:
        return {
            "lat": loc.latitude,
            "lon": loc.longitude,
            "address": loc.address
        }
    return None
API_KEY = "49d4d9f96f659d45a4de5675e05d3e71"
def get_weather(city):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}"
    response = requests.get(url) 
    if response.status_code == 200:
        data = response.json()
        weather_main = data["weather"][0]["main"] 
        mapping = {"Clear": "Sunny",
                    "Clouds": "Cloudy",
                    "Rain": "Rainy",
                    "Drizzle": "Rainy",
                    "Thunderstorm": "Rainy",
                    "Mist": "Foggy",
                    "Fog": "Foggy",
                    "Haze": "Foggy", 
                    "Smoke": "Foggy" } 
        return mapping.get(weather_main, "Cloudy") 
    return "Clear"

def get_city_serp(location):
    url = "https://serpapi.com/search.json"

    params = {
        "engine": "google_maps",
        "q": location,
        "type": "search",
        "api_key": "2624926073eec6274f7f2d8138c548a525cf21e4b6afd3318bacf7d8165106e1"
    }

    response = requests.get(url, params=params)
    data = response.json()

    try:
        address = data["local_results"][0]["address"]

        parts = address.split(",")

        # usually city is second-last or third-last
        for part in parts:
            part = part.strip()
            if part.lower() not in ["india"]:
                city = part

        return city

    except:
        return "Hyderabad"


def get_distance_and_traffic_serp(pickup, drop):
    url = "https://serpapi.com/search.json"

    params = {
        "engine": "google_maps_directions",
        "start_addr": pickup,
        "end_addr": drop,
        "hl": "en",
        "api_key": "2624926073eec6274f7f2d8138c548a525cf21e4b6afd3318bacf7d8165106e1"
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "directions" not in data:
        return 0.0, 0.0

    route = data["directions"][0]

    # -------- Distance --------
    distance_text = route.get("formatted_distance", "0 km")
    distance_km = float(distance_text.split()[0])

    # -------- Duration --------
    duration_text = route.get("formatted_duration", "0 min")
    current = int(duration_text.split()[0])

    # -------- Traffic --------
    range_text = route.get("typical_duration_range", "0–0 min")

    try:
        min_t = int(range_text.split("–")[0])
        max_t = int(range_text.split("–")[1].split()[0])

        traffic_delay = current - min_t

    except:
        traffic_delay = 0

    return round(distance_km, 2), max(0, traffic_delay)

def estimate_demand_and_drivers(hour, weather, traffic, event):
    demand = 0.5
    drivers = 0.5

    if 8 <= hour <= 10 or 17 <= hour <= 21:
        demand += 0.2
        drivers -= 0.1

    if 22 <= hour or hour <= 5:
        demand += 0.1
        drivers -= 0.15

    if weather == "Rainy":
        demand += 0.2
        drivers -= 0.1

    if traffic > 2:
        demand += 0.1
        drivers -= 0.05

    if event.lower() != "none":
        demand += 0.15
        drivers -= 0.05

    demand = max(0, min(100, demand))
    drivers = max(0, min(100, drivers))

    return drivers, demand

def enrich_input(data):
    payload = data.dict()

    pickup_geo = geocode_location(payload["Pickup_Location"])
    drop_geo = geocode_location(payload["Drop_Location"])

    city = get_city_serp(payload["Pickup_Location"])
    weather = get_weather(city)

    distance, traffic = get_distance_and_traffic_serp(
    payload["Pickup_Location"],
    payload["Drop_Location"]
    )
    drivers, demand = estimate_demand_and_drivers(
    datetime.now().hour,
    weather,
    traffic,
    payload["Event"]
    )


    payload["City"] = city
    payload["Weather"] = weather
    payload["Ride_Distance_KM"] = distance
    payload["Traffic_Delay"] = traffic
    payload["Day_of_Week"] = datetime.now().weekday()
    payload["Hour_of_Day"] = datetime.now().hour
    payload["Available_Drivers"] = drivers
    payload["Demand_Level"] = demand

    del payload["Pickup_Location"]
    del payload["Drop_Location"]

    return payload