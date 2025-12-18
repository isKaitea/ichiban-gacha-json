<!-- 註冊頁（新頁面） -->
 <template>
  <div class="row justify-content-center">
    <div class="col-12 col-md-7 col-lg-5">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h2 class="h4 fw-bold mb-3">註冊</h2>

          <div class="mb-3">
            <label class="form-label">顯示名稱</label>
            <input v-model.trim="form.name" class="form-control" placeholder="例如：凱婷" />
          </div>

          <div class="mb-3">
            <label class="form-label">帳號</label>
            <input v-model.trim="form.account" class="form-control" placeholder="請輸入帳號" />
          </div>

          <div class="mb-3">
            <label class="form-label">密碼</label>
            <input v-model.trim="form.password" type="password" class="form-control" placeholder="請輸入密碼" />
          </div>

          <div class="mb-3">
            <label class="form-label">確認密碼</label>
            <input v-model.trim="form.password2" type="password" class="form-control" placeholder="再次輸入密碼" />
          </div>

          <button class="btn btn-danger w-100" @click="submit">
            建立帳號（打版）
          </button>

          <div v-if="msg" class="alert alert-info mt-3 mb-0 py-2">
            {{ msg }}
          </div>

          <div class="mt-3 text-center small">
            已有帳號？
            <a href="#" @click.prevent="$router.push('/')">回首頁登入</a>
          </div>

          <div class="alert alert-warning mt-3 py-2 mb-0">
            目前是打版：註冊資料先存 localStorage（之後改接 MySQL）。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RegisterView",
  data() {
    return {
      form: { name: "", account: "", password: "", password2: "" },
      msg: ""
    };
  },
  methods: {
    submit() {
      this.msg = "";

      if (!this.form.name || !this.form.account || !this.form.password) {
        this.msg = "請填寫完整資料";
        return;
      }
      if (this.form.password !== this.form.password2) {
        this.msg = "兩次密碼不一致";
        return;
      }

      // 打版：存到 localStorage
      const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
      if (users.some((u) => u.account === this.form.account)) {
        this.msg = "此帳號已存在";
        return;
      }

      users.push({
        id: Date.now(),
        role: "buyer",
        name: this.form.name,
        account: this.form.account
        // ⚠️打版先不存密碼（正式版才 hash）
      });

      localStorage.setItem("mock_users", JSON.stringify(users));
      this.msg = "註冊成功！你可以回首頁用 admin/1234 或 user/1234 測試登入流程（之後會改成真正登入）";
    }
  }
};
</script>
