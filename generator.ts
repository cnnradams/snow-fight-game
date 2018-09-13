enum Direction {
    North = 1,
    East = 2,
    South = 3,
    West = 4
}

export default class Generator {
    private floorPositions = new Array<Position>();
    private sober = false;
    constructor(private width: number, private height: number,
        private percentFill: number, private tunnelPercent: number) { }

    generate() {
        this.floorPositions = new Array<Position>();
        let clearedTiles = 10;
        const sz = this.width * this.height;
        const p = this.percentFill / 100.0;
        const requiredTiles = Math.round(sz * p);
        const maxSteps = requiredTiles * 10;
        let location = this.getRandomCenter(5);
        let direction = this.turn(location, -1);
        let steps = this.think(-1, location, direction);
        let panicSteps = 0;
        while (clearedTiles < requiredTiles) {
            if (!this.contains(location)) {
                this.floorPositions.push(new Position(location.x, location.y));
            }
            clearedTiles++;

            steps = this.think(steps, location, direction);

            if (this.sober) {
                if (this.getEdgeDirection(location) != -1) this.sober = false;
            }
            if (!this.sober) {
                direction = this.turn(location, direction);
            }

            location = this.move(location, direction);

            if (location.x < 1) location.x++;
            else if (location.x >= this.width - 1) location.x--;

            if (location.y < 1) location.y++;
            else if (location.y >= this.height - 1) location.y--;

            panicSteps++;
            if (panicSteps > maxSteps) {
                console.error("Panic exit on mapgen!");
                break;
            }
        }
        return this.floorPositions;
    }

    private move(location: Position, direction: Direction): Position {
        switch (direction) {
            case Direction.North: location.y -= 1; break;
            case Direction.South: location.y += 1; break;
            case Direction.East: location.x += 1; break;
            case Direction.West: location.x -= 1; break;
        }
        return location;
    }

    private turn(location: Position, direction: Direction): Direction {
        let newDir;
        do {
            newDir = this.getRandomDirection();
        } while (newDir === direction);
        const sd = this.getEdgeDirection(location);
        if (sd != -1 && this.flipCoin()) newDir = sd;
        return newDir;
    }

    private think(steps: number, location: Position, direction: Direction): number {
        if (steps <= 0) {
            if (this.soberUp(location, direction) && this.sometimes()) {
                this.sober = true;
                steps = this.getRandomInt(5, 10);
            } else {
                this.sober = false;
                steps = this.getRandomInt(20, 30);
            }
        } else {
            steps--;
        }
        return steps;
    }

    private soberUp(location: Position, direction: Direction) {
        if (this.getEdgeDirection(location) != -1) return false;

        const r = new Rectangle(location.x - 4, location.y - 4, 9, 9);

        switch (direction) {
            case Direction.North: r.y -= 4; break;
            case Direction.South: r.y += 4; break;
            case Direction.West: r.x -= 4; break;
            case Direction.East: r.x += 4; break;
            default: break;
        }
        const minAmount = Math.round(r.getSize() / 4);
        let a = 0;

        const c = new Position(r.x, r.y);
        for (; c.y <= r.y + r.height; c.y++) {
            for (; c.x <= r.x + r.width; c.x++) {
                if (!this.inMap(c)) return false;
                if (this.contains(c)) a++;
                if (a > minAmount) return false;
            }
        }
        return true;
    }

    private contains(c: Position) {
        return this.floorPositions.some((position: Position) => {
            if (position.x === c.x && position.y === c.y) {
                return true;
            }
            return false;
        });
    }
    private getEdgeDirection(location: Position) {
        const edgeSize = 5;
        let sd = -1;
        if (location.y < edgeSize) sd = Direction.South;
        else if (location.y > this.height - edgeSize) sd = Direction.North;

        if (location.x < edgeSize) sd = Direction.East;
        if (location.x > this.width - edgeSize) sd = Direction.West;

        return sd;
    }

    private getRandomDirection(): Direction {
        return this.getRandomInt(1, 4);
    }
    private getRandomCenter(distance: number): Position {
        return new Position(
            Math.round(this.width / 2.0) + this.getRandomInt(-distance, distance),
            Math.round(this.height / 2.0) + this.getRandomInt(-distance, distance));
    }

    private getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    private flipCoin(): boolean {
        return Math.random() > 0.5;
    }
    private inMap(c: Position): boolean {
        return (c.x < this.width && c.x > 0 && c.y < this.height && c.y > 0);
    }
    private sometimes() {
        return Math.random() < (this.tunnelPercent / 100.0)
    }
}

class Position {
    constructor(public x: number, public y: number) { }
}

class Rectangle {
    constructor(public x: number, public y: number, public width: number, public height: number) { }
    getSize(): number {
        return this.width * this.height;
    }
}