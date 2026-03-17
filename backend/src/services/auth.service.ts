import User, { IUser } from '../models/User.model';
import { generateToken } from '../utils/jwt';

export async function registerDriver(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user: IUser; token: string }> {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: 'driver',
    status: 'under_review',
    onboardingStep: 0,
  });

  const token = generateToken({ userId: user._id.toString(), role: 'driver' });
  return { user, token };
}

export async function loginUser(emailOrPhone: string, password: string): Promise<{ user: IUser; token: string }> {
  const user = await User.findOne({
    $or: [
      { email: emailOrPhone.toLowerCase() },
      { phone: emailOrPhone },
    ],
  }).select('+password');

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const token = generateToken({ userId: user._id.toString(), role: user.role });
  return { user, token };
}
