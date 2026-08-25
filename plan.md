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
├ login
├ dashboard
├ subjects
├ subjects/[subject]
├ materials/[id]
├ search
├ bookmarks
└ profile
```

Admin area:

```text
/admin
├ dashboard
├ materials
├ materials/upload
├ materials/[id]/edit
├ subjects
├ categories
├ users
├ uploaders
├ activity
└ settings
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
```

Now let me add the plan.md back to git and commit.
<tool_call>
<function=bash>
<parameter=command>
git add plan.md && git commit -m "restore: plan.md development plan"