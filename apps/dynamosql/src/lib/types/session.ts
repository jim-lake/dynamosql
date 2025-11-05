export interface Session {
  getCurrentDatabase(): string | null;
  setCurrentDatabase(database: string, done?: () => void): void;
  getVariable(name: string): any;
  setVariable(name: string, value: any): void;
  getTransaction(): any;
  setTransaction(tx: any): void;
  getTempTable(database: string, table: string): any;
  saveTempTable(database: string, table: string, contents: any): void;
  deleteTempTable(database: string, table: string): void;
  dropTempTable(database: string, table?: string): void;
  getTempTableList(): [string, any][];
}
