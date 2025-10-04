# Setup Instructions

## Initial User Setup

This application comes with three pre-configured user accounts. You need to set their passwords using environment variables.

### Step 1: Create .env file

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Set passwords

Edit the `.env` file and set secure passwords for each user:

```bash
RAMU_PASSWORD=your_secure_password_here
LIGIGY_PASSWORD=your_secure_password_here
QUASI_PASSWORD=your_secure_password_here
```

**Important:** 
- The `.env` file is already in `.gitignore` and will NOT be committed to git
- Use strong, unique passwords for each user
- Keep the `.env` file secure and do not share it

### Step 3: Reset users (if needed)

If you need to reset all users and passwords, run:

```bash
docker exec distill-webhook-visualizer_app_1 python -c "
from app.models.database import SessionLocal, User
db = SessionLocal()
db.query(User).delete()
db.commit()
print('Deleted all users')
db.close()
"

docker-compose restart
```

The users will be recreated with the passwords from your `.env` file.

## User Accounts

The application creates three user accounts on first startup:
- **ramu** - Password from `RAMU_PASSWORD`
- **ligigy** - Password from `LIGIGY_PASSWORD`
- **quasi** - Password from `QUASI_PASSWORD`

All users share the same webhook data and configurations.
