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

export const DealStages = {
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
export type DealStage = typeof DealStages[keyof typeof DealStages];
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

export const isValidDealStage = (value: string): value is DealStage => {
  return Object.values(DealStages).includes(value as DealStage);
};

export const isValidCurrency = (value: string): value is Currency => {
  return Object.values(Currencies).includes(value as Currency);
};

// Profile Interface (Database representation - snake_case)
export interface ProfileDB {
  id: string;
  name: string;
  role: string;
  manager_id?: string;
  email: string;
  created_at: string;
}

// Profile Interface (API representation - camelCase)
export interface Profile {
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
  owner_id: string;
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
  ownerId: string;
  status: string;
  type: string;
  pipeline: string;
  lastInteraction: string;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  createdAt: string;
}

// Deal Interface (Database representation - snake_case)
export interface DealDB {
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

// Deal Interface (API representation - camelCase)
export interface Deal {
  id: string;
  title: string;
  accountId: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
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
  error: string;
  message: string;
  details?: any;
  request_id?: string;
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
  ownerId: string;
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
  ownerId?: string;
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

export interface CreateDealRequest {
  title: string;
  accountId: string;
  value: number;
  currency?: string;
  stage: string;
  probability?: number;
  ownerId?: string;
  closingDate?: string;
}

export interface UpdateDealRequest {
  title?: string;
  accountId?: string;
  value?: number;
  currency?: string;
  stage?: string;
  probability?: number;
  ownerId?: string;
  closingDate?: string | null;
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

// Conversion utility functions
export function accountDbToApi(dbAccount: AccountDB): Account {
  return {
    id: dbAccount.id,
    name: dbAccount.name,
    segment: dbAccount.segment,
    ownerId: dbAccount.owner_id,
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
}

export function accountApiToDb(apiAccount: CreateAccountRequest | UpdateAccountRequest): Partial<AccountDB> {
  const dbAccount: Partial<AccountDB> = {};
  
  if ('name' in apiAccount && apiAccount.name !== undefined) dbAccount.name = apiAccount.name;
  if ('segment' in apiAccount && apiAccount.segment !== undefined) dbAccount.segment = apiAccount.segment;
  if ('ownerId' in apiAccount && apiAccount.ownerId !== undefined) dbAccount.owner_id = apiAccount.ownerId;
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

export function dealDbToApi(dbDeal: DealDB): Deal {
  return {
    id: dbDeal.id,
    title: dbDeal.title,
    accountId: dbDeal.account_id,
    value: dbDeal.value,
    currency: dbDeal.currency,
    stage: dbDeal.stage,
    probability: dbDeal.probability,
    ownerId: dbDeal.owner_id,
    closingDate: dbDeal.closing_date,
    createdAt: dbDeal.created_at
  };
}

export function dealApiToDb(apiDeal: CreateDealRequest | UpdateDealRequest): Partial<DealDB> {
  const dbDeal: Partial<DealDB> = {};
  
  if ('title' in apiDeal && apiDeal.title !== undefined) dbDeal.title = apiDeal.title;
  if ('accountId' in apiDeal && apiDeal.accountId !== undefined) dbDeal.account_id = apiDeal.accountId;
  if ('value' in apiDeal && apiDeal.value !== undefined) dbDeal.value = apiDeal.value;
  if ('currency' in apiDeal && apiDeal.currency !== undefined) dbDeal.currency = apiDeal.currency;
  if ('stage' in apiDeal && apiDeal.stage !== undefined) dbDeal.stage = apiDeal.stage;
  if ('probability' in apiDeal && apiDeal.probability !== undefined) dbDeal.probability = apiDeal.probability;
  if ('ownerId' in apiDeal && apiDeal.ownerId !== undefined) dbDeal.owner_id = apiDeal.ownerId;
  if ('closingDate' in apiDeal && apiDeal.closingDate !== undefined) dbDeal.closing_date = apiDeal.closingDate || undefined;
  
  return dbDeal;
}