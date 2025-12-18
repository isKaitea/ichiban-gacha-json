<template>
  <div id="app" class="app">
    <!-- 網站 Header -->
    <header class="site-header">
      <h2>一番賞抽獎網站（打版版）</h2>
    </header>

    <main class="main">
      <section v-if="loading" class="state">
        讀取中...
      </section>

      <section v-else-if="error" class="state error">
        載入失敗：{{ error }}
      </section>

      <section v-else class="content-layout">
        <!-- 左側：一番賞名稱、簡介、抽獎、圖片瀏覽 -->
        <!-- 左側：瀏覽圖片 → 一番賞名稱/簡介 → 抽獎 -->
      <section class="left-panel">
        <!-- 瀏覽圖片：banner + 全部獎品 -->
        <div class="preview-block">
          <div class="preview-box">
            <template v-if="currentSlide">
              <h4 class="preview-name">
                {{ currentSlide.title }}
              </h4>
              <img
                class="preview-img"
                :src="currentSlide.imageUrl"
                :alt="currentSlide.title"
              />
              <p class="preview-desc">
                {{ currentSlide.description }}
              </p>
            </template>
            <template v-else>
              <p class="placeholder">
                資料載入有誤，請稍後再試
              </p>
            </template>
          </div>

          <!-- 左右切換 -->
          <div class="preview-nav" v-if="slides.length > 1">
            <button class="nav-btn" @click="prevSlide">上一張</button>
            <span class="nav-info">
              {{ currentSlideIndex + 1 }} / {{ slides.length }}
            </span>
            <button class="nav-btn" @click="nextSlide">下一張</button>
          </div>
        </div>

        <!-- 一番賞 info：名稱 + 抽獎按鈕（右側） -->
        <div class="series-info-block" v-if="series">
          <div class="series-header">
            <h1 class="series-title">{{ series.name }}</h1>

            <!-- 按鈕移到右邊 -->
            <button
              class="draw-btn header-draw-btn"
              @click="drawOnce"
              :disabled="!box || box.remainingTickets <= 0"
            >
              抽獎
            </button>
          </div>

          <p class="series-meta">
            單抽：{{ series.pricePerDraw }} 元 ｜ 本盒總抽數：
            {{ box ? box.totalTickets : 0 }} 抽 ｜ 剩餘：
            {{ box ? box.remainingTickets : 0 }} 抽
          </p>

          <p class="series-desc" v-if="series.description">
            {{ series.description }}
          </p>
        </div>
      </section>


        <!-- 右側：獎項清單 -->
        <section class="right-panel">
          <h3>獎項清單</h3>
          <ul class="prize-list">
            <li
              v-for="p in prizeTiers"
              :key="p.id"
              class="prize-item"
              :class="{
                selected: selectedPrize && selectedPrize.id === p.id,
                soldout: isPrizeSoldOut(p)
              }"
              @click="selectPrize(p)"
            >
              <div class="prize-line">
                <strong class="tier-bold">{{ p.tierCode }}賞</strong>
                <span class="prize-text">
                   {{ p.name }}
                </span>
              </div>

              <!-- 最後賞顯示文字 -->
              <div class="prize-status" v-if="p.isLastPrize">
                <span>
                  {{ lastPrizeClaimed ? "已獲得" : "尚未開出" }}
                </span>
              </div>

              <!-- 一般賞顯示 剩餘 / 總數 -->
              <div class="prize-status" v-else>
                <span>
                  剩餘 / 總數：
                  {{ getRemainingQty(p.id) }} / {{ getTotalQty(p.id) }}
                </span>
              </div>
            </li>
          </ul>
        </section>
      </section>
    </main>

    <!-- 抽獎結果小視窗 -->
    <div
      v-if="showResultModal && currentPrize"
      class="modal-backdrop"
      @click.self="closeModal"
    >
      <div class="modal">
        <button class="modal-close" @click="closeModal">
          ×
        </button>
        <h3 class="modal-title">本次抽獎結果</h3>
        <p class="modal-prize-tier">
          {{ currentPrize.tierCode }}賞
        </p>
        <p class="modal-prize-name">
          {{ currentPrize.name }}
        </p>
        <img
          class="modal-img"
          :src="currentPrize.imageUrl"
          :alt="currentPrize.name"
        />
        <p class="modal-desc">
          {{ currentPrize.description }}
        </p>
        <p class="modal-remain" v-if="box">
          本盒剩餘抽數：{{ box.remainingTickets }}
        </p>
        <button class="modal-ok" @click="closeModal">
          確認
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      loading: true,
      error: null,
      series: null,
      prizeTiers: [],
      box: null,

      // 瀏覽區
      slides: [], // 第一個是 banner，其餘是各賞圖片
      currentSlideIndex: 0,

      // 狀態
      selectedPrize: null,
      currentPrize: null,
      lastPrizeClaimed: false,
      showResultModal: false
    };
  },
  computed: {
    currentSlide() {
      if (!this.slides || this.slides.length === 0) {
        return null;
      }
      return this.slides[this.currentSlideIndex];
    }
  },
  async created() {
    try {
      const res = await fetch(process.env.BASE_URL + "data/gacha.json");
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      const data = await res.json();

      // 系列資料
      this.series = {
        id: data.series.id,
        name: data.series.name,
        pricePerDraw: data.series.pricePerDraw,
        description: data.series.description,
        bannerImage: data.series.bannerImage
      };

      // 獎項資料：加上 isLastPrize
      this.prizeTiers = data.prizeTiers.map(function (p) {
        return {
          id: p.id,
          tierCode: p.tierCode,
          name: p.name,
          imageUrl: p.imageUrl,
          description: p.description,
          isLastPrize:
            p.id === 0 ||
            p.tierCode === "最後賞" ||
            (typeof p.tierCode === "string" &&
              p.tierCode.indexOf("最後") !== -1)
        };
      });

      // 盒子資料
      this.box = data.box;

      // 構建瀏覽用 slides：先放 banner，再依照 prizeTiers 順序放獎品
      var slides = [];

      if (this.series.bannerImage) {
        slides.push({
          id: "banner",
          type: "banner",
          title: this.series.name + " 主視覺",
          imageUrl: this.series.bannerImage,
          description: this.series.description,
          prizeId: null
        });
      }

      for (var i = 0; i < this.prizeTiers.length; i++) {
        var p = this.prizeTiers[i];
        slides.push({
          id: "prize-" + p.id,
          type: "prize",
          title: p.tierCode + "賞 " + p.name,
          imageUrl: p.imageUrl,
          description: p.description,
          prizeId: p.id
        });
      }

      this.slides = slides;
      this.currentSlideIndex = 0;
      this.updateSelectedFromSlide();
    } catch (err) {
      this.error = err.message || String(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    // 從目前 slide 同步 selectedPrize（只有當 slide 是 prize 時）
    updateSelectedFromSlide() {
      var slide = this.currentSlide;
      if (!slide || slide.type !== "prize") {
        this.selectedPrize = null;
        return;
      }
      var prize = this.prizeTiers.find(function (p) {
        return p.id === slide.prizeId;
      });
      this.selectedPrize = prize || null;
    },

    // 瀏覽區：上一張
    prevSlide() {
      if (!this.slides || this.slides.length === 0) {
        return;
      }
      if (this.currentSlideIndex === 0) {
        this.currentSlideIndex = this.slides.length - 1;
      } else {
        this.currentSlideIndex = this.currentSlideIndex - 1;
      }
      this.updateSelectedFromSlide();
    },

    // 瀏覽區：下一張
    nextSlide() {
      if (!this.slides || this.slides.length === 0) {
        return;
      }
      if (this.currentSlideIndex === this.slides.length - 1) {
        this.currentSlideIndex = 0;
      } else {
        this.currentSlideIndex = this.currentSlideIndex + 1;
      }
      this.updateSelectedFromSlide();
    },

    // 點清單 → 瀏覽區跳到該獎項圖片
    selectPrize(prize) {
      this.selectedPrize = prize;
      if (!this.slides || this.slides.length === 0) {
        return;
      }
      var index = this.slides.findIndex(function (s) {
        return s.type === "prize" && s.prizeId === prize.id;
      });
      if (index >= 0) {
        this.currentSlideIndex = index;
      }
    },

    // 取得某個賞總數
    getTotalQty(prizeId) {
      if (!this.box || !this.box.prizeStocks) {
        return 0;
      }
      var stock = this.box.prizeStocks.find(function (s) {
        return s.prizeTierId === prizeId;
      });
      return stock ? stock.initialQty : 0;
    },

    // 取得某個賞剩餘數
    getRemainingQty(prizeId) {
      if (!this.box || !this.box.prizeStocks) {
        return 0;
      }
      var stock = this.box.prizeStocks.find(function (s) {
        return s.prizeTierId === prizeId;
      });
      return stock ? stock.remainingQty : 0;
    },

    // 是否抽完
    isPrizeSoldOut(prize) {
      if (prize.isLastPrize) {
        return this.lastPrizeClaimed;
      }
      return this.getRemainingQty(prize.id) === 0;
    },

    // 關閉抽獎結果視窗
    closeModal() {
      this.showResultModal = false;
    },

    // 抽獎：最後賞只會在最後一抽出現
    // 抽獎：使用「加權隨機」，依照剩餘數量決定機率
drawOnce() {
  if (!this.box) {
    return;
  }

  // 沒抽數了
  if (this.box.remainingTickets <= 0) {
    alert("這一盒已經抽完了");
    return;
  }

  // ✅ 剩下一抽：一定給最後賞
  if (this.box.remainingTickets === 1) {
    var lastPrize = this.prizeTiers.find(function (p) {
      return p.isLastPrize;
    });
    if (!lastPrize) {
      alert("找不到最後賞資料");
      return;
    }

    this.currentPrize = lastPrize;
    this.lastPrizeClaimed = true;
    this.box.remainingTickets = this.box.remainingTickets - 1;
    this.showResultModal = true;

    // 瀏覽區與清單都跳到最後賞
    this.selectPrize(lastPrize);
    return;
  }

  // 🧮 一般抽獎：用「剩餘數量」加權隨機
  if (!this.box.prizeStocks || this.box.prizeStocks.length === 0) {
    alert("未設定獎項庫存");
    return;
  }

  // 1) 先算所有獎項剩餘總數（不含最後賞，因為最後賞通常不在 prizeStocks 裡）
  var totalRemaining = 0;
  for (var i = 0; i < this.box.prizeStocks.length; i++) {
    var qty = this.box.prizeStocks[i].remainingQty;
    if (qty > 0) {
      totalRemaining += qty;
    }
  }

  // 如果總數 <= 0，代表一般賞都抽完了，應該只剩最後賞階段
  if (totalRemaining <= 0) {
    alert("一般賞庫存為 0，將進入最後賞階段");
    this.box.remainingTickets = 1;
    return;
  }

  // 2) 在 1 ~ totalRemaining 之間抽一個號碼
  var ticketNo = Math.floor(Math.random() * totalRemaining) + 1;

  // 3) 用這個號碼去跑區間，決定抽到哪個賞
  var cumulative = 0;
  var chosenStock = null;

  for (var j = 0; j < this.box.prizeStocks.length; j++) {
    var stock = this.box.prizeStocks[j];
    if (stock.remainingQty <= 0) {
      continue;
    }
    cumulative += stock.remainingQty;
    if (ticketNo <= cumulative) {
      chosenStock = stock;
      break;
    }
  }

  if (!chosenStock) {
    alert("抽獎計算錯誤，請檢查庫存資料");
    return;
  }

  // 4) 找到對應的獎項資料
  var prize = this.prizeTiers.find(function (p) {
    return p.id === chosenStock.prizeTierId;
  });

  if (!prize) {
    alert("找不到對應獎項資料");
    return;
  }

  // 5) 更新庫存與盒內剩餘抽數
  chosenStock.remainingQty = chosenStock.remainingQty - 1;
  this.box.remainingTickets = this.box.remainingTickets - 1;

  // 6) 更新畫面狀態：結果視窗、清單高亮、左側瀏覽圖片同步
  this.currentPrize = prize;
  this.showResultModal = true;
  this.selectPrize(prize);
}

  }
};
</script>

