const production = {
  jwtSecret: process.env.JWT_SECRET,
  defaultAccountConfirmation: false,
  totpWindow: [20, 0],
  accessTokenExpiresIn: '10d',
  refreshTokenExpiresIn: '20d',
  otpHeader: 'x-paysage-lab-otp',
  otpMethodHeader: 'x-paysage-lab-otp-method',
  systemName: 'paysage-lab',
  mongo: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    mongoDbName: process.env.MONGO_DBNAME || 'paysage-lab',
  },
  elastic: {
    node: process.env.ES_NODE,
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD,
    index: 'paysage-lab',
  },
  objectStorage: {
    credentials: {
      version: 'v3',
      keystoneAuthVersion: 'v3',
      provider: 'openstack',
      authUrl: process.env.OVH_AUTH_URL,
      username: process.env.OVH_USERNAME,
      password: process.env.OVH_PASSWORD,
      tenantId: process.env.OVH_TENANT_ID,
      tenantName: process.env.OVH_TENANT_NAME,
      domainName: 'Default',
      projectDomainName: 'Default',
      region: process.env.OVH_REGION,
    },
    container: 'paysage-lab',
  },
  logger: {
    logLevel: 'info',
  },
  hostname: 'https://paysage-lab.dataesr.ovh',
};

const staging = {
  ...production,
  defaultAccountConfirmation: true,
  objectStorage: {
    ...production.objectStorage,
    container: 'paysage-lab-staging',
  },
  elastic: {
    ...production.elastic,
    index: 'paysage-lab-staging',
  },
  hostname: 'https://paysage-lab.staging.dataesr.ovh',
};

const testing = {
  ...production,
  jwtSecret: 'VerYvErySecrREt',
  defaultAccountConfirmation: true,
  mongo: {
    ...production.mongo,
    mongoDbName: 'paysage-lab-test',
  },
  elastic: {
    ...production.elastic,
    index: 'paysage-lab-test',
  },
  objectStorage: {
    ...production.objectStorage,
    container: 'paysage-lab-test',
  },
  logger: {
    logLevel: 'error',
  },
};

const development = {
  ...production,
  jwtSecret: 'VerYvErySecrREt',
  defaultAccountConfirmation: true,
  mongo: {
    ...production.mongo,
    mongoDbName: process.env.MONGO_DBNAME || 'paysage-lab-dev',
  },
  elastic: {
    ...production.elastic,
    index: 'paysage-lab-dev',
  },
  objectStorage: {
    ...production.objectStorage,
    container: 'paysage-lab-dev',
  },
  logger: {
    logLevel: 'debug',
  },
  hostname: 'http://localhost:3000',
};

const configs = {
  development,
  production,
  staging,
  testing,
};

export default configs[process.env.NODE_ENV];
