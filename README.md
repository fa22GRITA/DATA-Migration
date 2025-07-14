# Bases-de-donn-es-SQL-et-NoSQL


Migration des données de la base relationnelle **Sakila (PostgreSQL)** vers les bases NoSQL **Redis** et **MongoDB**.

---

## 📦 1. Préparation de la base PostgreSQL

- Installer **PostgreSQL** et **pgAdmin**
- Créer la base `sakila`
- Importer les scripts :
  - `sakila-schema.sql`
  - `sakila-data.sql`

---

## 🚀 2. Migration vers Redis (Country & City)

Migration des tables `country` et `city` depuis PostgreSQL vers Redis via **Redis Stack** et **RedisJSON**.

### 🐳 Lancer Redis Stack avec Docker

```bash
docker run -d --name redis-stack \
  -p 6379:6379 -p 8001:8001 \
  redis/redis-stack:latest
````

* Redis sera accessible sur : `localhost:6379`
* RedisInsight (interface web) : [http://localhost:8001](http://localhost:8001)

![RedisInsight](https://github.com/user-attachments/assets/ace660db-3654-4f7a-b6e6-f501ed7dbb4c)

---

### 🧩 Script de migration `connect.js`

```js
const { Client } = require('pg');
const { createClient } = require('redis');

// Config PostgreSQL
const pgClient = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sakila',
  password: '2019Fati#', // <-- à remplacer par votre mot de passe
  port: 5432,
});

// Config Redis
const redisClient = createClient({
  url: 'redis://localhost:6379',
});

async function migrateCountry() {
  console.log('🔄 Migration de la table country...');
  const res = await pgClient.query('SELECT * FROM country');
  for (const row of res.rows) {
    const key = `country:${row.country_id}`;
    const value = {
      country: row.country,
      last_update: row.last_update.toISOString(),
    };
    await redisClient.json.set(key, '$', value);
    console.log(`✅ Ajouté dans Redis : ${key}`);
  }
}

async function migrateCity() {
  console.log('🔄 Migration de la table city...');
  const res = await pgClient.query('SELECT * FROM city');
  for (const row of res.rows) {
    const key = `city:${row.city_id}`;
    const value = {
      city: row.city,
      country_id: row.country_id,
      last_update: row.last_update.toISOString(),
    };
    await redisClient.json.set(key, '$', value);
    console.log(`✅ Ajouté dans Redis : ${key}`);
  }
}

async function migrate() {
  try {
    await pgClient.connect();
    await redisClient.connect();

    await migrateCountry();
    await migrateCity();

    await pgClient.end();
    await redisClient.quit();

    console.log('🎉 Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur de migration :', error);
  }
}

migrate();
```

* Les clés Redis auront les noms `country`, `cit`.
* Visualiser via RedisInsight en tapant `country:` ou `city:` dans la recherche.

![Redis Country](https://github.com/user-attachments/assets/29609f08-fef1-4f41-a8b6-d5aa528a9074)
![Redis City](https://github.com/user-attachments/assets/a3082fdf-82de-43e6-8523-a1affeff0017)

---

## 🍃 3. Migration vers MongoDB (Film, Actor, Category, Language)

### ⚙️ Environnement utilisé

* PostgreSQL (via **pgAdmin 4**)
* MongoDB 8.0 avec **MongoDB Database Tools**
* **PowerShell** / Terminal Windows
* Outil en ligne : [csvjson.com](https://csvjson.com/csv2json)

---

### 📤 Étapes de migration

#### 1. Exporter les tables depuis PostgreSQL en CSV

```bash
psql -U postgres -d sakila
```

```sql
\copy film TO 'C:/Users/fatig/Desktop/migration/film.csv' DELIMITER ',' CSV HEADER;
\copy actor TO 'C:/Users/fatig/Desktop/migration/actor.csv' DELIMITER ',' CSV HEADER;
\copy category TO 'C:/Users/fatig/Desktop/migration/category.csv' DELIMITER ',' CSV HEADER;
\copy language TO 'C:/Users/fatig/Desktop/migration/language.csv' DELIMITER ',' CSV HEADER;
```

---

#### 2. Convertir les CSV en JSON

* Ouvrir : [https://csvjson.com/csv2json](https://csvjson.com/csv2json)
* Sélectionner **Output format** : `JSON (Array)`
* Télécharger les `.json` correspondants

---

#### 3. Importer les JSON dans MongoDB

Se placer dans le dossier MongoDB Tools :

```bash
cd "C:\Program Files\MongoDB\Tools\100\bin"
```

Exécuter les commandes :

```bash
.\mongoimport --db sakila_mongo --collection film --file "C:/Users/fatig/Desktop/migration/film.json" --jsonArray
.\mongoimport --db sakila_mongo --collection actor --file "C:/Users/fatig/Desktop/migration/actor.json" --jsonArray
.\mongoimport --db sakila_mongo --collection category --file "C:/Users/fatig/Desktop/migration/category.json" --jsonArray
.\mongoimport --db sakila_mongo --collection language --file "C:/Users/fatig/Desktop/migration/language.json" --jsonArray
```

---

#### 4. Vérification dans MongoDB Compass

* Se connecter à : `mongodb://localhost:27017`
* Base de données : `sakila_mongo`
* Visualiser les collections `film`, `actor`, `category`, `language`

![MongoDB Compass](https://github.com/user-attachments/assets/37b2853c-10f6-4895-b3db-54dba8778fd6)

---

✅ **Migration NoSQL réussie !**


