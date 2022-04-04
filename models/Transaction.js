const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
	date: {
		type: Date,
		default: Date.now
	},
	name:{
		type: String,
		required : true
	},
	vno:{
		type: String,
		required: true
	},
	vtype:{
		type: String,
		required: true
	},
	success:{
		type: Boolean,
		required: true
	}
});

const Transaction = mongoose.model('Transaction',TransactionSchema);

module.exports = Transaction;