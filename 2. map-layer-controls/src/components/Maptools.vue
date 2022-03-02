<template>
  <div class="maptools">
    <span
      class="maptools-item"
      @click="handleMaptoolsItemClick"
      id="layer-management"
      >图层管理</span
    >
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import "ol/ol.css";

export default {
  name: "Maptools",
  methods: {
    handleMaptoolsItemClick(e) {
      switch (e.target.id) {
        case "layer-management":
          this.openLayerPannel(); //开启图层管理面板
          break;
        default:
          break;
      }
    },
    openLayerPannel() {
      let currentVisible = this.$store.getters._getDefaultLayerPannelVisible;
      this.$store.commit("_setDefaultLayerPannelVisible", !currentVisible);
    },
  },
};
</script>

<style>
.maptools {
  position: absolute;
  padding: 0 15px;
  height: 30px;
  top: 40px;
  right: 50px;
  background-color: #ffffff;
  box-shadow: 5px 5px 3px grey;
  border-radius: 6px;
  border: 1px solid grey;
  opacity: 0.9;
  z-index: 99;
}

.maptools-item {
  line-height: 30px;
  margin-left: 15px;
  color: black;
  cursor: pointer;
  font-size: 15px;
}

.maptools-item:first-child {
  margin-left: 0;
}

.maptools-item:hover {
  color: #409eff;
}
</style>