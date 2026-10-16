
"use strict";

// ===== NOMER X SOZLAMALARI =====
const ADMIN_LOGIN = "Kozim_creator";
const ADMIN_PASSWORD = "Kozim_creator";

const STARTING_COINS = 50000;
const SPIN_PRICE = 1000;

const ACCOUNTS_KEY = "nomer_x_accounts_v5";
const SESSION_KEY = "nomer_x_session_v5";
const TEMP_SESSION_KEY = "nomer_x_temporary_session";
const PROMO_KEY = "nomer_x_promos_v5";

const STARTER_CARS = [
  { id: "bmw_m4", name: "BMW M4", price: 25000 },
  { id: "mercedes_amg", name: "Mercedes AMG", price: 40000 },
  { id: "lamborghini", name: "Lamborghini", price: 100000 }
];

// ===== MA'LUMOTLARNI SAQLASH =====
function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getAccounts() {
  return readJSON(ACCOUNTS_KEY, {});
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getPromos() {
  return readJSON(PROMO_KEY, {});
}

function savePromos(promos) {
  localStorage.setItem(PROMO_KEY, JSON.stringify(promos));
}

function currentSession() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);

    const temporary = sessionStorage.getItem(TEMP_SESSION_KEY);
    return temporary ? JSON.parse(temporary) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  const rememberBox = document.getElementById("rememberMe");
  const remember = Boolean(rememberBox && rememberBox.checked);

  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem(TEMP_SESSION_KEY);
  } else {
    sessionStorage.setItem(TEMP_SESSION_KEY, JSON.stringify(session));
    localStorage.removeItem(SESSION_KEY);
  }
}

function currentUser() {
  const session = currentSession();

  if (!session || session.admin) return null;

  return getAccounts()[session.username] || null;
}

function saveCurrentUser(user) {
  const accounts = getAccounts();
  accounts[user.username] = user;
  saveAccounts(accounts);
}

function repairPlayer(user) {
  if (typeof user.coins !== "number") {
    user.coins = STARTING_COINS;
  }

  if (!Array.isArray(user.cars)) user.cars = [];
  if (!Array.isArray(user.numbers)) user.numbers = [];
  if (!Array.isArray(user.history)) user.history = [];
  if (!Array.isArray(user.usedPromos)) user.usedPromos = [];

  return user;
}

function message(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

// ===== RO'YXATDAN O'TISH =====
function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username.length < 3 || password.length < 4) {
    return message(
      "authMessage",
      "Login kamida 3, parol kamida 4 ta belgidan iborat bo'lsin."
    );
  }

  if (username.toLowerCase() === ADMIN_LOGIN.toLowerCase()) {
    return message("authMessage", "Bu login band.");
  }

  const accounts = getAccounts();

  if (accounts[username]) {
    return message("authMessage", "Bu login mavjud.");
  }

  const user = {
    username,
    password,
    coins: STARTING_COINS,
    cars: [],
    numbers: [],
    history: [],
    usedPromos: []
  };

  accounts[username] = user;
  saveAccounts(accounts);
  saveSession({ username });
  initialize();
}

// ===== LOGIN, ADMIN KIRISHI =====
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // Admin loginini katta-kichik harflarga sezgir bo'lmagan holda tekshiramiz.
  if (
    username.toLowerCase() === ADMIN_LOGIN.toLowerCase() &&
    password === ADMIN_PASSWORD
  ) {
    saveSession({ username: ADMIN_LOGIN, admin: true });
    message("authMessage", "");
    initialize();
    return;
  }

  const accounts = getAccounts();
  const user = accounts[username];

  if (!user || user.password !== password) {
    return message("authMessage", "Login yoki parol noto'g'ri.");
  }

  repairPlayer(user);
  saveCurrentUser(user);
  saveSession({ username });
  message("authMessage", "");
  initialize();
}

// ===== AKKAUNTDAN CHIQISH =====
function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TEMP_SESSION_KEY);
  initialize();
}

// ===== BO'LIMLAR =====
function showTab(id) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.hidden = tab.id !== id;
  });
}

// ===== BALANS =====
function updateBalance() {
  const balance = document.getElementById("balance");
  if (!balance) return;

  const user = currentUser();

  balance.textContent = user
    ? user.coins.toLocaleString("ru-RU")
    : STARTING_COINS.toLocaleString("ru-RU");
}

// ===== RAQAM YARATISH =====
function randomPlate() {
  const letters = "ABCEHKMOPTXY";

  const letter = () =>
    letters[Math.floor(Math.random() * letters.length)];

  const digit = () => Math.floor(Math.random() * 10);

  return `${letter()}${digit()}${digit()}${digit()}${letter()}${letter()}`;
}

// ===== RAQAM AYLANTRISH =====
function spinNumber() {
  const user = currentUser();
  if (!user) return;

  if (user.coins < SPIN_PRICE) {
    return message("spinResult", "Tangalar yetarli emas!");
  }

  user.coins -= SPIN_PRICE;

  const rare = Math.random() < 0.10;
  const plate = rare
    ? "777" + randomPlate().slice(3)
    : randomPlate();

  const price = rare
    ? 20000 + Math.floor(Math.random() * 80001)
    : 10000 + Math.floor(Math.random() * 40001);

  const number = {
    id: Date.now() + Math.random(),
    plate,
    price,
    rarity: rare ? "Редкий" : "Обычный",
    date: new Date().toLocaleString()
  };

  user.numbers.push(number);
  user.history.unshift(number);

  saveCurrentUser(user);

  const display = document.getElementById("spinDisplay");
  if (display) display.textContent = plate;

  message(
    "spinResult",
    `${number.rarity}! Narxi: ${price.toLocaleString()} 🪙`
  );

  updateBalance();
  renderGame();
}

// ===== PROMOKOD =====
function usePromo() {
  const user = currentUser();
  if (!user) return;

  const code = document
    .getElementById("promoInput")
    .value.trim()
    .toUpperCase();

  const promo = getPromos()[code];

  if (!promo) {
    return message("promoMessage", "Promokod topilmadi.");
  }

  if (user.usedPromos.includes(code)) {
    return message("promoMessage", "Bu promokod oldin ishlatilgan.");
  }

  user.coins += Number(promo.amount);
  user.usedPromos.push(code);

  saveCurrentUser(user);
  updateBalance();

  message("promoMessage", `${promo.amount} tanga qo'shildi!`);
}

// ===== ADMIN: TANGA BERISH =====
function giveCoins() {
  if (!currentSession()?.admin) return;

  const username = document.getElementById("adminPlayer").value.trim();
  const amount = Number(document.getElementById("adminCoins").value);
  const accounts = getAccounts();

  if (
    !accounts[username] ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return message("adminMessage", "Login yoki miqdorni tekshiring.");
  }

  accounts[username].coins += Math.floor(amount);
  saveAccounts(accounts);

  message("adminMessage", "Tangalar berildi!");
  renderAdmin();
}

// ===== ADMIN: PROMOKOD YARATISH =====
function createPromo() {
  if (!currentSession()?.admin) return;

  const code = document
    .getElementById("newPromo")
    .value.trim()
    .toUpperCase();

  const amount = Number(
    document.getElementById("newPromoAmount").value
  );

  if (
    !/^[A-Z0-9_-]{3,20}$/.test(code) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return message("adminMessage", "Promokod yoki mukofot noto'g'ri.");
  }

  const promos = getPromos();

  if (promos[code]) {
    return message("adminMessage", "Bu promokod allaqachon mavjud.");
  }

  promos[code] = { amount: Math.floor(amount) };
  savePromos(promos);

  message("adminMessage", "Promokod yaratildi!");
  renderAdmin();
}

// ===== MASHINA SOTIB OLISH =====
function buyCar(id) {
  const user = currentUser();
  if (!user) return;

  const car = STARTER_CARS.find(item => item.id === id);
  if (!car) return;

  if (user.cars.some(item => item.id === id)) {
    return alert("Bu mashina garajingda bor.");
  }

  if (user.coins < car.price) {
    return alert("Tangalar yetarli emas.");
  }

  user.coins -= car.price;
  user.cars.push({ ...car });

  saveCurrentUser(user);
  updateBalance();
  renderGame();
}

// ===== RAQAMNI SOTISH =====
function sellNumber(id) {
  const user = currentUser();
  if (!user) return;

  const index = user.numbers.findIndex(item => item.id === id);
  if (index === -1) return;

  const number = user.numbers[index];

  if (
    !confirm(
      `${number.plate} raqamini ${number.price.toLocaleString()} tangaga sotasanmi?`
    )
  ) {
    return;
  }

  user.coins += number.price;
  user.numbers.splice(index, 1);

  saveCurrentUser(user);
  updateBalance();
  renderGame();
}

// ===== MASHINANI SOTISH =====
function sellCar(id) {
  const user = currentUser();
  if (!user) return;

  const index = user.cars.findIndex(car => car.id === id);
  if (index === -1) return;

  const car = user.cars[index];
  const refund = Math.floor(car.price * 0.7);

  if (
    !confirm(
      `${car.name} mashinasini ${refund.toLocaleString()} tangaga sotasanmi?`
    )
  ) {
    return;
  }

  user.coins += refund;
  user.cars.splice(index, 1);

  saveCurrentUser(user);
  updateBalance();
  renderGame();
}

// ===== ADMIN PANEL =====
function renderAdmin() {
  if (!currentSession()?.admin) return;

  const players = document.getElementById("playersList");
  const promoList = document.getElementById("promoList");

  if (!players || !promoList) return;

  players.replaceChildren();
  promoList.replaceChildren();

  Object.values(getAccounts()).forEach(user => {
    const row = document.createElement("p");
    row.textContent =
      `${user.username} — ${user.coins.toLocaleString()} 🪙`;
    players.appendChild(row);
  });

  Object.entries(getPromos()).forEach(([code, promo]) => {
    const row = document.createElement("p");
    row.textContent = `${code} — ${promo.amount} 🪙`;
    promoList.appendChild(row);
  });
}

// ===== O'YINNI EKRANGA CHIQARISH =====
function renderGame() {
  const user = currentUser();
  if (!user) return;

  const playerName = document.getElementById("playerName");
  if (playerName) playerName.textContent = user.username;

  const carShop = document.getElementById("carShop");
  const numberShop = document.getElementById("numberShop");
  const garageCars = document.getElementById("garageCars");
  const myNumbers = document.getElementById("myNumbers");
  const historyList = document.getElementById("historyList");

  if (!carShop || !numberShop || !garageCars || !myNumbers || !historyList) {
    return;
  }

  // Mashina do'koni
  carShop.replaceChildren();

  STARTER_CARS.forEach(car => {
    const card = document.createElement("div");
    card.className = "item";

    const title = document.createElement("h3");
    title.textContent = car.name;

    const price = document.createElement("p");
    price.textContent = `${car.price.toLocaleString()} 🪙`;

    const button = document.createElement("button");
    button.textContent = "Sotib olish";
    button.onclick = () => buyCar(car.id);

    card.append(title, price, button);
    carShop.appendChild(card);
  });

  numberShop.innerHTML =
    "<p>Raqam olish uchun «Prokrutka» bo'limiga kir.</p>";

  // Garajdagi mashinalar
  garageCars.replaceChildren();

  user.cars.forEach(car => {
    const card = document.createElement("div");
    card.className = "item";

    const title = document.createElement("h3");
    title.textContent = car.name;

    const price = document.createElement("p");
    price.textContent =
      `Xarid narxi: ${car.price.toLocaleString()} 🪙`;

    const button = document.createElement("button");
    button.textContent = "Mashina sotish (70%)";
    button.onclick = () => sellCar(car.id);

    card.append(title, price, button);
    garageCars.appendChild(card);
  });

  // Garajdagi raqamlar
  myNumbers.replaceChildren();

  user.numbers.forEach(number => {
    const card = document.createElement("div");
    card.className = "item";

    const title = document.createElement("h3");
    title.textContent = number.plate;

    const price = document.createElement("p");
    price.textContent =
      `${number.rarity} — ${number.price.toLocaleString()} 🪙`;

    const button = document.createElement("button");
    button.textContent = "Raqamni sotish";
    button.onclick = () => sellNumber(number.id);

    card.append(title, price, button);
    myNumbers.appendChild(card);
  });

  // Raqamlar tarixi
  historyList.replaceChildren();

  user.history.forEach(item => {
    const row = document.createElement("p");
    row.textContent =
      `${item.plate} — ${item.rarity} — ` +
      `${item.price.toLocaleString()} 🪙 — ${item.date}`;

    historyList.appendChild(row);
  });
}

// ===== SAYTNI ISHGA TUSHIRISH =====
function initialize() {
  const session = currentSession();

  const authPanel = document.getElementById("authPanel");
  const gamePanel = document.getElementById("gamePanel");
  const adminNav = document.getElementById("adminNav");

  if (!authPanel || !gamePanel || !adminNav) {
    console.error("HTML ichida authPanel, gamePanel yoki adminNav topilmadi.");
    return;
  }

  if (!session) {
    authPanel.hidden = false;
    gamePanel.hidden = true;
    adminNav.hidden = true;

    updateBalance();
    return;
  }

  if (session.admin) {
    authPanel.hidden = true;
    gamePanel.hidden = false;
    adminNav.hidden = false;

    const playerName = document.getElementById("playerName");
    if (playerName) playerName.textContent = "Admin";

    showTab("adminTab");
    renderAdmin();
    return;
  }

  const user = currentUser();

  if (!user) {
    logout();
    return;
  }

  repairPlayer(user);
  saveCurrentUser(user);

  authPanel.hidden = true;
  gamePanel.hidden = false;
  adminNav.hidden = true;

  updateBalance();
  renderGame();
  showTab("spinTab");
}

// ===== BOSHLASH =====
initialize();
