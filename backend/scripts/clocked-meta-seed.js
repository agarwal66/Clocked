// CLOCKED — META CONFIG SEED
// Run with:
//   mongosh "mongodb://localhost:27017/clocked" --file clocked-meta-seed.js
// or:
//   mongosh "mongodb+srv://USER:PASS@cluster.mongodb.net/clocked" --file clocked-meta-seed.js

const DB_NAME = "clocked";
db = db.getSiblingDB(DB_NAME);

print("=".repeat(70));
print(" CLOCKED — META / ADMIN CONFIG SEED");
print("=".repeat(70));

function setupCollection(name, options = {}) {
  try { db.getCollection(name).drop(); } catch (e) {}
  db.createCollection(name, options);
  print(`✓ created ${name}`);
}

function now() {
  return new Date();
}

function upsertMany(collectionName, docs, uniqueKey = "key") {
  const collection = db.getCollection(collectionName);
  docs.forEach((doc) => {
    collection.updateOne(
      { [uniqueKey]: doc[uniqueKey] },
      { $set: doc },
      { upsert: true }
    );
  });
  print(`✓ seeded ${docs.length} docs into ${collectionName}`);
}

// ============================================================
// 1. META GROUPS
// ============================================================
setupCollection("app_meta_groups", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["key", "label", "active", "created_at", "updated_at"],
      properties: {
        key: { bsonType: "string" },
        label: { bsonType: "string" },
        description: { bsonType: ["string", "null"] },
        active: { bsonType: "bool" },
        sort_order: { bsonType: ["int", "long", "double", "null"] },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.app_meta_groups.createIndex({ key: 1 }, { unique: true, name: "idx_meta_groups_key" });
db.app_meta_groups.createIndex({ active: 1, sort_order: 1 }, { name: "idx_meta_groups_active_order" });

// ============================================================
// 2. META ITEMS
// ============================================================
setupCollection("app_meta_items", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "group_key",
        "key",
        "label",
        "active",
        "editable",
        "system_key",
        "sort_order",
        "created_at",
        "updated_at"
      ],
      properties: {
        group_key: { bsonType: "string" },
        key: { bsonType: "string" },
        label: { bsonType: "string" },
        short_label: { bsonType: ["string", "null"] },
        description: { bsonType: ["string", "null"] },
        icon: { bsonType: ["string", "null"] },
        color_token: { bsonType: ["string", "null"] },
        route: { bsonType: ["string", "null"] },
        parent_key: { bsonType: ["string", "null"] },
        sort_order: { bsonType: ["int", "long", "double"] },
        active: { bsonType: "bool" },
        editable: { bsonType: "bool" },
        system_key: { bsonType: "bool" },
        visible_mobile: { bsonType: ["bool", "null"] },
        visible_desktop: { bsonType: ["bool", "null"] },
        metadata: { bsonType: ["object", "null"] },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.app_meta_items.createIndex({ group_key: 1, key: 1 }, { unique: true, name: "idx_meta_items_group_key" });
db.app_meta_items.createIndex({ group_key: 1, active: 1, sort_order: 1 }, { name: "idx_meta_items_group_active_order" });

// ============================================================
// 3. CONTENT BLOCKS
// ============================================================
setupCollection("app_content_blocks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["page", "block_key", "label", "content", "active", "created_at", "updated_at"],
      properties: {
        page: { bsonType: "string" },
        block_key: { bsonType: "string" },
        label: { bsonType: "string" },
        content: { bsonType: "string" },
        content_type: { bsonType: ["string", "null"] },
        description: { bsonType: ["string", "null"] },
        active: { bsonType: "bool" },
        metadata: { bsonType: ["object", "null"] },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.app_content_blocks.createIndex({ page: 1, block_key: 1 }, { unique: true, name: "idx_content_page_block" });
db.app_content_blocks.createIndex({ page: 1, active: 1 }, { name: "idx_content_page_active" });

// ============================================================
// 4. NOTIFICATION TEMPLATES
// ============================================================
setupCollection("app_notification_templates", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "type",
        "label",
        "title_template",
        "body_template",
        "icon",
        "tone",
        "active",
        "created_at",
        "updated_at"
      ],
      properties: {
        type: { bsonType: "string" },
        label: { bsonType: "string" },
        title_template: { bsonType: "string" },
        body_template: { bsonType: "string" },
        icon: { bsonType: "string" },
        tone: { bsonType: "string" },
        active: { bsonType: "bool" },
        metadata: { bsonType: ["object", "null"] },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.app_notification_templates.createIndex({ type: 1 }, { unique: true, name: "idx_notification_templates_type" });

// ============================================================
// 5. DASHBOARD WIDGETS
// ============================================================
setupCollection("app_dashboard_widgets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["key", "label", "active", "sort_order", "created_at", "updated_at"],
      properties: {
        key: { bsonType: "string" },
        label: { bsonType: "string" },
        description: { bsonType: ["string", "null"] },
        icon: { bsonType: ["string", "null"] },
        sort_order: { bsonType: ["int", "long", "double"] },
        active: { bsonType: "bool" },
        visible_mobile: { bsonType: ["bool", "null"] },
        visible_desktop: { bsonType: ["bool", "null"] },
        metadata: { bsonType: ["object", "null"] },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.app_dashboard_widgets.createIndex({ key: 1 }, { unique: true, name: "idx_dashboard_widgets_key" });
db.app_dashboard_widgets.createIndex({ active: 1, sort_order: 1 }, { name: "idx_dashboard_widgets_active_order" });

// ============================================================
// 6. SETTINGS LABELS
// ============================================================
setupCollection("app_settings_fields", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "key",
        "group_key",
        "label",
        "active",
        "sort_order",
        "created_at",
        "updated_at"
      ],
      properties: {
        key: { bsonType: "string" },
        group_key: { bsonType: "string" },
        label: { bsonType: "string" },
        subtitle: { bsonType: ["string", "null"] },
        field_type: { bsonType: ["string", "null"] },
        active: { bsonType: "bool" },
        sort_order: { bsonType: ["int", "long", "double"] },
        metadata: { bsonType: ["object", "null"] },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.app_settings_fields.createIndex({ key: 1 }, { unique: true, name: "idx_settings_fields_key" });
db.app_settings_fields.createIndex({ group_key: 1, active: 1, sort_order: 1 }, { name: "idx_settings_fields_group_order" });

// ============================================================
// SEED GROUPS
// ============================================================
const ts = now();

upsertMany("app_meta_groups", [
  { key: "navigation", label: "Navigation", description: "Sidebar and mobile tabs", active: true, sort_order: 1, created_at: ts, updated_at: ts },
  { key: "search_reasons", label: "Search Reasons", description: "Reasons shown during search or analytics", active: true, sort_order: 2, created_at: ts, updated_at: ts },
  { key: "relationship_types", label: "Relationship Types", description: "Used while posting flags", active: true, sort_order: 3, created_at: ts, updated_at: ts },
  { key: "timeframes", label: "Timeframes", description: "How recent experience was", active: true, sort_order: 4, created_at: ts, updated_at: ts },
  { key: "flag_categories_red", label: "Red Flag Categories", description: "User facing red flag labels", active: true, sort_order: 5, created_at: ts, updated_at: ts },
  { key: "flag_categories_green", label: "Green Flag Categories", description: "User facing green flag labels", active: true, sort_order: 6, created_at: ts, updated_at: ts },
  { key: "credibility_labels", label: "Credibility Labels", description: "Human labels for credibility weights", active: true, sort_order: 7, created_at: ts, updated_at: ts },
  { key: "request_reasons", label: "Flag Request Reasons", description: "Reasons for public requests", active: true, sort_order: 8, created_at: ts, updated_at: ts },
  { key: "badge_labels", label: "Badge Labels", description: "Self aware and similar labels", active: true, sort_order: 9, created_at: ts, updated_at: ts },
], "key");

// ============================================================
// SEED META ITEMS
// ============================================================
const metaItems = [
  // NAVIGATION
  { group_key: "navigation", key: "overview", label: "Overview", short_label: "Home", description: "Dashboard overview", icon: "⚡", color_token: "black", route: "/dashboard", parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: true, visible_desktop: true, metadata: { section_key: "overview" }, created_at: ts, updated_at: ts },
  { group_key: "navigation", key: "notifications", label: "Notifications", short_label: "Alerts", description: "User notifications", icon: "🔔", color_token: "red", route: "/dashboard?tab=notifications", parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: true, visible_desktop: true, metadata: { section_key: "notifications" }, created_at: ts, updated_at: ts },
  { group_key: "navigation", key: "my-flags", label: "My flags", short_label: "My flags", description: "Flags on me and posted by me", icon: "🚩", color_token: "red", route: "/dashboard?tab=my-flags", parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: true, visible_desktop: true, metadata: { section_key: "my-flags" }, created_at: ts, updated_at: ts },
  { group_key: "navigation", key: "watching", label: "Watching", short_label: "Watching", description: "Watched handles", icon: "👁", color_token: "green", route: "/dashboard?tab=watching", parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: true, visible_desktop: true, metadata: { section_key: "watching" }, created_at: ts, updated_at: ts },
  { group_key: "navigation", key: "requests", label: "Flag requests", short_label: "Requests", description: "Open community requests", icon: "🙋", color_token: "amber", route: "/dashboard?tab=requests", parent_key: null, sort_order: 5, active: true, editable: true, system_key: true, visible_mobile: false, visible_desktop: true, metadata: { section_key: "requests" }, created_at: ts, updated_at: ts },
  { group_key: "navigation", key: "me-profile", label: "Me profile", short_label: "Profile", description: "Public self-description", icon: "👤", color_token: "black", route: "/dashboard?tab=me-profile", parent_key: null, sort_order: 6, active: true, editable: true, system_key: true, visible_mobile: false, visible_desktop: true, metadata: { section_key: "me-profile" }, created_at: ts, updated_at: ts },
  { group_key: "navigation", key: "unsent", label: "Unsent letter", short_label: "Letter", description: "Private note area", icon: "💌", color_token: "black", route: "/dashboard?tab=unsent", parent_key: null, sort_order: 7, active: true, editable: true, system_key: true, visible_mobile: false, visible_desktop: true, metadata: { section_key: "unsent" }, created_at: ts, updated_at: ts },
  { group_key: "navigation", key: "settings", label: "Settings", short_label: "Settings", description: "Account settings", icon: "⚙️", color_token: "black", route: "/dashboard?tab=settings", parent_key: null, sort_order: 8, active: true, editable: true, system_key: true, visible_mobile: false, visible_desktop: true, metadata: { section_key: "settings" }, created_at: ts, updated_at: ts },

  // SEARCH REASONS
  { group_key: "search_reasons", key: "date", label: "Going on a date", short_label: "Date", description: "Reason selected before meeting someone romantically", icon: "👀", color_token: "amber", route: null, parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "date" }, created_at: ts, updated_at: ts },
  { group_key: "search_reasons", key: "shaadi", label: "Shaadi", short_label: "Shaadi", description: "Reason selected for marriage / arranged setup", icon: "💍", color_token: "amber", route: null, parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "shaadi" }, created_at: ts, updated_at: ts },
  { group_key: "search_reasons", key: "fwb", label: "Friends with Benefits", short_label: "FWB", description: "Reason selected for informal relationship context", icon: "🔥", color_token: "amber", route: null, parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "fwb" }, created_at: ts, updated_at: ts },
  { group_key: "search_reasons", key: "buying", label: "Buying from them", short_label: "Buying", description: "Reason selected before buying a product or service", icon: "🛍️", color_token: "amber", route: null, parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "buying" }, created_at: ts, updated_at: ts },
  { group_key: "search_reasons", key: "work", label: "Work collab", short_label: "Work", description: "Reason selected before business collaboration", icon: "💼", color_token: "amber", route: null, parent_key: null, sort_order: 5, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "work" }, created_at: ts, updated_at: ts },
  { group_key: "search_reasons", key: "curious", label: "Just curious", short_label: "Curious", description: "Used for passive or casual search intent", icon: "🤝", color_token: "amber", route: null, parent_key: null, sort_order: 6, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "curious" }, created_at: ts, updated_at: ts },

  // RELATIONSHIP TYPES
  { group_key: "relationship_types", key: "dated", label: "Dated", short_label: "Dated", description: "Serious romantic involvement", icon: "💔", color_token: "red", route: null, parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 5 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "shaadi", label: "Shaadi / arranged intro", short_label: "Shaadi", description: "Marriage / arranged introduction", icon: "💍", color_token: "amber", route: null, parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 5 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "fwb", label: "Friends with Benefits", short_label: "FWB", description: "Informal physical relationship", icon: "🔥", color_token: "red", route: null, parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 4 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "date", label: "Went on a date", short_label: "Date", description: "Met romantically on one or more dates", icon: "☕", color_token: "amber", route: null, parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 4 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "family", label: "Family connection", short_label: "Family", description: "Known through family", icon: "👨‍👩‍👧", color_token: "black", route: null, parent_key: null, sort_order: 5, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 4 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "college", label: "College / school", short_label: "College", description: "Known from school or college", icon: "🏫", color_token: "black", route: null, parent_key: null, sort_order: 6, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 4 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "event", label: "Met at event / party", short_label: "Event", description: "Known through social event or party", icon: "🎉", color_token: "amber", route: null, parent_key: null, sort_order: 7, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 3 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "met", label: "Met in person", short_label: "Met", description: "Met but not strongly categorized", icon: "🤝", color_token: "black", route: null, parent_key: null, sort_order: 8, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 3 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "work", label: "Work / business", short_label: "Work", description: "Professional interaction", icon: "💼", color_token: "black", route: null, parent_key: null, sort_order: 9, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 3 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "bought", label: "Bought / sold", short_label: "Bought", description: "Seller / buyer experience", icon: "🛍️", color_token: "green", route: null, parent_key: null, sort_order: 10, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 3 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "gym", label: "Gym / class / activity", short_label: "Gym", description: "Known from activity context", icon: "🏋️", color_token: "black", route: null, parent_key: null, sort_order: 11, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 3 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "neighbourhood", label: "Neighbourhood / locality", short_label: "Locality", description: "Known from same area", icon: "🏘️", color_token: "black", route: null, parent_key: null, sort_order: 12, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 2 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "datingapp", label: "Dating app match", short_label: "App match", description: "Only interacted on app", icon: "📲", color_token: "amber", route: null, parent_key: null, sort_order: 13, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 2 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "online", label: "Followed online only", short_label: "Online", description: "Only online or social media interaction", icon: "📱", color_token: "black", route: null, parent_key: null, sort_order: 14, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 2 }, created_at: ts, updated_at: ts },
  { group_key: "relationship_types", key: "heard", label: "Heard through people", short_label: "Heard", description: "Indirect hearsay only", icon: "👂", color_token: "red", route: null, parent_key: null, sort_order: 15, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 1 }, created_at: ts, updated_at: ts },

  // TIMEFRAMES
  { group_key: "timeframes", key: "week", label: "This week", short_label: "Week", description: "Very recent experience", icon: "🗓️", color_token: "green", route: null, parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: ts, updated_at: ts },
  { group_key: "timeframes", key: "month", label: "This month", short_label: "Month", description: "Recent experience within current month", icon: "🗓️", color_token: "green", route: null, parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: ts, updated_at: ts },
  { group_key: "timeframes", key: "months", label: "1–6 months ago", short_label: "1–6 months", description: "Experience within last 6 months", icon: "🗓️", color_token: "amber", route: null, parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: ts, updated_at: ts },
  { group_key: "timeframes", key: "year", label: "Over a year ago", short_label: "1y+", description: "Old experience", icon: "🗓️", color_token: "red", route: null, parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: ts, updated_at: ts },

  // REQUEST REASONS (same as search reasons, separate group for flexibility)
  { group_key: "request_reasons", key: "date", label: "Going on a date", short_label: "Date", description: "Open request for dating context", icon: "👀", color_token: "amber", route: null, parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: ts, updated_at: ts },
  { group_key: "request_reasons", key: "shaadi", label: "Shaadi", short_label: "Shaadi", description: "Open request for marriage context", icon: "💍", color_token: "amber", route: null, parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: ts, updated_at: ts },
  { group_key: "request_reasons", key: "buying", label: "Buying from them", short_label: "Buying", description: "Open request before purchase decision", icon: "🛍️", color_token: "amber", route: null, parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: ts, updated_at: ts },
  { group_key: "request_reasons", key: "work", label: "Work collab", short_label: "Work", description: "Open request before work collaboration", icon: "💼", color_token: "amber", route: null, parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: ts, updated_at: ts },
];

// add synthetic unique field for upsert
metaItems.forEach((item) => item._seed_id = `${item.group_key}:${item.key}`);
upsertMany("app_meta_items", metaItems, "_seed_id");
db.app_meta_items.updateMany({}, { $unset: { _seed_id: "" } });

// ============================================================
// SEED CONTENT BLOCKS
// ============================================================
upsertMany("app_content_blocks", [
  { page: "dashboard", block_key: "overview_title", label: "Overview title", content: "Good morning, @{{username}} 👋", content_type: "text", description: "Main greeting on dashboard", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "overview_subtitle", label: "Overview subtitle", content: "Here's what happened while you were away.", content_type: "text", description: "Subtitle below greeting", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "search_banner_title", label: "Search banner title", content: "{{count}} people searched your handle this week", content_type: "text", description: "Headline on overview search banner", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "search_banner_cta", label: "Search banner CTA", content: "See details →", content_type: "text", description: "CTA for search banner", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "vibe_eyebrow", label: "Vibe eyebrow", content: "Your vibe score", content_type: "text", description: "Label above vibe score card", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "my_flags_subtitle", label: "My flags subtitle", content: "Flags on your handle · flags you've posted", content_type: "text", description: "Subtitle on my flags screen", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "watching_subtitle", label: "Watching subtitle", content: "{{count}} handles · notified when new flags drop", content_type: "text", description: "Subtitle on watching screen", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "requests_subtitle", label: "Requests subtitle", content: "Community asking for receipts on handles you might know", content_type: "text", description: "Subtitle on requests screen", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "me_profile_subtitle", label: "Me profile subtitle", content: "Your voluntary self-introduction — visible on your handle's search page", content_type: "text", description: "Subtitle on me profile screen", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "unsent_subtitle", label: "Unsent subtitle", content: "Say what you never could. Only you can see this. Ever.", content_type: "text", description: "Subtitle on unsent letter screen", active: true, metadata: null, created_at: ts, updated_at: ts },
  { page: "dashboard", block_key: "settings_subtitle", label: "Settings subtitle", content: "Manage your account and preferences", content_type: "text", description: "Subtitle on settings screen", active: true, metadata: null, created_at: ts, updated_at: ts },
], "block_key");

// ============================================================
// SEED NOTIFICATION TEMPLATES
// ============================================================
upsertMany("app_notification_templates", [
  { type: "new_flag_on_me", label: "New flag on me", title_template: "New flag on @{{handle}}", body_template: "{{category}}", icon: "🚩", tone: "red", active: true, metadata: { supports_category: true }, created_at: ts, updated_at: ts },
  { type: "handle_searched", label: "Handle searched", title_template: "Your handle was searched", body_template: "Reason: {{reason_label}}", icon: "👀", tone: "amber", active: true, metadata: { supports_reason: true }, created_at: ts, updated_at: ts },
  { type: "watched_handle_new_flag", label: "Watched handle new flag", title_template: "@{{handle}} got a new flag", body_template: "{{category}}", icon: "👁", tone: "green", active: true, metadata: { supports_category: true }, created_at: ts, updated_at: ts },
  { type: "flag_reply", label: "Flag reply", title_template: "Reply on @{{handle}}", body_template: "Someone replied to a flag you posted.", icon: "💬", tone: "gray", active: true, metadata: null, created_at: ts, updated_at: ts },
  { type: "flag_reported", label: "Flag reported", title_template: "One of your flags was reported", body_template: "Our team is reviewing it.", icon: "⚠️", tone: "amber", active: true, metadata: null, created_at: ts, updated_at: ts },
  { type: "flag_removed", label: "Flag removed", title_template: "A flag was removed", body_template: "A flag connected to your account was removed.", icon: "🗑️", tone: "red", active: true, metadata: null, created_at: ts, updated_at: ts },
  { type: "both_sides_response", label: "Both sides response", title_template: "@{{handle}} posted a response", body_template: "See their side of the story.", icon: "🪞", tone: "gray", active: true, metadata: null, created_at: ts, updated_at: ts },
  { type: "challenge_result", label: "Challenge result", title_template: "Your challenge result is ready", body_template: "See how the community responded.", icon: "⚡", tone: "green", active: true, metadata: null, created_at: ts, updated_at: ts },
  { type: "weekly_radar", label: "Weekly radar", title_template: "Your weekly radar is here", body_template: "Catch up on what happened this week.", icon: "📡", tone: "gray", active: true, metadata: null, created_at: ts, updated_at: ts },
  { type: "email_verified", label: "Email verified", title_template: "Email verified", body_template: "Your account is fully verified.", icon: "✅", tone: "green", active: true, metadata: null, created_at: ts, updated_at: ts },
  { type: "handle_claimed", label: "Handle claimed", title_template: "Your handle is now linked", body_template: "Your profile is connected to your handle.", icon: "✋", tone: "green", active: true, metadata: null, created_at: ts, updated_at: ts },
], "type");

// ============================================================
// SEED DASHBOARD WIDGETS
// ============================================================
upsertMany("app_dashboard_widgets", [
  { key: "search_banner", label: "Search banner", description: "Weekly search summary card", icon: "👀", sort_order: 1, active: true, visible_mobile: true, visible_desktop: true, metadata: { section: "overview" }, created_at: ts, updated_at: ts },
  { key: "vibe_card", label: "Vibe card", description: "Vibe score summary", icon: "🟢", sort_order: 2, active: true, visible_mobile: true, visible_desktop: true, metadata: { section: "overview" }, created_at: ts, updated_at: ts },
  { key: "stats_grid", label: "Stats grid", description: "Top metric cards", icon: "📊", sort_order: 3, active: true, visible_mobile: true, visible_desktop: true, metadata: { section: "overview" }, created_at: ts, updated_at: ts },
  { key: "recent_activity", label: "Recent activity", description: "Recent notification feed", icon: "🕒", sort_order: 4, active: true, visible_mobile: true, visible_desktop: true, metadata: { section: "overview" }, created_at: ts, updated_at: ts },
], "key");

// ============================================================
// SEED SETTINGS FIELDS
// ============================================================
upsertMany("app_settings_fields", [
  { key: "notif.handle_searched", group_key: "notifications", label: "Someone searched my handle", subtitle: "Email when someone searches your @", field_type: "toggle", active: true, sort_order: 1, metadata: { target: "user.notif.handle_searched" }, created_at: ts, updated_at: ts },
  { key: "notif.new_flag_on_me", group_key: "notifications", label: "New flag on my handle", subtitle: "Email when a flag is posted on you", field_type: "toggle", active: true, sort_order: 2, metadata: { target: "user.notif.new_flag_on_me" }, created_at: ts, updated_at: ts },
  { key: "notif.watched_activity", group_key: "notifications", label: "Watched handle activity", subtitle: "Notify when watched handles get new flags", field_type: "toggle", active: true, sort_order: 3, metadata: { target: "user.notif.watched_activity" }, created_at: ts, updated_at: ts },
  { key: "notif.weekly_radar", group_key: "notifications", label: "Weekly radar email", subtitle: "Monday summary of platform activity", field_type: "toggle", active: true, sort_order: 4, metadata: { target: "user.notif.weekly_radar" }, created_at: ts, updated_at: ts },
  { key: "notif.flag_requests", group_key: "notifications", label: "Flag requests near me", subtitle: "Notifications about requests in your city", field_type: "toggle", active: true, sort_order: 5, metadata: { target: "user.notif.flag_requests" }, created_at: ts, updated_at: ts },
  { key: "default_identity", group_key: "posting_defaults", label: "Post anonymously by default", subtitle: "Change on any individual flag anytime", field_type: "toggle", active: true, sort_order: 6, metadata: { target: "user.default_identity", checked_value: "anonymous", unchecked_value: "named" }, created_at: ts, updated_at: ts },
], "key");

print("\nAll meta/config collections created and seeded successfully.");
print("Next recommended step: build /api/meta and admin CRUD routes.");
