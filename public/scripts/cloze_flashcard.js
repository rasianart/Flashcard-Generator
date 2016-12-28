let fs = require('fs');
let mysql = require('mysql');

let connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Loonylupin87',
  database : 'Flashcards'
});

module.exports = class ClozeFlashcard {
	constructor() {
		this.text,
		this.cloze,
		this.clozeDeleted = (questionInput) => {
			let regExp = /\(([^)]+)\)/;
    		this.cloze = regExp.exec(questionInput);
    		this.cloze = this.cloze[0];
    		this.text = questionInput.replace(this.cloze, '...');
		}
		this.save = (callback) => {
			//saves to mysql database
			connection.query('INSERT INTO cloze SET ?', {text: this.text, cloze : this.cloze}, (err, rows, fields) => {
			  if (err) throw err;
			  console.log('Succesfully Inserted Into Database');
			  callback && callback();
			});
			// saves locally to text file
			fs.appendFile('cloze_flashcards.txt', JSON.stringify(this), (error, data) => {
				console.log("Succesfully added to local txt file!");
			});
		},
		this.fetchQuestion = (callback) => {
			//fetches random question
			connection.query('SELECT * FROM cloze ORDER BY RAND() LIMIT 1', (err, rows, fields) => {
			  if (err) throw err;
			  let dataArr = [];
			  dataArr.push(rows[0].text);
			  dataArr.push(rows[0].cloze);
			  callback && callback(dataArr);
			});
		},
		this.searchDatabase = (query, callback) => {
			connection.query('SELECT * FROM cloze WHERE text LIKE ? OR cloze LIKE ?', ['%' + query + '%', '%' + query + '%'], (err, rows, fields) => {
			  if (err) throw err;
			  let dataArr = [];
			  for(let i = 0; i < rows.length; i++){
			  	let dataObj = {
			  		text: rows[i].text,
			  		cloze: rows[i].cloze
			  	};
			  	dataArr.push(dataObj);
			  }
			  callback && callback(dataArr);
			});
		}
	}
}



