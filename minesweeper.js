/* Minesweeper */
// Implementation of the game of minesweeper

// program variables
let DEBUG = false;
let AUTOPLAY = false;
const SQUARE_WIDTH = 40;
let WIDTH;
let HEIGHT;

// grid class
class Grid {
    static BEGINNER_GRID() { return { width: 9, height: 9, mines: 10 }; }
    static INTERMEDIATE_GRID() { return { width: 16, height: 16, mines: 40 }; }
    static ADVANCED_GRID() { return { width: 30, height: 16, mines: 99 }; }
    static CUSTOM_GRID(width, height, mines) { return { width: width, height: height, mines: mines }; }

    // -2     = flagged square (display only)
    // -1     = hidden square (display only)
    // 0      = empty visible square
    // 1-8    = indicator
    // 100    = mine
    constructor(gridOptions) {
        this.master = [];
        this.display = [];
        this.periphery = [];
        this.options = gridOptions;
        this.flags = gridOptions.mines;
        this.squaresLeft = gridOptions.width * gridOptions.height;
        this.firstPop = true;
        this.killerMine = null;

        this.initializeGrid();
    }

    // construction functions
    initializeGrid() {
        for (let i = 0; i < this.height(); i++) {
            this.master.push([]);
            this.display.push([]);
            this.periphery.push([]);
            for (let j = 0; j < this.width(); j++) {
                this.master[i].push(0);
                this.display[i].push(-1);
                this.periphery[i].push(0);
            }
        }
    }

    generateMines(notX, notY) {
        for (let i = 0; i < this.numMines(); i++) {
            this.addMine(notX, notY);
        }
    }

    addMine(notX, notY) {
        let x = Math.floor(Math.random() * this.width());
        let y = Math.floor(Math.random() * this.height());
        if (this.isValidMineLoc(x, y, notX, notY) && !this.isMineMaster(x, y)) {
            this.setMine(x, y);
        } else {
            this.addMine(notX, notY);
        }
    }

    isValidMineLoc(x, y, notX, notY) {
        let isValid = true;
        Grid.forEachInSquare(notX, notY, (xN, yN) => {
            if (x === xN && y === yN) {
                isValid = false;
            }
        });
        return isValid;
    }

    setMine(x, y) {
        this.setMasterSquare(x, y, 100);
        Grid.forEachNeighbor(x, y, (x, y) => this.incrementIndicator(x, y));
    }

    // game interaction functions
    pop(x, y) {
        if (this.isHiddenUnflagged(x, y)) {
            this.checkFirstPop(x, y);
            this.setPopped(x, y);

            if (this.isEmptyMaster(x, y)) {
                Grid.forEachNeighbor(x, y, (x, y) => this.pop(x, y));
            } else if (!gameOver && this.isMineMaster(x,y)) {
                console.log("GAME OVER");
                gameOver = true;
                this.killerMine = {x: x, y: y};
                this.popAllMines();
            } else if (!gameOver && this.squaresLeft === this.numMines()) {
                console.log("YOU WON");
                gameOver = true;
                gameWin = true;
                this.flagAllSquares();
            }
        }
    }

    popAllMines() {
        Grid.forWholeGrid(this, (x, y) => {
            if (this.isMineMaster(x, y)) {
                this.pop(x, y);
            }
        });
    }

    flagAllSquares() {
        Grid.forWholeGrid(this, (x, y) => {
            if (this.isHiddenUnflagged(x, y)) {
                this.flag(x, y);
            }
        });
    }

    checkFirstPop(x, y) {
        if (this.firstPop) {
            this.generateMines(x, y);
            this.firstPop = false;
        }
    }

    setPopped(x, y) {
        let square = this.getMasterSquare(x, y);
        if (square !== undefined) {
            this.setSquare(x, y, square);
            this.squaresLeft--;
        }
    }

    flag(x, y) {
        if (this.isHidden(x, y)) {
            if (this.isFlagged(x, y)) {
                this.setUnflagged(x, y);
            } else {
                this.setFlagged(x, y)
            }
        }
    }

    setFlagged(x, y) {
        this.setSquare(x, y, -2);
        this.flags--;
    }

    setUnflagged(x, y) {
        this.setSquare(x, y, -1);
        this.flags++;
    }

    // TODO fix so that it works by actually calling flag toggle
    // ie make it realize that the indicator its looking at has already been checked
    flagAdjacentSquares(x, y) {
        let moveMade = false;
        Grid.forEachNeighbor(x, y, (x, y) => {
            if (this.isHiddenUnflagged(x, y)) {
                this.flag(x,y);
                moveMade = true;
            }
        });
        return moveMade;
    }

    popAdjacentSquares(x, y) {
        let moveMade = false;
        Grid.forEachNeighbor(x, y, (x, y) => {
            if (this.isHiddenUnflagged(x, y)) {
                this.pop(x,y);
                moveMade = true;
            }
        });
        return moveMade;
    }

    numAdjacentSquares(x, y) {
        let adjacentSquares = 0;
        Grid.forEachNeighbor(x, y, (x, y) => {
            if (this.isInBounds(x, y) && this.isHidden(x, y)) {
                adjacentSquares++;
            }
        });
        return adjacentSquares;
    }

    numAdjacentFlags(x, y) {
        let adjacentFlags = 0;
        Grid.forEachNeighbor(x, y, (x, y) => {
            if (this.isInBounds(x, y) && this.isFlagged(x, y)) {
                adjacentFlags++;
            }
        });
        return adjacentFlags;
    }

    isPeriphery(x, y) {
        let hasHidden = false;
        let hasVisible = false;
        Grid.forEachCrossNeighbor(x, y, (x, y) => {
            if (this.isInBounds(x, y) && this.isHiddenUnflagged(x, y)) {
                hasHidden = true;
            } else if (this.isInBounds(x, y) && this.isVisible(x, y)) {
                hasVisible = true;
            }
        });
        return this.isHiddenUnflagged(x, y) && hasHidden && hasVisible;
    }


    addToPeriphery(periphery, x, y) {
        periphery.push({x: x, y: y, probability: 0.0});
        this.setPeripheryVal(x, y, 1);
        Grid.forEachCrossNeighbor(x, y, (x, y) => {
            // look at the square's cross indicators
            if (this.isIndicator(x, y) && this.getPeripheryVal(x, y) !== -1) {
                this.setPeripheryVal(x, y, -1);
                Grid.forEachNeighbor(x, y, (x, y) => {
                    // for each cross indicator, addToPeriphery() all neighboring hidden unflagged squares
                    if (this.isHiddenUnflagged(x, y) && this.getPeripheryVal(x, y) !== 1) {
                        this.addToPeriphery(periphery, x, y);
                    }
                });
            }
        });
    }

    getPeriphery(x, y) {
        let periphery = [];
        this.addToPeriphery(periphery, x, y);

        while (periphery.length > 15) {
            periphery.pop();
            this.setPeripheryVal(x, y, 0);
        }

        this.computeProbabilities(periphery);
        return periphery;
    }

    // TODO maybe we dont need to ever call this method
    unapplyConfiguration(periphery, config) {
        Grid.forWholeGrid(this, (x, y) => {
            if (this.getPeripheryVal(x, y) === 100 || this.getPeripheryVal(x, y) === 2) {
                this.setPeripheryVal(x, y, 1);
            } else if (this.getPeripheryVal(x, y) === -1) {
                this.setPeripheryVal(x, y, 0);
            }
        });
    }

    applyConfiguration(periphery, config) {
        this.unapplyConfiguration();
        for (let i = 0; i < periphery.length; i++) {
            if (config[i]) {
                this.setPeripheryVal(periphery[i].x, periphery[i].y, 100);
            } else {
                this.setPeripheryVal(periphery[i].x, periphery[i].y, 2);
            }
        }
    }

    isDoublePeripheryIdicator(x, y) {
        let hasAOne = false;
        let hasATwo = false;
        Grid.forEachNeighbor(x, y, (x, y) => {
            if (this.getPeripheryVal(x, y) === 1) {
                hasAOne = true;
            } else if (this.getPeripheryVal(x, y) === 2) {
                hasATwo = true;
            }
        });
        return hasAOne && hasATwo;
    }

    // 1     = on periphery
    // 100   = is bomb
    // -1    = indicator that has already been checked
    isValidConfiguration(periphery, config) {
        function numMinesInConfig(config) {
            let counter = 0;
            for (const active of config) {
                if (active) {
                    counter++;
                }
            }
            return counter;
        }
        if (numMinesInConfig(config) > this.numFlags()) {
            return false;
        }

        for (const square of periphery) {
            this.applyConfiguration(periphery, config);
            for (let x = square.x - 1; x <= square.x + 1; x++) {
                for (let y = square.y - 1; y <= square.y + 1; y++) {
                    if (!(x === square.x && y === square.y) && (x === square.x || y === square.y)) {

                        if (this.isIndicator(x, y) && this.getPeripheryVal(x, y) !== -1 && !this.isDoublePeripheryIdicator(x,y)) {
                            if (this.numAdjacentConfigMines(x, y) === this.getSquare(x, y)) {
                                this.setPeripheryVal(x, y, -1);
                            } else {
                                return false;
                            }
                        }

                    }
                }
            }

        }

        return true;
    }

    numAdjacentConfigMines(x, y) {
        let counter = 0;
        Grid.forEachNeighbor(x, y, (x, y) => {
            if (this.getPeripheryVal(x, y) === 100 || this.isFlagged(x, y)) {
                counter++;
            }
        });
        return counter;
    }

    computeProbabilities(periphery) {
        function nextPermutation(config) {
            let carry = false;
            for (let i = 0; i < config.length; i++) {
                if (config[i]) {
                    config[i] = false;
                    carry = true;
                } else {
                    config[i] = true;
                    carry = false;
                }

                if (!carry) return true;
            }
            return false;
        }

        function addToCount(config) {
            for (let i = 0; i < config.length; i++) {
                if (config[i]) {
                    mineCounts[i]++;
                }
            }
            totalConfigs++;
        }

        let configuration = [];
        let mineCounts = [];
        let totalConfigs = 0;

        for (let i = 0; i < periphery.length; i++) {
            configuration.push(false);
            mineCounts.push(0);
        }

        do {
            if (this.isValidConfiguration(periphery, configuration)) {
                addToCount(configuration);
            }
        } while (nextPermutation(configuration));

        for (let i = 0; i < periphery.length; i++) {
            periphery[i].probability = mineCounts[i]/totalConfigs;
        }
    }

    clearPeripheryGrid() {
        Grid.forWholeGrid(this, (x, y) => {
            this.setPeripheryVal(x, y, 0);
        });
    }

    getPeripheries() {
        let peripheries = [];
        this.clearPeripheryGrid();
        Grid.forWholeGrid(this, (x, y) => {
            if (this.isPeriphery(x, y) && this.getPeripheryVal(x, y) === 0) {
                peripheries.push(this.getPeriphery(x, y));
            }
        });
        return peripheries;
    }

    popRemainingSquares() {
        Grid.forWholeGrid(this, (x, y) => {
            if (this.isHiddenUnflagged(x, y)) {
                this.pop(x, y);
            }
        });
    }

    numRemainingSquares() {
        let counter = 0;
        Grid.forWholeGrid(this, (x, y) => {
            if (this.isHiddenUnflagged(x, y)) {
                counter++;
            }
        });
        return counter;
    }

    getRemainingSquaresAsPeriphery() {
        let periphery = [];
        this.clearPeripheryGrid();
        Grid.forWholeGrid(this, (x, y) => {
            if (this.isHiddenUnflagged(x, y)) {
                periphery.push({x: x, y: y, probability: 0.0});
                this.setPeripheryVal(x, y, 1);
            }
        });
        this.computeProbabilities(periphery);
        return [periphery];
    }

    noMoreFlags() {
        return this.numFlags() === 0;
    }

    getPeripheryVal(x, y) {
        if (this.isInBounds(x, y))
            return this.periphery[this.height() - y - 1][x];
    }

    setPeripheryVal(x, y, val) {
        if (this.isInBounds(x, y))
            return this.periphery[this.height() - y - 1][x] = val;
    }

    // square mutation functions
    isInBounds(x, y) {
        return x >= 0 && x < this.width() && y >= 0 && y < this.height();
    }

    getSquare(x, y) {
        if (this.isInBounds(x, y))
            return this.display[this.height() - y - 1][x];
    }

    setSquare(x, y, val) {
        if (this.isInBounds(x, y))
            this.display[this.height() - y - 1][x] = val;
    }

    getMasterSquare(x, y) {
        if (this.isInBounds(x, y))
            return this.master[this.height() - y - 1][x];
    }

    setMasterSquare(x, y, val) {
        if (this.isInBounds(x, y))
            this.master[this.height() - y - 1][x] = val;
    }

    incrementIndicator(x, y) {
        if (this.isIndicatorMaster(x, y) || this.isEmptyMaster(x, y))
            this.setMasterSquare(x, y, this.getMasterSquare(x, y) + 1);
    }

    // square info functions
    isEmptyMaster(x, y) {
        return this.getMasterSquare(x, y) === 0;
    }

    isIndicatorMaster(x, y) {
        return this.getMasterSquare(x, y) >= 1 && this.getMasterSquare(x, y) <= 8;
    }

    isMineMaster(x, y) {
        return this.getMasterSquare(x, y) === 100;
    }

    isMine(x, y) {
        return this.getSquare(x, y) === 100;
    }

    isIndicator(x, y) {
        return this.getSquare(x, y) >= 1 && this.getSquare(x, y) <= 8;
    }

    isHiddenUnflagged(x, y) {
        return this.isInBounds(x, y) && this.isHidden(x, y) && !this.isFlagged(x, y);
    }

    isHidden(x, y) {
        return !this.isVisible(x, y);
    }

    isFlagged(x, y) {
        return this.getSquare(x, y) === -2;
    }

    isVisible(x, y) {
        return this.getSquare(x, y) >= 0;
    }

    // grid properties functions
    width() {
        return this.options.width;
    }

    height() {
        return this.options.height;
    }

    numMines() {
        return this.options.mines;
    }

    numFlags() {
        return this.flags;
    }

    // helper functions
    static forEachNeighbor(x, y, fn) {
        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (!(i === x && j === y)) {
                    fn(i, j);
                }
            }
        }
    }

    static forEachInSquare(x, y, fn) {
        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                fn(i, j);
            }
        }
    }

    static forEachCrossNeighbor(x, y, fn) {
        fn(x + 1, y);
        fn(x, y - 1);
        fn(x - 1, y);
        fn(x, y + 1);
    }

    static forWholeGrid(grid, fn) {
        for (let i = 0; i < grid.width(); i++) {
            for (let j = 0; j < grid.height(); j++) {
                fn(i, j);
            }
        }
    }
}

let colorPicker = {
    '-2':  [233,  63,  51],
    '1':   [ 34,  74, 255],
    '2':   [ 62, 124,   6],
    '3':   [233,  63,  51],
    '4':   [ 11,  31, 123],
    '5':   [124,  29,  22],
    '6':   [ 55, 124, 123],
    '7':   [  0,   0,   0],
    '8':   [123, 123, 123],
    '100': [  0,   0,   0]
};

// game initialization
let grid;
let canvas;
let player = { isAI: true };
let gameOver = false;
let gameWin = false;

function setup() {
    newGame(Grid.INTERMEDIATE_GRID());
    canvas = createCanvas(WIDTH, HEIGHT);
    frameRate(60);
    textAlign(CENTER, CENTER);
}

function newGame(gridOptions) {
    grid = new Grid(gridOptions);
    WIDTH = grid.width() * SQUARE_WIDTH + 1;
    HEIGHT = grid.height() * SQUARE_WIDTH + 1;

    if (AUTOPLAY) {
        setInterval(performMove, 500);
    }
}

// rendering
function draw() {
    if(!thinking) {
        drawGrid();
        drawEndGame();
    }
}

function drawGrid() {
    stroke(127);
    for (let i = 0; i < grid.width(); i++) {
        for (let j = 0; j < grid.height(); j++) {
            drawGridSquare(i, j);
        }
    }
}

function drawEndGame() {
    if (gameOver) {
        textSize(70);
        fill(255, 128, 64);
        strokeJoin(ROUND);
        if (gameWin) {
            stroke(0);
            strokeWeight(12);
            text("WINNER!", 0, 0, WIDTH, HEIGHT);

            stroke(255);
            strokeWeight(8);
            text("WINNER!", 0, 0, WIDTH, HEIGHT);
            strokeWeight(1);
        } else {
            stroke(0);
            strokeWeight(12);
            text("GAME OVER!", 0, 0, WIDTH, HEIGHT);

            stroke(255);
            strokeWeight(8);
            text("GAME OVER!", 0, 0, WIDTH, HEIGHT);
            strokeWeight(1);
        }
    }
}

function drawGridSquare(x, y) {
    stroke(127);
    grid.isVisible(x, y)? fill(255): fill(0);
    if (grid.killerMine !== null && grid.killerMine.x === x && grid.killerMine.y === y)
        fill(255, 0, 0);
    rect(x * SQUARE_WIDTH, y * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);

    if (grid.getSquare(x, y) !== -1 && grid.getSquare(x, y) !== 0) {
        fill(...colorPicker[grid.getSquare(x, y)]);
        stroke(...colorPicker[grid.getSquare(x, y)]);
        textSize(14);
        drawSquareText(x, y);
    }

    drawDebugSquareInfo(x, y);
}

function drawDebugSquareInfo(x, y) {
    if (DEBUG && !grid.isEmptyMaster(x, y)) {
        fill(0, 255, 0);
        textSize(8);
        text(grid.getMasterSquare(x, y), x * SQUARE_WIDTH + SQUARE_WIDTH / 2, y * SQUARE_WIDTH, SQUARE_WIDTH / 2, SQUARE_WIDTH / 2);

        fill(233, 63, 51);
        text(x, x * SQUARE_WIDTH, y * SQUARE_WIDTH + SQUARE_WIDTH / 2, SQUARE_WIDTH / 2, SQUARE_WIDTH / 2);
        text(y, x * SQUARE_WIDTH + SQUARE_WIDTH / 2, y * SQUARE_WIDTH + SQUARE_WIDTH / 2, SQUARE_WIDTH / 2, SQUARE_WIDTH / 2);

        if (grid.getPeripheryVal(x, y) !== 0) {
            fill(255, 255, 0);
            textSize(8);
            text("\u2022", x * SQUARE_WIDTH, y * SQUARE_WIDTH, SQUARE_WIDTH / 2, SQUARE_WIDTH / 2);
        }
    }
}

function drawSquareText(x, y) {
    if (grid.isIndicator(x, y)) {
        text(grid.getSquare(x, y), x * SQUARE_WIDTH, y * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
    } else if (grid.isFlagged(x, y)) {
        textSize(18);
        text("\u2691", x * SQUARE_WIDTH + 3, y * SQUARE_WIDTH + 1, SQUARE_WIDTH, SQUARE_WIDTH);
    } else if (grid.isMine(x, y)) {
        text("\uD83D\uDCA3", x * SQUARE_WIDTH + 3, y * SQUARE_WIDTH + 2, SQUARE_WIDTH, SQUARE_WIDTH);
    }
}

// listeners
function mousePressed() {
    performMove();
}

function performMove() {
    if (!gameOver) {
        if (player.isAI) {
            performAIMove();
        } else {
            performHumanMove();
        }
    }
}

function performHumanMove() {
    let x = Math.floor(mouseX / SQUARE_WIDTH);
    let y = Math.floor(mouseY / SQUARE_WIDTH);
    if (mouseButton === LEFT) {
        grid.pop(x, y);
    } else if (mouseButton === RIGHT) {
        grid.flag(x, y);
    }
}

function performAIMove() {
    if(!thinking) {
        makeBestMove();
    }
}
