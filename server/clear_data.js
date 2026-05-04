const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses pembersihan data...');

  try {
    // Delete all records in order of foreign key constraints to prevent constraint errors
    const tradeRules = await prisma.tradeRule.deleteMany({});
    console.log(`Dihapus ${tradeRules.count} TradeRules`);
    
    const rules = await prisma.rule.deleteMany({});
    console.log(`Dihapus ${rules.count} Rules`);
    
    const scanners = await prisma.scanner.deleteMany({});
    console.log(`Dihapus ${scanners.count} Scanners`);
    
    const dailyLogs = await prisma.dailyTargetLog.deleteMany({});
    console.log(`Dihapus ${dailyLogs.count} DailyTargetLogs`);
    
    const targets = await prisma.target.deleteMany({});
    console.log(`Dihapus ${targets.count} Targets`);
    
    const transactions = await prisma.transaction.deleteMany({});
    console.log(`Dihapus ${transactions.count} Transactions`);
    
    const trades = await prisma.trade.deleteMany({});
    console.log(`Dihapus ${trades.count} Trades`);

    // Optional: if we want to wipe users too
    // const users = await prisma.user.deleteMany({});
    // console.log(`Dihapus ${users.count} Users`);
    console.log('\n[INFO] Tabel User tidak dihapus agar akses login Admin tetap terjaga.');

    console.log('\n✅ SELURUH DATA DUMMY BERHASIL DIBERSIHKAN!');
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
