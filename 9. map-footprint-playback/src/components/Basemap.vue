<template>
  <div id="map">
    <el-button id="playback" type="primary" plain @click="playback" size="small"
      >足迹点回放</el-button
    >
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
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { easeOut } from "ol/easing";
import { fromLonLat } from "ol/proj";
import { getVectorContext } from "ol/render";
import { unByKey } from "ol/Observable";
import { Circle as CircleStyle, Stroke, Style, Fill, Text } from "ol/style";
import { boundingExtent, buffer, getSize } from "ol/extent";

let basemapLayer;

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

      basemapLayer = new TileLayer({
        source: wmtsSource,
      });

      //初始化地图
      const map = new Map({
        target: "map",
        layers: [basemapLayer],
        view: new View({
          center: [12648502.186, 4129289.635],
          zoom: 11,
          maxZoom: 18,
        }),
      });

      this.$store.commit("_setDefaultMap", map);
    },
    /**
     * 足迹点回放
     */
    playback() {
      const _self = this;
      const map = _self.$store.getters._getDefaultMap;

      const source = new VectorSource({
        wrapX: false,
      });

      const vector = new VectorLayer({
        source: source,
        style: function (f) {
          const text = f.get("time").toString(); //获取feature的time属性值
          const style = _self.ceratePointStyle(text);
          return [style];
        },
      });

      map.addLayer(vector);

      source.on("addfeature", function (e) {
        flash(e.feature);
      });

      addFootprintFeature();

      /**
       * 读取数据并按照一定的时间间隔将数据添加至source中
       */
      async function addFootprintFeature() {
        //从本地文件读取数据
        const data = await fetch("demo.json").then(function (response) {
          return response.json();
        });

        let coors = [];
        let times = [];
        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
          for (let j = 0; j < data[keys[i]].length; j++) {
            const footprint = data[keys[i]][j];
            let lon = footprint["lon"];
            let lat = footprint["lat"];
            let clockInTime = footprint["clockInTime"];
            coors.push(fromLonLat([lon, lat]));
            times.push(clockInTime);
          }
        }

        //将视图缩放至包含所有坐标的范围内
        const extent = boundingExtent(coors);
        const extentSize = getSize(extent);
        //以extent的宽高平均值的*0.1，创建一个缓冲区范围
        const extentBuffer = ((extentSize[0] + extentSize[1]) / 2) * 0.1;
        map.getView().fit(buffer(extent, extentBuffer), { duration: 500 });

        for (let i = 0; i < coors.length; i++) {
          //每次循环间隔1秒
          (function () {
            const timeOut = setTimeout(function () {
              if (coors[i].length > 0) {
                const geom = new Point(coors[i]);
                const feature = new Feature(geom);
                const formatTime = new Date(times[i]).toLocaleTimeString(
                  "zh-CN",
                  { hour12: false }
                );
                feature.set("time", formatTime); //为feature设置一个time属性，并赋值上报时间
                source.addFeature(feature);
              } else {
                if (i >= coors.length - 1) {
                  clearTimeout(timeOut);
                }
              }
            }, i * 1000);
          })(i);
        }
      }

      /**
       * 闪烁的动画效果
       */
      function flash(feature) {
        const duration = 3000;
        const start = Date.now();
        const flashGeom = feature.getGeometry().clone();
        const listenerKey = basemapLayer.on("postrender", animate);

        function animate(event) {
          const frameState = event.frameState;
          const elapsed = frameState.time - start;
          if (elapsed >= duration) {
            unByKey(listenerKey);
            return;
          }
          const vectorContext = getVectorContext(event);
          const elapsedRatio = elapsed / duration;
          // 开始时半径为5，结束时半径为30
          const radius = easeOut(elapsedRatio) * 30 + 5;
          const opacity = easeOut(1 - elapsedRatio);

          const style = new Style({
            image: new CircleStyle({
              radius: radius,
              stroke: new Stroke({
                color: "rgba(255, 0, 0, " + opacity + ")",
                width: 0.25 + opacity,
              }),
            }),
          });

          vectorContext.setStyle(style);
          vectorContext.drawGeometry(flashGeom);
          // 当map被重新渲染时会继续触发上述postrender事件
          map.render();
        }
      }
    },
    /**
     * 创建点的样式
     */
    ceratePointStyle(text) {
      return new Style({
        image: new CircleStyle({
          stroke: new Stroke({
            color: "rgba(255, 0, 0, 0.4)",
            width: 2,
          }),
          radius: 3,
          fill: new Fill({
            color: "rgba(255, 255, 0, 0.4)",
          }),
        }),
        text: new Text({
          font: "14px sans-serif",
          text: text,
          fill: new Fill({ color: "blue" }),
          stroke: new Stroke({
            color: "rgba(255, 255, 255, 0.8)",
            width: 3,
          }),
          offsetX: 0,
          offsetY: -10,
        }),
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

#playback {
  position: absolute;
  top: 80px;
  right: 80px;
  box-shadow: 5px 5px 3px grey;
  z-index: 2;
}
</style>