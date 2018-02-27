// Requires
const fs = require('fs');
const hbs = require('hbs');
const express = require('express');
const sha = require('sha256');
const validator = require('./utility/validator.js');
const users = require('./models/users.js');
const port = process.argv[2];
const bodyParser = require('body-parser');
const hostel = require('./models/hostels.js');
const htmlGenerator = require('./utility/htmlGenerator.js');

// Initial setup for node
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var app = express();
app.use(express.static(__dirname +'/public/'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname +'/views/partials/');

/* 
	Main Page will contain list of hostels and links for login
*/

app.get('/', (request, response) => {
	
	//Getting hostel list from database
	hostel.getHostelsList((error, result) => {
		if(error !== undefined) 
			console.log('Error in database');
		else {
			console.log(`${result.length} Hostels found in database`);
		
			/* 
				Below part is a sample how to send data to html page
				Grabbing all the hostel lists from database and then converting it to a
				viewable html table using the htmlGeneraor 
				(Will be replaced with other viewable object in html)
			*/
			
			var hostel = [];
			result.forEach((x) =>{
				hostel.push({hostelName: x.name, hostelId: x.hid});
			});
			response.render('index', { 
				hostel
			});

		}
	});

});

/*
	LoginPage is temperory but main feature would be to provid options
	for login....
	it could be the admin or mess members...
	Should we create different pages for different type of users..??
	what would be the options presented on the page..??
*/

app.get('/LoginPage', (request, response) => {
	response.render('LoginPage');
});

app.get('/Register',(request,response)=>{
	response.render('Register');
});

app.post('/RegisterUser',urlencodedParser,(request,response)=>{   //temporary user registration is 
	if(request.body.uid  === undefined){
		response.send('Please Give Currect Information');
		return;
	}
	var id = request.body.uid;
	var password = sha(request.body.password);
	var isAdmin = 0;
	var contact = request.body.contact;
	var hostel_id = request.body.hostel_id;
	var name = request.body.name;
	users.getUserById(id,(error,result)=>{
		if(error){
			console.log(error);
		}
		else if(result.id === undefined){
			users.createUser({
				id,
				password,
				isAdmin,
				contact,
				hostel_id,
				name
			},(error,result)=>{
				if(error)
					console.log(error);
				else{
					console.log('user added');
					response.send('user successfully registered');
				}
			});	
		}
		else{
			console.log('user Already exist');
			response.send('User ID is Already Exist');
		}

	});
});


/*
	Login Request must be send as a page named AdminPage request
	Varify and take action 
*/

app.post('/AdminPage', urlencodedParser, (request, response) => {
	var userID = request.body.id_text;
	var password = request.body.password_text;
	// validator.validUserID(userID, (error, result) => {
	// 	if(result !== true)
	// 		console.log(error);
	// });

	// validator.validPassword(password, (error, result) => {
	// 	if(result !== true)
	// 		console.log(error);
	// });

	//password = sha(password);
	password = sha(password);

	//Getting user from the database
	users.getUserById(userID, (error, result) => {
		if(error)	//If Error in Request
			console.log(error);
		else {
			if(userID !== result.id || password !== result.password) { //If User not found
				response.render('LoginPage');
				response.send('<h1 color=red>Unable to recognize user</h1>');
				console.log('Unable to recognize user');
			}
			else {		//If User is identified as a valid user
				response.render('LoginSuccess', {
					name: result.name,
					isAdmin: result.isAdmin,
					contact: result.contact,
					hostel_id: result.hostel_id
				});
			}
		}
	})
})


app.listen(port, () => {
	console.log(`Server is listenning on port: ${port}`);
});