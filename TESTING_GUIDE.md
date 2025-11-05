# 🧪 TESTING GUIDE - Settings Persistence & Enhanced Crop

## ⚠️ **WAJIB LAKUKAN INI DULU!**

### **Step 0: Clear Old Cache**

```javascript
// Buka Console (F12)
// Copy paste command ini:
localStorage.clear(); 
window.location.reload();
```

**KENAPA WAJIB?**
- Version berubah v1 → v2
- Store config berubah
- Old cache incompatible
- Need fresh start!

---

## 💾 **TEST 1: SETTINGS PERSISTENCE (Critical)**

### **Full Test Procedure:**

```bash
# 1. Start dev server
npm run dev

# 2. Go to: http://localhost:3004/dashboard
```

### **Test Flow:**

```
📝 Step 1: Select Template
1. Click template "🎨 Dynamic Color"
2. Console shows: "Template loaded: 🎨 Dynamic Color Settings: {...}"

📝 Step 2: Adjust Settings
3. Padding: 8% → 20%
4. Watermark Size: 30% → 75%
5. Watermark Opacity: 0% → 10%
6. Corner Radius: 0px → 25px

📝 Step 3: Save Settings
7. Click "💾 Save Settings for 🎨 Dynamic Color"
8. Toast appears: "Settings saved! 🎉"
9. Check Console (IMPORTANT!):
   
   Console Output Expected:
   ✅ "💾 Saving settings for 🎨 Dynamic Color : {padding: 20, watermarkOpacity: 10, ...}"
   ✅ "✅ Verified saved settings: {padding: 20, watermarkOpacity: 10, ...}"
   ✅ "✅ localStorage verification: {padding: 20, watermarkOpacity: 10, ...}"

📝 Step 4: Verify in localStorage
10. In Console, run:
    ```javascript
    const store = JSON.parse(localStorage.getItem('poster-composer-storage'));
    const dynColor = store.state.templates.find(t => t.id === 'dynamic-color');
    console.log('💾 Stored Dynamic Color:', dynColor.settings);
    ```
    
    Expected Output:
    ```
    {
      padding: 20,
      watermarkOpacity: 10,
      watermarkSize: 75,
      borderRadius: 25,
      backgroundColor: '#DYNAMIC'
    }
    ```

📝 Step 5: Test Refresh Persistence
11. REFRESH PAGE (F5 or Ctrl+R)
12. Wait for page load
13. Click template "🎨 Dynamic Color"
14. Console shows: "Template loaded: 🎨 Dynamic Color Settings: {padding: 20, ...}"
15. Check sliders:
    ✅ Padding: 20%
    ✅ Watermark Size: 75%
    ✅ Watermark Opacity: 10%
    ✅ Corner Radius: 25px

16. ✅ PERSISTED! Settings survived refresh!
```

---

### **If Settings NOT Persisted:**

**Debug Checklist:**

```javascript
// 1. Check if localStorage exists
console.log('Has storage?', !!localStorage.getItem('poster-composer-storage'));

// 2. Check store content
const store = JSON.parse(localStorage.getItem('poster-composer-storage'));
console.log('Store:', store);

// 3. Check templates array
console.log('Templates:', store.state?.templates);

// 4. Check specific template
const dynColor = store.state?.templates?.find(t => t.id === 'dynamic-color');
console.log('Dynamic Color:', dynColor);
console.log('Settings:', dynColor?.settings);

// 5. Check version
console.log('Store version:', store.version);
// Should show: 2
```

**If version NOT 2:**
```javascript
// Force clear and reload
localStorage.clear();
window.location.reload();
```

---

## ✂️ **TEST 2: ENHANCED CROP MODAL**

### **Visual Indicators Test:**

```
📝 Step 1: Upload & Open Crop
1. Upload any poster
2. Click "✂️ Crop" button
3. Crop modal opens

📝 Step 2: Check Visual Indicators
4. ✅ Top shows: "👆 Drag to Move • 🤏 Pinch to Zoom • ✋ Drag Corners"
5. ✅ Grid lines visible (rule of thirds)
6. ✅ Crop box has white border
7. ✅ Outside area darkened
8. ✅ 5 aspect ratio buttons visible

📝 Step 3: Test Instructions Visibility
9. Instructions bar visible at top
10. Black background with white text
11. Easy to read
12. Doesn't interfere with cropping
13. ✅ Visual guidance clear!
```

---

### **Aspect Ratio Test:**

```
📝 Test Portrait (3:4):
1. Click "3:4" button
2. Button highlights (primary color)
3. Crop box = vertical rectangle
4. Icon shows: 🔒 (locked)
5. Drag image → crop box stays 3:4
6. ✅ Portrait mode works!

📝 Test Landscape (4:3):
7. Click "4:3" button
8. Button highlights
9. Crop box = horizontal rectangle
10. Wider than tall
11. ✅ Landscape mode works!

📝 Test Square (1:1):
12. Click "1:1" button
13. Crop box = perfect square
14. Same width and height
15. ✅ Square mode works!

📝 Test Widescreen (16:9):
16. Click "16:9" button
17. Crop box = very wide
18. Like video/banner ratio
19. ✅ Widescreen works!

📝 Test Free Mode:
20. Click "🔓 Free" button
21. Icon changes to 🔓 (unlocked)
22. Drag corners → ANY size!
23. Width ≠ height allowed
24. Custom aspect ratio
25. ✅ Free mode works!
```

---

### **Drag & Zoom Test:**

```
📝 Desktop:
1. Drag image with mouse
2. ✅ Image moves smoothly
3. Use zoom slider
4. ✅ Zoom in/out 1x-3x
5. Drag while zoomed
6. ✅ Pan works

📝 Mobile:
1. Touch-drag image
2. ✅ Image follows finger
3. Pinch gesture
4. ✅ Zoom in/out
5. Drag while zoomed
6. ✅ Pan works
```

---

### **Grid Visual Test:**

```
📝 Rule of Thirds Grid:
1. Open crop modal
2. Look at background
3. ✅ See 9 boxes (3×3 grid)
4. ✅ Lines semi-transparent
5. ✅ Helps with composition
6. ✅ Professional framing guide
```

---

### **Border & Darkening Test:**

```
📝 Crop Box:
1. Crop box has white border
2. ✅ 2px solid white
3. ✅ Clearly visible

📝 Outside Area:
1. Area outside crop box
2. ✅ Darkened (70% black overlay)
3. ✅ Shows what will be cropped out
4. ✅ Focus on selected area
```

---

## 🐛 **Common Issues & Solutions:**

### **Issue 1: Settings Still Not Saved**

**Symptoms:**
- Click Save Settings
- Refresh page
- Settings back to default

**Solution:**
```javascript
// 1. Check Console after Save Settings
// Should see these 3 logs:
"💾 Saving settings for..."
"✅ Verified saved settings: {...}"
"✅ localStorage verification: {...}"

// 2. If NOT seeing all 3 logs:
// Check network tab - any errors?

// 3. Manual verify localStorage:
JSON.parse(localStorage.getItem('poster-composer-storage'))

// 4. If localStorage null or empty:
// Check browser settings - cookies/storage enabled?

// 5. Try incognito mode to test
```

---

### **Issue 2: Crop Instructions Not Visible**

**Symptoms:**
- Open crop modal
- No instructions text at top

**Solution:**
```
1. Check browser zoom (should be 100%)
2. Check screen resolution
3. Try full screen mode
4. Instructions at top center:
   "👆 Drag to Move • 🤏 Pinch to Zoom • ✋ Drag Corners"
5. If still not visible, check z-index
```

---

### **Issue 3: Aspect Ratio Not Changing**

**Symptoms:**
- Click 4:3 button
- Crop box still vertical

**Solution:**
```
1. Wait 1 second after click
2. Click button again
3. Check button highlights
4. Try Reset button first
5. Then click aspect ratio again
```

---

### **Issue 4: Grid Not Visible**

**Symptoms:**
- Open crop modal
- No grid lines visible

**Solution:**
```
1. Grid is semi-transparent (opacity: 0.3)
2. Check image brightness (grid visible on dark images)
3. Look carefully - white lines in 3×3 grid
4. If monitor brightness low, increase it
```

---

## 📊 **Success Criteria:**

### **Settings Persistence:**
- [x] Console shows 3 check logs after save
- [x] localStorage contains templates array
- [x] Template settings updated in store
- [x] Refresh page doesn't reset settings
- [x] Multiple templates work independently
- [x] Settings survive browser restart

### **Crop Modal:**
- [x] Instructions text visible at top
- [x] 5 aspect ratio buttons present
- [x] Grid lines visible (3×3)
- [x] Crop box has white border
- [x] Outside area darkened
- [x] Free mode allows any size
- [x] Portrait/landscape switch works
- [x] Smooth drag & zoom

---

## 🎯 **End-to-End Test:**

```
COMPLETE WORKFLOW TEST:

1. Clear cache
2. Reload page
3. Select "🎨 Dynamic Color"
4. Set padding: 20%
5. Save Settings
6. Console: 3 green checkmarks
7. Refresh page
8. Click "🎨 Dynamic Color"
9. ✅ Padding still 20%

10. Upload poster
11. Click "Crop"
12. ✅ Instructions visible
13. ✅ Grid visible
14. Click "4:3" (landscape)
15. ✅ Crop box horizontal
16. Drag image around
17. ✅ Smooth movement
18. Zoom to 2x
19. ✅ Image zooms
20. Click "Free"
21. ✅ Unlock icon shows
22. Drag corner
23. ✅ Custom size works
24. Apply Crop
25. ✅ Preview updates
26. Adjust padding (should still be 20%)
27. ✅ Setting remembered
28. Export poster
29. ✅ Download works

✅ COMPLETE WORKFLOW SUCCESS!
```

---

## 📝 **Console Log Checklist:**

### **When Saving Settings:**
```
Expected Logs (in order):
1. "💾 Saving settings for 🎨 Dynamic Color : {padding: 20, ...}"
2. "Template '🎨 Dynamic Color' is a default template - changes saved locally"
3. "✅ Verified saved settings: {padding: 20, ...}"
4. "✅ localStorage verification: {padding: 20, ...}"
```

### **When Loading Template:**
```
Expected Logs:
1. "Template loaded: 🎨 Dynamic Color Settings: {padding: 20, ...}"
```

### **If Logs Missing:**
```
❌ No logs = Function not called
❌ Only 1 log = Save failed
❌ No localStorage log = Persist failed
```

---

## 🚀 **Quick Verification Commands:**

### **Check Store:**
```javascript
// Get current state
const state = usePosterStore.getState();
console.log('Current templates:', state.templates);
console.log('Current padding:', state.padding);
```

### **Check localStorage:**
```javascript
// View stored data
const stored = localStorage.getItem('poster-composer-storage');
const data = JSON.parse(stored);
console.log('Stored templates:', data.state.templates);
console.log('Stored padding:', data.state.padding);
```

### **Compare:**
```javascript
// Are they same?
const state = usePosterStore.getState();
const stored = JSON.parse(localStorage.getItem('poster-composer-storage'));

console.log('Store padding:', state.padding);
console.log('localStorage padding:', stored.state.padding);
console.log('Match?', state.padding === stored.state.padding);
```

---

## 🎉 **Expected Results:**

### **Settings:**
```
✅ Save → Console shows 3-4 logs
✅ localStorage updated immediately
✅ Refresh → Settings still there
✅ Multiple templates independent
✅ Survives browser restart
```

### **Crop:**
```
✅ Instructions visible
✅ Grid lines visible
✅ 5 aspect ratios work
✅ Free mode allows custom size
✅ Smooth drag & zoom
✅ Portrait/landscape switch easy
✅ Visual feedback clear
```

---

## 📖 **Support:**

**If Still Not Working:**

1. **Share Console Logs**
   - Copy all logs after "Save Settings"
   - Check for errors (red text)

2. **Share localStorage Content**
   ```javascript
   console.log(localStorage.getItem('poster-composer-storage'));
   ```

3. **Check Browser**
   - Chrome/Edge recommended
   - Enable cookies/localStorage
   - Disable extensions (test incognito)

4. **Restart Fresh**
   - Close browser completely
   - Clear cache again
   - Restart dev server
   - Try again

---

**CLEAR CACHE DULU, LALU TEST DENGAN FLOW DI ATAS!** 🧪✨
