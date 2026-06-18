import json

# ----------------------------
# MOCK RAW SATELLITE DATA
# (simulates NASA FIRMS fields)
# ----------------------------
def get_mock_raw_data():
    return [
        {
            "lat": 44.0582,   # Bend / Central Oregon
            "lon": -121.3153,
            "brightness": 360,
            "acq_date": "2026-06-17"
        },
        {
            "lat": 44.7749,   # Eastern Oregon (John Day area)
            "lon": -118.1869,
            "brightness": 310,
            "acq_date": "2026-06-16"
        },
        {
            "lat": 43.8041,   # Southern Oregon (Cottage Grove area)
            "lon": -123.0290,
            "brightness": 1000,
            "acq_date": "2026-06-15"
        }
    ]


# ----------------------------
# GIS CLASSIFICATION LOGIC
# ----------------------------
def classify_fire(brightness):
    if brightness >= 450:
        return "High"
    elif brightness >= 350:
        return "Medium"
    else:
        return "Low"


# ----------------------------
# CONVERT TO GEOJSON
# ----------------------------
def to_geojson(raw_data):
    features = []

    for row in raw_data:
        intensity = classify_fire(row["brightness"])

        features.append({
            "type": "Feature",
            "properties": {
                "brightness": row["brightness"],
                "date": row["acq_date"],
                "intensity": intensity
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


def main():
    raw = get_mock_raw_data()
    geojson = to_geojson(raw)
    save_geojson(geojson)

    print("GIS classification pipeline complete ✔")


if __name__ == "__main__":
    main()