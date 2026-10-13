const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

console.log('Génération de la paire de clés RSA 2048 bits pour FCT Automobile...');
const keys = forge.pki.rsa.generateKeyPair(2048);

console.log('Génération du certificat X.509 FCT Automobile...');
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01' + Date.now();
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 30);

const attrs = [
  { name: 'commonName', value: 'FCT Automobile' },
  { name: 'countryName', value: 'CM' },
  { shortName: 'ST', value: 'Littoral' },
  { name: 'localityName', value: 'Douala' },
  { name: 'organizationName', value: 'Franchise Conseils Trading' },
  { shortName: 'OU', value: 'Direction Automobile' }
];
cert.setSubject(attrs);
cert.setIssuer(attrs);

// Self-sign certificate
cert.sign(keys.privateKey, forge.md.sha256.create());

console.log('Création du conteneur PKCS#12 (Keystore Android)...');
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
  keys.privateKey,
  [cert],
  'fctautomobile2026',
  {
    alias: 'fctkey',
    algorithm: '3des'
  }
);

const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
const p12Buffer = Buffer.from(p12Der, 'binary');

const outputPath = path.resolve(__dirname, '..', 'android', 'app', 'fct-release.keystore');
fs.writeFileSync(outputPath, p12Buffer);
console.log(`Keystore persistant généré avec succès dans : ${outputPath} (${p12Buffer.length} octets)`);
