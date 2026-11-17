import fs from 'node:fs';
import path from 'node:path';

export function incVersion(params) {
  return {
    name: 'rollup-plugin-inc-version',
    buildStart() {
      const pkgPath =
        params?.pkgPath ?? path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

      const [major, minor, patch] = pkg.version.split('.').map(Number);
      const newVersion = `${major}.${minor}.${patch + 1}`;

      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
      console.log(`Bumped package.json patch version to ${newVersion}`);
    },
  };
}
