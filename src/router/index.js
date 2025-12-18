import { createRouter, createWebHashHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import RegisterView from "../views/RegisterView.vue";
import NewsListView from "../views/NewsListView.vue";
import SeriesListView from "../views/SeriesListView.vue";
import AdminSeriesView from "../views/AdminSeriesView.vue";
import SeriesDetailView from "../views/SeriesDetailView.vue"; // ✅ 新增

const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/register", name: "register", component: RegisterView },
  { path: "/news", name: "news", component: NewsListView },

  // 最熱門/最新上架共用同頁，用 query mode=hot/latest
  { path: "/series", name: "series", component: SeriesListView },

  // ✅ 抽獎頁（詳情頁）
  { path: "/series/:id", name: "seriesDetail", component: SeriesDetailView, props: true },

  // 管理頁
  { path: "/admin/series", name: "adminSeries", component: AdminSeriesView }
];

export default createRouter({
  history: createWebHashHistory(), // ✅ GitHub Pages 最穩
  routes
});
