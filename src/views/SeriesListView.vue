<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div>
        <h1 class="h4 fw-bold mb-1">
          <span v-if="mode === 'hot'">最熱門</span>
          <span v-else-if="mode === 'latest'">最新上架</span>
          <span v-else>一番賞清單</span>
        </h1>
        <div class="text-muted small">
          目前共 {{ filtered.length }} 套（資料：/mock-db/gachas.json）
        </div>
      </div>

      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-danger btn-sm" @click="setMode('hot')">最熱門</button>
        <button class="btn btn-outline-danger btn-sm" @click="setMode('latest')">最新上架</button>
        <router-link to="/" class="btn btn-outline-secondary btn-sm">回首頁</router-link>
      </div>
    </div>

    <!-- filters -->
    <div class="card shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-6">
            <input
              v-model.trim="q"
              class="form-control"
              placeholder="搜尋：名稱 / code / tag（例如 航海王、DEMO-001）"
            />
          </div>

          <div class="col-12 col-md-3">
            <select v-model="tag" class="form-select">
              <option value="">全部標籤</option>
              <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>

          <div class="col-12 col-md-3 d-flex gap-2">
            <button class="btn btn-outline-secondary w-100" @click="resetFilters">
              清除
            </button>
            <button class="btn btn-danger w-100" @click="scrollTop">
              回頂部
            </button>
          </div>
        </div>

        <!-- tag chips -->
        <div class="mt-3 d-flex flex-wrap gap-2">
          <button
            v-for="t in allTags.slice(0, 12)"
            :key="t"
            class="btn btn-sm"
            :class="tag === t ? 'btn-danger' : 'btn-outline-danger'"
            @click="tag = (tag === t ? '' : t)"
          >
            #{{ t }}
          </button>
        </div>
      </div>
    </div>

    <!-- states -->
    <div v-if="loading" class="text-muted">讀取中…</div>
    <div v-else-if="error" class="alert alert-danger">載入失敗：{{ error }}</div>

    <!-- list -->
    <div v-else>
      <div v-if="filtered.length === 0" class="alert alert-light border">
        找不到符合條件的資料。
      </div>

      <div class="row g-3">
        <div v-for="g in filtered" :key="g.id" class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm hover-card" role="button" @click="goDetail(g)">
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
                <span class="me-2">❤ {{ g.like_count ?? 0 }}</span>
                <span class="me-2">· 點擊 {{ g.show_n ?? 0 }}</span>
                <span>· 一般抽 {{ g.total_draws ?? "-" }}</span>
              </div>

              <p class="card-text text-muted small clamp-2">
                {{ g.description || "（尚無介紹）" }}
              </p>

              <div class="d-flex flex-wrap gap-2 mt-2">
                <span
                  v-for="t in (g.tags || [])"
                  :key="t"
                  class="badge text-bg-light border"
                  @click.stop="tag = t"
                  style="cursor:pointer;"
                  title="點我用此標籤篩選"
                >
                  #{{ t }}
                </span>
              </div>
            </div>

            <div class="card-footer bg-white border-0 pt-0">
              <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted">
                  <span v-if="g.code">代碼：{{ g.code }}</span>
                </span>
                <span class="btn btn-sm btn-outline-danger">進入抽獎 →</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 text-center">
        <router-link to="/" class="btn btn-outline-secondary">回首頁</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SeriesListView",
  data() {
    return {
      loading: true,
      error: null,
      gachas: [],
      q: "",
      tag: ""
    };
  },
  computed: {
    mode() {
      return this.$route.query.mode || "";
    },
    allTags() {
      const set = new Set();
      for (const g of this.gachas) {
        (g.tags || []).forEach(t => set.add(t));
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hant"));
    },
    sorted() {
      const arr = [...this.gachas];

      if (this.mode === "hot") {
        arr.sort((a, b) => {
          const sa = (a.show_n || 0) + (a.like_count || 0);
          const sb = (b.show_n || 0) + (b.like_count || 0);
          return sb - sa;
        });
      } else if (this.mode === "latest") {
        arr.sort((a, b) => {
          const ta = a.created_at ? Date.parse(a.created_at) : (a.id || 0);
          const tb = b.created_at ? Date.parse(b.created_at) : (b.id || 0);
          return tb - ta;
        });
      } else {
        arr.sort((a, b) => (a.id || 0) - (b.id || 0));
      }

      return arr;
    },
    filtered() {
      const q = (this.q || "").toLowerCase();
      const tag = this.tag;

      return this.sorted.filter(g => {
        const hay = [
          g.name,
          g.code,
          ...(g.tags || [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const okQ = !q || hay.includes(q);
        const okTag = !tag || (g.tags || []).includes(tag);
        return okQ && okTag;
      });
    }
  },
  watch: {
    // 換 mode 時保持畫面一致
    "$route.query.mode"() {
      this.scrollTop();
    }
  },
  async mounted() {
    try {
      const res = await fetch("/mock-db/gachas.json");
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
    setMode(mode) {
      this.$router.push({ path: "/series", query: { mode } });
    },
    resetFilters() {
      this.q = "";
      this.tag = "";
    },
    scrollTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    goDetail(g) {
      // 需要 router 有 /series/:id
      this.$router.push(`/series/${g.id}`);
    }
  }
};
</script>

<style scoped>
.hover-card:hover {
  transform: translateY(-2px);
  transition: 0.12s;
}
.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
