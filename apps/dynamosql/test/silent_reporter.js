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
      const suite = this.suiteList[this.suiteIndex];
      this.passes += 1;
      if (suite) {
        const old_count = suite.total;
        suite.total++;
        if (process.stdout.isTTY) {
          if (old_count > 0) {
            process.stdout.write('\b'.repeat(String(old_count).length));
          }
          process.stdout.write(String(old_count + 1));
        }
      }
    });
    runner.on('fail', (test, err) => {
      this._maybePrintStart();
      this.failures += 1;
      const suite = this.suiteList[this.suiteIndex];
      if (suite) {
        suite.total++;
        suite.failList.push({ test, err });
        const title = this.currentSuites.join(' > ');
        console.log(`\n❌ ${title} > ${test.fullTitle()}`);
      } else {
        console.log(`\n❌ ${test.fullTitle()}`);
      }
    });
    runner.once('end', () => {
      console.log(`\n${this.passes} passed, ${this.failures} failed`);
      for (const suite of this.suiteList) {
        const fails = suite.failList.length;
        if (fails > 0) {
          console.log(`Suite: ${suite.title}: ${fails}/${suite.total} FAILED`);
          for (const fail of suite.failList) {
            console.log(fail.test.fullTitle());
            console.log(fail.err);
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
