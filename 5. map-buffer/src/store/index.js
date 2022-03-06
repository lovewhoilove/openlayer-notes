import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const state = {
    _defaultMap: '', //默认底图
    _defaultLayerPannelVisible: false, //图层管理面板的可见性
    _defaultKeynodesAnalysisPannelVisible: false, //路网节点分析面板的可见性
    _defaultAttrPannelVisible: false, //属性查询展示面板的可见性
    _defaultContent: '',//弹出框的默认内容
    _defaultOverlay: '',//弹出框
};

const getters = {
    _getDefaultMap() {
        return state._defaultMap;
    },
    _getDefaultLayerPannelVisible() {
        return state._defaultLayerPannelVisible;
    },
};

const mutations = {
    _setDefaultMap(state, value) {
        state._defaultMap = value;
    },
    _setDefaultLayerPannelVisible(state, value) {
        state._defaultLayerPannelVisible = value;
    },
};

const store = new Vuex.Store({
    state,
    getters,
    mutations,
});

export default store;