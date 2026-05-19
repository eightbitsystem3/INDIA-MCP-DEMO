const { Client } = require('@elastic/elasticsearch');

export const esClient  = new Client({
  node: 'https://es.local',
  auth: {
    username: 'elastic',
    password: 'wPz5p109s85DDUB36eauF2B4',
  },
  tls: {
    rejectUnauthorized: false, // self-signed cert
  },
});

async function test() {
  const result = await esClient .info();
  console.log(result);
}

test().catch(console.error);