export function getProjectData(projectId) {
  global.monkeyLinkStore = global.monkeyLinkStore || {};
  if (!global.monkeyLinkStore[projectId]) {
    global.monkeyLinkStore[projectId] = {
      event: '',
      text: ''
    };
  }
  return global.monkeyLinkStore[projectId];
}

export function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}

export function unauthorized() {
  return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
}
