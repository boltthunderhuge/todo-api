var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var _ = require('underscore');

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

app.get('/todos', function(req, res) {
	var queryParams = req.query;
	var filteredTodos = todos;

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredTodos = _.filter(filteredTodos, function(todo) {
			return todo.description.toLowerCase().includes(queryParams.q.toLowerCase());
		});
	}

	if (queryParams.hasOwnProperty('completed')) {
		if (queryParams.completed === 'true') {
			filteredTodos = _.where(filteredTodos, {
				completed: true
			});
		} else if (queryParams.completed === 'false') {
			filteredTodos = _.where(filteredTodos, {
				completed: false
			});
		}
	}

	res.json(filteredTodos);
});

app.get('/todos/:id', function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	matchedTodo = _.findWhere(todos, {
		id: todoID
	});

	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send("fuck up");
	}
});

app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
		return res.status(400).send();
	}

	body.description = body.description.trim();

	body.id = todoNextId++;
	var length = todos.push(body);

	console.log("There are now " + length + " todos");
	res.json(body);
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	var matchedTodo = _.findWhere(todos, {
		id: todoID
	});

	if (matchedTodo) {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	} else {
		res.status(404).json({
			error: "no todo found with that id"
		});
	}
});

// PUT /todos/:id 
app.put('/todos/:id', function(req, res) {
	// Make sure the todo in the request has only the fields we want.
	var todoID = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};
	var matchedTodo = _.findWhere(todos, {
		id: todoID
	});

	if (!matchedTodo) {
		return res.status(404).send();
	}

	console.log("Here 1");

	console.log(body);

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		// bad things
		return res.status(400).send();
	}

	console.log("Here 2");
	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length >= 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		// bad
		return res.status(400).send();
	}

	console.log("Here 3");
	console.log(validAttributes);

	_.extend(matchedTodo, validAttributes);
	res.json(matchedTodo);
});

app.listen(PORT, function() {
	console.log("Express listening on PORT : " + PORT);
});