const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      const err = new Error('Please provide all fields');
      err.statusCode = 400;
      return next(err);
    }

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      const err = new Error('User already exists');
      err.statusCode = 400;
      return next(err);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      const err = new Error('Invalid user data');
      err.statusCode = 400;
      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error('Please provide email and password');
      err.statusCode = 400;
      return next(err);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
