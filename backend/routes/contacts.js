const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Get all contacts for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const contacts = await Contact.find({ userId }).sort({ lastMessageAt: -1 });
    res.json({ success: true, data: contacts, count: contacts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new contact
router.post('/', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update contact
router.patch('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete contact
router.delete('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const contact = await Contact.findByIdAndDelete(contactId);

    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk upsert contacts (sync from app)
router.post('/bulk', async (req, res) => {
  try {
    const { contacts } = req.body;
    const operations = contacts.map(contact => ({
      updateOne: {
        filter: { userId: contact.userId, contactId: contact.contactId },
        update: { $set: contact },
        upsert: true
      }
    }));

    const result = await Contact.bulkWrite(operations);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
