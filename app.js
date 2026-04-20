const intervalInput = document.getElementById("interval");
const intervalValue = document.getElementById("intervalValue");
const notifyToggle = document.getElementById("notifyToggle");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const remindNowBtn = document.getElementById("remindNowBtn");
const statusMessage = document.getElementById("statusMessage");
const countdownValue = document.getElementById("countdownValue");
const logList = document.getElementById("logList");
const clearLogBtn = document.getElementById("clearLogBtn");
const logItemTemplate = document.getElementById("logItemTemplate");

let remindersOn = false;
let notificationsEnabled = true;
let reminderTimer = null;
let countdownTimer = null;
let nextReminderAt = null;

const remindMessages = [
  "Hussle, your Doctor Strange fit is due for a glow-up.",
  "Time to swap skins and flex a new mystic look.",
  "Sorcerer style check: change that skin before queueing again.",
  "The multiverse requests a fresh Doctor Strange outfit."
];

function minutesToMs(minutes) {
  return Number(minutes) * 60 * 1000;
}

function formatCountdown(ms) {
  if (ms <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function pushLog(message) {
  const item = logItemTemplate.content.firstElementChild.cloneNode(true);
  const now = new Date();

  item.querySelector(".time").textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  item.querySelector(".msg").textContent = message;

  logList.prepend(item);
}

function pickMessage() {
  const index = Math.floor(Math.random() * remindMessages.length);
  return remindMessages[index];
}

function updateButtons() {
  startBtn.disabled = remindersOn;
  stopBtn.disabled = !remindersOn;
}

function updateCountdown() {
  if (!nextReminderAt) {
    countdownValue.textContent = "--:--";
    return;
  }

  const remaining = nextReminderAt - Date.now();
  countdownValue.textContent = formatCountdown(remaining);

  if (remaining <= 0) {
    nextReminderAt = null;
  }
}

function scheduleReminder() {
  const intervalMs = minutesToMs(intervalInput.value);
  nextReminderAt = Date.now() + intervalMs;

  clearTimeout(reminderTimer);
  reminderTimer = setTimeout(() => {
    sendReminder(false);
    if (remindersOn) {
      scheduleReminder();
    }
  }, intervalMs);
}

function maybeBrowserNotify(message) {
  if (!notificationsEnabled || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("Marvel Rivals Reminder", { body: message });
  }
}

function sendReminder(isManual) {
  const message = pickMessage();
  statusMessage.textContent = message;
  pushLog(`${isManual ? "Manual" : "Scheduled"}: ${message}`);
  maybeBrowserNotify(message);
}

async function requestNotificationPermissionIfNeeded() {
  if (!("Notification" in window) || Notification.permission !== "default") {
    return;
  }

  try {
    await Notification.requestPermission();
  } catch (error) {
    pushLog("Could not request notification permission in this browser.");
  }
}

function startReminders() {
  remindersOn = true;
  statusMessage.textContent = "Reminders started. Hussle will stay stylish.";
  pushLog(`Started reminders every ${intervalInput.value} minutes.`);
  updateButtons();
  scheduleReminder();

  clearInterval(countdownTimer);
  countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown();
}

function stopReminders() {
  remindersOn = false;
  nextReminderAt = null;
  clearTimeout(reminderTimer);
  clearInterval(countdownTimer);
  countdownValue.textContent = "--:--";
  statusMessage.textContent = "Reminders paused.";
  pushLog("Stopped reminders.");
  updateButtons();
}

intervalInput.addEventListener("input", () => {
  intervalValue.textContent = intervalInput.value;

  if (remindersOn) {
    scheduleReminder();
    statusMessage.textContent = `Interval updated to ${intervalInput.value} minutes.`;
    pushLog(`Updated interval to ${intervalInput.value} minutes.`);
  }
});

notifyToggle.addEventListener("click", async () => {
  notificationsEnabled = !notificationsEnabled;
  notifyToggle.textContent = notificationsEnabled ? "On" : "Off";
  notifyToggle.dataset.off = String(!notificationsEnabled);
  notifyToggle.setAttribute("aria-pressed", String(notificationsEnabled));
  pushLog(`Notifications ${notificationsEnabled ? "enabled" : "disabled"}.`);

  if (notificationsEnabled) {
    await requestNotificationPermissionIfNeeded();
  }
});

startBtn.addEventListener("click", async () => {
  await requestNotificationPermissionIfNeeded();
  startReminders();
});

stopBtn.addEventListener("click", stopReminders);

remindNowBtn.addEventListener("click", async () => {
  await requestNotificationPermissionIfNeeded();
  sendReminder(true);
});

clearLogBtn.addEventListener("click", () => {
  logList.textContent = "";
  pushLog("Log cleared.");
});

intervalValue.textContent = intervalInput.value;
updateButtons();
pushLog("App loaded. Ready when you are.");
