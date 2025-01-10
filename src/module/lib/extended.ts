/** An object containing extended type references. */
export type ExtendedTypeList = {
  [key: string]: ExtendedType;
};

export type ExtendedSetFunction = () => unknown;
export type ExtendedGetFunction = (value: unknown) => unknown;

/** A value that is generated/loaded when placed in the table. */
export class ExtendedType {
  /** A extended type for storing dates. */
  public static DATES = new ExtendedType(
    () => {
      return new Date().toISOString();
    },
    (value: unknown) => {
      return new Date(<string>value);
    }
  );

  /**
   * Function that resolves into the data.
   * @returns The value that will be entered into the database.
   */
  public set: ExtendedSetFunction;
  /**
   * Function that converts the database value back into the source type.
   * @param value The raw value returned from the database.
   * @returns The value returned to its original state.
   */
  public get: ExtendedGetFunction;

  /**
   * @param set Function that resolves into the data.
   * @param get Function that converts the database value back into the source type.
   */
  constructor(set: ExtendedSetFunction, get: ExtendedGetFunction) {
    this.set = set;
    this.get = get;
  }
}

export default ExtendedType;
