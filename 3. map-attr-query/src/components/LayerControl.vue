<template>
  <div
    class="layer-pannel"
    v-show="this.$store.getters._getDefaultLayerPannelVisible"
  >
    <div class="layer-pannel-header">
      <span>图层管理</span>
      <i class="el-icon-close" @click="closeLayerPannel"></i>
    </div>
    <div class="layer-pannel-body">
      <el-tree
        :data="data"
        show-checkbox
        :props="defaultProps"
        @check-change="handleCheckChange"
        @node-click="handleNodeClick"
      ></el-tree>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";
import ImageWMS from "ol/source/ImageWMS";
import { Image as ImageLayer } from "ol/layer";
import { buffer, getCenter, getSize } from "ol/extent";

export default {
  name: "LayerControl",
  data() {
    return {
      //目录树的数据源配置
      data: [
        {
          label: "路网交叉点",
          layerId: "ol-layer-junctions",
          layerUrl: "http://localhost:8080/geoserver/zz/wms",
          layerParams: "zz:junctions", //工作区:要素名称
          layerExtends: [
            12636373.2716, 4135060.8492, 12645372.658, 4141921.7675,
          ], //GeoServer可以查到，最好添加
        },
      ],
      defaultProps: {
        children: "children",
        label: "label",
      },
    };
  },
  methods: {
    /**
     * 加载或移除不同类型的服务
     */
    handleCheckChange(data, checked, indeterminate) {
      //根据url获取服务类型
      const temp = data.layerUrl.split("/");
      const serverType = temp[temp.length - 1];

      switch (serverType) {
        case "wms": //处理wms
          this.handleWmsLayer(data, checked);
          break;
        case "wfs": //处理wfs
          break;
        case "wmts": //处理wmts
          break;
        default:
          break;
      }
    },
    /**
     * 加载或移除wms服务
     */
    handleWmsLayer(data, checked) {
      const _self = this;
      const map = _self.$store.getters._getDefaultMap;

      const wmsSource = new ImageWMS({
        url: data.layerUrl,
        params: {
          LAYERS: data.layerParams,
        },
        ratio: 1,
        serverType: "geoserver",
      });

      const bizLayer = new ImageLayer({
        id: data.layerId, //为当前业务图层设置一个自定义id
        extent: data.layerExtends,
        source: wmsSource,
      });

      if (checked) {
        //添加图层
        map.addLayer(bizLayer);
        //将视图中心平移至当前图层的中心
        const extent = bizLayer.getExtent();
        const extentCenter = getCenter(extent);
        map.getView().animate({ center: extentCenter, duration: 500 });
      } else {
        //移除当前取消选中的图层;
        map.getLayers().forEach(function (layer) {
          if (layer.get("id") === data.layerId) {
            map.removeLayer(layer);
          }
        });
      }
    },
    /**
     * 缩放至当前图层并缓冲宽高平均值的5%的距离（即加一定的留白区域）
     */
    handleNodeClick(data) {
      //点击图层名称则缩放至当前图层
      const _self = this;
      const map = _self.$store.getters._getDefaultMap;

      //查询是否已加载当前点击的图层
      let currLayer;
      map.getLayers().forEach(function (layer) {
        if (layer.get("id") === data.layerId) {
          currLayer = layer;
        }
      });

      if (currLayer) {
        const extent = currLayer.getExtent();
        const extentSize = getSize(extent);
        const extentBuffer = ((extentSize[0] + extentSize[1]) / 2) * 0.05;
        //缩放至当前图层并添加一定的留白区域
        map
          .getView()
          .fit(buffer(currLayer.getExtent(), extentBuffer), { duration: 1000 });
      } else {
        _self.$message({
          showClose: true,
          message: "您未加载" + data.label + "图层",
          type: "warning",
        });
      }
    },
    /**
     * 关闭图层管理面板
     */
    closeLayerPannel() {
      const currentVisible = this.$store.getters._getDefaultLayerPannelVisible;
      this.$store.commit("_setDefaultLayerPannelVisible", !currentVisible);
    },
  },
};
</script>

<style>
.layer-pannel {
  position: absolute;
  top: 100px;
  right: 50px;
  width: 160px;
  height: 200px;
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: 5px 5px 3px grey;
  border: 1px solid grey;
  opacity: 0.9;
  z-index: 99;
}

.layer-pannel-header {
  width: 100%;
  height: 35px;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 5px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  cursor: move;
}

.layer-pannel-header > span {
  line-height: 35px;
  font-size: 13px;
  font-weight: 600;
}

.layer-pannel-header > i {
  line-height: 35px;
  cursor: pointer;
}

.layer-pannel-body {
  padding: 8px;
}

/* elment ui-Message消息提示自定义样式--------------------- */
.el-message {
  box-shadow: 5px 5px 3px grey !important;
  border: 1px solid grey !important;
}

/* 隐藏掉复选框左侧的按钮（控制展开和闭合）------------------- */
span.is-leaf {
  display: none !important;
}

/* 调整树组件的字体大小-------------------------------------- */
.el-tree > .el-tree-node > .el-tree-node__content .el-tree-node__label {
  font-size: 11px !important;
}
</style>