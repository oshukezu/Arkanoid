export function generateLevel(level) {
    // 30 Levels max logic (loop or cap?) User said support 30 levels.
    // Random generation for each.
    const rows = Math.min(15, 5 + Math.floor(level / 2)); // Dynamic rows
    const cols = 8;
    const map = [];

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            // 20% empty
            if (Math.random() < 0.2) {
                row.push(0);
                continue;
            }

            // Brick Types:
            // 1: Normal (Color determined by row/random)
            // 2: Hard (Silver) - 5%
            // 3: Item (Gold -> S/L/B logic handled in Game) - 5% (Brick itself doesn't know item type yet)

            // Special Bricks (Immediate Effect):
            // 4: Red (Slow) - 5%
            // 5: Yellow (Fast) - 5%
            // 6: Blue (Split/Multiball) - 5%

            const rand = Math.random();
            if (rand < 0.05) row.push(2);       // Hard
            else if (rand < 0.10) row.push(4);  // Red
            else if (rand < 0.15) row.push(5);  // Yellow
            else if (rand < 0.20) row.push(6);  // Blue
            else row.push(1);                   // Normal (Items will be probability on break of Normal/Hard)
        }
        map.push(row);
    }
    return map;
}
