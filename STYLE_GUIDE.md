# Style Guide - Pete's Board

Quick reference for consistent UI development.

---

## 🎨 Color Palette

### Core Colors
```css
--bg: #0d1117           /* Main background */
--surface: #161b22      /* Cards, panels */
--surface-hover: #1f2937 /* Hover states */
--border: #30363d       /* Borders */
--text: #e6edf3         /* Primary text */
--text-muted: #8b949e   /* Secondary text */
```

### Semantic Colors
```css
--accent: #58a6ff       /* Primary actions */
--danger: #f85149       /* Errors, destructive actions */
--success: #3fb950      /* Success states */
--warning: #d29922      /* Warnings */
--info: #1f6feb         /* Info messages */
```

### Additional Colors
```css
--blue: #3b82f6
--green: #22c55e
--red: #ef4444
--orange: #fb923c
--amber: #f59e0b
--gray: #6b7280
```

---

## 🔘 Buttons

### Primary Button
Use for main actions (submit, save, confirm).
```tsx
<button className="btn-primary">Save Changes</button>
```

### Secondary Button
Use for secondary actions (cancel, back).
```tsx
<button className="btn-secondary">Cancel</button>
```

### Danger Button
Use for destructive actions (delete, remove).
```tsx
<button className="btn-danger">Delete</button>
```

### Icon Button
Use for icon-only actions.
```tsx
<button className="btn-icon">
  <TrashIcon />
</button>
```

### Size Variants
```tsx
<button className="btn-primary btn-sm">Small</button>
<button className="btn-primary">Default</button>
<button className="btn-primary btn-lg">Large</button>
```

### Full Width
```tsx
<button className="btn-primary btn-full">Sign In</button>
```

---

## 📝 Forms

### Text Input
```tsx
<div className="form-group">
  <label className="form-label">Name</label>
  <input type="text" className="form-input" placeholder="Enter name" />
</div>
```

### Required Field
```tsx
<label className="form-label required">Email</label>
```

### Textarea
```tsx
<textarea className="form-textarea" rows="4"></textarea>
```

### Select Dropdown
```tsx
<select className="form-select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Checkbox
```tsx
<div className="form-check">
  <input type="checkbox" className="form-checkbox" id="agree" />
  <label htmlFor="agree">I agree to terms</label>
</div>
```

### Radio Button
```tsx
<div className="form-check">
  <input type="radio" className="form-radio" name="plan" id="free" />
  <label htmlFor="free">Free Plan</label>
</div>
```

### With Help Text
```tsx
<div className="form-group">
  <label className="form-label">Password</label>
  <input type="password" className="form-input" />
  <span className="form-help">Must be at least 8 characters</span>
</div>
```

### With Error
```tsx
<div className="form-group">
  <label className="form-label">Email</label>
  <input type="email" className="form-input error" />
  <span className="form-error">Invalid email address</span>
</div>
```

### Side-by-Side Fields
```tsx
<div className="form-row">
  <div className="form-group">
    <label className="form-label">First Name</label>
    <input type="text" className="form-input" />
  </div>
  <div className="form-group">
    <label className="form-label">Last Name</label>
    <input type="text" className="form-input" />
  </div>
</div>
```

---

## 📐 Layout Utilities

### Flexbox
```tsx
<div className="flex items-center justify-between gap-4">
  <span>Item 1</span>
  <span>Item 2</span>
</div>
```

### Spacing
```tsx
<div className="mt-4 mb-6 pt-2 pb-3">
  {/* Margin-top: 1rem, Margin-bottom: 2rem */}
  {/* Padding-top: 0.5rem, Padding-bottom: 0.75rem */}
</div>
```

### Text Alignment
```tsx
<p className="text-center text-muted font-semibold">
  Centered, muted, semi-bold text
</p>
```

---

## 🎭 Common Patterns

### Card
```tsx
<div className="bg-surface border rounded-lg p-4 shadow">
  <h3 className="text-xl font-bold mb-2">Title</h3>
  <p className="text-muted">Description</p>
</div>
```

### Button Group
```tsx
<div className="btn-group">
  <button className="btn-secondary">Cancel</button>
  <button className="btn-primary">Save</button>
</div>
```

### Status Badge
```tsx
<span className="rounded-full text-sm px-3 py-1 bg-success text-white">
  Active
</span>
```

### Loading State
```tsx
<button className="btn-primary" disabled>
  <LoaderIcon className="animate-spin" />
  Loading...
</button>
```

### Empty State
```tsx
<div className="text-center py-6 text-muted opacity-50">
  <InboxIcon size={48} className="mx-auto mb-2" />
  <p>No items found</p>
</div>
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile: < 768px */
/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */
```

### Example
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

---

## ✅ Best Practices

### DO ✓
- Use utility classes for spacing: `mt-4`, `gap-3`
- Use semantic color variables: `var(--accent)`
- Keep component-specific styles in component CSS files
- Use `.btn-primary` for main actions
- Add `required` class to required form labels

### DON'T ✗
- Don't use inline styles: `style={{ color: 'red' }}`
- Don't hardcode colors: `#58a6ff`
- Don't duplicate styles across components
- Don't use generic class names: `.button`, `.input`
- Don't mix different button styles in same group

---

## 🎯 Component Checklist

When creating new components:

- [ ] Use shared button styles (`.btn-*`)
- [ ] Use shared form styles (`.form-*`)
- [ ] Use utility classes for layout
- [ ] Use CSS variables for colors
- [ ] Add hover/focus states
- [ ] Test on mobile/tablet/desktop
- [ ] Ensure accessibility (labels, ARIA)
- [ ] Add loading/error states
- [ ] Document any new patterns

---

## 📖 Resources

- **Utilities Reference:** `src/styles/utilities.css`
- **Button Styles:** `src/styles/buttons.css`
- **Form Styles:** `src/styles/forms.css`
- **Color Variables:** `src/index.css`
- **Full Changes:** `UI_IMPROVEMENTS.md`

---

**Version:** 1.0  
**Last Updated:** January 31, 2025
