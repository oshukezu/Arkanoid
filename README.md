🕹️ Arkanoid Pro Mobile (SNES Revival)
這是一個針對智慧型手機優化的經典「打磚塊」重製版。保留了 SNES 的像素美學，並導入現代隨機關卡生成算法與豐富的道具機制。

🚀 核心機制
復刻操作： 模擬 SNES 十字鍵，智慧型手機上採左/右半屏觸控。
黏性發球： 球初始（或生命重置）時黏在板上，點擊 A 鈕（畫面中央）發射。
物理動能： 每彈跳一次，球速自動增加 1%，挑戰玩家的反應極限（設有安全上限）。
生命與結算： 共有 5 條命。歸零時觸發 Game Over 畫面，顯示最終得分。

🛠️ 進階功能 (Cursor Script)
1. 隨機關卡生成器 (Level Generator)
具備動態演算法，自動生成 30 個不重複關卡。隨著關卡進度，磚塊密度、血量（多重擊打磚塊）與障礙物配置將自動提升難度。

2. 道具系統 (Power-ups)
擊碎特定磚塊後隨機掉落：
Paddle Morph: 板子伸長或縮短。
Multi-Ball: 瞬間分裂出多顆球（多線程作戰）。
Speed Control: 全域速度加速或減緩。
Brick Glitch: 關卡中隨機位置重生磚塊。

3. 特色玩法 (Added Mechanics)
Boss Fight: 每 10 關出現大型首領。
Bullet Time: 能量滿時可觸發 2 秒慢動作。
Gravity Well: 部分關卡具備引力場，會偏移球路。
Combo System: 連續擊碎磚塊得分加倍。
Haptic Feedback: 碰撞時提供手機震動回饋。

📂 檔案結構建議
Plaintext
├── index.html       # 遊戲主入口與手機適配 Viewport
├── style.css        # 8-bit 字體與 SNES 復古濾鏡樣式
├── game.js          # 核心邏輯 (Phaser 3 或 Canvas API)
└── assets/          # 資源目錄
    ├── sounds/      # 8-bit 音效 (跳躍、爆炸、GameOver)
    └── sprites/     # 像素貼圖 (板子、球、磚塊)

⚠️ 開發注意事項 (Dev Tips)
速度封頂： 腳本內必須設定 MAX_SPEED，建議為初始速度的 2.5 倍，否則手機螢幕更新率將跟不上球速。
碰撞邊界： 確保板子移動不會超出螢幕邊緣，且在不同解析度（iPhone/Android）下均能等比例縮放。
效能優化： 在手機瀏覽器運行時，道具掉落與粒子效果需注意物件池（Object Pooling）管理，避免造成延遲。

# Arkanoid
