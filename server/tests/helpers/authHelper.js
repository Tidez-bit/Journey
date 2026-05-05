const prisma = require('../../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Create a test user
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User',
    ...userData
  };

  const hashedPassword = await bcrypt.hash(defaultData.password, 10);

  const user = await prisma.user.create({
    data: {
      email: defaultData.email,
      password: hashedPassword,
      name: defaultData.name
    }
  });

  return {
    user,
    plainPassword: defaultData.password
  };
}

/**
 * Generate JWT token for a user
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}

/**
 * Create test user and return with token
 */
async function createAuthenticatedUser(userData = {}) {
  const { user, plainPassword } = await createTestUser(userData);
  const token = generateToken(user.id);

  return {
    user,
    token,
    plainPassword
  };
}

/**
 * Delete test user by ID
 */
async function deleteTestUser(userId) {
  // Delete related data first (due to foreign keys)
  await prisma.trade.deleteMany({ where: { userId } });
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.target.deleteMany({ where: { userId } });
  await prisma.rule.deleteMany({ where: { userId } });
  await prisma.scanner.deleteMany({ where: { userId } });
  await prisma.dailyLog.deleteMany({ where: { userId } });
  
  // Delete user
  await prisma.user.delete({ where: { id: userId } });
}

/**
 * Delete test user by email
 */
async function deleteTestUserByEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await deleteTestUser(user.id);
  }
}

module.exports = {
  createTestUser,
  generateToken,
  createAuthenticatedUser,
  deleteTestUser,
  deleteTestUserByEmail
};
