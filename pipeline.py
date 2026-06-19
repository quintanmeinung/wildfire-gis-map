from dotenv import load_dotenv
import json
import os
import requests

load_dotenv()

API_KEY = os.getenv("FIRMS_API_KEY")

if not API_KEY:
    raise Exception("FIRMS_API_KEY is not set in environment variables")

# Oregon bounding box
BOUNDING_BOX = "-124.8,42.0,-116.3,46.3"

URL = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{API_KEY}/VIIRS_SNPP_NRT/{BOUNDING_BOX}/2"


# ----------------------------
# CLASSIFICATION LOGIC
# ----------------------------
def classify_fire(brightness):
    if brightness >= 450:
        return "High"
    elif brightness >= 350:
        return "Medium"
    else:
        return "Low"


# ----------------------------
# FETCH FIRMS DATA (REAL)
# ----------------------------
def fetch_firms_data():
    print("Fetching FIRMS data...")

    response = requests.get(URL)

    if response.status_code != 200:
        raise Exception(f"FIRMS request failed: {response.status_code}")

    lines = response.text.strip().split("\n")
    headers = lines[0].split(",")

    data = []

    for line in lines[1:]:
        values = line.split(",")
        row = dict(zip(headers, values))

        try:
            data.append({
                "lat": float(row["latitude"]),
                "lon": float(row["longitude"]),
                "brightness": float(row["bright_ti4"]),
                "acq_date": row["acq_date"]
            })
        except:
            continue

    print(f"Loaded {len(data)} fire points")
    return data


# ----------------------------
# CONVERT TO GEOJSON
# ----------------------------
def to_geojson(raw_data):
    features = []

    for row in raw_data:
        features.append({
            "type": "Feature",
            "properties": {
                "brightness": row["brightness"],
                "date": row["acq_date"],
                "intensity": classify_fire(row["brightness"])
            },
            "geometry": {
                "type": "Point",
                "coordinates": [row["lon"], row["lat"]]
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }


# ----------------------------
# SAVE OUTPUT
# ----------------------------
def save_geojson(data):
    with open("data/fires.geojson", "w") as f:
        json.dump(data, f)


# ----------------------------
# MAIN
# ----------------------------
def main():
    raw = fetch_firms_data()
    geojson = to_geojson(raw)
    save_geojson(geojson)

    print("Pipeline complete ✔")


if __name__ == "__main__":
    main()
    print("KEY LOADED:", API_KEY is not None)