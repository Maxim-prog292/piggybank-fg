const TOTAL_COINS = 10;
const COIN_VALUE = 10;
const INACTIVITY_TIMEOUT = 60 * 1000;

const banks = [
  {
    id: "spend",
    title: "Трачу",
    caption: "Деньги на радость сегодня",
    color: "#3EBB78",
  },
  {
    id: "save",
    title: "Коплю",
    caption: "Деньги на мечту",
    color: "#005542",
  },
  {
    id: "help",
    title: "Помогаю",
    caption: "Деньги на доброе дело",
    color: "#3EBB78",
  },
];

const choices = {
  spend: [
    {
      id: "sweets",
      title: "Вкусняшки",
      text: "Конфеты или мороженое",
      price: 20,
      icon: "А",
    },
    {
      id: "toy",
      title: "Игрушка",
      text: "Игрушка или настольная игра",
      price: 50,
      icon: "Б",
    },
    {
      id: "book",
      title: "Книга",
      text: "Книга или раскраска",
      price: 30,
      icon: "В",
    },
  ],
  save: [
    {
      id: "bike",
      title: "Велосипед",
      text: "Или самокат для прогулок",
      price: 50,
      icon: "А",
    },
    {
      id: "gift",
      title: "Подарок",
      text: "Для друга или семьи",
      price: 30,
      icon: "Б",
    },
    {
      id: "dream",
      title: "Большая игрушка",
      text: "Настоящая мечта",
      price: 40,
      icon: "В",
    },
  ],
  help: [
    {
      id: "animals",
      title: "Животные",
      text: "Корм для бездомных животных",
      price: 40,
      icon: "А",
    },
    {
      id: "children",
      title: "Дети",
      text: "Подарок ребенку в детский дом",
      price: 30,
      icon: "Б",
    },
    {
      id: "school",
      title: "Школа",
      text: "Помощь в школе или классе",
      price: 20,
      icon: "В",
    },
  ],
};

const endings = {
  sweets: "вкусняшки",
  toy: "игрушку",
  book: "книгу",
  bike: "велосипед",
  gift: "подарок для близких",
  dream: "большую игрушку мечты",
  animals: "корм для животных",
  children: "подарок ребенку",
  school: "помощь школе или классу",
};

let currentScreen = "distribution";
let selectedCoin = null;
let inactivityTimer = 0;
let coinOwners = Array(TOTAL_COINS).fill(null);
let selectedChoices = { spend: null, save: null, help: null };
let dragState = null;

const app = document.querySelector(".app");
const screenTitle = document.getElementById("screenTitle");
const budgetLabel = document.getElementById("budgetLabel");
const storyText = document.getElementById("storyText");
const tipBox = document.getElementById("tipBox");
const coinTray = document.getElementById("coinTray");
const banksEl = document.getElementById("banks");
const choiceStage = document.getElementById("choiceStage");
const choiceGrid = document.getElementById("choiceGrid");
const summaryScreen = document.getElementById("summaryScreen");
const summaryCard = document.getElementById("summaryCard");
const summaryTitle = document.getElementById("summaryTitle");
const summaryLines = document.getElementById("summaryLines");
const summaryNote = document.getElementById("summaryNote");
const backButton = document.getElementById("backButton");
const mainButton = document.getElementById("mainButton");
const resetDistributionButton = document.getElementById(
  "resetDistributionButton",
);
const restartButton = document.getElementById("restartButton");
const messagePanel = document.getElementById("messagePanel");
const messageEyebrow = document.getElementById("messageEyebrow");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const messageButton = document.getElementById("messageButton");
const startPanel = document.getElementById("startPanel");
const startButton = document.getElementById("startButton");

function blockBrowserEvents() {
  ["contextmenu", "selectstart", "dragstart"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => event.preventDefault());
  });

  document.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener("keydown", (event) => {
    const blockedKeys = ["F5", "F11", "F12"];
    const blockedCombo =
      (event.ctrlKey || event.metaKey) &&
      ["a", "c", "p", "r", "s", "u", "+", "-", "0"].includes(
        event.key.toLowerCase(),
      );

    if (blockedKeys.includes(event.key) || blockedCombo) {
      event.preventDefault();
    }
  });
}

function fitApp() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  app.style.transform = `scale(${scale})`;
  app.style.marginLeft = `${(window.innerWidth - 1920 * scale) / 2}px`;
  app.style.marginTop = `${(window.innerHeight - 1080 * scale) / 2}px`;
}

function requestFullscreenMode() {
  // Полноэкранный режим задаёт музейная оболочка, а не первое касание посетителя.
}

function resetInactivityTimer() {
  window.clearTimeout(inactivityTimer);
  if (!startPanel.hidden) return;
  inactivityTimer = window.setTimeout(returnToStart, INACTIVITY_TIMEOUT);
}

function sumFor(bankId) {
  return coinOwners.filter((owner) => owner === bankId).length * COIN_VALUE;
}

function totalAssigned() {
  return coinOwners.filter(Boolean).length * COIN_VALUE;
}

function remainingMoney() {
  return TOTAL_COINS * COIN_VALUE - totalAssigned();
}

function bankHasAvailableChoice(bankId) {
  return choices[bankId].some((choice) => choice.price <= sumFor(bankId));
}

function bankTitleFor(bankId) {
  return banks.find((bank) => bank.id === bankId)?.title ?? "";
}

function hasBudgetIssues() {
  return banks.some((bank) => !selectedChoices[bank.id]);
}

function renderCoins() {
  coinTray.innerHTML = "";

  coinOwners.forEach((owner, index) => {
    const coin = document.createElement("button");
    coin.className = `coin${owner ? " assigned" : ""}${selectedCoin === index ? " selected" : ""}`;
    coin.textContent = "10 ₽";
    coin.dataset.index = index;
    coin.addEventListener("pointerdown", (event) =>
      startCoinPointer(event, index),
    );

    coinTray.append(coin);
  });
}

function renderBanks() {
  banksEl.innerHTML = "";

  banks.forEach((bank) => {
    const article = document.createElement("button");
    article.className = "bank";
    article.dataset.bank = bank.id;
    article.innerHTML = `
      <div class="bank-shape" style="--bank-color: ${bank.color}">
        <div class="bank-face" aria-hidden="true"><span></span><span></span></div>
      </div>
      <h2 class="bank-title">${bank.title}</h2>
      <p class="bank-count">${sumFor(bank.id)} ₽</p>
      <p class="bank-caption">${bank.caption}</p>
    `;

    article.addEventListener("click", () => assignSelectedCoin(bank.id));

    banksEl.append(article);
  });
}

function clearDropTargets() {
  document
    .querySelectorAll(".bank.drop-target")
    .forEach((bank) => bank.classList.remove("drop-target"));
}

function startCoinPointer(event, index) {
  if (currentScreen !== "distribution") return;

  requestFullscreenMode();
  resetInactivityTimer();
  event.preventDefault();

  // A previous pointer sequence can be interrupted by a very quick release,
  // window blur or a lost pointer capture. Never allow its ghost to survive.
  cleanupCoinPointer();

  const source = event.currentTarget;
  dragState = {
    index,
    source,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    ghost: null,
  };

  source.setPointerCapture?.(event.pointerId);
  document.addEventListener("pointermove", moveCoinPointer, true);
  document.addEventListener("pointerup", finishCoinPointer, true);
  document.addEventListener("pointercancel", cancelCoinPointer, true);
  source.addEventListener("lostpointercapture", cancelCoinPointer);
}

function moveCoinPointer(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;

  if (!dragState.moved && Math.hypot(dx, dy) < 10) return;

  if (!dragState.moved) {
    dragState.moved = true;
    dragState.source.classList.add("dragging-source");
    dragState.ghost = dragState.source.cloneNode(true);
    dragState.ghost.className = "coin coin-ghost";
    document.body.append(dragState.ghost);
  }

  dragState.ghost.style.left = `${event.clientX}px`;
  dragState.ghost.style.top = `${event.clientY}px`;

  const target = findBankAt(event.clientX, event.clientY);
  clearDropTargets();
  if (target) target.classList.add("drop-target");
}

function finishCoinPointer(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const state = dragState;
  const target = findBankAt(event.clientX, event.clientY);
  cleanupCoinPointer();

  if (state.moved && target) {
    moveCoin(state.index, target.dataset.bank);
  } else if (!state.moved) {
    selectCoin(state.index);
  } else {
    renderDistribution();
  }
}

function cancelCoinPointer(event) {
  if (
    event?.pointerId !== undefined &&
    dragState &&
    event.pointerId !== dragState.pointerId
  ) {
    return;
  }
  cleanupCoinPointer();
}

function cleanupCoinPointer() {
  if (dragState) {
    const { source, pointerId } = dragState;
    source.classList.remove("dragging-source");
    source.removeEventListener("lostpointercapture", cancelCoinPointer);
    try {
      if (source.hasPointerCapture?.(pointerId)) {
        source.releasePointerCapture(pointerId);
      }
    } catch {
      // The browser may already have released the pointer.
    }
  }

  document.removeEventListener("pointermove", moveCoinPointer, true);
  document.removeEventListener("pointerup", finishCoinPointer, true);
  document.removeEventListener("pointercancel", cancelCoinPointer, true);
  document
    .querySelectorAll(".coin-ghost")
    .forEach((ghost) => ghost.remove());
  dragState = null;
  clearDropTargets();
}

function findBankAt(x, y) {
  return document.elementFromPoint(x, y)?.closest?.(".bank");
}

function selectCoin(index) {
  requestFullscreenMode();
  resetInactivityTimer();

  if (coinOwners[index]) {
    coinOwners[index] = null;
    selectedCoin = null;
  } else {
    selectedCoin = selectedCoin === index ? null : index;
  }

  renderDistribution();
}

function assignSelectedCoin(bankId) {
  requestFullscreenMode();
  resetInactivityTimer();
  if (selectedCoin === null) return;
  moveCoin(selectedCoin, bankId);
}

function moveCoin(index, bankId) {
  if (Number.isNaN(index)) return;
  coinOwners[index] = bankId;
  selectedCoin = null;
  renderDistribution();
}

function renderDistribution() {
  cleanupCoinPointer();
  currentScreen = "distribution";
  app.classList.remove("focused-mode");
  selectedChoices = { spend: null, save: null, help: null };
  const isReady = remainingMoney() === 0;
  screenTitle.textContent = "У тебя есть деньги!";
  budgetLabel.textContent = `${remainingMoney()} ₽`;
  storyText.textContent =
    "Привет! У тебя есть 100 рублей. Ты можешь потратить их, отложить на мечту или помочь кому-то. Распредели все монетки по трем копилкам.";
  tipBox.textContent = isReady
    ? "Отлично: все монетки распределены. Можно идти дальше."
    : "Нажми на монетку и выбери копилку или перетащи монетку в копилку. Распредели все монетки.";
  coinTray.hidden = false;
  banksEl.hidden = false;
  choiceStage.hidden = true;
  summaryScreen.hidden = true;
  backButton.hidden = true;
  if (resetDistributionButton) resetDistributionButton.hidden = false;
  mainButton.hidden = false;
  mainButton.textContent = "Готово";
  mainButton.disabled = !isReady;
  renderCoins();
  renderBanks();
}

function renderChoice(bankId) {
  cleanupCoinPointer();
  currentScreen = bankId;
  app.classList.add("focused-mode");
  selectedCoin = null;

  const amount = sumFor(bankId);
  const titles = {
    spend: [
      "Отложенные деньги на траты",
      `Ты решил потратить ${amount} рублей.`,
    ],
    save: ["Отложенные деньги на будущее", `Ты отложил ${amount} рублей.`],
    help: [
      "Отложенные деньги на помощь",
      `Ты решил отдать ${amount} рублей на доброе дело.`,
    ],
  };

  screenTitle.textContent = titles[bankId][0];
  budgetLabel.textContent = `${amount} ₽`;
  storyText.textContent = `${titles[bankId][1]} Выбери один вариант.`;
  tipBox.textContent =
    bankId === "save"
      ? "Если сейчас денег меньше цели, это все равно хороший старт: копить можно постепенно."
      : "Вариант попадет в твою личную финансовую историю.";

  coinTray.hidden = true;
  banksEl.hidden = true;
  choiceStage.hidden = false;
  summaryScreen.hidden = true;
  backButton.hidden = false;
  if (resetDistributionButton) resetDistributionButton.hidden = true;
  mainButton.hidden = false;
  choiceGrid.innerHTML = "";
  choiceGrid.className = "choice-grid";

  if (!bankHasAvailableChoice(bankId)) {
    renderBudgetWarningChoice(bankId);
    return;
  }

  mainButton.textContent = bankId === "help" ? "Показать итог" : "Дальше";
  mainButton.disabled = !selectedChoices[bankId];

  choices[bankId].forEach((choice) => {
    const card = document.createElement("button");
    const isUnavailable = choice.price > amount;
    card.className = `choice-card${selectedChoices[bankId]?.id === choice.id ? " selected" : ""}${isUnavailable ? " unavailable" : ""}`;
    card.innerHTML = `
      <div>
        <div class="choice-icon">${choice.icon}</div>
        <h2>${choice.title}</h2>
        <p>${choice.text}</p>
      </div>
      <div class="choice-price">${choice.price} ₽</div>
    `;
    card.addEventListener("click", () => chooseOption(bankId, choice));
    choiceGrid.append(card);
  });
}

function renderBudgetWarningChoice(bankId) {
  choiceGrid.className = "choice-grid budget-warning-grid";
  mainButton.textContent = "Продолжить";
  mainButton.disabled = false;

  const warning = document.createElement("section");
  warning.className = "budget-warning-card";
  warning.innerHTML = `
    <p class="message-eyebrow">${bankTitleFor(bankId)}</p>
    <h2>${sumFor(bankId) === 0 ? "Ты на это не откладывал" : "Неграмотное распределение бюджета"}</h2>
    <p>
      ${budgetWarningText(bankId)}
      В следующий раз будь внимательнее к распределению бюджета.
    </p>
    <button class="primary" type="button">Распределить заново</button>
  `;

  warning.querySelector("button").addEventListener("click", resetDistribution);
  choiceGrid.append(warning);
}

function budgetWarningText(bankId) {
  if (sumFor(bankId) === 0) {
    return "В этот раз ты не сможешь потратить деньги на эту категорию, потому что совсем ничего на нее не отложил.";
  }

  return "В этот раз ты не сможешь потратить деньги на эту категорию: ты отложил немного, но этого ни на что не хватило.";
}

function chooseOption(bankId, choice) {
  requestFullscreenMode();
  resetInactivityTimer();

  if (choice.price > sumFor(bankId)) {
    showMessage(
      "Не хватает",
      "Ты на это не откладывал",
      "Для этого варианта нужно больше денег в этой копилке. Выбери то, на что хватает сейчас.",
      null,
    );
    return;
  }

  selectedChoices[bankId] = choice;
  renderChoice(bankId);

  if (bankId === "save" && choice.price > sumFor("save")) {
    showMessage(
      "Хороший старт",
      "Мечта любит привычку",
      "Чтобы накопить на это, нужно откладывать регулярно. У тебя уже есть начало!",
      null,
    );
  }
}

function nextScreen() {
  requestFullscreenMode();
  resetInactivityTimer();

  if (currentScreen === "distribution") {
    renderChoice("spend");
  } else if (currentScreen === "spend") {
    renderChoice("save");
  } else if (currentScreen === "save") {
    renderChoice("help");
  } else if (currentScreen === "help") {
    renderSummary();
  }
}

function goBack() {
  requestFullscreenMode();
  resetInactivityTimer();

  if (currentScreen === "spend") renderDistribution();
  if (currentScreen === "save") renderChoice("spend");
  if (currentScreen === "help") renderChoice("save");
  if (currentScreen === "summary") renderChoice("help");
}

function renderSummary() {
  cleanupCoinPointer();
  currentScreen = "summary";
  app.classList.remove("focused-mode");
  const spend = selectedChoices.spend;
  const save = selectedChoices.save;
  const help = selectedChoices.help;
  const hasIssues = hasBudgetIssues();

  screenTitle.textContent = "Твой финансовый итог";
  budgetLabel.textContent = "100 ₽";
  storyText.textContent = hasIssues
    ? "Вот что получилось из твоих первых денег. Не все категории сработали: где-то денег не хватило или их совсем не было."
    : "Вот какая история получилась из твоих первых денег.";
  tipBox.textContent = hasIssues
    ? "Можно начать заново и распределить бюджет внимательнее."
    : "Можно начать заново и попробовать другой путь.";
  coinTray.hidden = true;
  banksEl.hidden = true;
  choiceStage.hidden = true;
  summaryScreen.hidden = false;
  backButton.hidden = true;
  if (resetDistributionButton) resetDistributionButton.hidden = true;
  mainButton.hidden = true;
  summaryTitle.textContent = hasIssues
    ? "Бюджет распределен не удачно"
    : "100 рублей распределены с умом";
  summaryNote.textContent = hasIssues
    ? "Важно не просто разложить все деньги, а заранее подумать, хватит ли их на твои цели."
    : "Ты научился главному: деньги можно тратить с умом, копить на мечту и помогать другим.";

  summaryLines.innerHTML = [
    summaryLineFor("spend", spend),
    summaryLineFor("save", save),
    summaryLineFor("help", help),
  ].join("");
}

function summaryLineFor(bankId, choice) {
  const amount = sumFor(bankId);

  if (!choice) {
    const reason =
      amount === 0
        ? "ты совсем ничего сюда не отложил"
        : "ты отложил деньги, но их не хватило ни на один вариант";
    return `<div class="summary-line warning">Категория «${bankTitleFor(bankId)}» не получилась: ${reason}. В следующий раз будь внимательнее к распределению бюджета.</div>`;
  }

  if (bankId === "spend") {
    return `<div class="summary-line">Ты потратил ${amount} рублей на ${endings[choice.id]}.</div>`;
  }

  if (bankId === "save") {
    return `<div class="summary-line">Отложил ${amount} рублей на ${endings[choice.id]}.</div>`;
  }

  return `<div class="summary-line">И помог ${amount} рублями: выбрал ${endings[choice.id]}.</div>`;
}

function showMessage(eyebrow, title, text, callback) {
  messageEyebrow.textContent = eyebrow;
  messageTitle.textContent = title;
  messageText.textContent = text;
  messagePanel.hidden = false;
  messageButton.onclick = () => {
    messagePanel.hidden = true;
    if (callback) callback();
  };
}

function restartGame() {
  coinOwners = Array(TOTAL_COINS).fill(null);
  selectedChoices = { spend: null, save: null, help: null };
  selectedCoin = null;
  cleanupCoinPointer();
  messagePanel.hidden = true;
  renderDistribution();
}

function resetDistribution() {
  coinOwners = Array(TOTAL_COINS).fill(null);
  selectedChoices = { spend: null, save: null, help: null };
  selectedCoin = null;
  cleanupCoinPointer();
  messagePanel.hidden = true;
  renderDistribution();
}

function returnToStart() {
  restartGame();
}

startButton?.addEventListener("click", () => {
  requestFullscreenMode();
  restartGame();
  startPanel.hidden = true;
  resetInactivityTimer();
});

mainButton?.addEventListener("click", nextScreen);
backButton?.addEventListener("click", goBack);
resetDistributionButton?.addEventListener("click", resetDistribution);
restartButton?.addEventListener("click", restartGame);
document.addEventListener("pointerdown", requestFullscreenMode, { once: true });
["pointerdown", "pointermove", "keydown"].forEach((eventName) => {
  document.addEventListener(eventName, resetInactivityTimer);
});
window.addEventListener("resize", fitApp);
window.addEventListener("blur", cleanupCoinPointer);
window.addEventListener("pagehide", cleanupCoinPointer);
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && startPanel.hidden) {
    setTimeout(requestFullscreenMode, 200);
  }
});

blockBrowserEvents();
fitApp();
renderDistribution();
startPanel.hidden = true;
startPanel.remove();
window.ExhibitUI?.mount({ timeout: INACTIVITY_TIMEOUT, reset: restartGame });
resetInactivityTimer();
