const mongoose = require("mongoose");
const mongoURI =
	"mongodb+srv://kushal:SclxUO8MsW7nDqeX@mongodb.jknommf.mongodb.net/Todo?retryWrites=true&w=majority";

const connectToMongo = async () => {
	try {
		await mongoose.connect(mongoURI);
		console.log("Connected to MongoDB successfully");
	} catch (error) {
		console.error("Error connecting to MongoDB:", error.message);
	}
};

module.exports = connectToMongo;
