import 'dotenv/config';
import pLimit from 'p-limit';
import { db } from './mongo.js';
import { capitalize, capitalizeArray } from './utils.js';
const API_KEY = process.env.API_KEY;
import { Double } from 'mongodb';

const mlimit = pLimit(200);

function fromRNSR2PlightModel(obj) {
  const newLeaders = obj.leaders.map((l) => {
    return {
      resourceId: obj.id,
      relatedObjectId: `p${l.rnsr_key}`,
      relationType: capitalize(l.role),
      startDate: l.start_date?.split('T')[0],
      endDate: l.end_date?.split('T')[0],
      relationTag: 'gouvernance'
    };
  });
  const newSupervisors = obj.supervisors.map((l) => {
    return {
      resourceId: obj.id,
      relatedObjectId: `i${l.rnsr_key}`,
      relationType: capitalize(l.supervision_type),
      startDate: l.start_date?.split('T')[0],
      endDate: l.end_date?.split('T')[0],
      relationTag: 'supervision',
    };
  });
  const newParents = obj.parents.map((l) => {
    return {
      resourceId: obj.id,
      relatedObjectId: l.id,
      relationType: (l?.exclusive !== false) ? 'Relation exclusive' : 'Relation non exclusive',
      startDate: l.start_date?.split('T')[0],
      endDate: l.end_date?.split('T')[0],
      relationTag: 'structure-parent',
    };
  });
  const newPredecessors = obj.predecessors.map((l) => {
    return {
      resourceId: obj.id,
      relatedObjectId: l.id,
      relationType: capitalize(l.succession_type),
      startDate: l.succession_date?.split('T')[0],
      relationTag: 'structure-predecesseur',
    };
  });
  const newPanels = obj.panels.map((l) => {
    return {
      resourceId: obj.id,
      relatedObjectId: l.code,
      startDate: l.start_date?.split('T')[0],
      endDate: l.end_date?.split('T')[0],
      relationTag: 'structure-categorie',
    };
  });
  const newDomains = obj.rnsr_domains.map((l) => {
    return {
      resourceId: obj.id,
      relatedObjectId: capitalize(l),
      relationTag: 'structure-categorie',
    };
  });

  const relations = [
    ...newLeaders,
    ...newSupervisors,
    ...newParents,
    ...newPredecessors,
    ...newPanels,
    ...newDomains,
    {
      resourceId: obj.id,
      relatedObjectId: capitalize(obj.type),
      relationTag: 'structure-categorie',
    },
    {
      resourceId: obj.id,
      relatedObjectId: capitalize(obj.level),
      relationTag: 'structure-categorie',
    }
  ]

  const structure = {
    id: obj.id,
    usualName: obj?.name?.label,
    acronymFr: obj?.name?.acronym,
    descriptionFr: obj?.description,
    rnsr: obj.id,
    codeNumber: obj.code_numbers?.join(';'),
    creationDate: obj.dates?.start_date?.split('T')[0],
    closureDate: obj.dates?.end_date?.split('T')[0],
    websiteFr: obj.website,
    address: obj.input_address,
    iso3: 'FRA',
    country: 'France',
    // email: obj.email,
    thematics: capitalizeArray(obj.rnsr_themes),
  }
  return [
    structure,
    relations,
  ];
}

async function appendStructureIdentifiers(obj) {
  const query = await db.collection('labos-ids').findOne({ rnsr: obj.rnsr });
  if (!query) return obj;
  const { ror = null, idref = null, paysage = null } = query;
  return { ...obj, ror, idref, paysage };
}

async function savePLightStructure(structure) {
  const [newStructure, relations] = fromRNSR2PlightModel(structure);
  const newStructureWithIdentifiers = await appendStructureIdentifiers(newStructure);

  await db.collection('plight_structures').insertOne(newStructureWithIdentifiers);
  if (relations.length === 0) return;
  await db.collection('plight_relations').insertMany(relations);
}

async function savePLightStructures() {
  const structures = await db.collection('structures').find({}).toArray();
  const queries = structures.map((s) => mlimit(() => savePLightStructure(s)));
  const insertedStructures = await Promise.all(queries);
  console.log(`${insertedStructures.length} structures inserted`);
}

function fromRNSR2PlightIntitutionModel(obj) {
  const relations = [
    {
      resourceId: `i${obj.rnsr_key}`,
      relatedObjectId: obj.kind,
      relationTag: 'structure-categorie',
    },
    {
      resourceId: `i${obj.rnsr_key}`,
      relatedObjectId: 'Tutelle',
      relationTag: 'structure-categorie',
    },
  ]
  const inst = {
    id: `i${obj.rnsr_key}`,
    usualName: obj.name,
    acronymFr: obj.acronym,
    siret: obj?.rnsr_siret,
    uai: obj.rnsr_uai,
    creationDate: obj.start_date?.split('T')[0],
    closureDate: obj.end_date?.split('T')[0],
  }
  return [
    inst,
    relations,
  ];
}

async function appendInstitutionIdentifiers(obj) {
  const siret = new Double(parseInt(obj.siret, 10));
  if (!siret) return obj;
  const query = await db.collection('tutelles-ids').findOne({ siret });
  if (!query) return obj;
  const { ror = null, idref = null, paysage = null, wikidata = null, grid = null } = query;
  return { ...obj, ror, idref, paysage, wikidata, grid };
}

async function savePLightInstitution(structure) {
  const [newStructure, relations] = fromRNSR2PlightIntitutionModel(structure);
  const newStructureWithIdentifiers = await appendInstitutionIdentifiers(newStructure);

  await db.collection('plight_structures').insertOne(newStructureWithIdentifiers);
  if (relations.length === 0) return;
  await db.collection('plight_relations').insertMany(relations);
}

async function savePLightInstitutions() {
  const structures = await db.collection('institutions').find({}).toArray();
  const queries = structures.map((s) => mlimit(() => savePLightInstitution(s)));
  const insertedStructures = await Promise.all(queries);
  console.log(`${insertedStructures.length} institutions inserted`);
}

function fromRNSR2PlightPersonModel(obj) {
  const lead = {
    id: `p${obj.rnsr_key}`,
    firstName: obj.first_name,
    lastName: obj.last_name,
    gender: (obj?.gender === "M") ? "Homme" : (obj?.gender === "F") ? "Femme" : "Autre",
  }
  return lead;
}

async function savePLightPerson(leader) {
  const p = fromRNSR2PlightPersonModel(leader);
  await db.collection('plight_persons').insertOne(p);
}

async function savePLightPersons() {
  const persons = await db.collection('leaders').find({}).toArray();
  const queries = persons.map((p) => mlimit(() => savePLightPerson(p)));
  const insertedPersons = await Promise.all(queries);
  console.log(`${insertedPersons.length} persons inserted`);
}

async function getCategories() {
  const cat = await db.collection('plight_relations').distinct('relatedObjectId', { relationTag: 'structure-categorie' });
  return cat.reduce((acc, cur) => [...acc, {usualNameFr: cur}], []);
}

async function getRelationTypes() {
  const rel = await db.collection('plight_relations').distinct('relationType');
  return rel.reduce((acc, cur) => [...acc, {name: cur, for: ['structures', 'persons']}], []);
}

async function handleRelationTypeImport(r) {
  const res = await fetch(`http://localhost:3000/relation-types`, {
    method: 'POST',
    body: JSON.stringify(r),
    headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
  }).then(res => res.json());
  const {name, id} = res;
  await db.collection('plight_relations').updateMany({relationType: name}, {$set: {relationTypeId: id}});
}
async function handleCategoryImport(c) {
  const res = await fetch(`http://localhost:3000/categories`, {
    method: 'POST',
    body: JSON.stringify(c),
    headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
  }).then(res => res.json());
  const {usualNameFr, id} = res;
  await db.collection('plight_relations').updateMany({relatedObjectId: usualNameFr}, {$set: {relatedObjectId: id}});
}
async function handlePersonImport(p) {
  const {id: pKey, ...rest} = p;
  const res = await fetch(`http://localhost:3000/persons`, {
    method: 'POST',
    body: JSON.stringify(rest),
    headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
  }).then(res => res.json()).catch(e => { console.log(e);});
  const { id } = res;
  await db.collection('plight_relations').updateMany({relatedObjectId: pKey}, {$set: {relatedObjectId: id}});
}
async function handleStructuresImport(s) {
  const { id: sKey, ...rest } = s
  const res = await fetch(`http://localhost:3000/structures`, {
    method: 'POST',
    body: JSON.stringify(rest),
    headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
  }).then(res => res.json()).catch(e => { console.log(e);});
  console.log(res);
  const { id } = res;
  console.log(id, sKey, rest, res);
  await db.collection('plight_relations').updateMany({ relatedObjectId: sKey }, { $set: { relatedObjectId: id } });
  await db.collection('plight_relations').updateMany({ resourceId: sKey }, { $set: { resourceId: id } });
}
async function handleRelationsImport(r) {
  const { relationType, ...rest } = r
  console.log(rest);
  return fetch(`http://localhost:3000/relations`, {
    method: 'POST',
    body: JSON.stringify(rest),
    headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
  }).then(res => {console.log(res); return res.json()}).catch(e => { console.log(e);});
}

async function insertCategories() {
  const categories = await getCategories();
  const queries = categories.map((c) => mlimit(() => handleCategoryImport(c)));
  await Promise.all(queries);
}
async function insertRelationTypes() {
  const relationTypes = await getRelationTypes();
  const queries = relationTypes.map((r) => mlimit(() => handleRelationTypeImport(r)));
  await Promise.all(queries);
}
async function insertStructures() {
  const structures = await db.collection('plight_structures').find({}).toArray();
  const queries = structures.map((s) => mlimit(() => handleStructuresImport(s)));
  await Promise.all(queries);
}
async function insertPersons() {
  const persons = await db.collection('plight_persons').find({}).toArray();
  const queries = persons.map((p) => mlimit(() => handlePersonImport(p)));
  await Promise.all(queries);
}
async function insertRelations() {
  const rel = await db.collection('plight_relations').find({}).toArray();
  const queries = rel.map((r) => mlimit(() => handleRelationsImport(r)));
  await Promise.all(queries);
}

async function run () {
  console.log('Starting emptying collections');
  await db.collection('plight_structures').deleteMany({});
  await db.collection('plight_relations').deleteMany({});
  await db.collection('plight_persons').deleteMany({});
  await db.collection('plight_categories').deleteMany({});
  console.log('Collections emptied');
  console.log('Starting import');
  await savePLightStructures();
  await savePLightInstitutions();
  await savePLightPersons();
  console.log('Import done');
  console.log('Starting categories import');
  await insertCategories();
  console.log('Categories import done');
  console.log('Starting relation types import');
  await insertRelationTypes();
  console.log('Relation types import done');
  console.log('Starting persons import');
  await insertPersons();
  console.log('Persons import done');
  console.log('Starting structures import');
  await insertStructures();
  console.log('Structures import done');
  console.log('Starting relations import');
  await insertRelations();
  console.log('Relations import done');
  process.exit(0);
}


run()



