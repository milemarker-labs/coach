# UI Improvements Summary

## Changes Made

### 1. Added Skeleton Loaders ✅

Added professional loading states throughout the application:

- **Activities List Page** - Shows 5 skeleton items while loading
- **Activity Detail Page** - Shows 12 skeleton fields while loading  
- **Dashboard Recent Activities** - Shows 5 skeleton items while loading

### 2. Improved Activity Detail Page Layout ✅

Reorganized activity details into logical sections:

#### **Overview Section** (Always visible)
- Sport type
- Local time
- Distance
- Moving time
- Elapsed time
- Pace/Speed

#### **Performance Section** (Conditionally shown)
Only appears if the activity has performance data:
- Average heart rate
- Max heart rate
- Cadence
- Average power
- Normalized power (weighted average)
- Max power
- Work done (kilojoules)

#### **Additional Details Section** (Conditionally shown)
Only appears if the activity has additional metrics:
- Elevation gain
- Calories burned
- Suffer score
- Temperature
- Indoor trainer indicator
- Commute indicator
- Gear ID

#### **Metadata Section** (Always visible)
- Start time (UTC)
- Strava activity ID

### 3. Enhanced Data Extraction ✅

Added extraction of additional Strava fields:

**Power Metrics:**
- `weightedAverageWatts` - Normalized power (more accurate for training load)
- `maxWatts` - Peak power output
- `kilojoules` - Total work done
- `deviceWatts` - Whether power is from device or estimated

**Activity Context:**
- `hasHeartrate` - Boolean flag for heart rate data presence
- `trainer` - Indoor trainer activity indicator
- `commute` - Commute activity indicator

### 4. Database Schema Updates ✅

- Created migration `0001_real_tattoo.sql`
- Added 7 new columns to activities table
- Successfully applied migration

### 5. Better Empty State Handling ✅

- Removed "—" placeholders for missing data
- Entire sections hide if they contain no data
- Cleaner, less cluttered interface
- Users only see relevant information

## Why Some Fields Show Empty

Based on the screenshots you provided, many activities show empty values because:

1. **Manual Activities** - Activities entered manually lack sensor data
2. **Basic Devices** - Older or simpler devices don't capture all metrics
3. **Missing Sensors** - No heart rate monitor, power meter, or cadence sensor
4. **Activity Type** - Some metrics don't apply to certain sports
5. **Strava API Limits** - Some data is only available with detailed activity requests

## Data We're Collecting

### Core Metrics (Most Activities)
✅ Distance
✅ Moving time
✅ Elapsed time
✅ Pace/Speed
✅ Elevation gain
✅ Start time

### Sensor Metrics (Device-Dependent)
✅ Heart rate (requires HR monitor)
✅ Cadence (requires sensor)
✅ Power (requires power meter)
✅ Temperature (device-dependent)

### Strava Calculated
✅ Suffer score (requires HR data)
✅ Calories (estimated from multiple factors)

## Example: Your Activities

Looking at your screenshots:

**"Afternoon Walk"** - Has heart rate (120 bpm avg, 153 max), cadence (62 spm)
**"Afternoon Run"** - Has heart rate (136 bpm avg, 153 max), cadence (74 spm), power (198 W)
**"Weight Training"** - No distance, pace, or sensor data (manual entry)
**"D - Day Goechala"** - Long hike with HR (122 bpm avg, 157 max), cadence (40 spm)
**"Afternoon Ride"** - Has power (96 W), HR (127 bpm avg, 163 max)

## How to Get More Data

To see more metrics in your activities:

1. **Use Sensors**
   - Heart rate monitor (chest strap or optical)
   - Cadence sensor (foot pod or bike sensor)
   - Power meter (bike crank or pedals)

2. **Record Activities**
   - Use GPS watch or phone app instead of manual entry
   - Enable all sensor connections before starting

3. **Device Settings**
   - Enable "Record Heart Rate"
   - Enable "Record Cadence"
   - Pair all available sensors

4. **Strava Settings**
   - Ensure privacy settings allow data sharing
   - Use Strava app or compatible recording device

## Next Steps (Optional)

If you want even more detailed data, we could add:

1. **Lap Data** - Split times for interval training
2. **Segment Efforts** - Performance on known segments  
3. **Mile/KM Splits** - Pace progression charts
4. **Elevation Profile** - High/low points
5. **Achievement Counts** - PRs and achievements
6. **Social Metrics** - Kudos, comments (if relevant)

## Testing the Changes

The changes are live in your development environment. To see them:

1. Refresh your browser at `http://localhost:3000`
2. Navigate to Activities page - see new skeleton loaders
3. Click any activity - see new organized layout
4. Notice empty sections don't show for activities without that data
5. Re-sync activities to get new fields for existing activities

## Technical Details

**Files Modified:**
- `apps/web/src/components/ui/skeleton.tsx` (new)
- `apps/web/src/features/activities/activities-page.tsx`
- `apps/web/src/features/activities/activity-detail-page.tsx`
- `apps/web/src/features/dashboard/dashboard-page.tsx`
- `apps/api/src/services/strava/normalize.ts`
- `apps/api/src/db/schema/index.ts`
- `packages/shared/src/schemas.ts`

**Database Changes:**
- Migration: `0001_real_tattoo.sql`
- 7 new columns added to activities table
