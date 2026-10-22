from app import app, db

print('Testing connection...')
with app.app_context():
    db.create_all()
    print('Database connected successfully!')
