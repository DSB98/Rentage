import { UserRole } from './enums';

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUserProfile {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface IUserWithProfile extends IUser {
  profile: IUserProfile | null;
}
