'use strict';

// In-memory stand-in for the parts of the Redis client we use.
class FakeRedis {
  constructor({ failOnExec = false } = {}) {
    this.store = new Map();
    this.transactions = 0;
    this.failOnExec = failOnExec;
  }

  multi() {
    const queued = [];
    const tx = {
      set: (key, value) => {
        queued.push([key, value]);
        return tx;
      },
      exec: async () => {
        if (this.failOnExec) throw new Error('EXEC failed');
        for (const [k, v] of queued) this.store.set(k, v);
        this.transactions++;
        return queued.map(() => 'OK');
      },
    };
    return tx;
  }
}

module.exports = { FakeRedis };
