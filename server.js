var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

app.get('/todos', function(req, res) {
	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			like: '%' + query.q + '%'
		};
	}

	if (query.hasOwnProperty('completed')) {
		if (query.completed === 'true') {
			where.completed = true;
		} else if (query.completed === 'false') {
			where.completed = false;
		}
	}

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		if (todos) {
			res.json(todos);
		} else {
			res.sendStatus(404);
		}
	}, function(error) {
		res.status(500).json(error);
	});
});

app.get('/todos/:id', function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	db.todo.findById(todoID).then(function(todo) {
		if (!!todo) {
			res.status(200).json(todo.toJSON());
		} else {
			res.sendStatus(404);
		}
	}, function(error) {
		res.status(500).json(error);
	});
});


app.post('/todos', function(req, res) {
	// Pare the object down to the keys we want
	var body = _.pick(req.body, 'description', 'completed');

	// Validation now performed by db?
	db.todo.create({
		description: body.description,
		completed: body.completed
	}).
	then(function(todo) {
		res.json(todo.toJSON());
	}, function(error) {
		res.status(400).json(error);
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoID
		}
	}).then(function(numDestroyedRows) {
		console.log('Destroyed ' + numDestroyedRows + ' rows');
		if (numDestroyedRows === 0) {
			res.status(404).json({
				error: 'No todo with id ' + todoID
			});
		} else {
			res.status(204).send();
		}
	}, function(error) {
		res.sendStatus(500);
	}).catch(function(error) {
		res.status(500).json(error);
	});
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


db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log("Express listening on PORT : " + PORT);
	});
});