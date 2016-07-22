var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;
	var where = {
		userId: req.user.id
	};


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

app.get('/todos/:id',  middleware.requireAuthentication, function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	db.todo.findOne({where: {id:todoID, userId:req.user.id}}).then(function(todo) {
		if (!!todo) {
			res.status(200).json(todo.toJSON());
		} else {
			res.sendStatus(404);
		}
	}, function(error) {
		res.status(500).json(error);
	});
});


app.post('/todos',  middleware.requireAuthentication, function(req, res) {
	// Pare the object down to the keys we want
	var body = _.pick(req.body, 'description', 'completed');

	// Validation now performed by db?
	db.todo.create(body).then(function(todo) {
		req.user.addTodo(todo).then(function() {
			return todo.reload(); // todo has been changed because of the added association - need to refresh
		}).then(function(todo) {
			res.json(todo.toJSON());
		});
	}, function(error) {
		res.status(400).json(error);
	});
});

// DELETE /todos/:id
app.delete('/todos/:id',  middleware.requireAuthentication, function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoID,
			userId: req.user.id
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
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	// Make sure the todo in the request has only the fields we want.
	var todoID = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findOne({where: {id: todoID, userId: req.user.id}}).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(error) {
				res.status(400).json(error);
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	});
});

app.post('/users', function(req, res) {
	// remove bullshit properties
	var body = _.pick(req.body, 'email', 'password');

	db.user.create({
		email: body.email,
		password: body.password
	}).then(function(user) {
		res.json(user.toPublicJSON());
	}, function(error) {
		res.status(400).json(error);
	});
});


app.post('/users/login', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.authenticate(body).then(function(user) {
		var token = user.generateToken('authentication');
		if (token) {
			res.header('Auth', token).json(user.toPublicJSON());
		} else {
			res.status(401).send();
		}

	}, function(error) {
		res.status(401).send();
	});
});

db.sequelize.sync( 
	//{force: true} 
	).then(function() {
	app.listen(PORT, function() {
		console.log("Express listening on PORT : " + PORT);
	});
});