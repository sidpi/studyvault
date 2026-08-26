# Notes & Materials Portal — Development Plan

## 1. Project Goal

Build a private, modern web portal for a small group of approximately 20 people to access study notes and other learning materials.

The website will use the existing `sidcandev.online` domain with a dedicated subdomain such as:

`notes.sidcandev.online`

The system should:

- Let approved users log in.
- Let users browse, search, view, and download materials.
- Provide an in-site PDF viewer.
- Keep all uploaded files in private storage.
- Provide a separate admin dashboard.
- Allow the Super Admin to create/manage users and assign roles.
- Allow trusted Uploaders to manage materials without giving them full administrative access.
- Keep the running cost at ₹0 where possible by staying within free tiers.

---

# 2. User Roles

The application will have three roles.

## 2.1 User

Normal friend/member.

Permissions:

- Log in.
- View dashboard.
- Browse subjects.
- Browse categories.
- Search materials.
- Open materials.
- View PDFs inside the website.
- Download permitted files.
- Optionally bookmark/favorite materials.

Cannot:

- Upload files.
- Edit materials.
- Delete materials.
- Manage users.
- Change roles.
- Access admin settings.

## 2.2 Uploader

A trusted person who can help manage study materials.

Permissions:

- Everything a normal User can do.
- Access the uploader/admin material-management area.
- Upload materials.
- Edit material metadata.
- Delete materials.
- Create or manage content under permitted subjects/categories.

Cannot:

- Manage users.
- Change user roles.
- Promote another user to Uploader.
- Modify Super Admin settings.
- Access sensitive system configuration.

## 2.3 Super Admin

The owner of the website.

Permissions:

- Full access.
- User management.
- Role management.
- Uploader management.
- Subject management.
- Category management.
- Material management.
- Upload/delete/edit files.
- Website settings.
- Storage management.
- Audit/activity logs.
- Manage all permissions.

The Super Admin role should be protected so that Uploaders cannot promote themselves or others.

---

# 3. Recommended Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or another modern component system
- Lucide icons

## Authentication

- Supabase Auth

Recommended login:

- Email + password, or
- Magic link / OTP

For a private group, an allowlist of approved email addresses is recommended.

## Database

- Supabase PostgreSQL

Used for:

- Users/profile information
- Roles
- Subjects
- Categories
- Materials metadata
- Bookmarks/favorites
- Activity logs

## File Storage

- Cloudflare R2

Used for:

- PDFs
- Images
- PPT/PPTX
- DOC/DOCX
- ZIP files
- Videos
- Other study materials

The R2 bucket should remain private.

## PDF Viewer

Use PDF.js-based rendering.

The viewer should be integrated directly into the website instead of simply redirecting users to an external PDF page.

## Hosting

Possible options:

- Cloudflare Pages / Workers
- Vercel

Choose the deployment platform based on the final Next.js architecture and free-tier requirements.

## DNS

Use the existing domain:

`sidcandev.online`

Create:

`notes.sidcandev.online`

---

# 4. High-Level Architecture

```text
                         notes.sidcandev.online
                                  |
                                  v
                            Next.js App
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
              Supabase Auth                Application UI
                    |                           |
                    v                           |
             User / Role Check <---------------+
                    |
                    v
             Supabase PostgreSQL
                    |
             Material Metadata
                    |
                    v
             Cloudflare R2
             Private File Storage
                    |
             Signed Temporary URLs
                    |
          +---------+---------+
          |                   |
          v                   v
      PDF Viewer           Download
       PDF.js             Temporary URL
```

---

# 5. Main Website Structure

```text
/
├── login
├── dashboard
├── subjects
├── subjects/[subject]
├── materials/[id]
├── search
├── bookmarks
└── profile
```

Admin area:

```text
/admin
├── dashboard
├── materials
├── materials/upload
├── materials/[id]/edit
├── subjects
├── categories
├── users
├── uploaders
├── activity
└── settings
```

---

# 6. User Dashboard

The normal user dashboard should be simple and fast.

## Main sections

### Header

- Website logo/name
- Search
- Notifications if needed
- User profile
- Logout

### Sidebar

- Dashboard
- Subjects
- Recent
- Bookmarks
- Search

### Dashboard content

Show:

- Recently added materials
- Popular/recent subjects
- Quick subject cards
- Recently viewed materials
- Bookmarked materials

Example:

```text
+--------------------------------------------------+
| StudyVault                         Search   User |
+----------------+---------------------------------+
| Dashboard      | Welcome back                    |
| Subjects       |                                 |
| Recent         | Recently Added                  |
| Bookmarks      |                                 |
|                | [PDF] Physics Notes             |
|                | [PDF] Chemistry PYQ             |
|                | [PPT] Mathematics Presentation  |
|                |                                 |
|                | Subjects                        |
|                | Physics | Chemistry | Maths     |
+----------------+---------------------------------+
```

---

# 7. Subject Organization

Materials should not be stored as an unorganized file list.

Recommended hierarchy:

```text
Subject
    |
    +-- Category
          |
          +-- Material
```

Example:

```text
Physics
├── Notes
│   ├── Thermodynamics Notes.pdf
│   └── Waves Notes.pdf
├── PYQs
│   ├── 2025 PYQ.pdf
│   └── 2024 PYQ.pdf
└── Assignments
    └── Assignment 3.pdf
```

Possible categories:

- Notes
- PYQs
- Assignments
- Question Banks
- Books
- Presentations
- Lab Material
- Other

The Super Admin should be able to create custom subjects and categories.

---

# 8. Material Data Model

Each material should have metadata.

Recommended fields:

```text
id
title
description
subject_id
category_id
file_name
file_key
file_size
file_type
mime_type
uploaded_by
created_at
updated_at
```

Optional fields:

```text
thumbnail
tags
version
is_featured
download_count
view_count
```

---

# 9. Database Structure

Recommended tables:

```text
profiles
roles
subjects
categories
materials
bookmarks
activity_logs
```

## profiles

```text
id
email
display_name
avatar_url
role
created_at
updated_at
```

## subjects

```text
id
name
description
icon
created_at
updated_at
```

## categories

```text
id
subject_id
name
description
created_at
updated_at
```

## materials

```text
id
title
description
subject_id
category_id
file_name
file_key
file_size
mime_type
uploaded_by
created_at
updated_at
```

## bookmarks

```text
id
user_id
material_id
created_at
```

## activity_logs

```text
id
user_id
action
resource_type
resource_id
metadata
created_at
```

---

# 10. Authentication

Users should not be able to freely create public accounts unless desired.

Recommended flow:

```text
User
  |
  v
Login
  |
  v
Supabase Auth
  |
  v
Check profile + role
  |
  +---- User ------> User Dashboard
  |
  +---- Uploader --> Uploader Dashboard
  |
  +---- Admin -----> Admin Dashboard
```

For maximum privacy:

```text
Allowed Email List
        |
        v
Only approved users can access
```

Possible future feature:

- Invite user
- Disable user
- Remove user
- Reset access

---

# 11. PDF Viewer

PDF viewing is a core feature.

When a user opens a PDF:

```text
Material Page
      |
      v
Permission Check
      |
      v
Generate Temporary Signed URL
      |
      v
PDF.js Viewer
```

The PDF viewer should provide:

- Previous page
- Next page
- Page number
- Jump to page
- Zoom in
- Zoom out
- Fit width
- Fullscreen
- Search within PDF
- Download button
- Loading indicator
- Error handling

Example UI:

```text
+------------------------------------------------------+
| ← Back     Thermodynamics Notes       Download ↓    |
+------------------------------------------------------+
|                                                      |
|                  PDF VIEWER                          |
|                                                      |
|             +----------------------+                 |
|             |                      |                 |
|             |       PDF PAGE       |                 |
|             |                      |                 |
|             +----------------------+                 |
|                                                      |
+------------------------------------------------------+
|  ◀   Page 1 / 42   ▶       − 100% +      Fullscreen |
+------------------------------------------------------+
```

---

# 12. Download System

Users should have a visible Download button.

Download flow:

```text
Click Download
      |
      v
Verify authenticated user
      |
      v
Verify permission
      |
      v
Generate short-lived signed URL
      |
      v
Download file from R2
```

Do not expose permanent public R2 URLs.

---

# 13. Private Storage

Cloudflare R2 bucket should be private.

Example object structure:

```text
materials/
├── physics/
│   ├── notes/
│   └── pyqs/
├── chemistry/
│   ├── notes/
│   └── pyqs/
└── mathematics/
    ├── notes/
    └── pyqs/
```

The database stores the file key, not a permanently public URL.

---

# 14. Upload System

Uploader/Admin page:

```text
Upload Material

Title
[____________________________]

Subject
[ Physics ▼ ]

Category
[ Notes ▼ ]

Description
[____________________________]
[____________________________]

File
[ Choose File ]

[ Upload Material ]
```

After upload:

```text
File
  |
  v
Validate
  |
  v
Upload to R2
  |
  v
Create database metadata
  |
  v
Show success
```

Validation should check:

- File size
- MIME type
- File extension
- Authentication
- User role

---

# 15. Admin Dashboard

The admin dashboard should be visually separate from the normal user interface.

Main navigation:

```text
Admin Dashboard
├── Overview
├── Materials
├── Upload Material
├── Subjects
├── Categories
├── Users
├── Uploaders
├── Activity Logs
└── Settings
```

Dashboard statistics:

```text
Total Users
Total Uploaders
Total Materials
Total Storage
Recent Uploads
Most Viewed Materials
Most Downloaded Materials
```

---

# 16. Uploader Dashboard

Uploaders should get a limited management dashboard.

```text
Uploader Dashboard

Overview
Materials
Upload Material
Subjects
Categories
```

They should NOT see:

```text
User Management
Role Management
System Settings
Super Admin Controls
```

The backend must enforce this restriction.

---

# 17. User Management

Super Admin should be able to:

- View users
- Search users
- Add/invite users
- Disable users
- Remove users
- Change roles
- Promote User → Uploader
- Demote Uploader → User

Example:

```text
Users

Sid              Super Admin
Friend 1         User
Friend 2         User
Friend 3         Uploader
Friend 4         User
```

Role changes must be protected by server-side authorization.

---

# 18. Security Model

Security should not depend on frontend UI.

The application should enforce authorization at multiple levels:

```text
Frontend
   +
Server/API
   +
Database RLS
   +
Private R2 Storage
```

## Supabase Row Level Security

Recommended rules:

### Users

Users can read their own profile.

### Materials

Authenticated users can read published materials.

Uploaders/Admins can create/update/delete materials.

### Subjects

Authenticated users can read.

Uploader/Admin can manage if desired.

### Users/Roles

Only Super Admin can manage.

---

# 19. R2 Security

Never make the R2 bucket public by default.

Use signed URLs with short expiration.

For example:

```text
Viewer URL:
Expires after a short period

Download URL:
Expires after a short period
```

This prevents permanent public links from being shared.

Important note:

A website cannot completely prevent a user from copying a file once they have legitimate access to it. The goal is to keep unauthorized access out and avoid exposing permanent public URLs.

---

# 20. Search

Search should support:

- Material title
- Description
- Subject
- Category
- Tags

Example:

```text
Search: thermodynamics

Results:
Physics
├── Thermodynamics Notes
├── Thermodynamics PYQ
├── Thermodynamics Assignment
└── Thermodynamics Formula Sheet
```

Start with PostgreSQL search/filtering.

A more advanced search engine is unnecessary for only ~20 users.

---

# 21. Responsive Design

The website should work well on:

- Desktop
- Laptop
- Tablet
- Mobile

PDF viewing is especially important on mobile.

Mobile layout:

```text
Header
Search

Recent Materials

Subjects

Bottom Navigation
```

Desktop layout:

```text
Sidebar | Main Content
```

---

# 22. UI Design Direction

The interface should feel like a modern study platform rather than a basic file manager.

Design principles:

- Clean
- Minimal
- Fast
- Responsive
- Dark/light mode if desired
- Clear file-type icons
- Subject cards
- Material cards
- Smooth transitions
- Good empty states
- Good loading states
- Accessible buttons
- Clear typography

Avoid unnecessary animations that slow down the application.

---

# 23. Material Card

Example:

```text
+--------------------------------------+
| PDF                                  |
|                                      |
| Thermodynamics Notes                  |
| Physics • Notes                      |
|                                      |
| 18 MB • Added 2 days ago             |
|                                      |
| [ View ]                [ Download ] |
+--------------------------------------+
```

For other files:

```text
PDF
PPTX
DOCX
ZIP
IMAGE
VIDEO
```

Use appropriate icons.

---

# 24. Material Detail Page

The material page should contain:

```text
Title
Subject
Category
Description
Uploaded by
Upload date
File size
File type

[ View Online ]
[ Download ]
```

For supported preview formats, show the preview directly.

---

# 25. File Preview Strategy

## PDF

Use PDF.js.

## Images

Use an image viewer/lightbox.

## Video

Use an HTML5 video player.

## TXT

Render text directly.

## DOC/DOCX/PPT/PPTX

Initially provide:

- File information
- Download

Optional future feature:

- Convert files to PDF
- Generate previews

Avoid adding complex document conversion until it is actually needed.

## ZIP/RAR

Download only.

---

# 26. Cost Strategy

The goal is to keep the project at ₹0.

Use free tiers where available:

```text
Existing Domain       Already owned
Frontend Hosting      Free tier
Supabase              Free tier
Cloudflare R2         Free/low-cost tier depending on usage
SSL                   Free
Authentication       Free tier
Database              Free tier
```

Monitor:

- Storage usage
- File downloads
- R2 operations
- Database usage
- Hosting bandwidth

The group size of approximately 20 people should keep normal application traffic very small.

The main variable to watch is the amount of files stored and downloaded.

---

# 27. Domain Setup

Existing domain:

`sidcandev.online`

Create:

`notes.sidcandev.online`

Recommended DNS architecture:

```text
sidcandev.online
      |
      +-- music.sidcandev.online
      |
      +-- notes.sidcandev.online
      |
      +-- future-project.sidcandev.online
```

No additional domain purchase is required.

---

# 28. Deployment Plan

## Step 1

Create Git repository.

## Step 2

Create Next.js application.

## Step 3

Configure TypeScript and Tailwind.

## Step 4

Create Supabase project.

## Step 5

Configure authentication.

## Step 6

Create database schema.

## Step 7

Enable Row Level Security.

## Step 8

Create Cloudflare R2 bucket.

## Step 9

Configure R2 access from the server.

## Step 10

Build authentication pages.

## Step 11

Build user dashboard.

## Step 12

Build subjects/categories.

## Step 13

Build material listing.

## Step 14

Build upload system.

## Step 15

Build PDF viewer.

## Step 16

Build download system.

## Step 17

Build admin dashboard.

## Step 18

Build role management.

## Step 19

Add search.

## Step 20

Add security checks.

## Step 21

Test all roles.

## Step 22

Deploy.

## Step 23

Connect:

`notes.sidcandev.online`

---

# 29. Development Phases

## Phase 1 — Foundation

- [ ] Create repository
- [ ] Create Next.js project
- [ ] Configure Tailwind
- [ ] Configure UI components
- [ ] Create project structure
- [ ] Configure environment variables

## Phase 2 — Authentication

- [ ] Supabase Auth
- [ ] Login
- [ ] Logout
- [ ] Protected routes
- [ ] User profiles
- [ ] Role system

## Phase 3 — Database

- [ ] Profiles table
- [ ] Subjects table
- [ ] Categories table
- [ ] Materials table
- [ ] Bookmarks table
- [ ] Activity logs
- [ ] RLS policies

## Phase 4 — Storage

- [ ] Create R2 bucket
- [ ] Keep bucket private
- [ ] Server-side upload
- [ ] Signed URLs
- [ ] File deletion
- [ ] File metadata

## Phase 5 — User Experience

- [ ] Dashboard
- [ ] Subject browsing
- [ ] Category browsing
- [ ] Material cards
- [ ] Search
- [ ] Material detail page
- [ ] Bookmarks

## Phase 6 — Viewer

- [ ] PDF.js
- [ ] Page navigation
- [ ] Zoom
- [ ] Search inside PDF
- [ ] Fullscreen
- [ ] Download
- [ ] Mobile optimization

## Phase 7 — Admin

- [ ] Admin dashboard
- [ ] Material management
- [ ] Upload page
- [ ] Edit material
- [ ] Delete material
- [ ] Subject management
- [ ] Category management
- [ ] User management
- [ ] Role management

## Phase 8 — Uploader Role

- [ ] Uploader dashboard
- [ ] Upload permissions
- [ ] Material editing
- [ ] Material deletion
- [ ] Restrict user management
- [ ] Restrict role management
- [ ] Server-side authorization

## Phase 9 — Security

- [ ] RLS
- [ ] Private R2 bucket
- [ ] Signed URLs
- [ ] Server-side role checks
- [ ] File validation
- [ ] Rate limiting where appropriate
- [ ] Secure environment variables

## Phase 10 — Deployment

- [ ] Production build
- [ ] Environment variables
- [ ] Domain configuration
- [ ] HTTPS
- [ ] Production testing
- [ ] Backup strategy
- [ ] Usage monitoring

---

# 30. Testing Checklist

## User

- [ ] Can log in
- [ ] Can view materials
- [ ] Can search
- [ ] Can open PDF viewer
- [ ] Can download
- [ ] Cannot upload
- [ ] Cannot access admin
- [ ] Cannot manage users

## Uploader

- [ ] Can log in
- [ ] Can access uploader dashboard
- [ ] Can upload
- [ ] Can edit materials
- [ ] Can delete materials
- [ ] Cannot manage users
- [ ] Cannot change roles
- [ ] Cannot access Super Admin settings

## Super Admin

- [ ] Full access
- [ ] Can manage users
- [ ] Can assign roles
- [ ] Can manage materials
- [ ] Can manage subjects/categories
- [ ] Can view activity

## Security

- [ ] Unauthenticated users cannot access private content
- [ ] Direct file URLs do not expose permanent public storage
- [ ] R2 bucket is private
- [ ] Role checks happen server-side
- [ ] Database RLS is enabled
- [ ] Upload restrictions work
- [ ] Deleted files are removed from storage

---

# 31. Future Features

Do not build these initially unless needed.

Possible future additions:

- [ ] Favorites
- [ ] Recently viewed
- [ ] Download statistics
- [ ] View statistics
- [ ] Activity notifications
- [ ] Announcements
- [ ] Comments
- [ ] Material versioning
- [ ] Tags
- [ ] Advanced filtering
- [ ] File preview generation
- [ ] OCR for scanned PDFs
- [ ] AI-powered notes search
- [ ] PWA/mobile install
- [ ] Offline access
- [ ] Automatic backups

---

# 32. MVP Definition

The first production version should contain only the essentials:

```text
Authentication
      +
Role-based access
      +
User dashboard
      +
Subjects/categories
      +
Material upload
      +
Material listing
      +
PDF web viewer
      +
Download
      +
Search
      +
Admin dashboard
      +
Uploader role
      +
Private R2 storage
      +
Supabase RLS
```

Everything else can come later.

---

# 33. Final Recommended Architecture

```text
                    ┌─────────────────────────┐
                    │ notes.sidcandev.online  │
                    └────────────┬────────────┘
                                 │
                                 v
                         ┌───────────────┐
                         │    Next.js    │
                         └───────┬───────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                v                v                v
          Supabase Auth     PostgreSQL       Server APIs
                │                │                │
                │          Material Metadata     │
                │                │                │
                └────────────────┼────────────────┘
                                 │
                                 v
                         Cloudflare R2
                         Private Storage
                                 │
                       ┌─────────┴─────────┐
                       │                   │
                       v                   v
                   PDF.js Viewer       Download
```

## Core principle

The application should treat:

**Supabase = identity + database + permissions**

**R2 = actual files**

**Next.js = application/UI/server logic**

This keeps the architecture clean, secure, and inexpensive.

---

# 34. Build Priority

The correct order is:

1. Authentication
2. Database + roles
3. R2 storage
4. User dashboard
5. Material upload
6. Material browsing
7. PDF viewer
8. Download
9. Admin dashboard
10. Uploader permissions
11. Search
12. Security hardening
13. Deployment
14. Optional features

Do not start by building every feature at once. Get the authentication → database → storage → material flow working first.

---

# 35. Target Result

The finished website should feel like a private study library:

```text
                    STUDY LIBRARY
                         |
        +----------------+----------------+
        |                                 |
      Users                           Admins
        |                                 |
        v                                 v
 Browse / Search                    Manage Everything
 View Online                        Upload
 Download                           Edit
                                    Delete
                                    Manage Users
                                    Manage Roles
```

Only approved people get access, Uploaders can help manage content without receiving full administrative privileges, and the Super Admin retains complete control.
