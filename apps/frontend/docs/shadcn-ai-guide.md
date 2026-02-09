---
trigger: always_on
---

# shadcn/ui: Complete AI Agent Coding Guide for Project Ingexpert

> **Target Framework:** Next.js with TypeScript + Tailwind CSS v4 + Radix UI Primitives
> **Purpose:** AI-ready, modular component library for building Ingexpert's modern, intuitive, and accessible UI

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

This creates two critical files:

- **`components.json`** - Configuration file for the CLI
- **`components/ui/`** - Directory where all components are copied

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

### Step 3: Tailwind CSS v4 Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Monochromatic base with accent flexibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))',
        destructive: 'hsl(var(--destructive))',
        muted: 'hsl(var(--muted))',
        border: 'hsl(var(--border))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### Step 4: Global CSS with CSS Variables

```css
/* app/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode (default) */
    --background: 0 0% 100%;
    --foreground: 224 71% 4%;
    --primary: 199 89% 48%;
    --secondary: 220 14% 96%;
    --accent: 199 89% 48%;
    --destructive: 0 84% 60%;
    --muted: 220 13% 91%;
    --border: 220 13% 91%;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      /* Dark mode */
      --background: 224 71% 4%;
      --foreground: 210 40% 96%;
      --primary: 199 89% 48%;
      --secondary: 217 33% 17%;
      --accent: 199 89% 48%;
      --destructive: 0 84% 60%;
      --muted: 217 33% 17%;
      --border: 217 33% 17%;
    }
  }

  /* Support for manual theme switching with data-theme attribute */
  [data-theme='dark'] {
    --background: 224 71% 4%;
    --foreground: 210 40% 96%;
    --primary: 199 89% 48%;
  }

  [data-theme='light'] {
    --background: 0 0% 100%;
    --foreground: 224 71% 4%;
    --primary: 199 89% 48%;
  }
}

* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground;
}
```

### Step 5: Install Required Dependencies

```bash
npm install react-hook-form zod @hookform/resolvers
npm install sonner framer-motion lucide-react
npm install next-themes
```

---

## 3. INSTALLING COMPONENTS VIA CLI

### Command Syntax

```bash
npx shadcn-ui@latest add <component-name>
```

### Common Component Installation Commands

#### Form & Input Components (for Rikal card creation forms)

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

#### Layout & Navigation Components (for dashboard and SRS UI)

```bash
npx shadcn-ui@latest add sidebar
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
```

#### Overlay & Dialog Components (for card review modals, confirmations)

```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add dropdown-menu
```

#### Feedback & Status Components (for progress, notifications, retention rates)

```bash
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
```

#### Display & Media Components (for data visualization, charts)

```bash
npx shadcn-ui@latest add chart
npx shadcn-ui@latest add data-table
npx shadcn-ui@latest add avatar
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

### Why This Matters for AI Code Generation

The AI agent must **always use the alias `@/components/ui`** instead of relative paths. This ensures:

- ✅ Consistent import paths across the codebase
- ✅ Easy refactoring if component structure changes
- ✅ IDE autocomplete works reliably

---

## 5. CORE COMPONENTS FOR RIKAL (PROJECT AI ANKI)

### 5.1 Button Component

**Purpose:** Primary actions (Start Review, Submit Answer, Generate Cards)

```typescript
import { Button } from "@/components/ui/button"

// Basic button
<Button>Click me</Button>

// With variants
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="destructive">Delete Card</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">More Options</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Full width
<Button className="w-full">Submit Review</Button>
```

**For Rikal:** Use `variant="default"` for primary SRS actions (Submit Answer), `variant="outline"` for Skip/Later.

---

### 5.2 Card Component

**Purpose:** Container for flashcards and dashboard stats

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description of the card</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>

// Flashcard example for Rikal
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle className="text-center">Question</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-lg">What is the derivative of x²?</p>
  </CardContent>
</Card>
```

**For Rikal:** Cards are the visual container for your flashcards. Use `CardHeader` for the question prompt, `CardContent` for the displayed text/media.

---

### 5.3 Button Group Component

**Purpose:** Group related actions (e.g., card difficulty ratings)

```typescript
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

// For FSRS card rating (1-4 difficulty)
<div className="flex gap-2">
  <Button variant="outline" onClick={() => rate(1)}>Again</Button>
  <Button variant="outline" onClick={() => rate(2)}>Hard</Button>
  <Button variant="outline" onClick={() => rate(3)}>Good</Button>
  <Button variant="default" onClick={() => rate(4)}>Easy</Button>
</div>
```

**For Rikal:** Critical for review session UI. Allows users to quickly rate card difficulty after answering.

---

### 5.4 Input Component

**Purpose:** Text input for card creation, search queries

```typescript
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="card-question">Question</Label>
  <Input
    id="card-question"
    placeholder="Enter your question here..."
    type="text"
  />
</div>

// With error state
<Input
  placeholder="Email"
  type="email"
  aria-describedby="error-message"
  className="border-destructive"
/>
<p id="error-message" className="text-destructive text-sm">
  Invalid email address
</p>
```

**For Rikal:** Use in the automated card generation UI. Validate with React Hook Form + Zod.

---

### 5.5 Form Component (React Hook Form Integration)

**Purpose:** High-level form handling with validation for card creation

```typescript
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// 1. Define Zod schema (type-safe validation)
const cardSchema = z.object({
  question: z.string().min(5, { message: "Question must be at least 5 characters" }),
  answer: z.string().min(5, { message: "Answer must be at least 5 characters" }),
})

type CardFormValues = z.infer<typeof cardSchema>

// 2. Create form component
export function CardCreationForm() {
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      question: "",
      answer: "",
    },
  })

  function onSubmit(values: CardFormValues) {
    console.log(values)
    // Send to API or LLM for processing
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Input placeholder="Enter your question..." {...field} />
              </FormControl>
              <FormDescription>The prompt users will see</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answer</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the correct answer..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Card</Button>
      </form>
    </Form>
  )
}
```

**For Rikal:** This is **THE** pattern for all data entry forms. Always use Zod for validation—this ensures type safety across frontend and backend.

---

### 5.6 Dialog Component

**Purpose:** Modal dialogs for card editing, confirmations

```typescript
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">View Answer</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Card Answer</DialogTitle>
      <DialogDescription>
        This is the correct answer to your question
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <p>2x (derivative of x²)</p>
      <Button className="w-full">Mark as Correct</Button>
    </div>
  </DialogContent>
</Dialog>
```

**For Rikal:** Use in the review interface when users need to:

- Edit existing cards
- Confirm card deletion
- View detailed card statistics

---

### 5.7 Tabs Component

**Purpose:** Multi-panel interface (e.g., My Decks, Today's Review, Stats)

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="review" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="review">Today's Review</TabsTrigger>
    <TabsTrigger value="decks">My Decks</TabsTrigger>
    <TabsTrigger value="stats">Statistics</TabsTrigger>
  </TabsList>

  <TabsContent value="review" className="space-y-4">
    {/* Render cards for review */}
  </TabsContent>

  <TabsContent value="decks" className="space-y-4">
    {/* Render deck list */}
  </TabsContent>

  <TabsContent value="stats" className="space-y-4">
    {/* Render statistics charts */}
  </TabsContent>
</Tabs>
```

**For Rikal:** Organize the main dashboard into logical sections without page navigation.

---

### 5.8 Progress Component

**Purpose:** Display study progress, retention rates, completion percentage

```typescript
import { Progress } from "@/components/ui/progress"

// Linear progress (daily study goal)
<div className="space-y-2">
  <p>Today's Progress: 12/20 cards</p>
  <Progress value={60} className="w-full" />
</div>

// Retention rate visualization
<div className="space-y-2">
  <p>Overall Retention: {retentionRate}%</p>
  <Progress value={retentionRate} className="w-full" />
</div>
```

**For Rikal:** Visualize FSRS metrics:

- Daily review completion
- Retention rate over time
- Stability/Difficulty progress

---

### 5.9 Badge Component

**Purpose:** Status labels (deck difficulty, card tags, review status)

```typescript
import { Badge } from "@/components/ui/badge"

// Deck difficulty
<Badge variant="default">Beginner</Badge>
<Badge variant="secondary">Intermediate</Badge>
<Badge variant="destructive">Advanced</Badge>

// Tag system for cards
<div className="flex gap-2 flex-wrap">
  <Badge variant="outline">Biology</Badge>
  <Badge variant="outline">Photosynthesis</Badge>
  <Badge variant="outline">A+ Priority</Badge>
</div>

// Card review status
<Badge variant="default">✓ Mastered</Badge>
<Badge variant="secondary">↻ Learning</Badge>
<Badge variant="outline">New</Badge>
```

**For Rikal:** Use for categorizing and quick-scanning card metadata.

---

### 5.10 Alert Component

**Purpose:** Important notifications, warnings, errors

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

// Success message
<Alert className="border-green-500 bg-green-50">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Your cards have been generated successfully!</AlertDescription>
</Alert>

// Error message
<Alert className="border-destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Failed to sync cards. Please try again.</AlertDescription>
</Alert>

// Info/Warning
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Tip</AlertTitle>
  <AlertDescription>Focus on your weakest cards for maximum retention improvement.</AlertDescription>
</Alert>
```

**For Rikal:** Use for system messages related to LLM card generation, sync errors, or motivational tips.

---

### 5.11 Toast Component (Sonner)

**Purpose:** Non-blocking notifications (card saved, review completed)

```typescript
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

export function ToastDemo() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: "Card Saved",
          description: "Your flashcard has been added to the deck.",
        })
      }}
    >
      Save Card
    </Button>
  )
}

// With variants
toast({
  title: "Review Complete",
  description: "You reviewed 15 cards today!",
  variant: "default",
})

toast({
  title: "Error",
  description: "Failed to generate cards from PDF.",
  variant: "destructive",
})
```

**For Rikal:** Lightweight feedback for:

- Card creation/deletion
- Review session completion
- Sync status
- LLM processing updates

---

### 5.12 Sidebar Component

**Purpose:** Navigation panel for app layout

```typescript
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar"

<Sidebar>
  <SidebarHeader>
    <h2 className="text-lg font-bold">Rikal</h2>
  </SidebarHeader>

  <SidebarContent>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a href="/dashboard">Dashboard</a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a href="/decks">My Decks</a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a href="/create">Create Cards</a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a href="/settings">Settings</a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarContent>

  <SidebarFooter>
    <p className="text-xs text-muted-foreground">v1.0.0</p>
  </SidebarFooter>
</Sidebar>
```

**For Rikal:** Main navigation. Collapsible on mobile for responsive design.

---

### 5.13 Data Table Component

**Purpose:** Display cards in a tabular format with sorting, filtering, pagination

```typescript
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

type Card = {
  id: string
  question: string
  answer: string
  difficulty: "Easy" | "Hard" | "Medium"
  retention: number
}

const columns: ColumnDef<Card>[] = [
  {
    accessorKey: "question",
    header: "Question",
  },
  {
    accessorKey: "answer",
    header: "Answer",
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
  },
  {
    accessorKey: "retention",
    header: "Retention %",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    ),
  },
]

export function CardTable({ data }: { data: Card[] }) {
  return <DataTable columns={columns} data={data} />
}
```

**For Rikal:** Display deck contents, search/filter by question/tags, sort by retention.

---

### 5.14 Chart Component

**Purpose:** Visualize FSRS retention curves, study statistics

```typescript
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { day: "Mon", retention: 95 },
  { day: "Tue", retention: 92 },
  { day: "Wed", retention: 88 },
  { day: "Thu", retention: 90 },
  { day: "Fri", retention: 94 },
  { day: "Sat", retention: 91 },
]

export function RetentionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Retention Rate</CardTitle>
        <CardDescription>Your retention percentage over the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="retention" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

**For Rikal:** Visualize FSRS algorithm effectiveness, study trends, and performance metrics.

---

### 5.15 Combobox Component

**Purpose:** Searchable select for filtering decks, tags, difficulty levels

```typescript
import { Combobox } from "@/components/ui/combobox"
import { useState } from "react"

const frameworks = [
  { value: "biology", label: "Biology" },
  { value: "chemistry", label: "Chemistry" },
  { value: "physics", label: "Physics" },
  { value: "history", label: "History" },
]

export function DeckSelector() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  return (
    <Combobox
      open={open}
      onOpenChange={setOpen}
      value={value}
      onValueChange={setValue}
      options={frameworks}
      placeholder="Select a deck..."
    />
  )
}
```

**For Rikal:** Quick-access deck/category filter without cluttering the UI.

---

### 5.16 Accordion Component

**Purpose:** Collapsible sections for settings, FAQs, advanced card options

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>Advanced Card Options</AccordionTrigger>
    <AccordionContent>
      <div className="space-y-4">
        {/* Additional form fields for power users */}
      </div>
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="item-2">
    <AccordionTrigger>FSRS Algorithm Settings</AccordionTrigger>
    <AccordionContent>
      <p>Configure custom retention targets and review intervals</p>
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**For Rikal:** Hide advanced settings behind accordions. Beginners see simple interface, power users access FSRS parameters.

---

## 6. THEMING & CUSTOMIZATION (CRITICAL FOR DYNAMIC ACCENT COLORS)

### 6.1 Implementing Dynamic Accent Color Selection

```typescript
// lib/theme-provider.tsx
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type ThemeContextType = {
  theme: "light" | "dark" | "system"
  accentColor: string
  setTheme: (theme: "light" | "dark" | "system") => void
  setAccentColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [accentColor, setAccentColor] = useState("199 89% 48%") // Default cyan

  useEffect(() => {
    // Apply theme class to document
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else if (theme === "light") {
      root.classList.remove("dark")
    }
  }, [theme])

  useEffect(() => {
    // Apply accent color via CSS variable
    document.documentElement.style.setProperty("--primary", accentColor)
  }, [accentColor])

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
```

### 6.2 Curated Accent Color Palettes

```typescript
// lib/accent-colors.ts
export const ACCENT_COLORS = [
  { name: 'Cyan', value: '199 89% 48%' }, // Default
  { name: 'Blue', value: '217 91% 60%' },
  { name: 'Purple', value: '280 85% 55%' },
  { name: 'Pink', value: '322 80% 52%' },
  { name: 'Rose', value: '0 84% 60%' },
  { name: 'Orange', value: '25 95% 53%' },
  { name: 'Amber', value: '38 92% 50%' },
  { name: 'Emerald', value: '160 84% 39%' },
  { name: 'Slate', value: '217 33% 45%' },
] as const;
```

### 6.3 Settings Page for Accent Selection

```typescript
// app/settings/page.tsx
"use client"

import { useTheme } from "@/lib/theme-provider"
import { ACCENT_COLORS } from "@/lib/accent-colors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme Preferences</CardTitle>
          <CardDescription>Customize your Rikal appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme selector */}
          <div className="space-y-3">
            <h3 className="font-semibold">Dark Mode</h3>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
              >
                System
              </Button>
            </div>
          </div>

          {/* Accent color selector */}
          <div className="space-y-3">
            <h3 className="font-semibold">Accent Color</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setAccentColor(color.value)}
                  className={`h-10 rounded-lg border-2 transition-all ${
                    accentColor === color.value ? "border-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: `hsl(${color.value})` }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 7. FORMS IN DEPTH: React Hook Form + Zod

### 7.1 Complete Form Pattern for Rikal

```typescript
// components/forms/card-creation-form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define validation schema
const cardFormSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters").max(500),
  answer: z.string().min(10, "Answer must be at least 10 characters").max(2000),
  deck: z.enum(["biology", "chemistry", "physics", "history"], {
    errorMap: () => ({ message: "Please select a valid deck" }),
  }),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.string().optional(),
})

type CardFormValues = z.infer<typeof cardFormSchema>

export function CardCreationForm() {
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      question: "",
      answer: "",
      deck: undefined,
      difficulty: "medium",
      tags: "",
    },
  })

  async function onSubmit(values: CardFormValues) {
    try {
      // Send to API
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Failed to create card")

      // Success handling
      form.reset()
      // Show toast notification
    } catch (error) {
      console.error("Error:", error)
      // Show error notification
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question / Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What is the mitochondria?"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The question users will see on the front of the card
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answer / Response</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="The mitochondria is the powerhouse of the cell..."
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The correct answer that will be revealed after attempting
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deck"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deck</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deck" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="biology">Biology 101</SelectItem>
                  <SelectItem value="chemistry">Chemistry 101</SelectItem>
                  <SelectItem value="physics">Physics 101</SelectItem>
                  <SelectItem value="history">World History</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Difficulty</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How difficult you expect this card to be
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="biology, photosynthesis, a+ priority"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Comma-separated tags for organizing your cards
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Create Card
        </Button>
      </form>
    </Form>
  )
}
```

---

## 8. ACCESSIBILITY BEST PRACTICES

### Always Include:

1. **Proper Labels**

   ```typescript
   <Label htmlFor="card-input">Card Question</Label>
   <Input id="card-input" />
   ```

2. **aria-describedby for Error Messages**

   ```typescript
   <Input aria-describedby="error-1" />
   <p id="error-1" className="text-destructive">Error message</p>
   ```

3. **Keyboard Navigation**
   - All components from Radix UI support Tab/Enter/Escape by default
   - Test with keyboard-only navigation

4. **Color Contrast**
   - Maintain WCAG AA contrast (4.5:1 for normal text, 3:1 for large text)
   - Monochromatic + accent strategy ensures this naturally

---

## 9. AI AGENT CODING DIRECTIVES

### When Generating Components, ALWAYS:

1. **Use `@/components/ui` imports** (never relative paths)

   ```typescript
   ✅ import { Button } from "@/components/ui/button"
   ❌ import { Button } from "../../../components/ui/button"
   ```

2. **Import from TypeScript source** (not compiled JS)

   ```typescript
   ✅ import { useForm } from "react-hook-form"
   ❌ import useForm from "react-hook-form/dist/index"
   ```

3. **Use `"use client"` for interactive components**

   ```typescript
   "use client"
   export function MyComponent() { ... }
   ```

4. **Always add proper types** (TypeScript first)

   ```typescript
   ✅ interface CardProps { id: string; question: string }
   ❌ function MyCard(props) { ... }
   ```

5. **Use Zod for all form validation**

   ```typescript
   const schema = z.object({
     field: z.string().min(5),
   });
   ```

6. **Prefer semantic HTML**

   ```typescript
   ✅ <section>, <header>, <main>, <article>
   ❌ <div>, <div>, <div>
   ```

7. **Tailwind utility classes only** (no inline styles)

   ```typescript
   ✅ className="flex gap-4 items-center"
   ❌ style={{ display: "flex", gap: "16px" }}
   ```

8. **Follow BEM-like naming** for complex components
   ```typescript
   <Card className="card">
     <CardHeader className="card__header">
     <CardContent className="card__content">
   ```

---

## 10. MCP SERVER INTEGRATION FOR AI AUTOMATION

### What is MCP Server?

shadcn/ui's MCP (Model Context Protocol) server allows AI agents to:

- Browse shadcn/ui component registry
- Search for specific components
- Install components using natural language
- Understand component APIs automatically

### How to Use with AI Agent

```bash
# Install MCP server
npm install @shadcn/mcp

# Your AI agent can now understand shadcn/ui structure
```

**Example AI prompts:**

```
"Create a form for card creation with React Hook Form validation"
→ AI uses MCP to know Form, Input, Button, Textarea components

"Add a progress bar showing daily study completion"
→ AI fetches Progress component docs from MCP registry

"Build a data table showing all cards with sorting/filtering"
→ AI accesses DataTable component via MCP
```

---

## 11. COMMON PATTERNS FOR PROJECT AI ANKI

### Pattern 1: Review Session Card Component

```typescript
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ReviewCard({ card, onRate }: { card: Card; onRate: (rating: 1|2|3|4) => void }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-center">
          {flipped ? "Answer" : "Question"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          onClick={() => setFlipped(!flipped)}
          className="p-8 bg-secondary rounded-lg cursor-pointer min-h-32 flex items-center justify-center"
        >
          <p className="text-lg text-center">
            {flipped ? card.answer : card.question}
          </p>
        </div>

        {flipped && (
          <div className="space-y-2">
            <p className="text-sm font-medium">How well did you remember?</p>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => onRate(1)} className="text-destructive">
                Again
              </Button>
              <Button variant="outline" onClick={() => onRate(2)}>
                Hard
              </Button>
              <Button variant="outline" onClick={() => onRate(3)}>
                Good
              </Button>
              <Button onClick={() => onRate(4)}>
                Easy
              </Button>
            </div>
          </div>
        )}

        {!flipped && (
          <Button className="w-full" onClick={() => setFlipped(true)}>
            Reveal Answer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

### Pattern 2: Dashboard Stats Card

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function StatsCard({
  title,
  value,
  description,
  badge,
}: {
  title: string
  value: string | number
  description: string
  badge?: { label: string; variant: "default" | "secondary" }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
```

---

## 12. RESOURCES & NEXT STEPS

- **Official Docs:** https://ui.shadcn.com/docs
- **Component Registry:** https://ui.shadcn.com/docs/components
- **Next.js Guide:** https://ui.shadcn.com/docs/installation/next
- **Theming Guide:** https://ui.shadcn.com/docs/theming
- **React Hook Form:** https://react-hook-form.com/
- **Zod Validation:** https://zod.dev/
- **Tailwind CSS v4:** https://tailwindcss.com/

---

**Last Updated:** January 21, 2026  
**Framework:** Next.js 15 + TypeScript 5.7  
**Status:** Production-ready for Rikal UI
