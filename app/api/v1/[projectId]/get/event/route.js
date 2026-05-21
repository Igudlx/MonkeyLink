import { getProjectData, jsonResponse, unauthorized } from '../../../../../../lib';

export async function GET(req, { params }) {
  if (!authorized(req)) return unauthorized();
  const data = getProjectData(params.projectId);
  const payload = data.event || '';
  data.event = '';
  saveProjectData(params.projectId, data);
  return jsonResponse({ success: true, type: 'event', payload });
}

function authorized(req) {
  return req.headers.get('authorization') === `Bearer ${process.env.MASTER_API_KEY}`;
}

function saveProjectData(projectId, data) {
  global.monkeyLinkStore = global.monkeyLinkStore || {};
  global.monkeyLinkStore[projectId] = data;
}
