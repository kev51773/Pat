# Sidebar Management Refactor: Custom Groups & Context Menus

Refactor the sidebar groups to use a custom UI (similar to flows) and implement a global context menu for comprehensive management (Rename, Copy, Delete, Move).

## Context Menu Actions

| Target | Right-Click Actions |
|---|---|
| **Group Item** | Rename, Copy Group, Delete Group |
| **Flow Header** | Rename, Copy Flow, Delete Flow, Move/Copy to Group |
| **Step Item** | Rename, Copy Step, Delete Step, Move/Copy to Flow (including flows in other groups) |

## Proposed Changes

### [HTML] [index.html](file:///c:/Users/Kev/Desktop/Python%20Projects/Pat/LocalApiClient/templates/index.html)
- **Sidebar Header**: Remove `activeGroupSelect` and `newGroupBtn`.
- **Sidebar Body**: Add a dedicated "Groups" container at the top of the collections list.
- **Context Menu**: Add a global `#contextMenu` element.
- **Save Modal**: Use a select dropdown for Group selection (since you're saving to a specific group) and a select for Flow selection.

### [CSS] [style.css](file:///c:/Users/Kev/Desktop/Python%20Projects/Pat/LocalApiClient/static/css/style.css)
- **Item Styling**: Redefine `.saved-request-item` and group items to look like compact cards with a subtle outline (`border: 1px solid var(--border)`) and proper hover states.
- **Context Menu CSS**: Styling for the pop-up menu (dark theme, hover states, z-index).
- **Active State**: Styling for `.active-group` or highlighted items.

### [JS] [app.js](file:///c:/Users/Kev/Desktop/Python%20Projects/Pat/LocalApiClient/static/js/app.js)
- **Refactor `renderCollectionsList`**: 
    - Render the "Groups" toggleable section at the top.
    - Render groups as items; the active group gets a highlighted background.
    - On clicking a group, update `currentGroup` and re-render only the flows for that group.
- **Context Menu Logic**:
    - Handle `contextmenu` events on group items, flow headers, and step items.
    - Position menu at mouse coordinates.
    - Implement `Rename`, `Copy`, `Delete`, and `Move` functions.
- **Move/Copy Logic**:
    - For Move to Group: Update `flowGroup` field for all items in that flow.
    - For Move/Copy Step: Support selecting a target Group, then a target Flow within that group.
- **UI Cleanup**: Remove the inline `.delete-step-btn` trash icon from step rendering.

## Verification Plan

### Manual Verification
1.  **Sidebar Nav**: Open "Groups" list, select a different group, verify flows update.
2.  **Context Menu - Group**: Right click a group $\rightarrow$ Rename. Verify UI updates.
3.  **Context Menu - Flow**: Right click a flow $\rightarrow$ Copy to another Group. Verify duplication.
4.  **Context Menu - Step**: Right click a step $\rightarrow$ Delete. Verify removal.
5.  **Data Integrity**: Ensure `data.json` persists all renamed/moved/copied items correctly.
6.  **Edge Case**: Verify you cannot delete the last remaining group.
