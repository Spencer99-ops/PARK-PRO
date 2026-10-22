from app import app

# Pour Vercel, l'application doit être exportée
application = app

if __name__ == "__main__":
    app.run()
