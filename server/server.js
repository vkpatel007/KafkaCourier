const express = require('express');
const app = express();
const path = require('path');
const { Kafka } = require('kafkajs');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const PG_URI = process.env.PG_URI;

const pool = new Pool({
  connectionString: PG_URI,
});
const kafkaController = require('./controllers/kafkaController');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

//serve static files
app.use(express.static(path.join(__dirname, './src')));

//create user
app.post('/api/createUser', async (req, res) => {
  // get credentials from req.body
  const { user_id, server, key, secret } = req.body;
  //sql query
  const query = `INSERT INTO login (user_id, server, key, secret)
                VALUES ($1, $2, $3, $4)
                RETURNING *`;
  const result = await pool.query(query, [user_id, server, key, secret]);
  res.status(200).json(result.rows[0]);
});

app.get('/api/checkUser/:user', async (req, res) => {
  const { user } = req.params;
  //sql query here
  const query = `SELECT * FROM login WHERE user_id=$1;`;
  const result = await pool.query(query, [user]);
  // database response => exists or doesn't exist
  // res.status(200).json(true or false)
  // console.log('server result: ', result.rows);
  res.status(200).json(result.rows);
});

// get topic data
app.get('/api/topic', kafkaController.getTopicData, (req, res, next) => {
  res.status(200).json(res.locals.topicMetaData);
});

//catch-all route for errors
app.get('*', (req, res) => {
  res.sendStatus(404);
});

// start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
