// ------------------------------
// 🔧 家計簿データ管理 (汎用)
// ------------------------------

// 家計簿の履歴データを取得する関数
function getHouseholdHistory() {
  return JSON.parse(localStorage.getItem("household_account_book_transactions") || "[]"); // キー名を変更
}

// 家計簿の履歴データを保存する関数
function saveHouseholdHistory(history) {
  localStorage.setItem("household_account_book_transactions", JSON.stringify(history)); // キー名を変更
}

// カテゴリリストを取得する関数 (category_manager.html のロジックと連携させるため、この部分は使用しないが、互換性のために残す)
function getCategoriesFromScript() { // 名前を変更して衝突回避
  const categoriesJson = localStorage.getItem('household_account_book_categories'); // category_manager.html と同じキーを使用
  let categories = categoriesJson ? JSON.parse(categoriesJson) : { income: [], expense: [] };

  // デフォルトカテゴリが設定されていない場合 (初回ロード時など)
  // または、特定のカテゴリが存在しない場合に追加
  if (categories.expense.length === 0 && categories.income.length === 0) {
      categories.expense = [
          { id: Date.now(), name: '食費' },
          { id: Date.now() + 1, name: '交通費' },
          { id: Date.now() + 2, name: '娯楽費' },
          { id: Date.now() + 3, name: '日用品' }
      ];
      categories.income = [
          { id: Date.now() + 4, name: '給与' },
          { id: Date.now() + 5, name: '臨時収入' }
      ];
      localStorage.setItem('household_account_book_categories', JSON.stringify(categories));
  }
  
  // 既存のカテゴリに「パチンコ・パチスロ」がない場合に追加 (expense)
  // category_manager.html 側でカテゴリ追加すると id が変わる可能性があるため、name でチェック
  const pachinkoCategoryExists = categories.expense.some(cat => cat.name === 'パチンコ・パチスロ');
  if (!pachinkoCategoryExists) {
    categories.expense.push({ id: Date.now() + Math.random(), name: 'パチンコ・パチスロ' });
    localStorage.setItem('household_account_book_categories', JSON.stringify(categories));
  }
  // incomeにも同様のチェックを入れることも可能だが、今回はexpenseのみでOK
  
  return categories;
}


// ------------------------------
// ⚙️ イベントリスナー設定
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // 今日の日付を自動設定
  document.getElementById("date").valueAsDate = new Date();
  
  // カテゴリの選択肢を動的に更新
  updateCategoryOptions();

  // 収入/支出タイプタブのイベントリスナー
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const type = this.dataset.type;
      document.getElementById('transaction-type').value = type;
      updateCategoryOptions(); // カテゴリの選択肢を更新
    });
  });

  // フォーム送信時の処理
  document.getElementById("record-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const date = document.getElementById("date").value;
    const amount = Number(document.getElementById("amount").value);
    const type = document.getElementById("transaction-type").value;
    const mainCategory = document.getElementById("main-category").value;
    const memo = document.getElementById("memo").value.trim();

    if (!date || !amount || !mainCategory) {
      alert("日付、金額、カテゴリは必須です。");
      return;
    }

    const newRecord = {
      id: Date.now(), // ユニークID
      date,
      amount,
      type,
      mainCategory,
      memo
    };

    const history = getHouseholdHistory();
    history.push(newRecord);
    saveHouseholdHistory(history);

    this.reset(); // フォームをリセット
    document.getElementById("date").valueAsDate = new Date(); // 日付を今日に戻す
    updateHistoryList(); // 履歴リストを更新
  });

  // 初期表示
  updateHistoryList();
});


/**
 * カテゴリ選択肢を更新する関数
 */
function updateCategoryOptions() {
  const type = document.getElementById("transaction-type").value;
  const categorySelect = document.getElementById("main-category");
  // getCategoriesFromScript() を呼び出して、'パチンコ・パチスロ' カテゴリが存在することを確認
  const categoriesData = getCategoriesFromScript(); // 直接ローカルストレージを読まず、関数経由で取得

  categorySelect.innerHTML = '<option value="">選択してください</option>'; // 初期化

  const currentCategories = categoriesData[type] || [];
  currentCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.name; // name プロパティを使用
    option.textContent = cat.name; // name プロパティを使用
    categorySelect.appendChild(option);
  });
}

/**
 * 家計簿の履歴リストをUIに表示する関数
 */
function updateHistoryList() {
  const list = document.getElementById("history-list");
  list.innerHTML = "";
  const history = getHouseholdHistory();

  if (history.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #999;">まだ履歴がありません</p>';
    return;
  }

  // 新しい順に表示
  history.slice().reverse().forEach((record, index) => {
    const li = document.createElement("li");
    li.className = `history-item ${record.type}`;

    const amountText = record.type === 'income' ? 
      `+${record.amount.toLocaleString()}円` : 
      `-${record.amount.toLocaleString()}円`;

    li.innerHTML = `
      <div class="history-info">
        ${record.date} | ${record.mainCategory}
      </div>
      <div class="history-amount ${record.type}">
        ${amountText}
      </div>
      ${record.memo ? `<div class="history-memo">${record.memo}</div>` : ''}
      <div class="history-buttons">
        <button class="btn-small btn-edit" onclick="editHouseholdRecord(${record.id})">✏️ 編集</button>
        <button class="btn-small btn-delete" onclick="deleteHouseholdRecord(${record.id})">🗑️ 削除</button>
      </div>
    `;
    list.appendChild(li);
  });
}

/**
 * 家計簿の履歴レコードを編集フォームに読み込む関数
 * @param {number} id - 編集するレコードのID
 */
function editHouseholdRecord(id) {
  const history = getHouseholdHistory();
  const index = history.findIndex(record => record.id === id);
  if (index === -1) return;

  const record = history[index];

  // フォームにデータをセット
  document.getElementById("date").value = record.date;
  document.getElementById("amount").value = record.amount;
  document.getElementById("memo").value = record.memo;

  // タイプタブを切り替え (クリックイベントを発火させる)
  if (record.type === 'income') {
    document.querySelector('.type-tab[data-type="income"]').click();
  } else {
    document.querySelector('.type-tab[data-type="expense"]').click();
  }

  // カテゴリをセット (updateCategoryOptionsが呼ばれた後に実行されるように少し遅延させる)
  setTimeout(() => {
    document.getElementById("main-category").value = record.mainCategory;
  }, 0);

  // 編集するために選択されたアイテムは一時的に履歴から削除
  history.splice(index, 1);
  saveHouseholdHistory(history);
  updateHistoryList();

  window.scrollTo({ top: 0, behavior: 'smooth' }); // ページ上部へスクロール
}

/**
 * 家計簿の履歴レコードを削除する関数
 * @param {number} id - 削除するレコードのID
 */
function deleteHouseholdRecord(id) {
  if (confirm("この履歴を削除しますか？")) {
    let history = getHouseholdHistory();
    history = history.filter(record => record.id !== id);
    saveHouseholdHistory(history);
    updateHistoryList();
  }
}