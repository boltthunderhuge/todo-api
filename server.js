var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var bodyParser = require('body-parser');

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

app.get('/todos', function(req, res) {
	res.json(todos);
});

app.get('/todos/:id', function(req, res) {
	var todoID = req.params.id;

console.log("Trying to match " + todoID);
	for (var i=0; i<todos.length; ++i) {
		if (todos[i].id == todoID) {
			res.json(todos[i]);
			return;
		}
	}
	res.status(404).send('Fuck-up');
});

app.post('/todos', function(req, res) {
	var body = req.body;

	body.id = todoNextId++;
	var length = todos.push(body);
	
	console.log("There are now " + length + " todos");
	res.json(body);
});

app.listen(PORT, function() {
	console.log("Express listening on PORT : " + PORT);
});