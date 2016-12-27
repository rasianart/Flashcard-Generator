let fs = require('fs');
let mysql = require('mysql');

let connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Loonylupin87',
  database : 'Flashcards'
});

module.exports = class BasicFlashcard {
	constructor() {
		this.front,
		this.back,
		this.save = (callback) => {
			//saves to mysql database
			connection.query('INSERT INTO basic SET ?', {front: this.front, back : this.back}, (err, rows, fields) => {
			  if (err) throw err;
			  console.log('Succesfully Inserted Into Database');
			  callback && callback();
			});
			// saves locally to text file
			fs.appendFile('basic_flashcards.txt', JSON.stringify(this), (error, data) => {
				console.log("Succesfully added to local txt file!");
			});
		},
		this.fetchQuestion = (callback) => {
			//fetches random question
			connection.query('SELECT * FROM basic ORDER BY RAND() LIMIT 1', (err, rows, fields) => {
			  if (err) throw err;
			  let dataArr = [];
			  dataArr.push(rows[0].front);
			  dataArr.push(rows[0].back);
			  callback && callback(dataArr);
			});
		}
	};
}


