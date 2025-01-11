import type { DataType, Primative, SQLType } from "./convert";

/** A table entry. */
export type TableEntry = {
  [key: string]: Primative<SQLType>;
};

/** An array of keys of an entry. */
export type TableEntryKeys<T extends TableEntry> = (keyof T)[] | [];

/** A table entry with content restricted by K. Allows all entries through if K is null. Should always be applied with a processed table entry. */
export type RestrictedTableEntry<
  T extends TableEntry,
  K extends TableEntryKeys<T>,
> = {
  [Prop in keyof T as Prop extends (K extends [] ? never : K[number])
    ? Prop
    : never]: ProcessedTableEntry<T>[Prop];
};

/** Properly stringified table entries. */
export type SQLSafeTableEntry<T extends TableEntry> = {
  [Prop in keyof T]: string;
};

/** A table entry where all runtime items were processed to a value. */
export type ProcessedTableEntry<T extends TableEntry> = {
  [Prop in keyof T]: T[Prop] extends (...args: unknown[]) => unknown
    ? ReturnType<T[Prop]>
    : T[Prop];
};

/** Table columns and their type. */
export type TableColumns<T extends TableEntry> = {
  [Prop in keyof T as string]: DataType;
};

/** Filter methods. */
export type FilterFunction<T> = "ALL" | ((value: T) => boolean);
