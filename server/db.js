try {
  const path = require('path');
  const dotenv = require('dotenv');

  dotenv.config({ path: path.resolve(__dirname, '.env') });
  dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
