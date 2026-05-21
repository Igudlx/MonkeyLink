export function getProjectData(projectId) {
  global.monkeyLinkStore ||= {};
  global.monkeyLinkStore[projectId] ||= { event: '', text: '' };
  return global.monkeyLinkStore[projectId];
}

export function saveProjectData(projectId, data) {
  global.monkeyLinkStore ||= {};
  global.monkeyLinkStore[projectId] = data;
}

export function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}

export function unauthorized() {
  return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
}

export function isAuthorized(req) {
  return req.headers.get('authorization') === `Bearer ${process.env.MASTER_API_KEY}`;
}
