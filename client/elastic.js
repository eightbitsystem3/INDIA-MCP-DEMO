import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: 'https://es.local',
  auth: {
    username: 'elastic',
    password: 'wPz5p109s85DDUB36eauF2B4',
  },
  tls: {
    rejectUnauthorized: false,
  },
});