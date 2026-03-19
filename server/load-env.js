const dotenv = require('dotenv');
const { getServerEnvCandidates } = require('../scripts/env-paths');

for (const envPath of getServerEnvCandidates()) {
  dotenv.config({ path: envPath, override: false });
}
