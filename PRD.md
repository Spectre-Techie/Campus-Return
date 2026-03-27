# Product Requirements Document: Local Lost & Found Campus

**Version:** 1.0  
**Date:** March 15, 2026  
**Status:** Active Development  
**Product Lead:** [Your Name]

---

## Executive Summary

**Local Lost & Found** is a hyper-local, community-driven digital board designed to solve the inefficiency of campus-wide lost-and-found systems. Unlike noisy social media platforms, our solution uses real-time, location-based inventory management combined with secure item claiming via knowledge verification.

**Key Value Proposition:**  
A student who loses their keys in "Library Room 302" finds matches in seconds, not days. Item finders upload photos with strategic detail blurring—only the original owner knows what to look for—eliminating false claims and maintaining community trust.

**Target Market:** College campuses (MVP), with secondary expansion to office buildings and apartment complexes

---

## Problem Statement

### Current State Inefficiencies
1. **Platform Noise:** Facebook Groups and general platforms mix campus-wide announcements with lost items, creating low discoverability
2. **Slow Response Time:** Items posted in broad groups rarely reach the right person before being discarded
3. **Security Risk:** Public item descriptions enable fraudulent claims
4. **No Location Context:** "I lost my wallet" generates 100+ generic results with no spatial reference

### Supporting Data
- Average time to recover lost items via social media: 2-7 days
- Success rate of social platform lost-and-found: ~15-20%
- Campus lost-and-found processing overhead: 20+ hours/week of manual categorization

---

## Product Vision

**Vision Statement:**  
Enable campus communities to recover lost items within hours through a transparent, trust-based system that combines location intelligence with photo authentication.

**Core Principles:**
- **Speed:** Real-time matching and notifications
- **Trust:** Knowledge-based verification prevents false claims
- **Simplicity:** Intuitive for users with zero technical background
- **Privacy:** Minimal required data, secure image handling

---

## Target Users & Use Cases

### Primary Users

#### 1. **Item Finders** (43% user base projected)
- Discover lost items on campus
- Upload photos and partial descriptions
- Track claim requests and communicate handoff details
- Goal: Help the community, minimal friction

**Use Case:** Sarah finds keys in the library bathroom. She uploads a photo without showing the full keychain, writes "set of keys, parking area badge" and marks location as "2nd floor women's bathroom, Library Building." System notifies all users who reported keys lost in that zone.

#### 2. **Item Losers** (57% user base projected)
- Search for lost items by category and location
- Receive notifications when matches appear
- Claim items by providing specific details (color, brand, unique markings)
- Complete handoff coordination
- Goal: Recover their belongings quickly

**Use Case:** Tom realizes his AirPods are missing. He logs into the app, searches "Electronics" in the "Library Building" zone from the past 2 hours, finds Sarah's post, and claims it by providing the serial number and scratched corner only he knows about.

### Secondary Users
- **Campus Administration:** Analytics dashboard reviewing system usage and identifying problem areas
- **Residential Life Staff:** Optional integration point for dorm-specific item management

---

## Product Features & Specifications

### Core Feature Set (MVP + Phase 2)

#### **1. Campus Building Map & Location Pins**
- **Description:** Interactive grid-based map showing campus buildings and rooms
- **MVP Scope:** 
  - 8-12 predefined building outlines
  - Room/zone level pinning (not GPS-precise, security by design)
  - Drag-to-click item placement
  
- **Phase 2:** GPS refinement, floor plans within buildings

- **Technical Requirements:**
  - Lightweight canvas rendering (avoid heavy map libraries)
  - Offline map data (no API dependency for map display)
  - Touch-friendly UI for mobile pinning

---

#### **2. Item Upload & Photo Handling**
- **Description:** Streamlined photo upload with intelligent detail management
- **MVP Scope:**
  - Single photo upload (primary item image)
  - Cloudinary integration for cloud storage & delivery
  - Optional "blur regions" tool (user selects areas to obscure)
  - Automatic image optimization (max 2MB, 1200px width)
  - Metadata stripping (EXIF removal for privacy)

- **Phase 2:** 
  - Multi-photo upload
  - AI-powered automatic object detection (identifies if photo contains phone, keys, wallet)
  - Advanced blurring with emphasis/pixelation

- **Technical Requirements:**
  - Client-side image compression
  - Cloudinary upload widget integration
  - Secure signed URLs for image delivery

---

#### **3. Category-Based Search & Filtering**
- **Description:** Browse lost items through structured taxonomy
- **MVP Scope:**
  - 7 core categories:
    - Electronics (phones, laptops, audio devices)
    - Keys & Accessories
    - Bags & Wallets
    - Documents & ID
    - Clothing & Shoes
    - Personal Items (jewelry, glasses)
    - Other
  
  - Search operators:
    - Filter by category
    - Filter by location (building or room zone)
    - Filter by time posted (last hour, last 24 hours, last week)
    - Full-text search on descriptions

- **Phase 2:** 
  - Saved searches
  - Smart recommendations ("Items found near your frequently used locations")
  - Similarity search (find similar items to your lost item)

---

#### **4. Claim & Verification System**
- **Description:** Knowledge-based authentication to prevent false claims
- **MVP Scope:**
  - Item page displays blurred photo and public description
  - "Claim" button opens modal with verification questions:
    - "Describe a detail visible only to you (e.g., brand, color, specific markings)"
    - Finder reviews response privately, judges authenticity
  - If verified: Chat channel opens, coordinates handoff
  - If rejected: No notification sent to loser, item remains available

- **Phase 2:** 
  - Automated hint system (progressively reveal image details if claim disputes arise)
  - Review/rating system for claim accuracy
  - Timeout mechanism (unclaimed items expire after 30 days)

---

#### **5. Real-Time Notifications**
- **MVP Scope:**
  - Browser push notifications (if user opts in)
  - In-app notification bell with badge count
  - Notification types:
    - New matching item found (filtered by your saved categories/locations)
    - Claim request received
    - Claim approved/rejected
    - Direct messages from finder/loser

- **Phase 2:** 
  - Email digest (daily/weekly)
  - SMS notifications for high-priority items
  - Telegram bot integration

---

#### **6. Direct Messaging & Handoff Coordination**
- **MVP Scope:**
  - Claim → triggers creation of private chat thread
  - Simple text-based messages only
  - Message history preserved
  - No phone number or email required (chat contained within app)
  - Suggested handoff locations (campus coffee shop, building lobby, etc.)

- **Phase 2:** 
  - Video call integration
  - Rating & review (trustworthiness score)

---

#### **7. User Profiles & History**
- **MVP Scope:**
  - Minimal profile: Display name, profile picture (optional), join date
  - Public history: Items found/recovered by this user (optional privacy toggle)
  - Trust indicator: "✓ Verified 5 item recoveries" badge

- **Phase 2:** 
  - Reputation scoring
  - User badges ("Campus Hero," "Quick Response")
  - Account linking (college email verification for enhanced trust)

---

#### **8. Admin Dashboard** (Campus Admin)
- **MVP Scope:**
  - View total items posted/claimed
  - Search for specific items or users
  - Report/remove inappropriate content
  - Basic usage analytics (items per category, busiest buildings)

- **Phase 2:** 
  - Heatmaps (which buildings have highest loss rates)
  - Predictive analytics (peak loss times)
  - Email export reports

---

### Non-Core Features (Explicitly Out of Scope - MVP)
- GPS tracking
- QR code item tagging
- Automatic photo categorization via AI
- Integration with campus security systems
- Payment processing (this is free)
- Mobile app (web-first, responsive design)

---

## Technical Architecture Overview

### Technology Stack
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + TypeScript | Fast iteration, component reusability |
| **Styling** | Tailwind CSS | Rapid UI development, mobile-first |
| **Backend** | Node.js (Express) | Non-blocking I/O for notifications |
| **Database** | PostgreSQL | Relational data (users, items, claims) |
| **Real-Time** | Socket.io | WebSocket fallback for notifications |
| **File Storage** | Cloudinary | Free tier supports 25GB/month, API-first |
| **Hosting** | Vercel (frontend) + Railway/Render (backend) | Free tier sufficient for MVP |
| **Auth** | NextAuth or Firebase | Passwordless (email link) for simplicity |

### Data Model (Conceptual)
```
Users
├── id (PK)
├── email (unique)
├── display_name
├── profile_picture_url (Cloudinary)
├── created_at
└── trust_score

Items
├── id (PK)
├── finder_id (FK → Users)
├── category (enum: Electronics, Keys, Bags, etc.)
├── description (blurred version)
├── photo_url (Cloudinary)
├── location_zone (room/building reference)
├── posted_at (timestamp)
├── expires_at (30 days from posted_at)
└── status (active, claimed, expired)

Claims
├── id (PK)
├── item_id (FK → Items)
├── loser_id (FK → Users)
├── verification_attempt (the detail they provided)
├── status (pending, approved, rejected)
├── created_at
└── resolved_at

Messages
├── id (PK)
├── claim_id (FK → Claims)
├── sender_id (FK → Users)
├── content (text message)
├── created_at
└── read_at (NULL if unread)
```

---

## User Experience Flow

### New User Onboarding
1. User lands on homepage → sees demo map with sample items
2. Click "Sign In" → email entry → sign-in link emailed
3. Click link → redirected to app, creates display name + optional photo
4. Tutorial carousel (3 screens): How to find items, how to post items, how to claim
5. User can immediately start searching or posting

**Friction Points Minimized:**
- No password creation or complex registration
- Suggested actions visible immediately
- Search populated with recent items automatically

### Finding a Lost Item Flow
1. User clicks "Search" or sees "New Matches" notification
2. Refine search: category filter, location filter, time filter
3. Browse item cards (photo blurred on thumbnail)
4. Click item → full view with description (photo still strategically blurred)
5. Click "This is Mine" → enter verification detail
6. Success! → Chat opens to coordinate pickup
7. Message finder, agree on location/time
8. After pickup: option to rate transaction, finder receives reputation boost

### Posting a Found Item Flow
1. User clicks "Post Item"
2. Take/upload photo → auto-optimized and uploaded to Cloudinary
3. Optional: Use blur tool to hide identifying marks
4. Select category from dropdown
5. Click on map to set location
6. Enter basic description: "Set of keys with blue keychain, parking badge attached"
7. Submit → item goes live, notifications sent to subscribers
8. Optional: Copy shareable link to post in group chat

---

## Success Metrics

### Phase 1 Launch (Months 1-3)
| Metric | Target | Baseline |
|--------|--------|----------|
| Active Users | 500+ | 0 |
| Items Posted | 100/week | 0 |
| Claim Success Rate | >60% | — |
| Avg. Time to Recovery | <24 hours | 3-7 days |
| User Retention (D30) | >40% | — |

### Phase 2 Growth (Months 4-6)
| Metric | Target | Baseline |
|--------|--------|----------|
| Active Users | 2,000+ | 500 |
| Items Posted | 400/week | 100/week |
| Claim Success Rate | >75% | 60% |
| NPS Score | >50 | — |

---

## Roadmap

### MVP (Weeks 1-8)
- ✅ Basic item posting (photo + description)
- ✅ Map-based pinning
- ✅ Search & filtering
- ✅ Claim verification system
- ✅ In-app messaging
- ✅ User profiles
- 🚀 Public beta launch

### Phase 2 (Weeks 9-16)
- 📋 Multi-photo upload
- 📋 AI object detection for auto-categorization
- 📋 Admin dashboard with analytics
- 📋 Reputation/review system
- 📋 GPS refinement

### Phase 3 (Months 6+)
- 📋 Mobile app (iOS/Android)
- 📋 Multiple campus support (expand beyond initial campus)
- 📋 Integration with campus lost-and-found office

---

## Pricing Model

**MVP Launch:** Completely free for all users.

**Post-Launch Monetization (Optional, not in scope):**
- Freemium model: Campus admins can pay for premium analytics
- Sponsored listings: Campus Facilities could list maintenance-related items
- B2B expansion: Licensing to office buildings/apartment complexes

---

## Risk Analysis

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Low user adoption | High | Early beta with campus influencers, incentive (raffle entry) |
| Fraudulent claims | Medium | Knowledge-based verification, reputation system |
| Image hosting costs escalate | Low | Cloudinary free tier sustainable for MVP scale; upgrade plan ready |
| Server downtime during peak hours | Medium | Auto-scaling on Render, monitoring setup |
| Privacy concerns (location data) | Medium | Room-level only (not GPS), EXIF stripping, privacy policy transparent |
| Competition from Facebook Groups | Medium | Differentiate on speed (24-hour claim rate vs. days) and UX simplicity |

---

## Compliance & Privacy

### Data Retention
- User data: Retained indefinitely until account deletion
- Item data: Auto-deleted 30 days after posting
- Messages: Retained indefinitely (archived after claim resolution)
- Images: Deleted when item expires

### Privacy Policy Highlights
- No location tracking outside item pinning
- Images stored on Cloudinary (GDPR compliant)
- Optional college email verification (phased approach)
- User can request all data export (GDPR/CCPA)
- Password-free login (email-only)

### Accessibility
- WCAG 2.1 AA compliance target
- Keyboard-navigable map
- Image alt text on all uploads
- Color-blind friendly category indicators

---

## Go-To-Market Strategy

### Launch Phase (Week 1-2)
- Beta access to 50 student ambassadors
- Incentive: T-shirts with app logo for first 100 items claimed
- Social media campaign (Instagram, TikTok shorts showing use cases)

### Growth Phase (Week 3-8)
- Presence at campus clubs fair
- Campus email announcement from Dean of Students
- Resident life integration (incentive for posting found items in dorms)
- Partner with campus newspaper for feature article

### Sustaining Phase (Month 3+)
- Monthly campus spotlight: "Item Recovery Hero"
- Analytics shared with campus admin (show ROI on efficiency gains)
- Collect testimonials for case studies

---

## Glossary & Definitions

- **Claim:** Action taken by a loser to assert ownership of a posted item
- **Verification:** Process of proving ownership through knowledge-based Q&A
- **Blurred Description:** Photo or text with identifying details obscured from public view
- **Finder:** User who discovered a lost item and posted it
- **Loser:** User seeking recovery of their lost item
- **Zone:** A specific room or section of a building (e.g., "Library 2nd Floor")

---

## Appendix: Sample Use Case Scenarios

### Scenario 1: Lost AirPods
**Time: Tuesday, 2:45 PM**
- **Tom's Experience:** Realizes AirPods missing after class. Opens app. Searches "Electronics" in "Engineering Building, Room 304" from last 2 hours. Finds photo of identical AirPods posted 15 minutes ago by Sarah. Claims item with verification: "Serial number ends in 7F22, right earbud has small crack." Sarah sees claim, recognizes detail, approves. Chat opens. Tom arrives 10 minutes later to pick up from Sarah's friend in the quad. **Total time: 25 minutes. Success rate: 100%**

### Scenario 2: Lost Wallet
**Time: Friday, 11:20 AM**
- **Mike's Experience:** Posts photo of found brown leather wallet in Men's Bathroom, Library. Immediately receives notification from system that 2 users recently reported lost wallets. First claim: "It's a Fossil brand with $200 cash." Mike carefully reviews—the photo is blurred and doesn't show brand, so he rejects. Second claim: "Brown Fossil wallet, has photo of my dog in the ID section." Mike checks his blurred image, this sounds right. Approves. **Finder (Mike) gains reputation boost. Loser recovers wallet with all belongings intact.**

### Scenario 3: False Claim Prevention
**Time: Sunday, 6:30 PM**
- **David Claims False Item:** David finds headphones post, doesn't own headphones but claims it anyway saying "Apple AirMax Pro Max." Finder Sarah rejects (headphones aren't Apple brand). System flags David for suspicious activity after 2 rejected claims. Subsequent claims from David trigger internal review. **Verification system prevents false claims and protects finder reputation.**

---

## Contact & Next Steps

**Questions or feedback? Contact:** [Your Email]

**Next Phase:** Stakeholder review and approval of technical specification

---

**Document History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Mar 15, 2026 | [Name] | Initial PRD draft, approved for development |
