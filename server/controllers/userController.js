const userModel = require('../models/userModel');

exports.getAll = (req, res) => {
  res.json(userModel.findAll());
};

exports.getById = (req, res) => {
  const user = userModel.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

exports.create = (req, res) => {
  const created = userModel.create(req.body);
  res.status(201).json(created);
};

exports.update = (req, res) => {
  const updated = userModel.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
};

exports.remove = (req, res) => {
  const ok = userModel.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'User not found' });
  res.status(204).end();
};
