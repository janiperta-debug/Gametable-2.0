# Gaming Community App - Full Implementation Roadmap

## Current Status
- ✅ Database schema created (Supabase)
- ✅ Mock data removed from UI
- 🔲 Authentication not implemented
- 🔲 Services not implemented
- 🔲 Data not yet migrated from Firebase

## Path to Production - 5 Main Phases

### Phase 1: Authentication & User Management (Priority: CRITICAL)
**Effort: 2-3 days**

#### Tasks:
1. **Set up Supabase Auth**
   - Enable email/password authentication in Supabase dashboard
   - Configure redirect URLs for local and production
   - Set up email templates (welcome, password reset)

2. **Create Auth Context** (`lib/auth-context.tsx`)
   - User session management
   - Sign up, sign in, sign out functions
   - Session persistence across page reloads

3. **Build Auth Pages**
   - Sign up page (`app/auth/signup/page.tsx`)
   - Sign in page (`app/auth/signin/page.tsx`)
   - Password reset page (`app/auth/reset-password/page.tsx`)
   - Protected route wrapper

4. **User Profile Setup**
   - Auto-create user_profiles entry on signup
   - Profile completion flow
   - Profile editing

**Result:** Users can register and log in

---

### Phase 2: Core Services Layer (Priority: CRITICAL)
**Effort: 3-4 days**

Build service functions to interact with database. Pattern for all services:

```typescript
// lib/services/user-service.ts
import { supabase } from '@/lib/supabase';

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### Services to Create:

1. **User Service** (`lib/services/user-service.ts`)
   - Get profile
   - Update profile
   - Get user stats (games, friends, events hosted)
   - Search users by location/interests

2. **Game Service** (`lib/services/game-service.ts`)
   - Get all games
   - Get user's game collection
   - Add game to collection
   - Remove game from collection
   - Add/remove from wishlist
   - Search games

3. **Event Service** (already started)
   - Get user's events
   - Get public events
   - Create event
   - Update event
   - Join/leave event
   - Get attendees

4. **Conversation Service** (`lib/services/conversation-service.ts`)
   - Get user's conversations
   - Get conversation messages
   - Send message
   - Mark as read
   - Create new conversation

5. **Notification Service** (`lib/services/notification-service.ts`)
   - Get notifications
   - Mark as read
   - Delete notification
   - Create notification (called by other services)

6. **Badge Service** (`lib/services/badge-service.ts`)
   - Get user's badges
   - Award badge (internal function)
   - Get all badges
   - Track achievements

7. **Friend Service** (`lib/services/friend-service.ts`)
   - Get friends list
   - Send friend request
   - Accept/decline friend request
   - Block user

**Result:** All database operations available as functions

---

### Phase 3: Connect Components to Services (Priority: HIGH)
**Effort: 3-4 days**

Replace hardcoded data with service calls using `useEffect` pattern:

```typescript
'use client'

import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/services/user-service';

export function UserProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!profile) return <p>No profile found</p>;

  return <div>{/* Render profile */}</div>;
}
```

#### Pages to Update:

1. **Messages** (`app/messages/page.tsx`)
   - Fetch conversations
   - Fetch messages for selected conversation
   - Send message real-time

2. **Notifications** (`app/notifications/page.tsx`)
   - Fetch notifications
   - Mark as read
   - Handle actions (join event, accept friend, etc.)

3. **Marketplace** (`app/marketplace/page.tsx`)
   - Fetch listings
   - Fetch user wishlists
   - Filter and search

4. **Find Players** (`app/find-players/page.tsx`)
   - Fetch users with filters
   - Display profiles

5. **Events** (`app/events/page.tsx` and `[id]/page.tsx`)
   - Fetch user's events
   - Fetch public events
   - View event details
   - Join/leave event

6. **Profile** (`app/profile/[userId]/page.tsx`)
   - Fetch user profile
   - Fetch user's games
   - Fetch user's badges
   - Fetch activity

7. **Collection** (`app/collection/page.tsx`)
   - Fetch user's game collection
   - Add/remove games
   - Edit notes/condition

8. **Components**
   - ProfileHeader - fetch actual user data
   - ProfileStats - calculate from database
   - UpcomingEvents - fetch from events table
   - FriendActivity - fetch from activity_log

**Result:** All pages show real data from Supabase

---

### Phase 4: Data Migration from Firebase (Priority: HIGH)
**Effort: 1-2 days**

#### Step 1: Export Firebase Data
```bash
# Use Firebase CLI or Firestore export
firebase emulators:export ./firebase-backup
```

#### Step 2: Create Migration Script
```typescript
// scripts/migrate-firebase-to-supabase.ts
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const firebaseApp = admin.initializeApp();
const db = admin.firestore();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function migrateUsers() {
  const users = await db.collection('userProfiles').get();

  for (const doc of users.docs) {
    const userData = doc.data();

    // Insert into Supabase
    await supabase.from('user_profiles').insert({
      id: doc.id,
      name: userData.name,
      location: userData.location,
      avatar_url: userData.profilePicture,
      bio: userData.bio,
      created_at: userData.createdAt?.toDate(),
      updated_at: userData.updatedAt?.toDate(),
    });
  }
}

export async function migrateGames() {
  // Get all games from user collections
  // Map to Supabase format
  // Handle relationships
}

export async function migrateEvents() {
  // Similar pattern
}

// Run all migrations
async function runMigration() {
  console.log('Starting migration...');
  await migrateUsers();
  await migrateGames();
  await migrateEvents();
  console.log('Migration complete!');
}

runMigration().catch(console.error);
```

#### Step 3: Data Mapping
Map Firebase structure to Supabase:

```
Firebase                          Supabase
================================  ================================
users collection                  auth.users + user_profiles table
  └─ user/{id}                      ├─ id (auth.users.id)
     ├─ email                       ├─ name
     ├─ name                        ├─ location
     ├─ location                    ├─ avatar_url
     ├─ avatar                      └─ bio
     └─ bio

userProfiles/{id}/games           user_games table
  └─ game/{id}                      ├─ user_id
     ├─ title                       ├─ game_id
     ├─ owned: true/false           ├─ owned
     └─ wishlist: true/false        ├─ wishlist

events collection                 events table
  └─ event/{id}                     ├─ id
     ├─ title                       ├─ title
     ├─ date                        ├─ date
     ├─ attendees: []               ├─ attendees
     └─ createdBy                   └─ created_by

messages collection               messages table
  └─ msg/{id}                       ├─ id
     ├─ senderId                    ├─ sender_id
     ├─ content                     ├─ content
     └─ timestamp                   └─ timestamp
```

#### Step 4: Run Migration
```bash
# Set environment variables
export FIREBASE_PROJECT_ID=your_project
export SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key

# Run migration
ts-node scripts/migrate-firebase-to-supabase.ts
```

#### Step 5: Verify
- Count records in Firebase vs Supabase
- Spot-check data accuracy
- Test relationships

**Result:** All data migrated to Supabase

---

### Phase 5: Polish & Testing (Priority: MEDIUM)
**Effort: 2-3 days**

1. **Real-time Updates**
   - Implement Supabase subscriptions for messages
   - Notifications should appear instantly
   - Activity feed updates in real-time

2. **Error Handling**
   - Network errors
   - Authentication errors
   - Data validation errors

3. **Loading States**
   - Skeleton loaders
   - Spinners
   - Empty states

4. **Performance**
   - Optimize queries with indexes
   - Implement pagination
   - Cache user data

5. **Testing**
   - Unit tests for services
   - Integration tests for pages
   - E2E tests with real data

6. **Security**
   - Verify RLS policies work
   - Test with different user roles
   - Validate input sanitization

**Result:** Production-ready application

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Next.js App (Frontend)              │
│  ┌────────────────┐  ┌──────────────────┐  │
│  │   Components   │  │   Pages          │  │
│  │   (UI)         │  │   (Routes)       │  │
│  └────────┬───────┘  └────────┬─────────┘  │
│           │                   │             │
│           └─────────┬─────────┘             │
│                     │                       │
│         ┌───────────┴──────────┐            │
│         │ Auth Context         │            │
│         │ Services Layer       │            │
│         └───────────┬──────────┘            │
└─────────────────────┼──────────────────────┘
                      │
                      │ Supabase SDK
                      │
┌─────────────────────┼──────────────────────┐
│  Supabase           │                      │
│  ┌──────────────────┴─────────────────┐   │
│  │    PostgreSQL Database             │   │
│  │  ┌─────────────────────────────┐   │   │
│  │  │ Tables:                     │   │   │
│  │  │ - user_profiles             │   │   │
│  │  │ - games                     │   │   │
│  │  │ - user_games                │   │   │
│  │  │ - events                    │   │   │
│  │  │ - messages                  │   │   │
│  │  │ - conversations             │   │   │
│  │  │ - notifications             │   │   │
│  │  │ - badges                    │   │   │
│  │  │ - user_badges               │   │   │
│  │  │ - friends                   │   │   │
│  │  │ - activity_log              │   │   │
│  │  └─────────────────────────────┘   │   │
│  │                                     │   │
│  │ Auth Service (Email/Password)      │   │
│  │ RLS Policies (Row Level Security)   │   │
│  └─────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## Technology Benefits: Supabase vs Firebase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| **Database** | NoSQL (Firestore) | PostgreSQL (SQL) |
| **Queries** | Limited, map-reduce style | Full SQL power |
| **Relationships** | Manual handling | Foreign keys, joins |
| **Cost Scaling** | Per read/write | Predictable base + usage |
| **Real-time** | WebSocket listeners | Postgres LISTEN/NOTIFY |
| **Auth** | Proprietary | Standards-based (Postgres) |
| **Row-level Security** | JSON rules | SQL policies |
| **Migration Path** | Vendor lock-in | Easy migration |
| **Developer Experience** | Simple for small apps | Powerful for complex apps |

**Why Supabase is better for this app:**
- Relational data (friends, messages, collections) → PostgreSQL shines
- Complex queries (find nearby players, game recommendations) → SQL is superior
- RLS policies for security → More transparent than Firebase rules
- Cost-effective at scale
- Open source foundation (Postgres)

---

## Implementation Priority Order

**Week 1 (MVP):**
1. Auth system
2. User profiles
3. Game collection
4. Events system

**Week 2:**
5. Messaging
6. Notifications
7. Badges/achievements

**Week 3:**
8. Marketplace
9. Friend system
10. Activity feed

**Week 4:**
11. Real-time updates
12. Polish and optimization
13. Data migration
14. Launch

---

## Environment Setup Checklist

```bash
# Local environment (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For migration script only
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY_ID=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-xxx@...
```

---

## Success Metrics

✅ Users can sign up and log in
✅ Users can add games to their collection
✅ Users can create and join events
✅ Users can message each other
✅ Users receive notifications
✅ All data persists across sessions
✅ No hardcoded mock data
✅ Fast load times (<3s)
✅ Mobile responsive
✅ Production deployed

---

## Next Steps

1. Start with Phase 1 (Auth) - most critical
2. Once auth works, implement Phase 2 (Services)
3. Connect components in Phase 3
4. Migrate data in Phase 4
5. Polish and launch in Phase 5

Would you like me to start implementing any specific phase?
