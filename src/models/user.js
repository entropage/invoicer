// @flow
import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema({
  theme: String,
  language: String,
  notifications: Boolean,
  currency: String
}, { _id: false });

const userProfileSchema = new mongoose.Schema({
  phoneNumber: String,
  address: String,
  taxId: String,
  companyName: String,
  bankDetails: String,
  sensitiveNotes: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profile: userProfileSchema,
  preferences: userPreferencesSchema,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model('User', userSchema); 