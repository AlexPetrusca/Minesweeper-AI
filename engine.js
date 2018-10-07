/* Minesweeper Engine */
// Given a board at a specific instance, returns the best move

let thinking = false;

function makeRandomMove() {
    let x = Math.floor(Math.random() * grid.width());
    let y = Math.floor(Math.random() * grid.height());
    while (!grid.isHidden(x, y)) {
        x = Math.floor(Math.random() * grid.width());
        y = Math.floor(Math.random() * grid.width());
    }
    grid.pop(x, y);
}

function makeBasicSolverMove() {
    let moveMade = false;
    Grid.forWholeGrid(grid, (x, y) => {
        if (grid.isIndicator(x, y)) {
            let indi = grid.getSquare(x, y);
            if (indi === grid.numAdjacentSquares(x, y)) {
                moveMade |= grid.flagAdjacentSquares(x, y);
            } else if (indi === grid.numAdjacentFlags(x, y)) {
                moveMade |= grid.popAdjacentSquares(x, y);
            }
        }
    });
    return moveMade;
}

function makeTankSolverMove() {
    let bestMove = null;
    let min = 100;

    let peripheries;
    if (grid.numRemainingSquares() < 15) {
        peripheries = grid.getRemainingSquaresAsPeriphery();
    } else {
        peripheries = grid.getPeripheries();
    }

    logTankMoveStarted(peripheries);

    for (const periphery of peripheries) {
        for (const square of periphery) {
            if (square.probability === 0) {
                grid.pop(square.x, square.y);
                logPopMove(square);
            } else if (square.probability === 1) {
                grid.flag(square.x, square.y);
                logFlagMove(square);
            }

            if (square.probability <= min) {
                min = square.probability;
                bestMove = square;
            }
        }
    }

    logBestMove(bestMove);

    grid.pop(bestMove.x, bestMove.y);
}

function makeBestMove() {
    thinking = true;

    if (grid.firstPop) {
        makeRandomMove();
    } else if (!makeBasicSolverMove()) {
        if (grid.noMoreFlags()) {
            grid.popRemainingSquares();
        } else {
            makeTankSolverMove();
        }
    }

    thinking = false;
}

function logTankMoveStarted(peripheries) {
    if (DEBUG) {
        console.log("TANK MOVE: PERFORM - " + peripheries.length);
        console.log(grid);
        console.log(peripheries);
        console.log("");
        // saveCanvas(canvas, "myCanvas", "jpg");
    }
}

function logPopMove(square) {
    if (DEBUG) {
        if (grid.isMineMaster(square.x, square.y))
            console.log("ERROR ERROR ERROR ERROR ERROR");
        console.log("POP MOVE: x->" + square.x + " y->" + square.y);
    }
}

function logFlagMove(square) {
    if (DEBUG) {
        if (!grid.isMineMaster(square.x, square.y))
            console.log("ERROR ERROR ERROR ERROR ERROR");
        console.log("FLAG MOVE: x->" + square.x + " y->" + square.y);
    }
}

function logBestMove(bestMove) {
    if (DEBUG && bestMove.probability > 0) {
        console.log("BEST MOVE: x->" + bestMove.x + " y->" + bestMove.y + " prob->" + bestMove.probability);
        console.log("=========================================================");
        console.log("=========================================================");
        console.log("=========================================================");
    }
}
