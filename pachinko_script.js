// ------------------------------
// 🔧 初期データ読み込み
// ------------------------------
let baseMachines = []; // 外部JSONから読み込む基本機種リスト
// ローカルストレージからユーザーが追加した機種リストを読み込み、なければ空の配列
let userMachines = JSON.parse(localStorage.getItem("userMachines") || "[]");

// dmmMachines.json から機種データを非同期で読み込む
fetch("dmmMachines.json")
  .then(res => res.json())
  .then(data => {
    baseMachines = data; // 読み込んだデータを基本機種リストにセット
    updateMachineList(); // 機種リストを更新 (サジェスト用)
  })
  .catch(error => console.error("Error loading dmmMachines.json:", error)); // エラーハンドリング

// ------------------------------
// 🎮 ジャンル切り替え（パチンコ/パチスロ）
// ------------------------------
// 全てのジャンルタブにクリックイベントリスナーを設定
document.querySelectorAll('.genre-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    // アクティブ状態を切り替え: 全てのタブからactiveクラスを削除し、クリックされたタブに追加
    document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    // クリックされたタブのdata-genre属性からジャンルを取得し、隠しフィールドに設定
    const genre = this.dataset.genre;
    document.getElementById('genre').value = genre;
    
    // 機種タイプの選択肢を変更: ジャンルに応じて表示する選択肢を動的に生成
    const typeFilter = document.getElementById('type-filter');
    if (genre === 'pachinko') {
      typeFilter.innerHTML = `
        <option value="">すべて</option>
        <option value="デジパチ">デジパチ</option>
        <option value="1種2種混合">1種2種混合</option>
        <option value="羽根もの">羽根もの</option>
      `;
    } else { // pachislot の場合
      typeFilter.innerHTML = `
        <option value="">すべて</option>
        <option value="スマスロ">スマスロ</option>
        <option value="AT">AT</option>
        <option value="Aタイプ">Aタイプ</option>
      `;
    }
    
    updateMachineList(); // 機種リストを更新 (サジェスト用)
  });
});

// ------------------------------
// 🧠 正規化・略称処理
// ------------------------------

/**
 * 機種名を正規化する関数
 * - 不要な記号や機種タイプを示すキーワードを除去
 * - スペースを除去し、小文字に変換
 * @param {string} name - 正規化する機種名
 * @returns {string} 正規化された機種名
 */
function normalizeName(name) {
  return name
    .replace(/[^\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9ー]/gu, "") // 日本語、英数字、長音記号以外の記号を除去
    .replace(/スマスロ|Aタイプ|AT|ART|SLOT|パチンコ|パチスロ|CR|P/gi, "") // 機種タイプに関するキーワードを除去 (大文字小文字を区別しない)
    .replace(/\s/g, "") // スペースを除去
    .toLowerCase(); // 小文字に変換
}

// 機種名の略称や別名をマッピングするオブジェクト
const aliasMap = {
  "東京喰種": ["グール", "東京グール", "喰種"],
  "北斗の拳": ["北斗", "ホクト"],
  "バジリスク絆2": ["絆", "バジ2", "絆2"],
  "モンキーターン": ["モンキー", "猿"],
  "からくりサーカス": ["からサ", "からくり"],
  "かぐや様は告らせたい": ["かぐや様", "かぐや"],
  "Re:ゼロから始める異世界生活 season2": ["リゼロ", "Re:ゼロ", "rezero"],
  "コードギアス 反逆のルルーシュ/復活のルルーシュ": ["ギアス", "コードギアス"],
  "炎炎ノ消防隊": ["炎炎"],
  "ゴブリンスレイヤー": ["ゴブスレ"],
  "ダンジョンに出会いを求めるのは間違っているだろうか2": ["ダンまち"],
  "転生したらスライムだった件": ["転スラ"],
  "とある魔術の禁書目録": ["とある"],
  "バイオハザード:ヴェンデッタ": ["バイオ"],
  "鬼武者3": ["鬼武者"],
  "マクロスフロンティア4": ["マクロスF"],
  "ひぐらしのなく頃に 業": ["ひぐらし"],
  "ソードアート・オンライン": ["SAO", "sao"],
  "劇場版 魔法少女まどか☆マギカ [新編] 叛逆の物語": ["まどマギ", "まどか"],
  "戦国乙女4 戦乱に閃く炯眼の軍師": ["戦国乙女"],
  "甲鉄城のカバネリ": ["カバネリ"],
  "交響詩篇エウレカセブン4 HI-EVOLUTION": ["エウレカ", "エウレカセブン"],
  "ゴールデンカムイ": ["金カム"],
  "デビル メイ クライ5": ["DMC", "デビルメイクライ"],
  "ギルティクラウン2": ["ギルクラ"],
  "スマスロ バベル": ["バベル"], // aliasMapに追加
  "スマスロ 銭形5": ["銭形"], // aliasMapに追加
  "スマスロ サラリーマン金太郎": ["金太郎"], // aliasMapに追加
  "スマスロ ディスクアップ": ["ディスクアップ"], // aliasMapに追加
  "スマスロ ダンベル何キロ持てる？": ["ダンベル"], // aliasMapに追加
  "スマスロ 緑ドン VIVA!情熱南米編 REVIVAL": ["緑ドン"], // aliasMapに追加
  "スマスロ スーパービンゴネオ": ["ビンゴネオ"], // aliasMapに追加
  "スマスロ 吉宗RISING": ["吉宗"], // aliasMapに追加
  "L吉宗": ["吉宗"], // aliasMapに追加
  "L アズールレーン THE ANIMATION": ["アズールレーン"], // aliasMapに追加
  "パチスロ 転生したら剣でした": ["転スラ剣"], // aliasMapに追加
  "わたしの幸せな結婚": ["わた婚"], // aliasMapに追加
  "Lパチスロ ありふれた職業で世界最強": ["ありふれた"], // aliasMapに追加
  "L少女☆歌劇 レヴュースタァライト": ["スタァライト"], // aliasMapに追加
  "LBパチスロ ヱヴァンゲリヲン ～約束の扉～": ["エヴァ"], // aliasMapに追加
  "スマスロバジリスク～甲賀忍法帖～絆2 天膳 BLACK EDITION": ["絆2天膳"], // aliasMapに追加
  "SLOTバジリスク絆2": ["絆2"], // aliasMapに追加
  "スマスロ 沖ドキ！DUOアンコール": ["沖ドキDUO"], // aliasMapに追加
  "スマスロ 沖ドキ！GOLD": ["沖ドキGOLD"], // aliasMapに追加
  "沖ドキ！GOLD（-30）": ["沖ドキGOLD-30"], // aliasMapに追加
  "沖ドキ！DUO": ["沖ドキDUO"], // aliasMapに追加
  "沖ドキ！BLACK": ["沖ドキBLACK"], // aliasMapに追加
  "沖ドキ！ゴージャス": ["沖ドキゴージャス"], // aliasMapに追加
  "スマスロ ゴーゴージャグラー3": ["ゴージャグ3"], // aliasMapに追加
  "スマスロ マイジャグラーV": ["マイジャグV"], // aliasMapに追加
  "スマスロ ファンキージャグラー2": ["ファンキー2"], // aliasMapに追加
  "スマスロ アイムジャグラーEX": ["アイムEX"], // aliasMapに追加
  "ゴーゴージャグラー": ["ゴージャグ"], // aliasMapに追加
  "ネオアイムジャグラー": ["ネオアイム"], // aliasMapに追加
  "ニューアイムジャグラーEX": ["ニューアイムEX"], // aliasMapに追加
  "ハッピージャグラーVIII": ["ハッピージャグラー"], // aliasMapに追加
  "ジャグラーガールズSS": ["ジャグラーガールズ"], // aliasMapに追加
  "ニューキングハナハナ": ["ニューキング"], // aliasMapに追加
  "ハナハナホウオウ～天翔～": ["ハナハナ天翔"], // aliasMapに追加
  "プレミアムハナハナ": ["プレミアムハナハナ"], // aliasMapに追加
  "バーサス リヴァイズ": ["バーサス"], // aliasMapに追加
  "パチスロ東京喰種": ["東京喰種"], // aliasMapに追加
  "パチスロ戦国乙女 暁の関ヶ原": ["戦国乙女"], // aliasMapに追加
  "パチスロ黄門ちゃま喝2": ["黄門ちゃま喝2"], // aliasMapに追加
  "パチスロ 革命機ヴァルヴレイヴ": ["ヴァルヴレイヴ"], // aliasMapに追加
  "パチスロ機動戦士ガンダム ユニコーン": ["ガンダムユニコーン"], // aliasMapに追加
  "パチスロ モンスターハンターワールド：アイスボーン": ["モンハンアイスボーン"], // aliasMapに追加
  "パチスロ政宗 戦極": ["政宗戦極"], // aliasMapに追加
  "パチスロ花の慶次": ["花の慶次"], // aliasMapに追加
  "パチスロ黄門ちゃまV女神盛-MEGAMORI-": ["黄門ちゃま女神盛"], // aliasMapに追加
  "押忍！番長ZERO": ["番長ゼロ"], // aliasMapに追加
  "Sアイドルマスター ミリオンライブ！": ["アイマスミリオン"], // aliasMapに追加
  "Sキン肉マン～7人の悪魔超人編～": ["キン肉マン"], // aliasMapに追加
  "Lパチスロガールズ&パンツァー劇場版": ["ガルパン劇場版"], // aliasMapに追加
  "L聖闘士星矢 海皇覚醒Special": ["聖闘士星矢SP"], // aliasMapに追加
  "L聖闘士星矢 海皇覚醒 CUSTOM EDITION": ["聖闘士星矢CE"], // aliasMapに追加
  "L戦国BASARA HEROES PARTY": ["戦国BASARA"], // aliasMapに追加
  "パチスロ シン・エヴァンゲリオン タイプ カヲル": ["シンエヴァ"], // aliasMapに追加
  "スマスロ 頭文字D 2nd Stage": ["頭文字D"], // aliasMapに追加
  "スマスロ ファイヤードリフト": ["ファイヤードリフト"] // aliasMapに追加
};

/**
 * 入力された機種名が略称の場合、正式名称を解決する関数
 * @param {string} input - ユーザーが入力した機種名
 * @returns {string} 解決された正式名称、または元の入力
 */
function resolveAlias(input) {
  const normalizedInput = normalizeName(input); // 入力自体も正規化してから比較
  for (const [official, aliases] of Object.entries(aliasMap)) {
    // まず、公式名称自体が入力に含まれているかチェック
    if (normalizedInput.includes(normalizeName(official))) {
      return official;
    }
    // 次に、エイリアスが入力に含まれているかチェック
    if (aliases.some(alias => normalizedInput.includes(normalizeName(alias)))) {
      return official;
    }
  }
  return input; // 解決できない場合は元の入力を返す
}

/**
 * 指定された機種名が、基本機種リストまたはユーザー追加機種リストに既に似た名前で存在するかをチェックする関数。
 * @param {string} name - チェックする機種名
 * @param {Array<Object>} allMachines - 基本機種とユーザー追加機種を結合した全機種リスト
 * @returns {boolean} 似た名前の機種が存在する場合は true、そうでない場合は false。
 */
function isSimilarMachine(name, allMachines) {
  const normalized = normalizeName(name);
  return allMachines.some(m => normalizeName(m.name) === normalized);
}

// ------------------------------
// 💾 機種名の保存処理 (サジェストや新規登録時に使用)
// ------------------------------

/**
 * ユーザーが入力した機種名を、ユーザー追加機種リストに保存する関数。
 * 既に存在する場合は保存しない。
 * @param {string} inputName - ユーザーが入力した機種名
 * @param {string} type - 機種タイプ (e.g., "スマスロ", "AT")
 * @param {string} genre - ジャンル (e.g., "pachislot", "pachinko")
 */
function saveUserMachine(inputName, type, genre) {
  inputName = inputName.trim();
  if (!inputName || inputName.length < 2 || !type) return; // 短すぎる入力やタイプがない場合は処理しない

  const resolvedName = resolveAlias(inputName); // 略称を解決

  const allMachines = [...baseMachines, ...userMachines]; // 全ての機種リストを結合

  // 既に似た名前の機種が登録済みかチェック
  if (isSimilarMachine(resolvedName, allMachines)) {
    return;
  }

  // 基本機種リストに完全に一致する機種があるかチェック（サジェストで選択されなかった場合など）
  const candidates = baseMachines.filter(m =>
    normalizeName(m.name) === normalizeName(resolvedName)
  );

  if (candidates.length === 1) {
    // 基本機種に完全一致があればそのデータを追加
    userMachines.push(candidates[0]);
  } else {
    // 完全一致がない場合、新しい機種として追加
    userMachines.push({ name: resolvedName, type, genre: genre || 'pachislot' });
  }

  localStorage.setItem("userMachines", JSON.stringify(userMachines)); // ローカルストレージに保存
  updateMachineList(); // 機種リストを更新 (サジェスト用)
}

// ------------------------------
// 📋 機種リストの更新（予測変換＋絞り込みの元データ）
// ------------------------------
// この関数は主に、サジェスト機能の元となる機種リストを管理するためのものですが、
// 現在の `script.js` ではサジェストロジック内で直接 `baseMachines` と `userMachines` を使っているため、
// この関数自体は直接的なUI更新には使われていません。
// ただし、将来的に機種リストを別のUIで表示するなどの際に必要になる可能性があります。
function updateMachineList() {
  // `index.html` の `machine` 入力フィールドのサジェストで利用される
  // `baseMachines` と `userMachines` が更新されたことを通知する役割を持つが、
  // 現状では直接UI要素を操作していない。
  // 必要に応じて、ここで `machineInput.dispatchEvent(new Event('input'))` などを呼び出し、
  // サジェストを強制的に更新することもできる。
}

// ------------------------------
// 🔍 サジェスト機能（入力補助）
// ------------------------------
const machineInput = document.getElementById("machine"); // 機種名入力フィールド
const suggestionsBox = document.getElementById("suggestions"); // サジェスト表示エリア

// 機種名入力フィールドの入力イベントリスナー
machineInput.addEventListener("input", function () {
  const rawInput = this.value.trim(); // 入力値の前後空白を除去
  const input = normalizeName(resolveAlias(rawInput)); // 入力値を正規化・略称解決
  suggestionsBox.innerHTML = ""; // サジェストボックスをクリア
  
  if (!input || input.length < 1) return; // 入力が短い場合は処理を中止

  const selectedGenre = document.getElementById("genre").value; // 現在選択されているジャンル
  const all = [...baseMachines, ...userMachines]; // 全ての機種リスト

  // 選択ジャンルに基づいて機種をフィルタリング
  const genreFiltered = all.filter(m => !m.genre || m.genre === selectedGenre);
  
  // 入力値で始まる機種を優先して検索
  const exactMatches = genreFiltered.filter(m =>
    normalizeName(m.name).startsWith(input)
  );
  // 入力値を含むが、始まらない機種を検索
  const partialMatches = genreFiltered.filter(m =>
    normalizeName(m.name).includes(input) && 
    !normalizeName(m.name).startsWith(input)
  );
  
  // 完全一致を優先し、その後部分一致を結合
  const matches = [...exactMatches, ...partialMatches];

  if (matches.length === 0) {
    // 一致する機種がない場合、新規登録を促すメッセージを表示
    const div = document.createElement("div");
    div.style.color = "#888";
    div.style.fontStyle = "italic";
    div.textContent = `"${rawInput}" を新規登録`;
    suggestionsBox.appendChild(div);
    return;
  }

  // 上位10件のサジェストを表示
  matches.slice(0, 10).forEach(m => {
    const div = document.createElement("div");
    const genreIcon = (m.genre === 'pachinko' || m.type?.includes('デジパチ')) ? '🎯' : '🎰'; // ジャンルに応じてアイコンを切り替え
    div.textContent = `${genreIcon} ${m.name}（${m.type}）`;
    div.onclick = () => {
      machineInput.value = m.name; // 選択された機種名を入力欄にセット
      // ジャンルタブのactive状態を更新し、対応するタイプフィルターを自動選択
      document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
      const targetGenreTab = document.querySelector(`.genre-tab[data-genre="${m.genre || 'pachislot'}"]`);
      if (targetGenreTab) {
        targetGenreTab.classList.add('active');
        document.getElementById("genre").value = m.genre || 'pachislot';
        // `type-filter` の選択肢を更新するためにジャンル変更イベントを発火
        document.getElementById("type-filter").innerHTML = ''; // 一旦クリア
        if ((m.genre || 'pachislot') === 'pachinko') {
          document.getElementById('type-filter').innerHTML = `
            <option value="">すべて</option>
            <option value="デジパチ">デジパチ</option>
            <option value="1種2種混合">1種2種混合</option>
            <option value="羽根もの">羽根もの</option>
          `;
        } else {
          document.getElementById('type-filter').innerHTML = `
            <option value="">すべて</option>
            <option value="スマスロ">スマスロ</option>
            <option value="AT">AT</option>
            <option value="Aタイプ">Aタイプ</option>
          `;
        }
        document.getElementById("type-filter").value = m.type || "";
      }
      suggestionsBox.innerHTML = ""; // サジェストボックスを閉じる
    };
    suggestionsBox.appendChild(div);
  });
});

// 入力欄からフォーカスが外れたら、少し遅れてサジェストボックスを閉じる
machineInput.addEventListener("blur", () => {
  setTimeout(() => suggestionsBox.innerHTML = "", 200);
});

// 機種タイプフィルターが変更された際も機種リストを更新するが、
// 現在の `index.html` のサジェストロジックでは直接使われない。
// 必要に応じて `updateMachineList()` を呼び出し、サジェストを更新する。
document.getElementById("type-filter").addEventListener("change", updateMachineList);

// ------------------------------
// 📝 登録処理（フォーム送信）
// ------------------------------
document.getElementById("income-form").addEventListener("submit", function (e) {
  e.preventDefault(); // デフォルトのフォーム送信を防止

  const machineName = document.getElementById("machine").value; // 機種名
  const type = document.getElementById("type-filter").value; // 機種タイプ
  const genre = document.getElementById("genre").value; // ジャンル
  
  saveUserMachine(machineName, type, genre); // ユーザー追加機種リストに保存（必要であれば）

  const investment = Number(document.getElementById("investment").value); // 投資額
  const returnAmount = Number(document.getElementById("return").value); // 回収額
  const diff = returnAmount - investment; // 収支計算

  const data = {
    date: document.getElementById("date").value, // 日付
    machine: machineName,
    genre: genre,
    investment: investment,
    return: returnAmount,
    diff: diff
  };

  const history = JSON.parse(localStorage.getItem("history") || "[]"); // 既存の履歴データを取得 (パチスロ専用)
  history.push(data); // 新しいデータを追加
  localStorage.setItem("history", JSON.stringify(history)); // ローカルストレージに保存
  
  // ここから家計簿への連携処理を追加 ----------------------------------------------------
  const householdHistory = JSON.parse(localStorage.getItem("household_account_book_transactions") || "[]");
  
  // パチンコの収支を家計簿に記録
  const householdRecord = {
    id: Date.now() + Math.random(), // ユニークIDを確保 (パチンコ記録と被らないようランダム追加)
    date: document.getElementById("date").value,
    amount: Math.abs(diff), // 金額は絶対値で、収支がプラスでもマイナスでもamountは正の値
    type: diff >= 0 ? "income" : "expense", // 収支がプラスなら収入、マイナスなら支出
    mainCategory: "パチンコ・パチスロ", // 専用のカテゴリ
    memo: `${machineName} (${diff >= 0 ? '+' : ''}${diff.toLocaleString()}円)` // 機種名と収支をメモに
  };
  
  householdHistory.push(householdRecord);
  localStorage.setItem("household_account_book_transactions", JSON.stringify(householdHistory));

  // 家計簿のカテゴリに「パチンコ・パチスロ」がない場合に追加 (初回起動時やカテゴリ追加忘れ対策)
  let categoriesData = JSON.parse(localStorage.getItem('household_account_book_categories') || '{"income":[],"expense":[]}');
  const pachinkoCategoryExists = categoriesData.expense.some(cat => cat.name === 'パチンコ・パチスロ');
  if (!pachinkoCategoryExists) {
    categoriesData.expense.push({ id: Date.now() + Math.random(), name: 'パチンコ・パチスロ' });
    localStorage.setItem('household_account_book_categories', JSON.stringify(categoriesData));
  }
  // 家計簿への連携処理ここまで ----------------------------------------------------------

  // フォームをリセット
  document.getElementById("machine").value = "";
  document.getElementById("investment").value = "";
  document.getElementById("return").value = "";
  document.getElementById("type-filter").value = ""; // タイプフィルターもリセット
  
  showHistory(); // 履歴リストを再表示 (パチスロ専用)
});

// ------------------------------
// 📜 履歴表示・編集・削除
// ------------------------------

/**
 * ローカルストレージの履歴データを取得し、UIに表示する関数
 */
function showHistory() {
  const list = document.getElementById("history-list");
  list.innerHTML = ""; // 既存リストをクリア
  const history = JSON.parse(localStorage.getItem("history") || "[]"); // 履歴データを取得

  if (history.length === 0) {
    // 履歴がない場合のメッセージ
    list.innerHTML = '<p style="text-align: center; color: #999;">まだ履歴がありません</p>';
    return;
  }

  // 履歴を新しい順に表示するために逆順にループ
  history.slice().reverse().forEach((item, index) => {
    // 実際の配列インデックスを計算 (reverseされる前の位置)
    const actualIndex = history.length - 1 - index; 
    const li = document.createElement("li");
    li.className = `history-item ${item.diff >= 0 ? 'positive' : 'negative'}`; // 収支に応じてクラスを設定
    
    const genreIcon = item.genre === 'pachinko' ? '🎯' : '🎰'; // ジャンルアイコン
    const diffText = item.diff >= 0 ? `+${item.diff.toLocaleString()}円` : `${item.diff.toLocaleString()}円`; // 収支の表示形式
    
    li.innerHTML = `
      <div class="history-info">
        ${item.date} | ${genreIcon} ${item.machine}
      </div>
      <div>投資: ${item.investment.toLocaleString()}円 → 回収: ${item.return.toLocaleString()}円</div>
      <div class="history-amount ${item.diff >= 0 ? 'positive' : 'negative'}">
        収支: ${diffText}
      </div>
      <div class="history-buttons">
        <button class="btn-small btn-edit" onclick="editHistory(${actualIndex})">✏️ 編集</button>
        <button class="btn-small btn-delete" onclick="deleteHistory(${actualIndex})">🗑️ 削除</button>
      </div>
    `;
    
    list.appendChild(li); // リストに追加
  });
}

/**
 * 指定されたインデックスの履歴データを編集フォームに読み込み、削除する関数
 * @param {number} index - 編集する履歴データの配列インデックス
 */
function editHistory(index) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const item = history[index]; // 編集対象のアイテムを取得
  
  // フォームにデータをセット
  document.getElementById("date").value = item.date;
  document.getElementById("machine").value = item.machine;
  document.getElementById("investment").value = item.investment;
  document.getElementById("return").value = item.return;
  
  // ジャンルタブを切り替え (クリックイベントを発火させる)
  if (item.genre === 'pachinko') {
    document.querySelector('[data-genre="pachinko"]').click();
  } else {
    document.querySelector('[data-genre="pachislot"]').click();
  }
  // 機種タイプも選択
  document.getElementById("type-filter").value = item.type || "";
  
  // 編集するために選択されたアイテムは一時的に履歴から削除
  history.splice(index, 1);
  localStorage.setItem("history", JSON.stringify(history));
  showHistory(); // 履歴リストを再表示
  
  window.scrollTo({ top: 0, behavior: 'smooth' }); // ページ上部へスクロール
}

/**
 * 指定されたインデックスの履歴データを削除する関数
 * @param {number} index - 削除する履歴データの配列インデックス
 */
function deleteHistory(index) {
  if (confirm("この履歴を削除しますか？")) { // 削除確認
    const history = JSON.parse(localStorage.getItem("history") || "[]");
    const deletedItem = history[index]; // 削除されるアイテム

    // 家計簿の履歴からも削除
    let householdHistory = JSON.parse(localStorage.getItem("household_account_book_transactions") || "[]");
    
    // パチンコアプリから追加された家計簿レコードを特定し、削除する
    // IDはランダムな部分もあるため、date, mainCategory, amount, type, memo で判断
    householdHistory = householdHistory.filter(record => {
      // パチンコ・パチスロ以外のレコードは保持
      if (record.mainCategory !== "パチンコ・パチスロ") return true;

      // 日付と収支タイプが一致するか
      if (record.date !== deletedItem.date) return true;
      if ((record.type === "income" && deletedItem.diff < 0) || (record.type === "expense" && deletedItem.diff >= 0)) return true;
      
      // 金額の絶対値が一致するか
      if (record.amount !== Math.abs(deletedItem.diff)) return true;

      // メモの内容が一致するか (機種名と金額が含まれていることを確認)
      const expectedMemo = `${deletedItem.machine} (${deletedItem.diff >= 0 ? '+' : ''}${deletedItem.diff.toLocaleString()}円)`;
      if (record.memo !== expectedMemo) return true;
      
      // ここまで来た場合、削除対象の家計簿レコードと判断する
      return false;
    });

    localStorage.setItem("household_account_book_transactions", JSON.stringify(householdHistory));
    
    // パチンコ履歴から削除
    history.splice(index, 1); // 配列から削除
    localStorage.setItem("history", JSON.stringify(history)); // ローカルストレージを更新
    showHistory(); // 履歴リストを再表示
  }
}

// ------------------------------
// 🚀 初期表示
// ------------------------------
// ページロード時に今日の日付を自動設定
document.getElementById("date").valueAsDate = new Date();
showHistory(); // 履歴リストを初期表示