// Import enums from separate file
export * from './enums';
import type { SupportedLocale } from './enums';

// User Interface (Database representation - snake_case)
export interface UserDB {
  id: string;
  name: string;
  username: string;
  role: string;
  manager_id?: string;
  email: string;
  created_at: string;
}

// Relationship object interfaces
export interface UserReference {
  id: string;
}

export interface AccountReference {
  id: string;
}

export interface BusinessReference {
  id: string;
}

export interface ItemReference {
  id: string;
}

export interface BusinessProposalReference {
  id: string;
}

// User Interface (API representation - camelCase)
export interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  manager?: UserReference;
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
  responsible: UserReference;
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
  responsible_id?: string;
  closing_date?: string;
  created_at: string;
}

// Business Interface (API representation - camelCase)
export interface Business {
  id: string;
  title: string;
  account: AccountReference;
  value: number;
  currency: string;
  stage: string;
  probability?: number;
  responsible?: UserReference;
  closingDate?: string;
  createdAt: string;
}

// Item Interface (Database representation - snake_case)
export interface ItemDB {
  id: string;
  name: string;
  type: string;
  price: number;
  sku_code?: string | null;
  description?: string | null;
  created_at: string;
}

// Item Interface (API representation - camelCase)
export interface Item {
  id: string;
  name: string;
  type: string;
  price: number;
  skuCode?: string;
  description?: string;
  createdAt: string;
}

// AccountTimeline Interface (Database representation - snake_case)
export interface AccountTimelineDB {
  id: string;
  account_id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  responsible_id: string;
  created_at: string;
}

// BusinessProposal Interface (Database representation - snake_case)
export interface BusinessProposalDB {
  id: string;
  business_id: string;
  responsible_id: string;
  title: string;
  status: string;
  date: string;
  value: number;
  content?: string | null;
  theme_color?: string | null;
  terms_and_conditions?: string | null;
  show_unit_prices?: boolean | null;
  created_at: string;
}

// BusinessProposalItem Interface (Database representation - snake_case)
export interface BusinessProposalItemDB {
  id: string;
  proposal_id: string;
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount?: number | null;
  total: number;
  created_at: string;
}

// AccountTimeline Interface (API representation - camelCase)
export interface AccountTimeline {
  id: string;
  account: AccountReference;
  type: string;
  title: string;
  description?: string;
  date: string;
  responsible: UserReference;
  createdAt: string;
}

// BusinessProposal Interface (API representation - camelCase)
export interface BusinessProposal {
  id: string;
  business: BusinessReference;
  responsible: UserReference;
  title: string;
  status: string;
  date: string;
  value: number;
  content?: string;
  themeColor?: string;
  termsAndConditions?: string;
  showUnitPrices?: boolean;
  createdAt: string;
}

// BusinessProposalItem Interface (API representation - camelCase)
export interface BusinessProposalItem {
  id: string;
  proposal: BusinessProposalReference;
  item: ItemReference;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
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
  requestId?: string;
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
  responsible: UserReference;
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
  responsible?: UserReference;
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
  account: AccountReference;
  value: number;
  currency?: string;
  stage: string;
  probability?: number;
  responsible?: UserReference;
  closingDate?: string;
}

export interface UpdateBusinessRequest {
  title?: string;
  account?: AccountReference;
  value?: number;
  currency?: string;
  stage?: string;
  probability?: number;
  responsible?: UserReference;
  closingDate?: string | null;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  role?: string;
  manager?: UserReference;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  role?: string;
  manager?: UserReference;
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

export interface CreateItemRequest {
  name: string;
  type: string;
  price: number;
  skuCode?: string;
  description?: string;
}

export interface UpdateItemRequest {
  name?: string;
  type?: string;
  price?: number;
  skuCode?: string | null;
  description?: string | null;
}

export interface ItemQueryParams {
  search?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}

export interface CreateAccountTimelineRequest {
  account: AccountReference;
  type: string;
  title: string;
  description?: string;
  date: string;
  responsible: UserReference;
}

export interface UpdateAccountTimelineRequest {
  account?: AccountReference;
  type?: string;
  title?: string;
  description?: string | null;
  date?: string;
  responsible?: UserReference;
}

export interface AccountTimelineQueryParams {
  accountId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  responsibleId?: string;
  page?: number;
  size?: number;
}

export interface CreateBusinessProposalRequest {
  business: BusinessReference;
  responsible: UserReference;
  title: string;
  status?: string;
  date: string;
  value: number;
  content?: string;
  themeColor?: string;
  termsAndConditions?: string;
  showUnitPrices?: boolean;
}

export interface UpdateBusinessProposalRequest {
  business?: BusinessReference;
  responsible?: UserReference;
  title?: string;
  status?: string;
  date?: string;
  value?: number;
  content?: string | null;
  themeColor?: string | null;
  termsAndConditions?: string | null;
  showUnitPrices?: boolean | null;
}

export interface CreateBusinessProposalItemRequest {
  proposal: BusinessProposalReference;
  item: ItemReference;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface UpdateBusinessProposalItemRequest {
  proposal?: BusinessProposalReference;
  item?: ItemReference;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number | null;
}

export interface BusinessProposalQueryParams {
  search?: string;
  filter?: string;
  status?: string;
  businessId?: string;
  responsibleId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface BusinessProposalItemQueryParams {
  proposalId?: string;
  itemId?: string;
  page?: number;
  size?: number;
}

// Dashboard-specific types and constants

// Dashboard interfaces for revenue queries

export interface MonthlyRevenueResponse {
  [monthName: string]: number;
}

// More sales by responsible response interface
export interface SalesByResponsibleResponse {
  responsibleId: string;
  responsibleName: string;
  saleValue: number;
  closedDealsCount: number;
}

// Month name translation types (implementation in translations.ts)
export type MonthNamesByLocale = Record<SupportedLocale, readonly string[]>;



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
    responsible: { id: dbAccount.responsible_id },
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
  if ('responsible' in apiAccount && apiAccount.responsible !== undefined) dbAccount.responsible_id = apiAccount.responsible.id;
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
    account: { id: dbBusiness.account_id },
    value: dbBusiness.value,
    currency: dbBusiness.currency,
    stage: dbBusiness.stage,
    probability: dbBusiness.probability,
    responsible: dbBusiness.responsible_id ? { id: dbBusiness.responsible_id } : undefined,
    closingDate: dbBusiness.closing_date,
    createdAt: dbBusiness.created_at
  };
  
  return removeNullUndefinedFields(business) as Business;
}

export function businessApiToDb(apiBusiness: CreateBusinessRequest | UpdateBusinessRequest): Partial<BusinessDB> {
  const dbBusiness: Partial<BusinessDB> = {};
  
  if ('title' in apiBusiness && apiBusiness.title !== undefined) dbBusiness.title = apiBusiness.title;
  if ('account' in apiBusiness && apiBusiness.account !== undefined) dbBusiness.account_id = apiBusiness.account.id;
  if ('value' in apiBusiness && apiBusiness.value !== undefined) dbBusiness.value = apiBusiness.value;
  if ('currency' in apiBusiness && apiBusiness.currency !== undefined) dbBusiness.currency = apiBusiness.currency;
  if ('stage' in apiBusiness && apiBusiness.stage !== undefined) dbBusiness.stage = apiBusiness.stage;
  if ('probability' in apiBusiness && apiBusiness.probability !== undefined) dbBusiness.probability = apiBusiness.probability;
  if ('responsible' in apiBusiness && apiBusiness.responsible !== undefined) dbBusiness.responsible_id = apiBusiness.responsible.id;
  if ('closingDate' in apiBusiness && apiBusiness.closingDate !== undefined) dbBusiness.closing_date = apiBusiness.closingDate || undefined;
  
  return dbBusiness;
}

export function userDbToApi(dbUser: UserDB): User {
  const user = {
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    role: dbUser.role,
    manager: dbUser.manager_id ? { id: dbUser.manager_id } : undefined,
    email: dbUser.email,
    createdAt: dbUser.created_at
  };
  
  return removeNullUndefinedFields(user) as User;
}

export function userApiToDb(apiUser: CreateUserRequest | UpdateUserRequest): Partial<UserDB> {
  const dbUser: Partial<UserDB> = {};
  
  if ('name' in apiUser && apiUser.name !== undefined) dbUser.name = apiUser.name;
  if ('username' in apiUser && apiUser.username !== undefined) dbUser.username = apiUser.username;
  if ('role' in apiUser && apiUser.role !== undefined) dbUser.role = apiUser.role;
  if ('manager' in apiUser && apiUser.manager !== undefined) dbUser.manager_id = apiUser.manager.id;
  if ('email' in apiUser && apiUser.email !== undefined) dbUser.email = apiUser.email;
  
  return dbUser;
}

export function itemDbToApi(dbItem: ItemDB): Item {
  const item = {
    id: dbItem.id,
    name: dbItem.name,
    type: dbItem.type,
    price: dbItem.price,
    skuCode: dbItem.sku_code,
    description: dbItem.description,
    createdAt: dbItem.created_at
  };
  
  return removeNullUndefinedFields(item) as Item;
}

export function itemApiToDb(apiItem: CreateItemRequest | UpdateItemRequest): Partial<ItemDB> {
  const dbItem: Partial<ItemDB> = {};
  
  if ('name' in apiItem && apiItem.name !== undefined) dbItem.name = apiItem.name;
  if ('type' in apiItem && apiItem.type !== undefined) dbItem.type = apiItem.type;
  if ('price' in apiItem && apiItem.price !== undefined) dbItem.price = apiItem.price;
  if ('skuCode' in apiItem && apiItem.skuCode !== undefined) dbItem.sku_code = apiItem.skuCode;
  if ('description' in apiItem && apiItem.description !== undefined) dbItem.description = apiItem.description;
  
  return dbItem;
}

export function accountTimelineDbToApi(dbTimeline: AccountTimelineDB): AccountTimeline {
  const timeline = {
    id: dbTimeline.id,
    account: { id: dbTimeline.account_id },
    type: dbTimeline.type,
    title: dbTimeline.title,
    description: dbTimeline.description,
    date: dbTimeline.date,
    responsible: { id: dbTimeline.responsible_id },
    createdAt: dbTimeline.created_at
  };
  
  return removeNullUndefinedFields(timeline) as AccountTimeline;
}

export function accountTimelineApiToDb(apiTimeline: CreateAccountTimelineRequest | UpdateAccountTimelineRequest): Partial<AccountTimelineDB> {
  const dbTimeline: Partial<AccountTimelineDB> = {};
  
  if ('account' in apiTimeline && apiTimeline.account !== undefined) dbTimeline.account_id = apiTimeline.account.id;
  if ('type' in apiTimeline && apiTimeline.type !== undefined) dbTimeline.type = apiTimeline.type;
  if ('title' in apiTimeline && apiTimeline.title !== undefined) dbTimeline.title = apiTimeline.title;
  if ('description' in apiTimeline && apiTimeline.description !== undefined) dbTimeline.description = apiTimeline.description;
  if ('date' in apiTimeline && apiTimeline.date !== undefined) dbTimeline.date = apiTimeline.date;
  if ('responsible' in apiTimeline && apiTimeline.responsible !== undefined) dbTimeline.responsible_id = apiTimeline.responsible.id;
  
  return dbTimeline;
}

export function businessProposalDbToApi(dbProposal: BusinessProposalDB): BusinessProposal {
  const proposal = {
    id: dbProposal.id,
    business: { id: dbProposal.business_id },
    responsible: { id: dbProposal.responsible_id },
    title: dbProposal.title,
    status: dbProposal.status,
    date: dbProposal.date,
    value: dbProposal.value,
    content: dbProposal.content,
    themeColor: dbProposal.theme_color,
    termsAndConditions: dbProposal.terms_and_conditions,
    showUnitPrices: dbProposal.show_unit_prices,
    createdAt: dbProposal.created_at
  };
  
  return removeNullUndefinedFields(proposal) as BusinessProposal;
}

export function businessProposalApiToDb(apiProposal: CreateBusinessProposalRequest | UpdateBusinessProposalRequest): Partial<BusinessProposalDB> {
  const dbProposal: Partial<BusinessProposalDB> = {};
  
  if ('business' in apiProposal && apiProposal.business !== undefined) dbProposal.business_id = apiProposal.business.id;
  if ('responsible' in apiProposal && apiProposal.responsible !== undefined) dbProposal.responsible_id = apiProposal.responsible.id;
  if ('title' in apiProposal && apiProposal.title !== undefined) dbProposal.title = apiProposal.title;
  if ('status' in apiProposal && apiProposal.status !== undefined) dbProposal.status = apiProposal.status;
  if ('date' in apiProposal && apiProposal.date !== undefined) dbProposal.date = apiProposal.date;
  if ('value' in apiProposal && apiProposal.value !== undefined) dbProposal.value = apiProposal.value;
  if ('content' in apiProposal && apiProposal.content !== undefined) dbProposal.content = apiProposal.content;
  if ('themeColor' in apiProposal && apiProposal.themeColor !== undefined) dbProposal.theme_color = apiProposal.themeColor;
  if ('termsAndConditions' in apiProposal && apiProposal.termsAndConditions !== undefined) dbProposal.terms_and_conditions = apiProposal.termsAndConditions;
  if ('showUnitPrices' in apiProposal && apiProposal.showUnitPrices !== undefined) dbProposal.show_unit_prices = apiProposal.showUnitPrices;
  
  return dbProposal;
}

export function businessProposalItemDbToApi(dbItem: BusinessProposalItemDB): BusinessProposalItem {
  const item = {
    id: dbItem.id,
    proposal: { id: dbItem.proposal_id },
    item: { id: dbItem.item_id },
    name: dbItem.name,
    quantity: dbItem.quantity,
    unitPrice: dbItem.unit_price,
    discount: dbItem.discount,
    total: dbItem.total,
    createdAt: dbItem.created_at
  };
  
  return removeNullUndefinedFields(item) as BusinessProposalItem;
}

export function businessProposalItemApiToDb(apiItem: CreateBusinessProposalItemRequest | UpdateBusinessProposalItemRequest): Partial<BusinessProposalItemDB> {
  const dbItem: Partial<BusinessProposalItemDB> = {};
  
  if ('proposal' in apiItem && apiItem.proposal !== undefined) dbItem.proposal_id = apiItem.proposal.id;
  if ('item' in apiItem && apiItem.item !== undefined) dbItem.item_id = apiItem.item.id;
  if ('name' in apiItem && apiItem.name !== undefined) dbItem.name = apiItem.name;
  if ('quantity' in apiItem && apiItem.quantity !== undefined) dbItem.quantity = apiItem.quantity;
  if ('unitPrice' in apiItem && apiItem.unitPrice !== undefined) dbItem.unit_price = apiItem.unitPrice;
  if ('discount' in apiItem && apiItem.discount !== undefined) dbItem.discount = apiItem.discount;
  
  // Calculate total if we have the necessary fields
  if (dbItem.quantity !== undefined && dbItem.unit_price !== undefined) {
    const discount = dbItem.discount || 0;
    dbItem.total = (dbItem.quantity * dbItem.unit_price) - discount;
  }
  
  return dbItem;
}