/* ============================================================
   Гусиная Рулетка — Mini App для Reply-кнопки.
   Связь с ботом: Telegram.WebApp.sendData() → web_app_data.
   Без HTTP API, без fetch.
   ============================================================ */

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();
tg?.setHeaderColor?.("#0f172a");

/* ---------- отправка данных боту ---------- */
function sendToBot(payload) {
  if (!tg?.sendData) {
    tg?.showAlert?.(
      "sendData недоступен. Откройте приложение кнопкой в боте."
    );
    return;
  }
  try {
    tg.sendData(JSON.stringify(payload));
    // Telegram сам закроет Mini App после вызова sendData
  } catch (e) {
    tg?.showAlert?.("Ошибка отправки: " + e.message);
  }
}

/* ---------- форматирование ---------- */
const fmt = n => Number(n).toFixed(2);

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}д ${h}ч`;
  if (h) return `${h}ч ${m}м`;
  return `${m}м`;
}

/* ---------- рендер ---------- */
function render(s) {
  document.getElementById("round-label").textContent =
    `Тираж #${s.round.number}`;

  document.getElementById("jackpot").textContent =
    fmt(s.jackpot.amount) + " гус.";

  document.getElementById("jackpot-hint").textContent =
    s.jackpot.rounds_since_payout >= 10
      ? "🔥 Розыгрыш в этом тираже!"
      : `Розыгрыш через ${s.jackpot.next_payout_in} тиражей`;

  document.getElementById("bank").textContent        = fmt(s.round.bank) + " гус.";
  document.getElementById("tickets-sold").textContent =
    `${s.round.tickets_sold} / ${s.round.max_tickets}`;
  document.getElementById("remaining").textContent =
    fmtTime(s.round.remaining_seconds);

  document.getElementById("progress-bar").style.width =
    Math.min(100, (s.round.tickets_sold / s.round.max_tickets) * 100) + "%";

  document.getElementById("balance").textContent     = fmt(s.user.balance) + " гус.";
  document.getElementById("my-tickets").textContent =
    `${s.user.tickets.length} / ${s.user.max_tickets}`;

  document.getElementById("seed-hash").textContent   = s.round.seed_hash;

  const tl = document.getElementById("ticket-list");
  tl.innerHTML = s.tickets.length
    ? s.tickets.map((t, i) =>
        `<div class="ticket">#${i + 1} — ${t.name}</div>`
      ).join("")
    : '<div class="empty">Билетов пока нет. Будьте первым!</div>';

  const btn  = document.getElementById("buy-btn");
  const hint = document.getElementById("hint");

  const soldOut = s.round.tickets_sold >= s.round.max_tickets;
  const userMax = s.user.tickets.length >= s.user.max_tickets;
  const broke   = s.user.balance < s.round.ticket_price;

  if (soldOut) {
    btn.disabled = true;
    btn.textContent = "Все билеты раскуплены";
    hint.textContent = "";
  } else if (userMax) {
    btn.disabled = true;
    btn.textContent = `У вас уже ${s.user.tickets.length} билет(а)`;
    hint.textContent = "";
  } else if (broke) {
    btn.disabled = true;
    btn.textContent = "Недостаточно средств";
    hint.textContent =
      `Нужно ${fmt(s.round.ticket_price)} гус. У вас: ${fmt(s.user.balance)}.`;
  } else {
    btn.disabled = false;
    btn.textContent = `🎟 Купить билет за ${fmt(s.round.ticket_price)} гус.`;
    hint.textContent = "";
  }
}

/* ---------- начальное состояние из URL ---------- */
function loadInitialState() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("state");

  if (!raw) {
    document.getElementById("hint").textContent =
      "Не удалось загрузить состояние. Вернитесь в бот и нажмите /lottery.";
    return false;
  }

  try {
    render(JSON.parse(decodeURIComponent(raw)));
    return true;
  } catch (e) {
    console.error("state parse error", e);
    document.getElementById("hint").textContent = "Ошибка разбора состояния.";
    return false;
  }
}

/* ---------- события ---------- */
document.getElementById("buy-btn").addEventListener("click", () => {
  sendToBot({ action: "buy_ticket" });
});

document.getElementById("refresh-btn").addEventListener("click", () => {
  sendToBot({ action: "get_state" });
});

document.getElementById("history-btn").addEventListener("click", () => {
  sendToBot({ action: "get_history" });
});

/* ---------- init ---------- */
const ok = loadInitialState();

// Если состояние пришло из URL, сразу включаем кнопки
if (ok) {
  document.getElementById("buy-btn").disabled = false;
}
