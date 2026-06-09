const bcrypt = require('bcryptjs');

const passwords = {
  'admin123456': bcrypt.hashSync('admin123456', 10),
  'chengyanlove': bcrypt.hashSync('chengyanlove', 10)
};

console.log('Password hashes generated:');
console.log('admin123456:', passwords['admin123456']);
console.log('chengyanlove:', passwords['chengyanlove']);
