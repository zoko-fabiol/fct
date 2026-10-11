import fs from 'fs';

async function uploadToCloudinary(filePath, publicId) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  const fd = new FormData();
  fd.append('file', blob, `${publicId}.jpg`);
  fd.append('upload_preset', 'fct_erp_unsigned');
  fd.append('folder', 'fct_automobile/vehicles');
  fd.append('public_id', publicId);

  const res = await fetch('https://api.cloudinary.com/v1_1/c58pcgcp/image/upload', {
    method: 'POST',
    body: fd,
  });

  const json = await res.json();
  if (json.secure_url) {
    console.log(`SUCCESS [${publicId}]: ${json.secure_url}`);
    return json.secure_url;
  } else {
    console.error(`ERROR [${publicId}]:`, json);
    return null;
  }
}

async function main() {
  const prado = await uploadToCloudinary('public/vehicles/prado.jpg', 'toyota_prado_txl');
  const hilux = await uploadToCloudinary('public/vehicles/hilux.jpg', 'toyota_hilux_revo');
  const pajero = await uploadToCloudinary('public/vehicles/pajero.jpg', 'mitsubishi_pajero_sport');
  console.log('ALL DONE:', { prado, hilux, pajero });
}

main().catch(console.error);
