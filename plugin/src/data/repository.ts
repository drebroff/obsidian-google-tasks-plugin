export interface RepositoryItem<Id> {
  id: Id;
  title: string;
  isDeleted?: boolean;
}

export interface RepositoryReader<T, U> {
  byId(id: T): U | undefined;
  byTitle(title: string): U | undefined;
  iter(): IterableIterator<U>;
  iterActive(): IterableIterator<U>;
}

export interface RepositoryWriter<U> {
  applyDiff(changed: U[]): void;
  replaceAll(items: U[]): void;
}

export class Repository<T, U extends RepositoryItem<T>>
  implements RepositoryReader<T, U>, RepositoryWriter<U>
{
  private readonly data: Map<T, U> = new Map();

  public replaceAll(items: U[]): void {
    this.data.clear();
    for (const item of items) {
      if (!item.isDeleted) {
        this.data.set(item.id, item);
      }
    }
  }

  public applyDiff(changed: U[]): void {
    for (const item of changed) {
      if (item.isDeleted) {
        this.data.delete(item.id);
        continue;
      }
      this.data.set(item.id, item);
    }
  }

  public byId(id: T): U | undefined {
    return this.data.get(id);
  }

  public byTitle(title: string): U | undefined {
    const lower = title.toLowerCase();
    for (const item of this.iter()) {
      if (item.title.toLowerCase() === lower) {
        return item;
      }
    }
    return undefined;
  }

  public iter(): IterableIterator<U> {
    return this.data.values();
  }

  public *iterActive(): IterableIterator<U> {
    for (const item of this.data.values()) {
      if (!item.isDeleted) {
        yield item;
      }
    }
  }
}
