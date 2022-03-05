<template>
  <div id="map">
    <maptools />
    <layer-control />
    <space-query />
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import Maptools from "./Maptools";
import LayerControl from "./LayerControl";
import SpaceQuery from "./SpaceQuery.vue";

import "ol/ol.css";
import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { get as getProjection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";

export default {
  name: "Basemap",
  components: {
    Maptools,
    LayerControl,
    SpaceQuery,
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
</style>