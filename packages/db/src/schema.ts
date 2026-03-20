import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const planEnum = pgEnum('plan', ['free', 'premium']);
export const orgRoleEnum = pgEnum('org_role', ['owner', 'member']);
export const eventStatusEnum = pgEnum('event_status', [
  'draft',
  'pending',
  'published',
  'cancelled',
  'rejected',
]);
export const userTypeEnum = pgEnum('user_type', ['user', 'venue_user', 'system_user']);
export const applicationStatusEnum = pgEnum('application_status', [
  'pending',
  'approved',
  'rejected',
]);

// Mixins
const commonColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
};

// Tables
export const users = pgTable('users', {
  ...commonColumns,
  email: text('email').unique().notNull(),
  name: text('name'),
  image: text('image'),
  userType: userTypeEnum('user_type').default('user').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  plan: planEnum('plan').default('free').notNull(),
  planExpiresAt: timestamp('plan_expires_at'),
});

export const companies = pgTable('companies', {
  ...commonColumns,
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  plan: planEnum('plan').default('free').notNull(),
  planExpiresAt: timestamp('plan_expires_at'),
});

export const organizations = pgTable('organizations', {
  ...commonColumns,
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  brand: text('brand'), // 複数ブランドを持つ場合に使用
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address'),
  imageColor: text('image_color'), // HEX
  iconUrl: text('icon_url'),
  coverImageUrl: text('cover_image_url'),
});

export const organizationMembers = pgTable(
  'organization_members',
  {
    ...commonColumns,
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: orgRoleEnum('role').notNull(),
  },
  (t) => ({
    // owner は1組織に1人
    uniqueOwner: uniqueIndex('unique_org_owner').on(t.orgId).where(sql`role = 'owner'`),
  })
);

export const operatorApplications = pgTable('operator_applications', {
  ...commonColumns,
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  status: applicationStatusEnum('status').default('pending').notNull(),
  companyName: text('company_name').notNull(),
  orgName: text('org_name').notNull(),
  orgSlug: text('org_slug').notNull(),
  brand: text('brand'),
  description: text('description'),
  address: text('address'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNote: text('review_note'),
});

export const fcRelationships = pgTable('fc_relationships', {
  ...commonColumns,
  franchisorOrgId: uuid('franchisor_org_id')
    .notNull()
    .references(() => organizations.id),
  franchiseeOrgId: uuid('franchisee_org_id')
    .notNull()
    .references(() => organizations.id),
  grantedBy: uuid('granted_by')
    .notNull()
    .references(() => users.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  revokedAt: timestamp('revoked_at'),
});

export const events = pgTable('events', {
  ...commonColumns,
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id), // 作成者
  status: eventStatusEnum('status').default('draft').notNull(),
  title: text('title'),
  description: text('description'),
  startAt: timestamp('start_at'),
  endAt: timestamp('end_at'),
  maxParticipants: integer('max_participants'),
  location: text('location'),
});

export const barHostPermissions = pgTable('bar_host_permissions', {
  ...commonColumns,
  barId: uuid('bar_id')
    .notNull()
    .references(() => organizations.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  revokedAt: timestamp('revoked_at'),
  grantedBy: uuid('granted_by')
    .notNull()
    .references(() => users.id),
});

export const barBlocks = pgTable('bar_blocks', {
  ...commonColumns,
  barId: uuid('bar_id')
    .notNull()
    .references(() => organizations.id),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  reason: text('reason'),
});

export const coupons = pgTable('coupons', {
  ...commonColumns,
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id),
  title: text('title').notNull(),
  description: text('description'),
  discountAmount: integer('discount_amount').notNull(),
  expiresAt: timestamp('expires_at'),
});

export const userCoupons = pgTable('user_coupons', {
  ...commonColumns,
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  couponId: uuid('coupon_id')
    .notNull()
    .references(() => coupons.id),
  token: uuid('token').notNull().defaultRandom(),
  usedAt: timestamp('used_at'),
});

export const auditLogs = pgTable('audit_logs', {
  ...commonColumns,
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  orgId: uuid('org_id').references(() => organizations.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  payload: jsonb('payload'),
});

export const notifications = pgTable('notifications', {
  ...commonColumns,
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  readAt: timestamp('read_at'),
  payload: jsonb('payload'),
});
