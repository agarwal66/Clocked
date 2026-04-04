const express = require('express');
const router = express.Router();
const MetaGroup = require('../models/MetaGroup');
const MetaItem = require('../models/MetaItem');
const ContentBlock = require('../models/ContentBlock');

// GET /api/meta
router.get('/', async (req, res) => {
  try {
    // Fetch from database
    const [groups, items, contentBlocks] = await Promise.all([
      MetaGroup.find({ active: true }).sort({ sort_order: 1 }).lean(),
      MetaItem.find({ active: true }).sort({ group_key: 1, sort_order: 1 }).lean(),
      ContentBlock.find({ active: true }).sort({ block_key: 1 }).lean()
    ]);

    // Transform database data to match the expected structure
    const metaData = {
      items: {},
      content: []
    };

    // Group items by group_key
    items.forEach(item => {
      if (!metaData.items[item.group_key]) {
        metaData.items[item.group_key] = [];
      }
      
      const itemData = {
        key: item.key,
        label: item.label
      };
      
      // Add optional fields if they exist
      if (item.short_label) itemData.short_label = item.short_label;
      if (item.description) itemData.description = item.description;
      if (item.icon) itemData.icon = item.icon;
      if (item.color_token) itemData.color_token = item.color_token;
      if (item.route) itemData.route = item.route;
      if (item.parent_key) itemData.parent_key = item.parent_key;
      if (item.weight !== undefined) itemData.weight = item.weight;
      if (item.metadata && Object.keys(item.metadata).length > 0) {
        itemData.metadata = item.metadata;
      }
      
      metaData.items[item.group_key].push(itemData);
    });

    // Transform content blocks
    contentBlocks.forEach(block => {
      metaData.content.push({
        block_key: block.block_key,
        content: block.content
      });
    });

    console.log('Meta data requested from database');
    res.json(metaData);
  } catch (error) {
    console.error('Meta data error:', error);
    res.status(500).json({
      error: 'Meta data fetch failed',
      message: 'Unable to fetch meta data. Please try again.'
    });
  }
});

module.exports = router;
