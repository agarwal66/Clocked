// ============================================================
// CLOCKED — Complete MongoDB Schema
// ============================================================
// HOW TO RUN:
//   Local:  mongosh "mongodb://localhost:27017" --file clocked_mongo.js
//   Atlas:  mongosh "mongodb+srv://user:pass@cluster.mongodb.net/clocked" --file clocked_mongo.js
//
// WHAT THIS FILE DOES:
//   1. Creates all 23 collections with validators
//   2. Creates all indexes (unique, compound, partial, TTL, sparse)
//   3. Seeds all reference data:
//        - 16 red flag categories
//        - 15 green flag categories
//        - 15 credibility weights
//        - 10 push notification templates
// ============================================================

const DB_NAME = "clocked";
db = db.getSiblingDB(DB_NAME);

print("=".repeat(60));
print(" CLOCKED — MongoDB Schema Setup");
print("=".repeat(60));
print("");


// ============================================================
// VALID ENUM VALUES
// MongoDB has no native ENUM — these are the accepted values
// Enforce in application layer + validator where possible
// ============================================================

const ENUMS = {

  flag_type: [
    "red",
    "green"
  ],

  identity_mode: [
    "anonymous",
    "named"
  ],

  search_reason: [
    "date",       // Going on a date
    "shaadi",     // Shaadi / arranged intro
    "fwb",        // Friends with Benefits
    "buying",     // Buying from them
    "work",       // Work collab
    "curious"     // Just curious
  ],

  relationship_type: [
    "dated",          // 💔 Dated
    "date",           // ☕ Went on a date
    "shaadi",         // 💍 Shaadi / arranged intro
    "fwb",            // 🔥 Friends with Benefits
    "datingapp",      // 📲 Dating app match
    "online",         // 📱 Followed online only
    "met",            // 🤝 Met in person
    "event",          // 🎉 Met at event / party
    "college",        // 🏫 College / school
    "work",           // 💼 Work / business
    "gym",            // 🏋️ Gym / class / activity
    "neighbourhood",  // 🏘️ Neighbourhood / locality
    "family",         // 👨‍👩‍👧 Family connection
    "bought",         // 🛍️ Bought / sold
    "heard"           // 👂 Heard through people
  ],

  timeframe_type: [
    "week",    // This week
    "month",   // This month
    "months",  // 1–6 months ago
    "year"     // Over a year ago
  ],

  notification_type: [
    "new_flag_on_me",           // Someone flagged my handle
    "handle_searched",          // Someone searched my handle
    "watched_handle_new_flag",  // Flag on a handle I'm watching
    "flag_reply",               // Reply to a flag I posted
    "flag_reported",            // My flag was reported
    "flag_removed",             // My flag was removed
    "both_sides_response",      // Handle owner responded to my flag
    "challenge_result",         // 48h challenge ended
    "weekly_radar",             // Monday digest
    "email_verified",           // Email confirmed
    "handle_claimed"            // Handle linked to account
  ],

  grievance_status: [
    "received",   // Acknowledged < 24h
    "reviewing",  // Under review < 48h
    "resolved",   // Action taken < 72h
    "rejected",   // Did not meet removal threshold
    "appealed"    // User appealed rejection
  ],

  grievance_type: [
    "false",          // False / fabricated
    "defamatory",     // Defamatory content
    "harassment",     // Harassment campaign
    "minor",          // Content involving a minor
    "intimate",       // Non-consensual intimate imagery
    "doxx",           // Doxxing / private information
    "impersonation",  // Impersonation
    "court",          // Court order
    "other"
  ],

  report_reason: [
    "false",
    "harassment",
    "impersonation",
    "guidelines",
    "other"
  ],

  reply_type: [
    "poster_reply",  // Original flag poster's one reply
    "both_sides"     // Handle owner's public perspective
  ],

  push_platform: [
    "web",      // Web Push API
    "android",  // FCM native (future)
    "ios"       // APNs native (future)
  ],

  push_status: [
    "pending",    // Queued, not yet sent
    "sent",       // Dispatched to push service
    "delivered",  // Confirmed delivered
    "failed",     // Delivery failed
    "dismissed"   // User dismissed
  ],

  vibe_card_theme: [
    "dark",
    "red",
    "green",
    "cream",
    "midnight"
  ],

  is_subject: [
    "yes",   // I am the subject of the content
    "rep",   // I represent the subject
    "third"  // I am a concerned third party
  ],

  challenge_variant: [1, 2, 3, 4]
  // 1 = Bold, 2 = Playful, 3 = Shaadi, 4 = Creator
};


// ============================================================
// HELPER — drop and recreate a collection cleanly
// ============================================================
function setupCollection(name, options) {
  try { db.getCollection(name).drop(); } catch(e) {}
  db.createCollection(name, options || {});
  print("  ✓ " + name);
}


// ============================================================
// 1. USERS
// ============================================================
print("\n[1/23] Creating users...");

setupCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "username", "password_hash", "created_at", "updated_at"],
      properties: {

        // ── Auth ─────────────────────────────────────────────
        email: {
          bsonType: "string",
          description: "Unique email address — required"
        },
        email_verified: {
          bsonType: "bool",
          description: "FALSE until email link clicked"
        },
        email_verified_at: { bsonType: ["date","null"] },
        verify_token:      { bsonType: ["string","null"],
                             description: "Random hex token sent in verification email" },
        verify_token_expires: { bsonType: ["date","null"],
                                description: "24 hours from signup" },
        password_hash: {
          bsonType: "string",
          description: "Argon2id hash — never store plaintext"
        },
        reset_token:         { bsonType: ["string","null"] },
        reset_token_expires: { bsonType: ["date","null"],
                               description: "30 minutes from request" },

        // ── Profile ──────────────────────────────────────────
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30,
          pattern: "^[a-z0-9_.]+$",
          description: "Unique — only lowercase letters, numbers, _ and ."
        },
        instagram_handle: {
          bsonType: ["string","null"],
          description: "Claimed IG handle — without @, lowercase, one per user"
        },
        handle_claimed_at: { bsonType: ["date","null"] },

        // ── Me Profile (public on search page) ───────────────
        me_misunderstood: {
          bsonType: ["string","null"],
          maxLength: 300,
          description: "What people get wrong about me"
        },
        me_pride: {
          bsonType: ["string","null"],
          maxLength: 300,
          description: "What I'm most proud of"
        },
        me_profile_updated_at: { bsonType: ["date","null"] },
        self_aware_badge: {
          bsonType: "bool",
          description: "Awarded when both me profile fields are filled"
        },

        // ── Defaults ─────────────────────────────────────────
        default_identity: {
          enum: ENUMS.identity_mode,
          description: "anonymous or named — per-flag override allowed"
        },

        // ── Email Notification Preferences ───────────────────
        notif: {
          bsonType: "object",
          description: "Email notification preferences",
          properties: {
            handle_searched:  { bsonType: "bool" },  // default true
            new_flag_on_me:   { bsonType: "bool" },  // default true
            watched_activity: { bsonType: "bool" },  // default true
            weekly_radar:     { bsonType: "bool" },  // default true
            flag_requests:    { bsonType: "bool" }   // default false
          }
        },

        // ── Push Notification Preferences ────────────────────
        push: {
          bsonType: "object",
          description: "Push notification preferences — only active when push.enabled = true",
          properties: {
            enabled:              { bsonType: "bool" },  // master switch, default false
            handle_searched:      { bsonType: "bool" },  // default true
            new_flag_on_me:       { bsonType: "bool" },  // default true
            watched_activity:     { bsonType: "bool" },  // default true
            flag_reply:           { bsonType: "bool" },  // default true
            both_sides_response:  { bsonType: "bool" },  // default true
            challenge_update:     { bsonType: "bool" },  // default true
            challenge_result:     { bsonType: "bool" },  // default true
            permission_asked_at:  { bsonType: ["date","null"] },
            permission_denied_at: { bsonType: ["date","null"] }
          }
        },

        // ── Account ──────────────────────────────────────────
        credibility_score: {
          bsonType: "double",
          description: "Silent internal score — never exposed directly to users"
        },
        referred_by: {
          bsonType: ["objectId","null"],
          description: "ObjectId of referring user"
        },
        invite_code: {
          bsonType: "string",
          description: "Unique hex code for invite links — clocked.in/invite?ref=xxx"
        },
        is_banned:  { bsonType: "bool" },
        ban_reason: { bsonType: ["string","null"] },
        banned_at:  { bsonType: ["date","null"] },

        // ── Timestamps ───────────────────────────────────────
        created_at:     { bsonType: "date" },
        updated_at:     { bsonType: "date" },
        last_active_at: { bsonType: ["date","null"] }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.users.createIndex({ email: 1 },            { unique: true, name: "idx_users_email" });
db.users.createIndex({ username: 1 },         { unique: true, name: "idx_users_username" });
db.users.createIndex({ instagram_handle: 1 }, { unique: true, sparse: true, name: "idx_users_instagram" });
db.users.createIndex({ verify_token: 1 },     { sparse: true, name: "idx_users_verify_token" });
db.users.createIndex({ reset_token: 1 },      { sparse: true, name: "idx_users_reset_token" });
db.users.createIndex({ invite_code: 1 },      { unique: true, name: "idx_users_invite_code" });
db.users.createIndex({ is_banned: 1 },        { name: "idx_users_banned" });
db.users.createIndex({ created_at: -1 },      { name: "idx_users_created" });


// ============================================================
// 2. HANDLES
// Every Instagram handle ever searched or flagged.
// Exists independently — a handle does NOT require a user account.
// ============================================================
print("\n[2/23] Creating handles...");

setupCollection("handles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["instagram_handle", "created_at", "updated_at"],
      properties: {
        instagram_handle: {
          bsonType: "string",
          description: "Lowercase without @ — e.g. rohanverma"
        },
        claimed_by_user_id: {
          bsonType: ["objectId","null"],
          description: "Null until the real person claims their handle"
        },
        claimed_at: { bsonType: ["date","null"] },

        // ── Aggregated stats (recomputed on every flag change) ─
        stats: {
          bsonType: "object",
          properties: {
            red_flag_count:   { bsonType: "int", minimum: 0 },
            green_flag_count: { bsonType: "int", minimum: 0 },
            total_flag_count: { bsonType: "int", minimum: 0 },
            vibe_score: {
              bsonType: ["double","null"],
              description: "Weighted % green (0–100). NULL = no flags yet"
            },
            search_count: { bsonType: "int", minimum: 0 },
            know_count:   { bsonType: "int", minimum: 0,
                            description: "I know this person count at handle level" }
          }
        },

        // ── Me Profile (denormalised from users for fast reads) ─
        me_misunderstood:  { bsonType: ["string","null"] },
        me_pride:          { bsonType: ["string","null"] },
        self_aware_badge:  { bsonType: "bool" },

        is_suspended: { bsonType: "bool" },
        created_at:   { bsonType: "date" },
        updated_at:   { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.handles.createIndex({ instagram_handle: 1 },       { unique: true, name: "idx_handles_instagram" });
db.handles.createIndex({ "stats.vibe_score": -1 },    { sparse: true, name: "idx_handles_vibe_score" });
db.handles.createIndex({ "stats.search_count": -1 },  { name: "idx_handles_search_count" });
db.handles.createIndex({ "stats.total_flag_count":-1},{ name: "idx_handles_flag_count" });
db.handles.createIndex({ claimed_by_user_id: 1 },     { sparse: true, name: "idx_handles_owner" });
db.handles.createIndex({ is_suspended: 1 },           { name: "idx_handles_suspended" });


// ============================================================
// 3. FLAG_CATEGORIES  (seeded below — 16 red + 15 green)
// ============================================================
print("\n[3/23] Creating flag_categories...");

setupCollection("flag_categories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["flag_type", "name", "sort_order"],
      properties: {
        flag_type:   { enum: ENUMS.flag_type },
        name:        { bsonType: "string" },
        sort_order:  { bsonType: "int", minimum: 1 }
      }
    }
  }
});

db.flag_categories.createIndex({ name: 1 },                   { unique: true, name: "idx_cats_name" });
db.flag_categories.createIndex({ flag_type: 1, sort_order: 1 },{ name: "idx_cats_type_order" });


// ============================================================
// 4. CREDIBILITY_WEIGHTS  (seeded below — 15 relationship types)
// ============================================================
print("\n[4/23] Creating credibility_weights...");

setupCollection("credibility_weights", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["relationship", "weight", "label", "emoji"],
      properties: {
        relationship: { enum: ENUMS.relationship_type },
        weight:       { bsonType: "int", minimum: 1, maximum: 5 },
        label:        { bsonType: "string" },
        emoji:        { bsonType: "string" }
      }
    }
  }
});

db.credibility_weights.createIndex({ relationship: 1 }, { unique: true, name: "idx_cred_relationship" });


// ============================================================
// 5. FLAGS
// Core table — every red and green flag posted
// ============================================================
print("\n[5/23] Creating flags...");

setupCollection("flags", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "handle_id", "posted_by", "flag_type", "category_id",
        "category_name", "relationship", "timeframe", "identity",
        "credibility_weight", "expires_at", "disclaimers", "created_at", "updated_at"
      ],
      properties: {
        handle_id:    { bsonType: "objectId" },
        posted_by:    { bsonType: "objectId" },
        flag_type:    { enum: ENUMS.flag_type },

        category_id:   { bsonType: "objectId" },
        category_name: {
          bsonType: "string",
          description: "Denormalised for fast display — avoids extra lookup on every flag render"
        },

        relationship:       { enum: ENUMS.relationship_type },
        timeframe:          { enum: ENUMS.timeframe_type },
        comment: {
          bsonType: ["string","null"],
          maxLength: 300,
          description: "Optional free-text from poster"
        },
        identity: {
          enum: ENUMS.identity_mode,
          description: "anonymous = posted_by never shown publicly. named = username shown."
        },
        credibility_weight: {
          bsonType: "int",
          minimum: 1,
          maximum: 5,
          description: "Copied from credibility_weights at insert time — immutable after"
        },

        // ── State ────────────────────────────────────────────
        is_expired: {
          bsonType: "bool",
          description: "Set TRUE after 12 months. Flag stays visible but weighted at 50%."
        },
        expires_at: {
          bsonType: "date",
          description: "created_at + 12 months — set at insert time"
        },
        is_disputed: {
          bsonType: "bool",
          description: "TRUE when both parties have flagged each other"
        },
        is_removed:    { bsonType: "bool" },
        removed_at:    { bsonType: ["date","null"] },
        removal_reason:{ bsonType: ["string","null"] },

        // ── Engagement ───────────────────────────────────────
        know_count: {
          bsonType: "int",
          minimum: 0,
          description: "'I know this person' count on this specific flag"
        },
        view_count: { bsonType: "int", minimum: 0 },

        // ── Disclaimers — ALL THREE must be true to post ─────
        disclaimers: {
          bsonType: "object",
          required: ["one", "two", "three"],
          properties: {
            one: {
              bsonType: "bool",
              description: "I confirm this is based on my genuine personal experience"
            },
            two: {
              bsonType: "bool",
              description: "I accept full legal responsibility for this content"
            },
            three: {
              bsonType: "bool",
              description: "I am not posting this to harass or maliciously target anyone"
            }
          }
        },

        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.flags.createIndex({ handle_id: 1 },                                  { name: "idx_flags_handle" });
db.flags.createIndex({ posted_by: 1 },                                  { name: "idx_flags_posted_by" });
db.flags.createIndex({ flag_type: 1 },                                  { name: "idx_flags_type" });
db.flags.createIndex({ handle_id: 1, flag_type: 1 },                    { name: "idx_flags_handle_type" });
db.flags.createIndex({ handle_id: 1, is_removed: 1, is_expired: 1 },   { name: "idx_flags_active" });
db.flags.createIndex({ created_at: -1 },                                { name: "idx_flags_created" });
db.flags.createIndex({ expires_at: 1 },                                 { name: "idx_flags_expires" });
db.flags.createIndex({ category_id: 1 },                                { name: "idx_flags_category" });
// Prevent same user posting same flag_type on same handle twice (while active)
db.flags.createIndex(
  { handle_id: 1, posted_by: 1, flag_type: 1 },
  {
    unique: true,
    partialFilterExpression: { is_removed: false },
    name: "idx_flags_no_duplicate"
  }
);


// ============================================================
// 6. FLAG_GOSSIP
// Unverified gossip attached to a flag.
// NEVER affects vibe score. Always anonymised on display.
// One entry per user per flag.
// ============================================================
print("\n[6/23] Creating flag_gossip...");

setupCollection("flag_gossip", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["flag_id", "posted_by", "content", "created_at"],
      properties: {
        flag_id:    { bsonType: "objectId" },
        posted_by:  { bsonType: "objectId" },
        content: {
          bsonType: "string",
          minLength: 1,
          maxLength: 300,
          description: "Labelled Unverified — never affects vibe score"
        },
        is_removed: { bsonType: "bool" },
        created_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.flag_gossip.createIndex({ flag_id: 1 }, { name: "idx_gossip_flag" });
// One gossip per user per flag
db.flag_gossip.createIndex(
  { flag_id: 1, posted_by: 1 },
  { unique: true, name: "idx_gossip_one_per_user" }
);


// ============================================================
// 7. FLAG_REPLIES
// poster_reply = original flag poster's one public reply (max 1)
// both_sides   = handle owner's perspective (max 1 per flag)
// Neither can be edited after posting.
// ============================================================
print("\n[7/23] Creating flag_replies...");

setupCollection("flag_replies", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["flag_id", "posted_by", "content", "reply_type", "created_at"],
      properties: {
        flag_id:    { bsonType: "objectId" },
        posted_by:  { bsonType: "objectId" },
        content: {
          bsonType: "string",
          minLength: 1,
          maxLength: 300
        },
        reply_type: {
          enum: ENUMS.reply_type,
          description: "poster_reply = flag poster. both_sides = handle owner."
        },
        is_removed: { bsonType: "bool" },
        created_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.flag_replies.createIndex({ flag_id: 1 }, { name: "idx_replies_flag" });
// One reply per flag per poster per type — enforces the one-reply rule
db.flag_replies.createIndex(
  { flag_id: 1, posted_by: 1, reply_type: 1 },
  { unique: true, name: "idx_replies_one_per_type" }
);


// ============================================================
// 8. SEARCHES
// Every search is logged — powers "X people searched you this week"
// ============================================================
print("\n[8/23] Creating searches...");

setupCollection("searches", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["handle_id", "created_at"],
      properties: {
        handle_id: { bsonType: "objectId" },
        searched_by: {
          bsonType: ["objectId","null"],
          description: "null if user is not logged in"
        },
        reason: {
          enum: [...ENUMS.search_reason, null],
          description: "Why are they searching this handle"
        },
        ip_hash: {
          bsonType: ["string","null"],
          description: "SHA-256 hash of IP + salt — NEVER store raw IPs"
        },
        created_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.searches.createIndex({ handle_id: 1 },                 { name: "idx_searches_handle" });
db.searches.createIndex({ searched_by: 1 },               { sparse: true, name: "idx_searches_user" });
db.searches.createIndex({ handle_id: 1, created_at: -1 }, { name: "idx_searches_handle_time" });
db.searches.createIndex({ reason: 1 },                    { sparse: true, name: "idx_searches_reason" });
// TTL: auto-delete searches older than 2 years
db.searches.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 63072000, name: "ttl_searches_2yr" }
);


// ============================================================
// 9. WATCHES
// User's personal watchlist — max 5 handles per user.
// Watching is silent — the watched handle never knows.
// ============================================================
print("\n[9/23] Creating watches...");

setupCollection("watches", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "handle_id", "created_at"],
      properties: {
        user_id:    { bsonType: "objectId" },
        handle_id:  { bsonType: "objectId" },
        created_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.watches.createIndex({ user_id: 1 },                 { name: "idx_watches_user" });
db.watches.createIndex({ handle_id: 1 },               { name: "idx_watches_handle" });
// Each user can only watch each handle once
db.watches.createIndex(
  { user_id: 1, handle_id: 1 },
  { unique: true, name: "idx_watches_unique" }
);
// NOTE: Enforce max 5 watches per user in APPLICATION logic — not here
// Before inserting: db.watches.countDocuments({ user_id: userId }) >= 5 → reject


// ============================================================
// 10. KNOW_COUNTS
// "I know this person" — silent counter, user-toggleable.
// Works at two levels:
//   flag_id = null  → handle-level know
//   flag_id present → flag-level know (on a specific flag)
// ============================================================
print("\n[10/23] Creating know_counts...");

setupCollection("know_counts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "handle_id", "created_at"],
      properties: {
        user_id:    { bsonType: "objectId" },
        handle_id:  { bsonType: "objectId" },
        flag_id: {
          bsonType: ["objectId","null"],
          description: "null = handle-level. ObjectId = flag-level."
        },
        created_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

// One per user per flag
db.know_counts.createIndex(
  { user_id: 1, flag_id: 1 },
  {
    unique: true,
    partialFilterExpression: { flag_id: { $ne: null } },
    name: "idx_know_flag_unique"
  }
);
// One per user per handle (handle-level only)
db.know_counts.createIndex(
  { user_id: 1, handle_id: 1 },
  {
    unique: true,
    partialFilterExpression: { flag_id: null },
    name: "idx_know_handle_unique"
  }
);
db.know_counts.createIndex({ handle_id: 1 }, { name: "idx_know_handle" });
db.know_counts.createIndex({ flag_id: 1 },   { sparse: true, name: "idx_know_flag" });


// ============================================================
// 11. FLAG_REQUESTS
// Community board — "does anyone know @handle?"
// ============================================================
print("\n[11/23] Creating flag_requests...");

setupCollection("flag_requests", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["handle_id", "requested_by", "created_at"],
      properties: {
        handle_id:    { bsonType: "objectId" },
        requested_by: { bsonType: "objectId" },
        reason: {
          enum: [...ENUMS.search_reason, null],
          description: "Why do you want info on this person"
        },
        message: {
          bsonType: ["string","null"],
          maxLength: 300
        },
        is_fulfilled: { bsonType: "bool" },
        fulfilled_at: { bsonType: ["date","null"] },
        created_at:   { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.flag_requests.createIndex({ handle_id: 1 },    { name: "idx_flagreq_handle" });
db.flag_requests.createIndex({ requested_by: 1 }, { name: "idx_flagreq_user" });
db.flag_requests.createIndex({ is_fulfilled: 1 }, { name: "idx_flagreq_fulfilled" });
db.flag_requests.createIndex({ created_at: -1 },  { name: "idx_flagreq_created" });


// ============================================================
// 12. NOTIFICATIONS
// In-app notification feed — all events that create a bell alert.
// Push notifications are queued separately in push_notifications.
// ============================================================
print("\n[12/23] Creating notifications...");

setupCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "type", "created_at"],
      properties: {
        user_id:       { bsonType: "objectId" },
        type:          { enum: ENUMS.notification_type },
        handle_id:     { bsonType: ["objectId","null"] },
        flag_id:       { bsonType: ["objectId","null"] },
        actor_user_id: {
          bsonType: ["objectId","null"],
          description: "The user who caused this notification (e.g. who posted the flag)"
        },
        payload: {
          bsonType: "object",
          description: "Display data. e.g. { reason: 'date', count: 3, category: 'Love bombing' }"
        },
        is_read:       { bsonType: "bool" },
        read_at:       { bsonType: ["date","null"] },
        email_sent:    { bsonType: "bool" },
        email_sent_at: { bsonType: ["date","null"] },
        created_at:    { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.notifications.createIndex({ user_id: 1, is_read: 1, created_at: -1 }, { name: "idx_notifs_user_unread" });
db.notifications.createIndex({ user_id: 1, created_at: -1 },             { name: "idx_notifs_user_all" });
db.notifications.createIndex({ flag_id: 1 },                             { sparse: true, name: "idx_notifs_flag" });
db.notifications.createIndex({ handle_id: 1 },                           { sparse: true, name: "idx_notifs_handle" });
// TTL: auto-delete notifications older than 90 days
db.notifications.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 7776000, name: "ttl_notifications_90d" }
);


// ============================================================
// 13. UNSENT_LETTERS
// One per user. Completely private — only ever returned to owner.
// Encrypt content at application layer before storing.
// ============================================================
print("\n[13/23] Creating unsent_letters...");

setupCollection("unsent_letters", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "created_at", "updated_at"],
      properties: {
        user_id: { bsonType: "objectId" },
        content: {
          bsonType: ["string","null"],
          description: "MUST be encrypted at application layer before storing. Max 10000 chars."
        },
        updated_at: { bsonType: "date" },
        created_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

// One letter per user — upsert on save
db.unsent_letters.createIndex({ user_id: 1 }, { unique: true, name: "idx_letters_user" });


// ============================================================
// 14. SESSIONS
// DB-backed PHP sessions for horizontal scalability.
// ============================================================
print("\n[14/23] Creating sessions...");

setupCollection("sessions");

db.sessions.createIndex({ user_id: 1 },     { name: "idx_sessions_user" });
db.sessions.createIndex({ last_active: -1 },{ name: "idx_sessions_active" });
// TTL: auto-delete sessions inactive for 30 days
db.sessions.createIndex(
  { last_active: 1 },
  { expireAfterSeconds: 2592000, name: "ttl_sessions_30d" }
);


// ============================================================
// 15. GRIEVANCES
// Formal takedown requests under Indian IT Act Section 79.
// Grievance officer must acknowledge within 24h, resolve within 72h.
// ============================================================
print("\n[15/23] Creating grievances...");

setupCollection("grievances", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "reference_code", "name", "email", "is_subject",
        "grievance_type", "target_handle", "content_url",
        "description", "status", "created_at"
      ],
      properties: {
        reference_code: {
          bsonType: "string",
          description: "Auto-generated e.g. CLK-2025-4821"
        },
        name:          { bsonType: "string" },
        email:         { bsonType: "string" },
        is_subject: {
          enum: ENUMS.is_subject,
          description: "yes=I am the subject, rep=I represent them, third=third party"
        },
        grievance_type:  { enum: ENUMS.grievance_type },
        target_handle:   { bsonType: "string" },
        content_url:     { bsonType: "string" },
        description:     { bsonType: "string" },
        evidence:        { bsonType: ["string","null"] },
        flag_id:         { bsonType: ["objectId","null"] },
        status:          { enum: ENUMS.grievance_status },
        acknowledged_at: { bsonType: ["date","null"] },
        resolved_at:     { bsonType: ["date","null"] },
        resolution_notes:{ bsonType: ["string","null"] },
        created_at:      { bsonType: "date" },
        updated_at:      { bsonType: ["date","null"] }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.grievances.createIndex({ reference_code: 1 }, { unique: true, name: "idx_grievances_ref" });
db.grievances.createIndex({ email: 1 },           { name: "idx_grievances_email" });
db.grievances.createIndex({ status: 1 },          { name: "idx_grievances_status" });
db.grievances.createIndex({ flag_id: 1 },         { sparse: true, name: "idx_grievances_flag" });
db.grievances.createIndex({ created_at: -1 },     { name: "idx_grievances_created" });


// ============================================================
// 16. FLAG_REPORTS
// Quick in-flow flag reports — lighter than full grievance.
// One report per user per flag.
// ============================================================
print("\n[16/23] Creating flag_reports...");

setupCollection("flag_reports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["flag_id", "reported_by", "reason", "reference_code", "created_at"],
      properties: {
        flag_id:        { bsonType: "objectId" },
        reported_by:    { bsonType: "objectId" },
        reason:         { enum: ENUMS.report_reason },
        detail: {
          bsonType: ["string","null"],
          maxLength: 500
        },
        reference_code: { bsonType: "string" },
        status:         { enum: ENUMS.grievance_status },
        resolved_at:    { bsonType: ["date","null"] },
        resolution:     { bsonType: ["string","null"] },
        created_at:     { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.flag_reports.createIndex({ flag_id: 1 },        { name: "idx_reports_flag" });
db.flag_reports.createIndex({ reported_by: 1 },    { name: "idx_reports_user" });
db.flag_reports.createIndex({ reference_code: 1 }, { unique: true, name: "idx_reports_ref" });
db.flag_reports.createIndex({ status: 1 },         { name: "idx_reports_status" });
// One report per user per flag
db.flag_reports.createIndex(
  { flag_id: 1, reported_by: 1 },
  { unique: true, name: "idx_reports_unique" }
);


// ============================================================
// 17. PUSH_SUBSCRIPTIONS
// One row per device per user. Multiple devices supported.
// Web push: endpoint + p256dh + auth_secret
// Native: fcm_token (Android) or apns_token (iOS)
// ============================================================
print("\n[17/23] Creating push_subscriptions...");

setupCollection("push_subscriptions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "platform", "is_active", "created_at"],
      properties: {
        user_id:  { bsonType: "objectId" },
        platform: { enum: ENUMS.push_platform },
        // Web push fields
        endpoint: {
          bsonType: ["string","null"],
          description: "Unique push service URL — the primary identifier for a web subscription"
        },
        p256dh: {
          bsonType: ["string","null"],
          description: "Public key for message encryption"
        },
        auth_secret: {
          bsonType: ["string","null"],
          description: "Auth secret for message encryption"
        },
        // Native push fields
        fcm_token:  { bsonType: ["string","null"] },
        apns_token: { bsonType: ["string","null"] },
        // Device info
        device_name: {
          bsonType: ["string","null"],
          description: "e.g. Chrome on iPhone 15, Samsung Galaxy S24"
        },
        user_agent:   { bsonType: ["string","null"] },
        is_active:    { bsonType: "bool" },
        last_used_at: { bsonType: ["date","null"] },
        created_at:   { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.push_subscriptions.createIndex({ user_id: 1 },                { name: "idx_pushsubs_user" });
db.push_subscriptions.createIndex({ user_id: 1, is_active: 1 },  { name: "idx_pushsubs_active" });
// Unique active endpoint per browser profile
db.push_subscriptions.createIndex(
  { endpoint: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { is_active: true, endpoint: { $ne: null } },
    name: "idx_pushsubs_endpoint_unique"
  }
);


// ============================================================
// 18. PUSH_NOTIFICATIONS
// Every push delivery attempt logged for debugging and analytics.
// ============================================================
print("\n[18/23] Creating push_notifications...");

setupCollection("push_notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "title", "body", "url", "status", "created_at"],
      properties: {
        user_id:         { bsonType: "objectId" },
        subscription_id: { bsonType: ["objectId","null"] },
        notification_id: {
          bsonType: ["objectId","null"],
          description: "Links back to notifications collection entry"
        },
        title:           { bsonType: "string" },
        body:            { bsonType: "string" },
        icon:            { bsonType: "string" },
        badge:           { bsonType: "string" },
        image:           { bsonType: ["string","null"] },
        url: {
          bsonType: "string",
          description: "Deep link URL opened when user taps notification"
        },
        data: {
          bsonType: "object",
          description: "Extra payload for service worker e.g. { type: 'new_flag', handle: 'rohan' }"
        },
        status:          { enum: ENUMS.push_status },
        sent_at:         { bsonType: ["date","null"] },
        delivered_at:    { bsonType: ["date","null"] },
        failed_at:       { bsonType: ["date","null"] },
        failure_reason:  { bsonType: ["string","null"],
                           description: "e.g. 410 Gone — subscription expired" },
        ttl_seconds: {
          bsonType: "int",
          description: "How long push service holds message if device offline. Default 86400 (24h)."
        },
        created_at: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.push_notifications.createIndex({ user_id: 1 },                { name: "idx_pushnotifs_user" });
db.push_notifications.createIndex({ status: 1, created_at: -1 }, { name: "idx_pushnotifs_status" });
db.push_notifications.createIndex({ notification_id: 1 },        { sparse: true, name: "idx_pushnotifs_notif" });
// TTL: auto-delete logs older than 30 days
db.push_notifications.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 2592000, name: "ttl_pushnotifs_30d" }
);


// ============================================================
// 19. PUSH_TEMPLATES  (seeded below — 10 templates)
// Title/body/URL copy per notification type.
// {{variable}} placeholders replaced at send time.
// ============================================================
print("\n[19/23] Creating push_templates...");

setupCollection("push_templates", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["notification_type", "title_template", "body_template", "url_template", "ttl_seconds"],
      properties: {
        notification_type: { enum: ENUMS.notification_type },
        title_template:    { bsonType: "string" },
        body_template:     { bsonType: "string" },
        url_template:      { bsonType: "string" },
        ttl_seconds:       { bsonType: "int" },
        is_active:         { bsonType: "bool" }
      }
    }
  }
});

db.push_templates.createIndex({ notification_type: 1 }, { unique: true, name: "idx_pushtmpl_type" });


// ============================================================
// 20. VIBE_CARDS
// One per user — tracks last theme and share count.
// ============================================================
print("\n[20/23] Creating vibe_cards...");

setupCollection("vibe_cards", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id"],
      properties: {
        user_id:     { bsonType: "objectId" },
        last_theme:  { enum: ENUMS.vibe_card_theme },
        share_count: { bsonType: "int", minimum: 0 },
        last_shared: { bsonType: ["date","null"] },
        created_at:  { bsonType: "date" },
        updated_at:  { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.vibe_cards.createIndex({ user_id: 1 }, { unique: true, name: "idx_vibecards_user" });


// ============================================================
// 21. CHALLENGES
// 48-hour Flag Me challenge mode — one active at a time per user.
// ============================================================
print("\n[21/23] Creating challenges...");

setupCollection("challenges", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "handle_id", "variant", "started_at", "ends_at", "created_at"],
      properties: {
        user_id:    { bsonType: "objectId" },
        handle_id:  { bsonType: "objectId" },
        variant: {
          enum: ENUMS.challenge_variant,
          description: "1=Bold 2=Playful 3=Shaadi 4=Creator"
        },
        started_at: { bsonType: "date" },
        ends_at:    { bsonType: "date",
                      description: "started_at + 48 hours" },
        is_active:  { bsonType: "bool" },
        // Result snapshot when challenge ends
        red_count:   { bsonType: "int", minimum: 0 },
        green_count: { bsonType: "int", minimum: 0 },
        view_count:  { bsonType: "int", minimum: 0 },
        created_at:  { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.challenges.createIndex({ user_id: 1 },               { name: "idx_challenges_user" });
db.challenges.createIndex({ is_active: 1, ends_at: 1 }, { name: "idx_challenges_active_ends" });
// Only one active challenge per user at a time
db.challenges.createIndex(
  { user_id: 1 },
  {
    unique: true,
    partialFilterExpression: { is_active: true },
    name: "idx_challenges_one_active"
  }
);


// ============================================================
// 22. INVITES
// Referral tracking — who invited who.
// ============================================================
print("\n[22/23] Creating invites...");

setupCollection("invites", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["from_user_id", "invite_code", "created_at"],
      properties: {
        from_user_id: { bsonType: "objectId" },
        invite_code:  { bsonType: "string" },
        used_by:      { bsonType: ["objectId","null"] },
        used_at:      { bsonType: ["date","null"] },
        created_at:   { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.invites.createIndex({ from_user_id: 1 }, { name: "idx_invites_from" });
db.invites.createIndex({ invite_code: 1 },  { unique: true, name: "idx_invites_code" });
db.invites.createIndex({ used_by: 1 },      { sparse: true, name: "idx_invites_used_by" });


// ============================================================
// 23. RATE_LIMITS
// Simple key-based rate limiting store.
// TTL index auto-cleans entries after 1 hour.
// ============================================================
print("\n[23/23] Creating rate_limits...");

setupCollection("rate_limits");

db.rate_limits.createIndex({ key: 1, created_at: -1 }, { name: "idx_ratelimits_key" });
// TTL: auto-delete entries older than 1 hour
db.rate_limits.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 3600, name: "ttl_ratelimits_1hr" }
);


// ============================================================
// SEED DATA
// ============================================================

print("\n" + "=".repeat(60));
print(" Seeding reference data...");
print("=".repeat(60));


// ── RED FLAG CATEGORIES (16) ──────────────────────────────────

print("\nSeeding flag_categories...");
db.flag_categories.deleteMany({});
db.flag_categories.insertMany([

  // ── RED (16) ────────────────────────────────────────────────
  { flag_type: "red", name: "Ghosting / went silent",         sort_order: 1  },
  { flag_type: "red", name: "Love bombing",                   sort_order: 2  },
  { flag_type: "red", name: "Fake / catfish",                 sort_order: 3  },
  { flag_type: "red", name: "Catfished with AI photos",       sort_order: 4  },
  { flag_type: "red", name: "Scammer / fraud",                sort_order: 5  },
  { flag_type: "red", name: "Narcissistic behaviour",         sort_order: 6  },
  { flag_type: "red", name: "Emotionally unavailable",        sort_order: 7  },
  { flag_type: "red", name: "Manipulative",                   sort_order: 8  },
  { flag_type: "red", name: "Breadcrumbing",                  sort_order: 9  },
  { flag_type: "red", name: "Verbal abuse",                   sort_order: 10 },
  { flag_type: "red", name: "Stalking / obsessive behaviour", sort_order: 11 },
  { flag_type: "red", name: "Fake social media presence",     sort_order: 12 },
  { flag_type: "red", name: "Unsolicited explicit content",   sort_order: 13 },
  { flag_type: "red", name: "Rude / toxic behaviour",         sort_order: 14 },
  { flag_type: "red", name: "Cheated / dishonest",            sort_order: 15 },
  { flag_type: "red", name: "Racist / discriminatory",        sort_order: 16 },

  // ── GREEN (15) ──────────────────────────────────────────────
  { flag_type: "green", name: "Genuine & kind",               sort_order: 1  },
  { flag_type: "green", name: "Great communicator",           sort_order: 2  },
  { flag_type: "green", name: "Legit & honest",               sort_order: 3  },
  { flag_type: "green", name: "Super helpful",                sort_order: 4  },
  { flag_type: "green", name: "Great seller / buyer",         sort_order: 5  },
  { flag_type: "green", name: "Trustworthy",                  sort_order: 6  },
  { flag_type: "green", name: "Emotionally available",        sort_order: 7  },
  { flag_type: "green", name: "Emotionally mature",           sort_order: 8  },
  { flag_type: "green", name: "Consistent",                   sort_order: 9  },
  { flag_type: "green", name: "Respectful of boundaries",     sort_order: 10 },
  { flag_type: "green", name: "Great listener",               sort_order: 11 },
  { flag_type: "green", name: "Financially responsible",      sort_order: 12 },
  { flag_type: "green", name: "Family oriented",              sort_order: 13 },
  { flag_type: "green", name: "Socially aware",               sort_order: 14 },
  { flag_type: "green", name: "Goes above and beyond",        sort_order: 15 },

]);
print("  ✓ 31 flag categories inserted (16 red + 15 green)");


// ── CREDIBILITY WEIGHTS (15) ──────────────────────────────────

print("\nSeeding credibility_weights...");
db.credibility_weights.deleteMany({});
db.credibility_weights.insertMany([

  // Weight 5 — Highest credibility
  { relationship: "dated",         weight: 5, label: "Dated",                   emoji: "💔" },
  { relationship: "shaadi",        weight: 5, label: "Shaadi / arranged intro", emoji: "💍" },

  // Weight 4 — High credibility
  { relationship: "fwb",           weight: 4, label: "Friends with Benefits",   emoji: "🔥" },
  { relationship: "date",          weight: 4, label: "Went on a date",           emoji: "☕" },
  { relationship: "family",        weight: 4, label: "Family connection",        emoji: "👨‍👩‍👧" },
  { relationship: "college",       weight: 4, label: "College / school",         emoji: "🏫" },

  // Weight 3 — Medium credibility
  { relationship: "event",         weight: 3, label: "Met at event / party",     emoji: "🎉" },
  { relationship: "met",           weight: 3, label: "Met in person",            emoji: "🤝" },
  { relationship: "work",          weight: 3, label: "Work / business",          emoji: "💼" },
  { relationship: "bought",        weight: 3, label: "Bought / sold",            emoji: "🛍️" },
  { relationship: "gym",           weight: 3, label: "Gym / class / activity",  emoji: "🏋️" },

  // Weight 2 — Lower credibility
  { relationship: "neighbourhood", weight: 2, label: "Neighbourhood / locality", emoji: "🏘️" },
  { relationship: "datingapp",     weight: 2, label: "Dating app match",         emoji: "📲" },
  { relationship: "online",        weight: 2, label: "Followed online only",     emoji: "📱" },

  // Weight 1 — Lowest credibility
  { relationship: "heard",         weight: 1, label: "Heard through people",     emoji: "👂" },

]);
print("  ✓ 15 credibility weights inserted");


// ── PUSH TEMPLATES (10) ───────────────────────────────────────

print("\nSeeding push_templates...");
db.push_templates.deleteMany({});
db.push_templates.insertMany([

  {
    notification_type: "handle_searched",
    title_template:    "👀 {{count}} {{count == 1 ? 'person' : 'people'}} searched @{{handle}}",
    body_template:     "Reason: {{reason}}. Log in to see the full picture.",
    url_template:      "/login.php?searched={{count}}&handle={{handle}}&reason={{reason}}",
    ttl_seconds:       86400,
    is_active:         true
  },

  {
    notification_type: "new_flag_on_me",
    title_template:    "{{flag_type == 'red' ? '🚩' : '🟢'}} New {{flag_type}} flag on @{{handle}}",
    body_template:     "{{category}} · Posted {{timeframe}}",
    url_template:      "/flagdetail.php?handle={{handle}}&id={{flag_id}}",
    ttl_seconds:       86400,
    is_active:         true
  },

  {
    notification_type: "watched_handle_new_flag",
    title_template:    "{{flag_type == 'red' ? '🚩' : '🟢'}} New flag on @{{watched_handle}}",
    body_template:     "{{category}} — handle you're watching",
    url_template:      "/search.php?handle={{watched_handle}}",
    ttl_seconds:       86400,
    is_active:         true
  },

  {
    notification_type: "flag_reply",
    title_template:    "💬 Someone replied to your flag on @{{handle}}",
    body_template:     "\"{{reply_preview}}\"",
    url_template:      "/flagdetail.php?handle={{handle}}&id={{flag_id}}",
    ttl_seconds:       86400,
    is_active:         true
  },

  {
    notification_type: "both_sides_response",
    title_template:    "⚖️ @{{handle}} responded to your flag",
    body_template:     "They've added their perspective. See both sides.",
    url_template:      "/flagdetail.php?handle={{handle}}&id={{flag_id}}",
    ttl_seconds:       86400,
    is_active:         true
  },

  {
    notification_type: "challenge_result",
    title_template:    "⚡ Your 48h challenge ended",
    body_template:     "{{green_count}} green · {{red_count}} red · {{total}} total flags received",
    url_template:      "/flagme.php",
    ttl_seconds:       172800,
    is_active:         true
  },

  {
    notification_type: "flag_reported",
    title_template:    "⚑ Your flag has been reported",
    body_template:     "We're reviewing it. Reference: {{ref}}",
    url_template:      "/dashboard.php",
    ttl_seconds:       86400,
    is_active:         true
  },

  {
    notification_type: "flag_removed",
    title_template:    "🗑️ A flag you posted was removed",
    body_template:     "Removed following a valid grievance request. Reference: {{ref}}",
    url_template:      "/content-removed.php?ref={{ref}}",
    ttl_seconds:       86400,
    is_active:         true
  },

  {
    notification_type: "handle_claimed",
    title_template:    "✅ @{{handle}} is now linked to your account",
    body_template:     "{{flag_count}} flags already on your handle. See what people are saying.",
    url_template:      "/search.php?handle={{handle}}",
    ttl_seconds:       86400,
    is_active:         true
  },

  {
    notification_type: "email_verified",
    title_template:    "✅ Email verified — you're in",
    body_template:     "Welcome to Clocked. Start searching handles.",
    url_template:      "/onboarding.php",
    ttl_seconds:       3600,
    is_active:         true
  },

  // NOTE: challenge_update (live counter during 48h challenge)
  // is generated dynamically — no static template needed

]);
print("  ✓ 10 push templates inserted");


// ============================================================
// VERIFICATION — count everything
// ============================================================

print("\n" + "=".repeat(60));
print(" SETUP COMPLETE — Verification");
print("=".repeat(60));

const collections = [
  "users", "handles", "flag_categories", "credibility_weights",
  "flags", "flag_gossip", "flag_replies", "searches", "watches",
  "know_counts", "flag_requests", "notifications", "unsent_letters",
  "sessions", "grievances", "flag_reports", "push_subscriptions",
  "push_notifications", "push_templates", "vibe_cards", "challenges",
  "invites", "rate_limits"
];

print("\nCollections:");
collections.forEach(function(name) {
  const count = db.getCollection(name).countDocuments();
  const marker = count > 0 ? " (" + count + " docs seeded)" : "";
  print("  ✓ " + name + marker);
});

print("\nSeed data summary:");
print("  • flag_categories:   " + db.flag_categories.countDocuments() + " (16 red + 15 green)");
print("  • credibility_weights: " + db.credibility_weights.countDocuments() + " (all 15 relationship types)");
print("  • push_templates:    " + db.push_templates.countDocuments() + " notification types");

print("\nIndexes by collection:");
collections.forEach(function(name) {
  const idxCount = db.getCollection(name).getIndexes().length;
  print("  " + name + ": " + idxCount + " indexes");
});

print("\n" + "=".repeat(60));
print(" IMPORTANT APPLICATION-LAYER RULES");
print("=".repeat(60));
print("");
print("  MongoDB has no triggers or stored procedures.");
print("  Your application code MUST enforce:");
print("");
print("  1. VIBE SCORE — recalculate and update handles.stats");
print("     after every flag insert, update, or remove:");
print("     score = SUM(green.credibility_weight) /");
print("             SUM(all.credibility_weight) * 100");
print("");
print("  2. CREDIBILITY WEIGHT — look up credibility_weights");
print("     collection on flag insert and store the weight");
print("     directly on the flag document (denormalised).");
print("");
print("  3. EXPIRES_AT — set to created_at + 12 months");
print("     on every flag insert.");
print("");
print("  4. MAX 5 WATCHES — before inserting into watches,");
print("     check: db.watches.countDocuments({ user_id }) >= 5");
print("");
print("  5. HANDLES.STATS — increment search_count after every");
print("     insert into searches.");
print("");
print("  6. SELF-AWARE BADGE — after updating me_misunderstood");
print("     or me_pride, check if both are non-empty and set");
print("     users.self_aware_badge = true if so.");
print("");
print("  7. UNSENT LETTERS — encrypt content at application");
print("     layer before storing. Never store plaintext.");
print("");
print("  8. IP ADDRESSES — always SHA-256 hash + salt before");
print("     storing in searches.ip_hash. Never store raw IPs.");
print("");
print("  9. ANONYMOUS POSTING — posted_by is always stored.");
print("     anonymous only means it is hidden from other users.");
print("     It is never hidden from law enforcement.");
print("");
print("  10. DISPUTED FLAGS — after inserting a flag, check if");
print("      the flagged handle's owner has also flagged the");
print("      poster's handle. If yes, mark both flags as");
print("      is_disputed = true.");
print("");
print("=".repeat(60));
print(" Database: " + DB_NAME);
print(" Run file: mongosh <connection_string> --file clocked_mongo.js");
print("=".repeat(60));
