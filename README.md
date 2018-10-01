# Minesweeper-AI

A performant AI for the popular game Minesweeper. The implementation of Minesweeper is my own.

The AI works by first employing a basic, logical approach and then, when that fails, a more complex, probabilistic approach.

## Basic Approach

This is the way that most humans play the game and it can be abstracted into two steps:
1. **Flag Step**: For any given numbered (1-8) sqaure on the grid, if the number of unflagged squares around the sqaure is eqaul to the number value of the square, then flag all neighboring, unflagged sqaures around the sqaure.
2. **Pop Step**: For any given numbered (1-8) square on the grid, if the number of flagged squares around the square is equal to the number value of the square, then pop all neighboring, unflagged squares around the square.

## Complex Approach

When the basic approach fails to find a move, we find the best move by doing a probabilistic search over possible mine configurations.
1. First, we extract all sets of periphery squares from the grid. 
   * I define a periphery as a chain of unflagged squares that are linked together by shared numbered squares and therfore depend probabilistically on one another.
   * Large peripheries are broken into smaller ones in order to boost performance
      * checking every permutation of possible mine configuarations is a ![expression](http://www.sciweavers.org/tex2img.php?eq=O%282%5En%29&bc=White&fc=Black&im=jpg&fs=12&ff=arev&edit=0) process, so we cannot use unreasonably large n
2. Over every permutation of possible mine configurations, increment the number of valid configuartions and, for every periphery square, tally the number of times it is a mine in a valid configuration.
3. For every periphery square, calculate its probability to be a mine by dividing its tally for being a bomb by the number of total valid configurations.
4. Go through every periphery square:
   * If the probability of the sqaure is 0%, pop it (it has a 0% chance to be a mine)
   * If the probability of the sqaure is 100%, flag it (it has a 100% chance to be a mine)
   * If there are no squares with either 100% or 0% probability, pop the periphery square with the smallest probability.
   
Using standard rules (mines distributed randomly, first click is always safe), my AI achieved the following win rates after 100 games:

|              |  Size | # Mines | Mine Density | Win Rate |
|:------------:|:-----:|:-------:|:------------:|:--------:|
| Beginner     |  9x9  |     9   |     12.3%    |   95.7%  |
| Intermediate | 16x16 |    40   |     15.6%    |   86.2%  |
| Expert       | 16x30 |    99   |     20.6%    |   49.1%  |
