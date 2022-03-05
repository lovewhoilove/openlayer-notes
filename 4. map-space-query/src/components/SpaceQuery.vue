<template>
  <el-button id="space-query" type="primary" plain @click="spaceQuery"
    >空间查询</el-button
  >
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw, { createBox } from "ol/interaction/Draw";
import { GeoJSON, WFS } from "ol/format";
import Intersects from "ol/format/filter/Intersects";

const fetchWfsUrl = "http://localhost:8080/geoserver/wfs";
const featureNS = "http://www.openplans.org/zz";

export default {
  name: "SpaceQuery",
  methods: {
    spaceQuery() {
      const _self = this;
      const map = _self.$store.getters._getDefaultMap;

      const vectorSource = new VectorSource();
      if (vectorSource) {
        vectorSource.clear();
      }
      let featureLayer;
      if (featureLayer) {
        map.removeLayer(featureLayer);
      }

      const drawSource = new VectorSource();
      const draw = new Draw({
        source: drawSource,
        type: "Circle",
        geometryFunction: createBox(),
      });
      map.addInteraction(draw);

      draw.on("drawend", async function (evt) {
        map.removeInteraction(draw); //绘制完成后先停止绘制
        const queryGeometry = evt.feature.getGeometry();
        const queryFilter = new Intersects("the_geom", queryGeometry);
        const featureRequest = _self.createFeatureRequest(
          featureNS,
          "zz",
          ["junctions"],
          queryFilter
        );
        const bodyContent = new XMLSerializer().serializeToString(
          featureRequest
        );

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
        const fetaures = new GeoJSON().readFeatures(respToJson);

        if (fetaures.length > 0) {
          vectorSource.clear();
          vectorSource.addFeatures(fetaures);
        } else if (fetaures.length === 0) {
          _self.showMessage("未框选到要素,请重新框选", "warning", true, false);
        }

        featureLayer = new VectorLayer({
          source: vectorSource,
          style: _self.ceratePointStyle(),
        });
        map.addLayer(featureLayer);
      });
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
    /**
     * 创建点的样式
     */
    ceratePointStyle() {
      return new Style({
        image: new CircleStyle({
          stroke: new Stroke({
            color: "rgba(255, 255, 0, 0.4)",
            width: 3,
          }),
          radius: 12,
          fill: new Fill({
            color: "rgba(255, 0, 0, 0.4)",
          }),
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
#space-query {
  position: absolute;
  right: 160px;
  top: 32px;
  box-shadow: 5px 5px 3px grey;
  z-index: 99;
}
</style>