# SoCal Coastal Tsunami Zones in 3D

A web application that displays tsunami hazard zones for coastal Southern California cities using ArcGIS Maps SDK for JavaScript and Calcite UI components.

## Features

- Interactive map showing tsunami hazard zones (red) and safe zones (green) for coastal Southern California
- Toggle between viewing hazard zones and safe zones using a dropdown selector
- Click on any zone to view detailed information including:
  - Zone name
  - Evacuation status
  - County information
  - Links to additional resources (GIS, KMZ, Map)
- Automatic zoom to show all zones when switching between views
- Modern UI using Calcite components

## Prerequisites

- Node.js (v16 or higher)

## Setup

1. Create a new vite project:
```bash
npm create vite@latest
```
Follow the instructions on screen to initialize the project.

2. Navigate to the project directory and install the dependencies:
```bash
npm install
```

3. Install the dependencies for ArcGIS Maps SDK for JavaScript and Calcite UI components:

```bash
npm install @arcgis/map-components
```

## Screenshot

The main application

<img width="959" height="479" alt="image" src="https://github.com/user-attachments/assets/a55e6e70-0e1b-4949-a593-b8b28f8d0b13" />

## Project Structure

### HTML Structure

The HTML file sets up the basic structure for the ArcGIS web application:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SoCal Coastal Tsunami Zones</title>
  </head>
  <body>
    <arcgis-scene
      basemap="topo-3d"
      center="-117.9988, 33.6595"
      zoom="8"
      ground="world-elevation"
    >
      <arcgis-zoom position="top-left"></arcgis-zoom>

      <arcgis-expand position="top-left">
        <arcgis-basemap-gallery></arcgis-basemap-gallery>
      </arcgis-expand>

      <arcgis-placement position="top-right">
        <calcite-select id="zoneSelector">
          <calcite-option value="evacuate">Hazard Zones</calcite-option>
          <calcite-option value="safe">Safe Zones</calcite-option>
        </calcite-select>
      </arcgis-placement>
    </arcgis-scene>

    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

### CSS Structure

The CSS file styles the ArcGIS web application:

```css
/* style.css */
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

/* ArcGIS Map Components */
arcgis-scene {
  width: 100%;
  height: 100%;
}

/* Calcite Components */
calcite-select {
  width: 200px;
}
```

### Main TypeScript File (main.ts)

1. Import the necessary ArcGIS and Calcite components.

```typescript
import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-expand";
import "@arcgis/map-components/components/arcgis-basemap-gallery";
import "@arcgis/map-components/components/arcgis-placement";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
```

2. Initialize ArcGIS map components

```typescript
const scene = document.querySelector("arcgis-scene");
```

3. Create feature layer for tsunami hazard zones.

```typescript
const tsunamiHazardLayer = new FeatureLayer({
  url: "https://services2.arcgis.com/zr3KAIbsRSUyARHG/ArcGIS/rest/services/CA_Tsunami_Hazard_Area/FeatureServer",
  outFields: ["*"],
  definitionExpression: "County in ('Santa Barbara', 'Ventura', 'Los Angeles', 'Orange', 'San Diego', 'San Luis Obispo', 'Imperial')",
  elevationInfo: {
    mode: "relative-to-ground",
    offset: 10,
  },
});
```

4. Create graphics layers for hazard and safe zones.

```typescript
const hazardGraphicsLayer = new GraphicsLayer({
  title: "Hazard Zones",
  id: "hazard-zones"
});

const safeGraphicsLayer = new GraphicsLayer({
  title: "Safe Zones",
  id: "safe-zones"
});
```

5. Query and display tsunami hazard zones.

```typescript
async function displayZones() {
  try {
    const allZones = await tsunamiHazardLayer.queryFeatures();
    allZones.features.forEach(zone => {
      const zoneGraphic = new Graphic({
        geometry: zone.geometry,
        symbol: new SimpleFillSymbol({
          color: zone.attributes.Evacuate === "Yes, Tsunami Hazard Area" ? [255, 0, 0, 0.5] : [0, 255, 0, 0.3],
          outline: {
            color: zone.attributes.Evacuate === "Yes, Tsunami Hazard Area" ? [255, 0, 0] : [0, 255, 0],
            width: 2
          }
        }),
        attributes: {
          name: zone.attributes.Label,
          evacuate: zone.attributes.Evacuate,
          county: zone.attributes.County,
          gisLink: zone.attributes.GIS_Link,
          kmzLink: zone.attributes.KMZ_Link,
          mapLink: zone.attributes.Map_Link
        },
        popupTemplate: {
          title: "Tsunami Zone",
          content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "name",
                  label: "Zone Name"
                },
                {
                  fieldName: "evacuate",
                  label: "Evacuate Area"
                },
                {
                  fieldName: "county",
                  label: "County"
                }
              ]
            },
            {
              type: "text",
              text: "Links:"
            },
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "gisLink",
                  label: "GIS Link"
                },
                {
                  fieldName: "kmzLink",
                  label: "KMZ Link"
                },
                {
                  fieldName: "mapLink",
                  label: "Map Link"
                }
              ]
            }
          ]
        }
      });

      // Add to appropriate layer based on zone type
      if (zone.attributes.Evacuate === "Yes, Tsunami Hazard Area") {
        hazardGraphicsLayer.add(zoneGraphic);
      } else {
        safeGraphicsLayer.add(zoneGraphic);
      }
    });

    // Add hazard zones layer to map by default
    view?.map?.add(hazardGraphicsLayer);

    // Handle zone selector changes
    const zoneSelector = document.getElementById("zoneSelector");
    if (zoneSelector) {
      zoneSelector.value = "evacuate";
      zoneSelector.addEventListener("calciteSelectChange", (event: any) => {
        const selectedZone = event.target.value;
        view?.map?.removeAll();
        if (selectedZone === "evacuate") {
          view?.map?.add(hazardGraphicsLayer);
        } else if (selectedZone === "safe") {
          view?.map?.add(safeGraphicsLayer);
        }
      });
    }
  } catch (error) {
    console.error("Error displaying zones:", error);
  }
}
```

## Run the application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

## Building the application

1. Build the application:
```bash
npm run build
```

