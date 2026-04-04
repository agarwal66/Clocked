const express = require('express');
const router = express.Router();

// GET /api/home - Load homepage data
router.get('/', async (req, res) => {
  try {
    console.log('🏠 Backend: Loading homepage data...');
    
    // Mock data for now - replace with real data later
    const homeData = {
      slides: [
        { id: 1, imageUrl: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1600&auto=format&fit=crop&q=80" },
        { id: 2, imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1600&auto=format&fit=crop&q=80" },
        { id: 3, imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1600&auto=format&fit=crop&q=80" },
        { id: 4, imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1600&auto=format&fit=crop&q=80" },
      ],
      hero: {
        badge: "India's first community-powered handle intelligence platform",
        title: "Know the vibe before you invest.",
        subtitle: "Search any Instagram handle. See real community flags. Drop your own receipts. Anonymous or not — your call.",
      },
      reasons: ["👀 Going on a date", "💍 Shaadi", "🔥 Friends with Benefits", "🛍️ Buying from them", "💼 Work collab", "🤝 Just curious"],
      stats: { 
        handlesSearched: 12847, 
        redFlagsDropped: 4203, 
        greenFlagsDropped: 8941 
      },
      trustPoints: ["See red and green flags", "Post anonymously or publicly", "View both sides when available"],
      recentFlags: [
        { id: 1, type: "red", handle: "rohanverma__", category: "Love bombing", anonymous: true, comment: "Came on incredibly strong the first two weeks. Texting all day, future planning, then completely disappeared. Classic pattern.", relation: "💔 Dated", timeframe: "📅 1–6 months ago", locationLabel: "📍 Mumbai", postedAtLabel: "2h ago" },
        { id: 2, type: "green", handle: "priyasingh.art", category: "Genuine & kind", anonymous: false, comment: "Bought a painting from her. Packed beautifully, delivered on time, responded to every message. 100% recommend her.", relation: "🛍️ Bought/sold", timeframe: "📅 This month", locationLabel: "📍 Delhi", postedAtLabel: "4h ago" },
        { id: 3, type: "red", handle: "aarav.k", category: "Ghosting", anonymous: true, comment: "After 3 months of talking daily, just stopped replying. No explanation, no closure. Left on read forever.", relation: "☕ Went on a date", timeframe: "📅 Over a year ago", locationLabel: "📍 Bangalore", postedAtLabel: "6h ago" },
        { id: 4, type: "green", handle: "mehak.designs", category: "Great communicator", anonymous: false, comment: "Worked with her on a freelance project. Always on time, extremely professional. Would hire again without hesitation.", relation: "💼 Work/business", timeframe: "📅 This month", locationLabel: "📍 Pune", postedAtLabel: "8h ago" },
        { id: 5, type: "red", handle: "the.samarth", category: "Fake / catfish", anonymous: true, comment: "Profile photos don't match the person at all. Met in person and it was a completely different individual. Wasted an evening.", relation: "☕ Went on a date", timeframe: "📅 This week", locationLabel: "📍 Mumbai", postedAtLabel: "12h ago" },
        { id: 6, type: "green", handle: "neel.photo", category: "Legit & honest", anonymous: false, comment: "Hired for event photography. Delivered everything on time, no hidden charges. Incredibly talented and honest person.", relation: "💼 Work/business", timeframe: "📅 Last month", locationLabel: "📍 Delhi", postedAtLabel: "1d ago" },
      ],
      trendingHandles: [
        { id: 1, handle: "rohanverma__", red: 14, green: 3 },
        { id: 2, handle: "aarav.k", red: 11, green: 7 },
        { id: 3, handle: "mehak.designs", red: 2, green: 19 },
        { id: 4, handle: "the.samarth", red: 9, green: 1 },
        { id: 5, handle: "priyasingh.art", red: 0, green: 22 },
      ],
      howItWorks: [
        { id: 1, title: "Search any handle", text: "Choose why you're looking them up — date, shaadi, FWB, work or just curious." },
        { id: 2, title: "See community receipts", text: "Real flags weighted by how well people actually knew them." },
        { id: 3, title: "Drop your own flag", text: "Post anonymously or with your handle. Your choice, always." },
      ],
      flagMe: { 
        title: "Flag me up 🚩🟢", 
        subtitle: "Share your handle. Let the community check your vibe. Brave souls only.", 
        ctaLabel: "Generate my card →" 
      },
    };

    console.log('✅ Backend: Homepage data loaded successfully');
    res.json(homeData);

  } catch (error) {
    console.error('❌ Backend: Error loading homepage data:', error);
    res.status(500).json({
      error: 'Failed to load homepage data',
      message: 'Unable to load homepage. Please try again.'
    });
  }
});

module.exports = router;
