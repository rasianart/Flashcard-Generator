let mysql = require('mysql');

let connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Loonylupin87',
  database : 'thingy'
});

connection.connect();

var sql = 'INSERT INTO thingyTable (solution) VALUES ("Sarah")';
connection.query(sql, function(err, rows, fields) {
  if (err) throw err;
  // console.log('The solution is: ', rows[0].solution);
  // console.log('The solution is: ', rows[2].solution);
  console.log('Succesfully Inserted Into Database');
});

connection.query('SELECT * FROM `thingyTable`', function(err, rows, fields) {
  if (err) throw err;
 
  for (var i = 0; i < 3; i++) {
  	console.log('The solution is: ', rows[i].solution);
  } 
});

connection.end();