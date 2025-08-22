# Music Lamp backend!

- Please, we need to good and be secure. Better security practices and
  access to all API features is what we want!

- This repo and the frontend Music Lamp is a playground for exploring and documenting anything related music tech.

---

## 📦 Database Commands (Prisma + Neon)

### 1. Generate the Prisma client

Run this after changing `schema.prisma` (usually happens automatically on install):

```bash
npx prisma generate
```

### 2. Apply migrations (create/update tables in DB)

Create a new migration after editing `schema.prisma`:

```bash
npx prisma migrate dev -n "migration_name"
```

Deploy migrations to production DB:

```bash
npx prisma migrate deploy
```

### 3. Open Prisma Studio (browser UI for DB)

```bash
npx prisma studio
```

### 4. Seed the database (insert starter data)

Run the seed script manually:

```bash
npx tsx prisma/seed.ts
```

### 5. Reset the database (⚠️ destructive — wipes all data)

```bash
npx prisma migrate reset
```

This will:

- Drop all tables
- Reapply migrations
- Optionally run the seed script

---

✅ With just these commands you can:

- Update schema → migrate
- Explore DB → studio
- Populate DB → seed
- Fix/reset DB → migrate reset

---
