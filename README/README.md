
# Wildfire GIS Monitoring System

A lightweight GIS web application that visualizes real-time wildfire detections using NASA FIRMS satellite data.  
The project demonstrates a full geospatial data pipeline from API ingestion to web-based map visualization.

---

## Project Overview

This system simulates a real-world wildfire monitoring workflow used in environmental GIS applications:

**NASA FIRMS Satellite Data → Python ETL Pipeline → GeoJSON → Leaflet Web Map**

It processes near real-time fire detection data and visualizes it interactively on a web map with severity classification and proportional symbology.

---

## System Architecture

NASA FIRMS API
↓
Python ETL Pipeline (requests + data parsing)
↓
Data Cleaning & Classification
↓
GeoJSON Output (fires.geojson)
↓
Leaflet.js Web Map Visualization

---

## Data Source

- NASA FIRMS (Fire Information for Resource Management System)
- VIIRS satellite fire detection data
- Bounding box-based spatial queries (Oregon region focus)

---

## Features

### GIS Visualization
- Interactive Leaflet map
- Fire detection points plotted using latitude/longitude
- Proportional symbol mapping based on fire brightness

### Fire Classification
- High / Medium / Low severity classification
- Color-coded symbology:
  - 🔴 High
  - 🟠 Medium
  - 🟡 Low

### Python ETL Pipeline
- Real-time API ingestion from NASA FIRMS
- Data parsing and validation
- GeoJSON transformation for web consumption

### Secure Configuration
- Environment variable-based API key management (`.env`)
- No sensitive data stored in source code

---

## Tech Stack

- Python (ETL + API processing)
- JavaScript (Leaflet.js mapping)
- HTML / CSS
- GeoJSON (spatial data format)
- NASA FIRMS API

---

## Example Workflow

Fetch FIRMS satellite fire data (CSV API)
Parse and clean dataset in Python
Classify fire intensity based on brightness
Convert to GeoJSON FeatureCollection
Render on interactive Leaflet map

---

## Project Structure


wildfire-map/
│
├── index.html
├── app.js
├── style.css
├── pipeline.py
├── data/
│ └── fires.geojson
├── .env
├── .gitignore
└── README.md


---

## How to Run

### 1. Install dependencies
    ```bash
    pip install requests python-dotenv

# 2. Set up environment variable
# Create a .env file:
    FIRMS_API_KEY=your_api_key_here

#3. Run pipeline
    python pipeline.py
    
#4. Open map
#Open index.html in a browser.