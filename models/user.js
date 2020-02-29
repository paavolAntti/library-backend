/* eslint-disable no-undef */
const mongoonse = require('mongoose')

const schmema = new mongoonse.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		minlength:4
	},
	favoriteGenre: {
		type: String,
		required: true
	}
})


module.exports = mongoonse.model('User', schmema)