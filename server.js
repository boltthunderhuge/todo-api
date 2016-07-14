var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;

var todos = [{
	id: 1,
	description: 'Meet Mumsie for lunch',
	completed: false
},
{
	id: 2,
	description: 'go to market',
	completed: false
},
{
	id: 3,
	description: 'do this task',
	completed: true
}];

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

app.listen(PORT, function() {
	console.log("Express listening on PORT : " + PORT);
});