const exaDiscovery = require('./src/services/exaDiscovery');
console.log('Type:', typeof exaDiscovery);
console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(exaDiscovery)));
