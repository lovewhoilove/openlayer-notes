<template>
  <div class="map">
    <div class="top-view">
      <div id="top-left" class="map-item"></div>
      <div id="top-right" class="map-item"></div>
    </div>
    <div class="bottom-view">
      <div id="bottom-left" class="map-item"></div>
      <div id="bottom-right" class="map-item"></div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer } from "ol/layer";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";

const key = "y0GQ6A1urkfsjUaUPlAd";

export default {
  name: "Basemap",
  mounted: function () {
    this._initMap();
  },
  methods: {
    /**
     * 初始化地图
     */
    _initMap() {
      const view = new View({
        center: [12648502.186, 4129289.635],
        zoom: 11,
      });

      const mapTopLeft = new Map({
        target: "top-left",
        layers: [
          new TileLayer({
            source: new XYZ({
              url:
                "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=" +
                key,
              tileSize: 512,
            }),
          }),
        ],
        view: view,
      });

      const mapTopRight = new Map({
        target: "top-right",
        layers: [
          new TileLayer({
            source: new XYZ({
              url:
                "https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=" +
                key,
            }),
          }),
        ],
        view: view,
      });

      const mapBottomLeft = new Map({
        target: "bottom-left",
        layers: [
          new TileLayer({
            source: new XYZ({
              url:
                "https://api.maptiler.com/maps/outdoor/256/{z}/{x}/{y}.png?key=" +
                key,
            }),
          }),
        ],
        view: view,
      });

      const mapBottomRight = new Map({
        target: "bottom-right",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: view,
      });
    },
  },
};
</script>

<style>
.map {
  width: 100%;
  height: 100%;
}

.top-view {
  width: 100%;
  height: calc(50% - 2.5px);
  display: flex;
  justify-content: space-between;
  margin-bottom: 2.5px;
}

.bottom-view {
  position: absolute;
  width: 100%;
  height: calc(50% - 2.5px);
  display: flex;
  justify-content: space-between;
  margin-top: 2.5px;
}

.map-item {
  width: calc(50% - 2.5px);
  height: 100%;
  border: 1px solid #dcdfe6;
  box-sizing: border-box;
}

#top-left,
#bottom-left {
  margin-right: 2.5px;
}

#top-right,
#bottom-right {
  margin-left: 2.5px;
}
</style>