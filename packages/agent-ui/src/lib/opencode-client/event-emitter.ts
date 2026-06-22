/* eslint-disable @typescript-eslint/no-explicit-any */

type Listener = (...args: any[]) => void;

export class EventEmitter<Events> {
  private listeners = new Map<keyof Events, Set<Listener>>();

  on<E extends keyof Events>(event: E, listener: (...args: Events[E] extends unknown[] ? Events[E] : never) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);
  }

  off<E extends keyof Events>(event: E, listener: (...args: Events[E] extends unknown[] ? Events[E] : never) => void): void {
    this.listeners.get(event)?.delete(listener as Listener);
  }

  emit<E extends keyof Events>(event: E, ...args: Events[E] extends unknown[] ? Events[E] : never): void {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }

  removeAll(): void {
    this.listeners.clear();
  }
}