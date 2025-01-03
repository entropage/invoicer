// @flow
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {Buffer} from 'buffer';
import {User} from '../models/user';

// Make Buffer available globally for JWT
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// VULNERABILITY: Static JWT secret key
const JWT_SECRET = 'your-jwt-secret-key-2024';

// VULNERABILITY: Using weak algorithm and no key rotation
const JWT_OPTIONS = {
  algorithm: 'HS256',
  expiresIn: '24h',
};

export const register = async (ctx) => {
  const {username, password} = ctx.request.body;
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  
  // Check if user exists
  const existingUser = await User.findOne({username});
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = new User({
    username,
    password: hashedPassword,
  });

  await user.save();
  return {message: 'User registered successfully'};
};

export const login = async (ctx) => {
  const {username, password} = ctx.request.body;
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  // Find user
  const user = await User.findOne({username});
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // VULNERABILITY: Using static key to sign token with user data
  const token = jwt.sign({
    id: user._id,
    username: user.username,
    role: user.role,
  }, JWT_SECRET, JWT_OPTIONS);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
    },
  };
};

export const verifyToken = async (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  // VULNERABILITY: Using static key to verify token
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded) {
    throw new Error('Invalid token');
  }

  return decoded;
}; 