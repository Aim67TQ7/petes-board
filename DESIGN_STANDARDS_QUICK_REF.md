# 🎨 Pete's Board - Design Standards Quick Reference

## ✅ Status: All Pages Standardized

Last verified: January 31, 2025

---

## 📐 The Standard Pattern

### Every Page Has:
```
┌─────────────────────────────────────────────┐
│ 📋 Page Title              [42] [🔄]       │  ← Header
├─────────────────────────────────────────────┤
│                                             │
│  [Card with expandable content]             │  ← Content
│  [Card with expandable content]             │
│  [Card with expandable content]             │
│                                             │
├─────────────────────────────────────────────┤
│  Footer note with context info              │  ← Footer
└─────────────────────────────────────────────┘
```

---

## 🎯 The Rules

### 1. Header Structure (Required)
```tsx
<div className="[component]-header">
  <Icon size={20} />              // Lucide icon, accent color
  <h2>Title</h2>                  // 1.1rem, bold
  <span className="[]-count">     // Accent badge with number
    {count}
  </span>
  <button className="refresh-btn"> // Icon button
    <RefreshCw size={16} />
  </button>
</div>
```

### 2. Import SharedCompact (Required)
```css
@import './SharedCompact.css';
```

### 3. Expandable Rows (When Applicable)
```tsx
<div className={`[]-row ${isExpanded ? 'expanded' : ''}`}>
  <div className="[]-summary" onClick={toggle}>
    {/* Collapsed view */}
    <ChevronDown/Up size={16} />
  </div>
  {isExpanded && (
    <div className="[]-details">
      {/* Expanded content */}
    </div>
  )}
</div>
```

### 4. States (Required)
```tsx
{loading && <div className="loading">Loading...</div>}
{!loading && items.length === 0 && (
  <div className="no-[items]">No items yet.</div>
)}
{error && <div className="error-msg">{error}</div>}
```

### 5. Footer (Required for Data Pages)
```tsx
<p className="footer-note">
  Contextual info about data source
</p>
```

---

## 🎨 Design Tokens

### Colors
```css
--accent:       #3b82f6  /* Primary blue */
--surface:      #ffffff  /* Card bg */
--border:       #e5e7eb  /* Borders */
--text:         #111827  /* Primary text */
--text-muted:   #6b7280  /* Secondary text */
--background:   #f9fafb  /* Page bg */
```

### Status Colors
```css
Success:  #22c55e  /* Green */
Error:    #ef4444  /* Red */
Warning:  #f59e0b  /* Amber */
Info:     #3b82f6  /* Blue */
```

### Typography
```css
Page Title:   1.1rem - 1.25rem, weight 700
Section:      1rem, weight 600
Body:         0.85rem - 0.9rem
Small/Badge:  0.75rem
Labels:       0.7rem, uppercase, 0.5px spacing
```

### Spacing
```css
Component:  12px padding
List gap:   4px
Card gap:   10-12px
Sections:   16-20px
```

### Borders & Radius
```css
Border:     1px solid var(--border)
Radius:     6px (inputs), 8px (cards)
Hover:      border-color: var(--accent)
```

---

## 📱 Responsive Breakpoints

```css
Desktop:  > 768px   (Full layout)
Tablet:   ≤ 768px   (Condensed)
Mobile:   ≤ 480px   (Single column)
```

---

## ✨ Interactions

### Hover Effects
```css
Cards:    border-color → accent
Buttons:  background → darker
Badges:   transform: scale(1.05)
```

### Transitions
```css
All:      0.2s ease
```

### Expand/Collapse
```css
Icon:     Chevron Up ↔ Chevron Down
Content:  slideDown animation
```

---

## 📋 Component Checklist

When creating a new component:

- [ ] Import `SharedCompact.css`
- [ ] Use standard header pattern
- [ ] Include count badge (if applicable)
- [ ] Add refresh button (if data component)
- [ ] Implement loading state
- [ ] Implement empty state
- [ ] Add footer note
- [ ] Test mobile responsiveness
- [ ] Add hover effects
- [ ] Use CSS variables for colors
- [ ] Follow spacing guidelines
- [ ] Include expand/collapse (if list)

---

## 🎓 Examples

### Minimal Data Component
```tsx
// MyComponent.tsx
import { MyIcon, RefreshCw } from 'lucide-react'
import './MyComponent.css'

export default function MyComponent() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  return (
    <div className="my-component compact">
      <div className="my-header">
        <MyIcon size={20} />
        <h2>My Component</h2>
        <span className="my-count">{items.length}</span>
        <button className="refresh-btn" onClick={refresh}>
          <RefreshCw size={16} />
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length === 0 ? (
        <div className="no-items">No items yet.</div>
      ) : (
        <div className="items-list compact">
          {items.map(item => (
            <div key={item.id} className="item-row">
              {/* Item content */}
            </div>
          ))}
        </div>
      )}
      
      <p className="footer-note">
        Data updated in real-time
      </p>
    </div>
  )
}
```

```css
/* MyComponent.css */
@import './SharedCompact.css';

.my-component.compact {
  padding: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.my-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.my-header h2 {
  margin: 0;
  flex: 1;
  font-size: 1.1rem;
}

.my-header svg:first-child {
  color: var(--accent);
}

.my-count {
  background: var(--accent);
  color: white;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.items-list.compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.item-row {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  transition: all 0.2s;
}

.item-row:hover {
  border-color: var(--accent);
}

.footer-note {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 16px;
  opacity: 0.7;
}
```

---

## 🔗 Reference Files

- **SharedCompact.css** - Core design system
- **CronJobs.tsx** - Reference implementation
- **DESIGN_STANDARDIZATION_VERIFICATION.md** - Full audit report
- **STANDARDIZATION_STATUS.md** - Visual status summary

---

## 💡 Tips

1. **Copy from existing components** rather than starting from scratch
2. **Use SharedCompact.css classes** when possible
3. **Follow the naming pattern:** `[component]-header`, `[component]-row`, etc.
4. **Test on mobile** - all breakpoints matter
5. **Keep accessibility in mind** - semantic HTML, proper labels
6. **Real-time updates** - use Supabase subscriptions
7. **Consistent loading/error handling** across all components

---

**Quick Start:** Copy CronJobs.tsx + CronJobs.css and modify for your use case!

---

Last Updated: January 31, 2025 • All components verified ✅
