import AuditLog from "../models/AuditLog.js";

/**
 * Simple audit logger
 */
export const logAction = async ({
  actor,
  action,
  entity,
  entityId = null,
  before = null,
  after = null,
  ip = null,
}) => {
  try {
    await AuditLog.create({
      actor,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      before,
      after,
      ip,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};
