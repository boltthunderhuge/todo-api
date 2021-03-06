var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
	var user = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function(value) {
				var salt = bcrypt.genSaltSync(10);
				var hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user, options) {
				// user.email
				if (typeof user.email === 'string') {
					user.email = user.email.toLowerCase();
				}
			}
		},
		classMethods: {
			authenticate: function(body) {
				return new Promise(function(resolve, reject) {
					if (typeof body.email !== 'string' || typeof body.password !== 'string') {
						return reject();
					}
					// Find by email, then check the password for correctness
					user.findOne({
						where: {
							email: body.email.toLowerCase()
						}
					}).then(function(user) {

						if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
							return reject();
						}

						return resolve(user);

					}, function(error) {
						return reject();
					});
				});
			},
			findByToken: function(token) {

				return new Promise(function(resolve, reject) {

					try{
						// First, decode the payload if valid
						var decodedJWT = jwt.verify(token, 'qwerty098');
						// Second, decrypt
						var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#');
						// third, get our object back from the stringified version (turning the string version of the decrypted token into a ut8 string)
						var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
						
						console.log(tokenData);

						user.findById(tokenData.id).then(function(user) {
							if (user) {
								resolve(user);
							} else {
								reject();
							}
						}, function() {
							reject();
						});
					} catch(error) {
						console.log(error);
						reject();
					}
				});
			}
		},
		instanceMethods: {
			toPublicJSON: function() {
				var json = this.toJSON();
				return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
			},
			generateToken: function(tokenType) {
				if (!_.isString(tokenType)) {
					return undefined;
				}
				try {
					var stringData = JSON.stringify({id: this.get('id'), type: tokenType});
					var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#');
					var token = jwt.sign({
						token: encryptedData.toString()
					}, 'qwerty098');

					return token;

				} catch(e) {
					return undefined;
				}
			}
		}
	});

	return user;
};