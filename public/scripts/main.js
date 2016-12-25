let request = require('request');
let inquirer = require('inquirer');
let ClozeFlashcard = require('./cloze_flashcard.js');
let BasicFlashcard = require('./basic_flashcard.js');
let chalk = require('chalk');

let basic = new BasicFlashcard();
let cloze = new ClozeFlashcard();

let cardMethod = '';

let run = () => {
	requestQuestion();
    inquirer.prompt({
        type: "list",
        name: "method",
        message: "Would you like to create a flashcard or read a flashcard from database, or read a random flashcard from the internet?",
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
            readQuestion('random');
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
	inquirer.prompt({
		type: 'input',
        name: 'input',
        message: 'Please type the question portion of your flashcard.'
    }).then(function(question) {
    	if (type === "basic") {
    		basic.front = question.input;
    	} else {
    		cloze.text = question.input;
    	}
    	inquirer.prompt({
			type: 'input',
	        name: 'inputAnswer',
	        message: 'Please type the answer portion of your flashcard.'
	    }).then(function(answer) {
	    	if (type === "basic") {
	    		basic.back = answer.inputAnswer;
	    		save('Basic');
	    	} else {
	    		cloze.cloze = answer.inputAnswer;
	    		save('Cloze');
	    	}
	    });
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
            basic.fetchQuestion();
            readQuestion('basic');
        } else {
        	cloze.fetchQuestion();
            readQuestion('cloze');
        }
    });
}

let readQuestion = (type) => {
	// console.log(cloze.text);
	// console.log(basic.front);
	// let cardFront;
	// let cardBack;
	// if(type === 'cloze'){
	// 	cardFront = cloze.text;
	// 	cardBack = cloze.cloze;
	// } else {
	// 	cardFront = basic.front;
	// 	cardBack = basic.back;
	// }
    inquirer.prompt({
        type: 'input',
        name: 'answer',
        message: 'You chose ' + type + '.  Please enter an answer to the question.  If you do not know, say "IDK". ' + chalk.cyan(basic.front)
    }).then(function(choice) {
        if (choice.answer.toLowerCase() === basic.back.toLowerCase() || choice.answer.toLowerCase() === cloze.cloze.toLowerCase()) {
            console.log("You answered correctly!");
            if (cardMethod === 'Random') {
            	save('Basic');
            } else {
            	playAgain();
            } 
        } else {
            console.log("You answered incorrectly. The correct answer is " + basic.back);
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
        message: 'Would you like to save this flashcard?'
    }).then(function(save) {
        if (save.save) {
        	if(type === 'Basic'){
        		basic.save();
        		wait = setTimeout(playAgain, 100);
        	} else {
        		cloze.save();
        		wait = setTimeout(playAgain, 100);
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
    		process.exit();
    	}
    });
}

run();
