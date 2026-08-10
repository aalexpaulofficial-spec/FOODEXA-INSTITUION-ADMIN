import handler from './_handler.js';

export default function checkEmailHandler(req: any, res: any) {
  return handler(req, res, 'check-email');
}
  