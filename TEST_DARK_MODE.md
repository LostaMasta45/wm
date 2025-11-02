# Dark Mode Testing Guide

## Changes Made:

### 1. **postcss.config.mjs**
Added `darkMode: "class"` configuration for Tailwind v4:
```js
{
  "@tailwindcss/postcss": {
    darkMode: "class",
  }
}
```

### 2. **app/globals.css**
Added Tailwind v4 dark variant:
```css
@variant dark (&:where(.dark, .dark *));
```

### 3. **app/layout.tsx**
Updated ThemeProvider configuration:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  storageKey="poster-composer-theme"
>
```

### 4. **PosterComposerJobMate.tsx**
- Added `resolvedTheme` for proper theme detection
- Added console.log for debugging
- Added visual indicator showing current theme

## How to Test:

### Step 1: Restart Dev Server (IMPORTANT!)
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Open Browser DevTools
1. Press F12 to open DevTools
2. Go to Console tab
3. You should see logs: "Theme changed: { theme: '...', resolvedTheme: '...', currentTheme: '...' }"
4. You should see: "HTML classList: ..." (should include 'dark' when in dark mode)

### Step 3: Test Toggle Button
1. Click the Sun/Moon button in header
2. Watch the console logs
3. Watch the text "Current: light/dark mode" in header
4. Inspect HTML element - should have class="dark" when dark mode is active

## Expected Behavior:

### Light Mode:
- Background: White (`bg-white`)
- Text: Black (`text-black`)
- Borders: Gray-200 (`border-gray-200`)
- HTML class: NO "dark" class

### Dark Mode:
- Background: Black (`bg-black`)
- Text: White (`text-white`)
- Borders: Gray-800 (`border-gray-800`)
- HTML class: HAS "dark" class

## Troubleshooting:

### If dark mode still not working:

1. **Clear Browser Cache**
   - Hard refresh: Ctrl + Shift + R (Windows/Linux) or Cmd + Shift + R (Mac)
   - Or clear cache in DevTools

2. **Check HTML Element**
   - Inspect `<html>` element
   - Should have `class="dark"` when dark mode is active
   - If class is present but styles not changing, it's a CSS issue

3. **Check Console Logs**
   - Should see theme changes in console
   - If theme is changing but classList is not updating, it's a next-themes issue

4. **Check localStorage**
   - Open DevTools > Application > Local Storage
   - Should see key: "poster-composer-theme"
   - Value: "light", "dark", or "system"

5. **Nuclear Option - Full Clean Build**
   ```bash
   # Stop server
   rm -rf .next
   rm -rf node_modules/.cache
   npm run dev
   ```

## Debug Commands:

Open browser console and run:

```javascript
// Check current theme
console.log('Theme:', document.documentElement.classList);

// Manually toggle dark class (for testing)
document.documentElement.classList.toggle('dark');

// Check localStorage
console.log('Stored theme:', localStorage.getItem('poster-composer-theme'));
```
