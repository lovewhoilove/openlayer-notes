<template>
  <div id="map"></div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";
import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { get as getProjection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";
import {
  OverviewMap,
  ScaleLine,
  FullScreen,
  ZoomSlider,
  defaults as defaultControls,
} from "ol/control";
import {
  DragRotateAndZoom,
  defaults as defaultInteractions,
} from "ol/interaction";

export default {
  name: "Basemap",
  components: {},
  data() {
    return {
      enabledRead: false,
    };
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
        source: wmtsSource,
      });

      // 地图控件
      const mapControls = defaultControls().extend([
        // 鹰眼控件
        new OverviewMap({
          className: "ol-overviewmap ol-custom-overviewmap", //用于给鹰眼自定义样式使用的class
          layers: [
            new TileLayer({
              source: wmtsSource, //这里用的应该和底图所用数据源一致
            }),
          ],
          collapseLabel: "\u00BB", //折叠后的图标
          label: "\u00AB", //正常展开状态下的图标
          collapsed: false, //是否折叠
        }),
        //全屏控件
        new FullScreen({
          //source要全屏显示的元素(属性值为元素id),若未提供，则包含地图视口的元素将全屏显示
          source: "map",
        }),
        //比例尺控件
        new ScaleLine(),
        // 滑块缩放控件
        new ZoomSlider(),
      ]);

      const map = new Map({
        controls: mapControls,
        //按住Shift键并拖动以围绕地图中心旋转和缩放地图
        interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
        target: "map",
        layers: [basemapLayer],
        view: new View({
          center: [12648502.186, 4129289.635],
          zoom: 11,
          maxZoom: 18, //切片最大为18级
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

/* 鹰眼的自定义样式-------------------------------------------- */
#map .ol-overviewmap {
  border: 1px solid grey;
}

#map .ol-custom-overviewmap,
#map .ol-custom-overviewmap.ol-uncollapsible {
  top: auto;
  left: auto;
  right: 6px;
  bottom: 6px;
  box-shadow: 5px 5px 3px grey;
}

#map .ol-custom-overviewmap:not(.ol-collapsed) {
  border: 1px solid grey;
}

#map .ol-custom-overviewmap .ol-overviewmap-map {
  border: none;
  width: 300px;
}

#map .ol-custom-overviewmap .ol-overviewmap-box {
  border: 2px solid red;
}

#map .ol-custom-overviewmap:not(.ol-collapsed) button {
  top: auto;
  left: auto;
  right: 1px;
  bottom: 1px;
}

/* 比例尺自定义样式 --------------------------------------------*/
#map .ol-scale-line {
  padding: 3px;
  background: rgba(0, 60, 136, 0.6) !important;
  box-shadow: 5px 5px 3px grey;
  border: 1px solid grey;
}

/* 旋转控件自定义样式-------------------------------------------*/
#map .ol-rotate {
  top: 3em;
  border: 1px solid grey;
  box-shadow: 5px 5px 3px grey;
}

/* 缩放控件（含缩放滑块）自定义样式-------------------------------*/
.ol-zoom {
  border: 1px solid grey;
  box-shadow: 5px 5px 3px grey;
}

#map .ol-zoom .ol-zoom-out {
  margin-top: 200px;
}

#map .ol-zoomslider {
  background-color: transparent;
  /*
        Zoom control top: 0.5em
        Zoom control padding: 2px
        Zoom in button margin top: 1px
        Zoom in button height: font size 1.14em * 1.375 height
        */
  top: calc(0.5em + 2px + 1px + 1.14 * 1.375em);
}

#map .ol-touch .ol-zoom .ol-zoom-out {
  margin-top: 212px;
}

#map .ol-touch .ol-zoomslider {
  top: 2.75em;
}

#map .ol-zoom-in.ol-has-tooltip:hover [role="tooltip"],
#map .ol-zoom-in.ol-has-tooltip:focus [role="tooltip"] {
  top: 3px;
}

#map .ol-zoom-out.ol-has-tooltip:hover [role="tooltip"],
#map .ol-zoom-out.ol-has-tooltip:focus [role="tooltip"] {
  top: 232px;
}

/* 全屏控件自定义样式-------------------------------------------*/
#map .ol-full-screen {
  border: 1px solid grey;
  box-shadow: 5px 5px 3px grey;
}
</style>