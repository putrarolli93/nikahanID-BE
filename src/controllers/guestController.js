const GuestModel = require('../models/GuestModel');
const InvitationModel = require('../models/InvitationModel');

exports.getGuests = async (req, res, next) => {
  try {
    const { id: weddingId } = req.params;

    // Verify ownership
    const invitation = await InvitationModel.getById(weddingId);
    if (!invitation || invitation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this invitation' });
    }

    const guests = await GuestModel.getByWeddingId(weddingId);
    res.status(200).json({ success: true, data: guests, custom_wa_msg: invitation.custom_wa_msg });
  } catch (error) {
    next(error);
  }
};

exports.addGuest = async (req, res, next) => {
  try {
    const { id: weddingId } = req.params;
    const { name, phone_number } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama tamu harus diisi' });
    }

    // Verify ownership
    const invitation = await InvitationModel.getById(weddingId);
    if (!invitation || invitation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const insertId = await GuestModel.addGuest(weddingId, { name, phone_number });
    res.status(201).json({ success: true, message: 'Tamu ditambahkan', data: { id: insertId, name, phone_number, is_sent: 0 } });
  } catch (error) {
    next(error);
  }
};

exports.markAsSent = async (req, res, next) => {
  try {
    const { id: weddingId, guestId } = req.params;

    // Verify ownership
    const invitation = await InvitationModel.getById(weddingId);
    if (!invitation || invitation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await GuestModel.markAsSent(guestId, weddingId);
    if (updated) {
      res.status(200).json({ success: true, message: 'Status diubah jadi terkirim' });
    } else {
      res.status(404).json({ success: false, message: 'Tamu tidak ditemukan' });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteGuest = async (req, res, next) => {
  try {
    const { id: weddingId, guestId } = req.params;

    // Verify ownership
    const invitation = await InvitationModel.getById(weddingId);
    if (!invitation || invitation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const deleted = await GuestModel.deleteGuest(guestId, weddingId);
    if (deleted) {
      res.status(200).json({ success: true, message: 'Tamu dihapus' });
    } else {
      res.status(404).json({ success: false, message: 'Tamu tidak ditemukan' });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateMessage = async (req, res, next) => {
  try {
    const { id: weddingId } = req.params;
    const { custom_wa_msg } = req.body;

    // Verify ownership
    const invitation = await InvitationModel.getById(weddingId);
    if (!invitation || invitation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await GuestModel.updateCustomMessage(weddingId, custom_wa_msg);
    res.status(200).json({ success: true, message: 'Template pesan WA disimpan' });
  } catch (error) {
    next(error);
  }
};
