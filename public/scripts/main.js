const request = require('request');
const inquirer = require('inquirer');
const ClozeFlashcard = require('./cloze_flashcard.js');
const BasicFlashcard = require('./basic_flashcard.js');
const chalk = require('chalk');

const basic = new BasicFlashcard();
const cloze = new ClozeFlashcard();

let cardMethod = '';

console.log('Welcome to Flashcard Manager.');
const run = () => {
	requestQuestion();
    inquirer.prompt({
        type: "list",
        name: "method",
        message: "Would you like to create a flashcard, read a flashcard from the database, or read a random flashcard from the internet?",
        choices: ['Create', 'Read', 'Random']
    }).then((ans) => {
        if (ans.method === 'Create') {
        	cardMethod = 'Create';
        	createCard();
        } else if (ans.method === 'Read') {
        	cardMethod = 'Read';
        	chooseType();
        } else {
        	cardMethod = 'Random';
            readQuestion('random');
        }
    });
}

const requestQuestion = () => {
    request('http://jservice.io/api/random', (error, response, body) => {
        const data = JSON.parse(body);
        basic.front = data[0].question;
        basic.back = data[0].answer;
    })
}

const createCard = () => {
    inquirer.prompt({
        type: "list",
        name: "createType",
        message: "Would you like to create a basic flashcard or a cloze-deleted flashcard?",
        choices: ['Basic', 'Cloze-deleted']	
    }).then((creation) => {
        creation.createType === 'Basic' ? inputFlashcard('basic') : inputFlashcard('cloze');
    });
}

const inputFlashcard = (type) => {
	let message;
	type === 'basic' ? message = 'Please type the question portion of your flashcard.' : 
					   message = 'Please enter your cloze flashcard. Be sure the the cloze portion of your question is encapsulated by (   )';
	inquirer.prompt({
		type: 'input',
        name: 'input',
        message: message
    }).then((question) => {
    	if (type === "basic") {
    		basic.front = question.input;
	    	inquirer.prompt({
				type: 'input',
		        name: 'inputAnswer',
		        message: 'Please type the answer portion of your flashcard.'
		    }).then((answer) => {
	    		basic.back = answer.inputAnswer;
	    		save('Basic');
		    });
    	} else {
    		cloze.clozeDeleted(question.input);
    		save('Cloze');
    	}
	})
}

const chooseType = () => {
    inquirer.prompt([{
        type: "list",
        name: "cardtype",
        message: "Would you like a basic question or a cloze-deleted question?",
        choices: ['Basic', 'Cloze-deleted']	
    },{
    	type: "list",
        name: "search",
        message: "Would you like to search the database or choose a random question?",
        choices: ['Search', 'Random']
    }]).then((user) => {
    	let importData = [];
        if (user.cardtype === 'Basic' && user.search === 'Random') {
        	const importBasicArr = () => {
        		basic.front = importData[0];
        		basic.back = importData[1];
        		readQuestion('basic');
        	}
            basic.fetchQuestion((exportData) => {
            	importData = exportData;
            	importBasicArr();
            });
        } else if (user.cardtype === 'Basic' && user.search === 'Search') {
        	searchOrRandom('basic');
        } else if (user.cardtype === 'Cloze-deleted' && user.search === 'Random') {
        	const importClozeArr = () => {
        		cloze.text = importData[0];
        		cloze.cloze = importData[1];
        		readQuestion('cloze');
        	}
        	cloze.fetchQuestion((exportData) => {
        		importData = exportData;
        		importClozeArr();
        	});
        } else if (user.cardtype === 'Cloze-deleted' && user.search === 'Search') {
        	searchOrRandom('cloze');
        }
    });
}

const searchOrRandom = (type) => {
	inquirer.prompt({
        type: "input",
        name: "query",
        message: "Please enter your search term"	
    }).then((search) => {
    	eval(type).searchDatabase(search.query, results = (exportData) => {
    		let resultArr = [];
    		if (type === 'cloze') {
	    		for (let i = 0; i < exportData.length; i++) {
	    			resultArr.push(exportData[i].text);
	    		}
    		} else {
    			for (let i = 0; i < exportData.length; i++) {
	    			resultArr.push(exportData[i].front);
	    		}
    		}
    		if (resultArr.length !==0) {
			    inquirer.prompt([{
			        type: "list",
			        name: "results",
			        message: "Here are all the results that matched your search. Select one to read.",
			        choices: resultArr	
			    }]).then((result) => {
			    	let index = resultArr.indexOf(result.results);
			    	if (type === 'basic') {
			    		basic.front = exportData[index].front;
			    		basic.back = exportData[index].back;
			    		readQuestion('basic');
			    	} else {
			    		cloze.text = exportData[index].text;
			    		cloze.cloze = exportData[index].cloze;
			    		readQuestion('cloze'); 
			    	}
			   	});
			} else {
				console.log('Your search matched no flashcards.');
				inquirer.prompt({
			        type: 'confirm',
			        name: 'search',
			        message: 'Search again?'
			    }).then((results) => {
			    	if(results.search) {
			    		searchOrRandom(type);
			    	} else {
			    		console.log('OK, goodbye.');
			    		process.exit();
			    	}
			    });
			}
		});
    });
}

const readQuestion = (type) => {
	const eitherFront = () => {
		if(type === 'basic' || type === 'random') {
			return chalk.cyan(basic.front); 
		} else {
			return chalk.cyan(cloze.text);
		}
	}
	const eitherBack = () => {
		if(type === 'basic' || type === 'random') {
			return chalk.cyan(basic.back); 
		} else {
			return chalk.cyan(cloze.text.replace('...', '"' + cloze.cloze + '"'));
		}
	}
    inquirer.prompt({
        type: 'input',
        name: 'answer',
        message: 'You chose ' + type + '.  Please enter an answer to the question.  If you do not know, press enter. ' + eitherFront()
    }).then((choice) => {
    	cloze.cloze && (cloze.cloze = cloze.cloze.toLowerCase().replace(/\(|\)/g, ''));
        if (choice.answer.toLowerCase() === basic.back.toLowerCase() || choice.answer.toLowerCase() === cloze.cloze) {
            console.log("You answered correctly!");
            cardMethod === 'Random' ? save('Basic') : playAgain(); 
        } else {
            console.log("You answered incorrectly. The correct answer is " + eitherBack());
            cardMethod === 'Random' ? save('Basic') : playAgain();         
        }
    });
}

const save = (type) => {
    inquirer.prompt({
        type: 'confirm',
        name: 'save',
        message: 'Would you like to save this flashcard to the database and to a local storage?'
    }).then((save) => {
        if (save.save) {
        	type === 'Basic' ? basic.save(playAgain) : cloze.save(playAgain); 
        } else {
            console.log("That's OK.");
            playAgain();
        }
    });
}

const playAgain = () => {
    inquirer.prompt({
        type: 'confirm',
        name: 'again',
        message: 'Do you want more?'
    }).then((input) => {
    	if(input.again){
    		run();
    	} else{
    		console.log('OK, goodbye.');
    		process.exit();
    	}
    });
}

run();



