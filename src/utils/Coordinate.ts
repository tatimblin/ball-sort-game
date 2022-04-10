class Coordinate {
  x: number;
  y: number | null;
  hasY: boolean
  key: string;

  constructor(x: number, y?: number) {
    this.x = x;
    this.y = y ?? null;
    this.hasY = !!y || y === 0;
    this.key = this.hasY ? `x${x}y${y}` : `x${x}`;
  }

  setXY(x: number, y?: number) {
    this.x = x;
    this.y = y ?? null;
    this.hasY = !!y || y === 0;
    this.key = this.hasY ? `x${this.x}y${this.y}` : `x${this.x}`;
  }

  setX(x: number) {
    this.x = x;
    this.key = this.hasY ? `x${x}y${this.y}` : `x${x}`;
  }

  setY(y: number) {
    this.y = y;
    this.hasY = true;
    this.key = `x${this.x}y${y}`;
  }
}

export {
  Coordinate,
}
