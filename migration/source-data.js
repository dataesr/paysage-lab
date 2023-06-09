import 'dotenv/config';
import fs from 'fs';
import pLimit from 'p-limit';
import * as XLSX from 'xlsx/xlsx.mjs';
import { db, clearDB } from './mongo.js';

const AUTH_TOKEN = process.env.AUTH_TOKEN;
const BASE_URL = process.env.BASE_URL;
const CONCURRENT_REQUESTS = process.env.CONCURRENT_REQUESTS;
const RNSR_URL = process.env.RNSR_URL;

const limit = pLimit(parseInt(CONCURRENT_REQUESTS, 10));
const mlimit = pLimit(200);

const data = fs.readFileSync('./rnsr_ror.xlsx', 'binary');
const workbook = XLSX.read(data, { type: 'binary' });

function readSheets(workbook, sheetNames) {
  return sheetNames.reduce((acc, sheetName) => {
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    return { ...acc, [sheetName]: sheet }
  }, {})
}
async function saveJson(collection, json) {
  await db.collection(collection).insertMany(json);
}

async function getAllStructuresIds() {
  const ids = await fetch(RNSR_URL).then(res => res.json());
  console.log(ids.map(({ numero_national_de_structure }) => ({ rnsr: numero_national_de_structure })))
  return db.collection('structures').insertMany(ids.map(({ numero_national_de_structure }) => ({ rnsr: numero_national_de_structure })))
}

const getStructureByIdFromFetcher = async (rnsr) => {
  return fetch(`${BASE_URL}/structures/${rnsr}`, { headers: { Authorization: AUTH_TOKEN } })
    .then(res => res.json())
    .then(({ data }) => data)
    .catch(e => console.log(`${BASE_URL}/structures/${id} -- ${e.message}`))
}
const updateStructure = async (doc) => db.collection('structures').updateOne({ rnsr: doc.id }, { $set: { ...doc } })

const getAllStructuresFromFetcher = async () => {
  const ids = await db.collection('structures').find({}).toArray();
  const queries = ids.map(({ rnsr }) => limit(() => getStructureByIdFromFetcher(rnsr)))
  const structures = await Promise.all(queries);
  console.log(`${structures.length} structures to update`);
  const updateQueries = structures.map((s) => mlimit(() => updateStructure(s)));
  const updatedStructures = await Promise.all(updateQueries);
}

const getRNSRInstitutionsFromFetcher = async () => {
  const institutions = await fetch(`${BASE_URL}/institutions`, { headers: { Authorization: AUTH_TOKEN } })
    .then(res => res.json()).then(({ data }) => data)
  await db.collection('institutions').insertMany(institutions);
}

const getRNSRLeadersFromFetcher = async () => {
  const leaders = await fetch(`${BASE_URL}/leaders`, { headers: { Authorization: AUTH_TOKEN } })
    .then(res => res.json()).then(({ data }) => data)
  await db.collection('leaders').insertMany(leaders);
}


async function run() {
  await clearDB(db);
  const { tutelles, labos, ED } = readSheets(workbook, ['tutelles', 'labos', 'ED']);
  await saveJson('tutelles-ids', tutelles);
  await saveJson('labos-ids', labos);
  await saveJson('ED-ids', ED);
  await getAllStructuresIds();
  await getAllStructuresFromFetcher();
  await getRNSRLeadersFromFetcher();
  await getRNSRInstitutionsFromFetcher();
  process.exit(0);
}


run()



