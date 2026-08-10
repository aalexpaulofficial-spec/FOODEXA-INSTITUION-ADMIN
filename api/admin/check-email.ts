import handler from './[action]';

export default function checkEmailHandler(req: any, res: any) {
  req.query = { ...req.query, action: 'check-email' };
  return handler(req, res);
}
