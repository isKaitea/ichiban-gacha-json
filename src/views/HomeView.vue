<template>
  <div>
    <!-- Hero -->
    <div class="p-4 p-md-5 mb-4 rounded-4 bg-white border shadow-sm">
      <div class="row align-items-center g-3">
        <div class="col-12 col-lg-8">
          <h1 class="fw-bold mb-2">一番賞抽獎網站</h1>
          <p class="text-muted mb-3">
            目前使用 JSON Mock DB（public/mock-db），之後會接 Go + MySQL。
          </p>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-danger" @click="scrollTo('hot')">看最熱門</button>
            <button class="btn btn-outline-danger" @click="scrollTo('latest')">看最新上架</button>
            <button class="btn btn-outline-secondary" @click="scrollTo('news')">看最新消息</button>
          </div>
        </div>
        <div class="col-12 col-lg-4">
          <div class="rounded-4 bg-light border p-3">
            <div class="small text-muted mb-1">狀態</div>
            <div v-if="loading" class="fw-bold">讀取中…</div>
            <div v-else-if="error" class="text-danger fw-bold">載入失敗</div>
            <div v-else class="fw-bold">
              已載入 {{ gachas.length }} 套一番賞
            </div>
            <div class="small text-muted mt-2">
              檔案：/mock-db/gachas.json
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新消息 -->
    <section id="news" class="mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h2 class="h5 fw-bold mb-0">最新消息</h2>
        <button class="btn btn-sm btn-outline-secondary" @click="goNews">更多</button>
      </div>

      <div class="list-group shadow-sm">
        <div
          v-for="n in newsList"
          :key="n.id"
          class="list-group-item d-flex justify-content-between align-items-start"
        >
          <div class="me-3">
            <div class="fw-semibold">{{ n.title }}</div>
            <div class="small text-muted">{{ n.desc }}</div>
          </div>
          <span class="badge text-bg-light border">{{ n.date }}</span>
        </div>
      </div>
    </section>

    <!-- 最熱門 -->
    <section id="hot" class="mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h2 class="h5 fw-bold mb-0">最熱門</h2>
        <button class="btn btn-sm btn-outline-secondary" @click="goSeriesList('hot')">更多</button>
      </div>

      <div v-if="loading" class="text-muted">載入中…</div>
      <div v-else-if="error" class="alert alert-danger py-2">
        讀取失敗：{{ error }}
      </div>
      <div v-else class="row g-3">
        <div v-for="g in hotGachas" :key="g.id" class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm hover-card" role="button" @click="goSeriesDetail(g)">
            <img
              :src="g.image_url"
              class="card-img-top"
              :alt="g.name"
              style="height: 180px; object-fit: cover;"
            />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <h3 class="h6 fw-bold mb-1">{{ g.name }}</h3>
                <span class="badge text-bg-danger">單抽 {{ g.price }}</span>
              </div>
              <div class="small text-muted mb-2">
                ❤ {{ (g.like_count || 0) }} · 點擊 {{ (g.show_n || 0) }}
              </div>
              <p class="card-text text-muted small clamp-2">
                {{ g.description || "（尚無介紹）" }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="hotGachas.length === 0" class="text-muted">目前沒有資料</div>
      </div>
    </section>

    <!-- 最新上架 -->
    <section id="latest" class="mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h2 class="h5 fw-bold mb-0">最新上架</h2>
        <button class="btn btn-sm btn-outline-secondary" @click="goSeriesList('latest')">更多</button>
      </div>

      <div v-if="loading" class="text-muted">載入中…</div>
      <div v-else-if="error" class="alert alert-danger py-2">
        讀取失敗：{{ error }}
      </div>
      <div v-else class="row g-3">
        <div v-for="g in latestGachas" :key="g.id" class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm hover-card" role="button" @click="goSeriesDetail(g)">
            <img
              :src="g.image_url"
              class="card-img-top"
              :alt="g.name"
              style="height: 180px; object-fit: cover;"
            />
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <h3 class="h6 fw-bold mb-1">{{ g.name }}</h3>
                <span class="badge text-bg-danger">單抽 {{ g.price }}</span>
              </div>
              <div class="small text-muted mb-2">
                總抽數 {{ g.total_draws || "-" }}
                <span v-if="g.created_at">· {{ formatDate(g.created_at) }}</span>
              </div>
              <p class="card-text text-muted small clamp-2">
                {{ g.description || "（尚無介紹）" }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="latestGachas.length === 0" class="text-muted">目前沒有資料</div>
      </div>
    </section>

    <!-- 關於我們 -->
    <section id="about" class="mt-4">
      <div class="p-4 rounded-4 bg-white border shadow-sm">
        <h2 class="h5 fw-bold mb-2">關於我們</h2>
        <p class="text-muted mb-0">
          這是課堂/專題用的一番賞網站打版。現階段使用 JSON Mock DB，
          後續會接 Go API + MySQL，讓抽獎、庫存、收藏、管理功能更完整。
        </p>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: "HomeView",
  data() {
    return {
      loading: true,
      error: null,
      gachas: [],
      newsList: [
        { id: 1, date: "2025/12/15", title: "【公告】本週新增一番賞上架！", desc: "打版資料：之後可由後台新增。" },
        { id: 2, date: "2025/12/15", title: "【活動】會員抽十送一（示意）", desc: "正式版會依抽獎紀錄計算。" },
        { id: 3, date: "2025/12/15", title: "【提醒】最後賞僅最後一抽獲得", desc: "抽獎邏輯會在詳情頁實作。" }
      ]
    };
  },
  computed: {
    hotGachas() {
      const arr = [...this.gachas];
      arr.sort((a, b) => {
        const sa = (a.show_n || 0) + (a.like_count || 0);
        const sb = (b.show_n || 0) + (b.like_count || 0);
        return sb - sa;
      });
      return arr.slice(0, 6);
    },
    latestGachas() {
      const arr = [...this.gachas];
      arr.sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : a.id;
        const tb = b.created_at ? Date.parse(b.created_at) : b.id;
        return tb - ta;
      });
      return arr.slice(0, 6);
    }
  },
  async mounted() {
    try {
      const res = await fetch(`${process.env.BASE_URL}mock-db/gachas.json`);
      if (!res.ok) throw new Error("gachas.json HTTP " + res.status);

      const data = await res.json();
      this.gachas = Array.isArray(data) ? data : (data.items || []);
    } catch (e) {
      this.error = e.message || String(e);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    scrollTo(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    formatDate(iso) {
      try {
        const d = new Date(iso);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
      } catch {
        return "";
      }
    },
    goNews() {
      this.$router.push("/news");
    },
    goSeriesList(mode) {
      this.$router.push({ path: "/series", query: { mode } });
    },
    goSeriesDetail(gacha) {
    this.$router.push({ name: "seriesDetail", params: { id: gacha.id } });
    }

  }
};
</script>

<style scoped>
.hover-card:hover { transform: translateY(-2px); transition: 0.12s; }
.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
