import Notification from '../models/Notification.js';

/** Create a notification for one user. Never throws into the request path. */
export async function notifyUser(userId, payload) {
  if (!userId) return null;
  try {
    return await Notification.create({
      user: userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'system',
      link: payload.link || null,
      meta: payload.meta || undefined,
    });
  } catch (err) {
    console.warn('[notify] failed:', err.message);
    return null;
  }
}

/** Create the same notification for every user holding one of the given roles. */
export async function notifyRoles(roles, payload, User) {
  try {
    const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
    if (!users.length) return null;
    return await Notification.insertMany(
      users.map((u) => ({
        user: u._id,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'system',
        link: payload.link || null,
        meta: payload.meta || undefined,
      }))
    );
  } catch (err) {
    console.warn('[notify] failed:', err.message);
    return null;
  }
}

export default notifyUser;
