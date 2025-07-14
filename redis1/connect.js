// connect.js

const { Client } = require('pg');
const { createClient } = require('redis');

// Config PostgreSQL
const pgClient = new Client({
  user: 'postgres',             // ton utilisateur PostgreSQL
  host: 'localhost',            // adresse PostgreSQL
  database: 'sakila',           // base de données
  password: '2019Fati#', // <-- remplace par ton mot de passe
  port: 5432,
});

// Config Redis
const redisClient = createClient({
  url: 'redis://localhost:6379', // adapte si nécessaire
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
