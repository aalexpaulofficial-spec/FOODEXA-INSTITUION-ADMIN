import handler from './_handler.js';

export default function approveInstitutionHandler(req: any, res: any) {
  return handler(req, res, 'approve-institution');
}
