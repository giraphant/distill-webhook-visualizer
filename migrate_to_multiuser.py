#!/usr/bin/env python3
"""
Migration script to convert single-user data to multi-user format.
This script will assign all existing data to the admin user (ID=1).
"""

from app.models.database import SessionLocal, User, ConstantCard, PushoverConfig
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("Starting migration to multi-user system...")

        # Get admin user (should be ID=1)
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("ERROR: Admin user not found. Please restart the app to create it.")
            return

        print(f"Found admin user: {admin.username} (ID: {admin.id})")

        # Migrate constant_cards - add user_id column if it doesn't exist
        try:
            # Check if user_id column exists
            result = db.execute(text("PRAGMA table_info(constant_cards)")).fetchall()
            columns = [row[1] for row in result]

            if 'user_id' not in columns:
                print("Adding user_id column to constant_cards...")
                db.execute(text("ALTER TABLE constant_cards ADD COLUMN user_id INTEGER"))
                db.commit()

                # Update all existing constant cards to belong to admin
                db.execute(text(f"UPDATE constant_cards SET user_id = {admin.id}"))
                db.commit()
                print(f"✓ Migrated constant_cards to user_id={admin.id}")
            else:
                print("constant_cards already has user_id column")
        except Exception as e:
            print(f"Error migrating constant_cards: {e}")
            db.rollback()

        # Migrate pushover_config - add user_id column if it doesn't exist
        try:
            result = db.execute(text("PRAGMA table_info(pushover_config)")).fetchall()
            columns = [row[1] for row in result]

            if 'user_id' not in columns:
                print("Adding user_id column to pushover_config...")
                db.execute(text("ALTER TABLE pushover_config ADD COLUMN user_id INTEGER"))
                db.commit()

                # Update all existing configs to belong to admin
                db.execute(text(f"UPDATE pushover_config SET user_id = {admin.id}"))
                db.commit()
                print(f"✓ Migrated pushover_config to user_id={admin.id}")
            else:
                print("pushover_config already has user_id column")
        except Exception as e:
            print(f"Error migrating pushover_config: {e}")
            db.rollback()

        print("\n✅ Migration completed successfully!")
        print(f"All existing data has been assigned to user: {admin.username}")

    finally:
        db.close()

if __name__ == "__main__":
    migrate()
