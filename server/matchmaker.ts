import { v4 as uuidv4 } from "uuid";

export interface QueueEntry {
  playerId: string;
  username: string;
  socketId: string;
  joinedAt: number;
}

export interface MatchResult {
  roomId:  string;
  player1: QueueEntry;
  player2: QueueEntry;
}

export class Matchmaker {
  private queue: QueueEntry[] = [];

  enqueue(entry: QueueEntry): number {
    // Guard against duplicates
    if (!this.queue.find((e) => e.playerId === entry.playerId)) {
      this.queue.push(entry);
    }
    return this.queue.findIndex((e) => e.playerId === entry.playerId) + 1;
  }

  dequeue(playerId: string): void {
    this.queue = this.queue.filter((e) => e.playerId !== playerId);
  }

  tryMatch(): MatchResult | null {
    if (this.queue.length < 2) return null;

    const [player1, player2] = this.queue.splice(0, 2);
    return {
      roomId: uuidv4(),
      player1,
      player2,
    };
  }

  getPosition(playerId: string): number {
    const idx = this.queue.findIndex((e) => e.playerId === playerId);
    return idx === -1 ? -1 : idx + 1;
  }

  size(): number {
    return this.queue.length;
  }

  /** Update socketId for a reconnecting player who is still in queue */
  updateSocket(playerId: string, socketId: string): boolean {
    const entry = this.queue.find((e) => e.playerId === playerId);
    if (entry) {
      entry.socketId = socketId;
      return true;
    }
    return false;
  }
}
