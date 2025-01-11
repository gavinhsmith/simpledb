/** Config for the database. */
export type Config = {
  /** Enables sqlite3.verbose() and enables verbose logging throughout the module. Defaults to `false`.*/
  verbose: boolean;
};

/** The default config. */
const defaultConfig: Config = {
  verbose: false,
};

/**
 * Clean input config data to include any missing defaults.
 *
 * @param config - The config object to impose.
 * @returns A full and complete config module.
 */
export const parseConfig: (config?: Partial<Config>) => Config = (config) => {
  return {
    ...defaultConfig,
    ...config,
  };
};
