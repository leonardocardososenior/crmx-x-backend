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

export const ItemTypes = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE'
} as const;

export const TimelineTypes = {
  NOTE: 'NOTE',
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  SYSTEM: 'SYSTEM'
} as const;

export const BusinessProposalStatuses = {
  DRAFT: 'Rascunho',
  IN_REVIEW: 'Em Revisão',
  SENT: 'Enviado',
  ACCEPTED: 'Aceito',
  REJECTED: 'Rejeitado'
} as const;

export const SupportedLocales = {
  PT_BR: 'pt-BR',
  EN_US: 'en-US'
} as const;

// Type definitions derived from enums
export type UserRole = typeof UserRoles[keyof typeof UserRoles];
export type AccountStatus = typeof AccountStatuses[keyof typeof AccountStatuses];
export type AccountType = typeof AccountTypes[keyof typeof AccountTypes];
export type BusinessStage = typeof BusinessStages[keyof typeof BusinessStages];
export type Currency = typeof Currencies[keyof typeof Currencies];
export type ItemType = typeof ItemTypes[keyof typeof ItemTypes];
export type TimelineType = typeof TimelineTypes[keyof typeof TimelineTypes];
export type BusinessProposalStatus = typeof BusinessProposalStatuses[keyof typeof BusinessProposalStatuses];
export type SupportedLocale = typeof SupportedLocales[keyof typeof SupportedLocales];

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

export const isValidItemType = (value: string): value is ItemType => {
  return Object.values(ItemTypes).includes(value as ItemType);
};

export const isValidTimelineType = (value: string): value is TimelineType => {
  return Object.values(TimelineTypes).includes(value as TimelineType);
};

export const isValidBusinessProposalStatus = (value: string): value is BusinessProposalStatus => {
  return Object.values(BusinessProposalStatuses).includes(value as BusinessProposalStatus);
};

export const isValidSupportedLocale = (value: string): value is SupportedLocale => {
  return Object.values(SupportedLocales).includes(value as SupportedLocale);
};

// Default value helpers
export const getDefaultUserRole = (): UserRole => UserRoles.SALES_REP;
export const getDefaultAccountStatus = (): AccountStatus => AccountStatuses.ACTIVE;
export const getDefaultAccountType = (): AccountType => AccountTypes.LEAD;
export const getDefaultCurrency = (): Currency => Currencies.BRL;
export const getDefaultItemType = (): ItemType => ItemTypes.PRODUCT;
export const getDefaultTimelineType = (): TimelineType => TimelineTypes.NOTE;
export const getDefaultBusinessProposalStatus = (): BusinessProposalStatus => BusinessProposalStatuses.DRAFT;
export const getDefaultSupportedLocale = (): SupportedLocale => SupportedLocales.PT_BR;