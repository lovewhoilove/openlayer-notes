import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const state = {
    _defaultMap: '', //默认底图
    _defaultLayerPannelVisible: false, //图层管理面板的可见性
    _defaultAttrPannelVisible: false, //属性查询展示面板的可见性
};

const getters = {
    _getDefaultMap() {
        return state._defaultMap;
    },
    _getDefaultLayerPannelVisible() {
        return state._defaultLayerPannelVisible;
    },
    _getDefaultAttrPannelVisible() {
        return state._defaultAttrPannelVisible;
    },
};

const mutations = {
    _setDefaultMap(state, value) {
        state._defaultMap = value;
    },
    _setDefaultLayerPannelVisible(state, value) {
        state._defaultLayerPannelVisible = value;
    },
    _setDefaultAttrPannelVisible(state, value) {
        state._defaultAttrPannelVisible = value;
    },
};

const store = new Vuex.Store({
    state,
    getters,
    mutations,
});

export default store;