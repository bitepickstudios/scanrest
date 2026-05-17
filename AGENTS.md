<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI components: HeroUI first, ALWAYS

Strict rule. No exceptions without explicit user approval.

1. **First option = HeroUI v3 (beta)**. Use `@heroui/react` for any interactive UI primitive (Button, Input, Modal, Select, Dropdown, Tabs, Card, Chip, Tooltip, Popover, Switch, Checkbox, Radio, Slider, Accordion, Avatar, Badge, etc.).
2. **Second option = adapt/extend HeroUI**. Download source via the `heroui-react` MCP (`get_component_source_code`, `get_component_source_styles`), copy into `app/components/ui/`, then customize. Reuse across the app.
3. **Last resort = hardcode raw HTML/Tailwind**. Only when no HeroUI primitive exists AND extending one would be heavier than rolling a small native element (e.g., a static `<div>` card, a one-off layout wrapper).

Never use native `<button>`, `<input>`, `<select>`, etc. for interactive UI when a HeroUI equivalent exists. Never reach for other component libraries (Radix raw, shadcn, Mantine, MUI, Chakra, etc.) — the project standard is HeroUI.

Before writing any UI: check `list_components` in the `heroui-react` MCP and `get_component_docs` for usage. Use the v3 API (compound components like `Card.Header`, no Provider).
