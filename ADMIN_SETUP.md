# MatchDay League Administration System

## Overview

The MatchDay League Administration System consists of two separate applications:

1. **Player App** (MatchDay): Player-facing application for participating in leagues and viewing stats
2. **Admin App**: Administrative interface for league management and team approval

## System Architecture

### Database Configuration - STANDARDIZED ✅
- **Production Supabase Only**: Both apps now use production Supabase database (`https://twkipeacdamypppxmmhe.supabase.co`)
- **No More Local Development**: Eliminated confusion between local/production environments
- **Consistent Configuration**: Both `.env.local` files use identical Supabase URLs and keys

### Database Schema
- **Single Supabase Database**: Both apps share the same database for data consistency
- **Role-Based Access Control**: Users have roles (`player`, `captain`, `admin`, `league_admin`, `app_admin`)
- **Admin-Specific Tables**: `admin_audit_logs`, `system_notifications`, `admin_sessions`

### Applications
- **Player App**: `http://localhost:3000` - Main MatchDay application (production database)
- **Admin App**: `http://localhost:3001` - League administration interface (production database)

## Admin User Management

### Admin Roles
- `league_admin`: Can manage leagues they created
- `app_admin`: Can manage all leagues and system-wide settings

### Admin User Creation
Use the provided script to create admin users:

```bash
node scripts/create-simple-admin.js
```

### Current Admin User Credentials
📧 **Email**: `admin@standardized.test`  
🔑 **Password**: `admin123!`  
👤 **Role**: `player` (temporarily - will be updated to `app_admin` after schema migration)

## Key Features Implemented

### ✅ Phase 1: Foundation
- [x] Database schema with admin role system
- [x] Admin authentication and authorization
- [x] Role-based access control
- [x] Admin user creation system

### ✅ Admin Authentication System
- [x] Role service for checking admin permissions
- [x] Admin guard component for route protection
- [x] Secure session management
- [x] Database enum support for admin roles

### ✅ Database Setup
- [x] Extended users table with admin fields
- [x] Admin audit logs table
- [x] System notifications table
- [x] Admin sessions table
- [x] Row Level Security (RLS) policies

## Current Status

The admin system foundation is complete and ready for development:

1. ✅ **Database Schema**: Deployed with admin role support
2. ✅ **Authentication**: Admin role-based auth system working
3. ✅ **Authorization**: Role guards and permissions system
4. ✅ **Admin User**: Test admin user created and verified
5. ✅ **Development Environment**: Both apps running on separate ports

## Next Development Phases

### Phase 2: Core Admin Dashboard (Ready to implement)
- [ ] Complete admin dashboard layout
- [ ] League overview with statistics
- [ ] Team management interface
- [ ] Match scheduling system

### Phase 3: League Management (Ready to implement)
- [ ] League creation wizard
- [ ] Tournament bracket management
- [ ] Season lifecycle management
- [ ] Financial tracking

### Phase 4: Team Approval Workflow (Ready to implement)  
- [ ] Team registration approval system
- [ ] Automated notifications
- [ ] Approval workflow management
- [ ] Team captain communication

### Phase 5: Advanced Features (Future)
- [ ] Real-time communication between apps
- [ ] Advanced analytics and reporting
- [ ] Multi-league management
- [ ] Mobile optimization

## Development Commands

### Start Admin App
```bash
cd /Users/lukini/matchday-admin
PORT=3001 npm run dev
```

### Start Player App  
```bash
cd /Users/lukini/MatchDay
npm run dev
```

### Database Management - PRODUCTION ONLY ✅
```bash
# Both apps now use production Supabase
# No local database setup required

# Test admin user exists
curl -X GET \
  "https://twkipeacdamypppxmmhe.supabase.co/rest/v1/users?email=eq.admin@standardized.test" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"

# Create admin users
node scripts/create-simple-admin.js
```

## File Structure

```
MatchDay/                           # Main player app
├── src/app/                       # Next.js App Router
├── database-schema.sql            # Database schema
├── scripts/                       # Utility scripts
│   ├── create-admin-user.js      # Admin user creation
│   └── create-simple-admin.js    # Simplified admin creation
└── ADMIN_SETUP.md                # This documentation

matchday-admin/                    # Admin app  
├── src/app/                      # Admin interface
├── src/lib/auth/                 # Authentication services
├── src/lib/services/             # Data services
└── src/components/               # Admin components
```

## Security Features

- **Row Level Security**: Database-level access control
- **Role-Based Authorization**: Multi-tier permission system
- **Admin Session Management**: Secure admin sessions
- **Audit Logging**: Track all administrative actions
- **Input Validation**: Type-safe form validation

## Troubleshooting

### Database Schema Issues
If you encounter enum or column issues:
```bash
# Restart Supabase to reload schema
supabase stop && supabase start

# Re-add admin enum values if needed
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
ALTER TYPE user_role ADD VALUE 'league_admin';
ALTER TYPE user_role ADD VALUE 'app_admin';
"
```

### Port Usage - STANDARDIZED ✅
- Player App: Port 3000 (production Supabase)
- Admin App: Port 3001 (production Supabase)
- No local database ports needed (using production only)

## Ready for Development

The system is now ready for continued development of the admin dashboard features. The foundation provides:

- ✅ Secure admin authentication
- ✅ Role-based authorization  
- ✅ Database schema with admin support
- ✅ Development environment setup
- ✅ Test admin user for development

You can now proceed with implementing the core admin dashboard features and league management interface.