# Chrome Web Store Listing — EchoToDo

> Last Updated: 2026-05-26

This document is the single source of truth for the **EchoToDo** Chrome Web Store listing metadata. You can copy and paste the texts directly from this document into the Chrome Developer Dashboard during submission.

---

## Store Listing

### Extension Name
EchoToDo

### Short Description
Convert voice notes into actionable tasks locally. High privacy, offline-first, and domain-specific task management.

### Detailed Description
EchoToDo is a premium, privacy-first productivity companion that turns your voice notes into categorized, actionable task lists completely offline. Speak naturally, and let our local NLP engine extract priority, categories, and due dates without sending your voice data to external servers.

Key Features:
- Local Voice Capture: Speak task lists naturally using standard speech recognition APIs.
- NLP Task Structuring: Automatically splits compound dictations (e.g. "Do X then also do Y") and extracts priorities, categories, and smart dates (like "today" and "tomorrow").
- Domain Context Tracking: Keep separate task lists for different websites dynamically (like youtube.com, github.com, or general) to stay organized.
- Productivity Focus Timer: Built-in focus and break timer with background alarms and notifications to keep your momentum going.
- 100% Privacy-First: All voice transcription, processing, and task data remain completely local in your Chrome profile.

How to use it:
1. Complete the onboarding setup to grant microphone permissions.
2. Open the extension popup or click "➕" in the dedicated Side Panel.
3. Tap the Microphone button and dictate your task naturally.
4. Watch EchoToDo instantly structure, prioritize, and category-tag your items!

Privacy Note:
We collect absolutely ZERO personal details, voice recordings, browsing data, or keystrokes. Your data is 100% yours, stored locally, and never leaves your computer.

### Category
Productivity

### Single Purpose
Converts spoken voice notes into structured, prioritized local tasks categorized by the current active domain.

### Primary Language
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `assets/icon128.png` |
| Screenshot 1 | 1280×800 or 640×400 | ⬜ To Capture | Focus on the gorgeous Side Panel in light mode |
| Screenshot 2 | 1280×800 or 640×400 | ⬜ To Capture | Focus on the premium dark mode Popup interface |
| Screenshot 3 | 1280×800 or 640×400 | ⬜ To Capture | Onboarding setup & permissions guide screens |
| Small Promo Tile | 440×280 | ⬜ To Capture | Feature card layout |

---

## Permissions Justification

Every permission in our manifest is strictly utilized for user-facing features. Here are the precise descriptions you can copy-paste into the Developer Dashboard under the "Permissions Justification" field:

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Stores the user's structured task lists, onboarding status, and productivity timer states locally in the browser profile. |
| `sidePanel` | permissions | Renders a dedicated, highly responsive side panel workspace for keeping tasks accessible while browsing. |
| `notifications` | permissions | Triggers desktop notification banners to alert users when focus timers complete or new voice tasks are parsed. |
| `alarms` | permissions | Schedules background alarms in the service worker to track productivity focus sessions without draining CPU cycles. |
| `offscreen` | permissions | Manages offscreen audio elements to play alarm ringtones when background focus timers expire. |
| `tabs` | permissions | Detects the hostname domain of the current active tab to categorize and partition task lists by website. |
| `activeTab` | permissions | Grants explicit, user-initiated scripting access on active tabs to query page title metadata for rich task labeling. |
| `contextMenus` | permissions | Registers a right-click "Add Voice Task" menu action to let users quickly toggle open the voice dictation workspace. |

---

## Privacy & Data Use

### Data Collection
**Does the extension collect user data?** No

*All operations are performed fully on the client's local device. No voice data, web traffic, or account detail is processed, harvested, or transmitted off-device.*

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy
**Privacy Policy URL**: (Host your policy at a public URL e.g. `https://yourdomain.com/privacy` or use GitHub Pages pointing to the bundled privacy page `docs/privacy.html`)

---

## Developer Info

- **Publisher Name**: (Enter your developer name)
- **Contact Email**: (Enter developer contact email)
- **Homepage URL**: `https://github.com/Sujoymoulick/EchoToDo.git`

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0 | 2026-05-26 | First official release. Error-free local dictation, structured task categories, premium light-mode sidepanel, and XSS safety shielding. | Draft |
