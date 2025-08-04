import express from 'express';

const router = express.Router();

// GET /api/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create a new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const user = await User.update({ name, email }, { where: { id } });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user' });
  }
});

export default router; 