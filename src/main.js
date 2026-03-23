function formatDate(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${m}-${d}`;
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const GLOBAL_KEY = "calcalcmini_global";

function main() {
  const DEFAULT_CONFIG = {
    total: 2400,
    ratio: { proteins: 0.4, carbs: 0.4, fat: 0.2, other: 0 },
    counters: [
      {
        name: "Animal Protein",
        type: "proteins",
        emoji: "🍗",
        value: 0,
        element: null,
      },
      {
        name: "Plant Protein",
        type: "proteins",
        emoji: "🥦",
        value: 0,
        element: null,
      },
      {
        name: "Animal Fat",
        type: "fat",
        emoji: "🧈",
        value: 0,
        element: null,
      },

      {
        name: "Plant Fat",
        type: "fat",
        emoji: "🥜",
        value: 0,
        element: null,
      },
      {
        name: "Healthy Carbs",
        type: "carbs",
        emoji: "🌾",
        value: 0,
        element: null,
      },
      {
        name: "Sweets",
        type: "other",
        emoji: "🍭",
        value: 0,
        element: null,
      },
    ],
  };

  let config = null;

  setConfig();

  function setConfig(reset = false) {
    config = deepCopy(DEFAULT_CONFIG);
    const dateStr = formatDate(new Date());
    const key = `calcalcmini_${dateStr}`;
    if (reset) {
      localStorage.removeItem(key);
    }
    const storageData = localStorage.getItem(key);
    if (storageData) {
      config = JSON.parse(storageData);
    }

    const globalData = localStorage.getItem(GLOBAL_KEY);
    if (globalData) {
      const globalDataDict = JSON.parse(globalData);
      config = { ...config, ...globalDataDict };
    }
  }

  function createCounterElement(counter) {
    const containerEl = document.createElement("div");
    containerEl.classList.add("counter-container");

    const headerEl = document.createElement("div");
    const iconEl = document.createElement("span");
    iconEl.textContent = counter.emoji;
    iconEl.classList.add("counter-icon");
    headerEl.appendChild(iconEl);
    headerEl.classList.add("row");

    const hEl = document.createElement("span");
    hEl.textContent = counter.name;
    hEl.classList.add("counter-name");
    headerEl.append(hEl);
    containerEl.appendChild(headerEl);

    const addEl = document.createElement("button");
    addEl.classList.add("counter-button");
    addEl.textContent = "+";
    addEl.addEventListener("click", () => {
      counter.value++;
      counter.value = Math.min(30, Math.max(0, counter.value));
      update();
    });
    headerEl.appendChild(addEl);

    const subEl = document.createElement("button");
    subEl.classList.add("counter-button");
    subEl.textContent = "-";
    subEl.addEventListener("click", () => {
      counter.value--;
      counter.value = Math.min(30, Math.max(0, counter.value));
      update();
    });
    headerEl.appendChild(subEl);

    const listEl = document.createElement("div");
    listEl.classList.add("counter-list");
    counter.element = listEl;
    containerEl.appendChild(listEl);

    return containerEl;
  }

  const rootEl = document.querySelector(".container");

  function setUp() {
    rootEl.innerHTML = `<div class="field"></div>
      <div class="header">
      <div class="row title">
            <span class="counter-left">0</span>
            <span>Kcal</span>
        </div>
        <div class="row">
            Remaining for Today
        </div>
        <div class="row">
          <label
            >Spending:
            <input
              class="input input-total"
              type="number"
              min="15"
              max="24"
              value="20"
            />
          </label>
          <span>x 100 Kcal / day</span>
        </div>
        
      </div>`;

    const totalEl = document.querySelector(".input-total");
    totalEl.addEventListener("change", (e) => {
      const valueRaw = +e.target.value;
      const value = Math.min(30, Math.max(12, valueRaw));
      e.target.value = value;
      config.total = value * 100;

      const globalData = { total: config.total };
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(globalData));

      update();
    });
    totalEl.value = config.total / 100;
    config.counters.forEach((counter) => {
      const counterEl = createCounterElement(counter);
      rootEl.appendChild(counterEl);
    });
  }

  function update() {
    let sum = 0;
    let sumByType = {};
    config.counters.forEach((counter) => {
      const v = +counter.value * 100;
      sum += v;
      const t = counter.type === "other" ? "carbs" : counter.type;
      if (!(t in sumByType)) {
        sumByType[t] = 0;
      }
      sumByType[t] += v;
      if (!counter.element) {
        return;
      }
      counter.element.innerHTML = "";
      for (let i = 0; i < counter.value; i++) {
        const itemEl = document.createElement("span");
        itemEl.textContent = counter.emoji;
        counter.element.appendChild(itemEl);
      }
    });

    config.counters.forEach((counter) => {
      const v = sumByType[counter.type];
      const thld = config.ratio[counter.type] * config.total;

      counter.element.classList.remove("good");
      counter.element.classList.remove("normal");
      counter.element.classList.remove("bad");
      let cls = "good";
      if (v > thld) {
        cls = "normal";
      }
      if (v > thld * (1 + 0.2)) {
        cls = "bad";
      }
      counter.element.classList.add(counter.type === "other" ? "bad" : cls);
    });

    const leftEl = document.querySelector(".counter-left");
    leftEl.textContent = config.total - sum;

    const dateStr = formatDate(new Date());
    const key = `calcalcmini_${dateStr}`;
    localStorage.setItem(key, JSON.stringify(config));
  }

  const resetButtonEl = document.querySelector(".button-reset");
  resetButtonEl.addEventListener("click", () => {
    const confirmed = confirm("Delete saved data?");
    if (!confirmed) {
      return;
    }
    setConfig(true);
    // localStorage.removeItem(GLOBAL_KEY);
    setUp();
    update();
  });

  setUp();
  update();
}

main();
