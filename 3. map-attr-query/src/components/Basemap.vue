<template>
  <div id="map">
    <maptools />
    <layer-control />
    <attr-query />
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
import Maptools from "./Maptools";
import LayerControl from "./LayerControl";
import AttrQuery from "./AttrQuery";

import "ol/ol.css";
import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { get as getProjection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";
import Overlay from "ol/Overlay";
import { Fill, Stroke, Style } from "ol/style";

export default {
  name: "Basemap",
  components: {
    Maptools,
    LayerControl,
    AttrQuery,
  },
  mounted: function () {
    this._createBasemap(); //创建底图
  },
  methods: {
    /**
     * 创建底图
     */
    _createBasemap() {
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
      });

      const basemapLayer = new TileLayer({
        id: "ol-layer-basemap", //设置一个自定义id
        source: wmtsSource,
      });

      const map = new Map({
        target: "map",
        layers: [basemapLayer],
        view: new View({
          center: [12648502.186, 4129289.635],
          zoom: 11,
          maxZoom: 18, //切片最大为18级
        }),
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
          color: "rgba(255, 255, 255, 0.7)",
          width: 3,
        }),
        fill: new Fill({
          color: "rgba(255, 0, 0, 0.4)",
        }),
      });

      let selected = null;
      map.on("pointermove", function (e) {
        if (selected !== null) {
          selected.setStyle(undefined);
          selected = null;
        }

        map.forEachFeatureAtPixel(e.pixel, function (f) {
          selected = f;
          selectStyle.getStroke().setColor("#40ffff");
          selectStyle.getStroke().setWidth(4);
          selectStyle.getFill().setColor("rgba(255, 255, 0, 0.4)");
          f.setStyle(selectStyle);
          return true;
        });

        if (selected) {
          let contentText = "";
          for (let [k, v] of Object.entries(selected.getProperties())) {
            if (k !== "geometry") {
              contentText +=
                `${JSON.stringify(k)}: ${JSON.stringify(v)}` + "<br/>";
            }
          }
          content.innerHTML = contentText;
          overlay.setPosition(e.coordinate);
        }
      });

      this.$store.commit("_setDefaultMap", map);
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