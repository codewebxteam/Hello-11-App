# RideNow - Cab Booking App

A simple and clean React Native cab booking application built with Expo.

## 📁 Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── Button.tsx      # Reusable button with variants
│   ├── Input.tsx       # Input field with icon support
│   ├── Header.tsx      # App header with menu/profile
│   ├── RideCard.tsx    # Ride option card
│   └── QuickAction.tsx # Quick action button
│
├── screens/            # Screen components
│   ├── LoginScreen.tsx    # Phone number login
│   ├── HomeScreen.tsx     # Main cab booking interface
│   └── ProfileScreen.tsx  # User profile setup
│
├── constants/          # App constants
│   ├── colors.ts      # Color palette
│   └── theme.ts       # Common styles, spacing, fonts
│
├── _layout.tsx        # Root layout
└── index.tsx          # Entry point (Login)
```

## 🎨 Design System

### Colors
- **Primary**: `#FFD700` (Yellow)
- **Black**: `#000000`
- **White**: `#FFFFFF`
- **Grays**: `#f5f5f5`, `#e0e0e0`, `#999999`, `#666666`

### Components
All components are built with:
- Consistent spacing using `SPACING` constants
- Unified font sizes using `FONT_SIZES`
- Shared styles using `COMMON_STYLES`
- Color palette from `COLORS`

## 🚀 Navigation Flow

1. **Login** (`index.tsx`) → User enters phone number
2. **Home** (`screens/HomeScreen.tsx`) → Main booking interface
3. **Profile** (`screens/ProfileScreen.tsx`) → Accessible from home header

## 🧩 Reusable Components

### Button
```tsx
<Button 
  title="Continue" 
  onPress={handlePress}
  disabled={false}
  variant="primary" // or "secondary"
/>
```

### Input
```tsx
<Input
  icon="person-outline"
  placeholder="Enter name"
  value={value}
  onChangeText={setValue}
/>
```

### Header
```tsx
<Header 
  title="RideNow"
  onMenuPress={handleMenu}
  onProfilePress={handleProfile}
/>
```

### RideCard
```tsx
<RideCard
  icon="car-sport"
  name="Mini"
  description="Affordable rides"
  price="₹120"
  onPress={handleSelect}
/>
```

### QuickAction
```tsx
<QuickAction 
  icon="home" 
  label="Home"
  onPress={handlePress}
/>
```

## 📱 Features

- Clean phone number authentication
- User profile management
- Ride type selection (Mini, Sedan, Premium)
- Quick access shortcuts (Home, Work, Recent)
- Pickup and destination input
- Component-based architecture for easy maintenance

## 🛠️ Tech Stack

- React Native
- Expo
- TypeScript
- Expo Router (for navigation)
- Expo Vector Icons
