export type LocalRole =
  | 'super_admin'
  | 'school_admin'
  | 'secretary'
  | 'accountant'
  | 'teacher'
  | 'student'
  | 'parent';

export interface Institution {
  id: string;
  name: string;
  slug: string;
  countryCode: string;
  timezone: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoPath?: string;
  academicYearLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: LocalRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Repository<T, ID = string> {
  getById(id: ID): Promise<T | null>;
  list(): Promise<T[]>;
}

export interface WritableRepository<T, CreateInput, UpdateInput = Partial<CreateInput>>
  extends Repository<T> {
  create(input: CreateInput): Promise<T>;
  update(id: string, input: UpdateInput): Promise<T>;
}

export interface InstitutionRepository
  extends WritableRepository<Institution, Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>> {}

export interface LocalUserRepository
  extends WritableRepository<LocalUser, Omit<LocalUser, 'id' | 'createdAt' | 'updatedAt'>> {
  getByUsername(username: string): Promise<LocalUser | null>;
}

export interface LocalDatabase {
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
