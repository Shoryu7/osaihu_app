// pachinko_graph.js
let chart;
let currentRange = 30; // 初期表示: 1ヶ月
let currentType = "daily"; // 初期表示: 累計収支
let currentDisplayMode = "all-days"; // 初期表示モード

document.addEventListener("DOMContentLoaded", () => {
  // --- イベントリスナー設定 ---
  document.querySelectorAll("#graph-type-controls .control-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      currentType = e.target.dataset.type;
      setActiveButton(e.currentTarget.parentElement, e.target);
      updateControlsVisibility();
      renderChart();
    });
  });

  document.querySelectorAll("#graph-range-controls .control-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      currentRange = e.target.dataset.range === 'all' ? Infinity : Number(e.target.dataset.range);
      setActiveButton(e.currentTarget.parentElement, e.target);
      renderChart();
    });
  });

  document.querySelectorAll("#cumulative-display-controls .control-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      currentDisplayMode = e.target.dataset.mode;
      setActiveButton(e.currentTarget.parentElement, e.target);
      renderChart();
    });
  });
  
  // --- 初期表示 ---
  updateControlsVisibility();
  renderChart();
});

/**
 * クリックされたボタンに 'active' クラスを設定するヘルパー関数
 */
function setActiveButton(container, target) {
  container.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
  target.classList.add('active');
}

/**
 * グラフの種類に応じてコントロールの表示/非表示を切り替える
 */
function updateControlsVisibility() {
  const isDaily = currentType === 'daily';
  document.getElementById("graph-range-controls").style.display = isDaily ? 'flex' : 'none';
  document.getElementById("cumulative-display-controls").style.display = isDaily ? 'flex' : 'none';
}


function renderChart() {
  if (chart) {
    chart.destroy();
  }
  
  const ctx = document.getElementById("incomeChart").getContext("2d");
  const history = JSON.parse(localStorage.getItem("history") || "[]").sort((a, b) => new Date(a.date) - new Date(b.date));

  let chartConfig; // グラフの設定オブジェクト

  switch(currentType) {
    case 'daily':
      chartConfig = getDailyChartConfig(history);
      break;
    case 'monthly':
      chartConfig = getMonthlyChartConfig(history);
      break;
    case 'yearly':
      chartConfig = getYearlyChartConfig(history);
      break;
    case 'machine':
      chartConfig = getMachineChartConfig(history);
      break;
  }
  
  if (chartConfig) {
    chart = new Chart(ctx, chartConfig);
  }
}

/**
 * 日別累計収支グラフの設定を生成する
 */
function getDailyChartConfig(history) {
  const dataMap = new Map();
  history.forEach(item => {
    dataMap.set(item.date, (dataMap.get(item.date) || 0) + item.diff);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- ★★★ 修正点 1: 正しい日付計算ロジック ★★★
  let startDate = new Date(today);
  const firstDateInHistory = history.length > 0 ? new Date(history[0].date) : new Date(today);

  switch (currentRange) {
    case Infinity: // 全期間
      startDate = firstDateInHistory;
      break;
    case 365: // 1年
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 180: // 半年
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    default: // 1ヶ月、1週間
      startDate.setDate(startDate.getDate() - (currentRange - 1));
      break;
  }
  startDate.setHours(0, 0, 0, 0);
  // --- ★★★ 修正完了 ★★★

  let cumulativeTotal = history
    .filter(item => new Date(item.date) < startDate)
    .reduce((sum, item) => sum + item.diff, 0);

  const chartData = [];

  if (currentDisplayMode === 'only-data' && history.length > 0) {
    const relevantEntries = [...dataMap.entries()]
      .map(([date, diff]) => ({ date: new Date(date), diff }))
      .filter(item => item.date >= startDate && item.date <= today)
      .sort((a, b) => a.date - b.date);
      
    relevantEntries.forEach(item => {
      cumulativeTotal += item.diff;
      chartData.push({ x: item.date, y: cumulativeTotal });
    });
  } else {
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      cumulativeTotal += dataMap.get(dateStr) || 0;
      chartData.push({ x: new Date(d), y: cumulativeTotal });
    }
  }

  return {
    type: 'line',
    data: {
      datasets: [{
        label: "累計収支",
        data: chartData,
        backgroundColor: "rgba(102, 126, 234, 0.2)",
        borderColor: "rgba(102, 126, 234, 1)",
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5 // ホバーした時だけ点を表示
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'yyyy/MM/dd',
            displayFormats: {
              day: 'M/d'
            }
          },
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            // ★★★ 修正点 2: 確実なラベル表示ロジック ★★★
            callback: function(value) {
              const date = new Date(value);
              // 期間が長い場合 (半年、1年、全期間)
              if (currentRange > 30) {
                // 月の初日(1日)であればラベルを表示
                if (date.getDate() === 1) {
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }
                // それ以外はラベルを非表示 (nullを返す)
                return null;
              }
              // 期間が短い場合は、通常のM/d形式で表示
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }
          }
        },
        y: {
          ticks: { callback: (value) => value.toLocaleString() + '円' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `累計収支: ${context.parsed.y.toLocaleString()}円`
          }
        }
      }
    }
  };
}

/**
 * 汎用的な棒グラフ設定を生成する
 */
function getBarChartConfig(title, labels, data, indexAxis = 'x') {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '収支',
        data,
        backgroundColor: data.map(d => d >= 0 ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)'),
        borderColor: data.map(d => d >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'),
        borderWidth: 1
      }]
    },
    options: {
      indexAxis,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { callback: (value) => indexAxis === 'y' ? `${value.toLocaleString()}円` : value } },
        y: { ticks: { callback: (value) => indexAxis === 'x' ? `${value.toLocaleString()}円` : value } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = indexAxis === 'y' ? context.parsed.x : context.parsed.y;
              return `収支: ${val.toLocaleString()}円`;
            }
          }
        }
      }
    }
  };
}

// 月別・年別・機種別の設定生成関数
function getMonthlyChartConfig(history) {
  const map = {};
  history.forEach(item => {
    const key = item.date.substring(0, 7);
    map[key] = (map[key] || 0) + item.diff;
  });
  const labels = Object.keys(map).sort();
  const data = labels.map(key => map[key]);
  return getBarChartConfig('月別収支', labels, data);
}

function getYearlyChartConfig(history) {
  const map = {};
  history.forEach(item => {
    const key = item.date.substring(0, 4);
    map[key] = (map[key] || 0) + item.diff;
  });
  const labels = Object.keys(map).sort();
  const data = labels.map(key => map[key]);
  return getBarChartConfig('年別収支', labels, data);
}

function getMachineChartConfig(history) {
  const map = {};
  history.forEach(item => {
    map[item.machine] = (map[item.machine] || 0) + item.diff;
  });
  const sortedData = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const labels = sortedData.map(item => item[0]);
  const data = sortedData.map(item => item[1]);
  return getBarChartConfig('機種別収支', labels, data, 'y');
}