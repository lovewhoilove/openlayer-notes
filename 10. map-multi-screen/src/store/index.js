import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const state = {
    _defaultMap: '', //默认底图
};

const getters = {
    _getDefaultMap() {
        return state._defaultMap;
    },
};

const mutations = {
    _setDefaultMap(state, value) {
        state._defaultMap = value;
    },
};

const store = new Vuex.Store({
    state,
    getters,
    mutations,
});

export default store;