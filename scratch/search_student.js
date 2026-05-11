const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/students',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const students = JSON.parse(data);
    const target = students.find(s => s.displayId === 27 || s.id === 27);
    if (target) {
      console.log('Found Student:', JSON.stringify(target, null, 2));
    } else {
      console.log('Student with ID or DisplayID 27 not found in the list of 126 students.');
    }
  });
});

req.on('error', (error) => {
  console.error('Error fetching API:', error);
});

req.end();
