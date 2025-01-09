/** Config for the database. */
export interface Config {
  /** Enables sqlite3.verbose() and enables verbose logging throughout the module. Defaults to `false`.*/
  verbose: boolean;
}

/** The default config. */
const DEFAULT_CONFIG: Config = {
  verbose: false,
};

/**
 * Clean input config data to include any missing defaults.
 * @param config The config object to impose.
 * @returns A full and complete config module.
 */
export function parseConfig(config: Partial<Config> = {}): Config {
  return { ...DEFAULT_CONFIG, ...config };
}
