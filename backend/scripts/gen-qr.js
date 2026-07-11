import qrcode from 'qrcode';

const otpauthUrl = process.argv[2];

if (!otpauthUrl) {
  console.error('Usage: node scripts/gen-qr.js "<otpauthUrl>"');
  process.exit(1);
}

qrcode.toString(otpauthUrl, { type: 'terminal', small: true }, (err, url) => {
  if (err) throw err;
  console.log(url);
});