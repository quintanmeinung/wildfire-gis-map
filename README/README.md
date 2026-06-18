# Wildfire GIS Web Mapping Project

## Overview
This project is a lightweight GIS web application that visualizes wildfire data using Leaflet.js and a Python-based geospatial data pipeline.

The system simulates a real-world GIS workflow:

**Python ETL Pipeline → GeoJSON → Web GIS Visualization**

---

## Features

- Interactive wildfire map using Leaflet.js
- Spatial visualization of fire detections across Oregon
- Fire intensity classification (High / Medium / Low)
- Proportional symbol sizing based on brightness
- GIS-style legend for map interpretation
- Python-based data pipeline generating GeoJSON output

---

## Tech Stack

- HTML / CSS / JavaScript
- Leaflet.js
- Python (data processing / ETL simulation)
- GeoJSON (spatial data format)

---

## Current Pipeline (Phase 2)

Python script processes wildfire data and outputs:
This file is consumed directly by the Leaflet web map. (fires.geojson)

---

## Future Work

- Integration with NASA FIRMS satellite API
- Time-based wildfire filtering (last 24h / 7 days)
- Improved spatial QA/QC filtering
- Automated data refresh pipeline
