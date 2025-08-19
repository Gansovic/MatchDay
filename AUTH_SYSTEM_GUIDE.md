# MatchDay Authentication System - Developer Guide

This document describes the robust, development-resilient authentication system implemented for MatchDay. The system is designed to ensure that admin and player users can reliably log in regardless of development changes, migrations, or temporary failures.

## 🎯 Core Objectives

- **Development Resilience**: Auth works reliably during active development
- **Admin/Player Access**: Critical test users always available
- **Network Tolerance**: Handles network outages gracefully  
- **Migration Safety**: Database changes don't break auth
- **Recovery Mechanisms**: Automatic and manual recovery options
- **Security First**: No hardcoded credentials in production

## 🏗️ Architecture Overview

### Unified Auth Service
**Location**: `/shared/lib/auth/unified-auth.service.ts`

Single source of truth for authentication across both player and admin applications.

**Key Features**:
- Consolidated auth logic (no duplication)
- Role-based access control with database roles
- Health monitoring and diagnostics
- Network failure handling with offline mode
- Development user recovery mechanisms
- Automatic reconnection monitoring

### Dual Application Support
- **Player App**: `/src/` - Standard user authentication
- **Admin App**: `/matchday-admin/src/` - Administrative interface

Both apps use the same unified auth service, ensuring consistency.

## 🔐 Security Improvements

### 1. Secure Role Management
- **Database-First**: Roles stored in `user_profiles.role` column
- **Type-Safe**: Uses `app_user_role` enum (`player`, `league_admin`, `app_admin`)
- **No Metadata**: Eliminated unreliable `user_metadata` role checking

### 2. Hardcoded Credentials Eliminated
- ❌ **Before**: Test credentials in production migrations
- ✅ **After**: Secure development user creation scripts
- 🛡️ **Security**: Generated passwords, environment-specific

### 3. RLS Policy Hardening
- **Anti-Recursion**: `get_user_role_safe()` function prevents infinite loops
- **Principle of Least Privilege**: Users can only access their own data
- **Admin Overrides**: Service role and app admins have appropriate access

## 🔧 Development Tools

### Quick Setup Commands
```bash
# Create development users with secure passwords
npm run dev:setup

# Check auth system health
npm run auth:check

# Test complete reliability
npm run auth:test

# Validate before/after migrations
npm run auth:pre-migration
npm run auth:post-migration
```

### Migration Safety
```bash
# Before applying any migration that touches auth tables
npm run auth:pre-migration

# Apply your migration here
supabase db push

# Validate auth still works
npm run auth:post-migration

# If something broke, auto-fix it
npm run auth:recover
```

## 🏥 Health Monitoring

### Real-Time Health Checks
The unified auth service continuously monitors:
- Database connectivity
- RLS policy functionality  
- Critical function availability
- User profile accessibility
- Auth table integrity

### Health Check Function
```sql
SELECT check_auth_system_integrity();
```

Returns comprehensive health report with specific error details.

### Status Logging
```sql
SELECT log_auth_system_status();
```

Logs health status to `auth_system_status` table for historical tracking.

## 🌐 Network Resilience

### Automatic Fallbacks
When network issues occur:

1. **Retry Logic**: Exponential backoff with jitter
2. **Offline Mode**: Development users can sign in without network
3. **Reconnection Monitoring**: Automatically detects when connectivity returns
4. **State Synchronization**: Refreshes auth state when back online

### Offline Authentication
For development users only:
- Creates mock sessions when network unavailable
- Maintains role-based permissions
- Monitors for network restoration
- Seamlessly transitions back to online mode

## 🚨 Emergency Recovery

### Automatic Recovery
```javascript
// In unified auth service - automatically triggered
await authService.ensureDevelopmentUsersExist();
```

### Manual Recovery
```sql
-- Emergency recovery function
SELECT emergency_auth_recovery();

-- Creates basic RLS policies if missing
-- Ensures critical users can access their profiles
```

### Database Recovery
```bash
# Comprehensive auth system recovery
npm run auth:recover
```

## 👥 Development Users

### Critical Test Users
The system maintains these essential test accounts:

1. **Admin User**
   - Email: `admin@matchday.com`  
   - Role: `app_admin`
   - Access: Full system administration

2. **Player User**
   - Email: `player@matchday.com`
   - Role: `player` 
   - Access: Team management, league participation

### Secure Creation
```bash
# Creates users with generated secure passwords
npm run dev:create-users

# Passwords are displayed once, then secured
# User info saved to .dev-credentials.json (gitignored)
```

### Recovery Mechanisms
If test users get deleted or corrupted:
- Automatic profile recreation on sign-in attempt
- Manual recovery via development scripts
- Emergency SQL functions for dire situations

## 📊 Database Schema

### Core Tables
- `user_profiles` - User information and roles
- `auth_system_status` - Health monitoring logs

### Key Functions  
- `get_user_role_safe(uuid)` - RLS-safe role lookup
- `check_auth_system_integrity()` - Comprehensive health check
- `emergency_auth_recovery()` - Emergency restoration
- `create_development_user()` - Secure dev user creation

### RLS Policies
- Users can view/update own profiles
- Role changes restricted to app admins
- Service role has full access
- League admins can see league members

## 🧪 Testing & Validation

### Comprehensive Test Suite
```bash
npm run auth:test
```

Tests include:
- Database connectivity
- RLS policy enforcement  
- Role function safety
- Emergency recovery
- Development user availability
- Migration validation
- Network resilience concepts
- Permission system logic

### Test Categories

**Infrastructure Tests**:
- Database connectivity
- Auth system integrity
- RLS policies

**Security Tests**:
- Role function safety  
- Permission validation
- Unauthorized access prevention

**Recovery Tests**:
- Development user recovery
- Emergency recovery functions
- Configuration backup/restore

**Monitoring Tests**:
- Status logging
- Migration validation
- Health reporting

## 🚀 Migration Guide

### From Old System
1. **Apply New Migrations**: 
   ```bash
   supabase db push
   ```

2. **Create Development Users**:
   ```bash
   npm run dev:setup
   ```

3. **Validate System**:
   ```bash
   npm run auth:test
   ```

4. **Update Application Code**: 
   Both apps already updated to use unified service

### For New Features
When adding auth-related features:

1. **Pre-migration Check**: `npm run auth:pre-migration`
2. **Apply Changes**: Database schema updates
3. **Post-migration Validation**: `npm run auth:post-migration` 
4. **Test Reliability**: `npm run auth:test`

## 🔍 Troubleshooting

### Common Issues

**"Admin user can't log in"**:
```bash
# Check auth health
npm run auth:check

# Recover development users  
npm run dev:create-users

# Test again
npm run auth:test
```

**"RLS policies blocking access"**:
```bash
# Emergency recovery
npm run auth:recover

# Or manual SQL
SELECT emergency_auth_recovery();
```

**"Migration broke authentication"**:
```bash
# Immediate recovery
npm run auth:post-migration --auto-fix

# Check what was fixed
npm run auth:check
```

### Debug Commands

```bash
# Verbose testing with detailed output
npm run auth:test-verbose

# Check specific migration impacts
npm run auth:pre-migration  # Before
# ... apply migration ...
npm run auth:post-migration # After
```

## 📈 Performance & Monitoring

### Health Metrics
- Auth system integrity score
- Response times for auth operations
- Network failure recovery rates
- Test user availability percentage

### Monitoring Setup
- Automatic health checks every 30 seconds
- Status logging for trend analysis  
- Migration impact tracking
- Emergency recovery alerts

## 🛡️ Security Considerations

### Production Deployment
- Development user creation disabled in production
- All credentials generated, not hardcoded
- RLS policies prevent unauthorized access
- Service role properly scoped

### Secret Management
- Use environment variables for API keys
- Rotate passwords regularly
- Monitor auth logs for suspicious activity
- Backup configurations before migrations

## 📚 API Reference

### Unified Auth Service Methods

```typescript
// Core authentication
await authService.signIn(email, password)
await authService.signOut()

// Role checking  
authService.hasPermission('admin')
authService.isAppAdmin()
authService.getUserRole()

// Health monitoring
authService.getHealthStatus()
authService.runHealthCheck()

// Network handling
authService.isOfflineMode()
```

### Database Functions

```sql
-- Health and monitoring
SELECT check_auth_system_integrity();
SELECT log_auth_system_status();

-- Recovery operations  
SELECT emergency_auth_recovery();
SELECT backup_auth_config();

-- Role management
SELECT get_user_role_safe('user-uuid');
```

## 🎉 Summary

The MatchDay authentication system is now **bulletproof** and **development-resilient**:

✅ **Admin and player users can ALWAYS log in**
✅ **Survives database migrations and schema changes**  
✅ **Handles network outages gracefully**
✅ **Self-heals from common failure scenarios**
✅ **Provides comprehensive monitoring and alerting**
✅ **Eliminates security vulnerabilities**
✅ **Supports active development workflows**

The system transforms authentication from a **fragile dependency** into a **robust foundation** that developers can rely on throughout the development lifecycle.