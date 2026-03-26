const capabilityState = {
  promise: null,
};

async function loadCapabilities(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('kuji_players', 'point_transactions')
  `);

  const columnSet = new Set(
    rows.map((row) => `${row.table_name}.${row.column_name}`)
  );

  return {
    kujiPlayerHasRole: columnSet.has('kuji_players.role'),
    kujiPlayerHasLastLoginAt: columnSet.has('kuji_players.last_login_at'),
    hasPointTransactions: rows.some((row) => row.table_name === 'point_transactions'),
  };
}

async function getDbCapabilities(prisma) {
  if (!capabilityState.promise) {
    capabilityState.promise = loadCapabilities(prisma).catch((error) => {
      capabilityState.promise = null;
      throw error;
    });
  }
  return capabilityState.promise;
}

module.exports = {
  getDbCapabilities,
};
