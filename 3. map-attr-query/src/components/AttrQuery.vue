<template>
  <div class="search-pannel">
    <!-- 搜索框 -->
    <el-input
      size="small"
      class="search"
      placeholder="请输入关键字"
      v-model="attrInput"
      clearable
    >
      <el-button
        slot="append"
        icon="el-icon-search"
        @click="onSearch"
        :loading="searchLoading"
      ></el-button>
    </el-input>
    <!-- 属性展示面板 -->
    <div
      class="attr-pannel"
      v-show="this.$store.getters._getDefaultAttrPannelVisible"
    >
      <div class="attr-pannel-header">
        <span>属性查询</span>
        <i class="el-icon-close" @click="closeLayerPannel"></i>
      </div>
      <div class="attr-pannel-body">
        <el-input
          size="mini"
          placeholder="输入关键字进行过滤"
          v-model="filterText"
        ></el-input>
        <div class="search-result">
          <el-tree
            class="filter-tree"
            :data="data"
            :props="defaultProps"
            default-expand-all
            :filter-node-method="filterNode"
            ref="tree"
            show-checkbox
            @check-change="handleCheckChange"
            @node-click="handleNodeClick"
          >
          </el-tree>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";

import { GeoJSON, WFS } from "ol/format";
import IsLike from "ol/format/filter/IsLike";
import EqualTo from "ol/format/filter/EqualTo";
import { Stroke, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

const fetchWfsUrl = "http://localhost:8080/geoserver/wfs";
const featureNS = "http://www.openplans.org/zz";

export default {
  name: "AttrQuery",
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    },
  },
  data() {
    return {
      attrInput: "",
      searchLoading: false,
      filterText: "",
      data: [],
      defaultProps: {
        label: "label",
        children: "children",
      },
    };
  },
  methods: {
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
    async onSearch() {
      const _self = this;
      _self.searchLoading = true; //当点击搜索按钮后显示加载状态

      //若输入框不为空
      if (_self.attrInput.length !== 0) {
        //模糊查询
        const filter = new IsLike("BYName_CHN", "*" + _self.attrInput + "*");

        const featureRequest = _self.createFeatureRequest(
          featureNS,
          "zz",
          ["roads"],
          filter
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
          _self.searchLoading = false;
          _self.showMessage("请求错误", "error", true, true);
        }
        const respToJson = await resp.json();
        _self.searchLoading = false;
        const features = new GeoJSON().readFeatures(respToJson);

        if (features.length > 0) {
          _self.$message({
            message: "查询到" + features.length + "条记录!",
            showClose: true,
            type: "success",
          });
          //打开属性展示面板
          _self.$store.commit("_setDefaultAttrPannelVisible", true);
          const data = [];
          features.forEach((f) => {
            data.push({
              id: f.get("LIdentify"),
              label: f.get("BYName_CHN") + ",编号: " + f.get("LIdentify"),
            });
          });
          _self.data = data;
        } else {
          _self.$message({
            message: "没有查询到符合条件的记录",
            showClose: true,
            type: "error",
          });
        }
      } else {
        _self.$message({
          message: "你输入的内容为空哦",
          showClose: true,
          type: "warning",
        });
      }
    },
    async handleCheckChange(data, checked, indeterminate) {
      const _self = this;
      const map = _self.$store.getters._getDefaultMap;

      if (checked) {
        //精确查询
        const filter = new EqualTo("LIdentify", data.id);

        const featureRequest = _self.createFeatureRequest(
          featureNS,
          "zz",
          ["roads"],
          filter
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
          _self.searchLoading = false;
          _self.showMessage("请求错误", "error", true, true);
        }
        const respToJson = await resp.json();
        const features = new GeoJSON().readFeatures(respToJson);

        const vectorSource = new VectorSource();
        const drawFeatureLayer = new VectorLayer({
          id: data.id,
          source: vectorSource,
          style: new Style({
            //添加显示的样式
            stroke: new Stroke({
              color: "red",
              width: 3,
            }),
          }),
        });
        map.addLayer(drawFeatureLayer);

        if (features.length > 0) {
          //打开属性展示面板
          vectorSource.clear();
          vectorSource.addFeatures(features);
          map.getView().fit(vectorSource.getExtent(), {
            duration: 1000,
          });
        } else {
          _self.$message({
            message: "没有查询到选中的要素",
            showClose: true,
            type: "error",
          });
        }
      } else {
        //取消选中时移除当前图层;
        map.getLayers().forEach(function (layer) {
          if (layer.get("id") === data.id) {
            map.removeLayer(layer);
          }
        });
      }
    },
    handleNodeClick(data) {
      const _self = this;
      const map = _self.$store.getters._getDefaultMap;
      map.getLayers().forEach(function (layer) {
        if (layer.get("id") === data.id) {
          const source = layer.getSource();
          if (source) {
            map.getView().fit(source.getExtent(), {
              duration: 1000,
            });
          }
        }
      });
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    //关闭图层管理面板
    closeLayerPannel() {
      const currentVisible = this.$store.getters._getDefaultAttrPannelVisible;
      this.$store.commit("_setDefaultAttrPannelVisible", !currentVisible);
    },
  },
};
</script>

<style>
/* 搜索框---------------------------------------------------------------------- */
.search-pannel {
  position: absolute;
  top: 40px;
  left: 80px;
  border-radius: 4px;
  opacity: 0.9;
  z-index: 99;
  background: rgba(255, 255, 255, 0);
  box-shadow: 5px 5px 3px grey;
}

.search {
  border: 1px solid grey;
  border-radius: 5px;
}

/* 属性查询展示---------------------------------------------------------------- */
.attr-pannel {
  position: absolute;
  top: 50px;
  left: 0px;
  width: 265px;
  height: auto;
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: 5px 5px 3px grey;
  border: 1px solid grey;
  z-index: 99;
}

.attr-pannel-header {
  width: 100%;
  height: 35px;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 5px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  cursor: move;
}

.attr-pannel-header > span {
  line-height: 35px;
  font-size: 12px;
  font-weight: 600;
}

.attr-pannel-header > i {
  line-height: 35px;
  cursor: pointer;
  transition: 0.5s;
}

.attr-pannel-header > i:hover {
  transform: rotate(360deg);
}

.attr-pannel-body {
  padding: 10px;
}

.search-result {
  overflow-y: auto;
  max-height: 420px;
  margin-top: 10px;
}

/* 树组件的字体大小--------------------------------------------- */
.el-tree > .el-tree-node > .el-tree-node__content .el-tree-node__label {
  font-size: 11px !important;
}

/* 隐藏掉复选框左侧的按钮（控制展开和闭合）------------------- */
.is-leaf {
  display: none;
}

/* elment ui-Message消息提示自定义样式-------------------------------------------- */
.el-message {
  box-shadow: 5px 5px 3px grey !important;
  border: 1px solid grey !important;
}
</style>