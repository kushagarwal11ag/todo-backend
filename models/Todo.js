const mongoose = require("mongoose");
const { Schema } = mongoose;

const TodoSchema = new Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
	},
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
	},
	priority: {
		type: String,
		required: true,
	},
	completed: {
		type: Boolean,
		default: false,
		required: true,
	},
});

module.exports = mongoose.model("todos", TodoSchema);
