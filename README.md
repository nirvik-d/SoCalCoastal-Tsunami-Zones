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
@import "https://js.arcgis.com/calcite-components/3.2.1/calcite.css";
@import "https://js.arcgis.com/4.33/@arcgis/core/assets/esri/themes/light/main.css";
@import "https://js.arcgis.com/4.33/map-components/main.css";

html,
body {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
}

#zoneSelector {
  border-radius: 5px;
}
```

### Main TypeScript File (main.ts)

1. **Import the required modules.**

```typescript
import "./style.css";

import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-expand";
import "@arcgis/map-components/components/arcgis-basemap-gallery";
import "@arcgis/map-components/components/arcgis-placement";

import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-switch";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-select";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import { SimpleFillSymbol } from "@arcgis/core/symbols";
import type SceneView from "@arcgis/core/views/SceneView";
```

2. **Create feature layer for tsunami hazard zones**

```typescript
const tsunamiHazardLayer: FeatureLayer | null = new FeatureLayer({
  url: "https://services2.arcgis.com/zr3KAIbsRSUyARHG/ArcGIS/rest/services/CA_Tsunami_Hazard_Area/FeatureServer",
  outFields: ["*"],
  definitionExpression:
    "County in ('Santa Barbara', 'Ventura', 'Los Angeles', 'Orange', 'San Diego', 'San Luis Obispo', 'Imperial')",
  elevationInfo: {
    mode: "relative-to-ground",
    offset: 10,
  },
});
```

3. **Get the scene element, wait for it to be ready, query the features and create graphics layers**

```typescript
const scene: HTMLArcgisSceneElement | null = document.querySelector("arcgis-scene");
if (!scene) {
  throw new Error("Scene element not found");
}

await scene.viewOnReady();

const view: SceneView | null = scene?.view;

// Query the tsunami hazard layer for all zones
const allZones: __esri.FeatureSet = await tsunamiHazardLayer?.queryFeatures();

// Create graphics for evacuate zones
const evacuateGraphicsLayer: GraphicsLayer | null = new GraphicsLayer({
  title: "Evacuate Zones",
  id: "evacuate-zones",
});

const safeGraphicsLayer: GraphicsLayer | null = new GraphicsLayer({
  title: "Safe Zones",
  id: "safe-zones",
});
```

4. **Query and display tsunami hazard zones**

```typescript
allZones.features.forEach((zone) => {
  const zoneGraphic: Graphic | null = new Graphic({
    geometry: zone.geometry,
    symbol: new SimpleFillSymbol({
      color:
        zone.attributes.Evacuate === "Yes, Tsunami Hazard Area"
          ? [255, 0, 0, 0.5]
          : [0, 255, 0, 0.3], // Red for evacuate, green for safe
      outline: {
        color:
          zone.attributes.Evacuate === "Yes, Tsunami Hazard Area"
            ? [255, 0, 0]
            : [0, 255, 0], // Red outline for evacuate, green for safe
        width: 2,
      },
    }),
    attributes: {
      name: zone.attributes.Label,
      evacuate: zone.attributes.Evacuate,
      county: zone.attributes.County,
      gisLink: zone.attributes.GIS_Link,
      kmzLink: zone.attributes.KMZ_Link,
      mapLink: zone.attributes.Map_Link,
    },
    popupTemplate: {
      title: "Tsunami Zone",
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "evacuate",
              label: "Evacuate Area",
              format: {
                type: "text",
                digitSeparator: false,
              },
            },
            {
              fieldName: "county",
              label: "County",
            },
          ],
        },
        {
          type: "text",
          text: "Links:",
        },
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "gisLink",
              label: "GIS Link",
              format: {
                type: "text",
                digitSeparator: false,
              },
            },
            {
              fieldName: "kmzLink",
              label: "KMZ Link",
              format: {
                type: "text",
                digitSeparator: false,
              },
            },
            {
              fieldName: "mapLink",
              label: "Map Link",
              format: {
                type: "text",
                digitSeparator: false,
              },
            },
          ],
        },
      ],
    },
  });

  // Add to appropriate layer based on zone type
  if (zone.attributes.Evacuate === "Yes, Tsunami Hazard Area") {
    evacuateGraphicsLayer.add(zoneGraphic);
  } else {
    safeGraphicsLayer.add(zoneGraphic);
  }
});

// Add only the evacuate layer initially
view?.map?.add(evacuateGraphicsLayer);
```

5. **Add event listener for zone selector changes**

```typescript
// Handle zone selector changes
// Set default selection to evacuate
const zoneSelector: HTMLSelectElement | null = document.querySelector("#zoneSelector");
if (zoneSelector) {
  zoneSelector.value = "evacuate";
}

// Add event listener for zone selector changes
zoneSelector?.addEventListener("calciteSelectChange", (event: Event) => {
  const selectedZone = (event?.target as HTMLSelectElement)?.value;

  // Remove all layers first
  view?.map?.removeAll();

  if (selectedZone === "evacuate") {
    view?.map?.add(evacuateGraphicsLayer);
  } else if (selectedZone === "safe") {
    view?.map?.add(safeGraphicsLayer);
  }
});
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

