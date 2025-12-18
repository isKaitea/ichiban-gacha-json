<template>
  <div class="container py-4">
    <div v-if="loading" class="text-muted">讀取中…</div>
    <div v-else-if="error" class="alert alert-danger">載入失敗：{{ error }}</div>

    <div v-else class="row g-4">
      <!-- 左側 -->
      <div class="col-12 col-lg-8">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h1 class="fw-bold mb-1">{{ series.name }}</h1>
            <div class="text-muted small">
              單抽 {{ series.price }} 元 ｜ 一般抽：剩餘 {{ remainingDraws }} / {{ series.total_draws }}
              <span class="ms-2">｜ 最後賞：{{ lastPrizeClaimed ? "已開出" : "未開出" }}</span>
            </div>
          </div>
        </div>

        <!-- 圖片瀏覽 -->
        <div class="card shadow-sm mt-3">
          <div class="card-body text-center">
            <div class="fw-semibold mb-2">{{ currentSlide.title }}</div>
            <img
              :src="currentSlide.image_url"
              :alt="currentSlide.title"
              class="img-fluid rounded-4 border"
              style="max-height:420px; width:100%; object-fit:cover"
            />
            <div class="text-muted small mt-2" v-if="currentSlide.description">
              {{ currentSlide.description }}
            </div>

            <div class="d-flex justify-content-center gap-2 mt-3">
              <button class="btn btn-outline-secondary btn-sm" @click="prevSlide">上一張</button>
              <button class="btn btn-outline-secondary btn-sm" @click="nextSlide">下一張</button>
            </div>
          </div>
        </div>

        <!-- 抽獎按鈕：圖片下、介紹上、靠右 -->
        <div class="d-flex justify-content-end mt-3">
          <button
            class="btn btn-danger px-4"
            @click="openDrawModal"
            :disabled="(remainingDraws <= 0) && lastPrizeClaimed"
          >
            抽獎
          </button>
        </div>

        <!-- 介紹文字 -->
        <p class="mt-3 text-muted" style="white-space:pre-line">
          {{ series.description }}
        </p>

        <router-link to="/" class="btn btn-link px-0">← 回首頁</router-link>
      </div>

      <!-- 右側：獎項清單（最後賞最上方+特殊標示） -->
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h2 class="h5 fw-bold mb-3">獎項清單</h2>

            <div class="list-group">
              <!-- ✅ 最後賞（置頂、特殊標示、不要 1/1） -->
              <button
                v-if="lastPrize"
                class="list-group-item last-prize-item"
                :class="{ claimed: lastPrizeClaimed }"
                @click="goToPrizeSlide(lastPrize)"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div class="me-2">
                    <strong class="me-2">最後賞</strong>
                    <span>{{ lastPrize.name }}</span>
                  </div>
                  <span
                    class="badge"
                    :class="lastPrizeClaimed ? 'text-bg-secondary' : 'text-bg-warning'"
                  >
                    {{ lastPrizeClaimed ? "已開出" : "未開出" }}
                  </span>
                </div>
              </button>

              <!-- 一般賞 -->
              <button
                v-for="p in normalPrizesSorted"
                :key="p.id"
                class="list-group-item list-group-item-action"
                :class="{ 'soldout-item': p.remaining <= 0 }"
                @click="goToPrizeSlide(p)"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div class="me-2">
                    <strong>{{ p.tier }}賞</strong>
                    <span class="ms-2">{{ p.name }}</span>
                  </div>
                  <span class="badge text-bg-light border">
                    {{ p.remaining }} / {{ p.total }}
                  </span>
                </div>
              </button>
            </div>

            <div class="small text-muted mt-3">
              ※ 一般抽數用盡時，最後賞會「隨最後一輪抽獎一起發放」
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ 抽獎 Modal：兩階段（選抽數 → 選號格子） -->
    <div class="modal fade" ref="drawModalEl" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">
              <span v-if="drawStage === 'chooseCount'">選擇抽獎方式</span>
              <span v-else>選擇號碼（{{ drawCount }} 抽）</span>
            </h5>
            <button class="btn-close" data-bs-dismiss="modal" @click="resetDrawFlow"></button>
          </div>

          <div class="modal-body">
            <!-- Stage 1 -->
            <div v-if="drawStage === 'chooseCount'">
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-danger" @click="startPick(1)" :disabled="remainingDraws < 1">
                  單抽
                </button>
                <button class="btn btn-outline-danger" @click="startPick(5)" :disabled="remainingDraws < 5">
                  五抽
                </button>
                <button class="btn btn-outline-danger" @click="startPick(10)" :disabled="remainingDraws < 10">
                  十抽
                </button>
                <div class="small text-muted align-self-center ms-2">
                  （剩餘一般抽：{{ remainingDraws }}）
                </div>
              </div>

              <div v-if="remainingDraws === 0" class="alert alert-warning mt-3 mb-0">
                一般抽已抽完；最後賞會在你最後一次抽獎時一起發放（若尚未領取）。
              </div>
            </div>

            <!-- Stage 2：格子 -->
            <div v-else>
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div class="small text-muted">
                  點選號碼可鎖定（最多 {{ drawCount }} 個）；已抽過會是灰色不可選
                </div>
                <button class="btn btn-sm btn-outline-secondary" @click="systemPick">
                  系統幫抽
                </button>
              </div>

              <div class="ticket-grid mt-3">
                <button
                  v-for="n in series.total_draws"
                  :key="n"
                  type="button"
                  class="ticket"
                  :class="{
                    drawn: isDrawn(n),
                    selected: pickedNumbers.includes(n) && !isDrawn(n)
                  }"
                  :disabled="isDrawn(n)"
                  @click="togglePickNumber(n)"
                >
                  {{ n }}
                </button>
              </div>

              <div class="mt-2 small text-muted">
                已選：<strong>{{ pickedNumbers.length }}</strong> / {{ drawCount }}
              </div>

              <div class="d-flex justify-content-end mt-3">
                <button
                  class="btn btn-danger"
                  @click="confirmDraw"
                  :disabled="pickedNumbers.length !== drawCount"
                >
                  確認抽獎
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ 抽獎動畫覆蓋層（右上 SKIP） -->
    <div v-if="anim.show" class="anim-overlay">
      <button class="skip-btn" @click="skipAnimation">SKIP</button>

      <div class="anim-card">
        <div class="small text-muted mb-2">抽獎中…</div>

        <div class="fw-bold mb-2">
          <span v-if="anim.current && anim.current.isLastPrize">最後賞</span>
          <span v-else-if="anim.current">{{ anim.current.tier }}賞</span>
          <span v-else>---</span>
        </div>

        <div class="mb-3 text-muted small">
          <span v-if="anim.current">{{ anim.current.name }}</span>
          <span v-else>正在轉動…</span>
        </div>

        <div class="anim-imgwrap">
          <img
            v-if="anim.current && anim.current.image_url"
            :src="anim.current.image_url"
            class="anim-img"
            :alt="anim.current.name"
          />
          <div v-else class="anim-placeholder">🎲</div>
        </div>
      </div>
    </div>

    <!-- ✅ 結果 Modal -->
    <div class="modal fade" ref="resultModalEl" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">🎉 抽獎結果</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div v-if="drawResults.length === 0" class="text-muted">（沒有結果）</div>

            <div v-else class="row g-3">
              <div v-for="(r, idx) in drawResults" :key="idx" class="col-12 col-md-6">
                <div class="border rounded-4 p-3 h-100">
                  <div class="fw-bold mb-1">
                    <span v-if="r.isLastPrize">最後賞</span>
                    <span v-else>{{ r.tier }}賞</span>
                    <span class="text-muted ms-2" v-if="!r.isLastPrize">（號碼 {{ r.number }}）</span>
                  </div>
                  <div class="mb-2">{{ r.name }}</div>
                  <img
                    :src="r.image_url"
                    class="img-fluid rounded-4 border"
                    style="max-height:260px; width:100%; object-fit:cover"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>

            <button
              class="btn btn-danger"
              @click="againDraw"
              :disabled="(remainingDraws <= 0) && lastPrizeClaimed"
            >
              再抽一次
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "SeriesDetailView",
  data() {
    return {
      loading: true,
      error: null,

      series: null,
      prizes: [],

      // ✅ mapping
      ticketPrizeIds: [],       // index0 -> 號碼1
      initialDrawnSet: new Set(), // ✅ 一開始就灰掉的號碼
      drawnSet: new Set(),      // 本頁抽掉的號碼

      drawStage: "chooseCount",
      drawCount: 1,
      pickedNumbers: [],

      lastPrizeClaimed: false,
      drawResults: [],

      slides: [],
      currentSlideIndex: 0,

      anim: {
        show: false,
        current: null,
        _timer: null,
        _endTimer: null,
        _pendingResults: null
      }
    };
  },
  computed: {
    seriesId() {
      return Number(this.$route.params.id);
    },
    lastPrize() {
      return this.prizes.find(p => String(p.tier).includes("最後")) || null;
    },
    normalPrizes() {
      return this.prizes.filter(p => !String(p.tier).includes("最後"));
    },
    normalPrizesSorted() {
      const order = ["A","B","C","D","E","F","G","H","I","J","K"];
      const idx = (t) => {
        const i = order.indexOf(String(t || "").toUpperCase());
        return i === -1 ? 999 : i;
      };
      return [...this.normalPrizes].sort((a,b) => idx(a.tier) - idx(b.tier));
    },

    // ✅ 正確：剩餘一般抽數 = prizes.remaining 加總 - 本頁抽掉的數量
    remainingDraws() {
  return this.normalPrizesSorted.reduce((sum, p) => sum + Number(p.remaining || 0), 0);
},


    currentSlide() {
      return this.slides[this.currentSlideIndex] || { title: "-", image_url: "", description: "" };
    }
  },
  async mounted() {
    try {
      const gRes = await fetch(`${process.env.BASE_URL}mock-db/gachas.json`);
      const pRes = await fetch(`${process.env.BASE_URL}mock-db/prizes.json`);
      if (!gRes.ok) throw new Error("gachas.json HTTP " + gRes.status);
      if (!pRes.ok) throw new Error("prizes.json HTTP " + pRes.status);

      const gachas = await gRes.json();
      const allPrizes = await pRes.json();

      const series = gachas.find(x => Number(x.id) === this.seriesId) || null;
      if (!series) throw new Error(`找不到 gachas.json 中 id=${this.seriesId} 的一番賞`);
      this.series = series;

      this.prizes = allPrizes
        .filter(p => Number(p.gacha_id) === this.seriesId)
        .map(p => ({
          ...p,
          isLastPrize: String(p.tier).includes("最後")
        }));

      // ✅ 建「票對獎」與「初始灰格」
      this.buildTicketMap();

      this.buildSlides();
      this.currentSlideIndex = 0;
    } catch (e) {
      this.error = e.message || String(e);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    // ---------- modal control ----------
    openDrawModal() {
      this.resetDrawFlow();
      const modal = window.bootstrap?.Modal.getOrCreateInstance(this.$refs.drawModalEl);
      modal?.show();
    },
    resetDrawFlow() {
      this.drawStage = "chooseCount";
      this.drawCount = 1;
      this.pickedNumbers = [];
    },
    startPick(count) {
      this.drawCount = count;
      this.pickedNumbers = [];
      this.drawStage = "pickNumbers";
    },

    // ---------- grid picking ----------
    systemPick() {
      const available = [];
      const total = Number(this.series?.total_draws || 0);
      for (let n = 1; n <= total; n++) {
        if (!this.isDrawn(n)) available.push(n);
      }
      this.shuffle(available);
      this.pickedNumbers = available.slice(0, this.drawCount).sort((a,b) => a-b);
    },
    togglePickNumber(n) {
      if (this.isDrawn(n)) return;

      const i = this.pickedNumbers.indexOf(n);
      if (i >= 0) {
        this.pickedNumbers.splice(i, 1);
        return;
      }
      if (this.pickedNumbers.length >= this.drawCount) return;

      this.pickedNumbers.push(n);
      this.pickedNumbers.sort((a,b) => a-b);
    },

    // ---------- confirm draw -> animation -> result ----------
    confirmDraw() {
      if (this.pickedNumbers.length !== this.drawCount) return;

      const drawModal = window.bootstrap?.Modal.getOrCreateInstance(this.$refs.drawModalEl);
      drawModal?.hide();

      const results = [];

      for (const number of this.pickedNumbers) {
        if (this.isDrawn(number)) continue;

        // ✅ 只記「本頁抽掉的」，初始灰格不動
        this.drawnSet.add(number);

        const prizeId = this.ticketPrizeIds[number - 1];
        const prize = this.prizes.find(p => p.id === prizeId);

        // ✅ 如果 prizeId 是 null（資料缺漏），就回傳「未知」但不去扣別的獎
        const picked = prize || null;

        if (picked && !picked.isLastPrize && Number(picked.remaining) > 0) {
          picked.remaining -= 1;
        }

        results.push({
          number,
          tier: picked?.tier || "?",
          name: picked?.name || "（未知獎項：資料缺漏）",
          image_url: picked?.image_url || "",
          isLastPrize: false
        });

        if (picked) this.goToPrizeSlide(picked);
      }

      // ✅ 一般抽用盡（remainingDraws==0）且最後賞未開出：同輪加發最後賞
      if (this.remainingDraws === 0 && !this.lastPrizeClaimed && this.lastPrize) {
        this.lastPrizeClaimed = true;
        const lp = this.lastPrize;
        results.push({
          number: null,
          tier: lp.tier,
          name: lp.name,
          image_url: lp.image_url,
          isLastPrize: true
        });
        this.goToPrizeSlide(lp);
      }

      this.pickedNumbers = [];
      this.drawStage = "chooseCount";
      this.startAnimation(results);
    },

    // ---------- animation ----------
    startAnimation(results) {
      this.stopAnimationTimers();

      const candidates = [];
      const normals = this.normalPrizesSorted.filter(p => p.image_url);

      for (let i = 0; i < 12; i++) {
        const p = normals[Math.floor(Math.random() * normals.length)];
        if (p) candidates.push({ tier: p.tier, name: p.name, image_url: p.image_url, isLastPrize: false });
      }
      for (const r of results) candidates.push(r);

      this.anim.show = true;
      this.anim._pendingResults = results;
      this.anim.current = candidates[0] || null;

      let idx = 0;
      this.anim._timer = setInterval(() => {
        idx = (idx + 1) % candidates.length;
        this.anim.current = candidates[idx];
      }, 80);

      this.anim._endTimer = setTimeout(() => {
        this.finishAnimation();
      }, 1200);
    },

    skipAnimation() {
      this.finishAnimation();
    },

    finishAnimation() {
      if (!this.anim.show) return;
      this.stopAnimationTimers();

      this.anim.show = false;
      this.anim.current = null;

      this.drawResults = this.anim._pendingResults || [];
      this.anim._pendingResults = null;

      this.openResultModal();
    },

    stopAnimationTimers() {
      if (this.anim._timer) clearInterval(this.anim._timer);
      if (this.anim._endTimer) clearTimeout(this.anim._endTimer);
      this.anim._timer = null;
      this.anim._endTimer = null;
    },

    openResultModal() {
      const m = window.bootstrap?.Modal.getOrCreateInstance(this.$refs.resultModalEl);
      m?.show();
    },

    againDraw() {
      const resultModal = window.bootstrap?.Modal.getOrCreateInstance(this.$refs.resultModalEl);
      resultModal?.hide();
      setTimeout(() => this.openDrawModal(), 150);
    },

    // ---------- mapping ----------
    buildTicketMap() {
      const totalDraws = Number(this.series?.total_draws || 0);

      // 1) 用 total 建「完整票池」
      const pool = [];
      for (const p of this.normalPrizesSorted) {
        const t = Number(p.total || 0);
        for (let i = 0; i < t; i++) pool.push(p.id);
      }

      // 2) pool 長度必須對齊 total_draws；缺就補 null，不要用 A 補！
      if (pool.length !== totalDraws) {
        console.warn(`[資料不一致] prizes.total總和=${pool.length}, gachas.total_draws=${totalDraws}`);
        if (pool.length > totalDraws) pool.length = totalDraws;
        while (pool.length < totalDraws) pool.push(null);
      }

      // 3) 打散，固定「號碼 -> 獎」
      this.shuffle(pool);
      this.ticketPrizeIds = pool;

      // 4) 初始灰格：依每個獎的 (total - remaining) 去標號碼
      const needDrawn = {};
      for (const p of this.normalPrizesSorted) {
        needDrawn[p.id] = Math.max(0, Number(p.total || 0) - Number(p.remaining || 0));
      }

      const initSet = new Set();
      for (let i = 0; i < this.ticketPrizeIds.length; i++) {
        const pid = this.ticketPrizeIds[i];
        if (!pid) continue;
        if ((needDrawn[pid] || 0) > 0) {
          initSet.add(i + 1); // 號碼
          needDrawn[pid] -= 1;
        }
      }

      this.initialDrawnSet = initSet;
    },

    buildSlides() {
      const slides = [];
      if (this.series?.image_url) {
        slides.push({
          type: "banner",
          title: "宣傳圖",
          image_url: this.series.image_url,
          description: ""
        });
      }

      const ordered = [];
      if (this.lastPrize) ordered.push(this.lastPrize);
      ordered.push(...this.normalPrizesSorted);

      for (const p of ordered) {
        slides.push({
          type: "prize",
          prizeId: p.id,
          title: `${p.isLastPrize ? "最後賞" : p.tier + "賞"} ${p.name}`,
          image_url: p.image_url,
          description: p.description || ""
        });
      }
      this.slides = slides;
    },

    // ---------- slides ----------
    prevSlide() {
      if (!this.slides.length) return;
      this.currentSlideIndex = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
    },
    nextSlide() {
      if (!this.slides.length) return;
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
    },
    goToPrizeSlide(prize) {
      const idx = this.slides.findIndex(s => s.type === "prize" && s.prizeId === prize.id);
      if (idx >= 0) this.currentSlideIndex = idx;
    },

    // ---------- utils ----------
    isDrawn(n) {
      // ✅ 初始灰格 + 本頁抽掉
      return this.initialDrawnSet.has(n) || this.drawnSet.has(n);
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
  },
  beforeUnmount() {
    this.stopAnimationTimers();
  }
};
</script>

<style scoped>
.soldout-item {
  text-decoration: line-through;
  opacity: 0.4;
}

/* 最後賞特殊樣式 */
.last-prize-item {
  background: #fff8e1;
  border: 2px solid #f0ad4e;
}
.last-prize-item.claimed {
  opacity: 0.55;
  text-decoration: line-through;
}

/* 格子 */
.ticket-grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 576px) {
  .ticket-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
.ticket {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 10px;
  padding: 8px 0;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.05s ease, background 0.12s ease, opacity 0.12s ease;
}
.ticket:hover { transform: translateY(-1px); }
.ticket.selected {
  border-color: #dc3545;
  background: #ffe4e8;
}
.ticket.drawn {
  background: #e9ecef;
  color: #6c757d;
  border-color: #dee2e6;
  cursor: not-allowed;
  opacity: 0.9;
}

/* ✅ 抽獎動畫覆蓋層 */
.anim-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.anim-card {
  width: min(520px, 92vw);
  background: #fff;
  border-radius: 18px;
  padding: 18px;
  text-align: center;
  box-shadow: 0 18px 40px rgba(0,0,0,0.25);
}
.skip-btn {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 2100;
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 800;
  background: #ffffff;
  cursor: pointer;
}
.anim-imgwrap {
  height: 260px;
  border-radius: 16px;
  border: 1px solid #eee;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #fafafa;
}
.anim-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.anim-placeholder {
  font-size: 64px;
}
</style>
