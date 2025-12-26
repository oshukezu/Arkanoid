export function generateLevel(levelNum) {
    const rows = 8 + Math.floor(levelNum / 5); // Increase rows slowly
    const cols = 8;
    const levelMap = [];

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            // Chance for empty space
            if (Math.random() < 0.1) {
                row.push(0);
            } else {
                // Determine brick type
                const rand = Math.random();
                if (rand < 0.05) {
                    row.push(2); // Hard brick (Silver)
                } else if (rand < 0.1) {
                    row.push(3); // Gold Item (Score)
                } else if (rand < 0.15) {
                    row.push(4); // RED (Slow)
                } else if (rand < 0.20) {
                    row.push(5); // YELLOW (Fast)
                } else if (rand < 0.25) {
                    row.push(1); // Normal Colored
                }
            }
        }
        levelMap.push(row);
    }
    return levelMap;
}
