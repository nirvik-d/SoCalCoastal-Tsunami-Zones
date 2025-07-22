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

const scene = document.querySelector("arcgis-scene");

const tsunamiHazardLayer = new FeatureLayer({
  url: "https://services2.arcgis.com/zr3KAIbsRSUyARHG/ArcGIS/rest/services/CA_Tsunami_Hazard_Area/FeatureServer",
  outFields: ["*"],
  definitionExpression:
    "County in ('Santa Barbara', 'Ventura', 'Los Angeles', 'Orange', 'San Diego', 'San Luis Obispo', 'Imperial')",
  elevationInfo: {
    mode: "relative-to-ground",
    offset: 10,
  },
});

scene?.addEventListener("arcgisViewReadyChange", async () => {
  const view = scene?.view;

  // Query the tsunami hazard layer for all zones
  const allZones = await tsunamiHazardLayer.queryFeatures();

  // Create graphics for evacuate zones
  const evacuateGraphicsLayer = new GraphicsLayer({
    title: "Evacuate Zones",
    id: "evacuate-zones",
  });

  const safeGraphicsLayer = new GraphicsLayer({
    title: "Safe Zones",
    id: "safe-zones",
  });

  // Create graphics for each zone
  allZones.features.forEach((zone) => {
    const zoneGraphic = new Graphic({
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

  // Handle zone selector changes
  // Set default selection to evacuate
  const zoneSelector: any = document.getElementById("zoneSelector");
  if (zoneSelector) {
    zoneSelector.value = "evacuate";
  }

  // Add event listener for zone selector changes
  zoneSelector?.addEventListener("calciteSelectChange", (event: any) => {
    const selectedZone = event?.target?.value;

    // Remove all layers first
    view?.map?.removeAll();

    // Add appropriate layer based on selection
    if (selectedZone === "evacuate") {
      view?.map?.add(evacuateGraphicsLayer);
    } else if (selectedZone === "safe") {
      view?.map?.add(safeGraphicsLayer);
    }
  });
});
