import fs from 'fs';

async function downloadAndUpload(url, publicId) {
  console.log(`Downloading ${publicId} from ${url}...`);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 FCTAutomobile/1.0' } });
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Sauvegarde locale dans public/vehicles et website/public/vehicles
  fs.writeFileSync(`public/vehicles/${publicId}.jpg`, buffer);
  fs.writeFileSync(`website/public/vehicles/${publicId}.jpg`, buffer);

  console.log(`Uploading ${publicId} to Cloudinary...`);
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const fd = new FormData();
  fd.append('file', blob, `${publicId}.jpg`);
  fd.append('upload_preset', 'fct_erp_unsigned');
  fd.append('folder', 'fct_automobile/vehicles');
  fd.append('public_id', publicId);

  const upRes = await fetch('https://api.cloudinary.com/v1_1/c58pcgcp/image/upload', {
    method: 'POST',
    body: fd,
  });

  const json = await upRes.json();
  if (json.secure_url) {
    console.log(`SUCCESS [${publicId}]: ${json.secure_url}`);
    return json.secure_url;
  } else {
    console.error(`ERROR [${publicId}]:`, json);
    return null;
  }
}

async function main() {
  const gleUrl = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Mercedes-Benz_GLE_450_4MATIC_AMG_Line_W167_Black_%283%29.jpg';
  const corollaUrl = 'https://upload.wikimedia.org/wikipedia/commons/4/4c/2020_Toyota_Corolla_Cross_-_Front.jpg';

  const gle = await downloadAndUpload(gleUrl, 'mercedes_gle_450');
  const corolla = await downloadAndUpload(corollaUrl, 'toyota_corolla_cross');

  console.log('FINAL URLS:', { gle, corolla });
}

main().catch(console.error);
