class OneLineSummaryReporter {
  constructor(runner) {
    this.passes = 0;
    this.failures = 0;
    this.currentSuites = [];
    this.printedStart = false;

    runner.on('suite', (suite) => {
      if (suite.title) {
        this.currentSuites.push(suite.title);
        this.printedStart = false;
      }
    });

    runner.on('suite end', () => {
      this.currentSuites.pop();
    });

    runner.on('pass', () => {
      this.passes += 1;
      this._maybePrintStart();
      process.stdout.write('+');
    });
    runner.on('fail', (test, err) => {
      this.failures += 1;
      this._maybePrintStart();
      const prefix = this.currentSuites.join(' > ');
      console.log(`\n✖ ${prefix} > ${test.fullTitle()}`);
      console.log(err.stack ?? err.message ?? err);
    });
    runner.once('end', () => {
      console.log(`\n${this.passes} passed, ${this.failures} failed`);
    });
  }
  _maybePrintStart() {
    if (!this.printedStart) {
      this.printedStart = true;
      const prefix = this.currentSuites.join(' > ');
      console.log(`\n${prefix}`);
    }
  }
}
module.exports = OneLineSummaryReporter;
