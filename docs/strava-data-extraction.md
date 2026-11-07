# Strava Data Extraction

## Currently Extracted Fields

The application extracts and stores the following fields from Strava activities:

### Basic Information
- **Activity ID** (`stravaActivityId`) - Unique Strava identifier
- **Name** (`name`) - Activity title
- **Sport Type** (`sportType`) - e.g., "Run", "Ride", "Walk"
- **Activity Type** (`activityType`) - More specific type
- **Start Date** (`startDate`) - UTC timestamp
- **Start Date Local** (`startDateLocal`) - Local wall clock time

### Distance & Time
- **Distance** (`distance`) - In meters
- **Moving Time** (`movingTime`) - Active time in seconds
- **Elapsed Time** (`elapsedTime`) - Total time in seconds

### Speed & Pace
- **Average Speed** (`averageSpeed`) - In meters/second (converted to pace for display)
- **Max Speed** (`maxSpeed`) - In meters/second

### Elevation
- **Total Elevation Gain** (`totalElevationGain`) - In meters

### Heart Rate
- **Average Heart Rate** (`averageHeartrate`) - In BPM
- **Max Heart Rate** (`maxHeartrate`) - In BPM

### Performance Metrics
- **Average Cadence** (`averageCadence`) - Steps/min for running, RPM for cycling
- **Average Power** (`averageWatts`) - In watts (from power meter)
- **Calories** (`calories`) - Estimated calorie burn
- **Suffer Score** (`sufferScore`) - Strava's effort metric

### Other
- **Average Temperature** (`averageTemp`) - In degrees Celsius
- **Gear ID** (`gearId`) - Identifier for equipment used

### Raw Data
- **Raw Data** (`rawData`) - Complete JSON response from Strava API

## Why Some Fields Show "—"

Activities may show empty values (—) for several reasons:

1. **Manual Entry** - Manually entered activities lack sensor data
2. **No Sensors** - Activity recorded without heart rate monitor, power meter, etc.
3. **Activity Type** - Some metrics don't apply (e.g., no cadence for swimming)
4. **Device Limitations** - Older devices may not record all metrics
5. **Privacy Settings** - Some data may be restricted by Strava privacy settings

## Additional Fields Available (Not Currently Extracted)

Strava provides additional fields that could be added if needed:

### Power Metrics (for cycling/running with power)
- `weighted_average_watts` - Normalized power
- `max_watts` - Peak power output
- `kilojoules` - Total work done
- `device_watts` - Whether power is from device or estimated

### Elevation Details
- `elev_high` - Highest point
- `elev_low` - Lowest point

### Activity Context
- `trainer` - Boolean, if activity was on indoor trainer
- `commute` - Boolean, if marked as commute
- `has_heartrate` - Boolean, if heart rate data exists

### Social/Achievement
- `pr_count` - Personal records set
- `achievement_count` - Achievements earned
- `kudos_count` - Number of kudos received
- `comment_count` - Number of comments
- `athlete_count` - Number of athletes on group activity
- `photo_count` - Number of photos

### Splits & Segments
- `splits_metric` - Kilometer splits
- `splits_standard` - Mile splits
- `laps` - Lap data (if available)
- `segment_efforts` - Segment performance data

## UI Improvements Made

### 1. Skeleton Loaders
- Added loading states with skeleton components for:
  - Activities list page
  - Activity detail page
  - Dashboard recent activities

### 2. Better Data Organization
The activity detail page now groups fields into sections:

- **Overview** - Always visible primary stats (distance, time, pace)
- **Performance** - Conditionally shown if data exists (heart rate, cadence, power)
- **Additional Details** - Conditionally shown if data exists (elevation, calories, temperature)
- **Metadata** - Technical information (timestamps, IDs)

### 3. Conditional Field Display
- Empty fields are no longer shown instead of displaying "—"
- Sections only appear if they contain data
- Cleaner, less cluttered interface

## Recommendations

### For Better Data Collection
1. **Use sensors** - Heart rate monitor, cadence sensor, power meter
2. **Record activities** - Avoid manual entry when possible
3. **Complete sync** - Ensure all historical activities are synced
4. **Device settings** - Enable all available sensors in your recording device

### Potential Enhancements
1. **Add weighted average power** - Better metric for cycling training load
2. **Add trainer flag** - Distinguish indoor vs outdoor workouts
3. **Add lap data** - For interval training analysis
4. **Add segment efforts** - Track performance on known segments
5. **Add splits** - Detailed pace progression analysis
