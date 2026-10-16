"use strict";

// NOMER X
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

// ---------- SAQLASH ----------
function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
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
  } catch (error) {
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
  if (typeof user.coins !== "number") user.coins = STARTING_COINS;
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

function formatCoins(value) {
  return Number(value || 0).toLocaleString("ru-RU");
}

// ---------- RO‘YXATDAN O‘TISH ----------
function register() {
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");

  if (!usernameEl || !passwordEl) {
    alert("HTML ichida username yoki password elementi topilmadi.");
    return;
  }

  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  if (username.length < 3 || password.length < 4) {
    message(
      "authMessage",
      "Login kamida 3 ta, parol kamida 4 ta belgidan iborat bo‘lsin."
    );
    return;
  }

  if (username.toLowerCase() === ADMIN_LOGIN.toLowerCase()) {
    message("authMessage", "Bu login band.");
    return;
  }

  const accounts = getAccounts();

  if (accounts[username]) {
    message("authMessage", "Bu login allaqachon mavjud.");
    return;
  }

  const user = {
    username: username,
    password: password,
    coins: STARTING_COINS,
    cars: [],
    numbers: [],
    history: [],
    usedPromos: []
  };

  accounts[username] = user;
  saveAccounts(accounts);
  saveSession({ username: username });

  initialize();
}

// ---------- LOGIN ----------
function login() {
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");

  if (!usernameEl || !passwordEl) {
    alert("Login formasi topilmadi. HTML kodini tekshiring.");
    return;
  }

  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  if (
    username.toLowerCase() === ADMIN_LOGIN.toLowerCase() &&
    password === ADMIN_PASSWORD
  ) {
    saveSession({
      username: ADMIN_LOGIN,
      admin: true
    });

    initialize();
    return;
  }

  const accounts = getAccounts();
  const user = accounts[username];

  if (!user || user.password !== password) {
    message("authMessage", "Login yoki parol noto‘g‘ri.");
    return;
  }

  repairPlayer(user);
  saveCurrentUser(user);
  saveSession({ username: username });

  initialize();
}

// ---------- CHIQISH ----------
function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TEMP_SESSION_KEY);
  initialize();
}

// ---------- BO‘LIMLAR ----------
function showTab(id) {
  document.querySelectorAll(".tab").forEach(function(tab) {
    tab.hidden = tab.id !== id;
  });
}

// ---------- BALANS ----------
function updateBalance() {
  const user = currentUser();
  const balance = document.getElementById("balance");

  if (!balance) return;

  balance.textContent = formatCoins(
    user ? user.coins : STARTING_COINS
  );
}

// ---------- O‘ZBEKISTON AVTOMOBIL RAQAMLARI ----------
function randomPlate() {
  const letters = "ABCEHKMOPTXY";
  const regions = [
    "01", "10", "20", "25", "30", "40", "50",
    "60", "70", "75", "80", "85", "90", "95"
  ];

  function randomLetter() {
    return letters[Math.floor(Math.random() * letters.length)];
  }

  function randomDigit() {
    return Math.floor(Math.random() * 10);
  }

  const region = regions[Math.floor(Math.random() * regions.length)];
  const firstLetter = randomLetter();
  const digits = `${randomDigit()}${randomDigit()}${randomDigit()}`;
  const lastLetters = `${randomLetter()}${randomLetter()}`;

  return `${region} ${firstLetter} ${digits} ${lastLetters}`;
}

// ---------- RAQAM VA NARX YARATISH ----------
function generatePlateOffer() {
  const letters = "ABCEHKMOPTXY";
  const regions = [
    "01", "10", "20", "25", "30", "40", "50",
    "60", "70", "75", "80", "85", "90", "95"
  ];

  function randomLetter() {
    return letters[Math.floor(Math.random() * letters.length)];
  }

  function randomDigit() {
    return Math.floor(Math.random() * 10);
  }

  const region = regions[Math.floor(Math.random() * regions.length)];
  const firstLetter = randomLetter();

  // Eng qimmat raqamlar: 777 yoki oxirgi ikkita harf bir xil.
  const elite = Math.random() < 0.025;

  let digits;
  let lastLetters;

  if (elite && Math.random() < 0.5) {
    digits = "777";

    const sameLetter = randomLetter();
    lastLetters = sameLetter + sameLetter;
  } else if (elite) {
    digits = `${randomDigit()}${randomDigit()}${randomDigit()}`;

    const sameLetter = randomLetter();
    lastLetters = sameLetter + sameLetter;
  } else {
    digits = `${randomDigit()}${randomDigit()}${randomDigit()}`;
    lastLetters = `${randomLetter()}${randomLetter()}`;
  }

  const plate = `${region} ${firstLetter} ${digits} ${lastLetters}`;

  const isElite =
    digits === "777" ||
    lastLetters[0] === lastLetters[1];

  const repeatedDigits =
    digits[0] === digits[1] ||
    digits[1] === digits[2] ||
    digits === "123" ||
    digits === "321";

  let price;
  let rarity;

  if (isElite) {
    price = 10000000;
    rarity = "УЛЬТРА";
  } else if (repeatedDigits) {
    price = 200000 + Math.floor(Math.random() * 800001);
    rarity = "РЕДКИЙ";
  } else {
    price = 20000 + Math.floor(Math.random() * 480001);
    rarity = "ОБЫЧНЫЙ";
  }

  return {
    plate: plate,
    price: price,
    rarity: rarity
  };
}

// ---------- RAQAM AYLANTIRISH ----------
function spinNumber() {
  const user = currentUser();

  if (!user) {
    message("spinResult", "Avval akkauntingizga kiring.");
    return;
  }

  if (user.coins < SPIN_PRICE) {
    message("spinResult", "Tangalar yetarli emas!");
    return;
  }

  user.coins -= SPIN_PRICE;

  const offer = generatePlateOffer();

  const number = {
    id: Date.now() + Math.random(),
    plate: offer.plate,
    price: offer.price,
    rarity: offer.rarity,
    date: new Date().toLocaleString()
  };

  user.numbers.push(number);
  user.history.unshift(number);

  saveCurrentUser(user);

  const display = document.getElementById("spinDisplay");

  if (display) {
    display.textContent = number.plate;
    display.classList.add("uzbek-plate");
    display.setAttribute(
      "aria-label",
      "O‘zbekiston avtomobil raqami " + number.plate
    );
  }

  message(
    "spinResult",
    number.rarity + "! Narxi: " + formatCoins(number.price) + " 🪙"
  );

  updateBalance();
  renderGame();
}

// ---------- PROMOKOD ISHLATISH ----------
function usePromo() {
  const user = currentUser();

  if (!user) {
    message("promoMessage", "Avval akkauntingizga kiring.");
    return;
  }

  const input = document.getElementById("promoInput");

  if (!input) {
    message("promoMessage", "Promokod maydoni topilmadi.");
    return;
  }

  const code = input.value.trim().toUpperCase();
  const promos = getPromos();
  const promo = promos[code];

  if (!promo) {
    message("promoMessage", "Promokod topilmadi.");
    return;
  }

  if (user.usedPromos.includes(code)) {
    message("promoMessage", "Bu promokod oldin ishlatilgan.");
    return;
  }

  const amount = Number(promo.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    message("promoMessage", "Promokod mukofoti noto‘g‘ri.");
    return;
  }

  user.coins += amount;
  user.usedPromos.push(code);

  saveCurrentUser(user);
  updateBalance();

  message(
    "promoMessage",
    formatCoins(amount) + " tanga qo‘shildi!"
  );
}

// ---------- ADMIN: TANGA BERISH ----------
function giveCoins() {
  const playerInput = document.getElementById("adminPlayer");
  const amountInput = document.getElementById("adminCoins");

  if (!playerInput || !amountInput) {
    message("adminMessage", "Admin formasi HTML ichida topilmadi.");
    return;
  }

  const username = playerInput.value.trim();
  const amount = Number(amountInput.value);
  const accounts = getAccounts();

  if (
    !accounts[username] ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    message("adminMessage", "Login yoki tanga miqdorini tekshiring.");
    return;
  }

  accounts[username].coins += Math.floor(amount);
  saveAccounts(accounts);

  message("adminMessage", "Tangalar berildi!");
  renderAdmin();
}

// ---------- ADMIN: PROMOKOD YARATISH ----------
function createPromo() {
  const codeInput = document.getElementById("newPromo");
  const amountInput = document.getElementById("newPromoAmount");

  if (!codeInput || !amountInput) {
    message("adminMessage", "Promokod formasi topilmadi.");
    return;
  }

  const code = codeInput.value.trim().toUpperCase();
  const amount = Number(amountInput.value);

  if (
    !/^[A-Z0-9_-]{3,20}$/.test(code) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    message("adminMessage", "Promokod yoki mukofot miqdori noto‘g‘ri.");
    return;
  }

  const promos = getPromos();

  if (promos[code]) {
    message("adminMessage", "Bu promokod allaqachon mavjud.");
    return;
  }

  promos[code] = {
    amount: Math.floor(amount)
  };

  savePromos(promos);

  message("adminMessage", "Promokod yaratildi!");
  renderAdmin();
}

// ---------- MASHINA SOTIB OLISH ----------
function buyCar(id) {
  const user = currentUser();

  if (!user) return;

  const car = STARTER_CARS.find(function(item) {
    return item.id === id;
  });

  if (!car) return;

  if (user.cars.some(function(item) {
    return item.id === id;
  })) {
    alert("Bu mashina garajingizda bor.");
    return;
  }

  if (user.coins < car.price) {
    alert("Tangalar yetarli emas.");
    return;
  }

  user.coins -= car.price;
  user.cars.push({ ...car });

  saveCurrentUser(user);
  updateBalance();
  renderGame();
}

// ---------- RAQAM SOTIB OLISH ----------
function buyNumber(id) {
  const user = currentUser();

  if (!user) return;

  const number = user.numbers.find(function(item) {
    return item.id === id;
  });

  if (!number) return;

  alert("Bu raqam allaqachon sizning garajingizda.");
}

// ---------- RAQAMNI SOTISH ----------
function sellNumber(id) {
  const user = currentUser();

  if (!user) return;

  const index = user.numbers.findIndex(function(item) {
    return item.id === id;
  });

  if (index === -1) return;

  const number = user.numbers[index];

  const confirmed = confirm(
    number.plate + " raqamini " +
    formatCoins(number.price) +
    " tangaga sotmoqchimisiz?"
  );

  if (!confirmed) return;

  user.coins += number.price;
  user.numbers.splice(index, 1);

  saveCurrentUser(user);
  updateBalance();
  renderGame();
}

// ---------- MASHINANI SOTISH ----------
function sellCar(id) {
  const user = currentUser();

  if (!user) return;

  const index = user.cars.findIndex(function(car) {
    return car.id === id;
  });

  if (index === -1) return;

  const car = user.cars[index];
  const refund = Math.floor(car.price * 0.7);

  const confirmed = confirm(
    car.name + " mashinasini " +
    formatCoins(refund) +
    " tangaga sotmoqchimisiz?"
  );

  if (!confirmed) return;

  user.coins += refund;
  user.cars.splice(index, 1);

  saveCurrentUser(user);
  updateBalance();
  renderGame();
}

// ---------- ADMIN PANEL ----------
function renderAdmin() {
  const players = document.getElementById("playersList");
  const promoList = document.getElementById("promoList");

  if (players) {
    players.replaceChildren();

    Object.values(getAccounts()).forEach(function(user) {
      const row = document.createElement("p");
      row.textContent =
        user.username + " — " + formatCoins(user.coins) + " 🪙";

      players.appendChild(row);
    });
  }

  if (promoList) {
    promoList.replaceChildren();

    Object.entries(getPromos()).forEach(function(entry) {
      const code = entry[0];
      const promo = entry[1];

      const row = document.createElement("p");
      row.textContent =
        code + " — " + formatCoins(promo.amount) + " 🪙";

      promoList.appendChild(row);
    });
  }
}

// ---------- O‘YINNI CHIZISH ----------
function renderGame() {
  const user = currentUser();

  if (!user) return;

  const playerName = document.getElementById("playerName");

  if (playerName) {
    playerName.textContent = user.username;
  }

  const carShop = document.getElementById("carShop");
  const numberShop = document.getElementById("numberShop");
  const garageCars = document.getElementById("garageCars");
  const myNumbers = document.getElementById("myNumbers");
  const historyList = document.getElementById("historyList");

  // Mashinalar katalogi
  if (carShop) {
    carShop.replaceChildren();

    STARTER_CARS.forEach(function(car) {
      const card = document.createElement("div");
      card.className = "item";

      const title = document.createElement("h3");
      title.textContent = car.name;

      const price = document.createElement("p");
      price.textContent = formatCoins(car.price) + " 🪙";

      const button = document.createElement("button");
      button.textContent = "Sotib olish";
      button.onclick = function() {
        buyCar(car.id);
      };

      card.append(title, price, button);
      carShop.appendChild(card);
    });
  }

  // Raqamlar katalogi
  if (numberShop) {
    numberShop.replaceChildren();

    const text = document.createElement("p");
    text.textContent =
      "Raqam olish uchun Prokrutka bo‘limiga kiring.";

    numberShop.appendChild(text);
  }

  // Garajdagi mashinalar
  if (garageCars) {
    garageCars.replaceChildren();

    user.cars.forEach(function(car) {
      const card = document.createElement("div");
      card.className = "item";

      const title = document.createElement("h3");
      title.textContent = car.name;

      const price = document.createElement("p");
      price.textContent =
        "Xarid narxi: " + formatCoins(car.price) + " 🪙";

      const button = document.createElement("button");
      button.textContent = "Mashina sotish (70%)";
      button.onclick = function() {
        sellCar(car.id);
      };

      card.append(title, price, button);
      garageCars.appendChild(card);
    });
  }

  // Olingan raqamlar
  if (myNumbers) {
    myNumbers.replaceChildren();

    user.numbers.forEach(function(number) {
      const card = document.createElement("div");
      card.className = "item";

      const title = document.createElement("h3");
      title.textContent = number.plate;

      const price = document.createElement("p");
      price.textContent =
        number.rarity + " — " +
        formatCoins(number.price) + " 🪙";

      const button = document.createElement("button");
      button.textContent = "Raqamni sotish";
      button.onclick = function() {
        sellNumber(number.id);
      };

      card.append(title, price, button);
      myNumbers.appendChild(card);
    });
  }

  // Raqamlar tarixi
  if (historyList) {
    historyList.replaceChildren();

    user.history.forEach(function(item) {
      const row = document.createElement("p");

      row.textContent =
        item.plate + " — " +
        item.rarity + " — " +
        formatCoins(item.price) + " 🪙 — " +
        item.date;

      historyList.appendChild(row);
    });
  }
}

// ---------- SAYTNI ISHGA TUSHIRISH ----------
function initialize() {
  const session = currentSession();

  const authPanel = document.getElementById("authPanel");
  const gamePanel = document.getElementById("gamePanel");
  const adminNav = document.getElementById("adminNav");

  if (!authPanel || !gamePanel) {
    console.error(
      "NOMER X: HTML ichida #authPanel yoki #gamePanel topilmadi."
    );
    return;
  }

  if (!session) {
    authPanel.hidden = false;
    gamePanel.hidden = true;

    if (adminNav) adminNav.hidden = true;

    updateBalance();
    return;
  }

  if (session.admin) {
    authPanel.hidden = true;
    gamePanel.hidden = false;

    if (adminNav) adminNav.hidden = false;

    const playerName = document.getElementById("playerName");

    if (playerName) {
      playerName.textContent = "Admin";
    }

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

  if (adminNav) adminNav.hidden = true;

  updateBalance();
  renderGame();
  showTab("spinTab");
}

// Sahifa ochilganda ishga tushadi
initialize();