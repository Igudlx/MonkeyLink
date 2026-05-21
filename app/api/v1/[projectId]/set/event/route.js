
export const runtime = 'nodejs';
import { getProjectData, saveProjectData, jsonResponse, unauthorized, isAuthorized } from '../../../../../../lib';


export async function POST(req, context) {
  if (!isAuthorized(req)) return unauthorized();
  const { projectId } = await context.params;
  const body = await req.json();
  const data = getProjectData(projectId);
  data.event = JSON.stringify({
    name: body.name || '',
    time: String(body.time || '0')
  });
  saveProjectData(projectId, data);
  return jsonResponse({ success: true });
}
