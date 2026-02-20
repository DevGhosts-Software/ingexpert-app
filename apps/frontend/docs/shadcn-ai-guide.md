---
trigger: always_on
---

# shadcn/ui: Complete AI Agent Coding Guide for Project Ingexpert

> **Target Framework:** Next.js with TypeScript + Tailwind CSS v4 + Radix UI Primitives
> **Purpose:** AI-ready, modular component library for building Ingexpert's modern, intuitive, and accessible Stock Management UI

---

## 1. CORE PRINCIPLES & PHILOSOPHY

### What is shadcn/ui?

shadcn/ui is **not a traditional npm package**—it's a **code distribution platform** with these core principles:

- **Open Code:** All component source code is yours. Copy components directly into your project.
- **Composition:** Build complex UIs by combining simple, modular primitives.
- **Distribution:** Use the CLI to install, update, and manage components via a registry system.
- **Beautiful Defaults:** All components follow accessible design patterns (Radix UI primitives).
- **AI-Ready:** Designed specifically for AI code generation and automation via MCP Server.

### Key Technical Stack

- **TypeScript:** Strongly typed for reliability in high-performance systems.
- **Tailwind CSS v4:** Utility-first CSS framework for fast styling and custom theming.
- **Radix UI Primitives:** Unstyled, accessible primitive components (Dialog, Dropdown, etc.).
- **React Hook Form + Zod:** Industry-standard form handling with type-safe validation.

---

## 2. INSTALLATION & SETUP FOR NEXT.JS

### Step 1: Initialize shadcn/ui in Your Next.js Project

```bash
npx shadcn-ui@latest init
```

### Step 2: `components.json` Configuration (CRITICAL)

```json
{
  "$schema": "https://ui.shadcn.com/schema/components.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate"
  },
  "aliases": {
    "@/components/ui": "./components/ui",
    "@/components": "./components",
    "@/lib/utils": "./lib/utils"
  }
}
```

---

## 3. INSTALLING COMPONENTS VIA CLI

### Command Syntax

```bash
npx shadcn-ui@latest add <component-name>
```

### Common Component Installation Commands for Ingexpert

#### Form & Input Components (for Product and User management)

```bash
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add button
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add select
npx shadcn-ui@latest add label
npx shadcn-ui@latest add combobox
```

#### Layout & Navigation Components (for Admin Dashboard)

```bash
npx shadcn-ui@latest add sidebar
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
```

#### Overlay & Dialog Components (for Transaction confirmations)

```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add dropdown-menu
```

#### Feedback & Status Components (for stock levels and alerts)

```bash
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
```

---

## 4. IMPORTING & USING COMPONENTS

### Pattern: Import from `@/components/ui`

```typescript
// Every component is imported from the ui directory
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
```

---

## 5. CORE COMPONENTS FOR INGEXPERT

### 5.1 Button Component

**Purpose:** Primary actions (Add Product, Record Transaction, Save User)

```typescript
import { Button } from "@/components/ui/button"

// Basic button
<Button>Save Product</Button>

// With variants
<Button variant="default">Record Transaction</Button>
<Button variant="destructive">Delete Item</Button>
<Button variant="outline">Cancel</Button>
```

---

### 5.2 Card Component

**Purpose:** Container for product details and dashboard metrics

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Product summary card
<Card>
  <CardHeader>
    <CardTitle>Resistor 10k Ohm</CardTitle>
    <CardDescription>SKU: ELEC-RES-10K</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">Stock: 150 units</p>
  </CardContent>
</Card>
```

---

### 5.3 Button Group Component

**Purpose:** Quick filters or transaction type selection

```typescript
import { Button } from "@/components/ui/button"

// Transaction Type Selector
<div className="flex gap-2">
  <Button variant="outline">Stock IN</Button>
  <Button variant="outline">Stock OUT</Button>
  <Button variant="default">Adjustment</Button>
</div>
```

---

### 5.4 Input Component

**Purpose:** SKU entry, quantity adjustment, search queries

```typescript
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="sku">SKU Code</Label>
  <Input id="sku" placeholder="E.g. TRANS-BC547" type="text" />
</div>
```

---

### 5.5 Form Component (React Hook Form Integration)

**Purpose:** High-level form handling for adding/editing items. Always use shared schemas from `@ingexpert/schema`.

```typescript
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreateItemSchema, type CreateItemDto } from "@ingexpert/schema"

// Extend the shared schema only to add UI-specific error messages
const FormSchema = CreateItemSchema.extend({
  name: z.string().min(1, "Nombre requerido"),
  code: z.string().min(1, "Código requerido"),
})

// Type stays as the shared DTO — never redefine locally
type FormValues = CreateItemDto

export function ItemCreationForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", code: "", stock: 0, unit: "", location: "", type: "PRODUCT" },
  })

  function onSubmit(values: FormValues) {
    // call trpc mutation
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Agregar ítem</Button>
      </form>
    </Form>
  )
}
```

---

### 5.8 Progress Component

**Purpose:** Display stock level relative to capacity or thresholds

```typescript
import { Progress } from "@/components/ui/progress"

// Stock Level relative to target
<div className="space-y-2">
  <p className="text-sm">Storage Capacity (80%)</p>
  <Progress value={80} className="w-full" />
</div>
```

---

### 5.9 Badge Component

**Purpose:** Status labels (In Stock, Low Stock, Out of Stock, Admin)

```typescript
import { Badge } from "@/components/ui/badge"

<Badge variant="default">In Stock</Badge>
<Badge variant="destructive">Low Stock</Badge>
<Badge variant="outline">Category: ICs</Badge>
```

---

## 9. AI AGENT CODING DIRECTIVES

### When Generating Components for Ingexpert, ALWAYS:

1. **Use `@/components/ui` imports** (never relative paths).
2. **Import from TypeScript source**.
3. **Use `"use client"` for interactive components**.
4. **Always add proper types** (TypeScript first, no `any`).
5. **Use Zod for all form validation** — import the shared schema from `@ingexpert/schema` and extend it for UI messages. Never define a local schema that duplicates a shared one.
6. **Use entity types for props** — import `ItemEntity`, `ProjectEntity`, etc. from `@ingexpert/schema`. Never use `any` or local interfaces for API data shapes.
7. **Prefer semantic HTML**.
8. **Tailwind utility classes only** (no inline styles).

---

## 11. COMMON PATTERNS FOR PROJECT INGEXPERT

### Pattern 1: Stock Adjustment Dialog

```typescript
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ItemEntity } from "@ingexpert/schema"

export function StockAdjustmentDialog({ item }: { item: ItemEntity }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Adjust Stock</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock: {item.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-4">
            <Label htmlFor="quantity">Quantity Change (+ or -)</Label>
            <Input id="quantity" type="number" defaultValue="0" />
          </div>
          <Button type="submit">Record Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 2: Dashboard Inventory Stats Card

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import type { ItemStats } from "@ingexpert/schema"

export function InventoryStatCard({ label, value, alertCount }: {
  label: string;
  value: number;
  alertCount?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {alertCount > 0 && (
          <Badge variant="destructive" className="flex gap-1">
            <AlertTriangle className="h-3 w-3" /> {alertCount}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
```

---

**Last Updated:** February 9, 2026  
**Framework:** Next.js 16 + TypeScript 5.9  
**Status:** Production-ready for Ingexpert UI
