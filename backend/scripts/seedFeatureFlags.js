const mongoose = require('mongoose');
const FeatureFlag = require('../models/FeatureFlag');

// Load environment variables
require('dotenv').config();

async function seedFeatureFlags() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    const flags = [
      { 
        key: "enable_both_sides", 
        label: "Enable Both Sides", 
        description: "Allow both-sides responses to flags", 
        active: true, 
        scope: "global",
        metadata: {
          rollout_percentage: 100,
          launch_date: "2026-03-31"
        }
      },
      { 
        key: "enable_claim_profile", 
        label: "Enable Claim Profile", 
        description: "Allow users to claim unclaimed handles", 
        active: true, 
        scope: "global",
        metadata: {
          rollout_percentage: 100,
          launch_date: "2026-03-31"
        }
      },
      { 
        key: "enable_flag_requests", 
        label: "Enable Flag Requests", 
        description: "Allow public flag requests on handles", 
        active: true, 
        scope: "global",
        metadata: {
          rollout_percentage: 100,
          launch_date: "2026-03-31"
        }
      },
      { 
        key: "enable_advanced_search", 
        label: "Enable Advanced Search", 
        description: "Advanced search filters and sorting", 
        active: false, 
        scope: "beta",
        metadata: {
          rollout_percentage: 20,
          beta_users: ["admin@clocked.in"]
        }
      },
      { 
        key: "enable_ai_moderation", 
        label: "Enable AI Moderation", 
        description: "AI-powered content moderation", 
        active: false, 
        scope: "admin",
        metadata: {
          model: "gpt-4",
          confidence_threshold: 0.8
        }
      },
      { 
        key: "enable_analytics_dashboard", 
        label: "Enable Analytics Dashboard", 
        description: "Comprehensive analytics dashboard for admins", 
        active: true, 
        scope: "admin",
        metadata: {
          refresh_interval: 300,
          cache_duration: 60
        }
      },
      { 
        key: "enable_bulk_operations", 
        label: "Enable Bulk Operations", 
        description: "Bulk moderation operations for admins", 
        active: true, 
        scope: "admin",
        metadata: {
          max_bulk_size: 100
        }
      },
      { 
        key: "enable_real_time_notifications", 
        label: "Enable Real-time Notifications", 
        description: "Real-time push notifications", 
        active: true, 
        scope: "global",
        metadata: {
          websocket_enabled: true,
          push_service: "fcm"
        }
      },
      { 
        key: "enable_content_reports", 
        label: "Enable Content Reports", 
        description: "User reporting system for inappropriate content", 
        active: true, 
        scope: "global",
        metadata: {
          auto_escalation_threshold: 5,
          review_time_limit: 24
        }
      },
      { 
        key: "enable_search_logging", 
        label: "Enable Search Logging", 
        description: "Log all handle searches for analytics", 
        active: true, 
        scope: "global",
        metadata: {
          retention_days: 90,
          anonymize_after_days: 30
        }
      }
    ];

    // Create feature flags
    for (const flag of flags) {
      await FeatureFlag.updateOne(
        { key: flag.key }, 
        { $set: flag }, 
        { upsert: true }
      );
      console.log(`✅ Seeded feature flag: ${flag.key} (${flag.active ? 'ACTIVE' : 'INACTIVE'})`);
    }

    console.log('✅ Feature flags seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding feature flags:', error);
    process.exit(1);
  }
}

// Run the function
seedFeatureFlags();
