/** Different data types for the Database. */
export enum DataType {
  NULL = "NULL",
  INT = "INTENGER",
  FLOAT = "REAL",
  STRING = "TEXT",
  BOOLEAN = "CHAR(1)",
  BLOB = "BLOB",
}

export interface TableColumnSettings {
  name: string;
  type: DataType;
  isPrimaryKey?: boolean;
}

/**
 * Convert a value to a defined type.
 * @param content The content.
 * @param oldType The content's old type.
 * @param newType The new type.
 * @returns A value representing content with the new type.
 */
export function convertToType(
  content: any,
  oldType: DataType,
  newType: DataType
): any {
  if (newType === oldType || newType === DataType.BLOB) {
    return content;
  } else if (newType === DataType.NULL) {
    return null;
  } else if (newType === DataType.STRING) {
    return new String(content);
  } else if (newType === DataType.INT) {
    switch (oldType) {
      case DataType.NULL:
        return 0;
      case DataType.FLOAT:
        return Math.round(content);
      case DataType.STRING:
        return new Number(content);
      case DataType.BLOB:
        return new Number(content);
    }
  } else if (newType === DataType.FLOAT) {
    switch (oldType) {
      case DataType.NULL:
        return 0;
      case DataType.INT:
        return content;
      case DataType.STRING:
        return new Number(content);
      case DataType.BLOB:
        return new Number(content);
    }
  }
}
