const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const user = await prisma.user.upsert({
    where: { email: 'admin@journey.com' },
    update: {},
    create: {
      name: 'Admin Trader',
      email: 'admin@journey.com',
      password: hashedPassword,
    },
  });

  console.log('User created:', user.email);
  
  // Create some initial transactions and trades to populate the dashboard
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'DEPOSIT',
      amount: 1000,
      note: 'Initial Deposit',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.trade.create({
    data: {
      userId: user.id,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      pair: 'BTC/USDT',
      direction: 'LONG',
      entryPrice: 60000,
      stopLoss: 59000,
      takeProfit: 62000,
      size: 100,
      pnl: 50,
      pnlPercent: 50,
      isRuleViolated: false
    }
  });

  await prisma.trade.create({
    data: {
      userId: user.id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      pair: 'ETH/USDT',
      direction: 'SHORT',
      entryPrice: 3000,
      stopLoss: 3100,
      takeProfit: 2800,
      size: 50,
      pnl: -20,
      pnlPercent: -40,
      isRuleViolated: true
    }
  });

  await prisma.trade.create({
    data: {
      userId: user.id,
      date: new Date(),
      pair: 'SOL/USDT',
      direction: 'LONG',
      entryPrice: 150,
      stopLoss: 140,
      takeProfit: 170,
      size: 200,
      pnl: 100,
      pnlPercent: 50,
      isRuleViolated: false
    }
  });

  console.log('Seed data successfully added. You can now login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
