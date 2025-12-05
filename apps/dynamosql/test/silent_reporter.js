class OneLineSummaryReporter {
  constructor(runner) {
    this.passes = 0;
    this.failures = 0;
    this.currentSuites = [];
    this.printedStart = false;
    this.suiteIndex = -1;
    this.suiteList = [];
    this.printedStart = false;

    runner.on('suite', (suite) => {
      if (suite.title) {
        this.currentSuites.push(suite.title);
        this.suiteIndex++;
        const title = this.currentSuites.join(' > ');
        this.suiteList.push({ title, total: 0, failList: [] });
        this.printedStart = false;
      }
    });

    runner.on('suite end', () => {
      const suite = this.suiteList[this.suiteIndex];
      const fails = suite.failList.length;
      const total = suite.total;
      if (this.printedStart) {
        if (fails > 0) {
          console.log(`: ❌ ${fails}/${total} FAILED`);
        } else {
          console.log(`: ✅ ${total} PASS`);
        }
      }
      this.currentSuites.pop();
      this.printedStart = false;
    });

    runner.on('pass', () => {
      this._maybePrintStart();
      const old_count = this.suiteList[this.suiteIndex].total;
      this.suiteList[this.suiteIndex].total++;
      this.passes += 1;
      if (process.stdout.isTTY) {
        if (old_count > 0) {
          process.stdout.write('\b'.repeat(String(old_count).length));
        }
        process.stdout.write(String(old_count + 1));
      }
    });
    runner.on('fail', (test, err) => {
      this._maybePrintStart();
      this.suiteList[this.suiteIndex].total++;
      this.suiteList[this.suiteIndex].failList.push({ test, err });
      this.failures += 1;
      const title = this.currentSuites.join(' > ');
      console.log(`\n❌ ${title} > ${test.fullTitle()}`);
    });
    runner.once('end', () => {
      console.log(`\n${this.passes} passed, ${this.failures} failed`);
      for (const suite of this.suiteList) {
        const fails = suite.failList.length;
        if (fails > 0) {
          console.log(`Suite: ${suite.title}: ${fails}/${suite.total} FAILED`);
          for (const fail of suite.failList) {
            console.log(fail.test.fullTitle());
            console.log(fail.err, fail.err.stack);
            console.log('');
          }
          console.log('');
        }
      }
    });
  }
  _maybePrintStart() {
    if (!this.printedStart) {
      this.printedStart = true;
      const prefix = this.currentSuites.join(' > ');
      process.stdout.write(`${prefix}: `);
    }
  }
}
module.exports = OneLineSummaryReporter;
