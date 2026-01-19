import firebase_admin
from firebase_admin import credentials, firestore, auth

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

ADMIN_EMAIL = "hr@company.com"

employees_ref = db.collection("employees")
old_docs = employees_ref.stream()

for doc in old_docs:
    data = doc.to_dict()

    # Skip already-migrated UID docs
    if len(doc.id) > 10:
        continue

    email = data.get("email")
    if not email:
        print(f"❌ Skipping {doc.id} (no email)")
        continue

    try:
        user = auth.get_user_by_email(email)
        uid = user.uid

        role = "ADMIN" if email == ADMIN_EMAIL else "EMPLOYEE"

        new_data = data.copy()
        new_data["empCode"] = data.get("empCode", doc.id)
        new_data["role"] = role

        employees_ref.document(uid).set(new_data)

        print(f"✅ Migrated {email} → {uid}")

        employees_ref.document(doc.id).delete()
        print(f"🗑️ Deleted old doc {doc.id}")

    except Exception as e:
        print(f"❌ Failed for {email}: {e}")

print("\n🎉 Employee migration completed")
