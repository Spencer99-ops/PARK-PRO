"""
Script de migration de SQLite vers PostgreSQL
Exporte les données de parking.db vers PostgreSQL
"""

import sqlite3
import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
SQLITE_DB = 'parking.db'
POSTGRES_URL = os.getenv('DATABASE_URL')

def migrate():
    if not POSTGRES_URL:
        print("ERREUR: DATABASE_URL non défini dans .env")
        print("Créez un fichier .env avec: DATABASE_URL=postgresql://user:password@host:port/dbname")
        return

    # Parse DATABASE_URL
    # Format: postgresql://user:password@host:port/dbname
    if POSTGRES_URL.startswith('postgresql://'):
        url = POSTGRES_URL.replace('postgresql://', '')
        if '@' in url:
            auth_part, host_part = url.split('@')
            if ':' in auth_part:
                user, password = auth_part.split(':')
            else:
                user = auth_part
                password = ''
            if '/' in host_part:
                host_port, dbname = host_part.split('/')
            else:
                host_port = host_part
                dbname = 'postgres'
            if ':' in host_port:
                host, port = host_port.split(':')
            else:
                host = host_port
                port = '5432'
        else:
            print("Format DATABASE_URL invalide")
            return
    else:
        print("DATABASE_URL doit commencer par postgresql://")
        return

    print(f"Connexion à PostgreSQL: {user}@{host}:{port}/{dbname}")

    try:
        # Connexion SQLite
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        sqlite_conn.row_factory = sqlite3.Row
        sqlite_cursor = sqlite_conn.cursor()

        # Connexion PostgreSQL
        pg_conn = psycopg2.connect(
            host=host,
            port=port,
            database=dbname,
            user=user,
            password=password
        )
        pg_cursor = pg_conn.cursor()

        # Liste des tables à migrer
        tables = [
            'utilisateurs',
            'places',
            'reservations',
            'abonnements',
            'abonnes',
            'vehicules',
            'transactions',
            'configuration_paiement',
            'configuration_banque'
        ]

        for table in tables:
            print(f"\nMigration de la table: {table}")

            # Lire les données SQLite
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()

            if not rows:
                print(f"  Table {table} vide ou inexistante")
                continue

            # Obtenir les colonnes
            columns = [desc[0] for desc in sqlite_cursor.description]
            print(f"  Colonnes: {columns}")
            print(f"  Nombre de lignes: {len(rows)}")

            # Insérer dans PostgreSQL
            for row in rows:
                row_dict = dict(row)
                columns_list = list(row_dict.keys())
                values_list = list(row_dict.values())

                insert_query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
                    sql.Identifier(table),
                    sql.SQL(', ').join(map(sql.Identifier, columns_list)),
                    sql.SQL(', ').join(sql.Placeholder() * len(values_list))
                )

                try:
                    pg_cursor.execute(insert_query, values_list)
                except Exception as e:
                    print(f"  Erreur insertion: {e}")
                    continue

            pg_conn.commit()
            print(f"  Table {table} migrée avec succès")

        print("\n✅ Migration terminée!")

        sqlite_conn.close()
        pg_conn.close()

    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
        if 'pg_conn' in locals():
            pg_conn.rollback()
            pg_conn.close()
        if 'sqlite_conn' in locals():
            sqlite_conn.close()

if __name__ == '__main__':
    migrate()
