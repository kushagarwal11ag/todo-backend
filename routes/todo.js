const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Todo = require("../models/Todo");
const { body, validationResult } = require("express-validator");

// ROUTE 1: Get All the todos using: GET "/api/todo/getuser". Login required
router.get("/fetchtodo", fetchuser, async (req, res) => {
	try {
		const todo = await Todo.find({ user: req.user.id });
		res.json(todo);
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Internal Server Error");
	}
});

// ROUTE 2: Add a new Todo using: POST "/api/todo/addtodo". Login required
router.post(
	"/addtodo",
	fetchuser,
	[body("title", "Enter a valid title").isLength({ min: 3 })],
	body("priority")
		.isIn(["high", "medium", "low"])
		.withMessage('Priority must be either "high", "medium", or "low"'),
	async (req, res) => {
		try {
			const { title, description, priority, completed } = req.body;
			let todoCheck = await Todo.findOne({ title });
			if (todoCheck) {
				//Prevent creation of todo if tile of todo already exists
				return res.status(400).json({ error: "Title already in use" });
			}
			// If there are errors, return Bad request and the errors
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}
			const todo = new Todo({
				title,
				description,
				priority,
				completed,
				user: req.user.id,
			});
			const savedTodo = await todo.save();
			res.json(savedTodo);
		} catch (error) {
			console.error(error.message);
			res.status(500).send("Internal Server Error");
		}
	}
);

// ROUTE 3: Update an existing Todo using: PUT "/api/todo/updatetodo". Login required
router.put("/updatetodo/:id", fetchuser, async (req, res) => {
	const { title, description, priority, completed = false } = req.body;
	try {
		// Create a newTodo object
		const newTodo = {};
		if (title) {
			newTodo.title = title;
		}
		if (description) {
			newTodo.description = description;
		}
		if (priority) {
			newTodo.priority = priority;
		}
		newTodo.completed = completed;

		// Find todo to be updated and update it
		let todo = await Todo.findById(req.params.id);
		if (!todo) {
			return res.status(404).send("Not Found");
		}

		if (todo.user.toString() !== req.user.id) {
			return res.status(401).send("Not Allowed");
		}

		todo = await Todo.findByIdAndUpdate(
			req.params.id,
			{ $set: newTodo },
			{ new: true }
		);
		res.json({ todo });
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Internal Server Error");
	}
});

// ROUTE 4: Delete an existing todo using: DELETE "/api/todo/deletetodo". Login required
router.delete("/deletetodo/:id", fetchuser, async (req, res) => {
	try {
		// Find todo to delete and delete it
		let todo = await Todo.findById(req.params.id);
		if (!todo) {
			return res.status(404).send("Not Found");
		}

		// Allow deletion only if user owns this Todo
		if (todo.user.toString() !== req.user.id) {
			return res.status(401).send("Not Allowed");
		}

		todo = await Todo.findByIdAndDelete(req.params.id);
		res.json({ Success: "Todo has been deleted", todo: todo });
	} catch (error) {
		console.error(error.message);
		res.status(500).send("Internal Server Error");
	}
});

module.exports = router;
