import handler from './[action]';

export default function approveInstitutionHandler(req: any, res: any) {
  req.query = { ...req.query, action: 'approve-institution' };
  return handler(req, res);
}
