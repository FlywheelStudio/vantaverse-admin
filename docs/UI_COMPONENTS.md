# UI Components Guide - ShadCN UI

This guide explains how to use ShadCN UI components in the starter template and how to add new components.

## 📋 Table of Contents

- [What is ShadCN UI?](#what-is-shadcn-ui)
- [Installed Components](#installed-components)
- [Adding New Components](#adding-new-components)
- [Component Examples](#component-examples)
- [Customization](#customization)
- [Best Practices](#best-practices)

## 🎨 What is ShadCN UI?

ShadCN UI is **not a component library** in the traditional sense. Instead, it's a collection of:

- **Re-usable components** built with Radix UI and Tailwind CSS
- **Copy-paste components** that you own and can modify
- **Accessible by default** using Radix UI primitives
- **Customizable** with Tailwind CSS and CSS variables

### Key Features

✅ **You own the code** - Components are copied to your project  
✅ **Fully customizable** - Modify any component as needed  
✅ **TypeScript** - Full type safety  
✅ **Accessible** - Built on Radix UI (ARIA compliant)  
✅ **Styled with Tailwind** - Easy to theme and customize  
✅ **Dark mode ready** - Built-in theme support

### Architecture

```
ShadCN UI = Radix UI (behavior) + Tailwind CSS (styling) + Your project (code)
```

## 📦 Installed Components

This starter comes with these components pre-installed:

### Current Components

```
src/components/ui/
├── button.tsx        # Button component with variants
└── alert.tsx         # Alert component for notifications
```

### Button Component

Versatile button with multiple variants and sizes.

**Variants:**

- `default` - Primary button style
- `destructive` - Danger/delete actions
- `outline` - Outlined button
- `secondary` - Secondary actions
- `ghost` - Minimal button
- `link` - Link-styled button

**Sizes:**

- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Square icon button

**Example:**

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Small</Button>
<Button variant="ghost" size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

### Alert Component

Display important messages to users.

**Variants:**

- `default` - Standard alert
- `destructive` - Error/warning messages

**Example:**

```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the CLI.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong.
  </AlertDescription>
</Alert>
```

## ➕ Adding New Components

ShadCN UI provides a CLI to add components to your project.

### Basic Usage

```bash
npx shadcn@latest add [component-name]
```

### Popular Components

#### Form Components

```bash
# Input field
npx shadcn@latest add input

# Textarea
npx shadcn@latest add textarea

# Select dropdown
npx shadcn@latest add select

# Checkbox
npx shadcn@latest add checkbox

# Radio group
npx shadcn@latest add radio-group

# Switch toggle
npx shadcn@latest add switch

# Complete form with validation
npx shadcn@latest add form
```

#### Layout Components

```bash
# Card container
npx shadcn@latest add card

# Separator line
npx shadcn@latest add separator

# Tabs navigation
npx shadcn@latest add tabs

# Accordion collapsible
npx shadcn@latest add accordion

# Aspect ratio container
npx shadcn@latest add aspect-ratio
```

#### Overlay Components

```bash
# Modal dialog
npx shadcn@latest add dialog

# Dropdown menu
npx shadcn@latest add dropdown-menu

# Popover tooltip
npx shadcn@latest add popover

# Sheet (drawer)
npx shadcn@latest add sheet

# Tooltip
npx shadcn@latest add tooltip

# Context menu
npx shadcn@latest add context-menu
```

#### Feedback Components

```bash
# Toast notifications
npx shadcn@latest add toast

# Progress bar
npx shadcn@latest add progress

# Skeleton loader
npx shadcn@latest add skeleton

# Badge
npx shadcn@latest add badge

# Avatar
npx shadcn@latest add avatar
```

#### Data Display

```bash
# Table
npx shadcn@latest add table

# Data table (with sorting, filtering)
npx shadcn@latest add data-table

# Calendar
npx shadcn@latest add calendar

# Command palette
npx shadcn@latest add command
```

### Add Multiple Components

```bash
# Add several components at once
npx shadcn@latest add card dialog form input button
```

### View All Available Components

```bash
npx shadcn@latest add
# This will show an interactive list of all components
```

## 📚 Component Examples

### Example 1: Contact Form

```bash
# Install required components
npx shadcn@latest add card input textarea button label
```

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ContactForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
        <CardDescription>Send us a message and we'll get back to you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Your message..." required />
          </div>

          <Button type="submit" className="w-full">
            Send Message
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Example 2: User Profile Card

```bash
# Install required components
npx shadcn@latest add card avatar badge button
```

```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function UserProfile({ user }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Role:</span>
            <Badge>{user.role}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={user.isActive ? 'default' : 'secondary'}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline">View Profile</Button>
        <Button>Edit</Button>
      </CardFooter>
    </Card>
  );
}
```

### Example 3: Confirmation Dialog

```bash
# Install required components
npx shadcn@latest add dialog button
```

```typescript
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

export function DeleteConfirmation({ onConfirm }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Example 4: Navigation Tabs

```bash
# Install required components
npx shadcn@latest add tabs card
```

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SettingsTabs() {
  return (
    <Tabs defaultValue="account" className="w-full max-w-2xl">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Account settings content */}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Password settings content */}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage your notification preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Notification settings content */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
```

### Example 5: Toast Notifications

```bash
# Install required components
npx shadcn@latest add toast button
```

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="space-x-2">
      <Button
        onClick={() => {
          toast({
            title: 'Success!',
            description: 'Your changes have been saved.',
          });
        }}
      >
        Show Success
      </Button>

      <Button
        variant="destructive"
        onClick={() => {
          toast({
            variant: 'destructive',
            title: 'Error!',
            description: 'Something went wrong.',
          });
        }}
      >
        Show Error
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Loading...',
            description: 'Please wait while we process your request.',
          });
        }}
      >
        Show Loading
      </Button>
    </div>
  );
}

// Don't forget to add Toaster to your root layout
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

## 🎨 Customization

### Theming

ShadCN UI uses CSS variables for theming. Colors are defined in `src/app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... more variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... more variables */
  }
}
```

### Customize Colors

Edit `globals.css` to change your theme colors:

```css
:root {
  /* Change primary color to blue */
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
}
```

### Modify Components

Since you own the code, you can modify any component:

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground...",
        // Add your custom variant
        custom: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      },
    },
  }
);

// Usage
<Button variant="custom">Custom Button</Button>
```

### Create Component Variants

Use `class-variance-authority` for complex variants:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-0 shadow-lg',
        outlined: 'border-2',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

interface CardProps extends VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

export function Card({ variant, padding, children }: CardProps) {
  return (
    <div className={cardVariants({ variant, padding })}>
      {children}
    </div>
  );
}

// Usage
<Card variant="elevated" padding="lg">Content</Card>
```

## ✅ Best Practices

### 1. Use Semantic Components

```typescript
// ✅ Good - Clear purpose
<Card>
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// ❌ Bad - Generic divs
<div className="rounded border p-4">
  <div className="font-bold">User Profile</div>
  <div>{/* content */}</div>
</div>
```

### 2. Compose Components

```typescript
// ✅ Good - Compose from smaller components
function UserCard() {
  return (
    <Card>
      <CardHeader>
        <UserAvatar />
        <UserInfo />
      </CardHeader>
      <CardContent>
        <UserStats />
      </CardContent>
      <CardFooter>
        <UserActions />
      </CardFooter>
    </Card>
  );
}
```

### 3. Use Proper Accessibility

```typescript
// ✅ Good - Accessible button
<Button
  aria-label="Delete item"
  onClick={handleDelete}
>
  <Trash2 className="h-4 w-4" />
</Button>

// ✅ Good - Accessible form
<Label htmlFor="email">Email</Label>
<Input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={!!error}
/>
{error && <span id="email-error" role="alert">{error}</span>}
```

### 4. Handle Loading States

```typescript
function DataCard() {
  const { data, isLoading } = useData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>{data.content}</CardContent>
    </Card>
  );
}
```

### 5. Use Icons from Lucide

The starter uses Lucide React for icons:

```typescript
import { Home, User, Settings, LogOut, ChevronRight } from 'lucide-react';

<Button variant="ghost" size="icon">
  <Home className="h-4 w-4" />
</Button>

<Button>
  Settings
  <Settings className="ml-2 h-4 w-4" />
</Button>
```

### 6. Responsive Design

```typescript
// Use Tailwind responsive prefixes
<Card className="w-full md:w-1/2 lg:w-1/3">
  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* content */}
  </CardContent>
</Card>

// Or use useIsMobile hook
import { useIsMobile } from '@/hooks/use-mobile';

function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return isMobile ? <Sheet /> : <Dialog />;
}
```

## 📚 Component Library Reference

Browse all available components:

- **Official Documentation**: [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
- **Component Examples**: [ui.shadcn.com/examples](https://ui.shadcn.com/examples)
- **Radix UI Docs**: [radix-ui.com/primitives](https://www.radix-ui.com/primitives)
- **Lucide Icons**: [lucide.dev](https://lucide.dev)

## 🔗 Additional Resources

- [ShadCN UI Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com)
- [Class Variance Authority](https://cva.style/docs)

---

**Next**: [Git Workflow →](./GIT_WORKFLOW.md)
