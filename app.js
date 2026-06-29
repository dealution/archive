const STORAGE_KEY = "project-life-state-v2";
const TIMER_RUNTIME_KEY = "archive-timer-runtime-v2";
const STATE_DB_NAME = "archive-durable-state-v2";
const STATE_DB_STORE = "state";
const STATE_DB_KEY = "current";
const LEGACY_STORAGE_KEYS = ["project-life-state-v1", "archive-timer-runtime-v1"];
const LEGACY_DATABASES = ["archive-durable-state"];
const RELEASE_NOTICE_VERSION = 76;
const RELEASE_NOTICE_KEY = `archive-release-seen-v${RELEASE_NOTICE_VERSION}`;
const NOTE_LIMITS = Object.freeze({
  reminder: 80,
  future: 80,
  habit: 120,
  compact: 72,
  standard: 120
});
const STARTUP_SNAPSHOT_DAYS = 120;
const ARCHIVE_PAGE_SIZE = 52;
const HISTORY_PAGE_SIZE = 60;
const MASTERED_SKILL_VISIBLE_DAYS = 30;
const DEFAULT_HABITS = [];
const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const EVERY_DAY = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const BODY_FIELDS = [
  { key: "height", label: "HEIGHT", unit: "cm" },
  { key: "weight", label: "WEIGHT", unit: "kg" },
  { key: "bodyFat", label: "BODY FAT", unit: "%" },
  { key: "neck", label: "NECK", unit: "cm" },
  { key: "shoulders", label: "SHOULDERS", unit: "cm" },
  { key: "waist", label: "WAIST", unit: "cm" },
  { key: "chest", label: "CHEST", unit: "cm" },
  { key: "hips", label: "HIPS", unit: "cm" },
  { key: "arm", label: "ARM", unit: "cm" },
  { key: "forearm", label: "FOREARM", unit: "cm" },
  { key: "thigh", label: "THIGH", unit: "cm" },
  { key: "calf", label: "CALF", unit: "cm" }
];
const BODY_INPUT_IDS = {
  height: "body-height",
  weight: "body-weight",
  bodyFat: "body-fat",
  neck: "body-neck",
  shoulders: "body-shoulders",
  waist: "body-waist",
  chest: "body-chest",
  hips: "body-hips",
  arm: "body-arm",
  forearm: "body-forearm",
  thigh: "body-thigh",
  calf: "body-calf"
};
const BODY_SUMMARY_KEYS = ["weight", "bodyFat", "plans"];
const FOCUS_SUMMARY_KEYS = ["projects", "today", "income"];
const HOME_GROUP_KEYS = ["commitment", "restraint"];
const ARCHIVE_AREA_KEYS = ["archiveDays", "archiveRoutines", "archiveReviews"];
const HOME_TAB_KEYS = ["journal", "archive", "body", "focus"];
const AREA_GROUP_KEYS = {
  body: ["bodyWorkouts", "bodyMetrics", "bodyPrs", "bodyCalories"],
  focus: ["focusProjects", "focusSkills", "focusLogs", "focusReview"],
  archive: [...ARCHIVE_AREA_KEYS]
};
const AREA_TAB_KEYS = {
  body: { workouts: "bodyWorkouts", metrics: "bodyMetrics", prs: "bodyPrs", calories: "bodyCalories" },
  focus: { projects: "focusProjects", skills: "focusSkills", logs: "focusLogs", review: "focusReview" },
  archive: { days: "archiveDays", routines: "archiveRoutines", reviews: "archiveReviews" }
};
const PR_MOVEMENTS = {
  calisthenics: ["Pull-up", "Dip", "Push-up", "Muscle-up", "Handstand push-up", "Pistol squat"],
  weights: ["Bench press", "Squat", "Deadlift", "Overhead press", "Barbell row", "Weighted pull-up"]
};
const dateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const limitedText = (value, limit) => String(value || "").trim().slice(0, limit);

const initialState = {
  habits: DEFAULT_HABITS.map((name, index) => ({ id: `starter-${index}`, name, note: "", type: "commitment", days: [...EVERY_DAY], targetCount: 1 })),
  completions: {},
  completionCounts: {},
  restraintFailures: {},
  journal: {},
  reminders: [],
  timeLogs: {},
  dayRecords: {},
  libraryPlacements: {},
  libraryPlacementVersion: 5,
  body: { workoutPlans: [], metrics: [], calories: [], prs: { calisthenics: [], weights: [] } },
  focus: { projects: [], logs: [], skills: [] },
  settings: {
    intro: true,
    motion: true,
    explanatoryText: true,
    theme: "violet",
    colorVividness: "balanced",
    gradientStrength: "balanced",
    editMode: false,
    startScreen: "home",
    bodyModel: true,
    bodyFrame: "male",
    calorieTarget: 0,
    calorieMaintenance: 0,
    bodyFields: BODY_FIELDS.map((field) => field.key),
    bodySummaryVisibility: { weight: true, bodyFat: true, plans: true },
    focusSummaryVisibility: { projects: true, today: true, income: true },
    homeGroupVisibility: { commitment: true, restraint: true },
    homeGroupOrder: [...HOME_GROUP_KEYS],
    areaVisibility: {
      bodyWorkouts: true,
      bodyMetrics: true,
      bodyPrs: true,
      bodyCalories: true,
      focusProjects: true,
      focusLogs: true,
      focusSkills: true,
      focusReview: true,
      archiveDays: true,
      archiveRoutines: true,
      archiveReviews: true
    },
    areaOrder: {
      body: [...AREA_GROUP_KEYS.body],
      focus: [...AREA_GROUP_KEYS.focus],
      archive: [...AREA_GROUP_KEYS.archive]
    },
    tabVisibility: { journal: true, archive: true, timer: true, body: true, focus: true },
    tabOrder: [...HOME_TAB_KEYS]
  }
};

function normalizeOrder(order, allowed) {
  const valid = Array.isArray(order) ? order.filter((key, index) => allowed.includes(key) && order.indexOf(key) === index) : [];
  return [...valid, ...allowed.filter((key) => !valid.includes(key))];
}

function normalizeBodySummaryVisibility(value = {}) {
  const visibility = { ...initialState.settings.bodySummaryVisibility, ...(value || {}) };
  if (!BODY_SUMMARY_KEYS.some((key) => visibility[key] !== false)) visibility.weight = true;
  return visibility;
}

function normalizeFocusSummaryVisibility(value = {}) {
  const visibility = { ...initialState.settings.focusSummaryVisibility, ...(value || {}) };
  if (!FOCUS_SUMMARY_KEYS.some((key) => visibility[key] !== false)) visibility.projects = true;
  return visibility;
}

function normalizeHomeGroupVisibility(value = {}) {
  const visibility = { ...initialState.settings.homeGroupVisibility, ...(value || {}) };
  if (!HOME_GROUP_KEYS.some((key) => visibility[key] !== false)) visibility.commitment = true;
  return visibility;
}

function purgeLegacyPersistence() {
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  if ("indexedDB" in globalThis) {
    LEGACY_DATABASES.forEach((name) => {
      try {
        indexedDB.deleteDatabase(name);
      } catch {
        // The new storage namespace remains isolated even if legacy deletion is unavailable.
      }
    });
  }
}

purgeLegacyPersistence();
const timerRuntime = loadTimerRuntime();
let state = loadState();
let currentScreen = "home";
let toastTimer;
let focusDuration = Math.max(0, Number(timerRuntime.focusDuration) || 0);
let focusEndAt = Math.max(0, Number(timerRuntime.focusEndAt) || 0);
let focusRunning = Boolean(timerRuntime.focusRunning && focusEndAt > Date.now());
let focusRemaining = timerRuntime.focusRunning && !focusRunning
  ? 0
  : focusRunning
    ? Math.max(0, Math.ceil((focusEndAt - Date.now()) / 1000))
    : Math.max(0, Number(timerRuntime.focusRemaining) || focusDuration);
let focusInterval;
let focusSessionSaved = false;
let trackStartedAt = Math.max(0, Number(timerRuntime.trackStartedAt) || 0);
let trackRunning = Boolean(timerRuntime.trackRunning && trackStartedAt);
let trackSeconds = trackRunning
  ? Math.max(0, Math.floor((Date.now() - trackStartedAt) / 1000))
  : Math.max(0, Number(timerRuntime.trackSeconds) || 0);
let trackInterval;
let editingHabitId = null;
let editingWorkoutId = null;
let editingBodyMetricId = null;
let editingProjectId = null;
let editingFocusLogId = null;
let editingSkillId = null;
let editingCalorieMealId = null;
let editingCalorieActivityId = null;
let currentArchiveTab = "days";
let archiveSearchQuery = "";
let currentArchiveWeek = "";
let currentReviewMonth = "";
let currentBodyTab = "workouts";
let currentFocusTab = "logs";
let currentConfigTab = "general";
let archiveWeekLimit = ARCHIVE_PAGE_SIZE;
let bodyHistoryLimit = HISTORY_PAGE_SIZE;
let focusHistoryLimit = HISTORY_PAGE_SIZE;
let archiveSearchTimer;
let durableStorageReady = false;
let startupSnapshotTimer;
let durableWriteTimer;
let durableDbPromise;
let archiveWeekKeyCache = null;
const archiveSearchIndexCache = new Map();
let archiveSearchWarmTimer;
let screenTransitionTimer;
let archiveTransitionTimer;
let libraryOpenTimer;
let themeColorFrame;
let configLoadingTimer;
let overscrollFrame;
let modalLockActive = false;
let modalScrollY = 0;
let suppressHabitMoveClickUntil = 0;
let habitDragState = null;
let layoutTabPressOrder = [];
let layoutAreaPressOrder = { body: [], focus: [], archive: [] };
let layoutHomeGroupPressOrder = [];
const scrambleTimers = new Map();
const pulseTimers = new WeakMap();
const formSubmitTimes = new WeakMap();
const customSelectRegistry = new WeakMap();
const SCRAMBLE_SYMBOLS = "01._-+";

function masteredTimestamp(skill) {
  if (Number.isFinite(Number(skill?.masteredAt))) return Number(skill.masteredAt);
  if (Number(skill?.progress) < 100) return null;
  const completedEntry = [...(skill?.progressHistory || [])].reverse().find((entry) => Number(entry?.value) >= 100);
  const timestamp = completedEntry?.date ? new Date(completedEntry.date).getTime() : Date.now();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const loaded = {
      ...structuredClone(initialState),
      ...saved,
      settings: { ...initialState.settings, ...(saved?.settings || {}) }
    };
    loaded.dayRecords = loaded.dayRecords || {};
    loaded.reminders = Array.isArray(loaded.reminders)
      ? loaded.reminders.filter((reminder) => reminder?.date && reminder?.text).map((reminder, index) => ({
        id: String(reminder.id || `legacy-reminder-${index}`),
        text: String(reminder.text).slice(0, NOTE_LIMITS.reminder),
        date: String(reminder.date),
        createdAt: Number(reminder.createdAt) || Date.now()
      }))
      : [];
    loaded.completionCounts = loaded.completionCounts || {};
    loaded.libraryPlacements = saved?.libraryPlacementVersion === 5 ? (loaded.libraryPlacements || {}) : {};
    loaded.libraryPlacementVersion = 5;
    loaded.restraintFailures = loaded.restraintFailures || {};
    loaded.body = {
      workoutPlans: Array.isArray(loaded.body?.workoutPlans)
        ? loaded.body.workoutPlans.map((plan, index) => ({
          id: String(plan?.id || `legacy-plan-${index}`),
          name: String(plan?.name || "Untitled plan"),
          details: String(plan?.details || ""),
          updatedAt: plan?.updatedAt || new Date().toISOString()
        }))
        : [],
      metrics: Array.isArray(loaded.body?.metrics)
        ? loaded.body.metrics.filter((metric) => metric?.date).map((metric, index) => ({
          ...metric,
          id: String(metric.id || `legacy-metric-${index}`),
          note: String(metric.note || ""),
          ...Object.fromEntries(BODY_FIELDS.map(({ key }) => [
            key,
            metric[key] === "" || metric[key] == null || !Number.isFinite(Number(metric[key])) ? null : Number(metric[key])
          ]))
        }))
        : [],
      calories: Array.isArray(loaded.body?.calories)
        ? loaded.body.calories.filter((entry) => entry?.date).map((entry, index) => normalizeCalorieEntry(entry, index))
        : [],
      prs: {
        calisthenics: Array.isArray(loaded.body?.prs?.calisthenics)
          ? loaded.body.prs.calisthenics.map((entry, index) => normalizePrEntry(entry, index, "calisthenics"))
          : [],
        weights: Array.isArray(loaded.body?.prs?.weights)
          ? loaded.body.prs.weights.map((entry, index) => normalizePrEntry(entry, index, "weights"))
          : []
      }
    };
    loaded.focus = {
      projects: Array.isArray(loaded.focus?.projects)
        ? loaded.focus.projects.map((project, index) => ({
          id: String(project?.id || `legacy-project-${index}`),
          name: String(project?.name || "Untitled project"),
          outcome: String(project?.outcome || ""),
          status: ["active", "waiting", "complete"].includes(project?.status) ? project.status : "active",
          updatedAt: project?.updatedAt || new Date().toISOString()
        }))
        : [],
      logs: Array.isArray(loaded.focus?.logs)
        ? loaded.focus.logs.filter((log) => log?.date).map((log, index) => ({
          id: String(log?.id || `legacy-focus-log-${index}`),
          date: String(log.date),
          projectId: String(log?.projectId || ""),
          projectName: String(log?.projectName || ""),
          skillId: String(log?.skillId || ""),
          skillName: String(log?.skillName || ""),
          output: String(log?.output || ""),
          note: String(log?.note || ""),
          focusMinutes: Number.isFinite(Number(log?.focusMinutes)) ? Math.max(0, Number(log.focusMinutes)) : 0,
          income: Number.isFinite(Number(log?.income)) ? Math.max(0, Number(log.income)) : 0
        }))
        : [],
      skills: Array.isArray(loaded.focus?.skills)
        ? loaded.focus.skills.map((skill, index) => ({
          id: String(skill?.id || `legacy-skill-${index}`),
          name: String(skill?.name || "Untitled skill"),
          progress: Number.isFinite(Number(skill?.progress)) ? Math.min(100, Math.max(0, Number(skill.progress))) : 0,
          note: String(skill?.note || ""),
          progressHistory: Array.isArray(skill?.progressHistory) && skill.progressHistory.length
            ? skill.progressHistory.map((entry) => ({
              value: Math.min(100, Math.max(0, Number(entry?.value) || 0)),
              date: String(entry?.date || dateKey())
            }))
            : [{ value: Number.isFinite(Number(skill?.progress)) ? Math.min(100, Math.max(0, Number(skill.progress))) : 0, date: dateKey() }],
          masteredAt: masteredTimestamp(skill)
        }))
        : []
    };
    loaded.settings.tabVisibility = {
      ...initialState.settings.tabVisibility,
      ...(loaded.settings.tabVisibility || {})
    };
    delete loaded.settings.tabVisibility.library;
    loaded.settings.bodyFields = Array.isArray(loaded.settings.bodyFields)
      ? BODY_FIELDS.map((field) => field.key).filter((key) => loaded.settings.bodyFields.includes(key))
      : [...initialState.settings.bodyFields];
    loaded.settings.bodySummaryVisibility = normalizeBodySummaryVisibility(loaded.settings.bodySummaryVisibility);
    loaded.settings.focusSummaryVisibility = normalizeFocusSummaryVisibility(loaded.settings.focusSummaryVisibility);
    loaded.settings.homeGroupVisibility = normalizeHomeGroupVisibility(loaded.settings.homeGroupVisibility);
    loaded.settings.homeGroupOrder = normalizeOrder(loaded.settings.homeGroupOrder, HOME_GROUP_KEYS);
    loaded.settings.tabOrder = normalizeOrder(loaded.settings.tabOrder, HOME_TAB_KEYS);
    loaded.settings.areaOrder = {
      body: normalizeOrder(loaded.settings.areaOrder?.body, AREA_GROUP_KEYS.body),
      focus: normalizeOrder(loaded.settings.areaOrder?.focus, AREA_GROUP_KEYS.focus),
      archive: normalizeOrder(loaded.settings.areaOrder?.archive, AREA_GROUP_KEYS.archive)
    };
    loaded.settings.editMode = loaded.settings.editMode === true;
    loaded.settings.explanatoryText = loaded.settings.explanatoryText !== false;
    loaded.settings.bodyModel = loaded.settings.bodyModel !== false;
    loaded.settings.bodyFrame = loaded.settings.bodyFrame === "female" ? "female" : "male";
    loaded.settings.calorieTarget = Math.max(0, Number(loaded.settings.calorieTarget) || 0);
    loaded.settings.calorieMaintenance = Math.max(0, Number(loaded.settings.calorieMaintenance) || 0);
    if (loaded.settings.theme === "frost") loaded.settings.theme = "slate";
    if (!["violet", "deep", "ember", "slate"].includes(loaded.settings.theme)) loaded.settings.theme = "violet";
    if (loaded.settings.colorVividness === "extra") loaded.settings.colorVividness = "vivid";
    loaded.settings.colorVividness = ["soft", "balanced", "vivid"].includes(loaded.settings.colorVividness)
      ? loaded.settings.colorVividness
      : loaded.settings.signalImpact === "low"
        ? "soft"
        : loaded.settings.signalImpact === "high"
          ? "vivid"
          : "balanced";
    loaded.settings.gradientStrength = ["soft", "balanced", "strong"].includes(loaded.settings.gradientStrength)
      ? loaded.settings.gradientStrength
      : "balanced";
    delete loaded.settings.signalImpact;
    const legacyAreaVisibility = loaded.settings.areaVisibility || {};
    loaded.settings.areaVisibility = {
      ...initialState.settings.areaVisibility,
      ...legacyAreaVisibility
    };
    if (!("bodyPrs" in legacyAreaVisibility)) {
      loaded.settings.areaVisibility.bodyPrs = legacyAreaVisibility.bodyCalisthenics !== false || legacyAreaVisibility.bodyWeights !== false;
    }
    delete loaded.settings.areaVisibility.bodyCalisthenics;
    delete loaded.settings.areaVisibility.bodyWeights;
    loaded.settings.startScreen = ["home", "journal", "archive", "timer", "body", "focus"].includes(loaded.settings.startScreen)
      ? loaded.settings.startScreen
      : "home";
    loaded.habits = loaded.habits.map((habit) => ({
      ...habit,
      note: typeof habit.note === "string" ? habit.note : "",
      type: habit.type === "restraint" ? "restraint" : "commitment",
      days: Array.isArray(habit.days) && habit.days.length ? habit.days : [...EVERY_DAY],
      targetCount: Math.min(99, Math.max(1, Number(habit.targetCount) || 1))
    }));
    const bodyByDate = new Map(loaded.body.metrics.map((metric) => [metric.date, metric]));
    const caloriesByDate = new Map(loaded.body.calories.map((entry) => [entry.date, entry]));
    const focusByDate = new Map();
    loaded.focus.logs.forEach((log) => {
      if (!focusByDate.has(log.date)) focusByDate.set(log.date, []);
      focusByDate.get(log.date).push(log);
    });
    const activityKeys = new Set([
      ...Object.keys(loaded.completions || {}),
      ...Object.keys(loaded.restraintFailures || {}),
      ...Object.keys(loaded.journal || {}),
      ...Object.keys(loaded.timeLogs || {}),
      ...loaded.body.metrics.map((metric) => metric.date),
      ...loaded.body.calories.map((entry) => entry.date),
      ...(loaded.body.prs?.calisthenics || []).map((entry) => entry.date),
      ...(loaded.body.prs?.weights || []).map((entry) => entry.date),
      ...loaded.focus.logs.map((log) => log.date)
    ]);
    activityKeys.forEach((key) => {
      const completed = new Set(loaded.completions[key] || []);
      const restraintFailures = new Set(loaded.restraintFailures[key] || []);
      const journal = loaded.journal[key] || null;
      const logs = loaded.timeLogs[key] || [];
      const body = bodyByDate.get(key) || null;
      const calories = caloriesByDate.get(key) || null;
      const bodyPrs = [...(loaded.body.prs?.calisthenics || []), ...(loaded.body.prs?.weights || [])].filter((entry) => entry.date === key);
      const focus = focusByDate.get(key) || [];
      if (!completed.size && !restraintFailures.size && !hasJournalContent(journal) && !logs.length && !body && !calories && !bodyPrs.length && !focus.length) return;
      loaded.dayRecords[key] = {
        ...(loaded.dayRecords[key] || {}),
        checklist: loaded.dayRecords[key]?.checklist || loaded.habits.map((habit) => ({
          id: habit.id,
          name: habit.name,
          note: habit.note || "",
          completed: habitIsComplete(habit, completed, restraintFailures)
        })),
        journal: loaded.dayRecords[key]?.journal || (journal ? { ...journal } : null),
        body: body ? { ...body } : null,
        bodyPrs: bodyPrs.map((entry) => ({ ...entry })),
        calories: calories ? { ...calories } : null,
        focus: focus.map((log) => ({ ...log })),
        updatedAt: loaded.dayRecords[key]?.updatedAt || journal?.savedAt || new Date().toISOString()
      };
    });
    return loaded;
  } catch {
    return structuredClone(initialState);
  }
}

function loadTimerRuntime() {
  try {
    return JSON.parse(localStorage.getItem(TIMER_RUNTIME_KEY)) || {};
  } catch {
    return {};
  }
}

function saveTimerRuntime() {
  const focusHabitId = globalThis.document?.querySelector?.("#focus-habit")?.value || timerRuntime.focusHabitId || "";
  const trackHabitId = globalThis.document?.querySelector?.("#track-habit")?.value || timerRuntime.trackHabitId || "";
  try {
    localStorage.setItem(TIMER_RUNTIME_KEY, JSON.stringify({
      focusDuration,
      focusRemaining,
      focusRunning,
      focusEndAt,
      focusHabitId,
      trackSeconds,
      trackRunning,
      trackStartedAt,
      trackHabitId
    }));
  } catch {
    // Runtime persistence is optional; the active in-memory timer still works.
  }
}

function saveState({ configFeedback = false } = {}) {
  state.persistedAt = Date.now();
  if (configFeedback && currentScreen === "settings") showConfigLoading();
  if (!durableStorageReady) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      saveStartupSnapshot(state);
    }
    return;
  }
  clearTimeout(startupSnapshotTimer);
  startupSnapshotTimer = setTimeout(() => saveStartupSnapshot(state), 80);
  clearTimeout(durableWriteTimer);
  durableWriteTimer = setTimeout(() => writeDurableState(state), 700);
}

function datedObjectSince(source, cutoff) {
  return Object.fromEntries(Object.entries(source || {}).filter(([key]) => key >= cutoff));
}

function createStartupSnapshot(source) {
  const cutoffDate = new Date();
  cutoffDate.setHours(12, 0, 0, 0);
  cutoffDate.setDate(cutoffDate.getDate() - STARTUP_SNAPSHOT_DAYS);
  const cutoff = dateKey(cutoffDate);
  return {
    ...source,
    completions: datedObjectSince(source.completions, cutoff),
    completionCounts: datedObjectSince(source.completionCounts, cutoff),
    restraintFailures: datedObjectSince(source.restraintFailures, cutoff),
    journal: datedObjectSince(source.journal, cutoff),
    timeLogs: datedObjectSince(source.timeLogs, cutoff),
    dayRecords: datedObjectSince(source.dayRecords, cutoff),
    libraryPlacements: {},
    body: {
      ...source.body,
      metrics: source.body.metrics.filter((metric) => metric.date >= cutoff),
      prs: {
        calisthenics: (source.body.prs?.calisthenics || []).filter((entry) => entry.date >= cutoff),
        weights: (source.body.prs?.weights || []).filter((entry) => entry.date >= cutoff)
      }
    },
    focus: {
      ...source.focus,
      logs: source.focus.logs.filter((log) => log.date >= cutoff)
    }
  };
}

function saveStartupSnapshot(source) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createStartupSnapshot(source)));
  } catch {
    // IndexedDB remains the source of truth if even the startup snapshot cannot fit.
  }
}

function openStateDatabase() {
  if (!("indexedDB" in globalThis)) return Promise.reject(new Error("IndexedDB unavailable"));
  if (durableDbPromise) return durableDbPromise;
  durableDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(STATE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STATE_DB_STORE)) request.result.createObjectStore(STATE_DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return durableDbPromise;
}

async function readDurableState() {
  const db = await openStateDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STATE_DB_STORE, "readonly").objectStore(STATE_DB_STORE).get(STATE_DB_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function writeDurableState(source) {
  if (!durableStorageReady) return;
  const snapshot = structuredClone(source);
  const db = await openStateDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STATE_DB_STORE, "readwrite");
    transaction.objectStore(STATE_DB_STORE).put(snapshot, STATE_DB_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  }).catch(() => {});
}

async function initializeDurableStorage() {
  try {
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => false);
    const durableState = await readDurableState();
    durableStorageReady = true;
    if (durableState && (durableState.persistedAt || 0) >= (state.persistedAt || 0)) {
      state = mergeCurrentStateShape(durableState);
      archiveWeekKeyCache = null;
      archiveSearchIndexCache.clear();
      renderAll();
    } else {
      await writeDurableState(state);
    }
    saveStartupSnapshot(state);
    warmArchiveSearchIndex();
  } catch {
    durableStorageReady = false;
  }
}

function mergeCurrentStateShape(saved) {
  const normalized = {
    ...structuredClone(initialState),
    ...saved,
    habits: Array.isArray(saved.habits)
      ? saved.habits.map((habit) => ({
        ...habit,
        note: typeof habit?.note === "string" ? habit.note : "",
        type: habit?.type === "restraint" ? "restraint" : "commitment",
        days: Array.isArray(habit?.days) && habit.days.length ? habit.days : [...EVERY_DAY],
        targetCount: Math.min(99, Math.max(1, Number(habit?.targetCount) || 1))
      }))
      : structuredClone(initialState.habits),
    completions: saved.completions || {},
    completionCounts: saved.completionCounts || {},
    restraintFailures: saved.restraintFailures || {},
    journal: saved.journal || {},
    reminders: Array.isArray(saved.reminders)
      ? saved.reminders.filter((reminder) => reminder?.date && reminder?.text).map((reminder, index) => ({
        id: String(reminder.id || `legacy-reminder-${index}`),
        text: String(reminder.text).slice(0, 140),
        date: String(reminder.date),
        createdAt: Number(reminder.createdAt) || Date.now()
      }))
      : [],
    timeLogs: saved.timeLogs || {},
    dayRecords: saved.dayRecords || {},
    libraryPlacements: saved.libraryPlacements || {},
    body: {
      ...structuredClone(initialState.body),
      ...(saved.body || {}),
      workoutPlans: Array.isArray(saved.body?.workoutPlans) ? saved.body.workoutPlans : [],
      metrics: Array.isArray(saved.body?.metrics) ? saved.body.metrics : [],
      calories: Array.isArray(saved.body?.calories) ? saved.body.calories.map((entry, index) => normalizeCalorieEntry(entry, index)) : [],
      prs: {
        calisthenics: Array.isArray(saved.body?.prs?.calisthenics) ? saved.body.prs.calisthenics.map((entry, index) => normalizePrEntry(entry, index, "calisthenics")) : [],
        weights: Array.isArray(saved.body?.prs?.weights) ? saved.body.prs.weights.map((entry, index) => normalizePrEntry(entry, index, "weights")) : []
      }
    },
    focus: {
      ...structuredClone(initialState.focus),
      ...(saved.focus || {}),
      projects: Array.isArray(saved.focus?.projects) ? saved.focus.projects : [],
      logs: Array.isArray(saved.focus?.logs) ? saved.focus.logs : [],
      skills: Array.isArray(saved.focus?.skills) ? saved.focus.skills.map((skill, index) => ({
        id: String(skill?.id || `legacy-skill-${index}`),
        name: String(skill?.name || "Untitled skill"),
        progress: Math.min(100, Math.max(0, Number(skill?.progress) || 0)),
        note: String(skill?.note || ""),
        progressHistory: Array.isArray(skill?.progressHistory) && skill.progressHistory.length
          ? skill.progressHistory
          : [{ value: Math.min(100, Math.max(0, Number(skill?.progress) || 0)), date: dateKey() }],
        masteredAt: masteredTimestamp(skill)
      })) : []
    },
    settings: {
      ...structuredClone(initialState.settings),
      ...(saved.settings || {}),
      theme: saved.settings?.theme === "frost"
        ? "slate"
        : ["violet", "deep", "ember", "slate"].includes(saved.settings?.theme)
          ? saved.settings.theme
          : initialState.settings.theme,
      colorVividness: saved.settings?.colorVividness === "extra"
        ? "vivid"
        : ["soft", "balanced", "vivid"].includes(saved.settings?.colorVividness)
          ? saved.settings.colorVividness
        : saved.settings?.signalImpact === "low"
            ? "soft"
            : saved.settings?.signalImpact === "high"
              ? "vivid"
              : "balanced",
      gradientStrength: ["soft", "balanced", "strong"].includes(saved.settings?.gradientStrength)
        ? saved.settings.gradientStrength
        : "balanced",
      areaVisibility: { ...initialState.settings.areaVisibility, ...(saved.settings?.areaVisibility || {}) },
      bodySummaryVisibility: normalizeBodySummaryVisibility(saved.settings?.bodySummaryVisibility),
      focusSummaryVisibility: normalizeFocusSummaryVisibility(saved.settings?.focusSummaryVisibility),
      homeGroupVisibility: normalizeHomeGroupVisibility(saved.settings?.homeGroupVisibility),
      homeGroupOrder: normalizeOrder(saved.settings?.homeGroupOrder, HOME_GROUP_KEYS),
      tabVisibility: { ...initialState.settings.tabVisibility, ...(saved.settings?.tabVisibility || {}) },
      tabOrder: normalizeOrder(saved.settings?.tabOrder, HOME_TAB_KEYS),
      areaOrder: {
        body: normalizeOrder(saved.settings?.areaOrder?.body, AREA_GROUP_KEYS.body),
        focus: normalizeOrder(saved.settings?.areaOrder?.focus, AREA_GROUP_KEYS.focus),
        archive: normalizeOrder(saved.settings?.areaOrder?.archive, AREA_GROUP_KEYS.archive)
      }
    }
  };
  if (!("bodyPrs" in (saved.settings?.areaVisibility || {}))) {
    normalized.settings.areaVisibility.bodyPrs = saved.settings?.areaVisibility?.bodyCalisthenics !== false || saved.settings?.areaVisibility?.bodyWeights !== false;
  }
  delete normalized.settings.areaVisibility.bodyCalisthenics;
  delete normalized.settings.areaVisibility.bodyWeights;
  return normalized;
}

function hasJournalContent(entry) {
  return Boolean(entry?.body?.trim() || entry?.futureNote?.trim());
}

function isGeneratedDemoJournal(entry) {
  if (!entry) return false;
  const demoBodies = new Set([
    "Good momentum today. The important work felt easier once I started.",
    "Kept the plan simple and finished the main commitments.",
    "Energy was uneven, but I returned to the routine.",
    "A focused session made more difference than trying to do everything.",
    "Noticed what was distracting me and adjusted the environment.",
    "Quiet progress. Nothing dramatic, but the system held.",
    "Finished the week with a clearer idea of what matters next."
  ]);
  const demoFutureNotes = new Set([
    "Protect the first focused hour tomorrow.",
    "Keep the next step small and obvious."
  ]);
  const body = String(entry.body || "").trim();
  const futureNote = String(entry.futureNote || "").trim();
  return (!body || demoBodies.has(body)) && (!futureNote || demoFutureNotes.has(futureNote));
}

function syncDayRecord(key = dateKey(), options = {}) {
  archiveWeekKeyCache = null;
  archiveSearchIndexCache.delete(key);
  const completed = new Set(state.completions[key] || []);
  const completionCounts = state.completionCounts?.[key] || {};
  const restraintFailures = new Set(state.restraintFailures[key] || []);
  const journal = state.journal[key] || null;
  const body = state.body.metrics.find((metric) => metric.date === key) || null;
  const bodyPrs = allPrEntries().filter((entry) => entry.date === key);
  const calories = state.body.calories?.find((entry) => entry.date === key) || null;
  const focus = state.focus.logs.filter((log) => log.date === key);
  const logs = state.timeLogs[key] || [];
  const recordDate = new Date(`${key}T12:00:00`);
  const scheduledHabits = state.habits.filter((habit) => habitShowsOnDate(habit, recordDate));
  const hasCompletedCommitment = scheduledHabits.some((habit) => habit.type !== "restraint" && habitProgress(habit, completed, restraintFailures, completionCounts) > 0);
  const hasFailedRestraint = scheduledHabits.some((habit) => habit.type === "restraint" && restraintFailures.has(habit.id));
  const hasActivity = hasCompletedCommitment || hasFailedRestraint || hasJournalContent(journal) || logs.length || body || bodyPrs.length || calories || focus.length;

  state.dayRecords = state.dayRecords || {};
  const previousRecord = state.dayRecords[key] || {};
  const previousArchive = previousRecord.archive || {};
  const manuallySealed = options.manual === true || previousArchive.status === "sealed";
  const forceArchive = options.force === true || manuallySealed;
  if (!hasActivity && !forceArchive) {
    delete state.dayRecords[key];
    if (currentScreen === "library") requestAnimationFrame(renderLibrary);
    return false;
  }

  const capturedAt = new Date().toISOString();
  const signalSummary = archiveDaySignalSummary(key);
  state.dayRecords[key] = {
    checklist: scheduledHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      note: habit.note || "",
      type: habit.type,
      targetCount: habitTargetCount(habit),
      count: habitCountForDay(habit, completed, completionCounts, restraintFailures),
      progress: habitProgress(habit, completed, restraintFailures, completionCounts),
      completed: habitIsComplete(habit, completed, restraintFailures, completionCounts)
    })),
    journal: journal ? { ...journal } : null,
    body: body ? { ...body } : null,
    bodyPrs: bodyPrs.map((entry) => ({ ...entry })),
    calories: calories ? normalizeCalorieEntry(calories) : null,
    logs: logs.map((log) => ({ ...log })),
    focus: focus.map((log) => ({ ...log })),
    archive: {
      status: manuallySealed ? "sealed" : "auto",
      firstCapturedAt: previousArchive.firstCapturedAt || capturedAt,
      sealedAt: options.manual === true ? capturedAt : previousArchive.sealedAt || "",
      updatedAt: capturedAt,
      signalCount: signalSummary.total,
      mode: options.manual === true ? "manual" : manuallySealed ? "sealed-update" : "auto"
    },
    updatedAt: capturedAt
  };
  if (currentScreen === "library") requestAnimationFrame(renderLibrary);
  return true;
}

function archiveDaySignalSummary(key = dateKey()) {
  const recordDate = new Date(`${key}T12:00:00`);
  const completed = new Set(state.completions[key] || []);
  const completionCounts = state.completionCounts?.[key] || {};
  const restraintFailures = new Set(state.restraintFailures[key] || []);
  const scheduledHabits = state.habits.filter((habit) => habitShowsOnDate(habit, recordDate));
  const checkedHabits = scheduledHabits.filter((habit) => habitProgress(habit, completed, restraintFailures, completionCounts) > 0 || restraintFailures.has(habit.id)).length;
  const journal = state.journal[key] || null;
  const logs = state.timeLogs[key] || [];
  const body = state.body.metrics.find((metric) => metric.date === key) || null;
  const bodyPrs = allPrEntries().filter((entry) => entry.date === key);
  const calories = state.body.calories?.find((entry) => entry.date === key) || null;
  const normalizedCalories = calories ? normalizeCalorieEntry(calories) : null;
  const focus = state.focus.logs.filter((log) => log.date === key);
  const calorieTargetOnly = normalizedCalories && !normalizedCalories.meals.length && !normalizedCalories.activities.length && (normalizedCalories.targetKcal || normalizedCalories.maintenanceKcal) ? 1 : 0;
  const calorieSignals = normalizedCalories ? normalizedCalories.meals.length + normalizedCalories.activities.length + calorieTargetOnly : 0;
  const timeSeconds = logs.reduce((sum, log) => sum + Math.max(0, Number(log?.seconds) || 0), 0);
  const total = checkedHabits
    + (hasJournalContent(journal) ? 1 : 0)
    + logs.length
    + (body ? 1 : 0)
    + bodyPrs.length
    + calorieSignals
    + focus.length;
  return {
    key,
    checklist: checkedHabits,
    scheduled: scheduledHabits.length,
    journal: hasJournalContent(journal) ? 1 : 0,
    logs: logs.length,
    timeSeconds,
    body: body ? 1 : 0,
    prs: bodyPrs.length,
    meals: normalizedCalories?.meals.length || 0,
    activities: normalizedCalories?.activities.length || 0,
    calories: calorieSignals,
    focus: focus.length,
    total
  };
}

function archiveDaySummaryMarkup(summary) {
  const cells = [
    ["CHECKS", summary.checklist, `${summary.scheduled} scheduled`],
    ["JOURNAL", summary.journal, summary.journal ? "entry saved" : "no entry"],
    ["TIME", summary.logs, summary.timeSeconds ? formatTimer(summary.timeSeconds, true) : "no logs"],
    ["BODY", summary.body + summary.prs, summary.prs ? `${summary.prs} prs` : summary.body ? "check-in" : "no check-in"],
    ["KCAL", summary.calories, `${summary.meals} meals // ${summary.activities} activities`],
    ["FOCUS", summary.focus, summary.focus === 1 ? "output" : "outputs"]
  ];
  return cells.map(([label, value, note]) => `
    <span>
      <small>${label}</small>
      <strong>${value}</strong>
      <em>${note}</em>
    </span>
  `).join("");
}

function openDayArchiveDialog() {
  const dialog = document.querySelector("#day-archive-dialog");
  const title = document.querySelector("#day-archive-title");
  const copy = document.querySelector("#day-archive-copy");
  const summaryBox = document.querySelector("#day-archive-summary");
  if (!dialog || !summaryBox) return;
  const today = dateKey();
  const existing = state.dayRecords?.[today];
  const summary = archiveDaySignalSummary(today);
  title.textContent = existing?.archive?.status === "sealed" ? "Update today's archive?" : "Archive today?";
  copy.textContent = summary.total
    ? "This seals today into one archive book. If you add more today, the same book updates instead of duplicating."
    : "No signal is recorded yet. You can still create an empty sealed day, or let Archive autosave once you add something.";
  summaryBox.innerHTML = archiveDaySummaryMarkup(summary);
  showModalLocked(dialog);
  updateNavigationState();
  requestAnimationFrame(() => document.querySelector("#day-archive-confirm")?.focus({ preventScroll: true }));
}

function closeDayArchiveDialog() {
  const dialog = document.querySelector("#day-archive-dialog");
  closeModalUnlocked(dialog);
  updateNavigationState();
}

function archiveTodayManually() {
  const key = dateKey();
  const existed = Boolean(state.dayRecords?.[key]);
  const saved = syncDayRecord(key, { manual: true, force: true });
  if (!saved) {
    showToast("nothing archived");
    return;
  }
  saveState();
  closeDayArchiveDialog();
  renderHomeArchive();
  renderArchive();
  renderLibrary();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  const trigger = document.querySelector("#archive-day-open");
  confirmControl(trigger, existed ? "UPDATED" : "ARCHIVED");
  showToast(existed ? "today archive updated" : "today archived");
}

function habitShowsOnDate(habit, date = new Date()) {
  return (habit.days || EVERY_DAY).includes(DAY_IDS[date.getDay()]);
}

function habitsForDate(date = new Date()) {
  return state.habits.filter((habit) => habitShowsOnDate(habit, date));
}

function habitTargetCount(habit) {
  return Math.min(99, Math.max(1, Number(habit?.targetCount) || 1));
}

function habitCountForDay(habit, completed, completionCounts = {}, restraintFailures = new Set()) {
  const target = habitTargetCount(habit);
  const stored = Number(completionCounts?.[habit.id]);
  if (Number.isFinite(stored)) return Math.min(target, Math.max(0, stored));
  if (habit?.type === "restraint") {
    if (target === 1) return restraintFailures.has(habit.id) ? 0 : 1;
    return 0;
  }
  return completed.has(habit.id) ? target : 0;
}

function habitProgress(habit, completed, restraintFailures = new Set(), completionCounts = {}) {
  return habitCountForDay(habit, completed, completionCounts, restraintFailures) / habitTargetCount(habit);
}

function habitIsComplete(habit, completed, restraintFailures = new Set(), completionCounts = {}) {
  return habitProgress(habit, completed, restraintFailures, completionCounts) >= 1;
}

function habitById(id) {
  return state.habits.find((habit) => habit.id === id);
}

function habitTimeTotal(habit) {
  return Object.values(state.timeLogs).flat().reduce((total, log) => {
    return total + (log.habitId === habit.id || (!log.habitId && log.activity === habit.name) ? log.seconds : 0);
  }, 0);
}

function saveHabitTime(habitId, seconds, mode) {
  const habit = habitById(habitId);
  if (!habit || seconds < 1) return false;
  const today = dateKey();
  state.timeLogs[today] = state.timeLogs[today] || [];
  state.timeLogs[today].unshift({
    id: Date.now(),
    habitId: habit.id,
    activity: habit.name,
    seconds,
    mode
  });
  syncDayRecord(today);
  saveState();
  renderTimeLogs();
  if (currentArchiveTab === "routines") renderHabitSchedule();
  return true;
}

function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat("en", options).format(date);
}

function formatTimer(seconds, includeHours = false) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  if (includeHours) {
    return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
  }
  return [minutes + hours * 60, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatFocusTimer(seconds) {
  return formatTimer(seconds, focusDuration >= 3600);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function scrambleText(element, finalText, duration = 360) {
  if (!element) return;
  finishScramble(element);
  const text = String(finalText ?? "");
  if (element.children.length) return;
  if (!text) {
    element.textContent = text;
    return;
  }
  if (!state.settings.motion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = text;
    return;
  }

  const startedAt = Date.now();
  const characters = [...text];
  const tick = () => {
    if (!element.isConnected) {
      scrambleTimers.delete(element);
      return;
    }
    const progress = Math.min(1, (Date.now() - startedAt) / duration);
    const revealCount = Math.floor(progress * characters.length);
    element.textContent = characters.map((character, index) => {
      if (character === " " || index < revealCount) return character;
      return SCRAMBLE_SYMBOLS[Math.floor(Math.random() * SCRAMBLE_SYMBOLS.length)];
    }).join("");

    if (progress >= 1) {
      scrambleTimers.delete(element);
      element.textContent = text;
      return;
    }
    const frame = requestAnimationFrame(tick);
    scrambleTimers.set(element, { frame, finalText: text });
  };
  const frame = requestAnimationFrame(tick);
  scrambleTimers.set(element, { frame, finalText: text });
}

function finishScramble(element) {
  const active = scrambleTimers.get(element);
  if (!active) return;
  cancelAnimationFrame(active.frame);
  element.textContent = active.finalText;
  scrambleTimers.delete(element);
}

function finishAllScrambles() {
  [...scrambleTimers.keys()].forEach(finishScramble);
}

function pulseControl(element) {
  if (!element) return;
  clearTimeout(pulseTimers.get(element));
  element.classList.remove("action-pulse");
  requestAnimationFrame(() => element.classList.add("action-pulse"));
  const timer = setTimeout(() => {
    element.classList.remove("action-pulse");
    pulseTimers.delete(element);
  }, 420);
  pulseTimers.set(element, timer);
}

function preventImplicitSubmit(form) {
  form?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.target.matches("textarea")) return;
    event.preventDefault();
  });
}

function animateEditableValue(field, finalText, duration = 320) {
  if (!field) return;
  const text = String(finalText || "");
  if (!text || !state.settings.motion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    field.value = text;
    return;
  }
  const wasReadOnly = field.readOnly;
  field.readOnly = true;
  const startedAt = performance.now();
  const characters = [...text];
  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const reveal = Math.floor(progress * characters.length);
    field.value = characters.map((character, index) => {
      if (character === "\n" || character === " " || index < reveal) return character;
      return SCRAMBLE_SYMBOLS[Math.floor(Math.random() * SCRAMBLE_SYMBOLS.length)];
    }).join("");
    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }
    field.value = text;
    field.readOnly = wasReadOnly;
  };
  requestAnimationFrame(tick);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  scrambleText(toast, `> ${message}`, 440);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function releaseNoticeWasSeen() {
  try {
    return localStorage.getItem(RELEASE_NOTICE_KEY) === "seen";
  } catch {
    return false;
  }
}

function markReleaseNoticeSeen() {
  try {
    localStorage.setItem(RELEASE_NOTICE_KEY, "seen");
  } catch {
    // The notice can still close when private storage is unavailable.
  }
}

function showReleaseNotice() {
  if (releaseNoticeWasSeen()) return;
  const dialog = document.querySelector("#release-dialog");
  if (!dialog || dialog.open) return;
  if ([...document.querySelectorAll("dialog")].some((item) => item.open)) {
    setTimeout(showReleaseNotice, 520);
    return;
  }
  showModalLocked(dialog);
  requestAnimationFrame(() => dialog.classList.add("visible"));
}

function closeReleaseNotice() {
  const dialog = document.querySelector("#release-dialog");
  if (!dialog?.open) return;
  markReleaseNoticeSeen();
  dialog.classList.remove("visible");
  dialog.classList.add("closing");
  setTimeout(() => {
    closeModalUnlocked(dialog);
    dialog.classList.remove("closing");
  }, 240);
}

function showConfigLoading() {
  const indicator = document.querySelector("#config-loading");
  if (!indicator) return;
  indicator.classList.remove("saved");
  indicator.classList.add("show");
  indicator.firstChild.textContent = "LOADING";
  clearTimeout(configLoadingTimer);
  configLoadingTimer = setTimeout(() => {
    indicator.classList.add("saved");
    indicator.firstChild.textContent = "SAVED";
    configLoadingTimer = setTimeout(() => indicator.classList.remove("show", "saved"), 620);
  }, 260);
}

function confirmControl(button, confirmation = "SAVED", duration = 760) {
  if (!button) return;
  const original = button.dataset.restoreLabel || button.textContent;
  const originalHtml = button.dataset.restoreHtml || button.innerHTML;
  button.dataset.restoreLabel = original;
  button.dataset.restoreHtml = originalHtml;
  button.blur();
  button.classList.remove("action-confirmed");
  void button.offsetWidth;
  button.classList.add("action-confirmed");
  button.textContent = confirmation;
  setTimeout(() => {
    button.classList.remove("action-confirmed");
    button.innerHTML = button.dataset.restoreHtml || originalHtml;
    delete button.dataset.restoreLabel;
    delete button.dataset.restoreHtml;
    button.blur();
  }, duration);
}

function updateOverscrollGlow() {
  if (overscrollFrame) return;
  overscrollFrame = requestAnimationFrame(() => {
    overscrollFrame = null;
    const pull = Math.max(0, Math.min(120, -window.scrollY));
    document.documentElement.style.setProperty("--overscroll-light", (pull / 120).toFixed(3));
  });
}

function syncModalLock() {
  const hasOpenModal = [...document.querySelectorAll("dialog")].some((dialog) => dialog.open);
  if (hasOpenModal && !modalLockActive) {
    modalLockActive = true;
    modalScrollY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    document.body.style.top = `-${modalScrollY}px`;
    return;
  }
  if (!hasOpenModal && modalLockActive) {
    modalLockActive = false;
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    document.body.style.top = "";
    window.scrollTo({ top: modalScrollY, behavior: "auto" });
  }
}

function showModalLocked(dialog) {
  if (!dialog) return false;
  if (!dialog.open) dialog.showModal();
  syncModalLock();
  return true;
}

function closeModalUnlocked(dialog) {
  if (!dialog?.open) {
    syncModalLock();
    return;
  }
  dialog.close();
  syncModalLock();
  requestAnimationFrame(syncModalLock);
  setTimeout(syncModalLock, 0);
}

function updateNavigationState() {
  document.querySelectorAll("[data-screen]").forEach((button) => {
    const active = button.dataset.screen === currentScreen;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const archiveDialogOpen = Boolean(document.querySelector("#day-archive-dialog")?.open);
  const archiveAccess = document.querySelector("#archive-day-open");
  if (archiveAccess) {
    archiveAccess.classList.toggle("active", archiveDialogOpen);
    archiveAccess.setAttribute("aria-pressed", String(archiveDialogOpen));
  }
}

function blockModalBackgroundTouch(event) {
  if (!modalLockActive) return;
  const target = event.target;
  if (target instanceof Element && target.closest("dialog[open] .habit-editor-shell, dialog[open] .book-viewer-shell, dialog[open] .release-dialog-shell, dialog[open] .clear-data-shell, dialog[open] .day-archive-shell")) return;
  event.preventDefault();
}

function showScreen(name) {
  if (name === currentScreen) {
    if (name === "archive") renderArchive();
    if (name === "library") renderLibrary();
    if (name === "home") {
      renderHabits();
      renderHomeReminders();
      renderHomeArchive();
    }
    updateNavigationState();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  const oldScreen = document.querySelector(`[data-screen-name="${currentScreen}"]`);
  const nextScreen = document.querySelector(`[data-screen-name="${name}"]`);
  if (!nextScreen) return;
  if (name !== "library") {
    clearTimeout(libraryOpenTimer);
    libraryOpenTimer = null;
    document.querySelector("#archive-flight")?.classList.remove("active");
    document.body.classList.remove("archive-entering");
  }
  if (name === "library") renderLibrary();

  clearTimeout(screenTransitionTimer);
  finishAllScrambles();
  document.querySelectorAll(".screen.leaving").forEach((screen) => screen.classList.remove("leaving"));
  document.querySelectorAll(".screen.active").forEach((screen) => {
    if (screen !== oldScreen) screen.classList.remove("active");
  });
  oldScreen?.classList.remove("active");
  nextScreen.classList.add("active");

  currentScreen = name;
  document.querySelector("#top-screen-name").textContent = name === "settings"
    ? "CONFIGURATION"
    : name === "home"
      ? "CHECKLIST"
      : name.toUpperCase();
  updateNavigationState();

  if (name === "archive") renderArchive();
  if (name === "journal") renderJournal();
  if (name === "timer") renderTimeLogs();
  if (name === "body") renderBody();
  if (name === "focus") renderFocus();
  const screenTitle = nextScreen.querySelector("h1:not(.visually-hidden)");
  scrambleText(screenTitle, screenTitle?.textContent || "", 420);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function enterLibraryFromHome(origin) {
  if (currentScreen !== "home") {
    showScreen("library");
    return;
  }
  if (!state.settings.motion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showScreen("library");
    return;
  }
  const flight = document.querySelector("#archive-flight");
  if (!flight || flight.classList.contains("active")) return;
  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  flight.style.setProperty("--portal-x", `${x}px`);
  flight.style.setProperty("--portal-y", `${y}px`);
  clearTimeout(archiveTransitionTimer);
  clearTimeout(libraryOpenTimer);
  document.body.classList.add("archive-entering");
  flight.classList.remove("active");
  void flight.offsetWidth;
  flight.classList.add("active");
  libraryOpenTimer = setTimeout(() => {
    libraryOpenTimer = null;
    showScreen("library");
  }, 360);
  archiveTransitionTimer = setTimeout(() => {
    flight.classList.remove("active");
    document.body.classList.remove("archive-entering");
  }, 850);
}

function visibleHomeHabitTypes() {
  const visibility = normalizeHomeGroupVisibility(state.settings.homeGroupVisibility);
  state.settings.homeGroupVisibility = visibility;
  return new Set(HOME_GROUP_KEYS.filter((key) => visibility[key] !== false));
}

function homeHabitsForDate(date = new Date()) {
  const visibleTypes = visibleHomeHabitTypes();
  return habitsForDate(date).filter((habit) => visibleTypes.has(habit.type || "commitment"));
}

function renderHabits() {
  const today = dateKey();
  const completed = new Set(state.completions[today] || []);
  const completionCounts = state.completionCounts?.[today] || {};
  const restraintFailures = new Set(state.restraintFailures[today] || []);
  const list = document.querySelector("#habit-list");
  const todaysHabits = homeHabitsForDate();
  const visibleTypes = visibleHomeHabitTypes();
  const renderGroup = (type, title) => {
    if (!visibleTypes.has(type)) return "";
    const habits = todaysHabits.filter((habit) => habit.type === type);
    return `
      <li class="habit-group-label"><span>${title}</span><span>${habits.filter((habit) => habitIsComplete(habit, completed, restraintFailures, completionCounts)).length}/${habits.length}</span></li>
      ${habits.length ? habits.map((habit) => `
        <li class="habit-item ${habitIsComplete(habit, completed, restraintFailures, completionCounts) ? "completed" : ""} ${habitProgress(habit, completed, restraintFailures, completionCounts) > 0 ? "has-progress" : ""} ${habit.type === "restraint" ? "restraint-item" : ""}" data-habit-row="${habit.id}" style="--habit-fill:${Math.round(habitProgress(habit, completed, restraintFailures, completionCounts) * 100)}%">
          <button class="habit-check" data-habit-toggle="${habit.id}" aria-label="Toggle ${escapeHtml(habit.name)}">${habitTargetCount(habit) > 1 ? `<span>${habitCountForDay(habit, completed, completionCounts, restraintFailures)}/${habitTargetCount(habit)}</span>` : ""}</button>
          <span class="habit-copy">
            <span class="habit-name">${escapeHtml(habit.name)}</span>
            ${habit.note ? `<small class="habit-note">${escapeHtml(habit.note)}</small>` : ""}
          </span>
          <button class="habit-config" data-habit-config="${habit.id}" aria-label="Configure ${escapeHtml(habit.name)}">CFG</button>
          <button class="habit-remove" data-habit-remove="${habit.id}" aria-label="Remove ${escapeHtml(habit.name)}">DEL</button>
          <button class="habit-move habit-move-up" data-habit-move="${habit.id}" data-habit-direction="-1" aria-label="Move ${escapeHtml(habit.name)} up">↑</button>
          <button class="habit-move habit-move-down" data-habit-move="${habit.id}" data-habit-direction="1" aria-label="Move ${escapeHtml(habit.name)} down">↓</button>
        </li>
      `).join("") : '<li class="habit-group-empty">NO ITEMS SCHEDULED</li>'}
    `;
  };
  const groupOrder = normalizeOrder(state.settings.homeGroupOrder, HOME_GROUP_KEYS);
  state.settings.homeGroupOrder = groupOrder;
  list.innerHTML = groupOrder.map((type) => renderGroup(type, type === "commitment" ? "COMMITMENTS" : "RESTRAINTS")).join("")
    || '<li class="habit-group-empty">NO HOME SECTIONS VISIBLE</li>';

  const progressTotal = todaysHabits.reduce((sum, habit) => sum + habitProgress(habit, completed, restraintFailures, completionCounts), 0);
  const completeCount = todaysHabits.filter((habit) => habitIsComplete(habit, completed, restraintFailures, completionCounts)).length;
  const total = todaysHabits.length;
  const percent = total ? Math.round((progressTotal / total) * 100) : 0;
  document.querySelector("#habit-count").textContent = `${completeCount}/${total} COMPLETE`;
  document.querySelector("#completion-percent").textContent = `${percent}%`;
  const dial = document.querySelector("#completion-dial");
  dial.style.setProperty("--progress", percent);
  dial.style.setProperty("--remaining", `${100 - percent}%`);
  dial.setAttribute("aria-label", `${percent} percent complete`);
  renderCompletionSegments(todaysHabits, completed, restraintFailures, completionCounts);
  renderHomeState(percent);
  renderHomeGroupControl();
}

function renderHomeGroupControl() {
  const visibility = normalizeHomeGroupVisibility(state.settings.homeGroupVisibility);
  document.querySelectorAll("[data-home-group-visibility]").forEach((button) => {
    const active = visibility[button.dataset.homeGroupVisibility] !== false;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function toggleHomeGroupVisibility(key) {
  if (!state.settings.editMode || !HOME_GROUP_KEYS.includes(key)) return;
  const visibility = normalizeHomeGroupVisibility(state.settings.homeGroupVisibility);
  const visibleGroups = HOME_GROUP_KEYS.filter((item) => visibility[item] !== false);
  if (visibility[key] !== false && visibleGroups.length === 1) {
    showToast("keep at least one home section");
    return;
  }
  visibility[key] = visibility[key] === false;
  if (visibility[key]) {
    layoutHomeGroupPressOrder = [...layoutHomeGroupPressOrder.filter((item) => item !== key), key];
    state.settings.homeGroupOrder = normalizeOrder([
      ...layoutHomeGroupPressOrder,
      ...normalizeOrder(state.settings.homeGroupOrder, HOME_GROUP_KEYS)
    ], HOME_GROUP_KEYS);
  } else {
    layoutHomeGroupPressOrder = layoutHomeGroupPressOrder.filter((item) => item !== key);
  }
  state.settings.homeGroupVisibility = visibility;
  saveState();
  renderHabits();
  renderHomeArchive();
  showToast(`${key}s ${visibility[key] ? "shown" : "hidden"} // data preserved`);
}

function squarePerimeterPoint(distance) {
  const side = 46;
  const perimeter = side * 4;
  const d = ((distance % perimeter) + perimeter) % perimeter;
  if (d <= side) return [3 + d, 3];
  if (d <= side * 2) return [49, 3 + d - side];
  if (d <= side * 3) return [49 - (d - side * 2), 49];
  return [3, 49 - (d - side * 3)];
}

function squareSegmentPath(start, end) {
  const side = 46;
  const perimeter = side * 4;
  const points = [squarePerimeterPoint(start)];
  for (let corner = side; corner < perimeter; corner += side) {
    if (corner > start && corner < end) points.push(squarePerimeterPoint(corner));
  }
  points.push(squarePerimeterPoint(end));
  return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

function renderCompletionSegments(habits, completed, restraintFailures, completionCounts = {}) {
  const line = document.querySelector("#completion-progress-line");
  if (!line) return;
  const progress = habits.reduce((sum, habit) => sum + habitProgress(habit, completed, restraintFailures, completionCounts), 0);
  const percent = habits.length ? (progress / habits.length) * 100 : 0;
  line.style.strokeDashoffset = String(100 - percent);
}

function renderHomeState(percent) {
  const home = document.querySelector("#home-core");
  if (!home) return;
  const stage = percent === 100 ? "complete" : percent >= 60 ? "strong" : percent > 0 ? "active" : "quiet";
  home.dataset.stage = stage;
}

function animateHabitRow(id, duration = 420) {
  requestAnimationFrame(() => {
    const row = document.querySelector(`[data-habit-row="${id}"]`);
    scrambleText(row?.querySelector(".habit-name"), row?.querySelector(".habit-name")?.textContent || "", duration);
    const note = row?.querySelector(".habit-note");
    if (note) scrambleText(note, note.textContent, duration + 100);
  });
}

function toggleHabit(id) {
  const today = dateKey();
  const habit = habitById(id);
  if (!habit) return;
  const completed = new Set(state.completions[today] || []);
  const restraintFailures = new Set(state.restraintFailures[today] || []);
  state.completionCounts ||= {};
  state.completionCounts[today] ||= {};
  const completionCounts = state.completionCounts[today];
  const target = habitTargetCount(habit);
  if (habit.type === "restraint" && target === 1) {
    delete completionCounts[id];
    if (restraintFailures.has(id)) restraintFailures.delete(id);
    else restraintFailures.add(id);
  } else {
    const current = habitCountForDay(habit, completed, completionCounts, restraintFailures);
    const next = current >= target ? 0 : current + 1;
    completionCounts[id] = next;
    restraintFailures.delete(id);
    if (next >= target) completed.add(id);
    else completed.delete(id);
  }
  state.completions[today] = [...completed];
  state.restraintFailures[today] = [...restraintFailures];
  syncDayRecord(today);
  saveState();
  renderHabits();
  renderHomeArchive();
  const row = document.querySelector(`[data-habit-row="${id}"]`);
  row?.classList.add("habit-toggled");
  setTimeout(() => row?.classList.remove("habit-toggled"), 260);
  pulseControl(row);
}

function moveHabit(id, direction) {
  const index = state.habits.findIndex((habit) => habit.id === id);
  if (index < 0) return;
  const type = state.habits[index].type;
  let swapIndex = index + Math.sign(direction);
  while (swapIndex >= 0 && swapIndex < state.habits.length && state.habits[swapIndex].type !== type) {
    swapIndex += Math.sign(direction);
  }
  if (swapIndex < 0 || swapIndex >= state.habits.length) {
    showToast(direction < 0 ? "already at top" : "already at bottom");
    return;
  }
  [state.habits[index], state.habits[swapIndex]] = [state.habits[swapIndex], state.habits[index]];
  saveState();
  renderHabits();
  renderHomeArchive();
  if (currentArchiveTab === "routines") renderHabitSchedule();
  const row = document.querySelector(`[data-habit-row="${id}"]`);
  row?.classList.add("habit-reordered");
  setTimeout(() => row?.classList.remove("habit-reordered"), 360);
  pulseControl(row);
}

function commitHabitOrderFromDom() {
  const orderedIds = [...document.querySelectorAll("#habit-list [data-habit-row]")].map((row) => row.dataset.habitRow);
  if (!orderedIds.length) return;
  const orderedByType = new Map(HOME_GROUP_KEYS.map((type) => [
    type,
    orderedIds.filter((id) => habitById(id)?.type === type)
  ]));
  const indexes = new Map(HOME_GROUP_KEYS.map((type) => [type, 0]));
  const habitByKey = new Map(state.habits.map((habit) => [habit.id, habit]));
  state.habits = state.habits.map((habit) => {
    const ids = orderedByType.get(habit.type) || [];
    if (!ids.includes(habit.id)) return habit;
    const nextId = ids[indexes.get(habit.type) || 0];
    indexes.set(habit.type, (indexes.get(habit.type) || 0) + 1);
    return habitByKey.get(nextId) || habit;
  });
  saveState();
  renderHabits();
  renderHomeArchive();
  if (currentArchiveTab === "routines") renderHabitSchedule();
}

function beginHabitDrag(button, event) {
  if (!state.settings.editMode) return;
  const row = button.closest("[data-habit-row]");
  if (!row) return;
  const stateDraft = {
    id: row.dataset.habitRow,
    pointerId: event.pointerId,
    startY: event.clientY,
    active: false,
    timer: 0
  };
  stateDraft.timer = setTimeout(() => {
    stateDraft.active = true;
    row.classList.add("habit-dragging");
    document.querySelector("#habit-list")?.classList.add("habit-drag-active");
    navigator.vibrate?.(18);
  }, 380);
  habitDragState = stateDraft;
  try {
    button.setPointerCapture?.(event.pointerId);
  } catch {
    // Synthetic or interrupted pointers can disappear before capture; quick arrows still work.
  }
}

function updateHabitDrag(event) {
  if (!habitDragState || event.pointerId !== habitDragState.pointerId) return;
  if (!habitDragState.active && Math.abs(event.clientY - habitDragState.startY) > 8) {
    clearTimeout(habitDragState.timer);
  }
  if (!habitDragState.active) return;
  event.preventDefault();
  const row = document.querySelector(`[data-habit-row="${habitDragState.id}"]`);
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-habit-row]");
  if (!row || !target || target === row || habitById(target.dataset.habitRow)?.type !== habitById(habitDragState.id)?.type) return;
  const targetRect = target.getBoundingClientRect();
  target.parentElement.insertBefore(row, event.clientY > targetRect.top + targetRect.height / 2 ? target.nextSibling : target);
}

function finishHabitDrag(event) {
  if (!habitDragState || (event.pointerId != null && event.pointerId !== habitDragState.pointerId)) return;
  clearTimeout(habitDragState.timer);
  const wasActive = habitDragState.active;
  const row = document.querySelector(`[data-habit-row="${habitDragState.id}"]`);
  row?.classList.remove("habit-dragging");
  document.querySelector("#habit-list")?.classList.remove("habit-drag-active");
  habitDragState = null;
  if (wasActive) {
    suppressHabitMoveClickUntil = performance.now() + 500;
    commitHabitOrderFromDom();
    showToast("checklist order saved");
  }
}

function openHabitEditor(name = "", id = null) {
  const cleanName = name.trim();
  if (!cleanName) return;
  editingHabitId = id;
  const habit = id ? state.habits.find((item) => item.id === id) : null;
  document.querySelector("#habit-editor-title").textContent = habit ? "Edit habit" : "Configure habit";
  document.querySelector("#habit-editor-name").value = habit?.name || cleanName;
  document.querySelector("#habit-editor-note").value = habit?.note || "";
  document.querySelectorAll('input[name="habit-type"]').forEach((input) => {
    input.checked = input.value === (habit?.type || "commitment");
  });
  document.querySelectorAll('input[name="habit-day"]').forEach((input) => {
    input.checked = (habit?.days || EVERY_DAY).includes(input.value);
  });
  document.querySelector("#habit-editor-target").value = habitTargetCount(habit || { targetCount: 1 });
  document.activeElement?.blur();
  showModalLocked(document.querySelector("#habit-editor"));
  requestAnimationFrame(() => document.querySelector("#habit-editor-close").focus({ preventScroll: true }));
}

function saveHabitConfiguration() {
  const name = document.querySelector("#habit-editor-name").value.trim();
  const note = limitedText(document.querySelector("#habit-editor-note").value, NOTE_LIMITS.habit);
  const type = document.querySelector('input[name="habit-type"]:checked')?.value || "commitment";
  const targetCount = Math.min(99, Math.max(1, Number(document.querySelector("#habit-editor-target").value) || 1));
  const days = [...document.querySelectorAll('input[name="habit-day"]:checked')].map((input) => input.value);
  if (!name || !days.length) {
    showToast(days.length ? "habit needs a name" : "select at least one day");
    return false;
  }

  if (editingHabitId) {
    const habit = state.habits.find((item) => item.id === editingHabitId);
    Object.assign(habit, { name, note, type, days, targetCount });
  } else {
    editingHabitId = `${Date.now()}`;
    state.habits.push({ id: editingHabitId, name, note, type, days, targetCount });
  }

  syncDayRecord();
  saveState();
  renderHabits();
  renderHomeArchive();
  renderHabitSelectors();
  if (currentArchiveTab === "routines") renderHabitSchedule();
  animateHabitRow(editingHabitId, 480);
  pulseControl(document.querySelector(`[data-habit-row="${editingHabitId}"]`));
  showToast("habit saved");
  editingHabitId = null;
  return true;
}

function removeHabit(id) {
  state.habits = state.habits.filter((habit) => habit.id !== id);
  const today = dateKey();
  state.completions[today] = (state.completions[today] || []).filter((habitId) => habitId !== id);
  if (state.completionCounts?.[today]) delete state.completionCounts[today][id];
  state.restraintFailures[today] = (state.restraintFailures[today] || []).filter((habitId) => habitId !== id);
  syncDayRecord(today);
  saveState();
  renderHabits();
  renderHabitSelectors();
  renderHomeArchive();
  showToast("habit removed");
}

function shiftedDateKey(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function remindersForDate(key) {
  return (state.reminders || [])
    .filter((reminder) => reminder.date === key)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function renderHomeReminders() {
  const banner = document.querySelector("#today-reminder-banner");
  const dateInput = document.querySelector("#reminder-date");
  if (!banner || !dateInput) return;
  if (!dateInput.value) dateInput.value = shiftedDateKey(1);
  dateInput.min = dateKey();

  const today = dateKey();
  const yesterday = shiftedDateKey(-1);
  const todayReminders = remindersForDate(today);
  const carriedMessage = String(state.journal?.[yesterday]?.futureNote || "").trim();
  const bannerItems = [
    ...(carriedMessage ? [{ id: "journal-carryover", text: carriedMessage, source: "MESSAGE FROM YESTERDAY" }] : []),
    ...todayReminders.map((reminder) => ({ ...reminder, source: "TODAY'S REMINDER" }))
  ];
  banner.hidden = !bannerItems.length;
  banner.innerHTML = bannerItems.map((item, index) => `
    <article class="today-reminder-card">
      <span>${String(index + 1).padStart(2, "0")} // ${item.source}</span>
      <strong>${escapeHtml(item.text)}</strong>
      ${state.settings.editMode ? `<button class="terminal-action" type="button" ${item.id === "journal-carryover" ? "data-dismiss-carryover" : `data-reminder-remove="${item.id}"`}>DEL</button>` : ""}
    </article>
  `).join("");

}

function saveReminder() {
  const textInput = document.querySelector("#reminder-text");
  const dateInput = document.querySelector("#reminder-date");
  const text = limitedText(textInput.value, NOTE_LIMITS.reminder);
  const date = dateInput.value;
  if (!text || !date) {
    showToast(text ? "choose a reminder date" : "write the reminder");
    return;
  }
  state.reminders ||= [];
  state.reminders.push({ id: `${Date.now()}`, text, date, createdAt: Date.now() });
  saveState();
  textInput.value = "";
  dateInput.value = shiftedDateKey(1);
  renderHomeReminders();
  if (currentArchiveTab === "routines") renderHabitSchedule();
  confirmControl(document.querySelector("#reminder-save"), "REMINDER SET");
  showToast(`reminder set for ${date}`);
}

function removeReminder(id) {
  state.reminders = (state.reminders || []).filter((reminder) => reminder.id !== id);
  saveState();
  renderHomeReminders();
  if (currentArchiveTab === "routines") renderHabitSchedule();
  showToast("reminder removed");
}

function clearCarryoverMessage() {
  const yesterday = shiftedDateKey(-1);
  if (!state.journal?.[yesterday]) return;
  state.journal[yesterday].futureNote = "";
  syncDayRecord(yesterday);
  saveState();
  renderHomeReminders();
  showToast("message cleared");
}

function clearCurrentFutureNote() {
  const field = document.querySelector("#future-note");
  field.value = "";
  const entry = state.journal[dateKey()];
  if (entry) {
    entry.futureNote = "";
    syncDayRecord();
    saveState();
  }
  field.focus();
  showToast("tomorrow message cleared");
}

function renderJournal() {
  const today = dateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const storedTodayEntry = state.journal[today] || {};
  const storedPastEntry = state.journal[dateKey(yesterday)] || {};
  const todayEntry = isGeneratedDemoJournal(storedTodayEntry) ? {} : storedTodayEntry;
  const pastEntry = isGeneratedDemoJournal(storedPastEntry) ? {} : storedPastEntry;
  document.querySelector("#journal-body").value = todayEntry.body || "";
  document.querySelector("#future-note").value = todayEntry.futureNote || "";
  document.querySelector("#future-note-clear")?.classList.toggle("visible", state.settings.editMode && Boolean(todayEntry.futureNote));
  const pastNote = document.querySelector("#past-note");
  const futurePanel = document.querySelector("#future-panel");
  pastNote.textContent = pastEntry.futureNote || "";
  futurePanel.hidden = !pastEntry.futureNote;
  document.querySelector("#journal-date-label").textContent = formatDate(new Date(), { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
}

function saveJournal() {
  state.journal[dateKey()] = {
    body: document.querySelector("#journal-body").value.trim(),
    futureNote: limitedText(document.querySelector("#future-note").value, NOTE_LIMITS.future),
    savedAt: new Date().toISOString()
  };
  syncDayRecord();
  saveState();
  renderHomeArchive();
  const saveButton = document.querySelector("#journal-form .primary-button");
  saveButton.classList.add("entry-saved");
  scrambleText(document.querySelector("#journal-body-label"), "TODAY'S NOTES", 280);
  scrambleText(document.querySelector("#future-note-label"), "MESSAGE FOR TOMORROW", 280);
  scrambleText(saveButton, "SAVED", 240);
  setTimeout(() => {
    saveButton.classList.remove("entry-saved");
    scrambleText(saveButton, "SAVE ENTRY", 220);
  }, 620);
  showToast("journal entry saved");
}

function dayData(date) {
  const key = dateKey(date);
  const record = state.dayRecords?.[key];
  const completed = new Set(state.completions[key] || []);
  const failures = new Set(state.restraintFailures[key] || []);
  const counts = state.completionCounts?.[key] || {};
  const checklist = record?.checklist || habitsForDate(date).map((habit) => ({
    ...habit,
    count: habitCountForDay(habit, completed, counts, failures),
    targetCount: habitTargetCount(habit),
    progress: habitProgress(habit, completed, failures, counts),
    completed: habitIsComplete(habit, completed, failures, counts)
  }));
  const completedCount = checklist.reduce((sum, habit) => sum + (Number.isFinite(Number(habit.progress)) ? Number(habit.progress) : habit.completed ? 1 : 0), 0);
  const totalHabits = checklist.length;
  const entry = record?.journal || state.journal[key];
  const logs = state.timeLogs[key] || record?.logs || [];
  const trackedSeconds = logs.reduce((total, log) => total + log.seconds, 0);
  return {
    key,
    completedCount,
    totalHabits,
    entry,
    logs,
    trackedSeconds,
    checklist,
    body: record?.body || state.body.metrics.find((metric) => metric.date === key) || null,
    bodyPrs: record?.bodyPrs || allPrEntries().filter((entry) => entry.date === key),
    calories: record?.calories || state.body.calories?.find((entry) => entry.date === key) || null,
    focus: record?.focus || state.focus.logs.filter((log) => log.date === key),
    record
  };
}

function archivedDays() {
  return Object.keys(state.dayRecords || {})
    .sort()
    .map((key) => {
      const [year, month, day] = key.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return { date, ...dayData(date) };
    });
}

function archiveWeekCount() {
  return archiveWeekKeys().length;
}

function renderHomeArchive() {
  const container = document.querySelector("#home-mini-books");
  if (!container) return;
  const today = dateKey();
  const completed = new Set(state.completions[today] || []);
  const failures = new Set(state.restraintFailures[today] || []);
  const completionCounts = state.completionCounts?.[today] || {};
  const habits = homeHabitsForDate();
  const renderedIds = [...container.querySelectorAll("[data-memory-habit]")].map((book) => book.dataset.memoryHabit);
  if (renderedIds.join("|") !== habits.map((habit) => habit.id).join("|")) {
    const renderMiniBook = (habit, index) => {
        const seed = [...habit.id].reduce((total, character) => total + character.charCodeAt(0), index * 17);
        const width = 5 + (seed % 4);
        const height = 58 + (seed % 29);
        const lean = ((seed % 5) - 2) * 0.35;
        return `<i class="mini-book-upright" data-memory-habit="${habit.id}" style="--mini-width:${width}px;--mini-height:${height}%;--mini-lean:${lean}deg;--mini-delay:${index * 32}ms" title="${escapeHtml(habit.name)}"></i>`;
    };
    const clusters = habits.map((habit, index) => `<span class="mini-book-slot">${renderMiniBook(habit, index)}</span>`);
    container.classList.toggle("dense", habits.length > 18);
    container.style.setProperty("--mini-gap", `${habits.length > 30 ? 1 : habits.length > 20 ? 2 : 3}px`);
    container.innerHTML = habits.length
      ? clusters.join("")
      : '<span class="empty-shelf">NO HABITS TODAY</span>';
  }
  cancelAnimationFrame(container._archiveFrame);
  container._archiveFrame = requestAnimationFrame(() => {
    habits.forEach((habit, index) => {
      const book = container.querySelector(`[data-memory-habit="${habit.id}"]`);
      const progress = habitProgress(habit, completed, failures, completionCounts);
      book?.style.setProperty("--mini-delay", `${index * 56}ms`);
      book?.classList.toggle("has-entry", progress > 0);
      book?.classList.toggle("completed", progress >= 1);
      book?.style.setProperty("--mini-fill", `${Math.round(progress * 100)}%`);
      book?.style.setProperty("--mini-progress", progress.toFixed(3));
    });
  });
  const weeks = archiveWeekCount();
  document.querySelector("#home-archive-state").textContent = `${weeks} WEEK BOOKS`;
  document.querySelector("#home-journal-state").textContent = hasJournalContent(state.journal[dateKey()]) ? "ENTRY SAVED" : "WRITE TODAY";
}

function weekStartFor(date) {
  const start = new Date(date);
  start.setHours(12, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

function weekDays(weekKey) {
  const start = new Date(`${weekKey}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, ...dayData(date) };
  });
}

function archiveWeeks(days = archivedDays()) {
  const grouped = new Map();
  days.forEach((day) => {
    const key = dateKey(weekStartFor(day.date));
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(day);
  });
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, activeDays]) => ({
    key,
    activeDays,
    days: weekDays(key)
  }));
}

function archiveWeekKeys() {
  if (archiveWeekKeyCache) return archiveWeekKeyCache;
  archiveWeekKeyCache = [...new Set(Object.keys(state.dayRecords || {}).map((key) => {
    const date = new Date(`${key}T12:00:00`);
    return dateKey(weekStartFor(date));
  }))].sort();
  return archiveWeekKeyCache;
}

function archiveWeekFromKey(key) {
  const days = weekDays(key);
  return { key, activeDays: days.filter((day) => day.record), days };
}

function primaryMonthForWeek(week) {
  const monthCounts = new Map();
  week.days.filter((day) => day.record).forEach((day) => {
    const month = day.key.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  });
  if (monthCounts.size) {
    return [...monthCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  }
  return week.days[3]?.key.slice(0, 7) || week.key.slice(0, 7);
}

function archiveMonthShelves(weeks) {
  const months = new Map();
  weeks.forEach((week) => {
    const month = primaryMonthForWeek(week);
    if (!months.has(month)) months.set(month, []);
    months.get(month).push(week);
  });
  return [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, monthWeeks]) => ({ month, weeks: monthWeeks }));
}

const LIBRARY_WALLS = ["left", "back", "right"];
const LIBRARY_ROWS = 4;
const LIBRARY_SLOTS_PER_ROW = 16;
const LIBRARY_SHELF_CAPACITY = LIBRARY_WALLS.length * LIBRARY_ROWS * LIBRARY_SLOTS_PER_ROW;

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function assignLibraryPlacements(weeks) {
  state.libraryPlacements = state.libraryPlacements || {};
  const currentKeys = new Set(weeks.map((week) => week.key));
  const shelfKeys = new Set(weeks.slice(-LIBRARY_SHELF_CAPACITY).map((week) => week.key));
  const occupied = new Set();
  let changed = false;

  Object.keys(state.libraryPlacements).forEach((key) => {
    if (!currentKeys.has(key)) {
      delete state.libraryPlacements[key];
      changed = true;
    }
  });

  weeks.forEach((week) => {
    const placement = state.libraryPlacements[week.key];
    if (!shelfKeys.has(week.key)) {
      if (placement?.zone !== "reserve") {
        state.libraryPlacements[week.key] = { zone: "reserve" };
        changed = true;
      }
    } else if (placement?.zone === "shelf" && Number.isInteger(placement.slot) && placement.slot >= 0 && placement.slot < LIBRARY_SHELF_CAPACITY && !occupied.has(placement.slot)) {
      occupied.add(placement.slot);
    } else if (placement) {
      delete state.libraryPlacements[week.key];
      changed = true;
    }
  });

  weeks.forEach((week) => {
    if (!shelfKeys.has(week.key)) return;
    if (state.libraryPlacements[week.key]?.zone === "shelf") return;
    const hash = stableHash(week.key);
    if (occupied.size < LIBRARY_SHELF_CAPACITY) {
      let slot = hash % LIBRARY_SHELF_CAPACITY;
      while (occupied.has(slot)) slot = (slot + 1) % LIBRARY_SHELF_CAPACITY;
      occupied.add(slot);
      state.libraryPlacements[week.key] = { zone: "shelf", slot };
      changed = true;
    }
  });

  if (changed) saveState();
  return state.libraryPlacements;
}

function libraryWeekStats(week) {
  const activeDays = week.days.filter((day) => day.record);
  const total = activeDays.reduce((sum, day) => sum + day.totalHabits, 0);
  const completed = activeDays.reduce((sum, day) => sum + day.completedCount, 0);
  return {
    activeDays,
    percent: total ? Math.round((completed / total) * 100) : 0
  };
}

function libraryBookMarkup(week, placement, query = "") {
  const { activeDays, percent } = libraryWeekStats(week);
  const matchingDays = query ? week.days.filter((day) => archiveDayMatches(day, query)) : [];
  const hash = stableHash(week.key);
  const poseHash = stableHash(`${week.key}:pose`);
  const pose = poseHash % 7 === 0 ? "lean-left" : poseHash % 7 === 1 ? "lean-right" : "upright";
  const lean = pose === "lean-left" ? -2 : pose === "lean-right" ? 2 : 0;
  const style = `--book-height:${67 + (hash % 18)}%; --book-fill:${58 + (hash % 29)}%; --book-lean:${lean}deg; --book-depth:${2 + (hash % 2)}px; --book-tone:${9 + (hash % 7)}%;`;
  return `
    <button
      type="button"
      class="library-volume library-book shelf-book pose-${pose} ${week.days.some((day) => day.key === dateKey()) ? "today-book" : ""}"
      data-week-key="${week.key}"
      data-preferred-day="${matchingDays.at(-1)?.key || activeDays.at(-1)?.key || week.key}"
      style="${style}"
      aria-label="Open archived week ${week.key}"
      title="${week.key} // ${percent}% complete"
    >
      <span class="library-book-solid" aria-hidden="true">
        <i class="library-book-spine"></i>
        <i class="library-book-pages"></i>
        <i class="library-book-top"></i>
        <i class="library-book-side"></i>
      </span>
    </button>
  `;
}

function renderLibraryRoom(allWeeks, visibleWeeks, query = "") {
  const placements = assignLibraryPlacements(allWeeks);
  const visibleKeys = new Set(visibleWeeks.map((week) => week.key));
  const weekByKey = new Map(allWeeks.map((week) => [week.key, week]));
  const placedBySlot = new Map(Object.entries(placements)
    .filter(([key, placement]) => visibleKeys.has(key) && placement.zone === "shelf")
    .map(([key, placement]) => [placement.slot, key]));
  const shelfCount = allWeeks.filter((week) => placements[week.key]?.zone === "shelf").length;
  const reserveCount = allWeeks.length - shelfCount;
  const casesMarkup = LIBRARY_WALLS.map((wall, wallIndex) => `
    <section class="library-case library-case-${wall}" data-library-wall="${wall}" aria-label="${wall} archive bookcase">
      <div class="library-case-rows">
        ${Array.from({ length: LIBRARY_ROWS }, (_, row) => {
          const slots = Array.from({ length: LIBRARY_SLOTS_PER_ROW }, (_, column) => wallIndex * LIBRARY_ROWS * LIBRARY_SLOTS_PER_ROW + row * LIBRARY_SLOTS_PER_ROW + column);
          return `
            <div class="library-case-row" style="--shelf-row:${row}">
              <div class="library-row-books">
                ${slots.map((slot) => {
                  const key = placedBySlot.get(slot);
                  return `<span class="library-volume-slot">${key ? libraryBookMarkup(weekByKey.get(key), placements[key], query) : ""}</span>`;
                }).join("")}
              </div>
              <span class="library-shelf-solid" aria-hidden="true"><i></i><b></b></span>
            </div>
          `;
        }).join("")}
      </div>
      <span class="library-case-post post-left" aria-hidden="true"><i></i></span>
      <span class="library-case-post post-right" aria-hidden="true"><i></i></span>
      <span class="library-case-cap cap-top" aria-hidden="true"><i></i></span>
      <span class="library-case-cap cap-bottom" aria-hidden="true"><i></i></span>
    </section>
  `).join("");
  return `
    <div class="library-room ${query ? "searching" : ""}" data-shelved="${shelfCount}" data-reserve="${reserveCount}">
      <div class="library-chamber">
        <div class="library-ceiling-plane" aria-hidden="true"></div>
        ${casesMarkup}
        <div class="library-floor" aria-hidden="true"></div>
      </div>
    </div>
  `;
}

function archiveDayMatches(day, query) {
  if (!query) return true;
  const searchable = [
    day.key,
    formatDate(day.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    JSON.stringify(day.record || {}),
    JSON.stringify(day.logs || [])
  ].join(" ").toLowerCase();
  return searchable.includes(query);
}

function archiveKeyMatches(key, query) {
  if (!query) return true;
  return archiveSearchText(key).includes(query);
}

function archiveSearchText(key) {
  if (archiveSearchIndexCache.has(key)) return archiveSearchIndexCache.get(key);
  const date = new Date(`${key}T12:00:00`);
  const record = state.dayRecords?.[key] || {};
  const journal = record.journal || state.journal?.[key] || {};
  const logs = state.timeLogs?.[key] || record.logs || [];
  const body = record.body || {};
  const bodyPrs = record.bodyPrs || [];
  const calories = record.calories || state.body.calories?.find((entry) => entry.date === key) || {};
  const focus = record.focus || [];
  const searchable = [
    key,
    formatDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    ...(record.checklist || []).flatMap((habit) => [habit.name, habit.note, habit.type]),
    journal.body,
    journal.futureNote,
    ...logs.flatMap((log) => [log.activity, log.mode]),
    body.note,
    ...BODY_FIELDS.map(({ key: field }) => body[field]),
    ...bodyPrs.flatMap((entry) => [entry.movement, entry.value, entry.note]),
    calories.kcal,
    calories.protein,
    calories.note,
    ...(calories.meals || []).flatMap((meal) => [meal.name, meal.kcal, meal.protein, meal.note, meal.time]),
    ...(calories.activities || []).flatMap((activity) => [activity.name, activity.kcal, activity.note, activity.time]),
    ...focus.flatMap((log) => [log.projectName, log.skillName, log.output, log.note, log.focusMinutes, log.income])
  ].filter((value) => value !== null && value !== undefined && value !== "").join(" ").toLowerCase();
  archiveSearchIndexCache.set(key, searchable);
  return searchable;
}

function warmArchiveSearchIndex() {
  clearTimeout(archiveSearchWarmTimer);
  const keys = Object.keys(state.dayRecords || {});
  let index = 0;
  const warmChunk = () => {
    const end = Math.min(keys.length, index + 120);
    while (index < end) archiveSearchText(keys[index++]);
    if (index < keys.length) archiveSearchWarmTimer = setTimeout(warmChunk, 16);
  };
  archiveSearchWarmTimer = setTimeout(warmChunk, 120);
}

function renderArchive() {
  const records = Object.values(state.dayRecords || {});
  const completeDays = records.filter((record) => record.checklist?.length && record.checklist.every((habit) => habit.completed)).length;
  const journalDays = records.filter((record) => hasJournalContent(record.journal)).length;
  const totalSeconds = Object.values(state.timeLogs).reduce((total, logs) => total + logs.reduce((sum, log) => sum + log.seconds, 0), 0);
  document.querySelector("#archive-summary").innerHTML = `
    <div class="summary-cell"><strong>${completeDays}</strong><span>FULL DAYS</span></div>
    <div class="summary-cell"><strong>${journalDays}</strong><span>ENTRIES</span></div>
    <div class="summary-cell"><strong>${Math.round(totalSeconds / 3600)}H</strong><span>TRACKED</span></div>
  `;
  if (currentArchiveTab === "routines") renderHabitSchedule();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  if (currentArchiveTab !== "days") return;

  const query = archiveSearchQuery.trim().toLowerCase();
  const matchingWeekKeys = query
    ? [...new Set(Object.keys(state.dayRecords || {}).filter((key) => archiveKeyMatches(key, query)).map((key) => dateKey(weekStartFor(new Date(`${key}T12:00:00`)))) )].sort()
    : archiveWeekKeys();
  const visibleWeekKeys = matchingWeekKeys.slice(-archiveWeekLimit);
  const hiddenWeekCount = Math.max(0, matchingWeekKeys.length - visibleWeekKeys.length);
  const visibleWeeks = visibleWeekKeys.map(archiveWeekFromKey);
  const shelves = archiveMonthShelves(visibleWeeks);
  if (!shelves.length) {
    document.querySelector("#archive-list").innerHTML = `
      <div class="archive-empty">
        <strong>${query ? "NO MATCHING WEEKS" : "NO BOOKS RECORDED"}</strong>
        <p>${query ? "Try another word or date." : "Complete a habit or save an entry to create this week's book."}</p>
      </div>
    `;
    return;
  }
  document.querySelector("#archive-list").innerHTML = `
    <div class="archive-bookshelf">
      ${shelves.map((shelf, shelfIndex) => {
        const monthDate = new Date(`${shelf.month}-01T12:00:00`);
        const monthLabel = formatDate(monthDate, { month: "long", year: "numeric" }).toUpperCase();
        return `
        <section class="archive-shelf">
          <button class="shelf-review-marker" type="button" data-open-reviews data-review-month="${shelf.month}" aria-label="Open ${monthLabel} review">${formatDate(monthDate, { month: "short" }).toUpperCase()}<span>REVIEW</span></button>
          <div class="shelf-books" style="--shelf-week-count:${Math.max(1, shelf.weeks.length)}">
            ${shelf.weeks.map((week, bookIndex) => {
              const matchingDays = query ? week.days.filter((day) => archiveDayMatches(day, query)) : [];
              const { activeDays, percent } = libraryWeekStats(week);
              const hasSealedDay = week.days.some((day) => day.record?.archive?.status === "sealed");
              const archiveMode = hasSealedDay ? "SEALED" : activeDays.length ? "AUTO" : "";
              const end = week.days[6].date;
              return `
                <button type="button" class="archive-book weekly-book ${week.days.some((day) => day.key === dateKey()) ? "today-book" : ""} ${hasSealedDay ? "sealed-book" : activeDays.length ? "auto-book" : ""}" data-week-key="${week.key}" data-preferred-day="${matchingDays.at(-1)?.key || activeDays.at(-1)?.key || week.key}" style="--book-height:${184 + ((bookIndex * 17 + shelfIndex * 13) % 38)}px; --completion:${percent}%; --book-index:${bookIndex}" aria-label="Open archived week ${week.key}">
                  <span class="book-date">${formatDate(week.days[0].date, { month: "short", day: "numeric" }).toUpperCase()}—${formatDate(end, { month: "short", day: "numeric" }).toUpperCase()}</span>
                  <span class="book-page-marks">${week.days.map((day) => `<i class="${day.record ? "recorded" : ""} ${day.record?.archive?.status === "sealed" ? "sealed" : day.record ? "auto" : ""} ${query && archiveDayMatches(day, query) ? "matched" : ""}"></i>`).join("")}</span>
                  ${archiveMode ? `<span class="book-archive-mode">${archiveMode}</span>` : ""}
                  <span class="book-mark">WK.${String(Math.ceil(week.days[0].date.getDate() / 7)).padStart(2, "0")}</span>
                  <span class="book-score">${percent}% // ${activeDays.length}/7</span>
                </button>
              `;
            }).join("")}
          </div>
          <div class="shelf-edge"><span>${monthLabel}</span><span>${shelf.weeks.length} WEEK BOOK${shelf.weeks.length === 1 ? "" : "S"} // MONTH ARCHIVE ${String(shelfIndex + 1).padStart(2, "0")}</span></div>
        </section>
      `;}).join("")}
    </div>
    <div class="history-window">
      <span>SHOWING ${visibleWeeks.length} OF ${matchingWeekKeys.length} WEEK BOOKS</span>
      ${hiddenWeekCount ? `<button type="button" data-load-older-weeks>LOAD ${Math.min(ARCHIVE_PAGE_SIZE, hiddenWeekCount)} OLDER WEEKS</button>` : ""}
    </div>
    <p class="archive-key">ONE BOOK = ONE WEEK // SEVEN PAGE MARKS = SEVEN DAYS</p>
  `.replaceAll("\u00e2\u20ac\u201d", " - ");
}

function renderLibrary() {
  const stage = document.querySelector("#library-stage");
  if (!stage) return;
  const keys = archiveWeekKeys();
  const visibleKeys = new Set(keys.slice(-LIBRARY_SHELF_CAPACITY));
  const weeks = keys.map((key) => visibleKeys.has(key) ? archiveWeekFromKey(key) : { key, activeDays: [], days: [] });
  stage.innerHTML = renderLibraryRoom(weeks, weeks);
  stage.dataset.weekCount = String(keys.length);
}

function renderHabitSchedule() {
  const container = document.querySelector("#habit-schedule");
  if (!container) return;
  const habits = state.habits;
  const habitsMarkup = habits.length ? habits.map((habit) => `
    <article class="schedule-card">
      <header>
        <div><strong>${escapeHtml(habit.name)}</strong><small>${habit.type.toUpperCase()} // ${habitTargetCount(habit)}X DAILY // ${formatTimer(habitTimeTotal(habit), true)} TRAINED</small></div>
        <button data-habit-config="${habit.id}" type="button">CFG</button>
      </header>
      ${habit.note ? `<p class="schedule-note">${escapeHtml(habit.note)}</p>` : ""}
      <div class="schedule-days">
        ${EVERY_DAY.map((day) => `<span class="${habit.days.includes(day) ? "active" : ""}">${day.toUpperCase()}</span>`).join("")}
      </div>
    </article>
  `).join("") : `
    <div class="archive-empty">
      <strong>NO ROUTINES CONFIGURED</strong>
      <p>Create one from Home to see its weekly rhythm here.</p>
    </div>
  `;
  const reminders = [...(state.reminders || [])].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const remindersMarkup = `
    <section class="archive-reminder-schedule">
      <div class="panel-header"><span>REMINDERS</span><span>${reminders.length} SCHEDULED</span></div>
      ${reminders.length ? reminders.map((reminder) => `
        <article class="schedule-reminder">
          <span>${reminder.date}</span>
          <strong>${escapeHtml(reminder.text)}</strong>
          ${state.settings.editMode ? `<button class="terminal-action" type="button" data-reminder-remove="${reminder.id}">DEL</button>` : ""}
        </article>
      `).join("") : '<p class="schedule-reminder-empty">NO REMINDERS SCHEDULED</p>'}
    </section>
  `;
  container.innerHTML = habitsMarkup + remindersMarkup;
}

function significantPrSignals(month = "") {
  const bestByMovement = new Map();
  const signals = [];
  allPrEntries()
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)))
    .forEach((entry) => {
      const key = entry.movementKey || normalizeMovementKey(entry.movement);
      const previous = bestByMovement.get(key) || { reps: 0, weight: 0 };
      const repGain = Math.max(0, (entry.reps || 0) - previous.reps);
      const weightGain = Math.max(0, (entry.weight || 0) - previous.weight);
      if (repGain || weightGain) {
        signals.push({ ...entry, key, repGain, weightGain });
      }
      bestByMovement.set(key, {
        reps: Math.max(previous.reps, entry.reps || 0),
        weight: Math.max(previous.weight, entry.weight || 0)
      });
    });
  return signals
    .filter((entry) => !month || entry.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
}

function evenlySample(items, limit = 16) {
  if (items.length <= limit) return items;
  return Array.from({ length: limit }, (_, index) => items[Math.round((index / (limit - 1)) * (items.length - 1))]);
}

function reviewHistoryKeys() {
  return [
    ...Object.keys(state.dayRecords || {}),
    ...Object.keys(state.journal || {}),
    ...Object.keys(state.timeLogs || {}),
    ...state.body.metrics.map((entry) => entry.date),
    ...(state.body.calories || []).map((entry) => entry.date),
    ...allPrEntries().map((entry) => entry.date),
    ...state.focus.logs.map((entry) => entry.date)
  ].filter(Boolean).sort();
}

function renderWeeklyReviews() {
  const container = document.querySelector("#weekly-reviews");
  if (!container) return;
  const historyKeys = reviewHistoryKeys();
  const historyStart = historyKeys[0] || dateKey();
  const historyEnd = dateKey();
  const periodTitle = currentReviewMonth
    ? formatDate(new Date(`${currentReviewMonth}-01T12:00:00`), { month: "long", year: "numeric" }).toUpperCase()
    : "LIFETIME REVIEW";
  const periodRange = currentReviewMonth ? currentReviewMonth : `${historyStart} // ${historyEnd}`;
  const selectedKeys = currentReviewMonth
    ? archiveWeekKeys().filter((key) => {
      const end = new Date(`${key}T12:00:00`);
      end.setDate(end.getDate() + 6);
      return key.startsWith(currentReviewMonth) || dateKey(end).startsWith(currentReviewMonth);
    })
    : archiveWeekKeys();
  const weeks = selectedKeys.map(archiveWeekFromKey);
  const weightMetrics = [...state.body.metrics]
    .filter((metric) => metric.weight != null && (!currentReviewMonth || metric.date.startsWith(currentReviewMonth)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const firstWeight = weightMetrics[0]?.weight;
  const latestWeight = weightMetrics.at(-1)?.weight;
  const weightChange = firstWeight != null && latestWeight != null ? latestWeight - firstWeight : null;
  const recentWeights = weightMetrics;
  const recentCalories = [...(state.body.calories || [])]
    .filter((entry) => !currentReviewMonth || entry.date.startsWith(currentReviewMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
  const bodyTimeline = [...state.body.metrics]
    .filter((metric) => !currentReviewMonth || metric.date.startsWith(currentReviewMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
  const oldestBody = bodyTimeline[0];
  const newestBody = bodyTimeline.at(-1);
  const minWeight = recentWeights.length ? Math.min(...recentWeights.map((metric) => metric.weight)) : 0;
  const maxWeight = recentWeights.length ? Math.max(...recentWeights.map((metric) => metric.weight)) : 1;
  const minCalories = recentCalories.length ? Math.min(...recentCalories.map((entry) => entry.kcal)) : 0;
  const maxCalories = recentCalories.length ? Math.max(...recentCalories.map((entry) => entry.kcal)) : 1;
  const calorieGoalDays = recentCalories.filter((entry) => {
    const energy = calorieEnergy(entry);
    return energy.effectiveTarget && energy.consumed <= energy.effectiveTarget;
  }).length;
  const calorieOverMaintenance = recentCalories.filter((entry) => {
    const energy = calorieEnergy(entry);
    return energy.effectiveMaintenance && energy.consumed > energy.effectiveMaintenance;
  }).length;
  const calorieAverage = recentCalories.length ? Math.round(recentCalories.reduce((sum, entry) => sum + entry.kcal, 0) / recentCalories.length) : 0;
  const calorieBurnAverage = recentCalories.length ? Math.round(recentCalories.reduce((sum, entry) => sum + calorieEnergy(entry).burned, 0) / recentCalories.length) : 0;
  const calorieMaintenanceAverage = recentCalories.length ? Math.round(recentCalories.reduce((sum, entry) => sum + calorieEnergy(entry).effectiveMaintenance, 0) / recentCalories.length) : 0;
  const prSignals = significantPrSignals(currentReviewMonth);
  const lineGraph = (values, labels, min = 0, max = 100) => {
    if (!values.length) return "<p>NO SIGNAL YET.</p>";
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 92 - ((value - min) / range) * 78;
      return { x, y, value, label: labels[index] };
    });
    const signalPath = points.length < 2
      ? `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
      : points.reduce((path, point, index) => {
        if (!index) return `M${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        const previous = points[index - 1];
        const before = points[index - 2] || previous;
        const after = points[index + 1] || point;
        const control1X = previous.x + (point.x - before.x) / 6;
        const control1Y = previous.y + (point.y - before.y) / 6;
        const control2X = point.x - (after.x - previous.x) / 6;
        const control2Y = point.y - (after.y - previous.y) / 6;
        return `${path} C${control1X.toFixed(2)} ${control1Y.toFixed(2)} ${control2X.toFixed(2)} ${control2Y.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }, "");
    const areaPath = `${signalPath} L${points.at(-1).x.toFixed(2)} 96 L${points[0].x.toFixed(2)} 96 Z`;
    return `
      <div class="line-graph">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="line-grid" d="M0 25H100M0 50H100M0 75H100" />
          <path class="line-guides" d="${points.slice(1, -1).map((point) => `M${point.x.toFixed(2)} 12V92`).join("")}" />
          <path class="line-area" d="${areaPath}" />
          <path class="line-signal line-signal-echo" d="${signalPath}" />
          <path class="line-signal" d="${signalPath}" />
          ${points.map((point) => `<circle class="line-point" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="1.45" />`).join("")}
        </svg>
        <div class="line-labels">${points.map((point) => `<span><strong>${point.value}</strong><small>${point.label}</small></span>`).join("")}</div>
      </div>
    `;
  };
  const stats = weeks.map((week) => {
    const active = week.days.filter((day) => day.record && (!currentReviewMonth || day.key.startsWith(currentReviewMonth)));
    const total = active.reduce((sum, day) => sum + day.totalHabits, 0);
    const done = active.reduce((sum, day) => sum + day.completedCount, 0);
    const focusMinutes = active.reduce((sum, day) => sum + day.focus.reduce((minutes, log) => minutes + (log.focusMinutes || 0), 0), 0);
    const outputs = active.reduce((sum, day) => sum + day.focus.length, 0);
    return { week, completion: total ? Math.round((done / total) * 100) : 0, focusMinutes, outputs, habitSamples: total };
  });
  const chartStats = evenlySample(stats);
  const chartWeights = evenlySample(recentWeights);
  const chartCalories = evenlySample(recentCalories);
  const periodSkills = currentReviewMonth
    ? state.focus.skills.filter((skill) => (skill.progressHistory || []).some((entry) => String(entry.date || "").startsWith(currentReviewMonth)))
    : state.focus.skills;
  const totalOutputs = stats.reduce((sum, item) => sum + item.outputs, 0);
  const overviewCards = [
    weightMetrics.length ? `<div><span>WEIGHT CHANGE</span><strong>${weightChange == null ? "--" : `${weightChange >= 0 ? "+" : ""}${weightChange.toFixed(1)} KG`}</strong><small>${weightMetrics.length} CHECK-INS</small></div>` : "",
    periodSkills.length ? `<div><span>SKILL AVERAGE</span><strong>${Math.round(periodSkills.reduce((sum, skill) => sum + skill.progress, 0) / periodSkills.length)}%</strong><small>${periodSkills.length} SKILLS</small></div>` : "",
    totalOutputs ? `<div><span>${currentReviewMonth ? "MONTH OUTPUT" : "TOTAL OUTPUT"}</span><strong>${totalOutputs}</strong><small>${currentReviewMonth || `${stats.length} WEEKS`}</small></div>` : ""
  ].filter(Boolean);
  const consistencyStats = chartStats.filter((item) => item.habitSamples > 0);
  const reviewSections = [
    consistencyStats.length ? `
      <section class="panel review-graph">
        <div class="panel-header"><span>WEEKLY CONSISTENCY</span><span>${currentReviewMonth || `${consistencyStats.length} WEEKS WITH CHECKLIST DATA`}</span></div>
        ${lineGraph(consistencyStats.map((item) => item.completion), consistencyStats.map((item) => formatDate(item.week.days[0].date, { month: "short", day: "numeric" }).toUpperCase()), 0, 100)}
      </section>
    ` : "",
    chartWeights.length ? `
      <section class="panel review-graph">
        <div class="panel-header"><span>BODY WEIGHT TREND</span><span>${weightChange == null ? "NO CHANGE YET" : `${weightChange >= 0 ? "+" : ""}${weightChange.toFixed(1)} KG`}</span></div>
        ${lineGraph(chartWeights.map((metric) => metric.weight), chartWeights.map((metric) => metric.date.slice(5)), minWeight, maxWeight)}
      </section>
    ` : "",
    chartCalories.length ? `
      <section class="panel review-graph">
        <div class="panel-header"><span>KCAL INTAKE TREND</span><span>${recentCalories.at(-1).kcal} KCAL LATEST</span></div>
        ${lineGraph(chartCalories.map((entry) => entry.kcal), chartCalories.map((entry) => entry.date.slice(5)), minCalories, maxCalories)}
        <div class="nutrition-review-strip"><span><small>AVG EATEN</small>${calorieAverage}</span><span><small>AVG BURNED</small>${calorieBurnAverage}</span><span><small>AVG MAINT + BURN</small>${calorieMaintenanceAverage}</span><span class="${calorieOverMaintenance ? "calorie-over" : "calorie-good"}"><small>GOAL DAYS // OVER MAINT</small>${calorieGoalDays}/${recentCalories.length} // ${calorieOverMaintenance}</span></div>
      </section>
    ` : "",
    prSignals.length ? `
      <section class="panel review-pr-signals">
        <div class="panel-header"><span>SIGNIFICANT PRS</span><span>${prSignals.length} RECORD SIGNALS</span></div>
        <div class="review-pr-grid">${prSignals.map((entry) => `
          <article>
            <header><strong>${escapeHtml(entry.movement)}</strong><span>${entry.date}</span></header>
            <p>${prDisplayValue(entry)}</p>
            <small>${entry.repGain ? `+${entry.repGain} REPS` : ""}${entry.repGain && entry.weightGain ? " // " : ""}${entry.weightGain ? `+${entry.weightGain} KG` : ""}</small>
          </article>
        `).join("")}</div>
      </section>
    ` : "",
    state.settings.bodyModel && oldestBody ? `
      <section class="panel review-body-models">
        <div class="body-comparison-toolbar">
          <div><strong>OLDEST // NEWEST</strong><small>${oldestBody.date} // ${newestBody.date}</small></div>
          <button class="comparison-trigger" data-body-compare type="button">COMPARE</button>
        </div>
        <div class="body-model-comparison">
          <svg class="comparison-figure comparison-old" viewBox="0 0 160 265" role="img" aria-label="Oldest body model">${bodyAnatomyMarkup(oldestBody, selectedBodyFrame())}</svg>
          <svg class="comparison-figure comparison-new" viewBox="0 0 160 265" role="img" aria-label="Newest body model">${bodyAnatomyMarkup(newestBody, selectedBodyFrame())}</svg>
        </div>
        <div class="body-comparison-key"><span><i></i>OLDEST // ${formatMetric(oldestBody.weight, " KG")}</span><span><i></i>NEWEST // ${formatMetric(newestBody.weight, " KG")}</span></div>
      </section>
    ` : "",
    periodSkills.length ? `
      <section class="panel review-skills">
        <div class="panel-header"><span>SKILL SIGNAL</span><span>CURRENT STATE</span></div>
        ${periodSkills.slice(0, 5).map((skill) => `
          <div><header><strong>${escapeHtml(skill.name)}</strong><span>${skill.progress}%</span></header><i><span style="width:${skill.progress}%"></span></i></div>
        `).join("")}
      </section>
    ` : ""
  ].filter(Boolean);
  container.innerHTML = `
    <section class="review-period">
      <div><span>${currentReviewMonth ? "MONTH REVIEW" : "LIFETIME REVIEW"}</span><strong>${periodTitle}</strong><small>${periodRange}</small></div>
      <span class="review-period-state">${currentReviewMonth ? "OPENED FROM MONTH SHELF" : "FROM FIRST RECORD // THROUGH TODAY"}</span>
    </section>
    ${overviewCards.length ? `<section class="review-overview">${overviewCards.join("")}</section>` : ""}
    ${reviewSections.length ? reviewSections.join("") : '<div class="archive-empty review-empty"><strong>NOT ENOUGH SIGNAL YET</strong><p>Add checklist, body, nutrition, PR, focus, or skill data to build this review.</p></div>'}
  `;
}

function setArchiveTab(tab) {
  currentArchiveTab = tab;
  document.querySelectorAll("[data-archive-tab]").forEach((button) => button.classList.toggle("active", button.dataset.archiveTab === tab));
  document.querySelector("#archive-days-pane").classList.toggle("active", tab === "days");
  document.querySelector("#archive-schedule-pane").classList.toggle("active", tab === "routines");
  document.querySelector("#archive-reviews-pane").classList.toggle("active", tab === "reviews");
  if (tab === "days") renderArchive();
  if (tab === "routines") renderHabitSchedule();
  if (tab === "reviews") renderWeeklyReviews();
}

function openArchivedWeek(weekKey, preferredKey = "") {
  currentArchiveWeek = weekKey;
  const pages = weekDays(weekKey);
  const selected = pages.some((day) => day.key === preferredKey) ? preferredKey : pages.find((day) => day.record)?.key || pages[0].key;
  document.querySelector("#book-pages").innerHTML = pages.map((day, index) => `
    <button type="button" class="${day.key === selected ? "active" : ""} ${day.record ? "recorded" : ""}" data-page-key="${day.key}">
      <span>${String(index + 1).padStart(2, "0")}</span><strong>${formatDate(day.date, { weekday: "short" }).toUpperCase()}</strong><small>${formatDate(day.date, { month: "short", day: "numeric" }).toUpperCase()}</small>
    </button>
  `).join("");
  openArchivedDay(selected);
}

function openArchivedDay(key) {
  const record = state.dayRecords?.[key] || { checklist: [], journal: null, body: null, focus: [] };
  const dialog = document.querySelector("#book-viewer");
  const checklist = record.checklist || [];
  const completed = checklist.reduce((sum, habit) => sum + (Number.isFinite(Number(habit.progress)) ? Number(habit.progress) : habit.completed ? 1 : 0), 0);
  const archiveMeta = record.archive || {};
  const archiveStatus = archiveMeta.status === "sealed" ? "SEALED RECORD" : "AUTO CAPTURE";
  document.querySelector("#book-viewer-title").textContent = formatDate(new Date(`${key}T12:00:00`), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  document.querySelector("#book-viewer-meta").innerHTML = `
    <span>${key}</span>
    ${checklist.length ? `<span>${Math.round(completed * 100) / 100}/${checklist.length} HABITS COMPLETE</span>` : ""}
    <span>${archiveStatus}</span>
    ${archiveMeta.updatedAt ? `<span>${archiveMeta.signalCount || 0} SIGNALS // ${new Date(archiveMeta.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>` : ""}
  `;
  document.querySelector("#book-checklist-section").hidden = !checklist.length;
  document.querySelector("#book-checklist").innerHTML = checklist.map((habit) => `
      <li class="${habit.completed ? "completed" : ""}">
        <span class="snapshot-check">${habit.completed ? "[X]" : Number(habit.count) > 0 ? `[${habit.count}/${habit.targetCount || 1}]` : "[ ]"}</span>
        <span><small>${(habit.type || "commitment").toUpperCase()}</small>${escapeHtml(habit.name)}${habit.note ? `<em>${escapeHtml(habit.note)}</em>` : ""}</span>
      </li>
    `).join("");

  const journal = record.journal;
  const hasJournal = hasJournalContent(journal);
  document.querySelector("#book-journal-section").hidden = !hasJournal;
  document.querySelector("#book-journal").innerHTML = hasJournal
    ? `${journal.body?.trim() ? `<h3>TODAY'S NOTES</h3><p>${escapeHtml(journal.body).replaceAll("\n", "<br>")}</p>` : ""}${journal.futureNote?.trim() ? `<h3>MESSAGE FOR TOMORROW</h3><p>${escapeHtml(journal.futureNote).replaceAll("\n", "<br>")}</p>` : ""}`
    : "";
  const logs = state.timeLogs[key] || record.logs || [];
  const totalTime = logs.reduce((total, log) => total + log.seconds, 0);
  document.querySelector("#book-time-section").hidden = !logs.length;
  document.querySelector("#book-time-total").textContent = formatTimer(totalTime, true);
  document.querySelector("#book-time-logs").innerHTML = logs.map((log) => `
      <li>
        <span><small>${(log.mode || "TRACKER").toUpperCase()}</small>${escapeHtml(log.activity)}</span>
        <strong>${formatTimer(log.seconds, true)}</strong>
      </li>
    `).join("");
  const body = record.body;
  const bodyPrs = record.bodyPrs || [];
  const calories = record.calories || state.body.calories?.find((entry) => entry.date === key);
  const normalizedCalories = calories ? normalizeCalorieEntry(calories) : null;
  const bodyMetrics = body ? [
    ["WEIGHT", body.weight, " KG"],
    ["BODY FAT", body.bodyFat, "%"],
    ["WAIST", body.waist, " CM"],
    ["CHEST", body.chest, " CM"]
  ].filter(([, value]) => value != null && value !== "") : [];
  const hasBody = bodyMetrics.length || body?.note || bodyPrs.length || normalizedCalories;
  document.querySelector("#book-body-section").hidden = !hasBody;
  document.querySelector("#book-body").innerHTML = hasBody
    ? `${bodyMetrics.length ? `<div class="book-body-grid">${bodyMetrics.map(([label, value, unit]) => `<span><small>${label}</small>${formatMetric(Number(value), unit)}</span>`).join("")}</div>` : ""}${body?.note ? `<p>${escapeHtml(body.note)}</p>` : ""}${normalizedCalories ? (() => {
      const energy = calorieEnergy(normalizedCalories);
      const status = calorieStatus(normalizedCalories);
      return `<div class="book-energy-review ${status.className}"><span><small>EATEN</small>${energy.consumed} KCAL</span><span><small>BURNED EXTRA</small>${energy.burned} KCAL</span><span><small>MAINTENANCE BUDGET</small>${energy.baseMaintenance || "--"} + ${energy.burned} = ${energy.effectiveMaintenance || "--"}</span><span><small>STATUS</small>${status.label}</span></div>`;
    })() : ""}${bodyPrs.length ? `<div class="book-pr-list">${bodyPrs.map((entry) => `<span><small>PR // ${escapeHtml(entry.movement)}</small>${prDisplayValue(normalizePrEntry(entry, 0, entry.type || "weights"))}</span>`).join("")}</div>` : ""}`
    : "";
  const focusLogs = record.focus || [];
  document.querySelector("#book-focus-section").hidden = !focusLogs.length;
  document.querySelector("#book-focus").innerHTML = focusLogs.map((log) => `
      <article>
        <header><strong>${escapeHtml(log.skillName || log.projectName || "GENERAL OUTPUT")}</strong><span>${Math.round(log.focusMinutes || 0)} MIN // ${formatIncome(log.income || 0)}</span></header>
        <p>${escapeHtml(log.output || "No output description.")}</p>
        ${log.note ? `<small>${escapeHtml(log.note)}</small>` : ""}
      </article>
    `).join("");
  document.querySelectorAll("[data-page-key]").forEach((button) => button.classList.toggle("active", button.dataset.pageKey === key));
  showModalLocked(dialog);
  scrambleText(document.querySelector("#book-viewer-title"), document.querySelector("#book-viewer-title").textContent, 420);
}

function setTimerTab(tabName) {
  document.querySelectorAll("[data-timer-tab]").forEach((button) => button.classList.toggle("active", button.dataset.timerTab === tabName));
  document.querySelector("#focus-pane").classList.toggle("active", tabName === "focus");
  document.querySelector("#track-pane").classList.toggle("active", tabName === "track");
}

function renderFocusTimer() {
  const readout = document.querySelector("#focus-readout");
  if (document.activeElement !== readout || focusRunning) readout.value = formatTimer(focusRemaining, true);
  document.querySelector("#focus-progress").style.width = `${focusDuration ? (focusRemaining / focusDuration) * 100 : 0}%`;
  document.querySelector("#focus-toggle").textContent = focusRunning ? "PAUSE" : "START";
  readout.readOnly = focusRunning;
  document.querySelector("#focus-habit").disabled = focusRunning;
  setHabitPickerDisabled("focus-habit", focusRunning);
  document.title = focusRunning ? `${formatTimer(focusRemaining, true)} // Archive` : "Archive";
}

function toggleFocusTimer() {
  if (!document.querySelector("#focus-habit").value) {
    showToast("choose a habit first");
    return;
  }
  if (!focusRunning && focusRemaining < 1) {
    showToast("tap the time to set a duration");
    pulseControl(document.querySelector("#focus-readout"));
    return;
  }
  clearInterval(focusInterval);
  if (focusRunning) {
    updateFocusClock();
    focusRunning = false;
    focusEndAt = 0;
  } else {
    focusRunning = true;
    focusEndAt = Date.now() + focusRemaining * 1000;
    focusInterval = setInterval(updateFocusClock, 1000);
  }
  renderFocusTimer();
  saveTimerRuntime();
  scrambleText(document.querySelector("#focus-toggle"), focusRunning ? "PAUSE" : "START", 260);
  pulseControl(document.querySelector(".timer-panel"));
}

function updateFocusClock() {
  if (!focusRunning || !focusEndAt) return;
  focusRemaining = Math.max(0, Math.ceil((focusEndAt - Date.now()) / 1000));
  if (focusRemaining <= 0) {
    focusRemaining = 0;
    focusRunning = false;
    focusEndAt = 0;
    clearInterval(focusInterval);
    if (!focusSessionSaved && saveHabitTime(document.querySelector("#focus-habit").value, focusDuration, "countdown")) {
      focusSessionSaved = true;
      showToast("focus cycle saved");
    } else {
      showToast("focus cycle complete");
    }
    saveTimerRuntime();
  }
  renderFocusTimer();
}

function resetFocusTimer() {
  if (focusRunning) updateFocusClock();
  focusRunning = false;
  focusEndAt = 0;
  clearInterval(focusInterval);
  const elapsed = Math.max(0, focusDuration - focusRemaining);
  if (elapsed > 0 && !focusSessionSaved) {
    saveHabitTime(document.querySelector("#focus-habit").value, elapsed, "countdown");
    showToast("partial session saved");
  }
  focusRemaining = focusDuration;
  focusSessionSaved = false;
  renderFocusTimer();
  saveTimerRuntime();
  pulseControl(document.querySelector("#focus-readout"));
}

function applyTimerInput() {
  const input = document.querySelector("#focus-readout");
  const digits = input.value.replace(/\D/g, "").slice(-6).padStart(6, "0");
  const hours = Math.min(99, Number(digits.slice(0, 2)));
  const minutes = Math.min(59, Number(digits.slice(2, 4)));
  const seconds = Math.min(59, Number(digits.slice(4, 6)));
  focusDuration = hours * 3600 + minutes * 60 + seconds;
  focusRemaining = focusDuration;
  focusSessionSaved = false;
  renderFocusTimer();
  saveTimerRuntime();
  pulseControl(input);
}

function renderTrackTimer() {
  document.querySelector("#track-readout").textContent = formatTimer(trackSeconds, true);
  document.querySelector("#track-toggle").textContent = trackRunning ? "PAUSE" : "START";
  document.querySelector("#track-habit").disabled = trackRunning;
  setHabitPickerDisabled("track-habit", trackRunning);
}

function toggleTrackTimer() {
  if (!trackRunning && !document.querySelector("#track-habit").value) {
    showToast("choose a habit first");
    return;
  }
  clearInterval(trackInterval);
  if (trackRunning) {
    updateTrackClock();
    trackRunning = false;
    trackStartedAt = 0;
  } else {
    trackRunning = true;
    trackStartedAt = Date.now() - trackSeconds * 1000;
    trackInterval = setInterval(updateTrackClock, 1000);
  }
  renderTrackTimer();
  saveTimerRuntime();
  scrambleText(document.querySelector("#track-toggle"), trackRunning ? "PAUSE" : "START", 260);
  pulseControl(document.querySelector("#track-pane .timer-panel"));
}

function updateTrackClock() {
  if (!trackRunning || !trackStartedAt) return;
  trackSeconds = Math.max(0, Math.floor((Date.now() - trackStartedAt) / 1000));
  renderTrackTimer();
}

function saveTimeLog() {
  if (trackRunning) updateTrackClock();
  if (trackSeconds < 1) {
    showToast("start the tracker first");
    return;
  }
  const habitId = document.querySelector("#track-habit").value;
  if (!saveHabitTime(habitId, trackSeconds, "tracker")) {
    showToast("choose a habit first");
    return;
  }
  trackRunning = false;
  trackStartedAt = 0;
  clearInterval(trackInterval);
  trackSeconds = 0;
  renderTrackTimer();
  saveTimerRuntime();
  renderTimeLogs();
  scrambleText(document.querySelector("#tracked-total"), document.querySelector("#tracked-total").textContent, 380);
  pulseControl(document.querySelector(".log-panel"));
  showToast("time log saved");
}

function renderTimeLogs() {
  const logs = state.timeLogs[dateKey()] || [];
  const total = logs.reduce((sum, log) => sum + log.seconds, 0);
  document.querySelector("#tracked-total").textContent = formatTimer(total, true);
  document.querySelector("#time-log-list").innerHTML = logs.length
    ? logs.map((log) => `<li class="time-log"><span><small>${(log.mode || "tracker").toUpperCase()}</small>${escapeHtml(log.activity).toUpperCase()}</span><span>${formatTimer(log.seconds, true)}</span><button class="terminal-action" type="button" data-time-log-remove="${log.id}">DELETE</button></li>`).join("")
    : '<li class="time-log"><span>NO LOGS YET</span><span>--:--:--</span></li>';
}

function removeTimeLog(id) {
  const today = dateKey();
  state.timeLogs[today] = (state.timeLogs[today] || []).filter((log) => String(log.id) !== String(id));
  syncDayRecord(today);
  saveState();
  renderTimeLogs();
  renderHomeArchive();
  showToast("time log removed");
}

function numberOrNull(value) {
  const number = value === "" ? null : Number(value);
  return number == null || Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeCalorieEntry(entry, index = 0) {
  const legacyKcal = Math.max(0, Number(entry?.kcal) || 0);
  const legacyProtein = Math.max(0, Number(entry?.protein) || 0);
  const meals = Array.isArray(entry?.meals)
    ? entry.meals.map((meal, mealIndex) => ({
      id: String(meal?.id || `legacy-meal-${index}-${mealIndex}`),
      name: String(meal?.name || "Meal"),
      kcal: Math.max(0, Number(meal?.kcal) || 0),
      protein: Math.max(0, Number(meal?.protein) || 0),
      note: String(meal?.note || ""),
      time: String(meal?.time || "")
    }))
    : legacyKcal
      ? [{
        id: `legacy-meal-${index}-0`,
        name: "Daily intake",
        kcal: legacyKcal,
        protein: legacyProtein,
        note: String(entry?.note || ""),
        time: ""
      }]
      : [];
  const activities = Array.isArray(entry?.activities)
    ? entry.activities.map((activity, activityIndex) => ({
      id: String(activity?.id || `legacy-activity-${index}-${activityIndex}`),
      name: String(activity?.name || "Activity"),
      kcal: Math.max(0, Number(activity?.kcal) || 0),
      note: String(activity?.note || ""),
      time: String(activity?.time || "")
    }))
    : [];
  const kcal = meals.reduce((sum, meal) => sum + meal.kcal, 0);
  const protein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const burnedKcal = activities.reduce((sum, activity) => sum + activity.kcal, 0);
  return {
    id: String(entry?.id || `legacy-calorie-${index}`),
    date: String(entry?.date || dateKey()),
    targetKcal: Math.max(0, Number(entry?.targetKcal) || 0),
    maintenanceKcal: Math.max(0, Number(entry?.maintenanceKcal) || 0),
    meals,
    activities,
    kcal,
    burnedKcal,
    protein,
    note: String(entry?.note || "")
  };
}

function calorieEnergy(entry = {}, target = entry?.targetKcal, maintenance = entry?.maintenanceKcal) {
  const consumed = Array.isArray(entry?.meals) && entry.meals.length
    ? entry.meals.reduce((sum, meal) => sum + Math.max(0, Number(meal?.kcal) || 0), 0)
    : Math.max(0, Number(entry?.kcal) || 0);
  const burned = Array.isArray(entry?.activities)
    ? entry.activities.reduce((sum, activity) => sum + Math.max(0, Number(activity?.kcal) || 0), 0)
    : Math.max(0, Number(entry?.burnedKcal) || 0);
  const baseTarget = Math.max(0, Number(target) || 0);
  const baseMaintenance = Math.max(0, Number(maintenance) || 0);
  return {
    consumed,
    burned,
    baseTarget,
    baseMaintenance,
    effectiveTarget: baseTarget ? baseTarget + burned : 0,
    effectiveMaintenance: baseMaintenance ? baseMaintenance + burned : 0,
    netIntake: Math.max(0, consumed - burned)
  };
}

function normalizeMovementKey(value) {
  let normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  normalized = normalized
    .replace(/\b(push|pull|sit|chin|muscle)\s*ups?\b/g, "$1 up")
    .replace(/\bpress\s*ups?\b/g, "push up")
    .replace(/\b(dips|squats|lunges|rows|curls|raises)\b/g, (word) => ({
      dips: "dip",
      squats: "squat",
      lunges: "lunge",
      rows: "row",
      curls: "curl",
      raises: "raise"
    })[word]);
  return normalized.replace(/\s+/g, " ").trim();
}

function movementDistance(a, b) {
  const left = [...a];
  const right = [...b];
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  left.forEach((character, leftIndex) => {
    let diagonal = row[0];
    row[0] = leftIndex + 1;
    right.forEach((other, rightIndex) => {
      const previous = row[rightIndex + 1];
      row[rightIndex + 1] = Math.min(
        row[rightIndex + 1] + 1,
        row[rightIndex] + 1,
        diagonal + (character === other ? 0 : 1)
      );
      diagonal = previous;
    });
  });
  return row[right.length];
}

function titleMovement(key) {
  return key.replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveMovementName(value) {
  const key = normalizeMovementKey(value);
  if (!key) return { key: "", name: "" };
  const candidates = [
    ...allPrEntries().map((entry) => entry.movement),
    ...PR_MOVEMENTS.calisthenics,
    ...PR_MOVEMENTS.weights
  ].filter(Boolean);
  const exact = candidates.find((candidate) => normalizeMovementKey(candidate) === key);
  if (exact) return { key, name: exact };
  const compact = key.replaceAll(" ", "");
  const compactMatch = candidates.find((candidate) => normalizeMovementKey(candidate).replaceAll(" ", "") === compact);
  if (compactMatch) return { key: normalizeMovementKey(compactMatch), name: compactMatch };
  const close = candidates
    .map((candidate) => ({ candidate, candidateKey: normalizeMovementKey(candidate) }))
    .filter(({ candidateKey }) => candidateKey.length >= 5)
    .map((item) => ({ ...item, distance: movementDistance(key, item.candidateKey) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (close && close.distance <= Math.max(1, Math.floor(key.length * 0.12))) {
    return { key: close.candidateKey, name: close.candidate };
  }
  return { key, name: titleMovement(key) };
}

function normalizePrEntry(entry, index = 0, type = "weights") {
  const legacyValue = Math.max(0, Number(entry?.value) || 0);
  const reps = Number.isFinite(Number(entry?.reps)) ? Math.max(0, Number(entry.reps)) : type === "calisthenics" ? legacyValue : 0;
  const weight = Number.isFinite(Number(entry?.weight)) ? Math.max(0, Number(entry.weight)) : type === "weights" ? legacyValue : 0;
  return {
    id: String(entry?.id || `legacy-pr-${index}`),
    type,
    movement: String(entry?.movement || "Movement"),
    movementKey: normalizeMovementKey(entry?.movement || "Movement"),
    reps,
    weight,
    value: type === "calisthenics" ? reps : weight,
    date: String(entry?.date || dateKey()),
    note: String(entry?.note || ""),
    significant: entry?.significant === true
  };
}

function formatMetric(value, unit) {
  return Number.isFinite(value) ? `${value}${unit}` : "--";
}

function renderBody() {
  renderWorkoutPlans();
  renderBodyMetrics();
  renderCalories();
  renderBodyFieldControl();
  renderBodyLogModel();
  renderPrArea();
  renderHomeBodyState();
}

function renderHomeBodyState() {
  const status = document.querySelector("#home-body-state");
  if (!status) return;
  const latest = [...state.body.metrics].sort((a, b) => b.date.localeCompare(a.date))[0];
  status.textContent = latest?.weight != null ? `${latest.weight} KG LATEST` : `${state.body.metrics.length} CHECK-INS`;
}

function renderWorkoutPlans() {
  const container = document.querySelector("#workout-plan-list");
  if (!container) return;
  container.innerHTML = state.body.workoutPlans.length
    ? state.body.workoutPlans.map((plan, index) => `
      <article class="workout-card">
        <header>
          <span>PLAN ${String(index + 1).padStart(2, "0")}</span>
          <div class="manage-actions">
            <button type="button" data-workout-edit="${plan.id}">EDIT</button>
            <button type="button" data-workout-remove="${plan.id}">DEL</button>
          </div>
        </header>
        <h3>${escapeHtml(plan.name)}</h3>
        <p>${escapeHtml(plan.details).replaceAll("\n", "<br>")}</p>
      </article>
    `).join("")
    : '<div class="body-empty"><strong>NO WORKOUT PLANS</strong><span>Create a reusable plan above.</span></div>';
}

function saveWorkoutPlan() {
  const name = document.querySelector("#workout-plan-name").value.trim();
  const details = document.querySelector("#workout-plan-details").value.trim();
  if (!name || !details) {
    showToast("plan needs a name and exercises");
    return;
  }
  if (editingWorkoutId) {
    const plan = state.body.workoutPlans.find((item) => item.id === editingWorkoutId);
    if (plan) Object.assign(plan, { name, details, updatedAt: new Date().toISOString() });
  } else {
    state.body.workoutPlans.unshift({ id: `${Date.now()}`, name, details, updatedAt: new Date().toISOString() });
  }
  editingWorkoutId = null;
  document.querySelector("#workout-plan-form").reset();
  document.querySelector("#workout-plan-form .primary-button").textContent = "SAVE PLAN";
  saveState();
  renderWorkoutPlans();
  pulseControl(document.querySelector("#workout-plan-list .workout-card"));
  showToast("workout plan saved");
}

function editWorkoutPlan(id) {
  const plan = state.body.workoutPlans.find((item) => item.id === id);
  if (!plan) return;
  editingWorkoutId = id;
  animateEditableValue(document.querySelector("#workout-plan-name"), plan.name, 300);
  animateEditableValue(document.querySelector("#workout-plan-details"), plan.details, 440);
  document.querySelector("#workout-plan-form .primary-button").textContent = "UPDATE PLAN";
  scrambleText(document.querySelector("#workout-plan-form .panel-header span"), "WORKOUT.PLAN", 320);
  document.querySelector("#workout-plan-form").scrollIntoView({ behavior: state.settings.motion ? "smooth" : "auto", block: "start" });
}

function removeWorkoutPlan(id) {
  state.body.workoutPlans = state.body.workoutPlans.filter((plan) => plan.id !== id);
  if (editingWorkoutId === id) {
    editingWorkoutId = null;
    document.querySelector("#workout-plan-form").reset();
    document.querySelector("#workout-plan-form .primary-button").textContent = "SAVE PLAN";
  }
  saveState();
  renderWorkoutPlans();
  showToast("workout plan removed");
}

function renderCalories() {
  const dashboard = document.querySelector("#calorie-dashboard");
  const mealList = document.querySelector("#calorie-meal-list");
  const activityList = document.querySelector("#calorie-activity-list");
  const history = document.querySelector("#calorie-history");
  if (!dashboard || !mealList || !activityList || !history) return;
  const today = dateKey();
  const storedToday = state.body.calories.find((entry) => entry.date === today);
  const todayEntry = normalizeCalorieEntry(storedToday || {
    id: `draft-${today}`,
    date: today,
    targetKcal: state.settings.calorieTarget,
    maintenanceKcal: state.settings.calorieMaintenance,
    meals: [],
    activities: []
  });
  const target = todayEntry.targetKcal || state.settings.calorieTarget || 0;
  const maintenance = todayEntry.maintenanceKcal || state.settings.calorieMaintenance || 0;
  const energy = calorieEnergy(todayEntry, target, maintenance);
  const remaining = energy.effectiveTarget ? energy.effectiveTarget - energy.consumed : null;
  const status = calorieStatus(todayEntry, target, maintenance);
  const scale = Math.max(1, energy.effectiveMaintenance, energy.effectiveTarget, energy.consumed);
  dashboard.className = `calorie-dashboard ${status.className}`;
  dashboard.innerHTML = `
    <div class="calorie-dashboard-head">
      <div><span>EATEN // ${today.slice(5)}</span><strong>${energy.consumed}</strong><small>KCAL // ${todayEntry.protein} G PROTEIN</small></div>
      <div><span>BURNED EXTRA</span><strong>${energy.burned}</strong><small>KCAL FROM ACTIVITIES</small></div>
      <div><span>STATUS</span><strong>${status.label}</strong><small>${remaining == null ? "SET ENERGY TARGETS" : remaining >= 0 ? `${remaining} KCAL TO ADJUSTED GOAL` : `${Math.abs(remaining)} KCAL OVER ADJUSTED GOAL`}</small></div>
    </div>
    <div class="calorie-equation">
      <span><small>GOAL BUDGET</small>${target || "--"} + ${energy.burned} = ${energy.effectiveTarget || "--"}</span>
      <span><small>MAINTENANCE BUDGET</small>${maintenance || "--"} + ${energy.burned} = ${energy.effectiveMaintenance || "--"}</span>
    </div>
    <div class="calorie-track" style="--intake:${Math.min(100, (energy.consumed / scale) * 100)}%;--goal:${Math.min(100, (energy.effectiveTarget / scale) * 100)}%;--maintenance:${Math.min(100, (energy.effectiveMaintenance / scale) * 100)}%">
      <span class="calorie-track-fill"></span><i class="goal-marker"></i><i class="maintenance-marker"></i>
    </div>
    <div class="calorie-scale"><span>0</span><span>GOAL ${target || "--"} + ${energy.burned}</span><span>MAINT ${maintenance || "--"} + ${energy.burned}</span></div>
  `;
  const targetInput = document.querySelector("#calorie-target");
  const maintenanceInput = document.querySelector("#calorie-maintenance");
  if (document.activeElement !== targetInput) targetInput.value = target || "";
  if (document.activeElement !== maintenanceInput) maintenanceInput.value = maintenance || "";
  mealList.innerHTML = todayEntry.meals.length
    ? todayEntry.meals.map((meal, index) => `
      <article class="calorie-meal-card">
        <header><span>MEAL ${String(index + 1).padStart(2, "0")} ${meal.time ? `// ${meal.time}` : ""}</span><span class="calorie-card-actions"><button class="terminal-action" type="button" data-calorie-meal-edit="${meal.id}">EDIT</button><button class="terminal-action" type="button" data-calorie-meal-remove="${meal.id}">DEL</button></span></header>
        <div><strong>${escapeHtml(meal.name)}</strong><span>${meal.kcal} KCAL // ${meal.protein || 0} G PROTEIN</span></div>
        ${meal.note ? `<p>${escapeHtml(meal.note)}</p>` : ""}
      </article>
    `).join("")
    : '<div class="body-empty"><strong>NO MEALS LOGGED TODAY</strong><span>Add food as the day progresses.</span></div>';
  activityList.innerHTML = todayEntry.activities.length
    ? todayEntry.activities.map((activity, index) => `
      <article class="calorie-activity-card">
        <header><span>ACTIVITY ${String(index + 1).padStart(2, "0")} ${activity.time ? `// ${activity.time}` : ""}</span><span class="calorie-card-actions"><button class="terminal-action" type="button" data-calorie-activity-edit="${activity.id}">EDIT</button><button class="terminal-action" type="button" data-calorie-activity-remove="${activity.id}">DEL</button></span></header>
        <div><strong>${escapeHtml(activity.name)}</strong><span>+${activity.kcal} KCAL BUDGET</span></div>
        ${activity.note ? `<p>${escapeHtml(activity.note)}</p>` : ""}
      </article>
    `).join("")
    : '<div class="body-empty"><strong>NO EXTRA ACTIVITY TODAY</strong><span>Log movement only when it adds meaningful burn beyond your normal maintenance.</span></div>';
  const previous = [...state.body.calories]
    .filter((entry) => entry.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);
  history.innerHTML = previous.length
    ? `<div class="panel-header"><span>RECENT NUTRITION</span><span>${previous.length} DAYS</span></div>${previous.map((entry) => {
      const normalized = normalizeCalorieEntry(entry);
      const previousStatus = calorieStatus(normalized, normalized.targetKcal, normalized.maintenanceKcal);
      const previousEnergy = calorieEnergy(normalized);
      return `<article class="calorie-day-card ${previousStatus.className}"><span>${normalized.date}</span><strong>${normalized.kcal} KCAL EATEN</strong><small>${previousStatus.label} // BURNED ${previousEnergy.burned} // MAINT ${previousEnergy.baseMaintenance} + ${previousEnergy.burned} = ${previousEnergy.effectiveMaintenance || "--"}</small></article>`;
    }).join("")}`
    : "";
}

function calorieStatus(entry = {}, target = entry?.targetKcal, maintenance = entry?.maintenanceKcal) {
  const energy = calorieEnergy(entry, target, maintenance);
  const { consumed, effectiveTarget, effectiveMaintenance } = energy;
  if (!target && !maintenance) return { label: "NO TARGET", className: "calorie-neutral" };
  if (effectiveMaintenance && consumed > effectiveMaintenance) return { label: "OVER MAINTENANCE", className: "calorie-over" };
  if (effectiveTarget && consumed > effectiveTarget) {
    return effectiveMaintenance && consumed < effectiveMaintenance
      ? { label: "ABOVE GOAL", className: "calorie-warning" }
      : { label: "OVER GOAL", className: "calorie-over" };
  }
  if (effectiveTarget && consumed === effectiveTarget) return { label: "GOAL MET", className: "calorie-good" };
  return { label: target < maintenance ? "DEFICIT TRACKING" : "ON TRACK", className: "calorie-good" };
}

function ensureTodayCalorieEntry() {
  const today = dateKey();
  let entry = state.body.calories.find((item) => item.date === today);
  if (!entry) {
    entry = normalizeCalorieEntry({
      id: `${Date.now()}`,
      date: today,
      targetKcal: state.settings.calorieTarget,
      maintenanceKcal: state.settings.calorieMaintenance,
      meals: [],
      activities: []
    });
    state.body.calories.push(entry);
  }
  entry.meals ||= [];
  entry.activities ||= [];
  if (!entry.targetKcal) entry.targetKcal = state.settings.calorieTarget;
  if (!entry.maintenanceKcal) entry.maintenanceKcal = state.settings.calorieMaintenance;
  return entry;
}

function saveCalorieGoals() {
  const targetKcal = Math.max(0, Number(document.querySelector("#calorie-target").value) || 0);
  const maintenanceKcal = Math.max(0, Number(document.querySelector("#calorie-maintenance").value) || 0);
  if (!targetKcal || !maintenanceKcal) {
    showToast("add goal and maintenance calories");
    return;
  }
  state.settings.calorieTarget = targetKcal;
  state.settings.calorieMaintenance = maintenanceKcal;
  const entry = ensureTodayCalorieEntry();
  entry.targetKcal = targetKcal;
  entry.maintenanceKcal = maintenanceKcal;
  syncDayRecord(entry.date);
  saveState();
  renderCalories();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  confirmControl(document.querySelector("#calorie-goals-save"), "TARGETS SAVED");
  showToast("energy targets saved");
}

function saveCalorieMeal() {
  const name = document.querySelector("#calorie-meal-name").value.trim();
  const kcal = Math.max(0, Number(document.querySelector("#calorie-meal-kcal").value) || 0);
  const protein = Math.max(0, Number(document.querySelector("#calorie-meal-protein").value) || 0);
  const note = limitedText(document.querySelector("#calorie-meal-note").value, NOTE_LIMITS.compact);
  if (!name || !kcal) {
    showToast(name ? "add meal calories" : "name the meal");
    return;
  }
  const entry = ensureTodayCalorieEntry();
  const existing = entry.meals.find((meal) => meal.id === editingCalorieMealId);
  const meal = {
    id: existing?.id || `${Date.now()}`,
    name,
    kcal,
    protein,
    note,
    time: existing?.time || new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
  };
  if (existing) Object.assign(existing, meal);
  else entry.meals.push(meal);
  entry.kcal = entry.meals.reduce((sum, meal) => sum + meal.kcal, 0);
  entry.protein = entry.meals.reduce((sum, meal) => sum + meal.protein, 0);
  syncDayRecord(entry.date);
  saveState();
  document.querySelector("#calorie-meal-form").reset();
  editingCalorieMealId = null;
  document.querySelector("#calorie-meal-save").textContent = "ADD MEAL";
  renderCalories();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  confirmControl(document.querySelector("#calorie-meal-save"), existing ? "MEAL SAVED" : "MEAL ADDED");
  showToast(existing ? `${name} updated` : `${name} added`);
}

function editCalorieMeal(id) {
  const entry = state.body.calories.find((item) => item.date === dateKey());
  const meal = entry?.meals?.find((item) => item.id === id);
  if (!meal) return;
  editingCalorieMealId = id;
  document.querySelector("#calorie-meal-name").value = meal.name;
  document.querySelector("#calorie-meal-kcal").value = meal.kcal;
  document.querySelector("#calorie-meal-protein").value = meal.protein || "";
  document.querySelector("#calorie-meal-note").value = meal.note || "";
  document.querySelector("#calorie-meal-save").textContent = "SAVE MEAL";
  document.querySelector("#calorie-meal-form").scrollIntoView({ block: "center", behavior: state.settings.motion ? "smooth" : "auto" });
}

function removeCalorieMeal(id) {
  const entry = state.body.calories.find((item) => item.date === dateKey());
  if (!entry) return;
  entry.meals = entry.meals.filter((meal) => meal.id !== id);
  entry.kcal = entry.meals.reduce((sum, meal) => sum + meal.kcal, 0);
  entry.protein = entry.meals.reduce((sum, meal) => sum + meal.protein, 0);
  if (editingCalorieMealId === id) {
    editingCalorieMealId = null;
    document.querySelector("#calorie-meal-form").reset();
    document.querySelector("#calorie-meal-save").textContent = "ADD MEAL";
  }
  syncDayRecord(entry.date);
  saveState();
  renderCalories();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  showToast("meal removed");
}

function saveCalorieActivity() {
  const name = document.querySelector("#calorie-activity-name").value.trim();
  const kcal = Math.max(0, Number(document.querySelector("#calorie-activity-kcal").value) || 0);
  const note = limitedText(document.querySelector("#calorie-activity-note").value, NOTE_LIMITS.compact);
  if (!name || !kcal) {
    showToast(name ? "add calories burned" : "name the activity");
    return;
  }
  const entry = ensureTodayCalorieEntry();
  const existing = entry.activities.find((activity) => activity.id === editingCalorieActivityId);
  const activity = {
    id: existing?.id || `${Date.now()}`,
    name,
    kcal,
    note,
    time: existing?.time || new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
  };
  if (existing) Object.assign(existing, activity);
  else entry.activities.push(activity);
  entry.burnedKcal = entry.activities.reduce((sum, activity) => sum + activity.kcal, 0);
  syncDayRecord(entry.date);
  saveState();
  document.querySelector("#calorie-activity-form").reset();
  editingCalorieActivityId = null;
  document.querySelector("#calorie-activity-save").textContent = "ADD ACTIVITY";
  renderCalories();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  confirmControl(document.querySelector("#calorie-activity-save"), existing ? "ACTIVITY SAVED" : "ACTIVITY ADDED");
  showToast(existing ? `${name} activity updated` : `${name} activity added`);
}

function editCalorieActivity(id) {
  const entry = state.body.calories.find((item) => item.date === dateKey());
  const activity = entry?.activities?.find((item) => item.id === id);
  if (!activity) return;
  editingCalorieActivityId = id;
  document.querySelector("#calorie-activity-name").value = activity.name;
  document.querySelector("#calorie-activity-kcal").value = activity.kcal;
  document.querySelector("#calorie-activity-note").value = activity.note || "";
  document.querySelector("#calorie-activity-save").textContent = "SAVE ACTIVITY";
  document.querySelector("#calorie-activity-form").scrollIntoView({ block: "center", behavior: state.settings.motion ? "smooth" : "auto" });
}

function removeCalorieActivity(id) {
  const entry = state.body.calories.find((item) => item.date === dateKey());
  if (!entry) return;
  entry.activities = (entry.activities || []).filter((activity) => activity.id !== id);
  entry.burnedKcal = entry.activities.reduce((sum, activity) => sum + activity.kcal, 0);
  if (editingCalorieActivityId === id) {
    editingCalorieActivityId = null;
    document.querySelector("#calorie-activity-form").reset();
    document.querySelector("#calorie-activity-save").textContent = "ADD ACTIVITY";
  }
  syncDayRecord(entry.date);
  saveState();
  renderCalories();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  showToast("activity removed");
}

function saveBodyMetric() {
  const editing = state.body.metrics.find((metric) => metric.id === editingBodyMetricId);
  const entryDate = editing?.date || dateKey();
  const existing = editing || state.body.metrics.find((metric) => metric.date === entryDate);
  const entry = {
    ...(existing || {}),
    id: existing?.id || `${Date.now()}`,
    date: entryDate,
    note: limitedText(document.querySelector("#body-note").value, NOTE_LIMITS.standard)
  };
  BODY_FIELDS.forEach(({ key }) => {
    const input = document.querySelector(`#${BODY_INPUT_IDS[key]}`);
    if (state.settings.bodyFields.includes(key)) entry[key] = numberOrNull(input?.value ?? "");
    else if (!(key in entry)) entry[key] = null;
  });
  const hasValue = BODY_FIELDS.some(({ key }) => entry[key] != null);
  if (!hasValue && !entry.note) {
    showToast("add a measurement or note");
    return;
  }
  state.body.metrics = state.body.metrics.filter((metric) => metric.id !== entry.id && metric.date !== entry.date);
  state.body.metrics.push(entry);
  state.body.metrics.sort((a, b) => b.date.localeCompare(a.date));
  syncDayRecord(entry.date);
  saveState();
  document.querySelector("#body-metric-form").reset();
  editingBodyMetricId = null;
  document.querySelector("#body-metric-form .primary-button").textContent = "SAVE CHECK-IN";
  renderBodyMetrics();
  renderBodyModel();
  renderHomeBodyState();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  showToast("body check-in saved");
}

function renderBodyMetrics() {
  const metrics = [...state.body.metrics].sort((a, b) => b.date.localeCompare(a.date));
  const latest = metrics[0];
  const previous = metrics[1];
  const weightDelta = latest?.weight != null && previous?.weight != null
    ? `${latest.weight - previous.weight >= 0 ? "+" : ""}${(latest.weight - previous.weight).toFixed(1)} KG`
    : "--";
  const visibility = normalizeBodySummaryVisibility(state.settings.bodySummaryVisibility);
  state.settings.bodySummaryVisibility = visibility;
  const summary = document.querySelector("#body-summary");
  if (summary) {
    const cards = [
      {
        key: "weight",
        html: `<div data-body-summary-card="weight"><span>LATEST WEIGHT</span><strong>${formatMetric(latest?.weight, " KG")}</strong><small>${weightDelta} VS PRIOR</small></div>`
      },
      {
        key: "bodyFat",
        html: `<div data-body-summary-card="bodyFat"><span>BODY FAT</span><strong>${formatMetric(latest?.bodyFat, "%")}</strong><small>${latest?.date || "NO CHECK-IN"}</small></div>`
      },
      {
        key: "plans",
        html: `<div data-body-summary-card="plans"><span>PLANS</span><strong>${state.body.workoutPlans.length}</strong><small>${metrics.length} CHECK-INS</small></div>`
      }
    ].filter((card) => visibility[card.key] !== false);
    summary.dataset.count = String(cards.length);
    summary.innerHTML = cards.map((card) => card.html).join("");
  }
  renderBodySummaryControl();
  const history = document.querySelector("#body-history");
  if (!history) return;
  const visibleMetrics = metrics.slice(0, bodyHistoryLimit);
  history.innerHTML = metrics.length
    ? visibleMetrics.map((metric) => `
      <article class="metric-card">
        <header><strong>${metric.date}</strong><div class="manage-actions"><button type="button" data-metric-edit="${metric.id}">EDIT</button><button type="button" data-metric-remove="${metric.id}">DEL</button></div></header>
        <div class="metric-values">
          ${BODY_FIELDS.filter(({ key }) => metric[key] != null).map(({ key, label, unit }) => `<span><small>${label}</small>${formatMetric(metric[key], ` ${unit.toUpperCase()}`)}</span>`).join("")}
        </div>
        ${metric.note ? `<p>${escapeHtml(metric.note)}</p>` : ""}
      </article>
    `).join("") + (metrics.length > visibleMetrics.length ? `
      <div class="history-window">
        <span>SHOWING ${visibleMetrics.length} OF ${metrics.length} CHECK-INS</span>
        <button type="button" data-load-body-history>LOAD OLDER CHECK-INS</button>
      </div>
    ` : "")
    : '<div class="body-empty"><strong>NO BODY CHECK-INS</strong><span>Add the first measurement above.</span></div>';
}

function renderBodySummaryControl() {
  const visibility = normalizeBodySummaryVisibility(state.settings.bodySummaryVisibility);
  document.querySelectorAll("[data-body-summary-visibility]").forEach((button) => {
    const active = visibility[button.dataset.bodySummaryVisibility] !== false;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function toggleBodySummaryVisibility(key) {
  if (!state.settings.editMode || !BODY_SUMMARY_KEYS.includes(key)) return;
  const visibility = normalizeBodySummaryVisibility(state.settings.bodySummaryVisibility);
  const visibleCards = BODY_SUMMARY_KEYS.filter((item) => visibility[item] !== false);
  if (visibility[key] !== false && visibleCards.length === 1) {
    showToast("keep at least one body card");
    return;
  }
  visibility[key] = visibility[key] === false;
  state.settings.bodySummaryVisibility = visibility;
  saveState();
  renderBodyMetrics();
  const label = { weight: "weight", bodyFat: "body fat", plans: "plans" }[key] || "card";
  showToast(`${label} card ${visibility[key] ? "shown" : "hidden"} // data preserved`);
}

function editBodyMetric(id) {
  const metric = state.body.metrics.find((item) => item.id === id);
  if (!metric) return;
  editingBodyMetricId = id;
  BODY_FIELDS.forEach(({ key }) => {
    const input = document.querySelector(`#${BODY_INPUT_IDS[key]}`);
    if (input) input.value = metric[key] ?? "";
  });
  document.querySelector("#body-note").value = metric.note || "";
  document.querySelector("#body-metric-form .primary-button").textContent = "UPDATE CHECK-IN";
  renderBodyLogModel(metric);
  document.querySelector("#body-metric-form").scrollIntoView({ behavior: state.settings.motion ? "smooth" : "auto", block: "start" });
}

function renderBodyFieldControl() {
  const container = document.querySelector("#body-field-control");
  if (!container) return;
  container.innerHTML = `
    <div><strong>TRACKED PARAMETERS</strong><small>Hidden fields keep all saved history.</small></div>
    <div>${BODY_FIELDS.map((field) => `<button type="button" class="${state.settings.bodyFields.includes(field.key) ? "active" : ""}" data-body-field-toggle="${field.key}">${field.label}</button>`).join("")}</div>
  `;
  document.querySelectorAll("[data-body-field]").forEach((field) => {
    field.hidden = !state.settings.bodyFields.includes(field.dataset.bodyField);
  });
}

function toggleBodyField(key) {
  if (!state.settings.editMode) return;
  const fields = new Set(state.settings.bodyFields);
  if (fields.has(key)) fields.delete(key);
  else fields.add(key);
  state.settings.bodyFields = BODY_FIELDS.map((field) => field.key).filter((fieldKey) => fields.has(fieldKey));
  saveState();
  renderBodyFieldControl();
  showToast(`${key} ${fields.has(key) ? "shown" : "hidden"} // history preserved`);
}

function allPrEntries() {
  state.body.prs ||= { calisthenics: [], weights: [] };
  return [
    ...(state.body.prs.calisthenics || []).map((entry, index) => normalizePrEntry(entry, index, "calisthenics")),
    ...(state.body.prs.weights || []).map((entry, index) => normalizePrEntry(entry, index, "weights"))
  ];
}

function prDisplayValue(entry) {
  const parts = [];
  if (entry.reps) parts.push(`${entry.reps} REPS`);
  if (entry.weight) parts.push(`${entry.weight} KG`);
  return parts.join(" // ") || "--";
}

function renderPrArea() {
  const board = document.querySelector("#pr-board");
  const datalist = document.querySelector("#pr-movement-options");
  if (!board) return;
  if (datalist) {
    const movementMap = new Map();
    [...PR_MOVEMENTS.calisthenics, ...PR_MOVEMENTS.weights, ...allPrEntries().map((entry) => entry.movement)]
      .filter(Boolean)
      .forEach((movement) => movementMap.set(normalizeMovementKey(movement), movement));
    const movements = [...movementMap.values()].sort((a, b) => a.localeCompare(b));
    datalist.innerHTML = movements.map((movement) => `<option value="${escapeHtml(movement)}"></option>`).join("");
  }
  const logs = allPrEntries().sort((a, b) => b.date.localeCompare(a.date));
  const grouped = new Map();
  logs.forEach((entry) => {
    const key = entry.movementKey || normalizeMovementKey(entry.movement);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  });
  const cards = [...grouped.values()].map((entries) => {
    const latest = entries[0];
    const bestReps = entries.reduce((max, entry) => Math.max(max, entry.reps || 0), 0);
    const bestWeight = entries.reduce((max, entry) => Math.max(max, entry.weight || 0), 0);
    return `
      <article class="pr-card ${bestReps || bestWeight ? "has-pr" : ""}">
        <header><strong>${escapeHtml(latest.movement)}</strong><span>${bestWeight ? "WEIGHTED" : "BODYWEIGHT"} // ${latest.date}</span></header>
        <div class="pr-stats">
          <span><small>MAX REPS</small><strong>${bestReps || "--"}</strong></span>
          <span><small>MAX KG</small><strong>${bestWeight || "--"}</strong></span>
        </div>
        <footer><span>${prDisplayValue(latest)} LATEST</span><button type="button" data-pr-remove="${latest.id}" data-pr-type="${latest.type}">DEL</button></footer>
      </article>
    `;
  });
  board.innerHTML = cards.length ? cards.join("") : '<div class="body-empty"><strong>NO PRS LOGGED</strong><span>Type a movement, reps, weight, or both.</span></div>';
}

function savePr() {
  const movementInput = document.querySelector("#pr-movement").value.trim();
  const reps = Math.max(0, Number(document.querySelector("#pr-reps").value) || 0);
  const weight = Math.max(0, Number(document.querySelector("#pr-weight").value) || 0);
  const date = dateKey();
  const note = limitedText(document.querySelector("#pr-note").value, NOTE_LIMITS.standard);
  if (!movementInput || (!reps && !weight)) {
    showToast(!movementInput ? "type a movement" : "add max reps or weight");
    return;
  }
  const { key: movementKey, name: movement } = resolveMovementName(movementInput);
  const type = weight > 0 ? "weights" : "calisthenics";
  const previousEntries = allPrEntries().filter((entry) => (entry.movementKey || normalizeMovementKey(entry.movement)) === movementKey);
  const previousBestReps = previousEntries.reduce((best, entry) => Math.max(best, entry.reps || 0), 0);
  const previousBestWeight = previousEntries.reduce((best, entry) => Math.max(best, entry.weight || 0), 0);
  const significant = reps > previousBestReps || weight > previousBestWeight;
  state.body.prs ||= { calisthenics: [], weights: [] };
  state.body.prs[type] ||= [];
  state.body.prs[type].unshift({
    id: `${Date.now()}`,
    type,
    movement,
    movementKey,
    reps,
    weight,
    value: type === "calisthenics" ? reps : weight,
    date,
    note,
    significant
  });
  syncDayRecord(date);
  saveState();
  document.querySelector("#pr-form").reset();
  renderPrArea();
  renderHomeArchive();
  pulseControl(document.querySelector("#pr-board .pr-card.has-pr"));
  showToast(significant ? `${movement} // new record` : `${movement} PR logged`);
}

function removePr(type, id) {
  state.body.prs ||= { calisthenics: [], weights: [] };
  const removed = (state.body.prs[type] || []).find((entry) => entry.id === id);
  state.body.prs[type] = (state.body.prs[type] || []).filter((entry) => entry.id !== id);
  if (removed) syncDayRecord(removed.date);
  saveState();
  renderPrArea();
  renderHomeArchive();
  showToast("PR entry removed");
}

function selectedBodyFrame() {
  return state.settings.bodyFrame === "female" ? "female" : "male";
}

function latestBodyMetric() {
  return [...state.body.metrics].sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

function readBodyMetricDraft() {
  const fallback = latestBodyMetric() || {};
  const editing = state.body.metrics.find((metric) => metric.id === editingBodyMetricId);
  return {
    ...fallback,
    date: editing?.date || dateKey(),
    ...Object.fromEntries(BODY_FIELDS.map(({ key }) => {
      const value = numberOrNull(document.querySelector(`#${BODY_INPUT_IDS[key]}`)?.value ?? "");
      return [key, value ?? fallback[key] ?? null];
    }))
  };
}

function bodyModelDimensions(metric, type) {
  const defaults = type === "male"
    ? { height: 178, weight: 78, bodyFat: 18, neck: 38, shoulders: 47, chest: 102, waist: 84, hips: 96, arm: 33, forearm: 27, thigh: 57, calf: 38 }
    : { height: 166, weight: 62, bodyFat: 25, neck: 32, shoulders: 39, chest: 90, waist: 72, hips: 101, arm: 27, forearm: 22, thigh: 54, calf: 35 };
  const userHas = (key) => metric?.[key] !== "" && metric?.[key] != null && Number.isFinite(Number(metric[key]));
  const measured = (key, min, max) => clamp(userHas(key) ? Number(metric[key]) : defaults[key], min, max);
  const height = measured("height", 140, 215);
  const weight = measured("weight", 38, 220);
  const bmi = weight / ((height / 100) ** 2);
  const mass = clamp((bmi - 22) / 7.5, -0.9, 2.2);
  const bodyFat = measured("bodyFat", 3, 65);
  const fatSignal = clamp((bodyFat - defaults.bodyFat) / 18, -0.8, 1.6);
  const derived = (key, min, max, estimate) => clamp(userHas(key) ? Number(metric[key]) : estimate, min, max);
  const neck = derived("neck", 22, 62, defaults.neck + mass * 1.8);
  const chest = derived("chest", 62, 170, defaults.chest + mass * 7 + (type === "male" ? 0 : fatSignal * 2));
  const waist = derived("waist", 42, 175, defaults.waist + mass * 8 + fatSignal * 8);
  const hips = derived("hips", 62, 180, defaults.hips + mass * 5 + fatSignal * 5);
  const shoulders = derived("shoulders", 30, 82, defaults.shoulders + (chest - defaults.chest) * 0.12 + (type === "male" ? mass * 1.6 : mass * 0.8));
  const arm = derived("arm", 17, 62, defaults.arm + mass * 2.2);
  const forearm = derived("forearm", 15, 48, defaults.forearm + mass * 1.4);
  const thigh = derived("thigh", 30, 92, defaults.thigh + mass * 3.4 + fatSignal * 1.2);
  const calf = derived("calf", 22, 62, defaults.calf + mass * 1.7);
  const halfFromLength = (value, multiplier, min, max) => clamp((value / height) * multiplier, min, max);
  const halfFromCirc = (value, multiplier, min, max) => clamp((value / height) * multiplier, min, max);
  const shoulderHalf = halfFromLength(shoulders, 127, 24, 51) + (type === "male" ? 1.2 : -0.2);
  const chestHalf = halfFromCirc(chest, 57, 18, 45) + (type === "female" ? 0.8 : 0);
  const waistHalf = halfFromCirc(waist, 51, 11, 43) + fatSignal * 1.1;
  const hipHalf = halfFromCirc(hips, 52, 19, 45) + (type === "female" ? 2.2 : 0.2);
  const legLength = clamp(252 + (height - defaults.height) * 0.22, 238, 263);
  const torsoEnd = clamp(145 + (height - defaults.height) * 0.06, 136, 154);
  const muscleSignal = clamp((arm + thigh + calf - (defaults.arm + defaults.thigh + defaults.calf)) / 35, -0.5, 1.5);
  const definition = clamp((type === "male" ? 24 : 30) - bodyFat, 0, 24) / 24;
  const muscleOpacity = clamp(0.03 + definition * 0.86 + Math.max(0, muscleSignal) * 0.1, 0.03, 0.94);
  const muscleDetailOpacity = clamp((definition - 0.16) * 1.25 + Math.max(0, muscleSignal) * 0.08, 0, 0.82);
  const muscleDeepOpacity = clamp((definition - 0.48) * 1.5 + Math.max(0, muscleSignal) * 0.06, 0, 0.72);
  return {
    headX: clamp(10.9 - (height - defaults.height) * 0.01 + (type === "female" ? -0.15 : 0.15), 9.8, 12.5),
    headY: clamp(13.3 - (height - defaults.height) * 0.01, 12.0, 14.6),
    neck: halfFromCirc(neck, 38, 5.4, 11.2),
    shoulder: clamp(shoulderHalf, 23, 52),
    chest: clamp(chestHalf + mass * 0.6, 18, 46),
    waist: clamp(waistHalf + mass * 0.45, 11, 45),
    hips: clamp(hipHalf + mass * 0.35, 19, 47),
    upperArm: halfFromCirc(arm, 54, 5.2, 17),
    forearm: halfFromCirc(forearm, 46, 4.6, 13),
    thigh: halfFromCirc(thigh, 66, 10, 27),
    calf: halfFromCirc(calf, 48, 6, 17),
    torsoEnd,
    legEnd: legLength,
    softness: clamp(0.045 + bodyFat / 190 + Math.max(0, mass) * 0.018, 0.055, 0.42),
    muscleSignal,
    muscleOpacity,
    muscleDetailOpacity,
    muscleDeepOpacity,
    definition,
    bodyFat,
    bmi
  };
}

function bodyAnatomyMarkup(metric, type) {
  const d = bodyModelDimensions(metric, type);
  const l = (width) => (80 - width).toFixed(1);
  const r = (width) => (80 + width).toFixed(1);
  const elbowY = 103;
  const wristY = 146;
  const muscleOpacity = d.muscleOpacity.toFixed(2);
  const muscleDetailOpacity = d.muscleDetailOpacity.toFixed(2);
  const muscleDeepOpacity = d.muscleDeepOpacity.toFixed(2);
  const abdomenTop = Math.max(82, Math.min(96, 89 + d.softness * 12));
  const abdomenBottom = Math.min(d.torsoEnd - 6, abdomenTop + 35);
  return `
    <path class="model-axis" d="M80 4V258 M12 145H148"></path>
    <ellipse class="anatomy-head body-silhouette" cx="80" cy="19" rx="${d.headX}" ry="${d.headY}"></ellipse>
    <path class="body-silhouette model-ear" d="M${l(d.headX * 0.92)} 16Q${l(d.headX + 2.2)} 19 ${l(d.headX * 0.82)} 23M${r(d.headX * 0.92)} 16Q${r(d.headX + 2.2)} 19 ${r(d.headX * 0.82)} 23"></path>
    <path class="body-silhouette model-neck" d="M${l(d.neck)} 30 L${l(d.neck + 1.8)} 40 Q80 45 ${r(d.neck + 1.8)} 40 L${r(d.neck)} 30 Z"></path>
    <path class="body-silhouette model-torso" style="--model-softness:${d.softness}" d="M${l(d.neck + 1.5)} 39 Q${l(d.shoulder - 5)} 42 ${l(d.shoulder)} 53 Q${l(d.chest)} 67 ${l(d.chest)} 79 Q${l(d.waist)} 105 ${l(d.waist)} 122 Q${l(d.hips)} 137 ${l(d.hips)} ${d.torsoEnd} Q80 ${d.torsoEnd + 12} ${r(d.hips)} ${d.torsoEnd} Q${r(d.hips)} 137 ${r(d.waist)} 122 Q${r(d.waist)} 105 ${r(d.chest)} 79 Q${r(d.chest)} 67 ${r(d.shoulder)} 53 Q${r(d.shoulder - 5)} 42 ${r(d.neck + 1.5)} 39 Z"></path>
    <path class="body-silhouette model-arm" d="M${l(d.shoulder)} 52 Q${l(d.shoulder + d.upperArm)} 64 ${l(d.shoulder + d.upperArm)} ${elbowY} Q${l(d.shoulder + d.forearm)} 124 ${l(d.shoulder + d.forearm - 1)} ${wristY} L${l(d.shoulder + 1)} ${wristY + 5} Q${l(d.shoulder - 2)} 123 ${l(d.chest)} 86 Z"></path>
    <path class="body-silhouette model-arm" d="M${r(d.shoulder)} 52 Q${r(d.shoulder + d.upperArm)} 64 ${r(d.shoulder + d.upperArm)} ${elbowY} Q${r(d.shoulder + d.forearm)} 124 ${r(d.shoulder + d.forearm - 1)} ${wristY} L${r(d.shoulder + 1)} ${wristY + 5} Q${r(d.shoulder - 2)} 123 ${r(d.chest)} 86 Z"></path>
    <path class="body-silhouette model-hand" d="M${l(d.shoulder + d.forearm - 1)} ${wristY}Q${l(d.shoulder + d.forearm + 1)} 153 ${l(d.shoulder + d.forearm - 3)} 160L${l(d.shoulder + 1)} ${wristY + 5}Z"></path>
    <path class="body-silhouette model-hand" d="M${r(d.shoulder + d.forearm - 1)} ${wristY}Q${r(d.shoulder + d.forearm + 1)} 153 ${r(d.shoulder + d.forearm - 3)} 160L${r(d.shoulder + 1)} ${wristY + 5}Z"></path>
    <path class="body-silhouette model-leg" d="M${l(d.hips)} ${d.torsoEnd - 2} Q${l(d.thigh)} 178 ${l(d.thigh - 1)} 205 Q${l(d.calf)} 224 73 ${d.legEnd - 8} L72 ${d.legEnd} L79 ${d.legEnd} L80 ${d.torsoEnd + 7} Z"></path>
    <path class="body-silhouette model-leg" d="M${r(d.hips)} ${d.torsoEnd - 2} Q${r(d.thigh)} 178 ${r(d.thigh - 1)} 205 Q${r(d.calf)} 224 87 ${d.legEnd - 8} L88 ${d.legEnd} L81 ${d.legEnd} L80 ${d.torsoEnd + 7} Z"></path>
    <path class="body-silhouette model-foot" d="M72 ${d.legEnd - 2}Q68 ${d.legEnd + 3} 69 ${d.legEnd + 5}H79V${d.legEnd - 2}Z M88 ${d.legEnd - 2}Q92 ${d.legEnd + 3} 91 ${d.legEnd + 5}H81V${d.legEnd - 2}Z"></path>
    <path class="anatomy-line model-detail" d="M80 43V${d.torsoEnd + 5} M${l(d.chest - 2)} 72Q80 80 ${r(d.chest - 2)} 72 M${l(d.waist - 1)} 113Q80 118 ${r(d.waist - 1)} 113 M${l(Math.max(8, d.thigh - 2))} 176L77 238 M${r(Math.max(8, d.thigh - 2))} 176L83 238 M${l(d.neck * 0.7)} 35Q80 38 ${r(d.neck * 0.7)} 35"></path>
    <path class="anatomy-line model-muscle" style="opacity:${muscleOpacity}" d="
      M${l(d.chest - 5)} 66Q80 75 ${r(d.chest - 5)} 66
      M${l(d.chest * 0.58)} 78Q80 84 ${r(d.chest * 0.58)} 78
      M80 ${abdomenTop}V${abdomenBottom}
      M${l(d.waist * 0.32)} ${abdomenTop + 8}H${r(d.waist * 0.32)}
      M${l(d.waist * 0.28)} ${abdomenTop + 19}H${r(d.waist * 0.28)}
      M${l(d.waist * 0.22)} ${abdomenTop + 30}H${r(d.waist * 0.22)}
      M${l(d.shoulder * 0.92)} 58Q${l(d.shoulder * 0.65)} 68 ${l(d.chest * 0.72)} 82
      M${r(d.shoulder * 0.92)} 58Q${r(d.shoulder * 0.65)} 68 ${r(d.chest * 0.72)} 82
      M${l(d.shoulder + d.upperArm * 0.35)} 72Q${l(d.shoulder + d.upperArm * 0.72)} 88 ${l(d.shoulder + d.forearm * 0.58)} 123
      M${r(d.shoulder + d.upperArm * 0.35)} 72Q${r(d.shoulder + d.upperArm * 0.72)} 88 ${r(d.shoulder + d.forearm * 0.58)} 123
      M${l(d.thigh * 0.7)} 176Q${l(d.thigh * 0.35)} 198 76 ${d.legEnd - 18}
      M${r(d.thigh * 0.7)} 176Q${r(d.thigh * 0.35)} 198 84 ${d.legEnd - 18}
    "></path>
    <path class="anatomy-line model-muscle model-muscle-extra" style="opacity:${muscleDetailOpacity}" d="
      M${l(d.chest * 0.72)} 64Q${l(d.chest * 0.32)} 70 80 70Q${r(d.chest * 0.32)} 70 ${r(d.chest * 0.72)} 64
      M${l(d.chest * 0.5)} 86Q${l(d.waist * 0.38)} 100 ${l(d.waist * 0.32)} 121
      M${r(d.chest * 0.5)} 86Q${r(d.waist * 0.38)} 100 ${r(d.waist * 0.32)} 121
      M${l(d.waist * 0.58)} 96Q${l(d.waist * 0.45)} 113 ${l(d.hips * 0.45)} ${d.torsoEnd - 3}
      M${r(d.waist * 0.58)} 96Q${r(d.waist * 0.45)} 113 ${r(d.hips * 0.45)} ${d.torsoEnd - 3}
      M${l(d.shoulder + d.upperArm * 0.15)} 64Q${l(d.shoulder + d.upperArm * 0.88)} 74 ${l(d.shoulder + d.upperArm * 0.45)} 101
      M${r(d.shoulder + d.upperArm * 0.15)} 64Q${r(d.shoulder + d.upperArm * 0.88)} 74 ${r(d.shoulder + d.upperArm * 0.45)} 101
      M${l(d.thigh * 0.42)} 181Q${l(d.thigh * 0.2)} 204 74 ${d.legEnd - 12}
      M${r(d.thigh * 0.42)} 181Q${r(d.thigh * 0.2)} 204 86 ${d.legEnd - 12}
    "></path>
    <path class="anatomy-line model-muscle model-muscle-deep" style="opacity:${muscleDeepOpacity}" d="
      M${l(d.chest * 0.28)} 76V88 M${r(d.chest * 0.28)} 76V88
      M${l(d.waist * 0.16)} ${abdomenTop + 4}V${abdomenBottom - 2}
      M${r(d.waist * 0.16)} ${abdomenTop + 4}V${abdomenBottom - 2}
      M${l(d.shoulder + d.forearm * 0.35)} 111Q${l(d.shoulder + d.forearm * 0.7)} 126 ${l(d.shoulder + d.forearm * 0.48)} 143
      M${r(d.shoulder + d.forearm * 0.35)} 111Q${r(d.shoulder + d.forearm * 0.7)} 126 ${r(d.shoulder + d.forearm * 0.48)} 143
      M74 214Q72 230 73 ${d.legEnd - 5} M86 214Q88 230 87 ${d.legEnd - 5}
    "></path>
  `;
}

function bodyModelCard(metric, type, label, className = "") {
  const d = bodyModelDimensions(metric, type);
  const bmiLabel = Number.isFinite(d.bmi) ? d.bmi.toFixed(1) : "--";
  return `
    <article class="body-model-card ${className}">
      <header><strong>${label}</strong><span>${metric?.date || "LIVE PREVIEW"}</span></header>
      <span class="body-model-bmi-chip" aria-label="BMI ${bmiLabel}"><small>BMI</small> <span>${bmiLabel}</span></span>
      <svg viewBox="0 0 160 265" role="img" aria-label="${label} measurement-responsive body model">
        ${bodyAnatomyMarkup(metric, type)}
      </svg>
      <footer><span>${formatMetric(metric?.height, " CM")}</span><span>${formatMetric(metric?.weight, " KG")}</span><span>${formatMetric(metric?.bodyFat, "%")}</span></footer>
    </article>
  `;
}

function renderBodyLogModel(metric = readBodyMetricDraft()) {
  const container = document.querySelector("#body-log-model");
  if (!container) return;
  const d = bodyModelDimensions(metric, selectedBodyFrame());
  container.innerHTML = `
    <div class="body-model-inline-head">
      <span>PROPORTION MODEL // ${selectedBodyFrame().toUpperCase()}</span>
      <button type="button" data-body-model-inline-toggle>${state.settings.bodyModel ? "HIDE" : "SHOW MODEL"}</button>
    </div>
    ${state.settings.bodyModel ? `
      ${bodyModelCard(metric, selectedBodyFrame(), "LIVE BODY SIGNAL", "body-log-model-card")}
      <div class="body-model-ratios">
        <span><small>CHEST / WAIST</small>${metric?.chest && metric?.waist ? (metric.chest / metric.waist).toFixed(2) : "--"}</span>
        <span><small>SHOULDER / WAIST</small>${metric?.shoulders && metric?.waist ? (metric.shoulders / metric.waist).toFixed(2) : "--"}</span>
        <span><small>WAIST / HEIGHT</small>${metric?.waist && metric?.height ? (metric.waist / metric.height).toFixed(2) : "--"}</span>
        <span><small>BMI SIGNAL</small>${Number.isFinite(d.bmi) ? d.bmi.toFixed(1) : "--"}</span>
      </div>
    ` : ""}
  `;
}

function renderBodyModel() {
  renderBodyLogModel();
}

function removeBodyMetric(id) {
  const removed = state.body.metrics.find((metric) => metric.id === id);
  state.body.metrics = state.body.metrics.filter((metric) => metric.id !== id);
  if (removed) syncDayRecord(removed.date);
  saveState();
  renderBodyMetrics();
  renderBodyModel();
  renderHomeBodyState();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  showToast("body check-in removed");
}

function setBodyTab(tab) {
  currentBodyTab = tab;
  document.querySelectorAll("[data-body-tab]").forEach((button) => button.classList.toggle("active", button.dataset.bodyTab === tab));
  document.querySelectorAll(".body-pane").forEach((pane) => pane.classList.toggle("active", pane.id === `body-${tab}-pane`));
}

function formatIncome(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function renderFocus() {
  renderFocusSummary();
  renderProjects();
  renderFocusLogs();
  renderSkills();
  renderFocusReview();
  renderHomeFocusState();
}

function renderFocusSummary() {
  const summary = document.querySelector("#focus-summary");
  if (!summary) return;
  const todayLogs = state.focus.logs.filter((log) => log.date === dateKey());
  const monthKey = dateKey().slice(0, 7);
  const monthLogs = state.focus.logs.filter((log) => log.date.startsWith(monthKey));
  const visibility = normalizeFocusSummaryVisibility(state.settings.focusSummaryVisibility);
  state.settings.focusSummaryVisibility = visibility;
  const cards = [
    {
      key: "projects",
      html: `<div data-focus-summary-card="projects"><span>ACTIVE PROJECTS</span><strong>${state.focus.projects.filter((project) => project.status === "active").length}</strong><small>${state.focus.projects.length} TOTAL</small></div>`
    },
    {
      key: "today",
      html: `<div data-focus-summary-card="today"><span>TODAY'S FOCUS</span><strong>${todayLogs.reduce((total, log) => total + log.focusMinutes, 0)}M</strong><small>${todayLogs.length} OUTPUT LOGS</small></div>`
    },
    {
      key: "income",
      html: `<div data-focus-summary-card="income"><span>MONTH INCOME</span><strong>${formatIncome(monthLogs.reduce((total, log) => total + log.income, 0))}</strong><small>${state.focus.skills.length} SKILLS TRACKED</small></div>`
    }
  ].filter((card) => visibility[card.key] !== false);
  summary.dataset.count = String(cards.length);
  summary.innerHTML = cards.map((card) => card.html).join("");
  renderFocusSummaryControl();
}

function renderFocusSummaryControl() {
  const visibility = normalizeFocusSummaryVisibility(state.settings.focusSummaryVisibility);
  document.querySelectorAll("[data-focus-summary-visibility]").forEach((button) => {
    const active = visibility[button.dataset.focusSummaryVisibility] !== false;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function toggleFocusSummaryVisibility(key) {
  if (!state.settings.editMode || !FOCUS_SUMMARY_KEYS.includes(key)) return;
  const visibility = normalizeFocusSummaryVisibility(state.settings.focusSummaryVisibility);
  const visibleCards = FOCUS_SUMMARY_KEYS.filter((item) => visibility[item] !== false);
  if (visibility[key] !== false && visibleCards.length === 1) {
    showToast("keep at least one focus card");
    return;
  }
  visibility[key] = visibility[key] === false;
  state.settings.focusSummaryVisibility = visibility;
  saveState();
  renderFocusSummary();
  const label = { projects: "projects", today: "today", income: "income" }[key] || "card";
  showToast(`${label} card ${visibility[key] ? "shown" : "hidden"} // data preserved`);
}

function renderHomeFocusState() {
  const status = document.querySelector("#home-focus-state");
  if (!status) return;
  const todayLogs = state.focus.logs.filter((log) => log.date === dateKey());
  const minutes = todayLogs.reduce((total, log) => total + log.focusMinutes, 0);
  status.textContent = todayLogs.length ? `${minutes}M // ${todayLogs.length} OUTPUT` : `${state.focus.projects.filter((project) => project.status === "active").length} ACTIVE`;
}

function renderProjects() {
  const list = document.querySelector("#project-list");
  const select = document.querySelector("#focus-log-target");
  if (!list || !select) return;
  list.innerHTML = state.focus.projects.length
    ? state.focus.projects.map((project) => `
      <article class="project-card" data-project-status="${project.status}">
        <header><span>${project.status.toUpperCase()}</span><div class="manage-actions"><button type="button" data-project-edit="${project.id}">EDIT</button><button type="button" data-project-remove="${project.id}">DEL</button></div></header>
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(project.outcome || "No outcome defined.")}</p>
      </article>
    `).join("")
    : '<div class="focus-empty"><strong>NO PROJECTS ONLINE</strong><span>Define the work and its intended outcome.</span></div>';
  const previous = select.value;
  select.innerHTML = `
    <option value="">GENERAL OUTPUT</option>
    <optgroup label="PROJECTS">${state.focus.projects.map((project) => `<option value="project:${project.id}">${escapeHtml(project.name)} // ${project.status.toUpperCase()}</option>`).join("")}</optgroup>
    <optgroup label="SKILLS">${state.focus.skills.map((skill) => `<option value="skill:${skill.id}">${escapeHtml(skill.name)} // ${skill.progress}%</option>`).join("")}</optgroup>
  `;
  select.value = [...select.options].some((option) => option.value === previous) ? previous : "";
  syncCustomSelect(select);
}

function saveProject() {
  const name = document.querySelector("#project-name").value.trim();
  const outcome = document.querySelector("#project-outcome").value.trim();
  const status = document.querySelector("#project-status").value;
  if (!name) {
    showToast("project needs a name");
    return;
  }
  if (editingProjectId) {
    const project = state.focus.projects.find((item) => item.id === editingProjectId);
    if (project) Object.assign(project, { name, outcome, status, updatedAt: new Date().toISOString() });
  } else {
    state.focus.projects.unshift({ id: `${Date.now()}`, name, outcome, status, updatedAt: new Date().toISOString() });
  }
  editingProjectId = null;
  document.querySelector("#project-form").reset();
  document.querySelector("#project-status").value = "active";
  syncCustomSelect(document.querySelector("#project-status"));
  document.querySelector("#project-form .primary-button").textContent = "SAVE PROJECT";
  saveState();
  renderFocus();
  showToast("project state saved");
}

function editProject(id) {
  const project = state.focus.projects.find((item) => item.id === id);
  if (!project) return;
  editingProjectId = id;
  document.querySelector("#project-name").value = project.name;
  document.querySelector("#project-outcome").value = project.outcome;
  document.querySelector("#project-status").value = project.status;
  syncCustomSelect(document.querySelector("#project-status"));
  document.querySelector("#project-form .primary-button").textContent = "UPDATE PROJECT";
  document.querySelector("#project-form").scrollIntoView({ behavior: state.settings.motion ? "smooth" : "auto", block: "start" });
}

function removeProject(id) {
  state.focus.projects = state.focus.projects.filter((project) => project.id !== id);
  if (editingProjectId === id) {
    editingProjectId = null;
    document.querySelector("#project-form").reset();
    document.querySelector("#project-form .primary-button").textContent = "SAVE PROJECT";
  }
  saveState();
  renderFocus();
  showToast("project removed // logs preserved");
}

function saveFocusLog() {
  const target = document.querySelector("#focus-log-target").value;
  const [targetType, targetId = ""] = target.split(":");
  const projectId = targetType === "project" ? targetId : "";
  const project = state.focus.projects.find((item) => item.id === projectId);
  const skillId = targetType === "skill" ? targetId : "";
  const skill = state.focus.skills.find((item) => item.id === skillId);
  const existing = state.focus.logs.find((log) => log.id === editingFocusLogId);
  const entry = {
    id: existing?.id || `${Date.now()}`,
    date: existing?.date || dateKey(),
    projectId,
    projectName: project?.name || "General output",
    skillId,
    skillName: skill?.name || "",
    output: document.querySelector("#focus-log-output").value.trim(),
    focusMinutes: Math.max(0, Number(document.querySelector("#focus-log-minutes").value) || 0),
    income: Math.max(0, Number(document.querySelector("#focus-log-income").value) || 0),
    note: limitedText(document.querySelector("#focus-log-note").value, NOTE_LIMITS.standard)
  };
  if (!entry.output) {
    showToast("describe the output");
    return;
  }
  if (existing) state.focus.logs = state.focus.logs.filter((log) => log.id !== existing.id);
  state.focus.logs.unshift(entry);
  if (existing && existing.date !== entry.date) syncDayRecord(existing.date);
  syncDayRecord(entry.date);
  saveState();
  document.querySelector("#focus-log-form").reset();
  editingFocusLogId = null;
  document.querySelector("#focus-log-form .primary-button").textContent = "ARCHIVE OUTPUT";
  renderFocus();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  showToast("output archived");
}

function renderFocusLogs() {
  const list = document.querySelector("#focus-log-list");
  if (!list) return;
  const logs = [...state.focus.logs].sort((a, b) => b.date.localeCompare(a.date));
  const visibleLogs = logs.slice(0, focusHistoryLimit);
  list.innerHTML = logs.length
    ? visibleLogs.map((log) => `
      <article class="output-card">
        <header><strong>${log.date} // ${escapeHtml(log.skillName || log.projectName || "GENERAL OUTPUT")}</strong><span class="manage-actions"><button type="button" data-focus-log-edit="${log.id}">EDIT</button><button type="button" data-focus-log-remove="${log.id}">DEL</button></span></header>
        <p>${escapeHtml(log.output)}</p>
        <div><span>${Math.round(log.focusMinutes)} MIN${log.skillName ? ` // ${escapeHtml(log.skillName)}` : ""}</span><span>${formatIncome(log.income)}</span></div>
        ${log.note ? `<small>${escapeHtml(log.note)}</small>` : ""}
      </article>
    `).join("") + (logs.length > visibleLogs.length ? `
      <div class="history-window">
        <span>SHOWING ${visibleLogs.length} OF ${logs.length} OUTPUT LOGS</span>
        <button type="button" data-load-focus-history>LOAD OLDER OUTPUTS</button>
      </div>
    ` : "")
    : '<div class="focus-empty"><strong>NO OUTPUT LOGS</strong><span>Record a finished result, not merely an intention.</span></div>';
}

function editFocusLog(id) {
  const log = state.focus.logs.find((item) => item.id === id);
  if (!log) return;
  editingFocusLogId = id;
  document.querySelector("#focus-log-target").value = log.projectId ? `project:${log.projectId}` : log.skillId ? `skill:${log.skillId}` : "";
  document.querySelector("#focus-log-output").value = log.output;
  document.querySelector("#focus-log-minutes").value = log.focusMinutes || "";
  document.querySelector("#focus-log-income").value = log.income || "";
  document.querySelector("#focus-log-note").value = log.note || "";
  document.querySelector("#focus-log-form .primary-button").textContent = "UPDATE OUTPUT";
  document.querySelector("#focus-log-form").scrollIntoView({ behavior: state.settings.motion ? "smooth" : "auto", block: "start" });
}

function removeFocusLog(id) {
  const removed = state.focus.logs.find((log) => log.id === id);
  state.focus.logs = state.focus.logs.filter((log) => log.id !== id);
  if (removed) syncDayRecord(removed.date);
  saveState();
  renderFocus();
  renderHomeArchive();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  showToast("output log removed");
}

function saveSkill() {
  const name = document.querySelector("#skill-name").value.trim();
  const progress = Math.min(100, Math.max(0, Number(document.querySelector("#skill-progress").value) || 0));
  const note = limitedText(document.querySelector("#skill-note").value, NOTE_LIMITS.standard);
  let masteredSkillId = null;
  if (!name) {
    showToast("skill needs a name");
    return;
  }
  if (editingSkillId) {
    const skill = state.focus.skills.find((item) => item.id === editingSkillId);
    if (skill) {
      const changed = skill.progress !== progress;
      const previousProgress = skill.progress;
      Object.assign(skill, { name, progress, note });
      skill.progressHistory ||= [{ value: previousProgress, date: dateKey() }];
      if (changed) skill.progressHistory.push({ value: progress, date: dateKey() });
      if (previousProgress < 100 && progress >= 100) {
        skill.masteredAt = Date.now();
        masteredSkillId = skill.id;
      }
      if (progress < 100) skill.masteredAt = null;
    }
  } else {
    const id = `${Date.now()}`;
    state.focus.skills.unshift({ id, name, progress, note, progressHistory: [{ value: progress, date: dateKey() }], masteredAt: progress >= 100 ? Date.now() : null });
    if (progress >= 100) masteredSkillId = id;
  }
  editingSkillId = null;
  saveState();
  document.querySelector("#skill-form").reset();
  document.querySelector("#skill-form .primary-button").textContent = "ADD SKILL";
  renderFocus();
  if (masteredSkillId) document.querySelector(`[data-skill-boost="${masteredSkillId}"]`)?.closest(".skill-card")?.classList.add("skill-complete-arrival");
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  showToast(masteredSkillId ? `${name} mastered` : "skill added");
}

function renderSkills() {
  const list = document.querySelector("#skill-list");
  if (!list) return;
  const masteryWindow = MASTERED_SKILL_VISIBLE_DAYS * 24 * 60 * 60 * 1000;
  const visibleSkills = state.focus.skills.filter((skill) => skill.progress < 100 || !skill.masteredAt || Date.now() - skill.masteredAt <= masteryWindow);
  const archivedMastered = state.focus.skills.length - visibleSkills.length;
  list.innerHTML = visibleSkills.length
    ? visibleSkills.map((skill) => `
      <article class="skill-card ${skill.progress >= 100 ? "skill-complete" : ""}">
        <header><strong>${escapeHtml(skill.name)}</strong><span class="manage-actions"><button type="button" data-skill-edit="${skill.id}">EDIT</button><button type="button" data-skill-remove="${skill.id}">DEL</button></span></header>
        <div class="skill-progress"><span data-skill-bar="${skill.id}" data-progress="${skill.progress}"></span></div>
        <div class="skill-state"><span>${skill.progress >= 100 ? "MASTERED // 100%" : `${skill.progress}% CAPABILITY`}</span><small>${escapeHtml(skill.note || "No learning note.")}</small></div>
        <button class="skill-boost" type="button" data-skill-boost="${skill.id}" ${skill.progress >= 100 ? "disabled" : ""}>${skill.progress >= 100 ? "SKILL MASTERED" : "+5 CAPABILITY"}</button>
      </article>
    `).join("") + (archivedMastered ? `<div class="skill-archive-note">${archivedMastered} MASTERED SKILL${archivedMastered === 1 ? "" : "S"} MOVED TO REVIEW</div>` : "")
    : `<div class="focus-empty"><strong>${archivedMastered ? "ALL VISIBLE SKILLS MASTERED" : "NO SKILLS TRACKED"}</strong><span>${archivedMastered ? `${archivedMastered} mastered skill${archivedMastered === 1 ? " is" : "s are"} preserved in Review.` : "Add a capability you are deliberately building."}</span></div>`;
  requestAnimationFrame(() => {
    list.querySelectorAll("[data-skill-bar]").forEach((bar) => {
      bar.style.width = `${bar.dataset.progress}%`;
    });
  });
}

function boostSkill(id) {
  const skill = state.focus.skills.find((item) => item.id === id);
  if (!skill) return;
  const button = document.querySelector(`[data-skill-boost="${id}"]`);
  const card = button?.closest(".skill-card");
  const previousProgress = skill.progress;
  skill.progress = Math.min(100, skill.progress + 5);
  skill.progressHistory ||= [{ value: previousProgress, date: dateKey() }];
  skill.progressHistory.push({ value: skill.progress, date: dateKey() });
  if (skill.progress >= 100 && previousProgress < 100) skill.masteredAt = Date.now();
  saveState();
  const bar = card?.querySelector("[data-skill-bar]");
  const capability = card?.querySelector(".skill-state > span");
  if (bar) {
    bar.dataset.progress = String(skill.progress);
    bar.style.width = `${skill.progress}%`;
  }
  if (capability) capability.textContent = skill.progress >= 100 ? "MASTERED // 100%" : `${skill.progress}% CAPABILITY`;
  const option = document.querySelector(`#focus-log-target option[value="skill:${id}"]`);
  if (option) option.textContent = `${skill.name} // ${skill.progress}%`;
  renderFocusSummary();
  renderFocusReview();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  if (skill.progress >= 100 && previousProgress < 100) {
    card?.classList.add("skill-complete", "skill-complete-arrival");
    if (button) {
      button.disabled = true;
      button.textContent = "SKILL MASTERED";
    }
    showToast(`${skill.name} mastered`);
  } else {
    pulseControl(button);
    showToast(`${skill.name} // ${skill.progress}% capability`);
  }
}

function renderFocusReview() {
  const container = document.querySelector("#focus-review");
  if (!container) return;
  const summarize = (items, idKey, source) => items.map((item) => {
    const logs = state.focus.logs.filter((log) => log[idKey] === item.id);
    const progressHistory = item.progressHistory?.length ? item.progressHistory : [{ value: item.progress || 0 }];
    return {
      name: item.name,
      signal: source === "skill" ? `${item.progress}% CAPABILITY` : item.status.toUpperCase(),
      minutes: logs.reduce((sum, log) => sum + log.focusMinutes, 0),
      income: logs.reduce((sum, log) => sum + log.income, 0),
      averageProgress: Math.round(progressHistory.reduce((sum, entry) => sum + Number(entry.value || 0), 0) / progressHistory.length),
      outputs: logs.length
    };
  }).filter((item) => item.outputs || source === "skill");
  const projects = summarize(state.focus.projects, "projectId", "project");
  const skills = summarize(state.focus.skills, "skillId", "skill");
  const reviewCards = (items, empty, source) => items.length ? items.map((item) => `
    <article class="focus-review-card">
      <header><strong>${escapeHtml(item.name)}</strong><span>${item.signal}</span></header>
      <div><span><small>TIME</small>${Math.round(item.minutes)} MIN</span><span><small>${source === "skill" ? "AVG PROGRESS" : "INCOME"}</small>${source === "skill" ? `${item.averageProgress}%` : formatIncome(item.income)}</span><span><small>OUTPUTS</small>${item.outputs}</span></div>
    </article>
  `).join("") : `<div class="focus-empty"><strong>${empty}</strong><span>Link output logs to build this review.</span></div>`;
  const totalMinutes = state.focus.logs.reduce((sum, log) => sum + log.focusMinutes, 0);
  const totalIncome = state.focus.logs.reduce((sum, log) => sum + log.income, 0);
  container.innerHTML = `
    <section class="review-overview focus-review-overview">
      <div><span>TOTAL FOCUS</span><strong>${Math.round(totalMinutes / 60)}H</strong><small>${state.focus.logs.length} OUTPUTS</small></div>
      <div><span>TOTAL INCOME</span><strong>${formatIncome(totalIncome)}</strong><small>LINKED OUTPUT</small></div>
      <div><span>SKILLS</span><strong>${state.focus.skills.length}</strong><small>${skills.filter((skill) => skill.outputs).length} WITH OUTPUT</small></div>
    </section>
    <section class="focus-review-section"><div class="panel-header"><span>PROJECT RETURN</span><span>TIME // MONEY</span></div>${reviewCards(projects, "NO PROJECT OUTPUT YET", "project")}</section>
    <section class="focus-review-section"><div class="panel-header"><span>SKILL INVESTMENT</span><span>TIME // PROGRESSION</span></div>${reviewCards(skills, "NO SKILLS TRACKED", "skill")}</section>
  `;
}

function editSkill(id) {
  const skill = state.focus.skills.find((item) => item.id === id);
  if (!skill) return;
  editingSkillId = id;
  document.querySelector("#skill-name").value = skill.name;
  document.querySelector("#skill-progress").value = skill.progress;
  document.querySelector("#skill-note").value = skill.note;
  document.querySelector("#skill-form .primary-button").textContent = "UPDATE SKILL";
  document.querySelector("#skill-form").scrollIntoView({ behavior: state.settings.motion ? "smooth" : "auto", block: "start" });
}

function removeSkill(id) {
  state.focus.skills = state.focus.skills.filter((skill) => skill.id !== id);
  saveState();
  renderFocus();
  if (currentArchiveTab === "reviews") renderWeeklyReviews();
  showToast("skill removed");
}

function setFocusTab(tab) {
  currentFocusTab = tab;
  document.querySelectorAll("[data-focus-tab]").forEach((button) => button.classList.toggle("active", button.dataset.focusTab === tab));
  document.querySelectorAll(".focus-pane").forEach((pane) => pane.classList.toggle("active", pane.id === `focus-${tab}-pane`));
}

function setToggle(button, active) {
  button.classList.toggle("active", active);
  button.setAttribute("aria-checked", String(active));
}

function closeCustomSelects(except = null) {
  document.querySelectorAll(".archive-select.open").forEach((shell) => {
    if (shell === except) return;
    shell.classList.remove("open");
    shell.querySelector(".archive-select-menu").hidden = true;
    shell.querySelector(".archive-select-trigger").setAttribute("aria-expanded", "false");
  });
}

function syncCustomSelect(select) {
  const controls = customSelectRegistry.get(select);
  if (!controls) return;
  const selected = select.selectedOptions[0] || select.options[0];
  controls.label.textContent = selected?.textContent?.trim() || "SELECT";
  controls.menu.replaceChildren();
  [...select.children].forEach((child) => {
    if (child instanceof HTMLOptGroupElement) {
      const groupLabel = document.createElement("span");
      groupLabel.className = "archive-select-group";
      groupLabel.textContent = child.label;
      controls.menu.append(groupLabel);
      [...child.children].forEach((option) => appendCustomSelectOption(select, controls.menu, option));
    } else if (child instanceof HTMLOptionElement) {
      appendCustomSelectOption(select, controls.menu, child);
    }
  });
  controls.trigger.disabled = select.disabled;
}

function appendCustomSelectOption(select, menu, option) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.selectValue = option.value;
  button.className = option.value === select.value ? "active" : "";
  button.disabled = option.disabled;
  button.setAttribute("role", "option");
  button.setAttribute("aria-selected", String(option.value === select.value));
  button.textContent = option.textContent.trim();
  menu.append(button);
}

function enhanceCustomSelect(select) {
  if (customSelectRegistry.has(select)) {
    syncCustomSelect(select);
    return;
  }
  const shell = document.createElement("div");
  shell.className = "archive-select";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "archive-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const label = document.createElement("span");
  const marker = document.createElement("i");
  marker.textContent = "⌄";
  trigger.append(label, marker);
  const menu = document.createElement("div");
  menu.className = "archive-select-menu";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;
  shell.append(trigger, menu);
  select.classList.add("custom-select-source");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  select.after(shell);
  customSelectRegistry.set(select, { shell, trigger, label, menu });

  trigger.addEventListener("click", () => {
    const opening = menu.hidden;
    closeCustomSelects(opening ? shell : null);
    menu.hidden = !opening;
    shell.classList.toggle("open", opening);
    trigger.setAttribute("aria-expanded", String(opening));
  });
  menu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-select-value]");
    if (!option) return;
    select.value = option.dataset.selectValue;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    syncCustomSelect(select);
    closeCustomSelects();
    pulseControl(shell);
  });
  select.form?.addEventListener("reset", () => setTimeout(() => syncCustomSelect(select), 0));
  new MutationObserver(() => syncCustomSelect(select)).observe(select, { childList: true, subtree: true });
  syncCustomSelect(select);
}

function initializeCustomSelects() {
  document.querySelectorAll(".focus-form select").forEach(enhanceCustomSelect);
}

function setConfigTab(tab) {
  currentConfigTab = ["general", "layout", "themes"].includes(tab) ? tab : "general";
  document.querySelectorAll("[data-config-tab]").forEach((button) => {
    const active = button.dataset.configTab === currentConfigTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".config-pane").forEach((pane) => {
    pane.classList.toggle("active", pane.id === `config-${currentConfigTab}-pane`);
  });
}

function renderSettings() {
  setToggle(document.querySelector("#intro-toggle"), state.settings.intro);
  setToggle(document.querySelector("#motion-toggle"), state.settings.motion);
  setToggle(document.querySelector("#explanatory-text-toggle"), state.settings.explanatoryText);
  setToggle(document.querySelector("#edit-mode-toggle"), state.settings.editMode);
  document.body.classList.toggle("no-motion", !state.settings.motion);
  document.body.classList.toggle("edit-mode", state.settings.editMode);
  document.body.classList.toggle("show-explanations", state.settings.explanatoryText);
  if (!state.settings.editMode) closeInlineEditControls();
  applyTheme(state.settings.theme);
  document.querySelectorAll("[data-theme-value]").forEach((button) => {
    const active = button.dataset.themeValue === state.settings.theme;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  document.querySelectorAll("button[data-color-vividness]").forEach((button) => {
    const active = button.dataset.colorVividness === state.settings.colorVividness;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  document.querySelectorAll("button[data-gradient-strength]").forEach((button) => {
    const active = button.dataset.gradientStrength === state.settings.gradientStrength;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  document.querySelectorAll("[data-start-screen]").forEach((button) => {
    button.classList.toggle("active", button.dataset.startScreen === state.settings.startScreen);
  });
  const bodyFrameSetting = document.querySelector("#body-frame-setting");
  if (bodyFrameSetting) bodyFrameSetting.hidden = !state.settings.editMode;
  document.querySelectorAll("[data-body-frame]").forEach((button) => {
    const active = button.dataset.bodyFrame === selectedBodyFrame();
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  renderTabVisibility();
  renderAreaVisibility();
  renderBodySummaryControl();
  renderFocusSummaryControl();
  renderHomeGroupControl();
  renderBodyModel();
  setConfigTab(currentConfigTab);
}

function closeInlineEditControls() {
  document.querySelectorAll(".inline-tab-options").forEach((panel) => {
    panel.hidden = true;
  });
  document.querySelectorAll("[data-inline-tab-toggle], [data-summary-toggle], [data-home-group-toggle]").forEach((button) => {
    button.classList.remove("active");
  });
}

function orderAreaControls(group, buttonSelector, tabContainerSelector) {
  const order = normalizeOrder(state.settings.areaOrder?.[group], AREA_GROUP_KEYS[group]);
  state.settings.areaOrder ||= {};
  state.settings.areaOrder[group] = order;
  const keyByTab = AREA_TAB_KEYS[group];
  const tabByKey = Object.fromEntries(Object.entries(keyByTab).map(([tab, key]) => [key, tab]));
  const tabContainer = document.querySelector(tabContainerSelector);
  const optionContainer = document.querySelector(`[data-inline-tab-control="${group}"] .inline-tab-options`);
  order.forEach((key) => {
    const tab = tabByKey[key];
    const tabButton = document.querySelector(`${buttonSelector}[data-${group}-tab="${tab}"]`);
    const optionButton = document.querySelector(`[data-area-visibility="${key}"]`);
    if (tabButton) tabContainer?.append(tabButton);
    if (optionButton) optionContainer?.append(optionButton);
  });
}

function setFluidTabCount(container, buttons) {
  if (!container) return;
  const visibleCount = Math.max(1, buttons.filter((button) => !button.hidden).length);
  container.style.setProperty("--visible-tab-count", visibleCount);
}

function renderAreaVisibility() {
  const visibility = state.settings.areaVisibility;
  document.querySelectorAll("[data-area-visibility]").forEach((button) => {
    const active = visibility[button.dataset.areaVisibility] !== false;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  orderAreaControls("body", "[data-body-tab]", ".body-tabs");
  orderAreaControls("focus", "[data-focus-tab]", ".focus-tabs");
  orderAreaControls("archive", "[data-archive-tab]", ".archive-tabs");

  const bodyMap = AREA_TAB_KEYS.body;
  document.querySelectorAll("[data-body-tab]").forEach((button) => {
    const enabled = visibility[bodyMap[button.dataset.bodyTab]] !== false;
    button.hidden = !enabled;
    document.querySelector(`#body-${button.dataset.bodyTab}-pane`)?.toggleAttribute("hidden", !enabled);
  });
  const visibleBody = [...document.querySelectorAll("[data-body-tab]")].filter((button) => !button.hidden);
  setFluidTabCount(document.querySelector(".body-tabs"), [...document.querySelectorAll("[data-body-tab]")]);
  if (!visibleBody.some((button) => button.dataset.bodyTab === currentBodyTab)) setBodyTab(visibleBody[0]?.dataset.bodyTab || "metrics");

  const focusMap = AREA_TAB_KEYS.focus;
  document.querySelectorAll("[data-focus-tab]").forEach((button) => {
    const enabled = visibility[focusMap[button.dataset.focusTab]] !== false;
    button.hidden = !enabled;
    document.querySelector(`#focus-${button.dataset.focusTab}-pane`)?.toggleAttribute("hidden", !enabled);
  });
  const visibleFocus = [...document.querySelectorAll("[data-focus-tab]")].filter((button) => !button.hidden);
  setFluidTabCount(document.querySelector(".focus-tabs"), [...document.querySelectorAll("[data-focus-tab]")]);
  if (!visibleFocus.some((button) => button.dataset.focusTab === currentFocusTab)) setFocusTab(visibleFocus[0]?.dataset.focusTab || "logs");

  const archiveMap = AREA_TAB_KEYS.archive;
  document.querySelectorAll("[data-archive-tab]").forEach((button) => {
    const enabled = visibility[archiveMap[button.dataset.archiveTab]] !== false;
    button.hidden = !enabled;
  });
  const visibleArchive = [...document.querySelectorAll("[data-archive-tab]")].filter((button) => !button.hidden);
  setFluidTabCount(document.querySelector(".archive-tabs"), [...document.querySelectorAll("[data-archive-tab]")]);
  if (!visibleArchive.some((button) => button.dataset.archiveTab === currentArchiveTab)) {
    setArchiveTab(visibleArchive[0]?.dataset.archiveTab || "days");
  }
}

function toggleAreaVisibility(key, group) {
  if (!state.settings.editMode) return;
  const groupKeys = AREA_GROUP_KEYS[group] || AREA_GROUP_KEYS.focus;
  const currentlyVisible = groupKeys.filter((item) => state.settings.areaVisibility[item] !== false);
  if (state.settings.areaVisibility[key] !== false && currentlyVisible.length === 1) {
    showToast(`keep at least one ${group} sub-tab`);
    return;
  }
  state.settings.areaVisibility[key] = state.settings.areaVisibility[key] === false;
  layoutAreaPressOrder[group] ||= [];
  if (state.settings.areaVisibility[key]) {
    layoutAreaPressOrder[group] = [...layoutAreaPressOrder[group].filter((item) => item !== key), key];
    state.settings.areaOrder[group] = normalizeOrder([
      ...layoutAreaPressOrder[group],
      ...normalizeOrder(state.settings.areaOrder?.[group], groupKeys)
    ], groupKeys);
  } else {
    layoutAreaPressOrder[group] = layoutAreaPressOrder[group].filter((item) => item !== key);
  }
  saveState({ configFeedback: true });
  renderAreaVisibility();
  showToast(`${key} ${state.settings.areaVisibility[key] ? "shown" : "hidden"} // data preserved`);
}

function renderTabVisibility() {
  const visibility = state.settings.tabVisibility;
  document.querySelectorAll("[data-tab-visibility]").forEach((button) => {
    const active = visibility[button.dataset.tabVisibility] !== false;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const launchpad = document.querySelector(".home-launchpad");
  state.settings.tabOrder = normalizeOrder(state.settings.tabOrder, HOME_TAB_KEYS);
  state.settings.tabOrder.forEach((tab) => {
    const button = document.querySelector(`[data-home-tab="${tab}"]`);
    if (button) launchpad?.append(button);
  });
  document.querySelectorAll("[data-home-tab]").forEach((button) => {
    button.hidden = visibility[button.dataset.homeTab] === false;
  });
  const visibleTabs = [...document.querySelectorAll("[data-home-tab]")].filter((button) => !button.hidden);
  visibleTabs.forEach((button, index) => {
    const number = button.querySelector(":scope > span");
    if (number) number.textContent = String(index + 1).padStart(2, "0");
  });
  setFluidTabCount(launchpad, [...document.querySelectorAll("[data-home-tab]")]);
  launchpad?.style.setProperty("--home-tab-columns", visibleTabs.length === 4 ? 2 : Math.max(1, visibleTabs.length));
  launchpad.classList.toggle("empty", !visibleTabs.length);
}

function toggleTabVisibility(tab) {
  state.settings.tabVisibility[tab] = state.settings.tabVisibility[tab] === false;
  if (state.settings.tabVisibility[tab]) {
    layoutTabPressOrder = [...layoutTabPressOrder.filter((item) => item !== tab), tab];
    state.settings.tabOrder = normalizeOrder([
      ...layoutTabPressOrder,
      ...normalizeOrder(state.settings.tabOrder, HOME_TAB_KEYS)
    ], HOME_TAB_KEYS);
  } else {
    layoutTabPressOrder = layoutTabPressOrder.filter((item) => item !== tab);
  }
  saveState({ configFeedback: true });
  renderTabVisibility();
  showToast(`${tab} ${state.settings.tabVisibility[tab] ? "shown" : "hidden"} // data preserved`);
}

function applyTheme(theme) {
  const themes = {
    violet: { accent: [74, 154, 190], strong: [153, 216, 232], surface: [7, 18, 23] },
    deep: { accent: [112, 76, 160], strong: [188, 153, 222], surface: [14, 8, 22] },
    ember: { accent: [170, 79, 63], strong: [235, 157, 125], surface: [24, 9, 7] },
    slate: { accent: [157, 132, 72], strong: [224, 198, 126], surface: [22, 17, 7] }
  };
  const selectedTheme = theme in themes ? theme : "violet";
  const vividness = ["soft", "balanced", "vivid"].includes(state.settings.colorVividness) ? state.settings.colorVividness : "balanced";
  const gradientStrength = ["soft", "balanced", "strong"].includes(state.settings.gradientStrength) ? state.settings.gradientStrength : "balanced";
  const mix = vividness === "soft" ? 0.78 : vividness === "vivid" ? 1.13 : 1;
  const adjust = (values) => values.map((value) => Math.round(Math.max(0, Math.min(255, value * mix + (vividness === "soft" ? 10 : 0)))));
  const accent = adjust(themes[selectedTheme].accent);
  const strong = adjust(themes[selectedTheme].strong);
  const surface = themes[selectedTheme].surface;
  const vividnessMap = {
    soft: { wash: 0.018, glow: 0.055, grid: 0.008, saturation: 0.84 },
    balanced: { wash: 0.055, glow: 0.12, grid: 0.015, saturation: 1 },
    vivid: { wash: 0.11, glow: 0.22, grid: 0.026, saturation: 1.18 }
  };
  const impact = vividnessMap[vividness];
  const gradientMap = {
    soft: { glow: 0.034, wash: 0.012, grid: 0.005, stage: 0.01 },
    balanced: { glow: 0.065, wash: 0.025, grid: 0.009, stage: 0.018 },
    strong: { glow: 0.105, wash: 0.045, grid: 0.014, stage: 0.032 }
  };
  const gradient = gradientMap[gradientStrength];
  state.settings.theme = selectedTheme;
  state.settings.gradientStrength = gradientStrength;
  document.body.dataset.theme = selectedTheme;
  document.body.dataset.colorVividness = vividness;
  document.body.dataset.gradientStrength = gradientStrength;
  delete document.body.dataset.signalImpact;
  const parseRgb = (value) => {
    const numbers = String(value || "").match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number);
    return numbers?.length === 3 ? numbers : null;
  };
  const bodyStyle = getComputedStyle(document.body);
  const currentAccent = parseRgb(document.body.style.getPropertyValue("--accent-rgb") || bodyStyle.getPropertyValue("--accent-rgb"));
  const currentStrong = parseRgb(document.body.style.getPropertyValue("--accent-strong") || bodyStyle.getPropertyValue("--accent-strong"));
  const setColors = (nextAccent, nextStrong) => {
    const roundedAccent = nextAccent.map((value) => Math.round(value));
    const roundedStrong = nextStrong.map((value) => Math.round(value));
    document.body.style.setProperty("--accent-rgb", roundedAccent.join(", "));
    document.body.style.setProperty("--accent", `rgb(${roundedAccent.join(" ")})`);
    document.body.style.setProperty("--accent-strong", `rgb(${roundedStrong.join(" ")})`);
    document.documentElement.style.setProperty("--accent-rgb", roundedAccent.join(", "));
    document.documentElement.style.setProperty("--theme-surface-rgb", surface.join(", "));
    document.documentElement.style.setProperty("--theme-wash", String(impact.wash));
    document.documentElement.style.setProperty("--theme-glow", String(impact.glow));
    document.documentElement.style.setProperty("--theme-grid", String(impact.grid));
    document.documentElement.style.setProperty("--theme-saturation", String(impact.saturation));
    document.documentElement.style.setProperty("--gradient-glow", String(gradient.glow));
    document.documentElement.style.setProperty("--gradient-wash", String(gradient.wash));
    document.documentElement.style.setProperty("--gradient-grid", String(gradient.grid));
    document.documentElement.style.setProperty("--gradient-stage", String(gradient.stage));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", `rgb(${surface.map((value) => Math.round(value * 0.28)).join(" ")})`);
  };
  cancelAnimationFrame(themeColorFrame);
  const unchanged = currentAccent?.every((value, index) => Math.round(value) === accent[index])
    && currentStrong?.every((value, index) => Math.round(value) === strong[index]);
  if (!state.settings.motion || !currentAccent || !currentStrong || unchanged) {
    setColors(accent, strong);
    return;
  }
  const startedAt = performance.now();
  const duration = 460;
  const tick = (now) => {
    const linear = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - ((1 - linear) ** 3);
    setColors(
      currentAccent.map((value, index) => value + ((accent[index] - value) * eased)),
      currentStrong.map((value, index) => value + ((strong[index] - value) * eased))
    );
    if (linear < 1) themeColorFrame = requestAnimationFrame(tick);
  };
  themeColorFrame = requestAnimationFrame(tick);
}

function openClearDataDialog() {
  const dialog = document.querySelector("#clear-data-dialog");
  if (!dialog || dialog.open) return;
  showModalLocked(dialog);
  requestAnimationFrame(() => dialog.classList.add("visible"));
  requestAnimationFrame(() => document.querySelector("#clear-data-cancel")?.focus({ preventScroll: true }));
}

function closeClearDataDialog() {
  const dialog = document.querySelector("#clear-data-dialog");
  if (!dialog?.open) return;
  dialog.classList.remove("visible");
  dialog.classList.add("closing");
  setTimeout(() => {
    closeModalUnlocked(dialog);
    dialog.classList.remove("closing");
  }, 220);
}

function clearData() {
  state = structuredClone(initialState);
  archiveWeekKeyCache = null;
  archiveSearchIndexCache.clear();
  clearInterval(focusInterval);
  clearInterval(trackInterval);
  focusDuration = 0;
  focusRemaining = 0;
  focusEndAt = 0;
  focusRunning = false;
  focusSessionSaved = false;
  trackStartedAt = 0;
  trackRunning = false;
  trackSeconds = 0;
  Object.keys(timerRuntime).forEach((key) => delete timerRuntime[key]);
  saveTimerRuntime();
  saveState({ configFeedback: true });
  closeClearDataDialog();
  renderAll();
  showToast("local data cleared");
}

function exportPrivateBackup() {
  const payload = {
    app: "Archive",
    version: 90,
    exportedAt: new Date().toISOString(),
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `archive-private-backup-${dateKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  confirmControl(document.querySelector("#export-backup"), "EXPORTED");
  showToast("private backup exported");
}

async function importPrivateBackup(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const imported = payload?.state || payload;
    if (!imported || typeof imported !== "object" || !Array.isArray(imported.habits)) throw new Error("Invalid backup");
    state = mergeCurrentStateShape(imported);
    state.persistedAt = Date.now();
    archiveWeekKeyCache = null;
    archiveSearchIndexCache.clear();
    saveStartupSnapshot(state);
    if (durableStorageReady) await writeDurableState(state);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (currentScreen === "settings") showConfigLoading();
    renderAll();
    confirmControl(document.querySelector("#import-backup"), "IMPORTED");
    showToast("private backup restored");
  } catch {
    showToast("backup file could not be restored");
  } finally {
    document.querySelector("#backup-file").value = "";
  }
}

function renderAll() {
  renderHabits();
  renderHomeReminders();
  renderJournal();
  renderHomeArchive();
  if (currentScreen === "archive") renderArchive();
  if (currentScreen === "library") renderLibrary();
  renderFocusTimer();
  renderTrackTimer();
  renderHabitSelectors();
  renderTimeLogs();
  renderBody();
  renderFocus();
  renderSettings();
  updateNavigationState();
}

function renderHabitSelectors() {
  ["focus-habit", "track-habit"].forEach((id) => {
    const input = document.querySelector(`#${id}`);
    const preferred = id === "focus-habit" ? timerRuntime.focusHabitId : timerRuntime.trackHabitId;
    const current = state.habits.some((habit) => habit.id === input.value)
      ? input.value
      : state.habits.some((habit) => habit.id === preferred)
        ? preferred
        : state.habits[0]?.id || "";
    input.value = current;
    renderHabitPicker(id);
  });
}

function renderHabitPicker(id) {
  const input = document.querySelector(`#${id}`);
  const trigger = document.querySelector(`#${id}-trigger`);
  const menu = document.querySelector(`#${id}-menu`);
  const selected = habitById(input.value);
  trigger.querySelector("span").innerHTML = selected
    ? `<strong>${escapeHtml(selected.name)}</strong><small>${selected.type.toUpperCase()}${selected.note ? ` // ${escapeHtml(selected.note)}` : ""}</small>`
    : "<strong>CREATE A HABIT FIRST</strong><small>RETURN HOME TO CONFIGURE</small>";
  menu.innerHTML = state.habits.length
    ? state.habits.map((habit) => `
      <button type="button" role="option" aria-selected="${habit.id === input.value}" class="${habit.id === input.value ? "active" : ""}" data-habit-picker-value="${habit.id}">
        <span><strong>${escapeHtml(habit.name)}</strong><small>${habit.note ? escapeHtml(habit.note) : "NO DAILY NOTE"}</small></span>
        <i>${habit.type.toUpperCase()}</i>
      </button>
    `).join("")
    : '<p>NO HABITS CONFIGURED</p>';
}

function closeHabitPickers(exceptId = "") {
  document.querySelectorAll("[data-habit-picker]").forEach((picker) => {
    if (picker.dataset.habitPicker === exceptId) return;
    picker.classList.remove("open");
    picker.querySelector(".habit-picker-menu").hidden = true;
    picker.querySelector(".habit-picker-trigger").setAttribute("aria-expanded", "false");
  });
}

function toggleHabitPicker(id) {
  const picker = document.querySelector(`[data-habit-picker="${id}"]`);
  const menu = picker.querySelector(".habit-picker-menu");
  const willOpen = menu.hidden;
  closeHabitPickers(id);
  menu.hidden = !willOpen;
  picker.classList.toggle("open", willOpen);
  picker.querySelector(".habit-picker-trigger").setAttribute("aria-expanded", String(willOpen));
}

function setHabitPickerDisabled(id, disabled) {
  const trigger = document.querySelector(`#${id}-trigger`);
  if (!trigger) return;
  trigger.disabled = disabled;
  if (disabled) closeHabitPickers();
}

function setJournalEditing(active, field = null) {
  document.body.classList.toggle("journal-editing", active);
  if (active) {
    updateVisualViewport();
    setTimeout(() => field?.scrollIntoView({ block: "center", behavior: "smooth" }), 180);
  }
}

function updateVisualViewport() {
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty("--visual-height", `${viewport?.height || window.innerHeight}px`);
}

function startIntroSequence() {
  const lines = [...document.querySelectorAll("[data-intro-text]")];
  lines.forEach((line) => {
    const finalText = line.dataset.introText;
    line.textContent = "";
    const delay = Number(line.dataset.introDelay || 80);
    setTimeout(() => {
      line.textContent = finalText;
      line.classList.add("intro-copy-ready");
    }, delay);
  });
}

function bindEvents() {
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const now = performance.now();
    const previous = formSubmitTimes.get(form) || 0;
    if (now - previous < 420) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    formSubmitTimes.set(form, now);
  }, true);

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", syncModalLock);
  });
  document.addEventListener("touchmove", blockModalBackgroundTouch, { passive: false });

  document.querySelectorAll("[data-screen]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.screen === "library" && button.hasAttribute("data-library-portal")) enterLibraryFromHome(button);
    else showScreen(button.dataset.screen);
  }));
  document.querySelector("#home-memory-portal").addEventListener("click", (event) => enterLibraryFromHome(event.currentTarget));
  document.querySelectorAll("[data-config-tab]").forEach((button) => button.addEventListener("click", () => setConfigTab(button.dataset.configTab)));
  document.querySelector("#release-dialog-close")?.addEventListener("click", closeReleaseNotice);
  document.querySelector("#release-dialog")?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeReleaseNotice();
  });
  document.querySelector("#release-dialog")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeReleaseNotice();
  });
  document.querySelector("#clear-data-cancel")?.addEventListener("click", closeClearDataDialog);
  document.querySelector("#clear-data-confirm")?.addEventListener("click", clearData);
  document.querySelector("#clear-data-dialog")?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeClearDataDialog();
  });
  document.querySelector("#clear-data-dialog")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeClearDataDialog();
  });
  document.querySelector("#archive-day-open")?.addEventListener("click", openDayArchiveDialog);
  document.querySelector("#day-archive-cancel")?.addEventListener("click", closeDayArchiveDialog);
  document.querySelector("#day-archive-confirm")?.addEventListener("click", archiveTodayManually);
  document.querySelector("#day-archive-dialog")?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDayArchiveDialog();
  });
  document.querySelector("#day-archive-dialog")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeDayArchiveDialog();
  });

  document.querySelector("#habit-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#habit-input");
    openHabitEditor(input.value);
    input.value = "";
  });

  document.querySelector("#habit-list").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-habit-toggle]");
    const config = event.target.closest("[data-habit-config]");
    const remove = event.target.closest("[data-habit-remove]");
    const move = event.target.closest("[data-habit-move]");
    if (toggle) toggleHabit(toggle.dataset.habitToggle);
    if (config) openHabitEditor(state.habits.find((habit) => habit.id === config.dataset.habitConfig)?.name || "", config.dataset.habitConfig);
    if (remove) removeHabit(remove.dataset.habitRemove);
    if (move && performance.now() > suppressHabitMoveClickUntil) moveHabit(move.dataset.habitMove, Number(move.dataset.habitDirection));
  });
  document.querySelector("#habit-list").addEventListener("pointerdown", (event) => {
    const move = event.target.closest("[data-habit-move]");
    if (move) beginHabitDrag(move, event);
  });
  document.addEventListener("pointermove", updateHabitDrag, { passive: false });
  document.addEventListener("pointerup", finishHabitDrag);
  document.addEventListener("pointercancel", finishHabitDrag);

  document.querySelector("#reminder-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveReminder();
  });
  document.querySelector("#home-screen").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-reminder-remove]");
    if (remove) removeReminder(remove.dataset.reminderRemove);
    if (event.target.closest("[data-dismiss-carryover]")) clearCarryoverMessage();
  });

  document.querySelector("#habit-editor-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (saveHabitConfiguration()) closeModalUnlocked(document.querySelector("#habit-editor"));
  });
  document.querySelector("#habit-editor-close").addEventListener("click", () => {
    editingHabitId = null;
    closeModalUnlocked(document.querySelector("#habit-editor"));
  });

  document.querySelector("#archive-list").addEventListener("click", (event) => {
    const review = event.target.closest("[data-open-reviews]");
    const book = event.target.closest("[data-week-key]");
    const loadOlder = event.target.closest("[data-load-older-weeks]");
    if (loadOlder) {
      archiveWeekLimit += ARCHIVE_PAGE_SIZE;
      renderArchive();
      return;
    }
    if (review) {
      currentReviewMonth = review.dataset.reviewMonth || "";
      setArchiveTab("reviews");
    }
    if (book) openArchivedWeek(book.dataset.weekKey, book.dataset.preferredDay);
  });
  document.querySelector("#library-stage").addEventListener("click", (event) => {
    const book = event.target.closest("[data-week-key]");
    if (book) openArchivedWeek(book.dataset.weekKey, book.dataset.preferredDay);
  });
  document.querySelectorAll("[data-archive-tab]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.archiveTab === "reviews") currentReviewMonth = "";
    setArchiveTab(button.dataset.archiveTab);
  }));
  document.querySelector("#archive-search").addEventListener("input", (event) => {
    archiveSearchQuery = event.currentTarget.value;
    archiveWeekLimit = ARCHIVE_PAGE_SIZE;
    clearTimeout(archiveSearchTimer);
    archiveSearchTimer = setTimeout(() => {
      if (currentArchiveTab !== "days") setArchiveTab("days");
      else renderArchive();
    }, 180);
  });
  document.querySelector("#habit-schedule").addEventListener("click", (event) => {
    const config = event.target.closest("[data-habit-config]");
    const reminder = event.target.closest("[data-reminder-remove]");
    if (config && state.settings.editMode) openHabitEditor(state.habits.find((habit) => habit.id === config.dataset.habitConfig)?.name || "", config.dataset.habitConfig);
    if (reminder && state.settings.editMode) removeReminder(reminder.dataset.reminderRemove);
  });
  document.querySelector("#weekly-reviews").addEventListener("click", (event) => {
    if (event.target.closest("[data-review-overall]")) {
      currentReviewMonth = "";
      renderWeeklyReviews();
      return;
    }
    if (!event.target.closest("[data-body-compare]")) return;
    const comparison = document.querySelector(".body-model-comparison");
    if (!comparison) return;
    const button = event.target.closest("[data-body-compare]");
    const comparing = !comparison.classList.contains("comparing");
    comparison.classList.remove("comparing", "separating");
    void comparison.offsetWidth;
    comparison.classList.add(comparing ? "comparing" : "separating");
    button.textContent = comparing ? "SEPARATE" : "COMPARE";
    pulseControl(button);
  });

  document.querySelector("#book-close").addEventListener("click", () => closeModalUnlocked(document.querySelector("#book-viewer")));
  document.querySelector("#book-viewer").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeModalUnlocked(event.currentTarget);
  });
  document.querySelector("#book-pages").addEventListener("click", (event) => {
    const page = event.target.closest("[data-page-key]");
    if (page) openArchivedDay(page.dataset.pageKey);
  });

  document.querySelector("#journal-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.submitter?.id !== "journal-save") return;
    saveJournal();
  });
  preventImplicitSubmit(document.querySelector("#journal-form"));

  document.querySelectorAll("#journal-body, #future-note").forEach((field) => {
    field.addEventListener("focus", () => setJournalEditing(true, field));
    field.addEventListener("blur", () => {
      setTimeout(() => setJournalEditing(document.querySelector("#journal-form").contains(document.activeElement)), 80);
    });
  });
  document.querySelector("#future-note-clear").addEventListener("click", clearCurrentFutureNote);

  document.querySelectorAll("[data-habit-picker]").forEach((picker) => {
    const id = picker.dataset.habitPicker;
    picker.querySelector(".habit-picker-trigger").addEventListener("click", () => toggleHabitPicker(id));
    picker.querySelector(".habit-picker-menu").addEventListener("click", (event) => {
      const option = event.target.closest("[data-habit-picker-value]");
      if (!option) return;
      document.querySelector(`#${id}`).value = option.dataset.habitPickerValue;
      renderHabitPicker(id);
      saveTimerRuntime();
      closeHabitPickers();
      pulseControl(picker);
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-habit-picker]")) closeHabitPickers();
    if (!event.target.closest(".archive-select")) closeCustomSelects();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeHabitPickers();
      closeCustomSelects();
    }
  });

  document.querySelectorAll("[data-timer-tab]").forEach((button) => button.addEventListener("click", () => setTimerTab(button.dataset.timerTab)));
  document.querySelector("#focus-toggle").addEventListener("click", toggleFocusTimer);
  document.querySelector("#focus-reset").addEventListener("click", resetFocusTimer);
  document.querySelector("#focus-readout").addEventListener("focus", (event) => event.currentTarget.select());
  document.querySelector("#focus-readout").addEventListener("blur", applyTimerInput);
  document.querySelector("#focus-readout").addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.currentTarget.blur();
  });
  document.querySelector("#track-toggle").addEventListener("click", toggleTrackTimer);
  document.querySelector("#track-save").addEventListener("click", saveTimeLog);
  document.querySelector("#time-log-list").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-time-log-remove]");
    if (remove) removeTimeLog(remove.dataset.timeLogRemove);
  });

  document.querySelectorAll("[data-body-tab]").forEach((button) => button.addEventListener("click", () => setBodyTab(button.dataset.bodyTab)));
  document.querySelectorAll("[data-inline-tab-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.settings.editMode) return;
      const control = button.closest("[data-inline-tab-control]");
      const options = control?.querySelector(".inline-tab-options");
      if (!options) return;
      const open = options.hidden;
      document.querySelectorAll(".inline-tab-options").forEach((panel) => {
        if (panel !== options) panel.hidden = true;
      });
      document.querySelectorAll("[data-inline-tab-toggle], [data-summary-toggle], [data-home-group-toggle]").forEach((toggle) => {
        if (toggle !== button) toggle.classList.remove("active");
      });
      options.hidden = !open;
      button.classList.toggle("active", open);
    });
  });
  document.querySelectorAll("[data-summary-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.settings.editMode) return;
      const control = button.closest("[data-summary-control]");
      const options = control?.querySelector(".inline-tab-options");
      if (!options) return;
      const open = options.hidden;
      document.querySelectorAll(".inline-tab-options").forEach((panel) => {
        if (panel !== options) panel.hidden = true;
      });
      document.querySelectorAll("[data-inline-tab-toggle], [data-summary-toggle], [data-home-group-toggle]").forEach((toggle) => {
        if (toggle !== button) toggle.classList.remove("active");
      });
      options.hidden = !open;
      button.classList.toggle("active", open);
    });
  });
  document.querySelector("#body-summary-control")?.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-body-summary-visibility]");
    if (toggle) toggleBodySummaryVisibility(toggle.dataset.bodySummaryVisibility);
  });
  document.querySelector("#focus-summary-control")?.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-focus-summary-visibility]");
    if (toggle) toggleFocusSummaryVisibility(toggle.dataset.focusSummaryVisibility);
  });
  document.querySelector("[data-home-group-toggle]")?.addEventListener("click", (event) => {
    if (!state.settings.editMode) return;
    const button = event.currentTarget;
    const control = button.closest("[data-home-group-control]");
    const options = control?.querySelector(".inline-tab-options");
    if (!options) return;
    const open = options.hidden;
    document.querySelectorAll(".inline-tab-options").forEach((panel) => {
      if (panel !== options) panel.hidden = true;
    });
    document.querySelectorAll("[data-inline-tab-toggle], [data-summary-toggle], [data-home-group-toggle]").forEach((toggle) => {
      if (toggle !== button) toggle.classList.remove("active");
    });
    options.hidden = !open;
    button.classList.toggle("active", open);
  });
  document.querySelector("#home-group-control")?.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-home-group-visibility]");
    if (toggle) toggleHomeGroupVisibility(toggle.dataset.homeGroupVisibility);
  });
  document.querySelector("#workout-plan-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.submitter?.id !== "workout-plan-save") return;
    saveWorkoutPlan();
  });
  preventImplicitSubmit(document.querySelector("#workout-plan-form"));
  document.querySelector("#workout-plan-list").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-workout-edit]");
    const remove = event.target.closest("[data-workout-remove]");
    if (edit) editWorkoutPlan(edit.dataset.workoutEdit);
    if (remove) removeWorkoutPlan(remove.dataset.workoutRemove);
  });
  document.querySelector("#body-metric-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveBodyMetric();
  });
  document.querySelector("#body-metric-form").addEventListener("input", () => {
    requestAnimationFrame(() => renderBodyLogModel());
  });
  document.querySelector("#body-log-model").addEventListener("click", (event) => {
    if (!event.target.closest("[data-body-model-inline-toggle]")) return;
    state.settings.bodyModel = !state.settings.bodyModel;
    saveState();
    renderBodyLogModel();
    if (currentArchiveTab === "reviews") renderWeeklyReviews();
  });
  document.querySelector("#body-history").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-metric-edit]");
    const remove = event.target.closest("[data-metric-remove]");
    const loadOlder = event.target.closest("[data-load-body-history]");
    if (loadOlder) {
      bodyHistoryLimit += HISTORY_PAGE_SIZE;
      renderBodyMetrics();
      return;
    }
    if (edit) editBodyMetric(edit.dataset.metricEdit);
    if (remove) removeBodyMetric(remove.dataset.metricRemove);
  });
  document.querySelector("#body-field-control").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-body-field-toggle]");
    if (toggle) toggleBodyField(toggle.dataset.bodyFieldToggle);
  });
  document.querySelector("#pr-form").addEventListener("submit", (event) => {
    event.preventDefault();
    savePr();
  });
  document.querySelector("#pr-board").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-pr-remove]");
    if (remove) removePr(remove.dataset.prType, remove.dataset.prRemove);
  });
  document.querySelector("#calorie-goals-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveCalorieGoals();
  });
  document.querySelector("#calorie-meal-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveCalorieMeal();
  });
  document.querySelector("#calorie-meal-list").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-calorie-meal-edit]");
    const remove = event.target.closest("[data-calorie-meal-remove]");
    if (edit) editCalorieMeal(edit.dataset.calorieMealEdit);
    if (remove) removeCalorieMeal(remove.dataset.calorieMealRemove);
  });
  document.querySelector("#calorie-activity-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveCalorieActivity();
  });
  document.querySelector("#calorie-activity-list").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-calorie-activity-edit]");
    const remove = event.target.closest("[data-calorie-activity-remove]");
    if (edit) editCalorieActivity(edit.dataset.calorieActivityEdit);
    if (remove) removeCalorieActivity(remove.dataset.calorieActivityRemove);
  });

  document.querySelectorAll("[data-focus-tab]").forEach((button) => button.addEventListener("click", () => setFocusTab(button.dataset.focusTab)));
  document.querySelector("#project-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveProject();
  });
  document.querySelector("#project-list").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-project-edit]");
    const remove = event.target.closest("[data-project-remove]");
    if (edit) editProject(edit.dataset.projectEdit);
    if (remove) removeProject(remove.dataset.projectRemove);
  });
  document.querySelector("#focus-log-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveFocusLog();
  });
  document.querySelector("#focus-log-list").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-focus-log-edit]");
    const remove = event.target.closest("[data-focus-log-remove]");
    const loadOlder = event.target.closest("[data-load-focus-history]");
    if (loadOlder) {
      focusHistoryLimit += HISTORY_PAGE_SIZE;
      renderFocusLogs();
      return;
    }
    if (edit) editFocusLog(edit.dataset.focusLogEdit);
    if (remove) removeFocusLog(remove.dataset.focusLogRemove);
  });
  document.querySelector("#skill-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveSkill();
  });
  document.querySelector("#skill-list").addEventListener("click", (event) => {
    const boost = event.target.closest("[data-skill-boost]");
    const edit = event.target.closest("[data-skill-edit]");
    const remove = event.target.closest("[data-skill-remove]");
    if (boost) boostSkill(boost.dataset.skillBoost);
    if (edit) editSkill(edit.dataset.skillEdit);
    if (remove) removeSkill(remove.dataset.skillRemove);
  });

  document.querySelector("#intro-toggle").addEventListener("click", (event) => {
    state.settings.intro = !state.settings.intro;
    saveState({ configFeedback: true });
    setToggle(event.currentTarget, state.settings.intro);
  });

  document.querySelector("#motion-toggle").addEventListener("click", (event) => {
    state.settings.motion = !state.settings.motion;
    if (!state.settings.motion) finishAllScrambles();
    saveState({ configFeedback: true });
    renderSettings();
    setToggle(event.currentTarget, state.settings.motion);
  });

  document.querySelector("#explanatory-text-toggle").addEventListener("click", () => {
    state.settings.explanatoryText = !state.settings.explanatoryText;
    saveState({ configFeedback: true });
    renderSettings();
    showToast(`explanatory text ${state.settings.explanatoryText ? "shown" : "hidden"}`);
  });

  document.querySelectorAll("[data-body-frame]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.settings.editMode) return;
      state.settings.bodyFrame = button.dataset.bodyFrame === "female" ? "female" : "male";
      saveState({ configFeedback: true });
      renderSettings();
      if (currentArchiveTab === "reviews") renderWeeklyReviews();
      showToast(`${state.settings.bodyFrame} body frame selected`);
    });
  });

  document.querySelector("#edit-mode-toggle").addEventListener("click", () => {
    state.settings.editMode = !state.settings.editMode;
    if (state.settings.editMode) {
      layoutTabPressOrder = [];
      layoutAreaPressOrder = { body: [], focus: [], archive: [] };
      layoutHomeGroupPressOrder = [];
    }
    saveState({ configFeedback: true });
    renderSettings();
    renderHabits();
    renderHomeReminders();
    renderJournal();
    if (currentArchiveTab === "routines") renderHabitSchedule();
    showToast(`layout editing ${state.settings.editMode ? "enabled" : "disabled"}`);
  });

  document.querySelectorAll("[data-start-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.startScreen = button.dataset.startScreen;
      saveState({ configFeedback: true });
      renderSettings();
      showToast(`${state.settings.startScreen} set as startup area`);
    });
  });

  document.querySelectorAll("[data-area-visibility]").forEach((button) => {
    button.addEventListener("click", () => toggleAreaVisibility(button.dataset.areaVisibility, button.dataset.areaGroup));
  });

  document.querySelectorAll("[data-theme-value]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.theme = button.dataset.themeValue;
      saveState({ configFeedback: true });
      renderSettings();
    });
  });

  document.querySelectorAll("button[data-color-vividness]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.colorVividness = button.dataset.colorVividness;
      saveState({ configFeedback: true });
      renderSettings();
    });
  });

  document.querySelectorAll("button[data-gradient-strength]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.gradientStrength = button.dataset.gradientStrength;
      saveState({ configFeedback: true });
      renderSettings();
    });
  });

  document.querySelectorAll("[data-tab-visibility]").forEach((button) => {
    button.addEventListener("click", () => toggleTabVisibility(button.dataset.tabVisibility));
  });

  document.querySelector("#clear-data").addEventListener("click", openClearDataDialog);
  document.querySelector("#export-backup").addEventListener("click", exportPrivateBackup);
  document.querySelector("#import-backup").addEventListener("click", () => document.querySelector("#backup-file").click());
  document.querySelector("#backup-file").addEventListener("change", (event) => importPrivateBackup(event.currentTarget.files?.[0]));

  window.visualViewport?.addEventListener("resize", updateVisualViewport);
  window.addEventListener("scroll", updateOverscrollGlow, { passive: true });
  document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finishAllScrambles();
    if (!document.hidden) {
      updateFocusClock();
      updateTrackClock();
    }
    if (document.hidden && durableStorageReady) {
      saveStartupSnapshot(state);
      writeDurableState(state);
    }
    if (document.hidden) saveTimerRuntime();
  });
  window.addEventListener("pagehide", () => {
    if (durableStorageReady) {
      saveStartupSnapshot(state);
      writeDurableState(state);
    }
    saveTimerRuntime();
  });
}

function startApp() {
  document.querySelector("#today-label").textContent = `TODAY // ${formatDate(new Date(), { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}`;
  if (focusRunning && !state.habits.some((habit) => habit.id === timerRuntime.focusHabitId)) {
    focusRunning = false;
    focusEndAt = 0;
  }
  if (trackRunning && !state.habits.some((habit) => habit.id === timerRuntime.trackHabitId)) {
    trackRunning = false;
    trackStartedAt = 0;
  }
  renderAll();
  initializeCustomSelects();
  bindEvents();
  if (focusRunning) focusInterval = setInterval(updateFocusClock, 1000);
  if (trackRunning) trackInterval = setInterval(updateTrackClock, 1000);
  if (timerRuntime.focusRunning && !focusRunning && focusRemaining === 0 && state.habits.some((habit) => habit.id === timerRuntime.focusHabitId)) {
    if (saveHabitTime(timerRuntime.focusHabitId, focusDuration, "countdown")) {
      focusSessionSaved = true;
      showToast("completed focus cycle recovered");
    }
    saveTimerRuntime();
  }
  if (state.settings.startScreen !== "home") showScreen(state.settings.startScreen);
  const splash = document.querySelector("#splash");
  requestAnimationFrame(() => document.documentElement.classList.remove("prebooting"));
  if (!state.settings.intro || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    splash.classList.add("hidden");
    setTimeout(showReleaseNotice, 260);
  } else {
    startIntroSequence();
    setTimeout(() => splash.classList.add("hidden"), 1750);
    setTimeout(showReleaseNotice, 2050);
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=90", { updateViaCache: "none" });
      registration.update();
    } catch (error) {
      console.warn("Service worker registration skipped.", error);
    }
  });
}

startApp();
initializeDurableStorage();
