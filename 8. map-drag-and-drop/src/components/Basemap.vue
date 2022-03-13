<template>
  <div id="map">
    <!-- 弹出框 -->
    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-content"></div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { get as getProjection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";

import { DragAndDrop, defaults as defaultInteractions } from "ol/interaction";
import { GPX, GeoJSON, IGC, KML, TopoJSON } from "ol/format";
import { Fill, Stroke, Style } from "ol/style";
import Overlay from "ol/Overlay";

export default {
  name: "Basemap",
  mounted: function () {
    this._initMap();
  },
  methods: {
    _initMap() {
      const projection = getProjection("EPSG:3857");
      const projectionExtent = projection.getExtent();

      const size = getWidth(projectionExtent) / 256;
      const matrixIds = new Array(19);
      const resolutions = new Array(19);

      for (let i = 0; i < 19; i++) {
        resolutions[i] = size / Math.pow(2, i);
        matrixIds[i] = "EPSG:3857_world:" + i;
      }

      const tileGrid = new WMTSTileGrid({
        origin: getTopLeft(projectionExtent),
        resolutions: resolutions,
        matrixIds: matrixIds,
      });

      const wmtsSource = new WMTS({
        url: "http://localhost:8080/geowebcache/service/wmts",
        layer: "world",
        matrixSet: "EPSG:3857_world",
        format: "image/png",
        projection: projection,
        tileGrid: tileGrid,
        wrapX: true,
      });

      const basemapLayer = new TileLayer({
        source: wmtsSource,
      });

      const dragAndDropInteraction = new DragAndDrop({
        formatConstructors: [GPX, GeoJSON, IGC, KML, TopoJSON],
      });

      //初始化地图
      const map = new Map({
        target: "map",
        interactions: defaultInteractions().extend([dragAndDropInteraction]),
        layers: [basemapLayer],
        view: new View({
          center: [12957469.15, 4861530.89],
          zoom: 4,
          maxZoom: 18,
        }),
      });

      //拖放功能的实现
      const style = new Style({
        stroke: new Stroke({
          color: "rgba(255, 255, 0, 0.4)",
          lineDash: [4],
          width: 2,
        }),
        fill: new Fill({
          color: "rgba(255, 0, 0, 0.2)",
        }),
      });

      dragAndDropInteraction.on("addfeatures", function (event) {
        const vectorSource = new VectorSource({
          features: event.features,
        });
        map.addLayer(
          new VectorLayer({
            source: vectorSource,
            style: style,
          })
        );
        map.getView().fit(vectorSource.getExtent());
      });

      //配置弹窗
      const container = document.getElementById("popup");
      const content = document.getElementById("popup-content");
      const closer = document.getElementById("popup-closer");

      const overlay = new Overlay({
        element: container,
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      });

      map.addOverlay(overlay);

      closer.onclick = function () {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
      };

      const selectStyle = new Style({
        stroke: new Stroke({
          color: "#40ffff",
          width: 2,
        }),
        fill: new Fill({
          color: "rgba(255, 255, 0, 0.4)",
        }),
      });

      let selected = null;
      map.on("pointermove", function (e) {
        if (selected !== null) {
          selected.setStyle(undefined);
          selected = null;
        }

        map.forEachFeatureAtPixel(e.pixel, function (f) {
          f.setStyle(selectStyle);
          selected = f;
          return true;
        });

        if (selected) {
          let contentText = "";
          for (let [k, v] of Object.entries(selected.getProperties())) {
            if (k !== "geometry" && k !== "level") {
              contentText +=
                `${JSON.stringify(k)}: ${JSON.stringify(v)}` + "<br/>";
            }
          }
          content.innerHTML = contentText;
          overlay.setPosition(e.coordinate);
        }
      });
    },
  },
};
</script>

<style>
#map {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
}

/* 弹出框样式-------------------------------------------------- */
.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 5px 5px 3px grey;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid grey;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
  width: auto;
  opacity: 0.8;
}

.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}

.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}

.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
  transition: 0.5s;
}

.ol-popup-closer:after {
  content: "✖";
  color: grey;
}

.ol-popup-closer:hover {
  transform: rotate(360deg);
}

#popup-content {
  font-size: 8px;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
  max-width: 500px;
}
</style>