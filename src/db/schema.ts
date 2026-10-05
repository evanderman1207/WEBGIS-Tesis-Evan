import { pgTable, serial, text, doublePrecision, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const spatialBookmarks = pgTable('spatial_bookmarks', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  title: text('title').notNull(),
  notes: text('notes'),
  centerLon: doublePrecision('center_lon').notNull(),
  centerLat: doublePrecision('center_lat').notNull(),
  zoom: doublePrecision('zoom').notNull(),
  activeLayers: jsonb('active_layers').$type<string[]>(),
  districtFilter: text('district_filter'),
  povertyCategory: text('poverty_category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const spatialPovertyAnalysis = pgTable('spatial_poverty_analysis', {
  id: serial('id').primaryKey(),
  districtName: text('district_name').notNull(),
  villageName: text('village_name').notNull(),
  povertyCategory: text('poverty_category').notNull(),
  areaHa: doublePrecision('area_ha').notNull(),
  assetStatus: text('asset_status'),
  dependencyRatioRank: text('dependency_ratio_rank'),
  source: text('source').default('Tesis Evan 2025'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
