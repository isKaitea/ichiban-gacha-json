<template>
  <div>
    <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div class="container">
        <a class="navbar-brand fw-bold text-danger" href="#" @click.prevent="goHome">
          一番賞
        </a>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="#news" @click.prevent="jumpTo('news')">最新消息</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#hot" @click.prevent="jumpTo('hot')">最熱門</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#latest" @click.prevent="jumpTo('latest')">最新上架</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#about" @click.prevent="jumpTo('about')">關於我們</a>
            </li>

            <li class="nav-item" v-if="isAdmin">
              <a class="nav-link fw-bold text-primary" href="#" @click.prevent="goAdmin">
                管理一番賞
              </a>
            </li>
          </ul>

          <div class="d-flex gap-2">
            <button
              v-if="!isLoggedIn"
              class="btn btn-outline-danger"
              data-bs-toggle="modal"
              data-bs-target="#loginModal"
            >
              登入
            </button>

            <div v-else class="d-flex align-items-center gap-2">
              <span class="small text-muted">
                嗨，{{ user.name }}
                <span v-if="isAdmin" class="badge text-bg-primary ms-1">Admin</span>
              </span>
              <button class="btn btn-outline-secondary btn-sm" @click="logout">登出</button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="container py-4">
      <router-view />
    </main>

    <!-- Login Modal -->
    <div class="modal fade" id="loginModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">登入</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">帳號</label>
              <input v-model.trim="loginForm.account" type="text" class="form-control" placeholder="輸入帳號" />
            </div>

            <div class="mb-3">
              <label class="form-label">密碼</label>
              <input v-model.trim="loginForm.password" type="password" class="form-control" placeholder="輸入密碼" />
            </div>

            <button class="btn btn-danger w-100" @click="submitLogin">登入</button>

            <div class="mt-3 small text-muted d-flex justify-content-between">
              <a href="#" @click.prevent="forgotPassword">忘記密碼？</a>
              <a href="#" @click.prevent="goRegister">註冊</a>
            </div>

            <div v-if="loginError" class="alert alert-danger mt-3 py-2 mb-0">
              {{ loginError }}
            </div>

            <div class="alert alert-warning mt-3 py-2 mb-0">
              打版登入：admin/1234（管理者）、user/1234（一般）
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      loginForm: { account: "", password: "" },
      loginError: "",
      user: this.loadUser()
    };
  },
  computed: {
    isLoggedIn() {
      return !!this.user;
    },
    isAdmin() {
      return this.user?.role === "admin";
    }
  },
  methods: {
    loadUser() {
      try {
        const raw = localStorage.getItem("mock_user");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    saveUser(u) {
      this.user = u;
      localStorage.setItem("mock_user", JSON.stringify(u));
    },
    clearUser() {
      this.user = null;
      localStorage.removeItem("mock_user");
    },

    closeModalById(id) {
      const el = document.getElementById(id);
      if (!el || !window.bootstrap) return;
      const instance = window.bootstrap.Modal.getInstance(el) || new window.bootstrap.Modal(el);
      instance.hide();
    },

    async jumpTo(id) {
      // 不在首頁先回首頁
      if (this.$route.path !== "/") {
        await this.$router.push("/");
      }
      // 等 DOM 出現再滾
      this.$nextTick(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },

    goHome() {
      this.$router.push("/");
    },
    goRegister() {
      this.closeModalById("loginModal");
      this.$router.push("/register");
    },
    goAdmin() {
      this.$router.push("/admin/series");
    },

    forgotPassword() {
      alert("打版：忘記密碼之後可做 Email / OTP / 重設流程。");
    },

    submitLogin() {
      this.loginError = "";
      const acc = this.loginForm.account;
      const pwd = this.loginForm.password;

      if ((acc === "admin" || acc === "user") && pwd === "1234") {
        const u = {
          id: acc === "admin" ? 1 : 2,
          name: acc === "admin" ? "管理者" : "一般使用者",
          role: acc === "admin" ? "admin" : "buyer"
        };
        this.saveUser(u);
        this.loginForm.account = "";
        this.loginForm.password = "";
        this.closeModalById("loginModal");
        return;
      }

      this.loginError = "帳號或密碼錯誤（打版：admin/1234 或 user/1234）";
    },

    logout() {
      this.clearUser();
      alert("已登出");
    }
  }
};
</script>
