# Pete's Board - Design Standards

## Compact Page Design System

All information pages (Downloads, Token Usage, Activity Log, Latest News, Voice Briefings, Cron Jobs, ROI Dashboard) follow a standardized compact design pattern for consistency and efficiency.

---

## 🎨 Core Design Pattern

### 1. **Container**
```tsx
<div className="[component-name] compact">
  {/* Content */}
</div>
```

**CSS:**
```css
.[component-name] {
  padding: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.[component-name].compact {
  padding: 12px;
}
```

---

### 2. **Header Section**
Every page MUST have a standardized header with:
- Icon (20px, colored with `var(--primary)`)
- Title (h2, 1.1rem, flex: 1)
- Count badge
- Refresh button

```tsx
<div className="[component]-header">
  <IconComponent size={20} />
  <h2>Page Title</h2>
  <span className="[item]-count">{count}</span>
  <button className="refresh-btn" onClick={refresh} title="Refresh">
    <RefreshCw size={16} />
  </button>
</div>
```

**CSS:**
```css
.[component]-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.[component]-header h2 {
  margin: 0;
  flex: 1;
  font-size: 1.1rem;
}

.[component]-header svg {
  color: var(--primary);
}

.[item]-count {
  background: var(--primary);
  color: white;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.refresh-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: var(--border);
  color: var(--text);
}
```

---

### 3. **Collapsible List**
All lists should use the expand/collapse pattern:

```tsx
<div className="[items]-list compact">
  {items.map(item => {
    const isExpanded = expandedId === item.id
    
    return (
      <div key={item.id} className={`[item]-row ${isExpanded ? 'expanded' : ''}`}>
        {/* Summary - always visible */}
        <div className="[item]-summary" onClick={() => toggleExpand(item.id)}>
          <div className="[item]-icon-compact">
            <Icon size={14} />
          </div>
          <span className="[item]-name">{item.name}</span>
          <span className="[item]-badge">{badge}</span>
          <span className="expand-icon">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {/* Details - shown when expanded */}
        {isExpanded && (
          <div className="[item]-details">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Label</span>
                <div className="detail-value">
                  <Icon size={14} />
                  <span>Value</span>
                </div>
              </div>
            </div>
            
            <div className="[item]-actions">
              <button className="action-btn">Action</button>
            </div>
          </div>
        )}
      </div>
    )
  })}
</div>
```

**CSS:**
```css
.[items]-list.compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding-right: 4px;
}

/* Scrollbar styling */
.[items]-list::-webkit-scrollbar {
  width: 4px;
}

.[items]-list::-webkit-scrollbar-track {
  background: transparent;
}

.[items]-list::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

/* Row - Collapsed */
.[item]-row {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.[item]-row:hover {
  border-color: var(--primary);
}

.[item]-row.expanded {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Summary - Always Visible */
.[item]-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
}

.[item]-summary:hover {
  background: var(--background);
}

/* Icon */
.[item]-icon-compact {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  flex-shrink: 0;
}

/* Name/Title */
.[item]-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Badge */
.[item]-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--background);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

/* Expand Icon */
.expand-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

/* Details - Expanded */
.[item]-details {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--background);
}

/* Detail Grid */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.detail-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.detail-value svg {
  color: var(--text-muted);
  flex-shrink: 0;
}

/* Actions */
.[item]-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
```

---

### 4. **Footer Note**
Every page should end with a footer note providing context:

```tsx
<p className="footer-note">
  Context info · Last updated: {time}
</p>
```

**CSS:**
```css
.footer-note {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 16px;
  opacity: 0.7;
}
```

---

## 📋 Component Checklist

When creating or updating a component, ensure it has:

- [ ] `.compact` class on container
- [ ] Standardized header with icon, title, count badge, refresh button
- [ ] Collapsible/expandable rows (if applicable)
- [ ] Consistent spacing (10-12px padding on rows)
- [ ] Border color changes on hover and expand
- [ ] Detail labels in uppercase, 0.7rem
- [ ] Footer note with context
- [ ] Loading state
- [ ] Empty state
- [ ] Mobile responsive (padding: 8px on mobile)
- [ ] Real-time updates via Supabase subscriptions
- [ ] Auto-refresh interval (if needed)

---

## 🎯 Pages Using This Pattern

✅ **Fully Compliant:**
- CronJobs.tsx
- Downloads.tsx
- TokenUsage.tsx
- ActivityLog.tsx
- LatestNews.tsx
- VoiceBriefings.tsx
- ROIDashboard.tsx

📌 **Special Cases:**
- KanbanBoard.tsx - Uses card-based layout for task management
- ChatPanel.tsx - Uses chat message flow design
- ChatArchive.tsx - Uses timeline-based design
- ParkingLot.tsx - Uses split-panel design for dictation/file upload

---

## 🎨 CSS Variable Reference

All components use these CSS variables (defined in `index.css`):

```css
--primary         /* Primary accent color */
--surface         /* Card/row background */
--background      /* Page background */
--border          /* Border color */
--text            /* Primary text */
--text-muted      /* Muted/secondary text */
--spacing-sm      /* Small spacing */
--spacing-md      /* Medium spacing */
--spacing-lg      /* Large spacing */
--radius          /* Border radius */
--shadow-sm       /* Small shadow */
--shadow-md       /* Medium shadow */
--transition-fast /* Fast transition */
```

---

## 🔧 Shared CSS

A shared `CompactPage.css` file has been created with all common styles. Components can import this to reduce duplication:

```tsx
import './CompactPage.css'
```

However, existing components have their own CSS files which are already consistent. New components should use the shared file.

---

## 📱 Mobile Responsive

All components must be mobile-friendly:

```css
@media (max-width: 600px) {
  .[component].compact {
    padding: 8px;
  }
  
  .[item]-summary {
    padding: 8px 10px;
  }
  
  .[item]-name {
    font-size: 0.85rem;
  }
}
```

---

## 🚀 Implementation Example

See `CronJobs.tsx` as the reference implementation for the complete pattern.

---

## 📝 Notes

- Icons should be from `lucide-react` for consistency
- All dates/times should be formatted consistently (use utility functions)
- Real-time updates via Supabase are preferred over polling (where possible)
- Auto-refresh intervals should be 30-60 seconds (not too aggressive)
- Loading states should show the header + spinner in center
- Empty states should be friendly and explain what will appear there
- Error states should be red background with retry button

---

**Last Updated:** January 31, 2025  
**Maintained by:** Pete (AI Agent)
