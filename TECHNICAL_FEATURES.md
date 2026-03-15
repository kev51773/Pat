# Project Intelligence: Local API Client (Pat)

## 1. Architecture & Persistence
- **Backend**: Flask (Python 3.x). Serves `index.html`, proxies requests via `requests` library to bypass CORS, and handles process termination.
- **Frontend**: Vanilla JS (ES6+), CSS3 (Variables, Flexbox), HTML5. No external JS frameworks.
- **Storage**: `data.json` in the root directory. 
    - Structure: `{ "collections": [], "environment": {}, "groups": [] }`.
    - Data is synced via `POST /api/collections` on every state change.

## 2. Data Hierarchy & Naming
- **Hierarchy**: Group -> Flow (Collection) -> Step (Item).
- **Naming Validation**:
    - Groups: Globally unique.
    - Flows: Unique within their parent Group.
    - Steps: Unique within their parent Flow.
    - Safe-List Regex: `^[a-zA-Z0-9\s\-_.]+$`.
- **Auto-Naming**: `getUniqueName()` utility appends `-<int>` (e.g., "New Step-1") on collision during creation/copy.

## 3. Variable System & Interpolation
- **Environment Variables**: Key-value pairs stored in `savedEnvironment`.
- **Dynamic Variables**: Prefixed with `$`. Evaluated in real-time via `getDynamicVar()`.
    - Time: `$iso`, `$timestamp`, `$date`, `$datetime`, `$YYYY`, `$YY`, `$MM`, `$DD`, `$hh`, `$mm`, `$ss`.
    - Random: `$guid` (UUID v4), `$randomInt` (0-999).
    - Context: `$group`, `$flow`.
- **Interpolation**: Handled by `interpolateStr()`. Uses regex `/\{\{([^}]+)\}\}/g`. Supports recursive resolving during flow runs.
- **Jinja2 Safety**: Literal `{{$var}}` examples in HTML must be wrapped in `{% raw %}` to prevent Flask/Jinja2 parser crashes.

## 4. Execution Engine (Flow Runner)
- **Loop**: `runFlow()` iterates through a flow's step array.
- **Step Types**:
    - `request`: Standard HTTP call. Automatic `Content-Type` injection for JSON/XML.
    - `clear_vars`: Removes specific keys from `savedEnvironment`.
    - `delay`: JavaScript `setTimeout` promise.
    - `script`: `new Function('env', ...)` execution for manual environment manipulation.
    - `conditional`: Aborts flow if `{{var}} op val` evaluates to false.
- **Extraction**: Steps can define `extractors` (JSON Path mapping to Env Key) to save response data into `savedEnvironment`.
- **Skip Logic**: Steps with `disabled: true` are bypassed during flow runs but logged as `(SKIPPED)`.

## 5. Authentication Pattern
- **Ephemeral Input**: Auth tab inputs are never saved.
- **Scrubbing**: Frontend and Backend explicitly set `auth: { type: 'none' }` before saving/loading to prevent plaintext leakage.
- **Apply to Headers**: User must click "Apply to Headers" to convert credentials into a Base64-encoded `Authorization` header stored in the standard `headers` object.

## 6. UI Interaction Models
- **Context Menus**: Global `showContextMenu()` positions a custom `#contextMenu` div. Handles Group, Flow, and Step level actions.
- **Custom Modals**:
    - `inputModal`: Text entry with real-time validation and error messaging.
    - `actionModal`: Move/Copy selection using dynamic Group/Flow dropdowns.
- **Drag & Drop**: Native HTML5 DnD. Reorders `savedCollections` array by filtering/splicing based on DOM order after drop.
- **Sidebar State**: `expandedFlows` (Set) tracks `groupName:flowName` strings to persist collapse/expand state during re-renders.

## 7. Process Control
- **Exit Logic**: `POST /api/exit` triggers a background thread in Python calling `os._exit(0)`.
- **UI Fallback**: Frontend replaces `document.body` with a shutdown notice and attempts `window.close()` before redirecting to `about:blank`.
