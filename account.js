(() => {
  "use strict";
  const apiBase = "https://d5duj0jcignprkgu8glg.kr8f6hld.apigw.yandexcloud.net";
  const sessionKey = "bookdiaryPremiumWebSession";
  const deviceKey = "bookdiaryPremiumWebDevice";
  const modal = document.querySelector("[data-account-modal]");
  const registerForm = document.querySelector("[data-register-form]");
  const verifyForm = document.querySelector("[data-verify-form]");
  const loginForm = document.querySelector("[data-login-form]");
  const signedIn = document.querySelector("[data-signed-in]");
  const title = document.querySelector("#accountTitle");
  const lead = document.querySelector("[data-account-lead]");
  const state = document.querySelector("[data-account-state]");
  const switchButton = document.querySelector("[data-account-switch]");
  const navButton = document.querySelector("[data-open-account]");
  const premiumState = document.querySelector("#premiumState");
  let mode = "register";
  let pendingEmail = "";
  let pendingPassword = "";
  let session = loadSession();

  function loadSession() { try { return JSON.parse(sessionStorage.getItem(sessionKey) || "null"); } catch (_) { return null; } }
  function saveSession(value) { session = value; value ? sessionStorage.setItem(sessionKey, JSON.stringify(value)) : sessionStorage.removeItem(sessionKey); }
  function deviceId() { let value = sessionStorage.getItem(deviceKey); if (!value) { value = crypto.randomUUID ? crypto.randomUUID().replaceAll("-", "") : `${Date.now()}${Math.random()}`; sessionStorage.setItem(deviceKey, value); } return value; }
  function setState(message, error = false) { if (!state) return; state.textContent = message; state.classList.toggle("isError", error); }
  function messageFor(code) {
    return ({ INVALID_EMAIL: "Проверьте адрес электронной почты.", WEAK_PASSWORD: "Пароль должен содержать от 10 до 128 символов.", EMAIL_ALREADY_REGISTERED: "Этот адрес уже зарегистрирован. Перейдите ко входу.", INVALID_CODE: "Введите шестизначный код из письма.", CODE_INVALID_OR_EXPIRED: "Код неверный или уже истёк. Запросите регистрацию повторно.", INVALID_CREDENTIALS: "Неверная почта или пароль.", EMAIL_NOT_VERIFIED: "Сначала подтвердите почту кодом из письма.", TRIAL_ALREADY_USED: "Пробный период для этого аккаунта уже использован.", PAYMENTS_NOT_CONFIGURED: "Оплата временно недоступна. Попробуйте позже.", NETWORK_ERROR: "Нет связи с сервером. Попробуйте ещё раз." })[code] || "Не удалось выполнить запрос. Попробуйте ещё раз.";
  }
  async function request(path, options = {}, retry = true) {
    const headers = { "Content-Type": "application/json" };
    if (options.authorized && session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
    let response;
    try { response = await fetch(apiBase + path, { method: options.method || "GET", headers, body: options.body ? JSON.stringify(options.body) : undefined }); }
    catch (_) { throw new Error("NETWORK_ERROR"); }
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && options.authorized && retry && await refresh()) return request(path, options, false);
    if (!response.ok) throw new Error(data.error || "REQUEST_FAILED");
    return data;
  }
  async function refresh() {
    if (!session?.refreshToken) return false;
    try { const data = await request("/auth/refresh", { method: "POST", body: { refreshToken: session.refreshToken } }, false); saveSession({ ...session, ...data }); return true; }
    catch (_) { saveSession(null); renderSession(); return false; }
  }
  async function login(email, password) {
    const data = await request("/auth/login", { method: "POST", body: { email, password, deviceId: deviceId() } });
    saveSession(data);
    renderSession();
    await updatePremium();
  }
  function showMode(nextMode) {
    mode = nextMode;
    const loggedIn = Boolean(session?.accessToken);
    registerForm.hidden = loggedIn || mode !== "register";
    verifyForm.hidden = loggedIn || mode !== "verify";
    loginForm.hidden = loggedIn || mode !== "login";
    signedIn.hidden = !loggedIn;
    switchButton.hidden = loggedIn || mode === "verify";
    if (loggedIn) { title.textContent = "Ваш аккаунт"; lead.textContent = "Аккаунт подключён к сайту Talemory."; return; }
    if (mode === "login") { title.textContent = "Вход в аккаунт"; lead.textContent = "Используйте тот же аккаунт, что и в приложении."; switchButton.textContent = "Нет аккаунта — зарегистрироваться"; }
    else if (mode === "verify") { title.textContent = "Подтвердите почту"; lead.textContent = `Мы отправили шестизначный код на ${pendingEmail}.`; }
    else { title.textContent = "Создайте аккаунт"; lead.textContent = "Синхронизируйте дневник и используйте Premium на своих устройствах."; switchButton.textContent = "У меня уже есть аккаунт — войти"; }
    setState("");
  }
  function openModal(preferLogin = false) { modal.hidden = false; document.body.classList.add("modalOpen"); showMode(session?.accessToken ? mode : (preferLogin ? "login" : mode)); setTimeout(() => modal.querySelector("input:not([type=hidden])")?.focus(), 0); }
  function closeModal() { modal.hidden = true; document.body.classList.remove("modalOpen"); }
  function renderSession() {
    const loggedIn = Boolean(session?.accessToken);
    navButton.textContent = loggedIn ? (session.user?.email || "Мой аккаунт") : "Вход / регистрация";
    document.querySelector("[data-account-email]").textContent = session?.user?.email || "Аккаунт Talemory";
    if (loggedIn) showMode(mode);
  }
  async function updatePremium() {
    if (!session?.accessToken) { premiumState.textContent = "Для оформления войдите или зарегистрируйтесь."; return; }
    premiumState.textContent = "Проверяем статус Premium…";
    try {
      const data = await request("/premium/status", { authorized: true });
      const text = data.active && data.expiresAt ? `Premium активен до ${new Date(data.expiresAt).toLocaleDateString("ru-RU")}` : "Аккаунт подключён. Выберите подходящий тариф.";
      premiumState.textContent = text;
      document.querySelector("[data-account-premium]").textContent = text;
    } catch (error) { premiumState.textContent = messageFor(error.message); }
  }

  document.querySelectorAll("[data-open-account]").forEach(button => button.addEventListener("click", () => openModal(false)));
  document.querySelectorAll("[data-close-account]").forEach(button => button.addEventListener("click", closeModal));
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
  switchButton.addEventListener("click", () => showMode(mode === "login" ? "register" : "login"));
  registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    const values = new FormData(registerForm);
    const password = String(values.get("password") || "");
    if (password !== values.get("passwordConfirm")) { setState("Пароли не совпадают.", true); return; }
    pendingEmail = String(values.get("email") || "").trim(); pendingPassword = password;
    setState("Создаём аккаунт и отправляем код…");
    try { await request("/auth/register", { method: "POST", body: { email: pendingEmail, password } }); showMode("verify"); setState("Код отправлен. Проверьте почту, включая папку «Спам»."); }
    catch (error) { setState(messageFor(error.message), true); }
  });
  verifyForm.addEventListener("submit", async event => {
    event.preventDefault(); setState("Проверяем код…");
    try { await request("/auth/verify-email", { method: "POST", body: { email: pendingEmail, code: new FormData(verifyForm).get("code") } }); await login(pendingEmail, pendingPassword); setState("Почта подтверждена. Вы вошли в аккаунт."); pendingPassword = ""; }
    catch (error) { setState(messageFor(error.message), true); }
  });
  loginForm.addEventListener("submit", async event => {
    event.preventDefault(); const values = new FormData(loginForm); setState("Выполняем вход…");
    try { await login(values.get("email"), values.get("password")); loginForm.reset(); setState("Вход выполнен."); }
    catch (error) { setState(messageFor(error.message), true); }
  });
  document.querySelector("[data-logout]").addEventListener("click", async () => {
    try { if (session?.refreshToken) await request("/auth/logout", { method: "POST", authorized: true, body: { refreshToken: session.refreshToken } }); } catch (_) {}
    saveSession(null); mode = "login"; renderSession(); showMode("login"); await updatePremium(); setState("Вы вышли из аккаунта.");
  });
  document.querySelectorAll("[data-plan]").forEach(button => button.addEventListener("click", async () => {
    if (!session?.accessToken) { mode = "login"; openModal(true); setState("Войдите, чтобы оформить Premium."); return; }
    button.disabled = true; premiumState.textContent = button.dataset.plan === "trial_3d" ? "Активируем пробный период…" : "Создаём защищённую страницу оплаты…";
    try { const data = await request("/payments/create", { method: "POST", authorized: true, body: { planId: button.dataset.plan } }); if (data.active) await updatePremium(); else if (data.paymentUrl) location.assign(data.paymentUrl); else throw new Error("REQUEST_FAILED"); }
    catch (error) { premiumState.textContent = messageFor(error.message); }
    finally { button.disabled = false; }
  }));

  renderSession();
  updatePremium();
})();
