// Database Enums - centralized enum definitions and validation
export const UserRoles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES_REP: 'SALES_REP'
} as const;

export const AccountStatuses = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

export const AccountTypes = {
  LEAD: 'Lead',
  PROSPECT: 'Prospect',
  CLIENT: 'Client'
} as const;

export const BusinessStages = {
  PROSPECTING: 'Prospecting',
  QUALIFICATION: 'Qualification',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost'
} as const;

export const Currencies = {
  BRL: 'BRL',
  USD: 'USD',
  EUR: 'EUR'
} as const;

// Type definitions derived from enums
export type UserRole = typeof UserRoles[keyof typeof UserRoles];
export type AccountStatus = typeof AccountStatuses[keyof typeof AccountStatuses];
export type AccountType = typeof AccountTypes[keyof typeof AccountTypes];
export type BusinessStage = typeof BusinessStages[keyof typeof BusinessStages];
export type Currency = typeof Currencies[keyof typeof Currencies];

// Validation helper functions
export const isValidUserRole = (value: string): value is UserRole => {
  return Object.values(UserRoles).includes(value as UserRole);
};

export const isValidAccountStatus = (value: string): value is AccountStatus => {
  return Object.values(AccountStatuses).includes(value as AccountStatus);
};

export const isValidAccountType = (value: string): value is AccountType => {
  return Object.values(AccountTypes).includes(value as AccountType);
};

export const isValidBusinessStage = (value: string): value is BusinessStage => {
  return Object.values(BusinessStages).includes(value as BusinessStage);
};

export const isValidCurrency = (value: string): value is Currency => {
  return Object.values(Currencies).includes(value as Currency);
};

// User Interface (Database representation - snake_case)
export interface UserDB {
  id: string;
  name: string;
  role: string;
  manager_id?: string;
  email: string;
  created_at: string;
}

// User Interface (API representation - camelCase)
export interface User {
  id: string;
  name: string;
  role: string;
  managerId?: string;
  email: string;
  createdAt: string;
}

// Account Interface (Database representation - snake_case)
export interface AccountDB {
  id: string;
  name: string;
  segment: string;
  responsible_id: string;
  status: string;
  type: string;
  pipeline: string;
  last_interaction: string;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  created_at: string;
}

// Account Interface (API representation - camelCase)
export interface Account {
  id: string;
  name: string;
  segment: string;
  responsibleId: string;
  status: string;
  type: string;
  pipeline: string;
  lastInteraction: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  createdAt: string;
}

// Business Interface (Database representation - snake_case)
export interface BusinessDB {
  id: string;
  title: string;
  account_id: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  owner_id?: string;
  closing_date?: string;
  created_at: string;
}

// Business Interface (API representation - camelCase)
export interface Business {
  id: string;
  title: string;
  accountId: string;
  value: number;
  currency: string;
  stage: string;
  probability?: number;
  ownerId?: string;
  closingDate?: string;
  createdAt: string;
}

// Token Cache Interface
export interface TokenCache {
  token: string;
  expiration: number;
  isValid(): boolean;
}

// API Response Interfaces
export interface ErrorResponse {
  message: string;
  status: number;
}

export interface PaginatedResponse<T> {
  contents: T[];
  totalElements: number;
  totalPages: number;
}
// Request types for API endpoints (camelCase)
export interface CreateAccountRequest {
  name: string;
  segment: string;
  responsibleId: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  segment?: string;
  responsibleId?: string;
  status?: string;
  type?: string;
  pipeline?: string;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
}

export interface CreateBusinessRequest {
  title: string;
  accountId: string;
  value: number;
  currency?: string;
  stage: string;
  probability?: number;
  ownerId?: string;
  closingDate?: string;
}

export interface UpdateBusinessRequest {
  title?: string;
  accountId?: string;
  value?: number;
  currency?: string;
  stage?: string;
  probability?: number;
  ownerId?: string;
  closingDate?: string | null;
}

export interface CreateUserRequest {
  name: string;
  role?: string;
  managerId?: string;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: string;
  managerId?: string;
  email?: string;
}

export interface AccountQueryParams {
  search?: string;
  filter?: string;
  status?: string;
  type?: string;
  page?: number;
  size?: number;
}

// Default value helpers
export const getDefaultUserRole = (): UserRole => UserRoles.SALES_REP;
export const getDefaultAccountStatus = (): AccountStatus => AccountStatuses.ACTIVE;
export const getDefaultAccountType = (): AccountType => AccountTypes.LEAD;
export const getDefaultCurrency = (): Currency => Currencies.BRL;

// Utility function to remove null and undefined fields from objects
function removeNullUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value;
    }
  }
  
  return result;
}

// Conversion utility functions
export function accountDbToApi(dbAccount: AccountDB): Account {
  const account = {
    id: dbAccount.id,
    name: dbAccount.name,
    segment: dbAccount.segment,
    responsibleId: dbAccount.responsible_id,
    status: dbAccount.status,
    type: dbAccount.type,
    pipeline: dbAccount.pipeline,
    lastInteraction: dbAccount.last_interaction,
    email: dbAccount.email,
    phone: dbAccount.phone,
    cnpj: dbAccount.cnpj,
    instagram: dbAccount.instagram,
    linkedin: dbAccount.linkedin,
    whatsapp: dbAccount.whatsapp,
    createdAt: dbAccount.created_at
  };
  
  return removeNullUndefinedFields(account) as Account;
}

export function accountApiToDb(apiAccount: CreateAccountRequest | UpdateAccountRequest): Partial<AccountDB> {
  const dbAccount: Partial<AccountDB> = {};
  
  if ('name' in apiAccount && apiAccount.name !== undefined) dbAccount.name = apiAccount.name;
  if ('segment' in apiAccount && apiAccount.segment !== undefined) dbAccount.segment = apiAccount.segment;
  if ('responsibleId' in apiAccount && apiAccount.responsibleId !== undefined) dbAccount.responsible_id = apiAccount.responsibleId;
  if ('status' in apiAccount && apiAccount.status !== undefined) dbAccount.status = apiAccount.status;
  if ('type' in apiAccount && apiAccount.type !== undefined) dbAccount.type = apiAccount.type;
  if ('pipeline' in apiAccount && apiAccount.pipeline !== undefined) dbAccount.pipeline = apiAccount.pipeline;
  if ('email' in apiAccount && apiAccount.email !== undefined) dbAccount.email = apiAccount.email;
  if ('phone' in apiAccount && apiAccount.phone !== undefined) dbAccount.phone = apiAccount.phone;
  if ('cnpj' in apiAccount && apiAccount.cnpj !== undefined) dbAccount.cnpj = apiAccount.cnpj;
  if ('instagram' in apiAccount && apiAccount.instagram !== undefined) dbAccount.instagram = apiAccount.instagram;
  if ('linkedin' in apiAccount && apiAccount.linkedin !== undefined) dbAccount.linkedin = apiAccount.linkedin;
  if ('whatsapp' in apiAccount && apiAccount.whatsapp !== undefined) dbAccount.whatsapp = apiAccount.whatsapp;
  
  return dbAccount;
}

export function businessDbToApi(dbBusiness: BusinessDB): Business {
  const business = {
    id: dbBusiness.id,
    title: dbBusiness.title,
    accountId: dbBusiness.account_id,
    value: dbBusiness.value,
    currency: dbBusiness.currency,
    stage: dbBusiness.stage,
    probability: dbBusiness.probability,
    ownerId: dbBusiness.owner_id,
    closingDate: dbBusiness.closing_date,
    createdAt: dbBusiness.created_at
  };
  
  return removeNullUndefinedFields(business) as Business;
}

export function businessApiToDb(apiBusiness: CreateBusinessRequest | UpdateBusinessRequest): Partial<BusinessDB> {
  const dbBusiness: Partial<BusinessDB> = {};
  
  if ('title' in apiBusiness && apiBusiness.title !== undefined) dbBusiness.title = apiBusiness.title;
  if ('accountId' in apiBusiness && apiBusiness.accountId !== undefined) dbBusiness.account_id = apiBusiness.accountId;
  if ('value' in apiBusiness && apiBusiness.value !== undefined) dbBusiness.value = apiBusiness.value;
  if ('currency' in apiBusiness && apiBusiness.currency !== undefined) dbBusiness.currency = apiBusiness.currency;
  if ('stage' in apiBusiness && apiBusiness.stage !== undefined) dbBusiness.stage = apiBusiness.stage;
  if ('probability' in apiBusiness && apiBusiness.probability !== undefined) dbBusiness.probability = apiBusiness.probability;
  if ('ownerId' in apiBusiness && apiBusiness.ownerId !== undefined) dbBusiness.owner_id = apiBusiness.ownerId;
  if ('closingDate' in apiBusiness && apiBusiness.closingDate !== undefined) dbBusiness.closing_date = apiBusiness.closingDate || undefined;
  
  return dbBusiness;
}

export function userDbToApi(dbUser: UserDB): User {
  const user = {
    id: dbUser.id,
    name: dbUser.name,
    role: dbUser.role,
    managerId: dbUser.manager_id,
    email: dbUser.email,
    createdAt: dbUser.created_at
  };
  
  return removeNullUndefinedFields(user) as User;
}

export function userApiToDb(apiUser: CreateUserRequest | UpdateUserRequest): Partial<UserDB> {
  const dbUser: Partial<UserDB> = {};
  
  if ('name' in apiUser && apiUser.name !== undefined) dbUser.name = apiUser.name;
  if ('role' in apiUser && apiUser.role !== undefined) dbUser.role = apiUser.role;
  if ('managerId' in apiUser && apiUser.managerId !== undefined) dbUser.manager_id = apiUser.managerId;
  if ('email' in apiUser && apiUser.email !== undefined) dbUser.email = apiUser.email;
  
  return dbUser;
}