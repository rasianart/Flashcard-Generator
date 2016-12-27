let request = require('request');
let inquirer = require('inquirer');
let ClozeFlashcard = require('./cloze_flashcard.js');
let BasicFlashcard = require('./basic_flashcard.js');
let chalk = require('chalk');

let basic = new BasicFlashcard();
let cloze = new ClozeFlashcard();

let cardMethod = '';
let importData = [];

let run = () => {
	requestQuestion();
    inquirer.prompt({
        type: "list",
        name: "method",
        message: "Would you like to create a flashcard, read a flashcard from the database, or read a random flashcard from the internet?",
        choices: ['Create', 'Read', 'Random']
    }).then(function(ans) {
        if (ans.method === 'Create') {
        	cardMethod = 'Create';
        	createCard();
        } else if (ans.method === 'Read') {
        	cardMethod = 'Read';
        	chooseType();
        } else {
        	cardMethod = 'Random';
            readQuestion('basic');
        }
    });
}

let requestQuestion = () => {
    request('http://jservice.io/api/random', (error, response, body) => {
        let data = JSON.parse(body);
        basic.front = data[0].question;
        basic.back = data[0].answer;
        cloze.text = data[0].question;
        cloze.cloze = data[0].answer;
    })
}

let createCard = () => {
    inquirer.prompt({
        type: "list",
        name: "createType",
        message: "Would you like to create a basic flashcard or a cloze-deleted flashcard?",
        choices: ['Basic', 'Cloze-deleted']	
    }).then(function(creation) {
        if (creation.createType === 'Basic') {
        	inputFlashcard('basic');
        } else {
            inputFlashcard('cloze')
        }
    });
}

let inputFlashcard = (type) => {
	let message;
	if (type === 'basic') {
		message = 'Please type the question portion of your flashcard.';
	} else {
		message = 'Please enter your cloze flashcard. Be sure the the cloze portion of your question is encapsulated by (   )';
	}
	inquirer.prompt({
		type: 'input',
        name: 'input',
        message: message
    }).then(function(question) {
    	if (type === "basic") {
    		basic.front = question.input;
	    	inquirer.prompt({
				type: 'input',
		        name: 'inputAnswer',
		        message: 'Please type the answer portion of your flashcard.'
		    }).then(function(answer) {
	    		basic.back = answer.inputAnswer;
	    		save('Basic');
		    });
    	} else {
    		cloze.clozeDeleted(question.input);
    		save('Cloze');
    	}
	})
}

let chooseType = () => {
    inquirer.prompt({
        type: "list",
        name: "cardtype",
        message: "Would you like a basic question or a cloze-deleted question?",
        choices: ['Basic', 'Cloze-deleted']	
    }).then(function(user) {
        if (user.cardtype === 'Basic') {
        	let importBasicArr = () => {
        		basic.front = importData[0];
        		basic.back = importData[1];
        		readQuestion('basic');
        	}
            basic.fetchQuestion(function(exportData) {
            	importData = exportData;
            	importBasicArr();
            });
        } else {
        	let importClozeArr = () => {
        		cloze.text = importData[0];
        		cloze.cloze = importData[1];
        		readQuestion('cloze');
        	}
        	cloze.fetchQuestion(function(exportData) {
        		importData = exportData;
        		importClozeArr();
        	});
        }
    });
}

let readQuestion = (type) => {
	let eitherFront = () => {
		if(type === 'basic') {
			return chalk.cyan(basic.front); 
		} else {
			return chalk.cyan(cloze.text);
		}
	}
	let eitherBack = () => {
		if(type === 'basic') {
			return chalk.cyan(basic.back); 
		} else {
			return chalk.cyan(cloze.text.replace('...', cloze.cloze));
		}
	}
    inquirer.prompt({
        type: 'input',
        name: 'answer',
        message: 'You chose ' + type + '.  Please enter an answer to the question.  If you do not know, press enter. ' + eitherFront()
    }).then(function(choice) {
        if (choice.answer.toLowerCase() === basic.back.toLowerCase() || choice.answer.toLowerCase() === cloze.cloze.toLowerCase()) {
            console.log("You answered correctly!");
            if (cardMethod === 'Random') {
            	save('Basic');
            } else {
            	playAgain();
            } 
        } else {
            console.log("You answered incorrectly. The correct answer is " + eitherBack());
            if (cardMethod === 'Random') {
            	save('Basic');
            } else {
            	playAgain();
            }          
        }
    });
}

let save = (type) => {
    inquirer.prompt({
        type: 'confirm',
        name: 'save',
        message: 'Would you like to save this flashcard to the database and to a local storage?'
    }).then(function(save) {
        if (save.save) {
        	if(type === 'Basic'){
        		basic.save(playAgain);
        	} else {
        		cloze.save(playAgain);
        	}   
        } else {
            console.log("That's OK.");
            playAgain();
        }
    });
}

let playAgain = () => {
    inquirer.prompt({
        type: 'confirm',
        name: 'again',
        message: 'Do you want more?'
    }).then(function(input) {
    	if(input.again){
    		run();
    	} else{
    		console.log('OK, goodbye.');
    		process.exit();
    	}
    });
}

run();



