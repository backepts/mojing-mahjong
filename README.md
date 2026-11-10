# 魔競娛樂麻將間

第二個麻將群組的輸贏網頁。從「番仔麻將天梯」（~/番仔麻將天梯）複製出來，完全獨立：自己的網址、主表、GAS，兩邊資料互不相干。

## 系統

- 主表：https://docs.google.com/spreadsheets/d/1OSC-eaLSQ1iFHfCtfLHzVFMApyT5ZvcuYevKRhHGQKQ/edit
- GAS 專案：https://script.google.com/d/10VEV9IMvfFpoEQP6IdPoGW-qPUQF2mv6VYLkwJEmXh4C7MTzNJ0vATW6/edit
- clasp 一律帶 `-u personal`（個人帳號）
- 主表分頁：對局紀錄（場次ID｜日期｜玩家｜輸贏｜寫入時間）、牌桌（場次ID｜日期｜將數｜開局｜結束｜寫入時間）、玩家（玩家｜加入日期｜造型）、修改紀錄、總覽（程式重畫，別手改）
- 造型可選：約克夏／白貓／凱蒂風白貓／白底虎斑／煙灰長毛／橘白長毛（玩家分頁 C 欄，空白＝自動配）
- 檔案：index.html 前台、gas/ 後端、test/core.test.js（`node test/core.test.js`）、tools/build_lab.py 產生 lab/、tools/make_icons.py 產生 icons/

## 需求（2026-11-10 和 Beck 確認）

- 帳號：都放 Beck 個人帳號 becktsai0708（GitHub backepts、Google）
- 網址：backepts.github.io/mojing-mahjong
- 功能：Rank＋個人戰績卡、記帳（新增／修改一桌）、戰況回顧、紀錄保持人、對局時間
- 不要：東錢（抽頭）、付款碼／通關密語、A／B 組別（一天只會一桌）
- 帳平規則：大家輸贏合計＝0；記帳要填將數，開局／結束時間可不填
- 成員：Beck、Fanny、Angel、MM、Luke、Harry
- 頭像全換像素貓狗：Angel 凱蒂風白貓（紅蝴蝶結，原創畫法）、MM 白底棕虎斑、Luke 煙灰長毛、Fanny 白貓、Harry 橘白長毛、Beck 約克夏
- 資料從零開始
- 配色夜貓（深色）、圖示 B 紅中長貓耳、段位名稱同番仔碼頭、輸家頭像用生氣（壓眉＋紅青筋）、Rank 下方標語拿掉（11-10 定）

## 目前進度

- 做到哪：主表＋GAS 已建、程式已 push；圖示、manifest、LAB 產生器做好
- 下一步：Beck 在 GAS 編輯器跑 setup 授權 → gas-deploy 部署 Web App → 填 API_URL → 開 GitHub repo mojing-mahjong＋Pages → 寫入 11/9 第一桌 → LAB 給 Beck 試
- 等 Beck 決定：跑 setup（要她本人授權）

## 第一筆資料（Beck 11-10 給，待寫入）

- 2026-11-09，3 將，19:40～00:30（過午夜，共 4 小時 50 分，每將約 97 分）：Fanny +920、Luke +1,580、MM −20、Beck −2,480（Beck 給的是 −900−1580，合計 −2,480；四人合計 0）
