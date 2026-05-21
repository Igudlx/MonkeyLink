import { getProjectData, jsonResponse, unauthorized } from '../../../../../../lib';

export async function POST(req, { params }) {
  if (!authorized(req)) return unauthorized();
  const body = await req.json();
  const data = getProjectData(params.projectId);
  data.text = body.text || '';
  saveProjectData(params.projectId, data);
  return jsonResponse({ success: true });
}

function authorized(req) {
  return req.headers.get('authorization') === `Bearer ${process.env.MASTER_API_KEY}`;
}

function saveProjectData(projectId, data) {
  global.monkeyLinkStore = global.monkeyLinkStore || {};
  global.monkeyLinkStore[projectId] = data;
}
