import handler from './_handler';

export default function approveInstitutionHandler(req: any, res: any) {
  return handler(req, res, 'approve-institution');
}

