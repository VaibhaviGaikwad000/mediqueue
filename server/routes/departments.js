const router = require('express').Router();
const { Department, Doctor } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, fail, requireFields } = require('../utils/http');
router.get('/', asyncHandler(async (req, res) => res.json(await Department.find().sort({ name: 1 }))));
router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => { requireFields(req.body, ['name']); const name = String(req.body.name).trim(); if (name.length < 2 || name.length > 80) throw fail('Department name must be 2 to 80 characters'); res.status(201).json(await Department.create({ name, description: String(req.body.description || '').trim() })); }));
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => { requireFields(req.body, ['name']); const result = await Department.findByIdAndUpdate(req.params.id, { name: String(req.body.name).trim(), description: String(req.body.description || '').trim() }, { new: true, runValidators: true }); if (!result) throw fail('Department not found', 404); res.json(result); }));
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => { if (await Doctor.exists({ departmentId: req.params.id })) throw fail('Remove or reassign the department doctors first', 409); const result = await Department.findByIdAndDelete(req.params.id); if (!result) throw fail('Department not found', 404); res.json({ message: 'Department deleted' }); }));
module.exports = router;
