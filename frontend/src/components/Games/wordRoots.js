// 每個線索單字的「字根小教室」。
//
// 這批單字有一半是 cat、kite 這種沒有有意義字根的字，硬套拉丁字根只會教錯，
// 所以分成四種標籤，各自給真正用得上的東西：
//   字根     — 真的有拉丁／希臘字根，而且能牽出同源字
//   構詞     — 字首字尾或複合字，看得出組成
//   拼字規則 — 複數、時態、字母組合的規則
//   字源     — 這個字的來歷故事
export const ROOT_KIND = {
  root: { label: '字根', emoji: '🌱' },
  build: { label: '構詞', emoji: '🧩' },
  spell: { label: '拼字規則', emoji: '✏️' },
  origin: { label: '字源', emoji: '📜' },
};

export const WORD_ROOTS = {
  // ---- 姊姊：食物 ----
  chocolate: { kind: 'origin', title: 'xocolatl 變成的字', body: '來自阿茲特克人的語言，原本叫 xocolatl，是可可做的飲料。拼的時候記住 cho-co-late 三段。' },
  carrot: { kind: 'root', title: 'carrot 和「胡蘿蔔素」', body: '希臘文 karoton 來的。胡蘿蔔素 carotene 就是從 carrot 命名的，兩個字長得很像。' },
  chicken: { kind: 'build', title: 'chick 的家族', body: 'chick 是小雞，chicken 是雞和雞肉，同一家族。記住 chick 就記住了前面五個字母。' },
  crisps: { kind: 'build', title: 'crisp ＋ -s', body: 'crisp 是「脆脆的」，加 -s 變成洋芋片 crisps。英國叫 crisps，美國叫 chips。' },
  coconut: { kind: 'build', title: 'coco ＋ nut', body: 'coco ＋ nut（堅果）。coco 在葡萄牙文是「鬼臉」，因為椰子上的三個洞看起來像一張臉。' },

  // ---- 姊姊：學校 ----
  classroom: { kind: 'build', title: 'class ＋ room', body: 'class（班級）＋ room（房間）＝ 教室。兩個會的字併起來，就是一個新字。' },
  chair: { kind: 'root', title: 'kathedra ＝ 座位', body: '希臘文 kathedra 是「座位」。大教堂 cathedral 就是「主教的座位」，和 chair 同一個來源。' },
  computer: { kind: 'root', title: 'com- ＋ pute ＋ -er', body: 'com-（一起）＋ putare（計算）＝ compute 計算，再加 -er 變成「會計算的東西」＝ 電腦。' },
  class: { kind: 'root', title: 'classis ＝ 分類', body: '拉丁文 classis 是「分類、等級」。classify（分類）、classic（經典）都是這個字根。' },
  classmate: { kind: 'build', title: '-mate ＝ 夥伴', body: 'class ＋ mate（夥伴）＝ 同班同學。teammate 隊友、roommate 室友，都是同一個 -mate。' },

  // ---- 姊姊：動作 ----
  dance: { kind: 'build', title: 'dance → dancer', body: '加 -er 就變成「做這件事的人」：dance → dancer 舞者。teach → teacher、sing → singer 也一樣。' },
  clap: { kind: 'origin', title: '聽聲音造的字', body: 'clap 是模仿拍手聲造出來的字。cl- 開頭常和撞擊聲有關：clap 拍手、click 喀答、clash 碰撞。' },
  cry: { kind: 'spell', title: '子音 ＋ y 要改 i', body: 'cry 的 y 前面是子音 r，所以變化時 y 要改成 i：cries、cried。try、fly 也是這樣。' },
  read: { kind: 'spell', title: '三態同形，發音不同', body: 'read / read / read 三個都一樣拼，但過去式唸成 red。加 -er 變成 reader 讀者。' },
  catch: { kind: 'spell', title: '-tch 一起發音', body: 'tch 三個字母一起發 /tʃ/。字尾是 ch、tch 的字，複數或第三人稱要加 -es：catches、watches。' },

  // ---- 姊姊：生活用語 ----
  clothes: { kind: 'build', title: 'cloth 的家族', body: 'cloth 是「布」，clothes 是用布做成的「衣服」。多了 -es，意思從材料變成成品。' },
  color: { kind: 'build', title: 'color ＋ -ful', body: '加 -ful（充滿…的）變成 colorful 多彩的。美式寫 color，英式寫 colour，多一個 u。' },
  clean: { kind: 'build', title: '一個字兩種用法', body: 'clean 可以是形容詞（乾淨的），也可以是動詞（打掃）。加 -er 變成 cleaner 清潔工或清潔劑。' },
  closed: { kind: 'build', title: 'close ＋ -d', body: 'close（關）加 -d 變成 closed，用來形容「已經關起來、打烊的」狀態。' },
  child: { kind: 'spell', title: '不規則複數', body: 'child 的複數不是加 -s，是 children。加 -hood（時期）變成 childhood 童年。' },

  // ---- 妹妹：物品與基礎用語 ----
  kite: { kind: 'origin', title: '本來是一種鳥', body: 'kite 原本是一種會在天上盤旋的老鷹。風箏飛起來的樣子很像牠，就借用了這個名字。' },
  cloud: { kind: 'build', title: 'cloud ＋ -y', body: '加 -y 變成 cloudy 多雲的。天氣的字很多都這樣：rain → rainy、sun → sunny、wind → windy。' },
  flower: { kind: 'root', title: 'flor- ＝ 花', body: '拉丁文 flos／flor- 是「花」。花店 florist 是同一個字根。麵粉 flour 本來也是同一個字，指「最精華的部分」。' },
  umbrella: { kind: 'root', title: 'umbra ＝ 影子', body: '拉丁文 umbra 是「影子」，加上「小小的」字尾，意思是「小影子」——雨傘本來是拿來遮太陽的。' },
  bench: { kind: 'spell', title: 'ch 結尾加 -es', body: '字尾是 ch 的字，複數要加 -es：bench → benches。watch → watches 也是同一條規則。' },

  // ---- 妹妹：動物 ----
  monkey: { kind: 'spell', title: '母音 ＋ y 直接加 -s', body: 'monkey 的 y 前面是母音 e，所以複數直接加 -s：monkeys，不用改成 i。' },
  duck: { kind: 'origin', title: '「鑽進水裡」的鳥', body: 'duck 當動詞是「低頭閃過、鑽下去」。鴨子最愛把頭鑽進水裡找東西吃，就用這個字當牠的名字。' },
  snake: { kind: 'root', title: 'snake 和 sneak', body: 'snake（蛇）和 sneak（偷偷靠近）來自同一個古老的字根，都是「悄悄爬行」的意思。' },
  bird: { kind: 'build', title: 'bird 的複合字', body: 'bird ＋ house ＝ birdhouse 鳥屋，bird ＋ cage ＝ birdcage 鳥籠。會了 bird 就能拆懂一整串字。' },
  bear: { kind: 'origin', title: '「棕色的那個」', body: '古代人怕直接叫熊的名字會招來牠，就改稱「棕色的那個」，bear 就是從「棕色」變來的。' },

  // ---- 妹妹：交通與職業 ----
  violin: { kind: 'build', title: 'viola 的小號版', body: '義大利文 violino ＝ viola（中提琴）＋「小小的」字尾。加 -ist 變成 violinist 小提琴手。' },
  piano: { kind: 'origin', title: 'piano ＋ forte', body: '全名是 pianoforte：piano 是「小聲」，forte 是「大聲」，因為這種琴能彈出強弱。後來大家只留下前半。' },
  train: { kind: 'root', title: 'trahere ＝ 拉', body: '拉丁文 trahere 是「拉」。火車是一節一節被拉著走的。拖拉機 tractor、吸引 attract 都是同一個字根。' },
  dancer: { kind: 'build', title: '-er ＝ 做這件事的人', body: 'dance ＋ -er ＝ 跳舞的人。play → player、teach → teacher、sing → singer，全是同一個 -er。' },
  doctor: { kind: 'root', title: 'docere ＝ 教導', body: '拉丁文 docere 是「教導」，doctor 本來指「有學問、能教人的人」。文件 document 也是這個字根。' },

  // ---- 妹妹：數字與身體部位 ----
  three: { kind: 'build', title: 'three 藏在哪裡', body: 'three 會變形躲在別的字裡：third 第三、thirteen 十三、thirty 三十，都看得到 thir-。' },
  seven: { kind: 'build', title: '-teen 和 -ty', body: 'seven ＋ -teen ＝ seventeen 十七，seven ＋ -ty ＝ seventy 七十。-teen 是十幾，-ty 是幾十。' },
  ten: { kind: 'build', title: 'ten 和 -teen', body: '-teen 就是從 ten 來的，所以 thirteen 到 nineteen 都是「十幾」。ten ＋ -th ＝ tenth 第十。' },
  hand: { kind: 'build', title: 'hand 的複合字', body: 'hand ＋ made ＝ handmade 手工做的，hand ＋ bag ＝ handbag 手提包。' },
  foot: { kind: 'spell', title: '母音變化的複數', body: 'foot 的複數是 feet，不是加 -s，而是把 oo 換成 ee。football ＝ foot ＋ ball。' },
};

export function rootOf(word) {
  return WORD_ROOTS[(word?.english || word?.en || '').toLowerCase()] || null;
}
