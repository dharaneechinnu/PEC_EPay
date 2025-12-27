const https = require('https');
const jwt = require('jsonwebtoken');

const verifyGoogleIdToken = (token) =>
  new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
    https
      .get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => (data += chunk));
        resp.on('end', () => {
          try {
            const payload = JSON.parse(data);
            resolve(payload);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (err) => reject(err));
  });

const generateJwt = (payload, opts = {}) => {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const signOpts = { expiresIn: opts.expiresIn || '7d' };
  return jwt.sign(payload, secret, signOpts);
};

module.exports = {
  verifyGoogleIdToken,
  generateJwt,
};
