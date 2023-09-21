const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");

const JWT_SECRET = "#master@kushal";

//Route 1: Create user using POST. "/api/auth/createuser" creates user, no login required.
router.post(
	"/createuser",
	[
		body("name", "Enter a valid name").isLength({ min: 3 }),
		body("email", "Enter a valid email").isEmail(),
		body("password", "Password must be atleast 5 characters").isLength({
			min: 5,
		}),
	],
	async (req, res) => {
		let success = false;
		//if errors exist, return bad request along with errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success, errors: errors.array() });
		}
		try {
			//check whether user with this email exists already
			let user = await User.findOne({ email: req.body.email });
			if (user) {
				return res
					.status(400)
					.json({ success, error: "Email already in use" });
			}
			//creating a salt using bcryptjs package
			const salt = await bcrypt.genSalt(10);
			//hashing and adding salt to password for added security using bcryptjs
			const secPass = await bcrypt.hash(req.body.password, salt);

			//create a new user
			user = await User.create({
				name: req.body.name,
				email: req.body.email,
				password: secPass,
			});

			//token using jsonwebtoken
			const data = {
				user: {
					id: user.id,
				},
			};
			const authToken = jwt.sign(data, JWT_SECRET);
			success = true;
			//send authToken as response
			res.json({ success, authToken });
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Internal Server Error");
		}
	}
);

//Route 2: Authenticating user using POST. "/api/auth/login" no login required.
router.post(
	"/login",
	[
		body("email", "Enter a valid email").isEmail(),
		body("password", "Password cannot be blank").exists(),
	],
	async (req, res) => {
		//if errors exist, return bad request along with errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		let success = false;
		//destructuring email and password
		const { email, password } = req.body;
		try {
			let user = await User.findOne({ email });
			if (!user) {
				//if user does not exist with the name entered
				return res
					.status(400)
					.json({ success, error: "Enter correct credentials" });
			}

			const passwordCompare = await bcrypt.compare(
				password,
				user.password
			);
			if (!passwordCompare) {
				return res
					.status(400)
					.json({ success, error: "Enter correct credentials" });
			}

			const data = {
				user: {
					id: user.id,
				},
			};
			const authToken = jwt.sign(data, JWT_SECRET);
			success = true;
			res.json({ success, authToken });
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Internal Server Error");
		}
	}
);

//Route 3: Get logged in user details using POST. "/api/auth/getuser" login required.
router.post("/getuser", fetchuser, async (req, res) => {
	try {
		const userId = req.user.id;
		const user = await User.findById(userId).select("-password");
		res.send(user);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Internal Server Error");
	}
});

// ROUTE 4: Update an existing user using: POST "/api/auth/updateuser". Login required
router.post("/updateuser/:id", fetchuser, async (req, res) => {
	try {
		let success = false;
		//Find if user exists
		let editUser = await User.findById(req.params.id);
		if (!editUser) {
			return res.status(404).send("Not Found");
		}
		// Create a newUser object
		const newUser = {};
		if (req.body.name) {
			newUser.name = req.body.name;
		}
		if (req.body.image !== "") {
			newUser.image = req.body.image;
		}
		if (req.body.password) {
			if (req.body.password !== "") {
				const salt = await bcrypt.genSalt(10);
				const secPass = await bcrypt.hash(req.body.password, salt);
				newUser.password = secPass;
			}
		}

		// Update user
		if (editUser._id.toString() !== req.user.id) {
			return res.status(401).send("Not Allowed");
		}
		editUser = await User.findByIdAndUpdate(
			req.params.id,
			{ $set: newUser },
			{ new: true }
		);
		success = true;
		res.json({ success, editUser });
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Internal Server Error");
	}
});

module.exports = router;
