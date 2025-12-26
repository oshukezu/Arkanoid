export function generateLevel(levelNumber) {
    // 5 initial rows, adding 1 row every 5 levels
    const rows = 5 + Math.floor(levelNumber / 5);
    const cols = 8; // Fits nicely in 540 width (540 / 8 = 67.5px or so)
    const levelData = [];

    for (let i = 0; i < rows; i++) {
        levelData[i] = [];
        for (let j = 0; j < cols; j++) {
            // 隨機生成磚塊類型：0=空, 1=普通, 2=硬磚(需打兩次), 3=道具磚
            // Logic: 30% chance to be empty.
            // If not empty (70%), 20% chance to be special (item), otherwise normal?
            // User requested: Math.random() > 0.3 ? (Math.random() > 0.8 ? 3 : 1) : 0;
            // Let's integrate Hard Brick (2) as well.

            if (Math.random() > 0.3) {
                const randType = Math.random();
                if (randType > 0.9) {
                    levelData[i][j] = 3; // Item
                } else if (randType > 0.8) {
                    levelData[i][j] = 2; // Hard
                } else {
                    levelData[i][j] = 1; // Normal
                }
            } else {
                levelData[i][j] = 0; // Empty
            }
        }
    }
    return levelData;
}
