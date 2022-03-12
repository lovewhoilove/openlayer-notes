<template>
  <div id="map">
    <div id="swipe-control">
      <div id="swipe">
        <div class="handle"></div>
      </div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";
import Map from "ol/Map";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { get as getProjection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";

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
      });

      const basemapLayer = new TileLayer({
        source: wmtsSource,
      });

      const osmLayer = new TileLayer({
        source: new OSM(),
      });

      const map = new Map({
        target: "map",
        layers: [basemapLayer, osmLayer],
        view: new View({
          center: [12957469.15, 4861530.89],
          zoom: 10,
          maxZoom: 18, //切片最大为18级
        }),
      });

      const swipe = document.getElementById("swipe-control");
      const obj = {};
      //点击鼠标后使控件可以来回移动
      swipe.onmousedown = function (event) {
        const e = event || window.event;
        // 鼠标点击控件时相对于控件左侧边框的距离=点击时的位置相对于浏览器最左边的距离-控件左边框相对于浏览器最左边的距离
        obj.diffX = e.clientX - this.offsetLeft;
        document.onmousemove = function (event) {
          const e = event || window.event;
          let moveX = e.clientX - obj.diffX;
          if (moveX < 0) {
            moveX = 0;
          } else if (moveX > window.innerWidth - swipe.offsetWidth) {
            moveX = window.innerWidth - swipe.offsetWidth;
          }
          swipe.style.left = moveX + "px";
          //重新渲染图层
          map.render();
        };
        document.onmouseup = function () {
          this.onmousemove = null;
          this.onmouseup = null;
        };
      };

      osmLayer.on("prerender", function (event) {
        const ctx = event.context;
        //计算图层在canvas画布上需要显示的范围
        const mapSize = map.getSize();
        const height = event.context.canvas.height;
        const width = event.context.canvas.width;
        const swipeWidth = (swipe.offsetLeft * width) / mapSize[0];
        const tl = [swipeWidth, 0];
        const tr = [width, 0];
        const bl = [swipeWidth, height];
        const br = [width, height];

        ctx.save();
        //绘制裁剪路径
        ctx.beginPath();
        ctx.moveTo(tl[0], tl[1]);
        ctx.lineTo(bl[0], bl[1]);
        ctx.lineTo(br[0], br[1]);
        ctx.lineTo(tr[0], tr[1]);
        ctx.closePath();
        //裁剪，裁剪路径以外的部分不会绘制在canvas上下文中
        ctx.clip();
      });

      osmLayer.on("postrender", function (event) {
        const ctx = event.context;
        ctx.restore();
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

/* 卷帘分析控件样式----------------------------- */
#swipe-control {
  position: absolute;
  opacity: 0.8;
  width: 0.625rem;
  height: 100%;
  /* margin: 0 auto; */
  top: 0;
  left: 50%;
  background-color: rgba(50, 50, 50, 0.75);
  cursor: col-resize;
  z-index: 2;
}

#swipe-control:hover {
  opacity: 0.5;
}

#swipe {
  border: solid 0.5px #ffffff;
  height: 100%;
  width: 0px;
  margin: 0 auto;
}

#swipe .handle {
  width: 51px;
  height: 24px;
  margin-top: -12px;
  margin-left: -20px;
  top: 50%;
  left: 0;
  position: absolute;
  z-index: 30;
  font-family: "CalciteWebCoreIcons";
  font-size: 12px;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  text-indent: 0;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: black;
  color: white;
  opacity: 0.6;
}

*,
*:before,
*:after {
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}

.handle:before {
  margin: 0 18px 0 5px;
  content: "\0399\0399\0399";
  width: 20px;
  height: 24px;
  line-height: 2;
}

.handle:after {
  content: "\0399\0399\0399";
  width: 20px;
  height: 24px;
  line-height: 2;
}
</style>