// graph.js
let chart;
let currentRange = 30; // 初期表示: 1ヶ月
let currentType = "daily"; // 初期表示: 累計収支
let currentDisplayMode = "all-days"; // 追加: 初期表示モード

document.addEventListener("DOMContentLoaded", () => {
  // グラフタイプボタンのイベントリスナー
  document.querySelectorAll("#graph-type-controls .control-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.type;
      // UIの更新
      document.querySelectorAll("#graph-type-controls .control-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // 期間選択と累計表示モードの表示/非表示を切り替え
      const rangeControls = document.getElementById("graph-range-controls");
      const displayModeControls = document.getElementById("cumulative-display-controls");
      
      if (currentType === 'daily') {
        rangeControls.style.display = 'flex';
        displayModeControls.style.display = 'flex';
      } else {
        rangeControls.style.display = 'none';
        displayModeControls.style.display = 'none';
      }

      renderChart();
    });
  });

  // 期間選択ボタンのイベントリスナー
  document.querySelectorAll("#graph-range-controls .control-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentRange = btn.dataset.range === 'all' ? Infinity : Number(btn.dataset.range);
      document.querySelectorAll("#graph-range-controls .control-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderChart();
    });
  });

  // 累計収支表示モードボタンのイベントリスナー (追加)
  document.querySelectorAll("#cumulative-display-controls .control-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentDisplayMode = btn.dataset.mode;
      document.querySelectorAll("#cumulative-display-controls .control-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderChart();
    });
  });

  // 初期描画
  // 初期はdailyがアクティブなので表示
  document.getElementById("graph-range-controls").style.display = 'flex';
  document.getElementById("cumulative-display-controls").style.display = 'flex';
  renderChart();
});

function renderChart() {
  const ctx = document.getElementById("incomeChart").getContext("2d");
  const history = JSON.parse(localStorage.getItem("history") || "[]").sort((a, b) => new Date(a.date) - new Date(b.date));

  let labels = [];
  let datasets = [];
  let chartType = 'bar'; // デフォルトは棒グラフ

  if (currentType === "daily") {
    chartType = 'line'; // 累計収支は折れ線グラフ
    const dataMap = new Map();
    history.forEach(item => {
        dataMap.set(item.date, (dataMap.get(item.date) || 0) + item.diff);
    });

    const today = new Date();
    // historyが空の場合はtodayを基準にする
    const firstHistoryDate = history.length > 0 ? new Date(history[0].date) : today;

    const range = currentRange === Infinity ? 
        Math.ceil((today - firstHistoryDate) / (1000 * 60 * 60 * 24)) : currentRange;

    const startDate = new Date();
    startDate.setDate(today.getDate() - range);
    // 期間が全期間の場合、履歴の最初の日付をスタート日とする
    if (currentRange === Infinity && history.length > 0) {
      startDate.setTime(firstHistoryDate.getTime());
    }

    let cumulativeTotal = 0;
    const chartData = [];

    // 全期間の最初の収支を計算
    // startDateより前の履歴の累計を初期値とする
    const initialTotal = history
      .filter(item => new Date(item.date) < startDate)
      .reduce((sum, item) => sum + item.diff, 0);
    cumulativeTotal = initialTotal;
    
    if (currentDisplayMode === "all-days") { // 全日表示モード
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0];
            cumulativeTotal += dataMap.get(dateStr) || 0; // データがない日は0を加算
            labels.push(dateStr);
            chartData.push(cumulativeTotal);
        }
    } else { // only-dataモード (データがある日のみ表示)
        // データがある日付のみを抽出し、ソート
        const filteredDates = Array.from(new Set(history.map(item => item.date)))
            .filter(dateStr => {
                const itemDate = new Date(dateStr);
                return itemDate >= startDate && itemDate <= today;
            })
            .sort();

        // フィルタリングされた日付に沿って累計を計算
        // only-dataモードでも、startDate以前の累計は反映させるべき
        // cumulativeTotalはすでにinitialTotalで設定済み
        
        // 最初のデータポイントを追加 (startDate以前の累計があれば)
        if (initialTotal !== 0 || filteredDates.length === 0) {
          labels.push(startDate.toISOString().split("T")[0]); // 開始日を最初のラベルとする
          chartData.push(cumulativeTotal);
        }

        let lastDate = startDate;
        for (const dateStr of filteredDates) {
            // もし最初のデータがstartDateと異なる、かつstartDateが既にラベルとして追加されていない場合
            // startDateから最初の日付までの期間をスキップし、そこまでの累計を保持する必要がある
            if (new Date(dateStr) > lastDate && !(dateStr === labels[0] && chartData[0] === initialTotal) ) {
                // ここでの処理は不要、dataMap.get(dateStr) が累積的に加算されるので
            }
            
            cumulativeTotal += dataMap.get(dateStr);
            labels.push(dateStr);
            chartData.push(cumulativeTotal);
            lastDate = new Date(dateStr);
        }
    }


    datasets.push({
        label: "累計収支",
        data: chartData,
        backgroundColor: "rgba(102, 126, 234, 0.2)",
        borderColor: "rgba(102, 126, 234, 1)",
        borderWidth: 2,
        fill: true,
        tension: 0.1, // 少し滑らかな線に
        pointRadius: currentDisplayMode === "only-data" ? 3 : 0, // only-dataでは点を表示
        pointHoverRadius: 5 // ホバー時に点は表示する
    });
  }

  // 月別収支
  if (currentType === "monthly") {
    const map = {};
    history.forEach(item => {
      const key = item.date.substring(0, 7); // YYYY-MM
      map[key] = (map[key] || 0) + item.diff;
    });
    labels = Object.keys(map).sort();
    const data = labels.map(key => map[key]);
    datasets.push(createBarDataset('月別収支', data));
  }

  // 年別収支
  if (currentType === "yearly") {
    const map = {};
    history.forEach(item => {
      const key = item.date.substring(0, 4); // YYYY
      map[key] = (map[key] || 0) + item.diff;
    });
    labels = Object.keys(map).sort();
    const data = labels.map(key => map[key]);
    datasets.push(createBarDataset('年別収支', data));
  }

  // 機種別収支
  if (currentType === "machine") {
    chartType = 'bar'; // 棒グラフに変更
    const map = {};
    history.forEach(item => {
      map[item.machine] = (map[item.machine] || 0) + item.diff;
    });

    const sortedData = Object.entries(map).sort((a, b) => b[1] - a[1]);
    labels = sortedData.map(item => item[0]);
    const data = sortedData.map(item => item[1]);
    
    datasets.push(createBarDataset('機種別収支', data)); // 棒グラフ用のデータセットを生成
  }
  
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: chartType,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
            display: true, // 全ての棒グラフでY軸を表示
            title: {
                display: true,
                text: '収支 (円)',
                color: '#333',
                font: { size: 14, weight: 'bold' }
            },
            ticks: {
                callback: function(value, index, ticks) {
                    return value.toLocaleString() + '円';
                }
            }
        },
        x: { 
            display: true, // 全ての棒グラフでX軸を表示
            title: {
                display: true,
                text: currentType === 'daily' ? '日付' : 
                      (currentType === 'monthly' ? '年月' : 
                      (currentType === 'yearly' ? '年' : '機種名')), // 機種別グラフのX軸ラベル
                color: '#333',
                font: { size: 14, weight: 'bold' }
            },
            ticks: {
                autoSkip: true, // ラベルが重なる場合、自動でスキップ
                maxRotation: 0, // ラベルを回転させない
                minRotation: 0, // ラベルを回転させない
                font: {
                    size: currentType === 'machine' ? 10 : 12 // 機種名が多い場合は少し小さく
                },
                // 日付形式のラベルを 'MM-DD' に変換
                callback: function(value, index, ticks) {
                    if (currentType === 'daily') {
                        // valueは'YYYY-MM-DD'形式と仮定
                        return labels[index].substring(5); // 'MM-DD'部分を抽出
                    }
                    return labels[index];
                }
            }
        }
      },
      plugins: {
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    label += context.parsed.y.toLocaleString() + '円';
                    return label;
                }
            }
        },
        legend: {
            display: chartType !== 'pie', 
            position: 'top',
            labels: {
                font: { size: 12 }
            }
        }
      }
    }
  });
}

// 棒グラフ用のデータセットを生成するヘルパー関数
function createBarDataset(label, data) {
    return {
        label,
        data,
        backgroundColor: data.map(d => d >= 0 ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)'),
        borderColor: data.map(d => d >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'),
        borderWidth: 1
    };
}

// 円グラフ用にランダムな色を生成するヘルパー関数 (機種別が棒グラフになったので不要だが残しておく)
function generateColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        colors.push(`hsl(${(i * 360) / numColors}, 70%, 60%)`);
    }
    return colors;
}