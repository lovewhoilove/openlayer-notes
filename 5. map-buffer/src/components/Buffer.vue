<template>
  <el-button
    size="small"
    id="draw-buffer"
    type="primary"
    plain
    @click="drawBuffer"
    >绘制缓冲区</el-button
  >
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";
import { Fill, Stroke, Style, Text } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { GeoJSON, WFS } from "ol/format";

import EqualTo from "ol/format/filter/EqualTo";

import {
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from "ol/geom";
import LinearRing from "ol/geom/LinearRing";

import OL3Parser from "jsts/org/locationtech/jts/io/OL3Parser";
import { BufferOp } from "jsts/org/locationtech/jts/operation/buffer";

export default {
  name: "Buffer",
  methods: {
    /**
     * 绘制缓冲区
     */
    async drawBuffer() {
      const _self = this;
      const map = _self.$store.getters._getDefaultMap;

      const fetchWfsUrl = "http://localhost:8080/geoserver/wfs";
      const featureNS = "http://www.openplans.org/zz";

      const bufferedSource = new VectorSource();

      const queryFilter = new EqualTo("PIdentify", 4383);
      const featureRequest = _self.createFeatureRequest(
        featureNS,
        "zz",
        ["junctions"],
        queryFilter
      );
      const bodyContent = new XMLSerializer().serializeToString(featureRequest);
      let resp;
      try {
        resp = await fetch(fetchWfsUrl, {
          method: "POST",
          body: bodyContent,
        });
      } catch (e) {
        _self.showMessage("请求错误", "error", true, true);
      }
      const respToJson = await resp.json();
      const features = new GeoJSON().readFeatures(respToJson);
      console.log(features.length);
      const parser = new OL3Parser();
      parser.inject(
        Point,
        LineString,
        LinearRing,
        Polygon,
        MultiPoint,
        MultiLineString,
        MultiPolygon
      );
      for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        // 将OpenLayers geometry转换为JSTS geometry
        const jstsGeom = parser.read(feature.getGeometry());
        //对上述geometry做缓冲区处理得到缓冲区geometry
        const buffered = BufferOp.bufferOp(jstsGeom, 1000);
        // 将上述缓冲区geometry写入（修改为）要素的geometry中
        feature.setGeometry(parser.write(buffered));
      }

      bufferedSource.clear();
      bufferedSource.addFeatures(features);

      const bufferStyle = _self.createBufferStyle("缓冲区");
      const drawBufferedLayer = new VectorLayer({
        source: bufferedSource,
        style: bufferStyle,
      });
      map.addLayer(drawBufferedLayer);
    },
    /**
     * 创建请求参数
     *  @param featureNS 要素所在工作区的命名空间URI
     *  @param featurePrefix 要素所在工作区
     *  @param featureTypes 要查询的要素
     *  @param filter 查询条件
     *  @returns
     */
    createFeatureRequest(featureNS, featurePrefix, featureTypes, filter) {
      return new WFS().writeGetFeature({
        srsName: "EPSG:3857",
        featureNS: featureNS,
        featurePrefix: featurePrefix,
        featureTypes: featureTypes,
        outputFormat: "application/json",
        filter: filter,
      });
    },
    createBufferStyle(text) {
      return new Style({
        stroke: new Stroke({
          color: "orange",
          lineDash: [4],
          width: 3,
        }),
        fill: new Fill({
          color: "rgba(255, 0, 0, 0.2)",
        }),
        text: new Text({
          font: "20px sans-serif",
          text: text,
          fill: new Fill({ color: "red" }),
          stroke: new Stroke({
            color: "rgba(255, 255, 255, 0.8)",
            width: 3,
          }),
          offsetX: 0,
          offsetY: 40,
        }),
      });
    },
    /**
     * 弹出提示信息
     */
    showMessage(msg, type, showClose, isReserved) {
      let duration;
      if (isReserved) {
        duration = 0; //为0时则不关闭
      } else {
        duration = 3000; //默认显示3秒
      }
      this.$message({
        message: msg,
        type: type,
        showClose: showClose,
        duration: duration,
      });
    },
  },
};
</script>

<style>
#draw-buffer {
  position: absolute;
  right: 160px;
  top: 40px;
  box-shadow: 5px 5px 3px grey;
  z-index: 99;
}
</style>