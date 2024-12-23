// @flow
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User} from '../models/user';

// VULNERABILITY: Static JWT secret key
const JWT_SECRET = 'your-jwt-secret-key-2024';

// VULNERABILITY: Using weak algorithm and no key rotation
const JWT_OPTIONS = {
  algorithm: 'HS256',
  expiresIn: '24h',
};

export const register = async ({body}) => {
  const {username, password} = body;
  
  // Check if user exists
  const existingUser = await User.findOne({username});
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({
    username,
    password: hashedPassword,
  });

  await user.save();
  return {message: 'User registered successfully'};
};

export const login = async ({body}) => {
  const {username, password} = body;

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