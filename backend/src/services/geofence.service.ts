import { Workplace, IWorkplace } from '../models/Workplace';
import { createError } from '../middleware/errorHandler';

/**
 * Look up a Workplace by its QR code token.
 * Throws a 400 error if the token is invalid/unknown.
 */
export async function lookupWorkplaceByQrToken(qrToken: string): Promise<IWorkplace> {
  const workplace = await Workplace.findOne({ qrCodeToken: qrToken });
  if (!workplace) {
    throw createError(400, 'INVALID_QR_TOKEN', 'QR code not recognised. Please scan the correct workplace QR code.');
  }
  return workplace;
}
