import * as Engine from './engine';

class Transaction {
  _dataMap = new Map();
  _isAutoCommit: boolean;

  constructor(auto_commit: any) {
    this._isAutoCommit = Boolean(auto_commit);
  }

  isAutoCommit() {
    return this._isAutoCommit;
  }

  getEngineNameList() {
    return this._dataMap.keys();
  }

  getData(name: string) {
    return this._dataMap.get(name);
  }

  setData(name: string, data: any) {
    this._dataMap.set(name, data);
  }
}

export async function run(params: any): Promise<any> {
  const { dynamodb, session, func } = params;

  startTransaction({ session, auto_commit: true });
  const tx = session.getTransaction();
  params.transaction = tx;

  try {
    const result = await func(params);
    if (tx.isAutoCommit()) {
      await commit({ dynamodb, session });
    }
    return result;
  } catch (err) {
    if (tx.isAutoCommit()) {
      await rollback({ dynamodb, session });
    }
    throw err;
  }
}

export function startTransaction(params: any): void {
  const { session, auto_commit } = params;
  const existing = session.getTransaction();
  if (!existing) {
    const tx = new Transaction(auto_commit);
    session.setTransaction(tx);
  }
}

export async function commit(params: any): Promise<void> {
  await _txEach(params, async ({ engine, ...other }: any) => {
    await engine.commit(other);
  });
}

export async function rollback(params: any): Promise<void> {
  await _txEach(params, async ({ engine, ...other }: any) => {
    await engine.rollback(other);
  });
}

async function _txEach(params: any, callback: any) {
  const { dynamodb, session } = params;
  const transaction = session.getTransaction();
  if (transaction) {
    const list = Array.from(transaction.getEngineNameList()) as string[];
    for (const name of list) {
      const engine = Engine.getEngineByName(name);
      const data = transaction.getData(name);
      await callback({ engine, dynamodb, session, transaction, data });
    }
    session.setTransaction(null);
  }
}
