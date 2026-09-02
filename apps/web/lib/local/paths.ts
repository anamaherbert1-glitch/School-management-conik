export const CONIK_ROOT = 'C:\\CONIK';

export const CONIK_PATHS = {
  root: CONIK_ROOT,
  database: `${CONIK_ROOT}\\data\\conik.db`,
  documents: {
    students: `${CONIK_ROOT}\\documents\\students`,
    teachers: `${CONIK_ROOT}\\documents\\teachers`,
    admissions: `${CONIK_ROOT}\\documents\\admissions`,
    administrative: `${CONIK_ROOT}\\documents\\administrative`,
  },
  generated: {
    bulletins: `${CONIK_ROOT}\\generated\\bulletins`,
    transcripts: `${CONIK_ROOT}\\generated\\transcripts`,
    certificates: `${CONIK_ROOT}\\generated\\certificates`,
    receipts: `${CONIK_ROOT}\\generated\\receipts`,
    reports: `${CONIK_ROOT}\\generated\\reports`,
  },
  backups: {
    automatic: `${CONIK_ROOT}\\backups\\automatic`,
    manual: `${CONIK_ROOT}\\backups\\manual`,
  },
  logs: `${CONIK_ROOT}\\logs`,
} as const;
