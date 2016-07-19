var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
	'dialect': 'sqlite',
	'storage': __dirname + '/basic-sqlite-database.sqlite'
});

var Todo = sequelize.define('todo', {
	description: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			len: [1, 250]
		}
	},
	completed: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
});

sequelize.sync({

}).then(function() {
	console.log('Everything is synced');

	Todo.findOne({
		where: {
			id: 3
		}
	}).then(function(todo) {
		console.log('shit destroyed');
	}).catch(function(error) {
		console.log("Problem: " + error);
	});
	
	/*Todo.create({
		description: 'Take out sproog'
	}).then(function(todo) {
		return Todo.create({
			description: 'Clean frog'
		});
	}).then(function() {
		return Todo.findAll({
			where: {
				description: {
					$like: '%rog%'
				}
			}
		});
	}).then(function(todos) {
		if (todos) {
			todos.forEach(function(todo) {
				console.log(todo.toJSON());
			});
		} else {
			console.log("no matching todos found");
		}
	}).catch(function(error) {
		console.log(error);
	});*/
});