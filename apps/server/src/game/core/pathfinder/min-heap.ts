export interface HeapNode {
  f: number;
  g: number;
  h: number;
  r: number;
  c: number;
  parentKey: number;
}

/**
 * High performance Array-backed binary Min-Heap for A* OpenSet extraction.
 * Replaces O(n) array scanning with O(log n) insertions & extractions.
 */
export class MinHeap<T extends { f: number }> {
  private data: T[] = [];

  get size(): number { 
      return this.data.length; 
  }

  push(node: T): void {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[p].f <= this.data[i].f) break;
      [this.data[p], this.data[i]] = [this.data[i], this.data[p]];
      i = p;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[min].f) min = l;
      if (r < n && this.data[r].f < this.data[min].f) min = r;
      if (min === i) break;
      [this.data[min], this.data[i]] = [this.data[i], this.data[min]];
      i = min;
    }
  }
}
