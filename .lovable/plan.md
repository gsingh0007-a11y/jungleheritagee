
# Admin Dashboard Implementation Plan
## Luxury Resort Booking System - Production-Ready Admin Panel

---

## Overview

This plan outlines the implementation of a comprehensive, secure admin dashboard for the Aranya Forest Resort booking system. The dashboard will provide resort owners and staff with complete visibility and control over bookings, inventory, pricing, and performance metrics.

---

## Technical Architecture

### Route Structure
```text
/admin                    --> Dashboard Overview (protected)
/admin/login              --> Admin Login Page (public)
/admin/bookings           --> Booking Management
/admin/bookings/:id       --> Booking Details
/admin/rooms              --> Room Categories Management
/admin/packages           --> Package Management
/admin/pricing            --> Pricing & Seasons
/admin/enquiries          --> Enquiry Management
/admin/reports            --> Reports & Analytics
/admin/settings           --> System Settings
/admin/users              --> Staff Management (Super Admin only)
```

### Component Hierarchy
```text
src/
  pages/
    admin/
      AdminLogin.tsx           - Login page with forgot password
      AdminLayout.tsx          - Layout with sidebar & header
      Dashboard.tsx            - Main overview dashboard
      BookingsPage.tsx         - Booking list with filters
      BookingDetails.tsx       - Individual booking view
      RoomsPage.tsx            - Room CRUD management
      PackagesPage.tsx         - Package CRUD management
      PricingPage.tsx          - Seasons & pricing config
      EnquiriesPage.tsx        - Enquiry management
      ReportsPage.tsx          - Reports & export
      SettingsPage.tsx         - Tax config, general settings
      UsersPage.tsx            - Staff management
  components/
    admin/
      AdminSidebar.tsx         - Navigation sidebar
      AdminHeader.tsx          - Top bar with user menu
      DashboardStats.tsx       - KPI stat cards
      BookingTable.tsx         - Booking data table
      BookingStatusBadge.tsx   - Status indicator
      BookingFilters.tsx       - Filter controls
      RoomFormDialog.tsx       - Room add/edit modal
      PackageFormDialog.tsx    - Package add/edit modal
      SeasonFormDialog.tsx     - Season add/edit modal
      StatusChangeDialog.tsx   - Booking status update
      InternalNotesDialog.tsx  - Admin notes modal
      RevenueChart.tsx         - Revenue visualization
      BookingTrendChart.tsx    - Booking trends chart
      ConfirmDialog.tsx        - Confirmation prompts
  hooks/
    admin/
      useAdminAuth.tsx         - Admin-specific auth guard
      useBookings.tsx          - Booking CRUD operations
      useAdminRooms.tsx        - Room management hooks
      useAdminPackages.tsx     - Package management hooks
      useAdminSeasons.tsx      - Season management hooks
      useDashboardStats.tsx    - Dashboard metrics
      useAdminUsers.tsx        - Staff management hooks
```

---

## Phase 1: Authentication & Layout Foundation

### 1.1 Admin Login Page
- Email + password authentication using existing `useAuth` hook
- Role verification (must be `super_admin` or `staff`)
- Forgot password flow with Supabase password reset
- Redirect to dashboard on successful login
- Session persistence with auto-refresh

### 1.2 Protected Route Guard
- Create `AdminGuard` component that:
  - Checks authentication state
  - Verifies user has admin role (`super_admin` or `staff`)
  - Redirects to login if unauthorized
  - Shows loading state during auth check

### 1.3 Admin Layout
- **Sidebar Navigation**:
  - Dashboard, Bookings, Rooms, Packages, Pricing, Enquiries, Reports, Settings
  - Users section (visible only to super_admin)
  - Collapsible for mobile with hamburger menu
  - Active state highlighting
  
- **Top Header Bar**:
  - User profile dropdown (name, role)
  - Notification indicator (new bookings count)
  - Sign out button
  - Resort name/branding

---

## Phase 2: Dashboard Overview

### 2.1 KPI Statistics Cards
Display real-time metrics in premium styled cards:

| Metric | Query Logic |
|--------|-------------|
| Total Bookings Today | `bookings WHERE created_at::date = today` |
| Check-ins Today | `bookings WHERE check_in_date = today AND status = 'confirmed'` |
| Check-outs Today | `bookings WHERE check_out_date = today AND status = 'confirmed'` |
| Pending Enquiries | `bookings WHERE status = 'new_enquiry'` |
| Confirmed Bookings | `bookings WHERE status = 'confirmed'` |
| Cancelled | `bookings WHERE status = 'cancelled' AND cancelled_at >= 30 days ago` |

### 2.2 Visual Charts (using Recharts)
- **Booking Trend Chart**: Line/area chart showing bookings over last 30 days
- **Revenue Overview**: Bar chart showing daily/monthly revenue
- **Room Occupancy**: Pie chart showing booking distribution by room type

### 2.3 Upcoming Bookings Widget
- List next 7 days of check-ins
- Guest name, room type, dates, status
- Quick action to view full details

---

## Phase 3: Booking Management

### 3.1 Booking List Page
**Table Columns:**
- Booking Reference (sortable)
- Guest Name + Phone
- Room Type / Package
- Check-in / Check-out dates
- Guest count (adults + children)
- Total Amount
- Status (color-coded badge)
- Created Date
- Actions (View, Status Change)

**Filtering Options:**
- Date range picker (check-in date)
- Status dropdown (all, new_enquiry, pending, confirmed, cancelled, completed)
- Room type dropdown
- Search by name/phone/booking reference

**Pagination:**
- 20 items per page with navigation
- Total count display

### 3.2 Booking Details Page
**Guest Information Section:**
- Full name, email, phone, city
- Link to view all bookings by this guest

**Stay Details Section:**
- Check-in/out dates with night count
- Room category with image thumbnail
- Package (if selected)
- Guest count breakdown
- Meal plan

**Price Breakdown Section:**
- Room total (with seasonal multiplier shown)
- Extra guest charges
- Meal plan total
- Package total
- Taxes
- Grand total (highlighted)

**Status Management:**
- Current status badge
- Status change dropdown with confirmation
- Status timeline (when status changed)

**Admin Notes Section:**
- Textarea for internal notes
- Save notes button
- Notes history with timestamps

**Special Requests:**
- Display guest's special requests

### 3.3 Status Update Flow
**Status Transitions:**
```text
new_enquiry --> pending_confirmation | cancelled
pending_confirmation --> confirmed | cancelled
confirmed --> completed | cancelled
cancelled --> (no further changes)
completed --> (no further changes)
```

- Confirmation dialog before status change
- Update `confirmed_at`, `cancelled_at`, `completed_at` timestamps
- Toast notification on success

---

## Phase 4: Inventory Management

### 4.1 Room Categories Page
**List View:**
- Room name, slug, max guests, total rooms, base price, status
- Quick toggle for active/inactive
- Edit and view buttons

**Add/Edit Form (Dialog):**
- Name, slug (auto-generated from name)
- Description (rich text or textarea)
- Max adults, max children, base occupancy
- Base price per night
- Extra adult price, extra child price
- Total rooms available
- Amenities (multi-select or tag input)
- Images (URL input for now, storage integration future-ready)
- Status toggle

**Validation:**
- Required fields: name, slug, base_price, total_rooms
- Numeric validation for prices and counts
- Slug uniqueness check

### 4.2 Availability Control (Blocked Dates)
- Calendar view showing blocked dates per room category
- Ability to manually block dates with reason
- View bookings that are blocking dates
- Owner-only override capability

---

## Phase 5: Package Management

### 5.1 Packages Page
**List View:**
- Package name, type, duration, price, applicable rooms, status
- Sort by sort_order
- Toggle active/inactive

**Add/Edit Form:**
- Name, slug
- Package type dropdown (honeymoon, safari, family, corporate, weekend, wedding, seasonal)
- Duration (nights)
- Short description, full description
- Pricing: fixed price OR per-night price toggle
- Inclusions (list/array input)
- Exclusions (list/array input)
- Applicable room categories (multi-select)
- Valid from/until dates
- Min/max guests
- Featured toggle
- Images

---

## Phase 6: Pricing & Seasons

### 6.1 Seasonal Pricing
**Season Management:**
- List all seasons with name, type, date range, multiplier, status
- Add/edit season dialog:
  - Name
  - Season type (peak, regular, off_peak)
  - Start date, end date
  - Price multiplier (e.g., 1.25 for 25% increase)
  - Active toggle

**Visual Calendar:**
- Color-coded calendar showing season periods
- Click to edit season

### 6.2 Tax Configuration
- List taxes (GST, etc.)
- Name, percentage, active status
- Add/edit/delete taxes

### 6.3 Meal Plan Pricing
- List meal plans with adult/child prices
- Edit prices inline or via dialog

---

## Phase 7: Enquiry Management

### 7.1 Enquiry List
- Filter bookings where `is_enquiry_only = true` and `status = 'new_enquiry'`
- Show guest contact, requested dates, room preference
- Follow-up status indicator

### 7.2 Convert to Booking
- "Convert to Booking" action button
- Opens confirmation dialog
- Updates `is_enquiry_only = false` and `status = 'pending_confirmation'`
- Sends notification (placeholder for email/WhatsApp)

---

## Phase 8: Reports & Analytics

### 8.1 Reports Page
**Available Reports:**
- Booking History (date range filter, export)
- Revenue Summary (by day/week/month)
- Room-wise Performance (bookings per room type)
- Package-wise Performance (bookings per package)
- Occupancy Rate (calculated from bookings vs available rooms)

### 8.2 Export Functionality
- CSV export for booking list
- Date range selector for exports
- Includes all booking fields

---

## Phase 9: Staff Management (Super Admin Only)

### 9.1 Users Page
**Staff List:**
- Email, role, created date, last active
- Only visible to `super_admin`

**Add Staff:**
- Email input
- Role selection (staff only - super_admin can only be set in database)
- Creates entry in `user_roles` table
- Staff must sign up separately

**Manage Staff:**
- Remove staff role
- Cannot delete own super_admin role

---

## Phase 10: Settings

### 10.1 General Settings
- Resort name, contact info (read-only display for now)
- Tax configuration management
- Minimum stay rules placeholder

### 10.2 Notification Settings (Future-ready)
- Email notification toggles (placeholder UI)
- WhatsApp integration status

---

## Database Queries Summary

**Dashboard Stats Hook:**
```typescript
// Today's bookings
const todayBookings = await supabase.from('bookings')
  .select('*', { count: 'exact' })
  .gte('created_at', todayStart)
  .lt('created_at', todayEnd);

// Check-ins today
const checkInsToday = await supabase.from('bookings')
  .select('*', { count: 'exact' })
  .eq('check_in_date', today)
  .eq('status', 'confirmed');

// Revenue calculation
const revenue = bookings.reduce((sum, b) => sum + b.grand_total, 0);
```

**Booking List with Joins:**
```typescript
const { data } = await supabase.from('bookings')
  .select(`*, room_categories(*), packages(*)`)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit);
```

---

## UI/UX Design Specifications

### Color Scheme (Admin-Specific)
- **Sidebar**: Dark forest (`hsl(158 40% 12%)`)
- **Cards**: Cream/ivory with soft shadows
- **Accent**: Gold for CTAs and highlights
- **Status Colors**:
  - new_enquiry: Yellow/amber
  - pending_confirmation: Blue
  - confirmed: Green
  - cancelled: Red
  - completed: Gray/slate

### Component Styling
- Rounded cards with `rounded-2xl`
- Soft shadows using `shadow-soft`
- Smooth hover transitions
- Premium stat cards with gradients
- Clean typography with Inter (body) and Playfair Display (headings)

### Responsive Behavior
- Sidebar collapses to icons on tablet
- Hidden sidebar with hamburger on mobile
- Tables scroll horizontally on small screens
- Cards stack vertically on mobile

---

## Security Implementation

### Route Protection
- `AdminGuard` wrapper checks `isAdmin` from `useAuth`
- Redirects to `/admin/login` if not authenticated or not admin
- Server-side RLS policies already configured for admin operations

### Role-Based UI
- Staff: Cannot access Users page, cannot delete data
- Super Admin: Full access to all features
- Role checks in UI components to hide/disable restricted actions

### Data Validation
- Zod schemas for all form inputs
- Confirmation dialogs for destructive actions
- Input sanitization before database operations

---

## Implementation Order

1. **Foundation** (Phase 1)
   - Admin login page
   - Admin layout with sidebar
   - Route protection

2. **Core Dashboard** (Phase 2)
   - Stats cards
   - Charts
   - Upcoming bookings widget

3. **Booking Management** (Phase 3)
   - Booking list with table
   - Filters and search
   - Booking details page
   - Status management

4. **Inventory** (Phase 4-5)
   - Room management CRUD
   - Package management CRUD

5. **Pricing** (Phase 6)
   - Season management
   - Tax configuration

6. **Additional Features** (Phase 7-10)
   - Enquiry management
   - Reports with export
   - Staff management
   - Settings

---

## Files to Create

### Pages (12 files)
- `src/pages/admin/AdminLogin.tsx`
- `src/pages/admin/AdminLayout.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/BookingsPage.tsx`
- `src/pages/admin/BookingDetails.tsx`
- `src/pages/admin/RoomsPage.tsx`
- `src/pages/admin/PackagesPage.tsx`
- `src/pages/admin/PricingPage.tsx`
- `src/pages/admin/EnquiriesPage.tsx`
- `src/pages/admin/ReportsPage.tsx`
- `src/pages/admin/SettingsPage.tsx`
- `src/pages/admin/UsersPage.tsx`

### Components (15+ files)
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminHeader.tsx`
- `src/components/admin/DashboardStats.tsx`
- `src/components/admin/BookingTable.tsx`
- `src/components/admin/BookingStatusBadge.tsx`
- `src/components/admin/BookingFilters.tsx`
- `src/components/admin/RoomFormDialog.tsx`
- `src/components/admin/PackageFormDialog.tsx`
- `src/components/admin/SeasonFormDialog.tsx`
- `src/components/admin/StatusChangeDialog.tsx`
- `src/components/admin/InternalNotesDialog.tsx`
- `src/components/admin/RevenueChart.tsx`
- `src/components/admin/BookingTrendChart.tsx`
- `src/components/admin/UpcomingBookings.tsx`
- `src/components/admin/ConfirmDialog.tsx`

### Hooks (8 files)
- `src/hooks/admin/useAdminAuth.tsx`
- `src/hooks/admin/useBookings.tsx`
- `src/hooks/admin/useAdminRooms.tsx`
- `src/hooks/admin/useAdminPackages.tsx`
- `src/hooks/admin/useAdminSeasons.tsx`
- `src/hooks/admin/useDashboardStats.tsx`
- `src/hooks/admin/useAdminUsers.tsx`
- `src/hooks/admin/useTaxConfig.tsx`

### Route Updates
- Update `src/App.tsx` to include all admin routes

---

## Estimated Scope

- **Total New Files**: ~35 files
- **Lines of Code**: ~5,000-6,000 LOC
- **Database Changes**: None required (schema already complete)
- **Dependencies**: Uses existing recharts, framer-motion, shadcn components
